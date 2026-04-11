import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";
import { IMAGE_TYPES } from "../../../lib/character-constants";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const SORT_ORDER = {
  [IMAGE_TYPES.FRONT]:   0,
  [IMAGE_TYPES.CLOSEUP]: 1,
  [IMAGE_TYPES.LEFT]:    2,
  [IMAGE_TYPES.RIGHT]:   3,
  [IMAGE_TYPES.BACK]:    4,
};

const CLEAN_VIEWS = [
  { key: IMAGE_TYPES.FRONT },
  { key: IMAGE_TYPES.CLOSEUP },
  { key: IMAGE_TYPES.LEFT },
  { key: IMAGE_TYPES.RIGHT },
  { key: IMAGE_TYPES.BACK },
];

// ✅ FIXED: single model for ALL views — no per-view switching
const MODEL = "black-forest-labs/flux-1.1-pro-ultra";

const STORAGE_BUCKET = "character-refs";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── UTILS ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function nowMs() { return Date.now(); }

function normalizeReferenceImage(image) {
  if (!image || typeof image !== "string") return null;
  if (image.startsWith("data:image/")) return image;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return null;
}

function mapSizeToAspectRatio(size) {
  switch (size) {
    case "1024x1536": return "2:3";
    case "1536x1024": return "3:2";
    case "1024x1024": return "1:1";
    default:          return "1:1";
  }
}

function getExtensionFromContentType(contentType = "") {
  const t = String(contentType).toLowerCase();
  if (t.includes("png"))  return "png";
  if (t.includes("jpeg") || t.includes("jpg")) return "jpg";
  if (t.includes("webp")) return "webp";
  return "png";
}

function isReplicateRateLimitError(err) {
  const msg = String(err?.message || err || "").toLowerCase();
  return msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("429");
}

function isReplicateBillingError(err) {
  const msg = String(err?.message || err || "").toLowerCase();
  return msg.includes("insufficient credit") || msg.includes("payment required") || msg.includes("402");
}

function shouldStopPackEarly(err) {
  return isReplicateRateLimitError(err) || isReplicateBillingError(err);
}

async function runReplicateWithBackoff(fn, maxRetries = 1) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) await sleep(10000);
      return await fn();
    } catch (err) {
      lastError = err;
      if (isReplicateBillingError(err)) throw new Error("Replicate billing issue. Add credit, wait a few minutes, then retry.");
      if (!isReplicateRateLimitError(err) || attempt === maxRetries) throw err;
    }
  }
  throw lastError;
}

async function fileOutputToUrl(output) {
  if (!output) return null;
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    for (const item of output) { const u = await fileOutputToUrl(item); if (u) return u; }
    return null;
  }
  if (typeof output?.url === "function") { const u = await output.url(); return typeof u === "string" ? u : String(u || ""); }
  if (typeof output?.url === "string") return output.url;
  if (typeof output?.href === "string") return output.href;
  if (output?.output) return await fileOutputToUrl(output.output);
  const s = String(output || "").trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return null;
}

// ─── PROMPT BUILDERS ─────────────────────────────────────────────────────────

/**
 * ✅ FIXED: strict, simple identity lock — placed first in every prompt
 */
function buildIdentityLockBlock() {
  return [
    "IDENTITY LOCK — HIGHEST PRIORITY:",
    "This must be the SAME EXACT person as the reference image.",
    "Not similar. Not inspired by. EXACT identity.",
    "Do not change face structure under any condition.",
    "Do not reinterpret identity.",
    "Do not redesign the face.",
    "Do not beautify, glamorize, age-shift, ethnicity-shift, or stylize the face.",
    "Same skull structure, same eyes, same nose, same lips, same jawline as the reference.",
    "Same skin tone, same hairstyle, same hairline, same hair color as the reference.",
    "Same body proportions, same shoulder width, same neck as the reference.",
    "Identity must match the reference image with absolute precision.",
    "Any deviation from the reference person's identity is a failure.",
  ].join(" ");
}

/**
 * ✅ FIXED: per-view shot instruction — angle only, no identity logic repeated
 */
function buildShotBlock(viewType) {
  switch (viewType) {
    case IMAGE_TYPES.FRONT:
      return [
        "SHOT: Front-facing full body.",
        "Single person only.",
        "Subject faces directly toward camera.",
        "Standing straight, neutral pose, relaxed arms at sides.",
        "Full body visible head to toe.",
        "Centered composition.",
        "Face clearly visible.",
      ].join(" ");

    case IMAGE_TYPES.CLOSEUP:
      return [
        "SHOT: Tight close-up portrait, upper body only.",
        "Single person only.",
        "Subject faces directly toward camera.",
        "Face clearly visible and highly recognizable.",
        "Neutral expression.",
        "Centered composition.",
      ].join(" ");

    case IMAGE_TYPES.LEFT:
      return [
        "SHOT: Strict LEFT side profile, full body.",
        "Single person only.",
        "Subject must face LEFT. Nose points to the LEFT edge of the frame.",
        "Torso, hips, knees, and feet also face LEFT.",
        "Only the LEFT side of the face is visible.",
        "RIGHT side of the face must NOT be visible.",
        "True 90-degree left profile. No three-quarter angle. No front angle.",
        "Full body visible head to toe.",
        "Standing straight, neutral pose, relaxed arms.",
        "Centered composition.",
      ].join(" ");

    case IMAGE_TYPES.RIGHT:
      return [
        "SHOT: Strict RIGHT side profile, full body.",
        "Single person only.",
        "Subject must face RIGHT. Nose points to the RIGHT edge of the frame.",
        "Torso, hips, knees, and feet also face RIGHT.",
        "Only the RIGHT side of the face is visible.",
        "LEFT side of the face must NOT be visible.",
        "True 90-degree right profile. No three-quarter angle. No front angle.",
        "Do not mirror the left profile.",
        "Full body visible head to toe.",
        "Standing straight, neutral pose, relaxed arms.",
        "Centered composition.",
      ].join(" ");

    case IMAGE_TYPES.BACK:
      return [
        "SHOT: Full body BACK view.",
        "Single person only.",
        "Subject faces completely AWAY from camera.",
        "Back of head visible. NO face visible. NO side angle.",
        "Camera directly behind subject.",
        "Standing straight, neutral pose, relaxed arms.",
        "Full body visible head to toe.",
        "Centered composition.",
      ].join(" ");

    default:
      return "SHOT: Full body portrait. Single person. Centered composition.";
  }
}

/**
 * ✅ FIXED: outfit + background + skin realism lock
 */
function buildEnvironmentLockBlock() {
  return [
    "OUTFIT LOCK: Plain white t-shirt and plain black pants only.",
    "No logos, no graphics, no patterns, no colored shirt, no shorts.",
    "Ignore clothing from reference images — preserve identity only.",

    "BACKGROUND LOCK: Clean neutral studio background.",
    "Light grey or soft grey background only.",
    "No pure white, no dark, no colored background.",
    "Simple, flat, non-distracting backdrop.",

    "SKIN REALISM LOCK: Natural matte skin, realistic pores.",
    "No acne, no pimples, no blemishes, no skin spots.",
    "No plastic skin, no waxy skin, no airbrushed face.",
    "No beauty retouching, no skin smoothing filter.",
    "Photorealistic human skin only.",

    "HAIR CONTINUITY: Hairstyle, hair length, hair volume, hairline identical to reference.",
    "Do not lengthen, shorten, or reshape hair across views.",
  ].join(" ");
}

/**
 * ✅ FIXED: simple realism block
 */
function buildRealismBlock() {
  return [
    "Highly realistic human photography.",
    "Natural skin texture, realistic pores, realistic hair strands.",
    "Grounded natural lighting.",
    "No CGI look, no 3D render, no beauty-filtered face.",
  ].join(" ");
}

/**
 * ✅ FIXED: final prompt — 4 clean blocks only, no complex adaptive stacking
 */
function buildFinalPrompt(viewType, lockedTraitsBlock = "", dnaIdentityBlock = "") {
  return [
    buildIdentityLockBlock(),
    buildShotBlock(viewType),
    buildEnvironmentLockBlock(),
    lockedTraitsBlock,
    dnaIdentityBlock,
    buildRealismBlock(),
  ].filter(Boolean).join("\n\n");
}

/**
 * ✅ FIXED: strong negative prompt — includes identity drift terms
 */
function buildNegativePrompt(viewType) {
  const base = [
    // ✅ Identity drift prevention
    "different person",
    "identity drift",
    "different face",
    "altered face",
    "face mutation",
    "new identity",
    "identity mismatch",
    "wrong person",
    "similar person",
    "another person",
    "changed facial features",
    "redesigned face",

    // Skin quality
    "glossy skin", "shiny skin", "oily skin", "plastic skin", "waxy skin",
    "airbrushed skin", "over-smoothed skin", "beauty retouching", "beauty filter",
    "skin smoothing", "polished face", "cosmetic skin cleanup",
    "hyper smooth skin", "fake skin texture", "cg skin", "3d skin",
    "rendered face", "beauty ad face", "fashion editorial face",

    // Skin imperfections
    "acne", "pimples", "skin blemishes", "skin spots", "face spots",
    "facial acne", "breakouts",

    // Background
    "pure white background", "white studio background", "overexposed background",
    "dark background", "colored background",

    // Outfit
    "logo shirt", "graphic t-shirt", "printed shirt", "colored shirt",
    "sports jersey", "shorts", "patterned clothes",

    // Composition
    "multiple people", "two people", "duplicate person", "extra person",
    "split screen", "collage", "contact sheet",
  ];

  // View-specific direction locks
  const viewSpecific = (() => {
    switch (viewType) {
      case IMAGE_TYPES.LEFT:
        return [
          "facing right", "nose pointing right", "right profile",
          "mirrored right profile", "three-quarter face", "front-facing",
          "semi-front angle",
        ];
      case IMAGE_TYPES.RIGHT:
        return [
          "facing left", "nose pointing left", "left profile",
          "mirrored left profile", "three-quarter face", "front-facing",
          "semi-front angle",
        ];
      case IMAGE_TYPES.BACK:
        return ["visible face", "front view", "side view"];
      case IMAGE_TYPES.CLOSEUP:
        return ["full body", "glamour portrait", "beauty ad"];
      default:
        return [];
    }
  })();

  return [...base, ...viewSpecific].join(", ");
}

// ─── DB HELPERS ───────────────────────────────────────────────────────────────

function buildLockedTraitsBlock(lockedTraits = {}) {
  if (!lockedTraits || typeof lockedTraits !== "object") return "";
  return [
    lockedTraits.gender    ? `Gender: ${lockedTraits.gender}.`                          : null,
    lockedTraits.age || lockedTraits.ageRange ? `Age: ${lockedTraits.age || lockedTraits.ageRange}.` : null,
    lockedTraits.ethnicity ? `Ethnicity: ${lockedTraits.ethnicity}.`                   : null,
    lockedTraits.hair_style ? `Hair style: ${lockedTraits.hair_style}.`                : null,
    lockedTraits.hair_color ? `Hair color: ${lockedTraits.hair_color}.`                : null,
    lockedTraits.eye_color  ? `Eye color: ${lockedTraits.eye_color}.`                  : null,
    lockedTraits.build      ? `Body build: ${lockedTraits.build}.`                     : null,
  ].filter(Boolean).join(" ");
}

function buildDnaIdentityBlock(dnaProfile = {}) {
  if (!dnaProfile || typeof dnaProfile !== "object") return "";
  return [
    dnaProfile.identitySummary  ? `Identity: ${dnaProfile.identitySummary}.`          : null,
    dnaProfile.faceShape        ? `Face shape: ${dnaProfile.faceShape}.`               : null,
    dnaProfile.jawline          ? `Jawline: ${dnaProfile.jawline}.`                    : null,
    dnaProfile.noseProfile      ? `Nose: ${dnaProfile.noseProfile}.`                   : null,
    dnaProfile.eyeShape         ? `Eyes: ${dnaProfile.eyeShape}.`                      : null,
    dnaProfile.skinTone         ? `Skin tone: ${dnaProfile.skinTone}.`                 : null,
    dnaProfile.hairstyle        ? `Hairstyle: ${dnaProfile.hairstyle}.`                : null,
    dnaProfile.hairLength       ? `Hair length: ${dnaProfile.hairLength}.`             : null,
    dnaProfile.bodyBuild        ? `Body build: ${dnaProfile.bodyBuild}.`               : null,
    dnaProfile.silhouetteSummary? `Silhouette: ${dnaProfile.silhouetteSummary}.`       : null,
    dnaProfile.distinguishingFeatures?.length
      ? `Distinguishing features: ${dnaProfile.distinguishingFeatures.join(", ")}.`    : null,
  ].filter(Boolean).join(" ");
}

async function loadCharacterMemory(characterId, userId) {
  const { data, error } = await supabase
    .from("characters")
    .select("id, user_id, name, description, master_image, locked_traits, dna_profile, dna_confidence, anchor_views, metadata")
    .eq("id", characterId)
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new Error(error?.message || "Character memory not found");
  return data;
}

async function loadUploadedReferenceUrls(characterId, userId) {
  const { data, error } = await supabase
    .from("character_images")
    .select("image_url, source_type, is_canon, is_cover, sort_order, created_at")
    .eq("character_id", characterId)
    .eq("user_id", userId)
    .eq("source_type", "upload")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message || "Failed to load uploaded reference images");
  return (data || []).map(row => normalizeReferenceImage(row.image_url)).filter(Boolean);
}

// ─── IMAGE PERSISTENCE ────────────────────────────────────────────────────────

async function savePermanentImage({ imageUrl, userId = "anonymous", characterId, viewType }) {
  if (!imageUrl) return null;
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to download generated image: ${response.status}`);
  const contentType = response.headers.get("content-type") || "image/png";
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = getExtensionFromContentType(contentType);
  const filePath = `${userId}/${characterId}/pack/${viewType}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, buffer, { contentType, upsert: true });
  if (uploadError) throw new Error(uploadError.message || "Failed to upload image to Supabase");
  const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return publicData?.publicUrl || null;
}

async function deleteExistingPackImages(characterId, userId) {
  const { error } = await supabase.from("character_images").delete()
    .eq("character_id", characterId).eq("user_id", userId).eq("image_type", "pack");
  if (error) throw new Error(error.message || "Failed to clear previous pack images");
}

// ─── CORE GENERATION ─────────────────────────────────────────────────────────

/**
 * ✅ FIXED: single generation — uses ONLY masterImage as reference
 * No acceptedViewMap, no referenceFusion, no generated image chaining.
 */
async function runSingleGeneration({
  viewType,
  masterImage,
  size,
  lockedTraitsBlock,
  dnaIdentityBlock,
  userId,
  characterId,
}) {
  const aspect_ratio = mapSizeToAspectRatio(size);

  const prompt = buildFinalPrompt(viewType, lockedTraitsBlock, dnaIdentityBlock);
  const negative_prompt = buildNegativePrompt(viewType);

  // ✅ FIXED: ONLY the master image as reference — no chaining, no extras
  const masterRef = normalizeReferenceImage(masterImage);
  const input_images = masterRef ? [masterRef] : [];

  const input = input_images.length > 0
    ? { prompt, negative_prompt, aspect_ratio, output_format: "png", input_images }
    : { prompt, negative_prompt, aspect_ratio, output_format: "png" };

  console.log("REPLICATE INPUT", {
    model: MODEL,
    viewType,
    refCount: input_images.length,
    aspect_ratio,
    promptLength: prompt.length,
  });

  // ✅ FIXED: always MODEL — no per-view model switching
  const output = await runReplicateWithBackoff(async () => {
    return await replicate.run(MODEL, { input });
  }, 1);

  const tempUrl = await fileOutputToUrl(output);

  console.log("REPLICATE OUTPUT", { viewType, tempUrl: tempUrl ? "ok" : "null" });

  if (!tempUrl) throw new Error(`No image URL returned for ${viewType}`);

  return { imageUrl: tempUrl, tempUrl, viewType };
}

// ─── MAIN ROUTE ───────────────────────────────────────────────────────────────

export async function POST(req) {
  try {
    const { characterId, masterImage, userId, negativePrompt: _ignored = "" } = await req.json();

    if (!characterId?.trim()) return Response.json({ error: "characterId is required" }, { status: 400 });
    if (!masterImage?.trim())  return Response.json({ error: "masterImage is required" }, { status: 400 });
    if (!userId?.trim())       return Response.json({ error: "userId is required" }, { status: 400 });

    const normalizedMaster = normalizeReferenceImage(masterImage);
    if (!normalizedMaster) return Response.json({ error: "Invalid master image URL" }, { status: 400 });

    const routeStart = nowMs();
    console.log("PACK START", { characterId, userId });

    // Load character memory for DNA + locked traits
    const characterMemory = await loadCharacterMemory(characterId, userId);
    const dnaIdentityBlock  = buildDnaIdentityBlock(characterMemory?.dna_profile || {});
    const lockedTraitsBlock = buildLockedTraitsBlock(characterMemory?.locked_traits || {});

    console.log("CHARACTER MEMORY LOADED", {
      hasDna: !!characterMemory?.dna_profile,
      hasMaster: !!characterMemory?.master_image,
      dnaConfidence: characterMemory?.dna_confidence ?? null,
    });

    // ─── GENERATE ALL 5 VIEWS ────────────────────────────────────────────────

    const finalResults = [];

    for (const view of CLEAN_VIEWS) {
      const size = view.key === IMAGE_TYPES.CLOSEUP ? "1024x1024" : "1024x1536";
      const viewStart = nowMs();

      console.log("VIEW START", { view: view.key });

      let result = null;

      try {
        // ✅ FIXED: simple generation — master only, no chaining, no acceptedViewMap
        const generated = await runSingleGeneration({
          viewType: view.key,
          masterImage: normalizedMaster,
          size,
          lockedTraitsBlock,
          dnaIdentityBlock,
          userId,
          characterId,
        });

        result = {
          type: view.key,
          url: generated.tempUrl,
          sort_order: SORT_ORDER[view.key],
          accepted: true,
          attemptsUsed: 1,
        };

        console.log("VIEW SUCCESS", {
          view: view.key,
          seconds: ((nowMs() - viewStart) / 1000).toFixed(2),
        });

      } catch (err) {
        console.error(`VIEW FAILED: ${view.key}`, err.message);

        if (shouldStopPackEarly(err)) throw err;

        // Soft failure — log but continue to remaining views
        result = {
          type: view.key,
          url: null,
          sort_order: SORT_ORDER[view.key],
          accepted: false,
          error: err.message,
        };
      }

      finalResults.push(result);
    }

    // ─── BUILD PACK RESPONSE OBJECT ──────────────────────────────────────────

    const packTemp = {
      front:   finalResults.find(r => r.type === IMAGE_TYPES.FRONT)?.url   || null,
      closeup: finalResults.find(r => r.type === IMAGE_TYPES.CLOSEUP)?.url || null,
      left:    finalResults.find(r => r.type === IMAGE_TYPES.LEFT)?.url    || null,
      right:   finalResults.find(r => r.type === IMAGE_TYPES.RIGHT)?.url   || null,
      back:    finalResults.find(r => r.type === IMAGE_TYPES.BACK)?.url    || null,
    };

    const acceptedCount = finalResults.filter(r => r.accepted && r.url).length;

    console.log("PACK GENERATED", {
      acceptedCount,
      total: finalResults.length,
      elapsedSeconds: ((nowMs() - routeStart) / 1000).toFixed(2),
    });

    // If nothing came through at all, fail loudly
    if (acceptedCount === 0) {
      return Response.json({ error: "All 5 views failed to generate. Check Replicate logs." }, { status: 500 });
    }

    // Return temp URLs immediately if any views failed (partial pack)
    if (acceptedCount < CLEAN_VIEWS.length) {
      console.warn(`Partial pack: ${acceptedCount}/${CLEAN_VIEWS.length} views succeeded.`);
      return Response.json({ success: true, characterId, pack: packTemp });
    }

    // ─── PERSIST TO SUPABASE STORAGE ─────────────────────────────────────────

    console.log("UPLOADING TO PERMANENT STORAGE...");

    for (let i = 0; i < finalResults.length; i++) {
      const item = finalResults[i];
      if (!item.accepted || !item.url) continue;

      try {
        const permanentUrl = await savePermanentImage({
          imageUrl: item.url,
          userId,
          characterId,
          viewType: item.type,
        });
        finalResults[i] = { ...item, url: permanentUrl || item.url };
      } catch (err) {
        console.error(`Permanent upload failed for ${item.type} (non-fatal):`, err.message);
        // Keep temp URL if permanent upload fails
      }
    }

    await deleteExistingPackImages(characterId, userId).catch(err =>
      console.error("deleteExistingPackImages failed (non-fatal):", err.message)
    );

    // Insert rows into character_images
    const insertRows = finalResults
      .filter(r => r.accepted && r.url)
      .map(item => ({
        character_id: characterId,
        user_id: userId,
        image_type: "pack",
        image_url: item.url,
        pack_view: item.type,
        source_type: "generated",
        is_canon: item.type === IMAGE_TYPES.FRONT,
        is_cover: item.type === IMAGE_TYPES.FRONT,
        sort_order: item.sort_order,
        metadata: { viewType: item.type },
      }));

    const { error: insertError } = await supabase.from("character_images").insert(insertRows);
    if (insertError) console.error("character_images insert failed (non-fatal):", insertError.message);

    // Update anchor_views on character
    await supabase
      .from("characters")
      .update({
        anchor_views: finalResults
          .filter(r => r.accepted && r.url)
          .map(r => ({ type: r.type, url: r.url })),
        processing_error: null,
      })
      .eq("id", characterId)
      .eq("user_id", userId);

    // ─── FINAL RESPONSE ───────────────────────────────────────────────────────

    const finalPack = {
      front:   finalResults.find(r => r.type === IMAGE_TYPES.FRONT)?.url   || null,
      closeup: finalResults.find(r => r.type === IMAGE_TYPES.CLOSEUP)?.url || null,
      left:    finalResults.find(r => r.type === IMAGE_TYPES.LEFT)?.url    || null,
      right:   finalResults.find(r => r.type === IMAGE_TYPES.RIGHT)?.url   || null,
      back:    finalResults.find(r => r.type === IMAGE_TYPES.BACK)?.url    || null,
    };

    console.log("PACK COMPLETE", {
      elapsedSeconds: ((nowMs() - routeStart) / 1000).toFixed(2),
      accepted: acceptedCount,
    });

    return Response.json({ success: true, characterId, pack: finalPack });

  } catch (error) {
    console.error("PACK ROUTE ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to generate character pack" },
      { status: 500 }
    );
  }
}
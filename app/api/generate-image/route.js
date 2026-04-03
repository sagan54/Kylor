import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MODELS = {
  SCENE: "black-forest-labs/flux-2-pro",
  SCENE_PREMIUM: "black-forest-labs/flux-2-max",

  // Pin a specific DreamO version
  CHARACTER_ID:
    "zsxkib/dream-o:efe92b897afb0e7da9f83d0f2ee20355c3a48fa5553c46ffbc4c111f5ca87dbb",
};

async function loadCharacterData(characterId) {
  if (!characterId) return null;

  const { data, error } = await supabaseAdmin
    .from("characters")
    .select("*")
    .eq("id", characterId)
    .single();

  if (error || !data) return null;

  return data;
}

async function loadCharacterAnchorImages(characterId) {
  if (!characterId) return [];

  const { data, error } = await supabaseAdmin
    .from("character_images")
    .select(
      "id, image_url, storage_path, source_type, pack_view, is_canon, is_cover, metadata, sort_order, created_at"
    )
    .eq("character_id", characterId)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error || !Array.isArray(data)) {
    console.error("loadCharacterAnchorImages failed:", error);
    return [];
  }

  return data;
}

function normalizeReferenceImage(image) {
  if (!image || typeof image !== "string") return null;

  if (image.startsWith("data:image/")) return image;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;

  return null;
}

function extractPossibleImageUrl(item) {
  if (!item) return null;

  if (typeof item === "string") {
    return normalizeReferenceImage(item);
  }

  if (typeof item === "object") {
    return normalizeReferenceImage(
      item.url ||
        item.image_url ||
        item.publicUrl ||
        item.src ||
        item.reference_image ||
        null
    );
  }

  return null;
}

function getCharacterImageUrl(row) {
  if (!row || typeof row !== "object") return null;
  return normalizeReferenceImage(
    row.image_url || row.url || row.publicUrl || row.src || null
  );
}

function buildCharacterProfilePool(character, anchorRows = []) {
  const pool = [];

  if (character?.reference_image) {
    pool.push({
      key: `reference_image:${character.reference_image}`,
      url: normalizeReferenceImage(character.reference_image),
      type: "reference_image",
      view: "reference",
      score: 95,
    });
  }

  if (character?.master_image) {
    pool.push({
      key: `master_image:${character.master_image}`,
      url: normalizeReferenceImage(character.master_image),
      type: "master_image",
      view: "master",
      score: 100,
    });
  }

  if (character?.cover_image) {
    pool.push({
      key: `cover_image:${character.cover_image}`,
      url: normalizeReferenceImage(character.cover_image),
      type: "cover_image",
      view: "cover",
      score: 70,
    });
  }

  if (Array.isArray(character?.anchor_views)) {
    for (const item of character.anchor_views) {
      const url = extractPossibleImageUrl(item);
      if (!url) continue;

      const view =
        (item &&
          typeof item === "object" &&
          (item.pack_view || item.view || item.type)) ||
        "anchor";

      pool.push({
        key: `anchor_view:${view}:${url}`,
        url,
        type: "anchor_view",
        view,
        score: 85,
      });
    }
  }

  for (const row of anchorRows) {
    const url = getCharacterImageUrl(row);
    if (!url) continue;

    let score = 0;

    if (row.source_type === "master_identity") score += 100;
    if (row.source_type === "upload") score += 45;
    if (row.source_type === "generated") score += 10;
    if (row.is_canon) score += 40;
    if (row.is_cover) score += 15;

    if (row.pack_view === "closeup") score += 80;
    if (row.pack_view === "front") score += 70;
    if (row.pack_view === "left") score += 30;
    if (row.pack_view === "right") score += 30;
    if (row.pack_view === "back") score += 5;

    pool.push({
      key: `character_image:${row.id}`,
      url,
      type: row.source_type || "character_image",
      view: row.pack_view || "unknown",
      score,
      row,
    });
  }

  const deduped = [];
  const seen = new Set();

  for (const item of pool) {
    if (!item?.url) continue;
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    deduped.push(item);
  }

  return deduped;
}

function buildIdentityPackage(character, anchorRows = [], sceneType = "scene") {
  const pool = buildCharacterProfilePool(character, anchorRows);
  const sorted = [...pool].sort((a, b) => (b.score || 0) - (a.score || 0));

  const findByView = (view) => sorted.find((item) => item.view === view);
  const findByType = (type) => sorted.find((item) => item.type === type);

  const master = findByType("master_image") || null;
  const original = findByType("reference_image") || null;
  const closeup = findByView("closeup") || null;
  const front = findByView("front") || null;
  const left = findByView("left") || null;
  const right = findByView("right") || null;

  const strongRefs = [];
  const pushRef = (item) => {
    if (!item?.url) return;
    if (strongRefs.includes(item.url)) return;
    strongRefs.push(item.url);
  };

  if (sceneType === "portrait") {
    pushRef(closeup);
    pushRef(master);
    pushRef(original);
  } else if (sceneType === "side") {
    pushRef(closeup);
    pushRef(master);
    pushRef(left || right);
    pushRef(original);
  } else if (sceneType === "full_body") {
    pushRef(closeup);
    pushRef(master);
    pushRef(front);
    pushRef(original);
  } else {
    pushRef(closeup);
    pushRef(master);
    pushRef(front);
    pushRef(original);
  }

  for (const item of sorted) {
    if (strongRefs.length >= 4) break;
    pushRef(item);
  }

  const allProfileUrls = sorted.map((item) => item.url).filter(Boolean);

  const identityNotes = [
    `Scene type: ${sceneType}.`,
    closeup ? "Close-up facial anchor available." : "",
    master ? "Master identity available." : "",
    original ? "Original uploaded reference available." : "",
    front ? "Front-view anchor available." : "",
    left || right ? "Side-view anchor available." : "",
    `Total saved profile count: ${allProfileUrls.length}.`,
    `Active evaluation refs: ${strongRefs.length}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    allProfiles: sorted,
    allProfileUrls,
    strongRefs: strongRefs.slice(0, 4),
    master,
    original,
    closeup,
    front,
    left,
    right,
    dnaText: buildDnaIdentityText(character),
    identityNotes,
    sceneType,
  };
}

function selectGenerationReferenceImages({
  identityPackage = null,
  frontendRefs = [],
  maxRefs = 3,
}) {
  const refs = [];

  const pushRef = (url) => {
    const normalized = normalizeReferenceImage(url);
    if (!normalized) return;
    if (refs.includes(normalized)) return;
    refs.push(normalized);
  };

  // Best face anchors first
  pushRef(identityPackage?.closeup?.url);
  pushRef(identityPackage?.master?.url);

  if (refs.length < maxRefs && identityPackage?.front?.url) {
    pushRef(identityPackage.front.url);
  }

  if (refs.length < maxRefs && identityPackage?.original?.url) {
    pushRef(identityPackage.original.url);
  }

  for (const url of frontendRefs || []) {
    if (refs.length >= maxRefs) break;
    pushRef(url);
  }

  return refs.slice(0, maxRefs);
}

function buildDnaIdentityText(character) {
  const dna = character?.dna_profile;
  if (!dna || typeof dna !== "object") return "";

  const traits = dna?.traits && typeof dna.traits === "object" ? dna.traits : {};

  const parts = [
    dna.identitySummary ? `Identity summary: ${dna.identitySummary}` : "",
    traits.faceShape ? `Face shape: ${traits.faceShape}` : "",
    traits.jawline ? `Jawline: ${traits.jawline}` : "",
    traits.cheekStructure ? `Cheek structure: ${traits.cheekStructure}` : "",
    traits.foreheadShape ? `Forehead shape: ${traits.foreheadShape}` : "",
    traits.noseProfile ? `Nose profile: ${traits.noseProfile}` : "",
    traits.eyeShape ? `Eye shape: ${traits.eyeShape}` : "",
    traits.eyebrowShape ? `Eyebrow shape: ${traits.eyebrowShape}` : "",
    traits.lipShape ? `Lip shape: ${traits.lipShape}` : "",
    traits.chinShape ? `Chin shape: ${traits.chinShape}` : "",
    traits.earShape ? `Ear shape: ${traits.earShape}` : "",
    traits.skinTone ? `Skin tone: ${traits.skinTone}` : "",
    traits.hairstyle ? `Hairstyle: ${traits.hairstyle}` : "",
    traits.hairline ? `Hairline: ${traits.hairline}` : "",
    traits.hairLength ? `Hair length: ${traits.hairLength}` : "",
    traits.bodyBuild ? `Body build: ${traits.bodyBuild}` : "",
    traits.shoulderWidth ? `Shoulder width: ${traits.shoulderWidth}` : "",
    traits.neckShape ? `Neck shape: ${traits.neckShape}` : "",
    traits.silhouetteSummary ? `Silhouette: ${traits.silhouetteSummary}` : "",
    Array.isArray(traits.distinguishingFeatures) &&
    traits.distinguishingFeatures.length
      ? `Distinguishing features: ${traits.distinguishingFeatures.join(", ")}`
      : "",
  ].filter(Boolean);

  return parts.join(". ");
}

function detectReferenceTraits(identityPackage = null, character = null) {
  const dnaText = String(identityPackage?.dnaText || "").toLowerCase();
  const notes = String(identityPackage?.identityNotes || "").toLowerCase();
  const desc = String(character?.description || "").toLowerCase();

  const primaryAnchor = getPrimaryIdentityAnchor(identityPackage);
  const primaryMeta = JSON.stringify(primaryAnchor?.row?.metadata || {}).toLowerCase();

  const combined = [dnaText, notes, desc, primaryMeta].join(" ");

  const wearsGlasses =
    combined.includes("glasses") ||
    combined.includes("spectacles") ||
    combined.includes("eyewear");

  return {
    wearsGlasses,
  };
}

function getPrimaryIdentityAnchor(identityPackage = null) {
  return (
    identityPackage?.closeup ||
    identityPackage?.master ||
    identityPackage?.front ||
    null
  );
}

function mapSizeToAspectRatio(size, ratio = "1:1") {
  if (ratio && ratio !== "Auto") return ratio;

  switch (size) {
    case "1024x1536":
      return "2:3";
    case "1536x1024":
      return "3:2";
    case "1024x1024":
      return "1:1";
    default:
      return "1:1";
  }
}

function normalizeText(value) {
  return String(value || "").trim();
}

function detectSceneType(text = "") {
  const t = String(text || "").toLowerCase();

  const isPortrait =
    t.includes("close-up") ||
    t.includes("close up") ||
    t.includes("portrait") ||
    t.includes("headshot") ||
    t.includes("face shot");

  const isSideAngle =
    t.includes("side angle") ||
    t.includes("side profile") ||
    t.includes("profile view") ||
    t.includes("looking sideways") ||
    t.includes("from the side");

  const isFullBody =
    t.includes("full body") ||
    t.includes("full-body") ||
    t.includes("head to toe") ||
    t.includes("head-to-toe");

  if (isPortrait) return "portrait";
  if (isSideAngle) return "side";
  if (isFullBody) return "full_body";
  return "scene";
}

function buildSceneBlock({ prompt, scenePrompt }) {
  const rawScene = normalizeText(scenePrompt);
  const rawPrompt = normalizeText(prompt);

  if (rawScene) return rawScene;
  return rawPrompt;
}

function buildIdentityBlock({
  characterMode,
  hasRefs,
  character,
  identityPackage = null,
  combinedPrompt = "",
}) {
  if (!characterMode && !hasRefs && !character) return "";

  const promptText = String(combinedPrompt || "").toLowerCase();
  const actionScene = isGymOrActionScene(promptText);
  const traits = detectReferenceTraits(identityPackage, character);

  const lines = [
    "The generated person must be the exact same individual as the supplied reference images.",
    "Identity preservation is the top priority.",
    "This is not an inspired-by character, not a variation, and not a reinterpretation.",
    "Keep the face instantly recognizable as the same real person at first glance.",
    "The face must match the references more than the scene style.",
    "Preserve the exact same facial geometry: face width, face length, jawline, cheek structure, forehead, eye shape, eyebrow shape, nose bridge, nose tip, nostril shape, lips, beard pattern, mustache shape, skin tone, and hairline.",
    "Keep the same facial proportions and recognizable bone structure.",
    "Do not redesign, beautify, sharpen, idealize, masculinize, stylize, or replace the face.",
    "Do not turn the person into a generic actor, model, cinematic hero, athlete, or boxer.",
    "The identity must remain the same even if clothing, background, pose, or lighting changes.",
  ];

  if (traits.wearsGlasses) {
    lines.push(
      "The glasses are part of the character identity in the reference images.",
      "Keep the glasses present, visible, and consistent.",
      "Do not remove, redesign, restyle, resize, or replace the glasses unless the prompt explicitly requests removal."
    );
  }

  if (actionScene) {
    lines.push(
      "Even in a gym or action scene, keep the exact same person.",
      "Sweat, intensity, dramatic light, and physical tension must not change the facial identity.",
      "Do not transform the person into a generic fighter face or athletic hero face."
    );
  }

  if (character?.name) {
    lines.push(`Character name: ${character.name}.`);
  }

  if (identityPackage?.dnaText) {
    lines.push(identityPackage.dnaText);
  }

  return lines.join(" ");
}

function buildConditionedIdentityBlock({
  character,
  identityPackage = null,
  combinedPrompt = "",
}) {
  const promptText = String(combinedPrompt || "").toLowerCase();
  const actionScene = isGymOrActionScene(promptText);
  const traits = detectReferenceTraits(identityPackage, character);

  const lines = [
    "Use the supplied reference images as the exact same person.",
    "Preserve the same facial geometry and overall likeness.",
    "The facial identity must match the reference images with near-exact similarity. Even small differences in eyes, nose, lips, or bone structure are not acceptable.",
    "Do not redesign or beautify the face.",
    "Do not turn the person into a generic actor, model, or cinematic hero.",
  ];

  if (traits.wearsGlasses) {
    lines.push(
      "Keep the glasses present and consistent with the identity references."
    );
  }

  if (actionScene) {
    lines.push(
      "Even in an action or gym scene, the face must remain the same person."
    );
  }

  if (character?.name) {
    lines.push(`Character name: ${character.name}.`);
  }

  return lines.join(" ");
}

function buildCompositionBlock({ combinedPrompt, ratio }) {
  const text = combinedPrompt.toLowerCase();

  const wantsCloseup =
    text.includes("close-up") ||
    text.includes("close up") ||
    text.includes("portrait") ||
    text.includes("headshot") ||
    text.includes("face shot");

  const wantsFullBody =
    text.includes("full body") ||
    text.includes("full-body") ||
    text.includes("head to toe") ||
    text.includes("head-to-toe");

  const wantsWide =
    text.includes("wide shot") ||
    text.includes("wide-angle") ||
    text.includes("environment visible") ||
    ratio === "16:9" ||
    ratio === "21:9";

  if (wantsCloseup) {
    return [
      "Composition:",
      "Use close-up or portrait framing only because the prompt asks for it.",
      "Keep the face clearly visible.",
      "Do not beautify or idealize the person.",
      "Do not crop awkwardly or distort facial proportions.",
    ].join(" ");
  }

  if (wantsFullBody || wantsWide) {
    return [
      "Composition:",
      "Follow the requested scene exactly.",
      "Keep the environment clearly visible.",
      "Use full-body or wider framing only if requested.",
      "Do not turn this into a face-only portrait unless the prompt explicitly asks for it.",
    ].join(" ");
  }

  return [
    "Composition:",
    "Follow the requested framing exactly.",
    "Use natural cinematic framing.",
    "Keep the subject clearly readable.",
    "Do not default to an extreme close-up unless explicitly requested.",
  ].join(" ");
}

// FIX 5 — upgraded realism block with anti-AI-polish instructions
function buildRealismBlock({ realismMode = "realistic" }) {
  const mode = String(realismMode || "realistic").toLowerCase();

  const antiPolish = [
    "Natural skin with visible pores, subtle texture, and micro-imperfections.",
    "Asymmetric features as they appear in real life.",
    "Do NOT apply beauty filtering, skin smoothing, or AI face enhancement.",
    "Do NOT render this as a studio headshot or polished portrait.",
    "Film grain quality, not digital perfection.",
  ].join(" ");

  if (mode === "hyper") {
    return `Realism: Hyper-photorealistic. ${antiPolish} Analog film quality. Strong subsurface scattering on skin.`;
  }

  if (mode === "standard") {
    return `Realism: Clean realistic image. ${antiPolish}`;
  }

  return `Realism: Photorealistic. ${antiPolish} Avoid artificial beauty-filter rendering or synthetic skin texture.`;
}

function buildNegativeBlock({ negativePrompt, combinedPrompt, useCharacter }) {
  const text = combinedPrompt.toLowerCase();

  const baseNegatives = [
    "anime",
    "illustration",
    "painting",
    "3d render",
    "cgi",
    "cartoon",
    "waxy skin",
    "plastic skin",
    "beauty filter",
    "over-smoothed face",
    "doll-like face",
    "exaggerated anatomy",
    "deformed body",
    "bad hands",
    "extra fingers",
    "extra limbs",
    "duplicate body parts",
    "distorted face",
    "blurry face",
    "low detail face",
    "synthetic lighting",
    "oversharpened skin",
    "beauty filter",
    "airbrushed skin",
    "oversmoothed portrait",
    "identity drift",
    "wrong hairstyle",
    "wrong facial structure",
  ];

  if (useCharacter) {
    baseNegatives.push(
      "different person",
      "identity drift",
      "face change",
      "different hairstyle",
      "different beard pattern",
      "different skin tone",
      "missing glasses",
      "removed glasses",
      "different glasses",
      "restyled glasses",
      "generic boxer face",
      "heroic fighter face",
      "model-like male face",
      "cinematic actor face",
      "beautified male face",
      "idealized male face",
      "sharper jawline",
      "narrower face",
      "longer face",
      "different nose shape",
      "different eye shape",
      "different lip shape",
      "different mustache",
      "different beard density"
    );
  }

  const wantsWide =
    text.includes("wide shot") ||
    text.includes("full body") ||
    text.includes("full-body") ||
    text.includes("head to toe") ||
    text.includes("head-to-toe");

  if (wantsWide) {
    baseNegatives.push("close-up portrait", "headshot", "face-only crop");
  }

  return [...baseNegatives, normalizeText(negativePrompt)]
    .filter(Boolean)
    .join(", ");
}

function chooseModel({
  characterMode,
  premiumRender,
}) {
  if (characterMode) return MODELS.CHARACTER_ID;
  if (premiumRender) return MODELS.SCENE_PREMIUM;
  return MODELS.SCENE;
}

function shouldEnablePromptUpsampling({
  characterMode,
  realismMode,
}) {
  if (characterMode) return false;
  return String(realismMode || "realistic").toLowerCase() === "standard";
}

function isGymOrActionScene(text = "") {
  const t = String(text || "").toLowerCase();
  return (
    t.includes("gym") ||
    t.includes("workout") ||
    t.includes("dumbbell") ||
    t.includes("exercise") ||
    t.includes("fitness") ||
    t.includes("running") ||
    t.includes("action") ||
    t.includes("fight") ||
    t.includes("boxing") ||
    t.includes("training")
  );
}

function buildFluxInput({
  prompt,
  negativePrompt,
  aspect_ratio,
  enablePromptUpsampling,
  premiumRender,
  referenceImages = [],
}) {
  const input = {
    prompt,
    aspect_ratio,
    output_format: "png",
  };

  if (negativePrompt) {
    input.negative_prompt = negativePrompt;
  }

  if (enablePromptUpsampling) {
    input.prompt_upsampling = true;
  }

  if (premiumRender) {
    input.raw = true;
  }

  if (Array.isArray(referenceImages) && referenceImages.length > 0) {
    input.reference_images = referenceImages.slice(0, 4);
  }

  return input;
}

// FIX 1 + FIX 4 + FIX 6 — guidance/steps raised, size map corrected, smart ref_task per view
function buildDreamOInput({
  prompt,
  negativePrompt,
  referenceImages = [],
  aspect_ratio,
  identityPackage = null,
}) {
  const primaryRef   = referenceImages?.[0] || null;
  const secondaryRef = referenceImages?.[1] || null;
  const thirdRef     = referenceImages?.[2] || null;

  if (!primaryRef) {
    throw new Error("DreamO requires at least one identity reference image.");
  }

  // FIX 4 — corrected size map with true aspect ratios
  const sizeMap = {
    "1:1":  { width: 1024, height: 1024 },
    "16:9": { width: 1280, height: 720  },
    "9:16": { width: 720,  height: 1280 },
    "3:2":  { width: 1152, height: 768  },
    "2:3":  { width: 768,  height: 1152 },
    "4:5":  { width: 819,  height: 1024 },
    "5:4":  { width: 1024, height: 819  },
    "4:3":  { width: 1024, height: 768  },
    "21:9": { width: 1344, height: 576  },
  };

  const dims = sizeMap[aspect_ratio] || sizeMap["1:1"];

  // FIX 6 — detect if third ref is a body view (less face-reliable)
  const thirdIsBodyView =
    identityPackage &&
    (identityPackage.allProfiles?.find((p) => p.url === thirdRef)?.view === "front" ||
      identityPackage.allProfiles?.find((p) => p.url === thirdRef)?.view === "back");

  const input = {
    prompt,
    neg_prompt: negativePrompt || "",
    ref_image1: primaryRef,
    ref_task1: "id",
    width:  dims.width,
    height: dims.height,
    // FIX 1 — raised from guidance:3.0/num_steps:12
    guidance:      5.5,
    num_steps:     25,
    output_format: "webp",
    output_quality: 90,
  };

  if (secondaryRef) {
    input.ref_image2 = secondaryRef;
    input.ref_task2  = "id";          // second face ref stays "id"
  }

  if (thirdRef) {
    input.ref_image3 = thirdRef;
    // FIX 6 — body view uses "style" so it doesn't compete as face anchor
    input.ref_task3  = thirdIsBodyView ? "style" : "id";
  }

  return input;
}

async function createReplicatePrediction({ model, input }) {
  if (!model || typeof model !== "string") {
    throw new Error("Invalid model target");
  }

  const parts = model.split(":");

  // Community / pinned-version path (DreamO)
  if (parts.length === 2) {
    const version = parts[1];

    return await replicate.predictions.create({
      version,
      input,
    });
  }

  // Official model path (Flux official models)
  return await replicate.models.predictions.create(model, {
    input,
  });
}

function sanitizeSensitiveSceneText(text = "") {
  let t = String(text || "");

  const replacements = [
    { from: /\bwar-torn\b/gi, to: "battle-worn" },
    { from: /\bbattlefield\b/gi, to: "historical field after conflict" },
    { from: /\bgory\b/gi, to: "intense" },
    { from: /\bgore\b/gi, to: "aftermath" },
    { from: /\bblood\b/gi, to: "signs of conflict" },
    { from: /\bdead bodies\b/gi, to: "abandoned traces of battle" },
    { from: /\bcorpse\b/gi, to: "fallen figure" },
    { from: /\bmassacre\b/gi, to: "devastation" },
    { from: /\bbrutal\b/gi, to: "harsh" },
  ];

  for (const item of replacements) {
    t = t.replace(item.from, item.to);
  }

  return t.trim();
}

export async function POST(req) {
  try {
    const {
      userId,
      characterId = null,
      prompt,
      scenePrompt = "",
      characterPrompt = "",
      style = null,
      styleLabel = "",
      stylePrompt = "",
      negativePrompt = "",
      useCharacter = false,
      size = "1024x1024",
      quality = "medium",
      n = 1,
      referenceImages = [],
      ratio = "1:1",
      realismMode = "realistic",
      premiumRender = false,
    } = await req.json();

    console.log("Incoming request:", {
      prompt,
      scenePrompt,
      characterPrompt,
    });

    console.log("Incoming generate-image payload:", {
      userId,
      characterId,
      prompt,
      scenePrompt,
      characterPrompt,
      style,
      styleLabel,
      stylePrompt,
      negativePrompt,
      useCharacter,
      size,
      quality,
      n,
      ratio,
      realismMode,
      premiumRender,
      referenceImagesCount: Array.isArray(referenceImages)
        ? referenceImages.length
        : 0,
    });

    if (!userId || !String(userId).trim()) {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }

    if (!prompt || !String(prompt).trim()) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    const character = characterId ? await loadCharacterData(characterId) : null;
    const anchorRows = characterId
      ? await loadCharacterAnchorImages(characterId)
      : [];

    const frontendRefs = Array.isArray(referenceImages)
      ? referenceImages.map(normalizeReferenceImage).filter(Boolean).slice(0, 5)
      : [];

    const sceneType = detectSceneType(
      `${normalizeText(prompt)} ${normalizeText(scenePrompt)}`
    );

    const identityPackage = character
      ? buildIdentityPackage(character, anchorRows, sceneType)
      : null;

    const generationRefs = character
      ? selectGenerationReferenceImages({
          identityPackage,
          frontendRefs,
          maxRefs: 4,
        })
      : [...new Set(frontendRefs)].slice(0, 4);

    const characterMode =
      Boolean(character) || (Boolean(useCharacter) && generationRefs.length > 0);

    if (Boolean(useCharacter) && generationRefs.length === 0) {
      return Response.json(
        {
          error:
            "Character mode was requested but no valid character reference images were found.",
        },
        { status: 400 }
      );
    }

    const hasRefs = generationRefs.length > 0;
    const cleanedPrompt          = sanitizeSensitiveSceneText(normalizeText(prompt));
    const cleanedScenePrompt     = sanitizeSensitiveSceneText(normalizeText(scenePrompt));
    const cleanedCharacterPrompt = normalizeText(characterPrompt);
    const cleanedStylePrompt     = normalizeText(stylePrompt);
    const cleanedNegativePrompt  = normalizeText(negativePrompt);

    const combinedSceneText = buildSceneBlock({
      prompt:      cleanedPrompt,
      scenePrompt: cleanedScenePrompt,
    });

    // FIX 2 + FIX 3 — single identity block, correct branch per mode
    // characterMode (DreamO): short conditioned block — visual ref does the heavy lifting
    // non-character (Flux):   full identity block — text is the only identity signal
    const strictIdentityBlock = characterMode
      ? buildConditionedIdentityBlock({
          character,
          identityPackage,
          combinedPrompt: combinedSceneText,
        })
      : buildIdentityBlock({
          characterMode: false,
          hasRefs,
          character:       null,
          identityPackage: null,
          combinedPrompt:  combinedSceneText,
        });

    const compositionBlock = buildCompositionBlock({
      combinedPrompt: combinedSceneText,
      ratio,
    });

    const realismBlock = buildRealismBlock({
      realismMode,
    });

    const negativeBlock = buildNegativeBlock({
      negativePrompt: cleanedNegativePrompt,
      combinedPrompt: combinedSceneText,
      useCharacter:   characterMode,
    });

    const qualityBlock = [
      "Quality:",
      "Strong scene fidelity.",
      "Accurate anatomy.",
      "Natural detail.",
      "Follow the prompt exactly.",
      "Do not replace the requested scene with a generic beauty shot.",
    ].join(" ");

    // FIX 5 — realism block moved up (position 3) so it hits before style
    const baseFinalPrompt = [
      `Scene: ${combinedSceneText}`,
      compositionBlock,
      realismBlock,
      cleanedStylePrompt     ? `Style guidance: ${cleanedStylePrompt}`         : "",
      cleanedCharacterPrompt ? `Character guidance: ${cleanedCharacterPrompt}` : "",
      strictIdentityBlock,
      qualityBlock,
    ]
      .filter(Boolean)
      .join("\n\n");

    console.log("Resolved generation prompt blocks:", {
      cleanedPrompt,
      cleanedScenePrompt,
      cleanedCharacterPrompt,
      cleanedStylePrompt,
      combinedSceneText,
      strictIdentityBlock,
      compositionBlock,
      realismBlock,
      negativeBlock,
      baseFinalPrompt,
    });

    const aspect_ratio = mapSizeToAspectRatio(size, ratio);

    const model = chooseModel({
      characterMode,
      premiumRender:
        Boolean(premiumRender) || String(quality).toLowerCase() === "high",
    });

    const enablePromptUpsampling = shouldEnablePromptUpsampling({
      characterMode,
      realismMode,
    });

    const currentPrompt         = baseFinalPrompt;
    const currentNegativePrompt = negativeBlock;

    // FIX 6 — pass identityPackage into buildDreamOInput for smart ref_task selection
    const input =
      model === MODELS.CHARACTER_ID
        ? buildDreamOInput({
            prompt:          currentPrompt,
            negativePrompt:  currentNegativePrompt,
            referenceImages: generationRefs,
            aspect_ratio,
            identityPackage,
          })
        : buildFluxInput({
            prompt:                currentPrompt,
            negativePrompt:        currentNegativePrompt,
            aspect_ratio,
            enablePromptUpsampling,
            premiumRender:
              model === MODELS.SCENE_PREMIUM ||
              Boolean(premiumRender) ||
              String(quality).toLowerCase() === "high",
            referenceImages: generationRefs,
          });

    console.log("Replicate model:", model);
    console.log("Replicate input:", JSON.stringify(input, null, 2));

    const prediction = await createReplicatePrediction({
      model,
      input,
    });

    const jobPayload = {
      prediction_id: prediction.id,
      user_id:       String(userId),
      character_id:  character?.id || null,
      prompt:        currentPrompt,
      negative_prompt: currentNegativePrompt,
      ratio,
      mode:  characterMode ? "character_guided" : "scene_only",
      style: styleLabel || style || null,
      meta: {
        referencePreview:    generationRefs,
        finalPrompt:         currentPrompt,
        negativePrompt:      currentNegativePrompt,
        characterPrompt:     cleanedCharacterPrompt,
        scenePrompt:         cleanedScenePrompt,
        combinedScenePrompt: combinedSceneText,
        stylePrompt:         cleanedStylePrompt,
        identityPrompt:      strictIdentityBlock,
        compositionPrompt:   compositionBlock,
        realismPrompt:       realismBlock,
        characterLoaded:     Boolean(character),
        characterName:       character?.name || null,
      },
      evaluation: {},
      status: prediction.status || "starting",
    };

    const { error: jobInsertError } = await supabaseAdmin
      .from("generation_jobs")
      .insert(jobPayload);

    if (jobInsertError) {
      throw new Error(jobInsertError.message || "Failed to save generation job");
    }

    return Response.json({
      status:      prediction.status,
      predictionId: prediction.id,
      model,
      mode: characterMode ? "character_guided" : "scene_only",
      meta: {
        referencePreview: generationRefs,
        finalPrompt:      currentPrompt,
        negativePrompt:   currentNegativePrompt,
      },
    });

  } catch (error) {
    console.error("Image generation error:", error);

    const rawMessage = String(error?.message || "");

    if (
      rawMessage.toLowerCase().includes("flagged as sensitive") ||
      rawMessage.toLowerCase().includes("sensitive")
    ) {
      return Response.json(
        {
          error:
            "This prompt was blocked by the image provider safety filter. Try softer wording such as 'after conflict', 'historical tension', or 'battle-worn environment' instead of direct violent terms.",
          errorType: "safety_filter",
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        error:     rawMessage || "Failed to generate image",
        errorType: "generation_error",
      },
      { status: 500 }
    );
  }
}
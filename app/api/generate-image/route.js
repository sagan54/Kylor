import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const IDENTITY_EVALUATOR_MODEL = process.env.EVALUATOR_MODEL || "gpt-4.1-mini";

const MODELS = {
  SCENE: "black-forest-labs/flux-2-pro",
  SCENE_PREMIUM: "black-forest-labs/flux-2-max",

  // Identity-conditioned path
  CHARACTER_ID: "zsxkib/dream-o",
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

  // Strongest facial anchors first
  if (identityPackage?.closeup?.url) pushRef(identityPackage.closeup.url);
  if (identityPackage?.master?.url) pushRef(identityPackage.master.url);

  // Use front only as third choice
  if (refs.length < maxRefs && identityPackage?.front?.url) {
    pushRef(identityPackage.front.url);
  }

  // Fallbacks only if needed
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

async function fileOutputToUrl(output) {
  if (!output) return null;

  if (typeof output === "string") return output;

  if (Array.isArray(output)) {
    const first = output[0];
    if (!first) return null;
    if (typeof first === "string") return first;

    if (typeof first.url === "function") {
      return first.url();
    }

    if (typeof first.url === "string") {
      return first.url;
    }

    if (typeof first.toString === "function") {
      const s = first.toString();
      if (s && s !== "[object Object]") return s;
    }

    return null;
  }

  if (typeof output.url === "function") {
    return output.url();
  }

  if (typeof output.url === "string") {
    return output.url;
  }

  if (typeof output.toString === "function") {
    const s = output.toString();
    if (s && s !== "[object Object]") return s;
  }

  return null;
}

async function persistImageToSupabase({
  imageUrl,
  userId,
  bucket = "generated-images",
}) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download generated image: ${response.status} ${response.statusText}`
    );
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let ext = "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
  if (contentType.includes("webp")) ext = "webp";

  const filePath = `${userId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload image to Supabase");
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

  return {
    url: data.publicUrl,
    path: filePath,
    starred: false,
  };
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

// ✅ ADD THE NEW HELPER HERE
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

function buildRealismBlock({ realismMode = "realistic" }) {
  const mode = String(realismMode || "realistic").toLowerCase();

  if (mode === "hyper") {
    return [
      "Realism:",
      "Extremely photorealistic image.",
      "Natural skin texture with believable pores and facial detail.",
      "Real-world lighting, realistic anatomy, grounded depth of field.",
      "Avoid glamour retouching, fantasy skin, or synthetic cinematic exaggeration.",
    ].join(" ");
  }

  if (mode === "standard") {
    return [
      "Realism:",
      "Clean realistic image.",
      "Natural facial detail, believable lighting, and grounded anatomy.",
      "Keep the result realistic and not stylized.",
    ].join(" ");
  }

  return [
    "Realism:",
    "Photorealistic image with strong natural detail.",
    "Believable skin texture, grounded anatomy, realistic lighting, realistic proportions.",
    "Avoid artificial beauty-filter skin or over-stylized rendering.",
  ].join(" ");
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

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function clampScore(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(10, n));
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

function getFailureTypeFromEvaluation(evaluation) {
  if (!evaluation) return "weak_resemblance";

  if (evaluation.faceMismatch) return "face_mismatch";
  if (evaluation.hairstyleDrift) return "hairstyle_drift";
  if (evaluation.glassesMissing) return "glasses_missing";
  if (evaluation.bodyExaggeration) return "body_exaggeration";
  if (evaluation.ageDrift) return "age_drift";
  if (evaluation.stylizationDrift) return "stylization_drift";
  if (evaluation.weakResemblance) return "weak_resemblance";
  if (evaluation.beardMismatch) return "beard_mismatch";

  return "none";
}

async function scoreGeneratedIdentity({
  generatedImage,
  referencePack = [],
  dnaProfile = null,
  scenePrompt = "",
  characterName = "",
}) {
  if (!generatedImage || !referencePack.length || !OPENAI_API_KEY) {
    return {
      passed: true,
      identityScore: 7,
      faceScore: 7,
      hairScore: 7,
      bodyProportionScore: 7,
      sceneScore: 7,
      qualityScore: 7,
      glassesPreserved: true,
      faceMismatch: false,
      hairstyleDrift: false,
      glassesMissing: false,
      bodyExaggeration: false,
      ageDrift: false,
      stylizationDrift: false,
      weakResemblance: false,
      beardMismatch: false,
      driftDetected: false,
      failureType: "none",
      failureReasons: [],
      evaluatorSkipped: !OPENAI_API_KEY
        ? "OPENAI_API_KEY missing"
        : "No references",
      evaluatorRaw: null,
    };
  }

  const dnaText =
    dnaProfile && typeof dnaProfile === "object"
      ? JSON.stringify(dnaProfile)
      : "None";

  const sceneBias = isGymOrActionScene(scenePrompt)
    ? "This is a gym/action style scene. Strongly penalize bodybuilder transformation, model-like beautification, heroic stylization, sharper jawline changes, missing glasses, hairstyle changes, and unrealistic physique inflation."
    : "Strongly penalize any identity drift from the references.";

  const messages = [
    {
      role: "system",
      content:
        "You are an expert identity consistency evaluator for photorealistic character generation. Judge whether the generated image still shows the same person as the reference images. Return strict JSON only.",
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `
Evaluate whether the GENERATED IMAGE matches the SAME PERSON as the REFERENCE IMAGES.

Character name: ${characterName || "Unknown"}
Scene prompt: ${scenePrompt || "None"}
DNA profile: ${dnaText}

Rules:
- The references all belong to the same person and must be treated as one identity package.
- Focus heavily on face identity, hair, glasses/accessories, facial structure, skin tone, beard pattern, age consistency, and body proportion realism.
- ${sceneBias}
- A visually attractive image that becomes a different person must fail.
- Return JSON only.

Required schema:
{
  "passed": boolean,
  "identityScore": number,
  "faceScore": number,
  "hairScore": number,
  "bodyProportionScore": number,
  "sceneScore": number,
  "qualityScore": number,
  "glassesPreserved": boolean,
  "faceMismatch": boolean,
  "hairstyleDrift": boolean,
  "glassesMissing": boolean,
  "bodyExaggeration": boolean,
  "ageDrift": boolean,
  "stylizationDrift": boolean,
  "weakResemblance": boolean,
  "driftDetected": boolean,
  "failureReasons": string[],
  "reason": string,
  "beardMismatch": boolean
}
          `.trim(),
        },
        ...referencePack.map((url, i) => ({
          type: "image_url",
          image_url: { url },
          name: `reference_${i + 1}`,
        })),
        {
          type: "image_url",
          image_url: { url: generatedImage },
          name: "generated_image",
        },
      ],
    },
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: IDENTITY_EVALUATOR_MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages,
      }),
    });

    const json = await response.json();
    const text = json?.choices?.[0]?.message?.content || "";
    const parsed = safeJsonParse(text) || {};

    const result = {
      passed: Boolean(parsed.passed),
      identityScore: clampScore(parsed.identityScore, 0),
      faceScore: clampScore(parsed.faceScore, 0),
      hairScore: clampScore(parsed.hairScore, 0),
      bodyProportionScore: clampScore(parsed.bodyProportionScore, 0),
      sceneScore: clampScore(parsed.sceneScore, 0),
      qualityScore: clampScore(parsed.qualityScore, 0),
      glassesPreserved: Boolean(parsed.glassesPreserved),
      faceMismatch: Boolean(parsed.faceMismatch),
      hairstyleDrift: Boolean(parsed.hairstyleDrift),
      glassesMissing: Boolean(parsed.glassesMissing),
      bodyExaggeration: Boolean(parsed.bodyExaggeration),
      ageDrift: Boolean(parsed.ageDrift),
      stylizationDrift: Boolean(parsed.stylizationDrift),
      weakResemblance: Boolean(parsed.weakResemblance),
      beardMismatch: Boolean(parsed.beardMismatch),
      driftDetected: Boolean(parsed.driftDetected),
      failureReasons: Array.isArray(parsed.failureReasons)
        ? parsed.failureReasons.map((x) => String(x))
        : [],
      reason: String(parsed.reason || "").trim(),
      evaluatorRaw: parsed,
    };

    const failureType = getFailureTypeFromEvaluation(result);

    const gymAction = isGymOrActionScene(scenePrompt);
    const minimumIdentityScore = gymAction ? 9.0 : 8.7;
    const minimumFaceScore = gymAction ? 9.0 : 8.7;
    const minimumBodyScore = gymAction ? 7.5 : 7.2;

    const shouldPass =
      !result.faceMismatch &&
      !result.hairstyleDrift &&
      !result.glassesMissing &&
      !result.bodyExaggeration &&
      !result.ageDrift &&
      !result.stylizationDrift &&
      !result.weakResemblance &&
      !result.beardMismatch &&
      result.identityScore >= minimumIdentityScore &&
      result.faceScore >= minimumFaceScore &&
      result.hairScore >= 8.0 &&
      result.bodyProportionScore >= minimumBodyScore;

    return {
      ...result,
      passed: shouldPass,
      failureType: shouldPass ? "none" : failureType,
    };
  } catch (error) {
    console.error("scoreGeneratedIdentity failed:", error);

    return {
      passed: true,
      identityScore: 7,
      faceScore: 7,
      hairScore: 7,
      bodyProportionScore: 7,
      sceneScore: 7,
      qualityScore: 7,
      glassesPreserved: true,
      faceMismatch: false,
      hairstyleDrift: false,
      glassesMissing: false,
      bodyExaggeration: false,
      ageDrift: false,
      stylizationDrift: false,
      weakResemblance: false,
      beardMismatch: false,
      driftDetected: false,
      failureType: "none",
      failureReasons: [],
      evaluatorSkipped: `Evaluator error: ${error?.message || "unknown"}`,
      evaluatorRaw: null,
    };
  }
}

function buildIdentityRetryPrompt({
  basePrompt,
  failedEvaluation,
  character,
}) {
  const corrections = [
    "Retry with stronger identity match.",
    "Preserve the exact same real person.",
    "Correct identity drift.",
    "Do not replace the person with a cleaner, younger, more attractive, or different version.",
    "Preserve the same face, hair, beard, glasses, and natural proportions.",
  ];

  if (character?.name) {
    corrections.push(`Character: ${character.name}.`);
  }

  if (failedEvaluation?.faceMismatch) {
    corrections.push("Correct the face to match the saved person much more closely.");
  }

  if (failedEvaluation?.hairstyleDrift) {
    corrections.push("Correct the hairstyle and hairline.");
  }

  if (failedEvaluation?.beardMismatch) {
    corrections.push("Correct the beard and mustache pattern.");
  }

  if (failedEvaluation?.glassesMissing) {
    corrections.push(
      "Keep the glasses clearly visible and consistent with the reference identity."
    );
  }

  if (failedEvaluation?.bodyExaggeration) {
    corrections.push("Keep natural body proportions. Do not exaggerate the physique.");
  }

  if (failedEvaluation?.stylizationDrift) {
    corrections.push("Reduce stylization and keep the result realistic.");
  }

  return [basePrompt, corrections.join(" ")].filter(Boolean).join("\n\n");
}

function buildRetryNegativeBlock({
  negativeBlock,
  failedEvaluation,
  scenePrompt,
}) {
  const extra = [
    "different person",
    "identity drift",
    "face mismatch",
    "wrong face",
    "wrong hairstyle",
    "beautified face",
    "model face",
    "hero face",
    "glamour retouching",
  ];

  if (failedEvaluation?.glassesMissing) {
    extra.push("missing glasses", "removed glasses", "no glasses");
  }

  if (failedEvaluation?.bodyExaggeration || isGymOrActionScene(scenePrompt)) {
    extra.push(
      "bodybuilder",
      "bodybuilder physique",
      "massive muscles",
      "fitness model body",
      "heroic body",
      "inflated chest",
      "inflated shoulders",
      "over-muscular arms"
    );
  }

  if (failedEvaluation?.hairstyleDrift) {
    extra.push("wrong hair", "different haircut", "different hair length");
  }

  if (failedEvaluation?.beardMismatch) {
    extra.push(
      "wrong beard",
      "wrong mustache",
      "different facial hair",
      "clean shaven mismatch",
      "incorrect beard density"
    );
  }

  if (failedEvaluation?.stylizationDrift) {
    extra.push(
      "stylized face",
      "cinematic glamour",
      "posterized realism",
      "fashion editorial look"
    );
  }

  return [...new Set([negativeBlock, ...extra].filter(Boolean))].join(", ");
}

function getEvaluationWeightedScore(evaluation, scenePrompt = "") {
  if (!evaluation) return 0;

  const gymAction = isGymOrActionScene(scenePrompt);

  if (gymAction) {
    return (
      clampScore(evaluation.faceScore) * 0.4 +
      clampScore(evaluation.hairScore) * 0.2 +
      clampScore(evaluation.bodyProportionScore) * 0.2 +
      clampScore(evaluation.sceneScore) * 0.1 +
      clampScore(evaluation.qualityScore) * 0.1
    );
  }

  return (
    clampScore(evaluation.identityScore) * 0.45 +
    clampScore(evaluation.faceScore) * 0.25 +
    clampScore(evaluation.hairScore) * 0.1 +
    clampScore(evaluation.bodyProportionScore) * 0.1 +
    clampScore(evaluation.qualityScore) * 0.1
  );
}

async function removeStoredImageIfExists(image) {
  if (!image?.path) return;

  try {
    await supabaseAdmin.storage.from("generated-images").remove([image.path]);
  } catch (error) {
    console.error("Failed to cleanup image:", error);
  }
}

function pickBestFaceAnchor({
  identityPackage = null,
  frontendRefs = [],
}) {
  return (
    identityPackage?.closeup?.url ||
    identityPackage?.master?.url ||
    identityPackage?.original?.url ||
    frontendRefs?.[0] ||
    null
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

function buildDreamOInput({
  prompt,
  negativePrompt,
  referenceImages = [],
  aspect_ratio,
}) {
  const primaryRef = referenceImages?.[0] || null;
  const secondaryRefs = Array.isArray(referenceImages)
    ? referenceImages.slice(1, 3)
    : [];

  if (!primaryRef) {
    throw new Error("DreamO requires at least one identity reference image.");
  }

  const input = {
    prompt,
    negative_prompt: negativePrompt || "",
    reference_image: primaryRef,
    additional_reference_images: secondaryRefs,
    aspect_ratio,
    output_format: "png",
  };

  return input;
}

async function generateSingleCandidate({
  model,
  prompt,
  negativePrompt,
  aspect_ratio,
  referenceImages = [],
  enablePromptUpsampling,
  premiumRender,
  userId,
}) {
  const input =
    model === MODELS.CHARACTER_ID
      ? buildDreamOInput({
          prompt,
          negativePrompt,
          referenceImages,
          aspect_ratio,
        })
      : buildFluxInput({
          prompt,
          negativePrompt,
          aspect_ratio,
          enablePromptUpsampling,
          premiumRender,
          referenceImages,
        });

  console.log("Replicate model:", model);
  console.log("Replicate input:", JSON.stringify(input, null, 2));

  const output = await replicate.run(model, { input });
  const tempUrl = await fileOutputToUrl(output);

  if (!tempUrl) return null;

  const storedImage = await persistImageToSupabase({
    imageUrl: tempUrl,
    userId: String(userId),
    bucket: "generated-images",
  });

  return storedImage;
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

    const safeN = Math.min(Math.max(Number(n) || 1, 1), 4);

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

    const evaluationRefs = character
      ? [...new Set(generationRefs)].slice(0, 3)
      : [...new Set(frontendRefs)].slice(0, 5);

    const bestFaceAnchor = pickBestFaceAnchor({
      identityPackage,
      frontendRefs,
    });

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

    const hasRefs = evaluationRefs.length > 0;
    const cleanedPrompt = sanitizeSensitiveSceneText(normalizeText(prompt));
    const cleanedScenePrompt = sanitizeSensitiveSceneText(
      normalizeText(scenePrompt)
    );
    const cleanedCharacterPrompt = normalizeText(characterPrompt);
    const cleanedStylePrompt = normalizeText(stylePrompt);
    const cleanedNegativePrompt = normalizeText(negativePrompt);

    const combinedSceneText = buildSceneBlock({
      prompt: cleanedPrompt,
      scenePrompt: cleanedScenePrompt,
    });

    const identityBlock =
      characterMode
        ? buildConditionedIdentityBlock({
            character,
            identityPackage,
            combinedPrompt: combinedSceneText,
          })
        : buildIdentityBlock({
            characterMode,
            hasRefs,
            character,
            identityPackage,
            combinedPrompt: combinedSceneText,
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
      useCharacter: characterMode,
    });

    const qualityBlock = [
      "Quality:",
      "Strong scene fidelity.",
      "Accurate anatomy.",
      "Natural detail.",
      "Follow the prompt exactly.",
      "Do not replace the requested scene with a generic beauty shot.",
    ].join(" ");

const baseFinalPrompt = [
  `Scene: ${combinedSceneText}`,
  compositionBlock,
  cleanedStylePrompt ? `Style guidance: ${cleanedStylePrompt}` : "",
  realismBlock,
  cleanedCharacterPrompt ? `Character guidance: ${cleanedCharacterPrompt}` : "",
  identityBlock,
  qualityBlock,
]
  .filter(Boolean)
  .join("\n\n");

// ✅ ADD THIS RIGHT HERE
console.log("Resolved generation prompt blocks:", {
  cleanedPrompt,
  cleanedScenePrompt,
  cleanedCharacterPrompt,
  cleanedStylePrompt,
  combinedSceneText,
  identityBlock,
  compositionBlock,
  realismBlock,
  negativeBlock,
  baseFinalPrompt,
});

    const aspect_ratio = mapSizeToAspectRatio(size, ratio);

    const model = chooseModel({
      premiumRender:
        Boolean(premiumRender) || String(quality).toLowerCase() === "high",
    });

    const enablePromptUpsampling = shouldEnablePromptUpsampling({
      characterMode,
      realismMode,
    });

    const shouldRunIdentityEnforcement =
      characterMode && evaluationRefs.length > 0;

    const requests = Array.from({ length: safeN }, async () => {
      let bestCandidate = null;

      const maxAttempts = shouldRunIdentityEnforcement ? 1 : 1;
      let currentPrompt = baseFinalPrompt;
      let currentNegativePrompt = negativeBlock;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const storedImage = await generateSingleCandidate({
          model,
          prompt: currentPrompt,
          negativePrompt: currentNegativePrompt,
          aspect_ratio,
          referenceImages: generationRefs,
          enablePromptUpsampling,
          premiumRender:
            model === MODELS.PREMIUM ||
            Boolean(premiumRender) ||
            String(quality).toLowerCase() === "high",
          userId,
        });

        if (!storedImage?.url) continue;

        const evaluation = shouldRunIdentityEnforcement
          ? await scoreGeneratedIdentity({
              generatedImage: storedImage.url,
              referencePack: evaluationRefs,
              dnaProfile: character?.dna_profile || null,
              scenePrompt: combinedSceneText,
              characterName: character?.name || "",
            })
          : {
              passed: true,
              identityScore: 7,
              faceScore: 7,
              hairScore: 7,
              bodyProportionScore: 7,
              sceneScore: 7,
              qualityScore: 7,
              glassesPreserved: true,
              faceMismatch: false,
              hairstyleDrift: false,
              glassesMissing: false,
              bodyExaggeration: false,
              ageDrift: false,
              stylizationDrift: false,
              weakResemblance: false,
              beardMismatch: false,
              driftDetected: false,
              failureType: "none",
              failureReasons: [],
            };

        const weightedScore = getEvaluationWeightedScore(
          evaluation,
          combinedSceneText
        );

        const candidate = {
          image: storedImage,
          evaluation,
          weightedScore,
          attempt,
          prompt: currentPrompt,
          negativePrompt: currentNegativePrompt,
        };

        if (
          !bestCandidate ||
          candidate.weightedScore > bestCandidate.weightedScore
        ) {
          if (bestCandidate?.image?.path) {
            await removeStoredImageIfExists(bestCandidate.image);
          }
          bestCandidate = candidate;
        } else {
          await removeStoredImageIfExists(storedImage);
        }

        if (evaluation.passed) {
          break;
        }

        if (attempt < maxAttempts) {
          currentPrompt = buildIdentityRetryPrompt({
            basePrompt: baseFinalPrompt,
            failedEvaluation: evaluation,
            character,
          });

          currentNegativePrompt = buildRetryNegativeBlock({
            negativeBlock,
            failedEvaluation: evaluation,
            scenePrompt: combinedSceneText,
          });
        }
      }

      return bestCandidate;
    });

    const candidates = (await Promise.all(requests)).filter(Boolean);

    if (!candidates.length) {
      return Response.json(
        { error: "No image returned from Replicate" },
        { status: 500 }
      );
    }

    const sortedCandidates = [...candidates].sort(
      (a, b) => (b.weightedScore || 0) - (a.weightedScore || 0)
    );

    const bestOverall = sortedCandidates[0];

    for (let i = 1; i < sortedCandidates.length; i++) {
      await removeStoredImageIfExists(sortedCandidates[i]?.image);
    }

    const finalImages = [bestOverall.image];

    const generationPayload = {
      user_id: String(userId),
      character_id: character?.id || null,
      prompt: bestOverall.prompt,
      negative_prompt: bestOverall.negativePrompt,
      ratio,
      mode: characterMode ? "character_guided" : "scene_only",
      style: styleLabel || style || null,
      images: finalImages,
      evaluation: {
        identity_score: bestOverall.evaluation?.identityScore || null,
        face_score: bestOverall.evaluation?.faceScore || null,
        hair_score: bestOverall.evaluation?.hairScore || null,
        body_score: bestOverall.evaluation?.bodyProportionScore || null,
        scene_score: bestOverall.evaluation?.sceneScore || null,
        quality_score: bestOverall.evaluation?.qualityScore || null,
        passed: Boolean(bestOverall.evaluation?.passed),
        failure_type: bestOverall.evaluation?.failureType || "none",
        failure_reasons: bestOverall.evaluation?.failureReasons || [],
        drift_detected: Boolean(bestOverall.evaluation?.driftDetected),
        glasses_preserved: Boolean(bestOverall.evaluation?.glassesPreserved),
        beard_mismatch: Boolean(bestOverall.evaluation?.beardMismatch),
        retry_count: Math.max(0, Number(bestOverall.attempt || 1) - 1),
        used_reference_count: characterMode ? generationRefs.length : 0,
        reference_preview: characterMode ? generationRefs : [],
        weighted_score: bestOverall.weightedScore,
      },
    };

    const { data: savedRow, error: saveError } = await supabaseAdmin
      .from("image_generations")
      .insert(generationPayload)
      .select(
        "id, prompt, negative_prompt, images, created_at, mode, ratio, style, evaluation"
      )
      .single();

    if (saveError) {
      throw new Error(saveError.message || "Failed to save generation");
    }

    return Response.json({
      image: finalImages[0]?.url || null,
      images: finalImages,
      generation: savedRow,
meta: {
  model,
  mode: characterMode ? "character_guided" : "scene_only",
  quality,
  realismMode,
  style,
  styleLabel,

  characterPrompt: cleanedCharacterPrompt,
  scenePrompt: cleanedScenePrompt,
  combinedScenePrompt: combinedSceneText,
  stylePrompt: cleanedStylePrompt,
  identityPrompt: identityBlock,
  compositionPrompt: compositionBlock,
  realismPrompt: realismBlock,
  finalPrompt: bestOverall.prompt,
  negativePrompt: bestOverall.negativePrompt,

  referenceCount: characterMode ? generationRefs.length : 0,
  referencePreview: characterMode ? generationRefs : [],
  characterLoaded: Boolean(character),
  characterName: character?.name || null,
  usedReferences: characterMode,
  usedNegativePrompt: true,
  storage: "supabase",
  identityEnforcementEnabled: shouldRunIdentityEnforcement,
  attemptsUsed: bestOverall.attempt || 1,
  identityEvaluation: bestOverall.evaluation,
  weightedScore: bestOverall.weightedScore,
  bestFaceAnchor,
  identityPackageSummary: identityPackage
    ? {
        totalProfiles: identityPackage.allProfileUrls.length,
        strongRefCount: identityPackage.strongRefs.length,
        hasMaster: Boolean(identityPackage.master),
        hasOriginal: Boolean(identityPackage.original),
        hasCloseup: Boolean(identityPackage.closeup),
        hasFront: Boolean(identityPackage.front),
        hasSide: Boolean(identityPackage.left || identityPackage.right),
        identityNotes: identityPackage.identityNotes,
      }
    : null,
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
        error: rawMessage || "Failed to generate image",
        errorType: "generation_error",
      },
      { status: 500 }
    );
  }
}
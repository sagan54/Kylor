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

  CHARACTER_ID:
    "zsxkib/dream-o:efe92b897afb0e7da9f83d0f2ee20355c3a48fa5553c46ffbc4c111f5ca87dbb",

  // ✅ NEW MODEL
  INSTANT_ID:
    "grandlineai/instant-id-photorealistic:03914a0c3326bf44383d0cd84b06822618af879229ce5d1d53bef38d93b68279",
};

const SCENE_TYPES = {
  PORTRAIT: "portrait",
  CLOSEUP: "closeup",
  SIDE: "side",
  FULL_BODY: "full_body",
  WIDE: "wide",
  ACTION: "action",
  SCENE: "scene",
};

const MODEL_ROUTES = {
  SCENE_ONLY: "scene_only",
  IDENTITY_FIRST: "identity_first",
  SCENE_FIRST: "scene_first",
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

  if (sceneType === SCENE_TYPES.CLOSEUP) {
    pushRef(closeup);
    pushRef(master);
    pushRef(original);
    pushRef(front);
  } else if (sceneType === SCENE_TYPES.PORTRAIT) {
    pushRef(closeup);
    pushRef(master);
    pushRef(original);
  } else if (sceneType === SCENE_TYPES.SIDE) {
    pushRef(closeup);
    pushRef(master);
    pushRef(left || right);
    pushRef(original);
  } else if (sceneType === SCENE_TYPES.FULL_BODY) {
    pushRef(closeup);
    pushRef(master);
    pushRef(front);
    pushRef(original);
  } else if (
    sceneType === SCENE_TYPES.WIDE ||
    sceneType === SCENE_TYPES.ACTION
  ) {
    pushRef(master);
    pushRef(closeup);
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
  sceneType = SCENE_TYPES.SCENE,
  maxRefs = 4,
}) {
  const refs = [];

  const pushRef = (url) => {
    const normalized = normalizeReferenceImage(url);
    if (!normalized) return;
    if (refs.includes(normalized)) return;
    refs.push(normalized);
  };

  if (!identityPackage) {
    for (const url of frontendRefs || []) {
      if (refs.length >= maxRefs) break;
      pushRef(url);
    }
    return refs.slice(0, maxRefs);
  }

  if (sceneType === SCENE_TYPES.CLOSEUP) {
    pushRef(identityPackage?.closeup?.url);
    pushRef(identityPackage?.master?.url);
    pushRef(identityPackage?.original?.url);
    pushRef(identityPackage?.front?.url);
  } else if (sceneType === SCENE_TYPES.PORTRAIT) {
    pushRef(identityPackage?.closeup?.url);
    pushRef(identityPackage?.master?.url);
    pushRef(identityPackage?.front?.url);
    pushRef(identityPackage?.original?.url);
  } else if (sceneType === SCENE_TYPES.SIDE) {
    pushRef(identityPackage?.left?.url);
    pushRef(identityPackage?.right?.url);
    pushRef(identityPackage?.closeup?.url);
    pushRef(identityPackage?.master?.url);
  } else if (sceneType === SCENE_TYPES.FULL_BODY) {
    pushRef(identityPackage?.front?.url);
    pushRef(identityPackage?.closeup?.url);
    pushRef(identityPackage?.master?.url);
    pushRef(identityPackage?.original?.url);
  } else if (
    sceneType === SCENE_TYPES.WIDE ||
    sceneType === SCENE_TYPES.ACTION
  ) {
    pushRef(identityPackage?.master?.url);
    pushRef(identityPackage?.closeup?.url);
    pushRef(identityPackage?.front?.url);
    pushRef(identityPackage?.original?.url);
  } else {
    pushRef(identityPackage?.closeup?.url);
    pushRef(identityPackage?.master?.url);
    pushRef(identityPackage?.front?.url);
    pushRef(identityPackage?.original?.url);
  }

  for (const item of identityPackage?.allProfiles || []) {
    if (refs.length >= maxRefs) break;
    pushRef(item?.url);
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

  const hasAny = (words = []) => words.some((word) => t.includes(word));

  const closeupWords = [
    "close up",
    "close-up",
    "extreme close up",
    "extreme close-up",
    "face shot",
    "headshot",
    "head shot",
    "tight portrait",
    "only face",
    "face only",
    "facial shot",
  ];

  const portraitWords = [
    "portrait",
    "waist up",
    "chest up",
    "bust shot",
    "upper body",
    "medium close",
    "medium-close",
    "shoulders up",
    "beauty shot",
  ];

  const sideWords = [
    "side profile",
    "profile shot",
    "left profile",
    "right profile",
    "side view",
    "from the side",
    "90 degree profile",
    "profile angle",
    "side angle",
    "profile view",
    "looking sideways",
  ];

  const fullBodyWords = [
    "full body",
    "full-body",
    "head to toe",
    "head-to-toe",
    "standing full",
    "entire body",
    "whole body",
  ];

  const wideWords = [
    "wide shot",
    "wide frame",
    "wide cinematic",
    "epic wide",
    "environment shot",
    "establishing shot",
    "landscape frame",
    "long shot",
    "distant shot",
    "cinematic scene",
    "movie still",
  ];

  const actionWords = [
    "action scene",
    "running through",
    "explosion",
    "fight scene",
    "chasing",
    "jumping",
    "dramatic motion",
    "combat",
    "battle",
    "car chase",
    "sprinting",
    "falling",
    "dynamic pose",
    "boxing",
    "fight",
    "training",
    "gym",
    "workout",
  ];

  if (hasAny(closeupWords)) return SCENE_TYPES.CLOSEUP;
  if (hasAny(sideWords)) return SCENE_TYPES.SIDE;
  if (hasAny(actionWords)) return SCENE_TYPES.ACTION;
  if (hasAny(fullBodyWords)) return SCENE_TYPES.FULL_BODY;
  if (hasAny(wideWords)) return SCENE_TYPES.WIDE;
  if (hasAny(portraitWords)) return SCENE_TYPES.PORTRAIT;

  if (t.includes("close") && (t.includes("face") || t.includes("eyes"))) {
    return SCENE_TYPES.CLOSEUP;
  }

  if (t.includes("full") && (t.includes("body") || t.includes("standing"))) {
    return SCENE_TYPES.FULL_BODY;
  }

  if (t.includes("wide") || t.includes("cinematic") || t.includes("environment")) {
    return SCENE_TYPES.WIDE;
  }

  return SCENE_TYPES.SCENE;
}

function stripPromptLabel(text = "", label = "scene:") {
  const value = String(text || "").trim();
  if (!value) return "";
  if (value.toLowerCase().startsWith(label.toLowerCase())) {
    return value.slice(label.length).trim();
  }
  return value;
}

function buildSceneBlock({ prompt, scenePrompt }) {
  const rawScene = stripPromptLabel(normalizeText(scenePrompt), "scene:");
  const rawPrompt = stripPromptLabel(normalizeText(prompt), "scene:");

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

function buildRouteAwareIdentityBlock({
  modelRoute,
  character,
  identityPackage = null,
  combinedPrompt = "",
}) {
  if (!character && !identityPackage) return "";

  const promptText = String(combinedPrompt || "").toLowerCase();
  const actionScene = isGymOrActionScene(promptText);
  const traits = detectReferenceTraits(identityPackage, character);

  if (modelRoute === MODEL_ROUTES.IDENTITY_FIRST) {
    const lines = [
      "Use the supplied reference images as the exact same real person.",
      "Identity accuracy is the highest priority.",
      "Keep the same face width, face length, cheek fullness, jaw softness, chin size, lip volume, nose shape, eye shape, eyebrow shape, beard density, skin tone, and hairline.",
      "Do not beautify, idealize, sharpen, or reinterpret the face.",
      "Do not make the face thinner.",
      "Do not sharpen the jawline.",
      "Do not enlarge or puff the lips.",
      "Do not turn the person into a generic actor, model, cinematic hero, or polished portrait subject.",
      "The output must feel like a photograph of the same person, not an enhanced reinterpretation.",
    ];

    if (traits.wearsGlasses) {
      lines.push(
        "Keep the glasses present and consistent with the identity references.",
        "Do not resize, redesign, or restyle the glasses."
      );
    }

    if (actionScene) {
      lines.push(
        "Even in an action or gym scene, the face must remain the same real person.",
        "Do not transform the face into a sharper, stronger, more heroic version."
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

  if (modelRoute === MODEL_ROUTES.SCENE_FIRST) {
    const lines = [
      "The generated person must remain the exact same individual as the supplied reference images.",
      "Preserve facial identity even in a wide cinematic frame.",
      "Keep the same recognizable face, hair, skin tone, body proportions, and silhouette.",
      "Do not replace the person with a generic cinematic character.",
      "Do not beautify, stylize, sharpen, or redesign the face.",
      "Even if the person appears smaller in frame, the identity must still match the references.",
      "Environment, lighting, and cinematic scale must not overwrite identity.",
    ];

    if (traits.wearsGlasses) {
      lines.push(
        "If glasses are part of the character identity, keep them present and consistent."
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

  return "";
}

function buildRouteAwareQualityBlock({
  modelRoute,
  characterMode = false,
}) {
  if (!characterMode) {
    return [
      "Quality:",
      "Strong scene fidelity.",
      "Accurate anatomy.",
      "Natural detail.",
      "Follow the prompt exactly.",
      "Do not replace the requested scene with a generic beauty shot.",
    ].join(" ");
  }

  if (modelRoute === MODEL_ROUTES.IDENTITY_FIRST) {
    return [
      "Quality:",
      "Strong identity fidelity.",
      "Accurate facial anatomy.",
      "Natural facial detail.",
      "Real-person realism.",
      "Follow the prompt exactly.",
      "Do not replace the requested scene with a beauty shot, glamour portrait, polished cinematic face, or premium editorial portrait.",
    ].join(" ");
  }

  if (modelRoute === MODEL_ROUTES.SCENE_FIRST) {
    return [
      "Quality:",
      "Strong cinematic scene fidelity.",
      "Preserve the requested environment, framing, and scale.",
      "Keep accurate anatomy and believable body proportions.",
      "Maintain the same real-person identity inside the cinematic scene.",
      "Do not replace the person with a generic movie character.",
    ].join(" ");
  }

  return [
    "Quality:",
    "Strong realism.",
    "Accurate anatomy.",
    "Follow the prompt exactly.",
  ].join(" ");
}

function buildCompositionBlock({
  combinedPrompt,
  ratio,
  characterMode = false,
  sceneType = SCENE_TYPES.SCENE,
}) {
  const text = combinedPrompt.toLowerCase();

  const wantsCloseup =
    sceneType === SCENE_TYPES.CLOSEUP ||
    sceneType === SCENE_TYPES.PORTRAIT ||
    text.includes("close-up") ||
    text.includes("close up") ||
    text.includes("portrait") ||
    text.includes("headshot") ||
    text.includes("face shot");

  const wantsFullBody =
    sceneType === SCENE_TYPES.FULL_BODY ||
    text.includes("full body") ||
    text.includes("full-body") ||
    text.includes("head to toe") ||
    text.includes("head-to-toe");

  const wantsWide =
    sceneType === SCENE_TYPES.WIDE ||
    sceneType === SCENE_TYPES.ACTION ||
    text.includes("wide shot") ||
    text.includes("wide-angle") ||
    text.includes("environment visible") ||
    ratio === "16:9" ||
    ratio === "21:9";

  // PRIORITY: sceneType overrides everything

if (
  sceneType === SCENE_TYPES.CLOSEUP ||
  sceneType === SCENE_TYPES.PORTRAIT
) {
  return [
    "Composition:",
    "Use close-up or portrait framing.",
    "Keep the face clearly visible.",
    "Do not beautify or idealize the person.",
  ].join(" ");
}

if (
  sceneType === SCENE_TYPES.FULL_BODY
) {
  return [
    "Composition:",
    "Use full-body framing.",
    "Show the entire subject clearly from head to toe.",
    "Keep proportions natural and undistorted.",
  ].join(" ");
}

if (
  sceneType === SCENE_TYPES.WIDE ||
  sceneType === SCENE_TYPES.ACTION
) {
  return [
    "Composition:",
    "Use wide cinematic framing.",
    "Show environment clearly and prominently.",
    "Subject should be integrated into the scene, not dominating the frame.",
    "Do NOT turn this into a portrait or close-up.",
  ].join(" ");
}

// fallback
return [
  "Composition:",
  "Follow the requested framing.",
  characterMode
    ? "Use natural photographic framing."
    : "Use cinematic framing.",
].join(" ");
}

// FIX 5 — upgraded realism block with anti-AI-polish instructions
function buildRealismBlock({ realismMode = "realistic", characterMode = false }) {
  const mode = String(realismMode || "realistic").toLowerCase();

if (characterMode) {
  return [
    "Realism: Natural real-person photography.",
    "Visible skin texture, pores, subtle unevenness, natural under-eye detail, and realistic facial imperfections.",
    "Keep authentic human skin, not polished portrait skin.",
    "Preserve natural asymmetry in eyes, lips, jaw, and facial contours.",
    "Do NOT apply beauty filtering, skin smoothing, glamour lighting, face enhancement, portrait polishing, or cosmetic cleanup.",
    "Do NOT make the subject look prettier, sharper, cleaner, younger, or more symmetrical than the real reference.",
    "Avoid cinematic face enhancement, avoid model-like rendering, avoid editorial beauty portrait styling.",
    "The result should feel like a real camera photo of an ordinary human subject, not a premium AI portrait.",
  ].join(" ");
}

  if (mode === "hyper") {
    return [
      "Realism: Hyper-photorealistic.",
      "Natural texture, believable light, strong realism.",
      "Avoid waxy skin, fake smoothness, and artificial beauty-filter rendering.",
    ].join(" ");
  }

  if (mode === "standard") {
    return [
      "Realism: Clean realistic image.",
      "Natural texture and believable light.",
      "Avoid synthetic skin and polished portrait rendering.",
    ].join(" ");
  }

  return [
    "Realism: Photorealistic.",
    "Natural texture, pores, subtle imperfections, and grounded lighting.",
    "Avoid artificial beauty-filter rendering or synthetic skin texture.",
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
    "different beard density",
    "thin face",
    "slimmer face",
    "sharp jaw",
    "sharp jawline",
    "defined jawline",
    "puffed lips",
    "fuller lips",
    "plump lips",
    "beautified face",
    "improved face",
    "perfect symmetry",
    "symmetrical face",
    "airbrushed face",
    "retouched skin",
    "glamour portrait",
    "studio beauty lighting",
    "handsome model face",
    "hero face",
    "refined facial structure",
    "clean perfect skin",
    "over-detailed cinematic portrait",
    "smaller nose",
    "sharper nose",
    "cleaner beard",
    "lighter beard",
    "thicker beard",
    "reshaped chin",
    "pointed chin",
    "smaller chin",
    "stronger cheekbones",
    "hollow cheeks",
    "face slimming",
    "beauty retouching",
    "skin retouching",
    "instagram face",
    "glass skin",
"luxury portrait retouching",
"editorial portrait",
"fashion portrait",
"beauty editorial",
"cinematic beauty lighting",
"clean luxury skin",
"perfect skin texture",
"cosmetic skin enhancement",
"retouched pores",
"beauty campaign face",
"overcorrected symmetry",
"premium portrait finish",
"ai glamour face",
"face cleanup",
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
  sceneType,
}) {
  if (!characterMode) {
    return {
      model: premiumRender ? MODELS.SCENE_PREMIUM : MODELS.SCENE,
      route: MODEL_ROUTES.SCENE_ONLY,
    };
  }

  if (
    sceneType === SCENE_TYPES.CLOSEUP ||
    sceneType === SCENE_TYPES.PORTRAIT ||
    sceneType === SCENE_TYPES.SIDE
  ) {
    return {
      model: MODELS.CHARACTER_ID,
      route: MODEL_ROUTES.IDENTITY_FIRST,
    };
  }

  return {
    model: premiumRender ? MODELS.SCENE_PREMIUM : MODELS.SCENE,
    route: MODEL_ROUTES.SCENE_FIRST,
  };
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

  // FIXED 16:9 (valid)
  "16:9": { width: 1024, height: 768 },

  // FIXED vertical
  "9:16": { width: 768, height: 1024 },

  "3:2":  { width: 1024, height: 682 },
  "2:3":  { width: 682,  height: 1024 },

  "4:5":  { width: 819,  height: 1024 },
  "5:4":  { width: 1024, height: 819 },

  "4:3":  { width: 1024, height: 768 },
};

  const dims = sizeMap[aspect_ratio] || sizeMap["1:1"];

  // FIX 6 — detect if third ref is a body view (less face-reliable)
  const thirdProfile = identityPackage?.allProfiles?.find((p) => p.url === thirdRef);
const thirdView = thirdProfile?.view || "";

const thirdIsBodyView =
  thirdView === "front" ||
  thirdView === "back" ||
  thirdView === "reference";

  const input = {
    prompt,
    neg_prompt: negativePrompt || "",
    ref_image1: primaryRef,
    ref_task1: "id",
    width:  dims.width,
    height: dims.height,
    // FIX 1 — raised from guidance:3.0/num_steps:12
    guidance: 4.5,
    num_steps: 22,
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

function buildInstantIDInput({
  prompt,
  negativePrompt,
  referenceImages = [],
}) {
  const faceImage = referenceImages?.[0] || null;

  if (!faceImage) {
    throw new Error("InstantID requires at least one face reference image.");
  }

  return {
    image: faceImage,
    prompt,
    negative_prompt: negativePrompt || "",
  };
}

async function createReplicatePrediction({ model, input }) {
  if (!model || typeof model !== "string") {
    throw new Error("Invalid model target");
  }

  // ✅ ALWAYS use predictions.create (modern safe way)
  if (model.includes(":")) {
    const [, version] = model.split(":");

    return await replicate.predictions.create({
      version,
      input,
    });
  }

  // fallback for model slug
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
  normalizeText(scenePrompt) || normalizeText(prompt)
);

    const identityPackage = character
      ? buildIdentityPackage(character, anchorRows, sceneType)
      : null;

const generationRefs = character
  ? selectGenerationReferenceImages({
      identityPackage,
      frontendRefs,
      sceneType,
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

const modelDecision = chooseModel({
  characterMode,
  premiumRender:
    Boolean(premiumRender) || String(quality).toLowerCase() === "high",
  sceneType,
});

const model = modelDecision.model;
const modelRoute = modelDecision.route;

const hasRefs = generationRefs.length > 0;
const cleanedPrompt = sanitizeSensitiveSceneText(normalizeText(prompt));
const cleanedScenePrompt = sanitizeSensitiveSceneText(normalizeText(scenePrompt));
const cleanedCharacterPrompt = normalizeText(characterPrompt);
const cleanedStylePrompt = normalizeText(stylePrompt);
const cleanedNegativePrompt = normalizeText(negativePrompt);

    const combinedSceneText = buildSceneBlock({
      prompt:      cleanedPrompt,
      scenePrompt: cleanedScenePrompt,
    });

    const strictIdentityBlock = characterMode
      ? buildRouteAwareIdentityBlock({
          modelRoute,
          character,
          identityPackage,
          combinedPrompt: combinedSceneText,
        })
      : buildIdentityBlock({
          characterMode: false,
          hasRefs,
          character: null,
          identityPackage: null,
          combinedPrompt: combinedSceneText,
        });

let compositionBlock = buildCompositionBlock({
  combinedPrompt: combinedSceneText,
  ratio,
  characterMode,
  sceneType,
});

// 🚨 HARD OVERRIDE (guaranteed correct behavior)
if (
  sceneType === SCENE_TYPES.WIDE ||
  sceneType === SCENE_TYPES.ACTION
) {
  compositionBlock = [
    "Composition:",
    "Use wide cinematic framing.",
    "Show environment clearly and prominently.",
    "Subject should be part of the scene, not dominating the frame.",
    "Do NOT turn this into a portrait or close-up.",
  ].join(" ");
}

if (sceneType === SCENE_TYPES.FULL_BODY) {
  compositionBlock = [
    "Composition:",
    "Use full-body framing.",
    "Show the entire subject clearly from head to toe.",
  ].join(" ");
}

if (
  sceneType === SCENE_TYPES.CLOSEUP ||
  sceneType === SCENE_TYPES.PORTRAIT
) {
  compositionBlock = [
    "Composition:",
    "Use close-up or portrait framing.",
    "Keep the face clearly visible.",
  ].join(" ");
}

const realismBlock = buildRealismBlock({
  realismMode,
  characterMode,
});

    const negativeBlock = buildNegativeBlock({
      negativePrompt: cleanedNegativePrompt,
      combinedPrompt: combinedSceneText,
      useCharacter:   characterMode,
    });

const qualityBlock = buildRouteAwareQualityBlock({
  modelRoute,
  characterMode,
});

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
        prompt: currentPrompt,
        negativePrompt: currentNegativePrompt,
        referenceImages: generationRefs,
        aspect_ratio,
        identityPackage,
      })
    : model === MODELS.INSTANT_ID
    ? buildInstantIDInput({
        prompt: currentPrompt,
        negativePrompt: currentNegativePrompt,
        referenceImages: generationRefs,
      })
    : buildFluxInput({
        prompt: currentPrompt,
        negativePrompt: currentNegativePrompt,
        aspect_ratio,
        enablePromptUpsampling,
        premiumRender:
          model === MODELS.SCENE_PREMIUM ||
          Boolean(premiumRender) ||
          String(quality).toLowerCase() === "high",
        referenceImages: generationRefs,
      });

    console.log("Replicate routing:", {
  model,
  modelRoute,
  sceneType,
  characterMode,
  referenceCount: generationRefs.length,
});
    console.log("Replicate input:", JSON.stringify(input, null, 2));

const prediction = await createReplicatePrediction({
  model,
  input,
});

if (!prediction) {
  throw new Error("Failed to create prediction");
}

const jobPayload = {
  prediction_id: prediction.id,
  user_id: String(userId),
  character_id: character?.id || null,
  prompt: currentPrompt,
  negative_prompt: currentNegativePrompt,
  ratio,
  mode: characterMode ? "character_guided" : "scene_only",
  style: styleLabel || style || null,
  meta: {
    referencePreview: generationRefs,
    finalPrompt: currentPrompt,
    negativePrompt: currentNegativePrompt,
    characterPrompt: cleanedCharacterPrompt,
    scenePrompt: cleanedScenePrompt,
    combinedScenePrompt: combinedSceneText,
    stylePrompt: cleanedStylePrompt,
    identityPrompt: strictIdentityBlock,
    compositionPrompt: compositionBlock,
    realismPrompt: realismBlock,
    characterLoaded: Boolean(character),
    characterName: character?.name || null,
    sceneType,
    modelRoute,
    modelUsed: model,
    referenceCount: generationRefs.length,
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
  status: prediction.status,
  predictionId: prediction.id,
  model,
  mode: characterMode ? "character_guided" : "scene_only",
  meta: {
    referencePreview: generationRefs,
    finalPrompt: currentPrompt,
    negativePrompt: currentNegativePrompt,
    sceneType,
    modelRoute,
    referenceCount: generationRefs.length,
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
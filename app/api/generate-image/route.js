import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    .select("id, image_url, storage_path, source_type, pack_view, is_canon, is_cover, metadata, sort_order, created_at")
    .eq("character_id", characterId)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error || !Array.isArray(data)) {
    console.error("loadCharacterAnchorImages failed:", error);
    return [];
  }

  return data;
}

function getCharacterImageUrl(row) {
  if (!row || typeof row !== "object") return null;
  return normalizeReferenceImage(
    row.image_url ||
    row.url ||
    row.publicUrl ||
    row.src ||
    null
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
        (item && typeof item === "object" && (item.pack_view || item.view || item.type)) || "anchor";

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

function buildSmartReferencePack(character, anchorRows = []) {
  const pool = buildCharacterProfilePool(character, anchorRows);

  if (!pool.length) return [];

  const sorted = [...pool].sort((a, b) => (b.score || 0) - (a.score || 0));

  const byView = (view) => sorted.find((item) => item.view === view);
  const byType = (type) => sorted.find((item) => item.type === type);

  const selected = [];

  const pushIfPresent = (item) => {
    if (!item?.url) return;
    if (selected.some((s) => s.url === item.url)) return;
    selected.push(item);
  };

  // Best identity anchors first
  pushIfPresent(byType("master_image"));
  pushIfPresent(byType("reference_image"));
  pushIfPresent(byView("closeup"));
  pushIfPresent(byView("front"));
  pushIfPresent(byView("left"));
  pushIfPresent(byView("right"));

  // Fallbacks if we still have too few
  for (const item of sorted) {
    if (selected.length >= 5) break;
    pushIfPresent(item);
  }

  return selected.slice(0, 5);
}

function buildCharacterReferences(character, anchorRows = []) {
  const pack = buildSmartReferencePack(character, anchorRows);
  return pack.map((item) => item.url).filter(Boolean).slice(0, 5);
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
    Array.isArray(traits.distinguishingFeatures) && traits.distinguishingFeatures.length
      ? `Distinguishing features: ${traits.distinguishingFeatures.join(", ")}`
      : "",
  ].filter(Boolean);

  return parts.join(". ");
}

function normalizeReferenceImage(image) {
  if (!image || typeof image !== "string") return null;

  if (image.startsWith("data:image/")) return image;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;

  return null;
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

function buildIdentityBlock({
  useCharacter,
  hasRefs,
  characterPrompt,
  character,
  referenceCount = 0,
}) {
  if (!useCharacter && !hasRefs && !character) return "";

  const dnaText = buildDnaIdentityText(character);

  const lines = [
    "Identity lock:",
    "Use the exact same real person from the provided saved character profile set.",
    "All references belong to the same person and must be treated as one identity package.",
    "This must remain the same individual, not a reinterpretation.",
    "Preserve facial bone structure, cheek structure, jawline, eye shape, eyebrow shape, nose shape, lips, skin tone, hairline, hairstyle, beard pattern, and overall recognizable likeness.",
    "Do not beautify, idealize, glamorize, masculinize, stylize, or transform the subject into a different person.",
    "Do not change facial proportions.",
    "Do not lengthen hair, increase beard density, remove glasses, or add tattoos unless explicitly requested.",
    "Do not turn the subject into a bodybuilder, hero character, or fashion model unless explicitly requested.",
    "Keep the same identity even when outfit, pose, environment, camera framing, or action changes.",
  ];

  if (character?.name) {
    lines.push(`Character name: ${character.name}.`);
  }

  if (character?.description) {
    lines.push(`Character description: ${character.description}`);
  }

  if (referenceCount > 0) {
    lines.push(`Use all provided saved profile references together as one identity lock set. Reference count: ${referenceCount}.`);
  }

  if (characterPrompt && !character) {
    lines.push(`Character details: ${characterPrompt}`);
  }

  if (dnaText) {
    lines.push(`DNA lock: ${dnaText}`);
  }

  return lines.join(" ");
}

function buildSceneBlock({ prompt, scenePrompt }) {
  const rawScene = normalizeText(scenePrompt);
  const rawPrompt = normalizeText(prompt);

  // If frontend already sent a fully built prompt block, prefer the raw scenePrompt
  // to avoid duplicating Scene/Composition/Character instructions.
  if (rawScene) return rawScene;

  return rawPrompt;
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
      "Use a close-up or portrait framing only because the prompt asks for it.",
      "Keep the face clearly visible and preserve exact identity.",
      "Do not crop awkwardly or distort facial proportions.",
    ].join(" ");
  }

  if (wantsFullBody || wantsWide) {
    return [
      "Composition:",
      "Follow the requested scene exactly.",
      "Keep the environment clearly visible.",
      "Use full-body or wider framing only if requested by the prompt.",
      "Keep the face visible enough to preserve identity.",
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
      "Real-world lighting, realistic anatomy, realistic lens behavior, grounded depth of field.",
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
    "Avoid artificial beauty-filter skin or over-stylized cinematic rendering.",
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
  "fake beard",
  "doll-like face",
  "unrealistic muscles",
  "bodybuilder proportions",
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
  "tattoo",
  "chest tattoo",
  "neck tattoo",
  "missing glasses",
  "removed eyewear",
  "long flowing hair",
  "extra beard density",
  "male model face",
  "fitness model body",
  "heroic body proportions",
];

  if (useCharacter) {
    baseNegatives.push(
      "different person",
      "identity drift",
      "face change",
      "different hairstyle",
      "different beard pattern",
      "different skin tone"
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
  useCharacter,
  hasRefs,
  hasCharacter,
  realismMode,
  quality,
}) {
  const realism = String(realismMode || "realistic").toLowerCase();
  const q = String(quality || "medium").toLowerCase();
  const needsIdentityLock =
    Boolean(useCharacter) || Boolean(hasRefs) || Boolean(hasCharacter);

  if (needsIdentityLock && (realism === "hyper" || q === "high")) {
    return "black-forest-labs/flux-1.1-pro-ultra";
  }

  if (needsIdentityLock) {
    return "black-forest-labs/flux-1.1-pro";
  }

  if (realism === "hyper") {
    return "black-forest-labs/flux-1.1-pro";
  }

  return "black-forest-labs/flux-1.1-pro";
}

function shouldEnablePromptUpsampling({
  useCharacter,
  hasRefs,
  hasCharacter,
  realismMode,
}) {
  if (useCharacter || hasRefs || hasCharacter) return false;
  return String(realismMode || "realistic").toLowerCase() === "standard";
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
} = await req.json();

    if (!userId || !String(userId).trim()) {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }

    if (!prompt || !String(prompt).trim()) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    const character = characterId ? await loadCharacterData(characterId) : null;

    const anchorRows = characterId ? await loadCharacterAnchorImages(characterId) : [];

    const safeN = Math.min(Math.max(Number(n) || 1, 1), 4);

const frontendRefs = Array.isArray(referenceImages)
  ? referenceImages.map(normalizeReferenceImage).filter(Boolean).slice(0, 5)
  : [];

const characterRefs = character
  ? buildCharacterReferences(character, anchorRows)
  : [];

// When a saved character is selected, trust Kylor identity refs first.
// Only append uploaded refs if you really need them.
const refs = character
  ? [...new Set(characterRefs)].slice(0, 5)
  : [...new Set(frontendRefs)].slice(0, 5);

const hasRefs = refs.length > 0;
    const cleanedPrompt = normalizeText(prompt);
    const cleanedScenePrompt = normalizeText(scenePrompt);
    const cleanedCharacterPrompt = normalizeText(characterPrompt);
    const cleanedStylePrompt = normalizeText(stylePrompt);
    const cleanedNegativePrompt = normalizeText(negativePrompt);

    const combinedSceneText = buildSceneBlock({
      prompt: cleanedPrompt,
      scenePrompt: cleanedScenePrompt,
    });

const identityBlock = buildIdentityBlock({
  useCharacter: Boolean(useCharacter),
  hasRefs,
  characterPrompt: cleanedCharacterPrompt,
  character,
  referenceCount: refs.length,
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
  useCharacter: Boolean(useCharacter) || hasRefs || Boolean(character),
});

    const qualityBlock = [
      "Quality:",
      "Strong scene fidelity.",
      "Accurate anatomy.",
      "Natural detail.",
      "Follow the prompt exactly.",
      "Do not replace the requested scene with a generic beauty shot.",
    ].join(" ");

    const finalPrompt = [
      identityBlock,
      `Scene: ${combinedSceneText}`,
      compositionBlock,
      cleanedStylePrompt ? `Style guidance: ${cleanedStylePrompt}` : "",
      realismBlock,
      qualityBlock,
    ]
      .filter(Boolean)
      .join("\n\n");

    const aspect_ratio = mapSizeToAspectRatio(size, ratio);
    const useConsistencyModel = Boolean(useCharacter) || hasRefs || Boolean(character);

const model = chooseModel({
  useCharacter: Boolean(useCharacter),
  hasRefs,
  hasCharacter: Boolean(character),
  realismMode,
  quality,
});

const enablePromptUpsampling = shouldEnablePromptUpsampling({
  useCharacter: Boolean(useCharacter),
  hasRefs,
  hasCharacter: Boolean(character),
  realismMode,
});

    const requests = Array.from({ length: safeN }, async () => {
      let input;

      if (useConsistencyModel) {
        input = {
          prompt: finalPrompt,
          negative_prompt: negativeBlock,
          aspect_ratio,
          output_format: "png",
          reference_images: refs,
        };
      } else {
        input = {
          prompt: finalPrompt,
          negative_prompt: negativeBlock,
          aspect_ratio,
          output_format: "png",
          prompt_upsampling: enablePromptUpsampling,
        };
      }

      const output = await replicate.run(model, { input });
      const tempUrl = await fileOutputToUrl(output);

      if (!tempUrl) return null;

      const storedImage = await persistImageToSupabase({
        imageUrl: tempUrl,
        userId: String(userId),
        bucket: "generated-images",
      });

      return storedImage;
    });

    const images = (await Promise.all(requests)).filter(Boolean);

    if (!images.length) {
      return Response.json(
        { error: "No image returned from Replicate" },
        { status: 500 }
      );
    }

const generationPayload = {
  user_id: String(userId),
  character_id: character?.id || null,
  prompt: finalPrompt,
  negative_prompt: negativeBlock,
  ratio,
  mode: useConsistencyModel ? "consistency" : "standard",
  style: styleLabel || style || null,
  images,
};

    const { data: savedRow, error: saveError } = await supabaseAdmin
      .from("image_generations")
      .insert(generationPayload)
      .select("id, prompt, negative_prompt, images, created_at, mode, ratio, style")
      .single();

    if (saveError) {
      throw new Error(saveError.message || "Failed to save generation");
    }

    return Response.json({
      image: images[0]?.url || null,
      images,
      generation: savedRow,
meta: {
  model,
  mode: useConsistencyModel ? "consistency" : "standard",
  quality,
  realismMode,
  style,
  styleLabel,
  referenceCount: refs.length,
  referencePreview: refs,
  characterLoaded: Boolean(character),
  characterName: character?.name || null,
  usedReferences: useConsistencyModel,
  usedNegativePrompt: true,
  storage: "supabase",
},
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return Response.json(
      { error: error?.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}
import { createClient } from "@supabase/supabase-js";
import { fal } from "@fal-ai/client";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

fal.config({
  credentials: process.env.FAL_KEY,
});

const GENERATED_BUCKET = "generated-images";

// Use v4.5 by default.
// If you want Seedream 4.0 instead, change this to:
// "fal-ai/bytedance/seedream/v4/edit"
const SEEDREAM_MODEL = "fal-ai/bytedance/seedream/v4.5/edit";

const MAX_REFERENCE_IMAGES = 5;

function normalizeImageUrl(value) {
  const url = String(value || "").trim();
  if (!url) return null;

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:image/")
  ) {
    return url;
  }

  return null;
}

function mapSizeToSeedreamImageSize(size) {
  switch (size) {
    case "square":
    case "1:1":
      return "square_hd";
    case "portrait":
    case "4:5":
    case "3:4":
      return "portrait_4_3";
    case "9:16":
      return "portrait_16_9";
    case "16:9":
      return "landscape_16_9";
    case "4:3":
      return "landscape_4_3";
    default:
      return "landscape_16_9";
  }
}

function dedupeUrls(urls = []) {
  const seen = new Set();
  const output = [];

  for (const raw of urls) {
    const url = normalizeImageUrl(raw);
    if (!url) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    output.push(url);
  }

  return output;
}

function safeJsonParse(value, fallback = null) {
  try {
    if (typeof value === "string") return JSON.parse(value);
    if (value && typeof value === "object") return value;
    return fallback;
  } catch {
    return fallback;
  }
}

function getFileExtFromContentType(contentType) {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/png":
    default:
      return "png";
  }
}

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

async function loadCharacterImages(characterId) {
  if (!characterId) return [];

  const { data, error } = await supabaseAdmin
    .from("character_images")
    .select("*")
    .eq("character_id", characterId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data;
}

function scoreReferenceRow(row) {
  let score = 0;

  if (row?.is_canon) score += 100;
  if (row?.is_cover) score += 80;

  switch (row?.source_type) {
    case "master_identity":
      score += 120;
      break;
    case "upload":
      score += 90;
      break;
    case "generated":
      score += 40;
      break;
    default:
      break;
  }

  switch (row?.pack_view) {
    case "closeup":
      score += 80;
      break;
    case "front":
      score += 70;
      break;
    case "left":
    case "right":
      score += 55;
      break;
    case "master":
      score += 100;
      break;
    case "back":
      score += 10;
      break;
    default:
      break;
  }

  return score;
}

function pickBestIdentityReferences(character, rows) {
  const candidateUrls = [];

  const sortedRows = [...(rows || [])]
    .filter((row) => normalizeImageUrl(row?.image_url || row?.storage_path))
    .sort((a, b) => scoreReferenceRow(b) - scoreReferenceRow(a));

  // 1) Highest quality scored references first
  for (const row of sortedRows) {
    candidateUrls.push(row.image_url || row.storage_path);
  }

  // 2) Then direct character anchors
  candidateUrls.push(
    character?.master_image,
    character?.reference_image,
    character?.cover_image
  );

  // 3) Then older/generated leftovers
  const generatedImages = safeJsonParse(character?.generated_images, []);
  if (Array.isArray(generatedImages)) {
    for (const item of generatedImages) {
      if (typeof item === "string") candidateUrls.push(item);
      else if (item?.url) candidateUrls.push(item.url);
      else if (item?.image_url) candidateUrls.push(item.image_url);
    }
  }

  // Remove weak back views unless there are very few refs
  const deduped = dedupeUrls(candidateUrls);
  const filtered = deduped.filter((url) => {
    const row = (rows || []).find(
      (r) => (r.image_url || r.storage_path) === url
    );
    if (!row) return true;
    return row.pack_view !== "back";
  });

  return (filtered.length ? filtered : deduped).slice(0, MAX_REFERENCE_IMAGES);
}

function buildSeedreamPrompt({
  userPrompt,
  character,
  scenePrompt,
  style,
  ratio,
  identityRefs = [],
}) {
  const charName = character?.name || "the same character";

  const figureGuide = identityRefs
    .map((_, idx) => `Figure ${idx + 1}`)
    .join(", ");

  return `
Use ${figureGuide} as reference images of the SAME real person.

Highest priority:
Keep the exact same facial identity of ${charName}.
Do not create a different person.
Do not beautify or alter facial structure.
Keep the same face shape, eyes, nose, lips, hairstyle, hairline, skin tone, and age impression.

Reference rules:
- Figure 1 is the primary identity anchor.
- All other figures are supporting views of the same person.
- Keep identity locked even if angle, lighting, camera distance, pose, wardrobe, or environment changes.

Scene:
${scenePrompt || userPrompt || "Create a cinematic photorealistic scene."}

Style:
${style || "cinematic photorealistic still frame"}

Aspect ratio:
${ratio || "16:9"}

Quality:
photorealistic, natural skin texture, realistic lighting, realistic eyes, realistic hands, cinematic composition, no plastic skin, no beauty filter, one main subject unless explicitly requested otherwise.
`.trim();
}

async function downloadImageAsBuffer(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download generated image: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadGeneratedImage({
  userId,
  buffer,
  contentType = "image/png",
  fileExt = "png",
}) {
  const path = `${userId || "anonymous"}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${fileExt}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(GENERATED_BUCKET)
    .upload(path, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload generated image");
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from(GENERATED_BUCKET)
    .getPublicUrl(path);

  return {
    path,
    publicUrl: publicUrlData?.publicUrl || null,
  };
}

async function saveImageGeneration({
  userId,
  prompt,
  negativePrompt = "",
  images = [],
  mode = "image",
  ratio = "16:9",
  style = "cinematic",
  characterId = null,
  metadata = {},
}) {
  const payload = {
    user_id: userId || null,
    prompt,
    negative_prompt: negativePrompt,
    images,
    mode,
    ratio,
    style,
    character_id: characterId,
    metadata,
  };

  const { data, error } = await supabaseAdmin
    .from("image_generations")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("Failed to save image_generations row:", error);
    return null;
  }

  return data;
}

async function runSeedreamCharacterGeneration({
  prompt,
  imageSize,
  referenceUrls,
  seed,
}) {
  if (!Array.isArray(referenceUrls) || referenceUrls.length === 0) {
    throw new Error("No reference images available for Seedream generation.");
  }

let result;

try {
  result = await fal.subscribe(SEEDREAM_MODEL, {
    input: {
      prompt,
      image_urls: referenceUrls,
      image_size: imageSize,
      num_images: 1,
      max_images: 1,
      enable_safety_checker: true,
      ...(Number.isInteger(seed) ? { seed } : {}),
    },
    logs: true,
  });
} catch (err) {
  console.error("FAL subscribe failed:", err);
  throw new Error(err?.message || "FAL request failed");
}

  const outputImage = result?.data?.images?.[0];
  if (!outputImage?.url) {
    throw new Error("Seedream did not return an output image.");
  }

  return outputImage;
}

export async function POST(req) {
  try {
    const body = await req.json();

const {
  prompt,
  scenePrompt,
  negativePrompt = "",
  style = "cinematic",
  ratio = "16:9",
  size = "16:9",
  userId,
  characterId,
  saveToHistory = true,
  seed,
} = body || {};

    const finalPrompt = String(prompt || scenePrompt || "").trim();

    if (!finalPrompt) {
      return Response.json(
        { success: false, error: "Prompt is required." },
        { status: 400 }
      );
    }

    let character = null;
    let characterRows = [];
    let referenceUrls = [];

    if (characterId) {
      character = await loadCharacterData(characterId);

      if (!character) {
        return Response.json(
          { success: false, error: "Selected character not found." },
          { status: 404 }
        );
      }

      characterRows = await loadCharacterImages(characterId);
      referenceUrls = pickBestIdentityReferences(character, characterRows);

      if (!referenceUrls.length) {
        return Response.json(
          {
            success: false,
            error:
              "This character has no valid reference images. Generate or upload character references first.",
          },
          { status: 400 }
        );
      }
    }

    const usingCharacterMode = Boolean(characterId && referenceUrls.length > 0);

    let generatedRemote = null;
    let modelUsed = null;
    let provider = null;

    if (usingCharacterMode) {
const seedreamPrompt = buildSeedreamPrompt({
  userPrompt: finalPrompt,
  character,
  scenePrompt: scenePrompt || finalPrompt,
  style,
  ratio,
  identityRefs: referenceUrls,
});

console.log("Seedream request", {
  model: SEEDREAM_MODEL,
  characterId,
  referenceCount: referenceUrls.length,
  referenceUrls,
  size: size || ratio,
  seed,
});

generatedRemote = await runSeedreamCharacterGeneration({
  prompt: seedreamPrompt,
  imageSize: mapSizeToSeedreamImageSize(size || ratio),
  referenceUrls,
  seed,
});

      modelUsed = SEEDREAM_MODEL;
      provider = "fal";
    } else {
      return Response.json(
        {
          success: false,
          error:
            "No character selected. Reconnect your old FLUX/no-character generation path here before shipping.",
        },
        { status: 400 }
      );
    }

    const buffer = await downloadImageAsBuffer(generatedRemote.url);
const outputContentType = generatedRemote?.content_type || "image/png";
console.log("Seedream output", {
  url: generatedRemote?.url,
  contentType: generatedRemote?.content_type,
  width: generatedRemote?.width,
  height: generatedRemote?.height,
});
const uploaded = await uploadGeneratedImage({
  userId,
  buffer,
  contentType: outputContentType,
  fileExt: getFileExtFromContentType(outputContentType),
});

const savedRow = saveToHistory
  ? await saveImageGeneration({
      userId,
      prompt: finalPrompt,
      negativePrompt: negativePrompt || "",
      images: [uploaded.publicUrl].filter(Boolean),
      mode: "image",
      ratio,
      style,
      characterId: characterId || null,
      metadata: {
        provider,
        model: modelUsed,
        referenceUrls,
        generatedRemote,
        identityMode: usingCharacterMode ? "multi_reference_seedream" : null,
      },
    })
  : null;

return Response.json({
  success: true,
  image: uploaded.publicUrl,
  images: [uploaded.publicUrl].filter(Boolean),

  generation: savedRow || {
    id: crypto.randomUUID(),
    prompt: finalPrompt,
    negative_prompt: negativePrompt || "",
    ratio,
    mode: "image",
    style,
    created_at: new Date().toISOString(),
    images: [uploaded.publicUrl]
      .filter(Boolean)
      .map((url) => ({
        url,
        starred: false,
      })),
  },

  meta: {
    characterId: characterId || null,
    characterName: character?.name || null,
    usedCharacter: usingCharacterMode,

    characterPrompt: "",
    scenePrompt: scenePrompt || prompt || "",
    finalPrompt: finalPrompt,
    stylePrompt: "",
    identityPrompt: "",
    compositionPrompt: "",
    realismPrompt: "",
    provider,
    model: modelUsed,
    referenceCount: referenceUrls.length,
    referenceUrls,
    identityMode: usingCharacterMode ? "multi_reference_seedream" : null,
  },
});
  } catch (error) {
    console.error("generate-image route failed:", error);

    return Response.json(
      {
        success: false,
        error: error?.message || "Image generation failed.",
      },
      { status: 500 }
    );
  }
}
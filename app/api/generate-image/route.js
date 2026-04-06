import { tasks } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";
import Replicate from "replicate";
import {
  FLUX_MODEL,
  buildPrompt,
} from "../../../lib/image-generation-rules";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const GENERATED_BUCKET = "generated-images";
const MAX_REFERENCE_IMAGES = 5;
const SEEDREAM_MODEL = "fal-ai/bytedance/seedream/v4.5/edit";

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

async function fileOutputToUrl(output) {
  if (!output) return null;

  if (typeof output === "string") return output;

  if (Array.isArray(output)) {
    for (const item of output) {
      const url = await fileOutputToUrl(item);
      if (url) return url;
    }
    return null;
  }

  if (typeof output?.url === "function") {
    const url = await output.url();
    return typeof url === "string" ? url : String(url || "");
  }

  if (typeof output?.url === "string") return output.url;
  if (typeof output?.href === "string") return output.href;

  if (output?.output) {
    return await fileOutputToUrl(output.output);
  }

  const asString = String(output || "").trim();
  if (asString.startsWith("http://") || asString.startsWith("https://")) {
    return asString;
  }

  return null;
}

function getFileExtFromContentType(contentType = "") {
  const value = String(contentType).toLowerCase();

  if (value.includes("jpeg") || value.includes("jpg")) return "jpg";
  if (value.includes("webp")) return "webp";
  return "png";
}

async function downloadImageAsBuffer(imageUrl) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to download generated image: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const arrayBuffer = await response.arrayBuffer();

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
  };
}

async function uploadGeneratedImage({
  userId,
  buffer,
  contentType,
  fileExt,
  generationId,
}) {
  const safeUserId = userId || "anonymous";
  const filePath = `${safeUserId}/${generationId}.${fileExt}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(GENERATED_BUCKET)
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Supabase upload failed: ${uploadError.message}`);
  }

  const { data } = supabaseAdmin.storage
    .from(GENERATED_BUCKET)
    .getPublicUrl(filePath);

  return {
    publicUrl: data.publicUrl,
    storagePath: filePath,
  };
}

function mapSizeToAspectRatio(size = "", ratio = "1:1") {
  switch (String(size || ratio).toLowerCase()) {
    case "1024x1536":
    case "portrait":
    case "4:5":
    case "3:4":
      return "2:3";
    case "1536x1024":
    case "16:9":
      return "16:9";
    case "4:3":
      return "4:3";
    case "9:16":
      return "9:16";
    case "square":
    case "1:1":
    default:
      return "1:1";
  }
}

async function updateGenerationRow(generationId, patch) {
  const { data: existing } = await supabaseAdmin
    .from("image_generations")
    .select("metadata")
    .eq("id", generationId)
    .single();

  const nextPatch =
    patch?.metadata && typeof patch.metadata === "object"
      ? {
          ...patch,
          metadata: {
            ...(existing?.metadata || {}),
            ...patch.metadata,
          },
        }
      : patch;

  const { error } = await supabaseAdmin
    .from("image_generations")
    .update(nextPatch)
    .eq("id", generationId);

  if (error) {
    throw new Error(error.message || "Failed to update generation row");
  }
}

async function runDirectFluxGeneration({
  generationId,
  userId,
  prompt,
  scenePrompt,
  negativePrompt,
  style,
  ratio,
  size,
  seed,
}) {
  await updateGenerationRow(generationId, {
    metadata: {
      state: "processing",
      startedAt: new Date().toISOString(),
      provider: "replicate",
      model: FLUX_MODEL,
      identityMode: "prompt_only_flux",
    },
  });

  const output = await replicate.run(FLUX_MODEL, {
    input: {
      prompt: buildPrompt({
        scene: scenePrompt || prompt || "",
        style,
        negativePrompt,
        mode: "freeform",
      }),
      aspect_ratio: mapSizeToAspectRatio(size, ratio),
      output_format: "png",
      seed: typeof seed === "number" ? seed : undefined,
    },
  });

  const tempUrl = await fileOutputToUrl(output);

  if (!tempUrl) {
    throw new Error("No image URL returned from Replicate");
  }

  const downloaded = await downloadImageAsBuffer(tempUrl);
  const uploaded = await uploadGeneratedImage({
    userId,
    buffer: downloaded.buffer,
    contentType: downloaded.contentType,
    fileExt: getFileExtFromContentType(downloaded.contentType),
    generationId,
  });

  await updateGenerationRow(generationId, {
    images: [uploaded.publicUrl].filter(Boolean),
    style: style || "cinematic",
    mode: "image",
    metadata: {
      state: "succeeded",
      completedAt: new Date().toISOString(),
      provider: "replicate",
      model: FLUX_MODEL,
      storagePath: uploaded.storagePath,
      remoteUrl: tempUrl,
      negativePrompt: negativePrompt || "",
      identityMode: "prompt_only_flux",
    },
  });

  const { data: savedGeneration, error } = await supabaseAdmin
    .from("image_generations")
    .select("*")
    .eq("id", generationId)
    .single();

  if (error || !savedGeneration) {
    throw new Error("Image was generated but the saved record could not be loaded");
  }

  return savedGeneration;
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

  for (const row of sortedRows) {
    candidateUrls.push(row.image_url || row.storage_path);
  }

  candidateUrls.push(
    character?.master_image,
    character?.reference_image,
    character?.cover_image
  );

  const generatedImages = safeJsonParse(character?.generated_images, []);
  if (Array.isArray(generatedImages)) {
    for (const item of generatedImages) {
      if (typeof item === "string") candidateUrls.push(item);
      else if (item?.url) candidateUrls.push(item.url);
      else if (item?.image_url) candidateUrls.push(item.image_url);
    }
  }

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

async function createPendingGeneration({
  userId,
  prompt,
  negativePrompt = "",
  ratio = "16:9",
  style = "cinematic",
  characterId = null,
  metadata = {},
}) {
  const payload = {
    user_id: userId || null,
    prompt,
    negative_prompt: negativePrompt,
    images: [],
    mode: "image",
    ratio,
    style,
    character_id: characterId,
    metadata: {
      state: "processing",
      ...metadata,
    },
  };

  const { data, error } = await supabaseAdmin
    .from("image_generations")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create pending generation");
  }

  return data;
}

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      prompt,
      scenePrompt,
      characterPrompt = "",
      negativePrompt = "",
      style = "cinematic",
      ratio = "16:9",
      size = "16:9",
      userId,
      characterId,
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

    const pendingRow = await createPendingGeneration({
      userId,
      prompt: finalPrompt,
      negativePrompt: negativePrompt || "",
      ratio,
      style,
      characterId: characterId || null,
      metadata: {
        characterId: characterId || null,
        characterName: character?.name || null,
        characterPrompt: characterPrompt || "",
        usedCharacter: usingCharacterMode,
        referenceCount: referenceUrls.length,
        referenceUrls,
        identityMode: usingCharacterMode ? "multi_reference_seedream" : null,
        provider: usingCharacterMode ? "fal" : "replicate",
        model: usingCharacterMode ? SEEDREAM_MODEL : FLUX_MODEL,
      },
    });

    if (!usingCharacterMode) {
      try {
        const savedGeneration = await runDirectFluxGeneration({
          generationId: pendingRow.id,
          userId,
          prompt: finalPrompt,
          scenePrompt: scenePrompt || finalPrompt,
          negativePrompt: negativePrompt || "",
          style,
          ratio,
          size,
          seed,
        });

        return Response.json({
          success: true,
          status: "succeeded",
          predictionId: pendingRow.id,
          image: savedGeneration.images?.[0] || null,
          generation: savedGeneration,
          meta: {
            characterId: null,
            characterName: null,
            usedCharacter: false,
            scenePrompt: scenePrompt || prompt || "",
            finalPrompt,
            provider: "replicate",
            model: FLUX_MODEL,
            referenceCount: 0,
            referenceUrls: [],
            identityMode: "prompt_only_flux",
          },
        });
      } catch (generationError) {
        await updateGenerationRow(pendingRow.id, {
          metadata: {
            state: "failed",
            failedAt: new Date().toISOString(),
            error:
              generationError?.message ||
              "Prompt-only generation failed.",
            provider: "replicate",
            model: FLUX_MODEL,
            identityMode: "prompt_only_flux",
          },
        });

        throw generationError;
      }
    }

    await tasks.trigger("generate-image", {
      generationId: pendingRow.id,
      userId,
      characterId,
      characterName: character?.name || null,
      characterPrompt: characterPrompt || "",
      finalPrompt,
      scenePrompt: scenePrompt || finalPrompt,
      negativePrompt: negativePrompt || "",
      style,
      ratio,
      size,
      seed,
      referenceUrls,
      usingCharacterMode,
    });

    return Response.json({
      success: true,
      status: "processing",
      predictionId: pendingRow.id,
      generation: {
        id: pendingRow.id,
        prompt: pendingRow.prompt,
        negative_prompt: pendingRow.negative_prompt,
        ratio: pendingRow.ratio,
        mode: pendingRow.mode,
        style: pendingRow.style,
        created_at: pendingRow.created_at,
        images: [],
        metadata: {
          ...(pendingRow.metadata || {}),
          state: "processing",
        },
      },
      meta: {
        characterId: characterId || null,
        characterName: character?.name || null,
        usedCharacter: usingCharacterMode,
        scenePrompt: scenePrompt || prompt || "",
        finalPrompt,
        provider: "fal",
        model: SEEDREAM_MODEL,
        referenceCount: referenceUrls.length,
        referenceUrls,
        identityMode: "multi_reference_seedream",
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

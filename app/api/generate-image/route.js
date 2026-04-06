import { tasks } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";
import Replicate from "replicate";
import { FLUX_MODEL, buildPrompt } from "../../../lib/image-generation-rules";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const MAX_REFERENCE_IMAGES = 5;
const SEEDREAM_MODEL = "fal-ai/bytedance/seedream/v4.5/edit";
const MAX_PROMPT_LENGTH = 12000;
const MAX_NEGATIVE_PROMPT_LENGTH = 6000;

function logStep(step, details = {}) {
  console.info(`generate-image route: ${step}`, details);
}

function buildErrorDetails({
  error,
  promptLength,
  negativePromptLength,
  hasCharacter,
  requestKeys,
}) {
  return {
    message: error?.message || "Unknown route error",
    stack: error?.stack || null,
    promptLength,
    negativePromptLength,
    hasCharacter,
    requestKeys,
  };
}

function logEarlyReturn(reason, details = {}) {
  console.warn(`generate-image route: early return - ${reason}`, details);
}

function sanitizeText(value) {
  return String(value ?? "").trim();
}

function sanitizeOptionalId(value) {
  const text = sanitizeText(value);
  return text || null;
}

function sanitizeSeed(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

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
    if (!url || seen.has(url)) continue;
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

function buildFluxPredictionInput({
  prompt,
  scenePrompt,
  negativePrompt,
  style,
  ratio,
  size,
  seed,
}) {
  return {
    prompt: buildPrompt({
      scene: scenePrompt || prompt || "",
      style,
      negativePrompt,
      mode: "freeform",
    }),
    aspect_ratio: mapSizeToAspectRatio(size, ratio),
    output_format: "png",
    seed: sanitizeSeed(seed),
  };
}

export async function POST(req) {
  let rawBody = null;
  let requestKeys = [];
  let promptLength = 0;
  let negativePromptLength = 0;
  let hasCharacter = false;

  try {
    logStep("STEP 1 request received");

    try {
      rawBody = await req.json();
    } catch (parseError) {
      logEarlyReturn("invalid_json", {
        message: parseError?.message || "Failed to parse request JSON",
      });
      return Response.json(
        { success: false, error: "Malformed JSON request body." },
        { status: 400 }
      );
    }

    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      logEarlyReturn("invalid_payload_shape", {
        requestType: typeof rawBody,
      });
      return Response.json(
        { success: false, error: "Request body must be a JSON object." },
        { status: 400 }
      );
    }

    requestKeys = Object.keys(rawBody).sort();

    const prompt = sanitizeText(rawBody.prompt);
    const scenePrompt = sanitizeText(rawBody.scenePrompt);
    const characterPrompt = sanitizeText(rawBody.characterPrompt);
    const negativePrompt = sanitizeText(rawBody.negativePrompt);
    const style = sanitizeText(rawBody.style) || "cinematic";
    const ratio = sanitizeText(rawBody.ratio) || "16:9";
    const size = sanitizeText(rawBody.size) || "16:9";
    const userId = sanitizeOptionalId(rawBody.userId);
    const characterId = sanitizeOptionalId(rawBody.characterId);
    const seed = sanitizeSeed(rawBody.seed);
    const finalPrompt = prompt || scenePrompt;

    promptLength = finalPrompt.length;
    negativePromptLength = negativePrompt.length;
    hasCharacter = Boolean(characterId);

    logStep("STEP 2 parsed body", {
      requestKeys,
      promptLength,
      negativePromptLength,
      hasCharacter,
      hasNegativePrompt: Boolean(negativePrompt),
      characterId,
      mode: characterId ? "character" : "prompt_only",
    });

    if (!finalPrompt) {
      logEarlyReturn("missing_prompt", {
        promptLength,
        negativePromptLength,
        requestKeys,
      });
      return Response.json(
        { success: false, error: "Prompt is required." },
        { status: 400 }
      );
    }

    if (promptLength > MAX_PROMPT_LENGTH) {
      logEarlyReturn("prompt_too_long", {
        promptLength,
        maxPromptLength: MAX_PROMPT_LENGTH,
      });
      return Response.json(
        {
          success: false,
          error: `Prompt is too long. Maximum length is ${MAX_PROMPT_LENGTH} characters.`,
        },
        { status: 400 }
      );
    }

    if (negativePromptLength > MAX_NEGATIVE_PROMPT_LENGTH) {
      logEarlyReturn("negative_prompt_too_long", {
        negativePromptLength,
        maxNegativePromptLength: MAX_NEGATIVE_PROMPT_LENGTH,
      });
      return Response.json(
        {
          success: false,
          error: `Negative prompt is too long. Maximum length is ${MAX_NEGATIVE_PROMPT_LENGTH} characters.`,
        },
        { status: 400 }
      );
    }

    logStep("STEP 3 validated inputs", {
      promptLength,
      negativePromptLength,
      characterId,
      hasCharacter,
      hasNegativePrompt: Boolean(negativePrompt),
      mode: characterId ? "character" : "prompt_only",
    });

    let character = null;
    let characterRows = [];
    let referenceUrls = [];

    if (characterId) {
      character = await loadCharacterData(characterId);

      if (!character) {
        logEarlyReturn("character_not_found", {
          characterId,
          promptLength,
          negativePromptLength,
        });
        return Response.json(
          {
            success: false,
            error: "Selected character not found.",
            code: "CHARACTER_NOT_FOUND",
          },
          { status: 404 }
        );
      }

      characterRows = await loadCharacterImages(characterId);
      referenceUrls = pickBestIdentityReferences(character, characterRows);

      if (!referenceUrls.length) {
        logEarlyReturn("missing_character_references", {
          characterId,
          promptLength,
          negativePromptLength,
        });
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
        identityMode: usingCharacterMode
          ? "multi_reference_seedream"
          : "prompt_only_flux",
        provider: usingCharacterMode ? "fal" : "replicate",
        model: usingCharacterMode ? SEEDREAM_MODEL : FLUX_MODEL,
        remotePredictionId: null,
        remoteStatus: usingCharacterMode ? null : "starting",
        hasNegativePrompt: Boolean(negativePrompt),
      },
    });

    logStep("STEP 6 DB insert/update success", {
      generationId: pendingRow.id,
      promptLength,
      negativePromptLength,
      characterId,
      hasCharacter: usingCharacterMode,
      mode: usingCharacterMode ? "character" : "prompt_only",
    });

    if (!usingCharacterMode) {
      const predictionInput = buildFluxPredictionInput({
        prompt: finalPrompt,
        scenePrompt: scenePrompt || finalPrompt,
        negativePrompt,
        style,
        ratio,
        size,
        seed,
      });

      logStep("STEP 4 before Trigger enqueue", {
        generationId: pendingRow.id,
        dispatchTarget: "replicate.predictions.create",
        promptLength,
        negativePromptLength,
        hasNegativePrompt: Boolean(negativePrompt),
        characterId: null,
        mode: "prompt_only",
      });

      const prediction = await replicate.predictions.create({
        model: FLUX_MODEL,
        input: predictionInput,
      });

      await updateGenerationRow(pendingRow.id, {
        metadata: {
          startedAt: new Date().toISOString(),
          remotePredictionId: prediction?.id || null,
          remoteStatus: prediction?.status || "starting",
          provider: "replicate",
          model: FLUX_MODEL,
          identityMode: "prompt_only_flux",
          hasNegativePrompt: Boolean(negativePrompt),
        },
      });

      logStep("STEP 5 after Trigger enqueue", {
        generationId: pendingRow.id,
        dispatchTarget: "replicate.predictions.create",
        remotePredictionId: prediction?.id || null,
        remoteStatus: prediction?.status || "starting",
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
            startedAt: new Date().toISOString(),
            remotePredictionId: prediction?.id || null,
            remoteStatus: prediction?.status || "starting",
          },
        },
        meta: {
          characterId: null,
          characterName: null,
          usedCharacter: false,
          scenePrompt: scenePrompt || prompt || "",
          finalPrompt,
          characterPrompt: "",
          provider: "replicate",
          model: FLUX_MODEL,
          referenceCount: 0,
          referenceUrls: [],
          identityMode: "prompt_only_flux",
          hasNegativePrompt: Boolean(negativePrompt),
        },
      });
    }

    logStep("STEP 4 before Trigger enqueue", {
      generationId: pendingRow.id,
      dispatchTarget: "tasks.trigger(generate-image)",
      promptLength,
      negativePromptLength,
      hasNegativePrompt: Boolean(negativePrompt),
      characterId,
      mode: "character",
    });

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

    logStep("STEP 5 after Trigger enqueue", {
      generationId: pendingRow.id,
      dispatchTarget: "tasks.trigger(generate-image)",
      referenceCount: referenceUrls.length,
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
        characterPrompt,
        provider: "fal",
        model: SEEDREAM_MODEL,
        referenceCount: referenceUrls.length,
        referenceUrls,
        identityMode: "multi_reference_seedream",
        hasNegativePrompt: Boolean(negativePrompt),
      },
    });
  } catch (error) {
    console.error(
      "generate-image route failed:",
      buildErrorDetails({
        error,
        promptLength,
        negativePromptLength,
        hasCharacter,
        requestKeys,
      })
    );

    return Response.json(
      {
        success: false,
        error: error?.message || "Image generation failed.",
      },
      { status: 500 }
    );
  }
}

import { task } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";
import { fal } from "@fal-ai/client";

type GenerateImagePayload = {
  generationId: string;
  userId?: string | null;
  characterId?: string | null;
  characterName?: string | null;
  characterPrompt?: string | null;
  prompt?: string | null;
  finalPrompt?: string | null;
  scenePrompt?: string | null;
  negativePrompt?: string | null;
  size?: string | null;
  ratio?: string | null;
  mode?: string | null;
  style?: string | null;
  seed?: number | null;
  referenceUrls?: string[];
  usingCharacterMode?: boolean;
};

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

fal.config({
  credentials: process.env.FAL_KEY!,
});

const GENERATED_BUCKET = "generated-images";
const SEEDREAM_MODEL = "fal-ai/bytedance/seedream/v4.5/edit";

function normalizeImageUrl(value: unknown) {
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

function getFileExtFromContentType(contentType?: string | null) {
  const value = String(contentType || "").toLowerCase();

  if (value.includes("jpeg") || value.includes("jpg")) return "jpg";
  if (value.includes("webp")) return "webp";
  return "png";
}

function mapSizeToSeedreamImageSize(size?: string | null) {
  switch (String(size || "").toLowerCase()) {
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

async function updateGenerationRow(
  generationId: string,
  patch: Record<string, any>,
  cachedMetadata?: Record<string, any> | null
) {
  const needsMetadataMerge =
    patch?.metadata && typeof patch.metadata === "object";

  let baseMetadata = cachedMetadata || null;

  if (needsMetadataMerge && !baseMetadata) {
    const { data: existing, error: loadError } = await supabaseAdmin
      .from("image_generations")
      .select("metadata")
      .eq("id", generationId)
      .single();

    if (loadError) {
      throw new Error(
        `Failed to load generation metadata: ${loadError.message}`
      );
    }

    baseMetadata = existing?.metadata || {};
  }

  const nextPatch = needsMetadataMerge
    ? {
        ...patch,
        metadata: {
          ...(baseMetadata || {}),
          ...patch.metadata,
        },
      }
    : patch;

  let lastError: any = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { error } = await supabaseAdmin
      .from("image_generations")
      .update(nextPatch)
      .eq("id", generationId);

    if (!error) {
      return nextPatch?.metadata || null;
    }

    lastError = error;

    if (!String(error.message || "").toLowerCase().includes("statement timeout")) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
  }

  throw new Error(
    `Failed to update generation row: ${lastError?.message || "Unknown database error"}`
  );
}

async function downloadImage(imageUrl: string) {
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
}: {
  userId?: string | null;
  buffer: Buffer;
  contentType: string;
  fileExt: string;
  generationId: string;
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

function extractImageOutput(result: any) {
  const image =
    result?.data?.images?.[0] ||
    result?.data?.image ||
    result?.images?.[0] ||
    result?.image ||
    null;

  return {
    url: image?.url || null,
    width: image?.width || null,
    height: image?.height || null,
    content_type: image?.content_type || "image/png",
    raw: result,
  };
}

function buildSeedreamPrompt({
  finalPrompt,
  scenePrompt,
  characterName,
  characterPrompt,
  style,
  ratio,
  referenceUrls = [],
}: {
  finalPrompt?: string | null;
  scenePrompt?: string | null;
  characterName?: string | null;
  characterPrompt?: string | null;
  style?: string | null;
  ratio?: string | null;
  referenceUrls?: string[];
}) {
  const charName = characterName || "the same character";
  const figureGuide =
    referenceUrls.length > 0
      ? referenceUrls.map((_, idx) => `Figure ${idx + 1}`).join(", ")
      : "the provided reference images";
  const resolvedCharacterPrompt = String(
    characterPrompt || `Exact identity lock for ${charName}.`
  ).trim();

  return `
Use ${figureGuide} as reference images of the SAME real person.

Highest priority:
Keep the exact same facial identity of ${charName}.
Do not create a different person.
Do not beautify or alter facial structure.
Keep the same face shape, eyes, nose, lips, jawline, hairline, hairstyle, skin tone, age impression, facial hair pattern, and recognizable likeness.

Identity anchor:
${resolvedCharacterPrompt}

Reference rules:
- Figure 1 is the primary identity anchor.
- All other figures are supporting views of the same person.
- Keep identity locked even if angle, lighting, camera distance, pose, wardrobe, or environment changes.

Face visibility rules:
- Face must remain clearly visible and readable.
- Eyes, nose, mouth, jawline, and full facial structure must remain unobstructed.
- No silhouette and no back-facing angle.
- No heavy fog, smoke, rain streaks, hair, props, or shadows covering the face.
- Prefer front-facing or slight 3/4 view.
- Use eye-level framing.
- Use medium shot or medium close-up framing.
- Keep the face well-lit while preserving cinematic mood.

Scene:
${scenePrompt || finalPrompt || "Create a cinematic photorealistic scene."}

Style:
${style || "cinematic photorealistic still frame"}

Aspect ratio:
${ratio || "16:9"}

Quality:
photorealistic, natural skin texture, realistic lighting, realistic eyes, cinematic composition, grounded atmosphere, one main subject only, no plastic skin, no beauty filter.

Avoid:
different person, identity drift, silhouette, hidden face, fog covering face, backlit face, face in shadow, rear view, extreme side profile, tiny face, distant subject.
`.trim();
}

async function runSeedreamCharacterGeneration({
  prompt,
  referenceUrls,
  size,
  seed,
}: {
  prompt: string;
  referenceUrls: string[];
  size?: string | null;
  seed?: number | null;
}) {
  const cleanedRefs = (referenceUrls || [])
    .map((url) => normalizeImageUrl(url))
    .filter(Boolean) as string[];

  if (!cleanedRefs.length) {
    throw new Error("No valid reference URLs were provided to Seedream.");
  }

  const result = (await fal.subscribe(SEEDREAM_MODEL, {
    input: {
      prompt,
      image_size: mapSizeToSeedreamImageSize(size),
      num_images: 1,
      image_urls: cleanedRefs,
      seed: typeof seed === "number" ? seed : undefined,
      sync_mode: true,
    },
    logs: true,
  })) as any;

  const image = extractImageOutput(result);
  if (!image.url) {
    throw new Error("Seedream returned no image URL.");
  }

  return image;
}
async function runCharacterModel({
  prompt,
  referenceUrls,
  size,
  seed,
}: {
  prompt: string;
  referenceUrls: string[];
  size?: string | null;
  seed?: number | null;
}) {
  return runSeedreamCharacterGeneration({
    prompt,
    referenceUrls,
    size,
    seed,
  });
}

export const generateImageTask = task({
  id: "generate-image",
  run: async (payload: GenerateImagePayload) => {
    const {
      generationId,
      userId,
      characterId,
      characterName,
      characterPrompt,
      prompt,
      finalPrompt,
      scenePrompt,
      negativePrompt,
      style,
      ratio,
      size,
      seed,
      referenceUrls = [],
      usingCharacterMode,
    } = payload;

    let metadataCache: Record<string, any> = {};
    let currentStage = "initializing";
    const persistGenerationRow = async (patch: Record<string, any>) => {
      const nextMetadata = await updateGenerationRow(
        generationId,
        patch,
        metadataCache
      );

      if (nextMetadata && typeof nextMetadata === "object") {
        metadataCache = nextMetadata;
      }
    };

    try {
      currentStage = "marking_processing";
      await persistGenerationRow({
        metadata: {
          state: "processing",
          startedAt: new Date().toISOString(),
          lastProgressAt: new Date().toISOString(),
          characterId: characterId || null,
          characterName: characterName || null,
          characterPrompt: characterPrompt || "",
          referenceCount: referenceUrls.length,
          referenceUrls,
          provider: "fal",
          model: SEEDREAM_MODEL,
          identityMode: "multi_reference_seedream",
        },
      });

      if (!usingCharacterMode) {
        throw new Error(
          "Character generation task was triggered without a character."
        );
      }

      if (!referenceUrls.length) {
        throw new Error("No reference images available for this character.");
      }

      const seedreamPrompt = buildSeedreamPrompt({
        finalPrompt: finalPrompt || prompt || "",
        scenePrompt: scenePrompt || finalPrompt || prompt || "",
        characterName,
        characterPrompt,
        style,
        ratio,
        referenceUrls,
      });

      currentStage = "generating_image";
      await persistGenerationRow({
        metadata: {
          lastProgressAt: new Date().toISOString(),
          progressStage: "generating_image",
          resolvedPrompt: seedreamPrompt,
        },
      });

      console.info("generate-image: generation started", {
        generationId,
        stage: currentStage,
        model: SEEDREAM_MODEL,
        referenceCount: referenceUrls.length,
      });

      const generatedRemote = await runCharacterModel({
        prompt: seedreamPrompt,
        referenceUrls,
        size: size || ratio,
        seed,
      });

      const outputContentType = generatedRemote?.content_type || "image/png";
      currentStage = "downloading_image";
      const downloaded = await downloadImage(generatedRemote.url);

      currentStage = "uploading_image";
      await persistGenerationRow({
        metadata: {
          lastProgressAt: new Date().toISOString(),
          progressStage: "uploading_image",
        },
      });

      const uploaded = await uploadGeneratedImage({
        userId,
        buffer: downloaded.buffer,
        contentType: outputContentType,
        fileExt: getFileExtFromContentType(outputContentType),
        generationId,
      });

      currentStage = "finalizing_database";
      try {
        await persistGenerationRow({
          images: [uploaded.publicUrl].filter(Boolean),
          style: style || "cinematic",
          mode: "image",
          metadata: {
            state: "succeeded",
            completedAt: new Date().toISOString(),
            lastProgressAt: new Date().toISOString(),
            progressStage: "completed",
            provider: "fal",
            model: SEEDREAM_MODEL,
            referenceUrls,
            referenceCount: referenceUrls.length,
            generatedRemote,
            storagePath: uploaded.storagePath,
            identityMode: "multi_reference_seedream",
            negativePrompt: negativePrompt || "",
          },
        });
      } catch (syncError: any) {
        console.warn("generate-image: db sync delayed after successful upload", {
          generationId,
          stage: currentStage,
          storagePath: uploaded.storagePath,
          imageUrl: uploaded.publicUrl,
          error: syncError?.message || "Unknown database sync error",
        });

        return {
          success: true,
          generationId,
          imageUrl: uploaded.publicUrl,
          syncPending: true,
        };
      }

      console.info("generate-image: generation completed", {
        generationId,
        stage: currentStage,
        storagePath: uploaded.storagePath,
      });

      return {
        success: true,
        generationId,
        imageUrl: uploaded.publicUrl,
      };
    } catch (error: any) {
      console.error("generate-image: task failed", {
        generationId,
        stage: currentStage,
        error: error?.message || "Unknown generation error",
      });

      try {
        await persistGenerationRow({
          metadata: {
            state: "failed",
            failedAt: new Date().toISOString(),
            lastProgressAt: new Date().toISOString(),
            progressStage: "failed",
            error: error?.message || "Unknown generation error",
            errorType:
              currentStage === "uploading_image"
                ? "upload_failure"
                : currentStage === "finalizing_database"
                ? "db_sync_failure"
                : "generation_failure",
            provider: "fal",
            model: SEEDREAM_MODEL,
          },
        });
      } catch (persistError: any) {
        console.error("generate-image: failed to persist terminal state", {
          generationId,
          stage: currentStage,
          error:
            persistError?.message ||
            "Unknown terminal-state persistence error",
        });
      }

      throw error;
    }
  },
});

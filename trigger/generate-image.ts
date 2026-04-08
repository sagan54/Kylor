import { task } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";
import Replicate from "replicate";
import {
  FLUX_MODEL,
  buildPrompt,
} from "../lib/image-generation-rules.js";

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

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const GENERATED_BUCKET = "generated-images";

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

function mapSizeToAspectRatio(size?: string | null, ratio?: string | null) {
  switch (String(size || ratio || "").toLowerCase()) {
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

async function fileOutputToUrl(output: any): Promise<string | null> {
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

  const asString = String(output || "").trim();
  if (asString.startsWith("http://") || asString.startsWith("https://")) {
    return asString;
  }

  return null;
}

function buildFluxCharacterPrompt({
  finalPrompt,
  scenePrompt,
  characterPrompt,
  style,
  negativePrompt,
}: {
  finalPrompt?: string | null;
  scenePrompt?: string | null;
  characterPrompt?: string | null;
  style?: string | null;
  negativePrompt?: string | null;
}) {
  const scene = scenePrompt || finalPrompt || "";
  const basePrompt = buildPrompt({
    scene,
    style,
    negativePrompt,
    mode: "character",
  });

  return [characterPrompt || "", basePrompt].filter(Boolean).join("\n\n");
}

async function runFluxCharacterGeneration({
  prompt,
  negativePrompt,
  style,
  scenePrompt,
  ratio,
  size,
  seed,
}: {
  prompt: string;
  negativePrompt?: string | null;
  style?: string | null;
  scenePrompt?: string | null;
  ratio?: string | null;
  size?: string | null;
  seed?: number | null;
}) {
  const result = await replicate.run(FLUX_MODEL, {
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

  const url = await fileOutputToUrl(result);
  if (!url) {
    throw new Error("FLUX returned no image URL.");
  }

  return {
    url,
    content_type: "image/png",
    raw: result,
  };
}
async function runCharacterModel({
  prompt,
  negativePrompt,
  style,
  scenePrompt,
  ratio,
  size,
  seed,
}: {
  prompt: string;
  negativePrompt?: string | null;
  style?: string | null;
  scenePrompt?: string | null;
  ratio?: string | null;
  size?: string | null;
  seed?: number | null;
}) {
  return runFluxCharacterGeneration({
    prompt,
    negativePrompt,
    style,
    scenePrompt,
    ratio,
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
          provider: "replicate",
          model: FLUX_MODEL,
          identityMode: "character_prompt_flux",
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

      const characterFluxPrompt = buildFluxCharacterPrompt({
        finalPrompt: finalPrompt || prompt || "",
        scenePrompt: scenePrompt || finalPrompt || prompt || "",
        characterPrompt,
        style,
        negativePrompt,
      });

      currentStage = "generating_image";
      await persistGenerationRow({
        metadata: {
          lastProgressAt: new Date().toISOString(),
          progressStage: "generating_image",
          resolvedPrompt: characterFluxPrompt,
        },
      });

      console.info("generate-image: generation started", {
        generationId,
        stage: currentStage,
        model: FLUX_MODEL,
        referenceCount: referenceUrls.length,
      });

      const generatedRemote = await runCharacterModel({
        prompt: characterFluxPrompt,
        negativePrompt: negativePrompt || "",
        style,
        scenePrompt: scenePrompt || finalPrompt || prompt || "",
        ratio,
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
            provider: "replicate",
            model: FLUX_MODEL,
            referenceUrls,
            referenceCount: referenceUrls.length,
            generatedRemote,
            storagePath: uploaded.storagePath,
            identityMode: "character_prompt_flux",
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
            provider: "replicate",
            model: FLUX_MODEL,
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

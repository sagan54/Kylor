import { task } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";
import { fal } from "@fal-ai/client";
import {
  buildPrompt,
  buildCorrectionPrompt,
  adjustSceneForIdentity,
} from "../lib/image-generation-rules";

type GenerateImagePayload = {
  generationId: string;
  userId?: string | null;
  characterId?: string | null;
  characterName?: string | null;
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
const DREAMO_MODEL = "fal-ai/dreamo";
const MAX_CHARACTER_ATTEMPTS = 1;

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

function mapSizeToIdentityDimensions(size?: string | null, ratio?: string | null) {
  switch (String(size || ratio || "").toLowerCase()) {
    case "1024x1536":
    case "portrait":
    case "4:5":
    case "3:4":
      return { width: 896, height: 1152 };
    case "1024x1024":
    case "square":
    case "1:1":
      return { width: 1024, height: 1024 };
    case "4:3":
      return { width: 1152, height: 896 };
    case "9:16":
      return { width: 896, height: 1536 };
    case "16:9":
    default:
      return { width: 1344, height: 768 };
  }
}

async function updateGenerationRow(
  generationId: string,
  patch: Record<string, any>
) {
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
    throw new Error(`Failed to update generation row: ${error.message}`);
  }
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

async function runDreamoGeneration({
  prompt,
  referenceUrls,
  size,
  ratio,
  seed,
}: {
  prompt: string;
  referenceUrls: string[];
  size?: string | null;
  ratio?: string | null;
  seed?: number | null;
}) {
  const cleanedRefs = (referenceUrls || [])
    .map((url) => normalizeImageUrl(url))
    .filter(Boolean) as string[];

  if (!cleanedRefs.length) {
    throw new Error("No valid reference URLs were provided to DreamO.");
  }

  const dimensions = mapSizeToIdentityDimensions(size, ratio);

  const result = (await fal.subscribe(DREAMO_MODEL, {
    input: {
      prompt,
      first_reference_image_url: cleanedRefs[0],
      first_reference_task: "ip",
      second_reference_image_url: cleanedRefs[1],
      second_reference_task: cleanedRefs[1] ? "ip" : undefined,
      width: dimensions.width,
      height: dimensions.height,
      num_images: 1,
      num_inference_steps: 12,
      guidance_scale: 3.5,
      sync_mode: true,
      seed: typeof seed === "number" ? seed : undefined,
    },
    logs: true,
  })) as any;

  const image = extractImageOutput(result);
  if (!image.url) {
    throw new Error("DreamO returned no image URL.");
  }

  return image;
}
async function runCharacterModel({
  prompt,
  referenceUrls,
  size,
  ratio,
  seed,
}: {
  prompt: string;
  referenceUrls: string[];
  size?: string | null;
  ratio?: string | null;
  seed?: number | null;
}) {
  return runDreamoGeneration({
    prompt,
    referenceUrls,
    size,
    ratio,
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

    try {
      if (!usingCharacterMode) {
        throw new Error("Character generation task was triggered without a character.");
      }

      if (!referenceUrls.length) {
        throw new Error("No reference images available for this character.");
      }

      const safeScene = adjustSceneForIdentity(
        scenePrompt || finalPrompt || prompt || ""
      );

      let lastValidation: any = null;
      let lastError: any = null;

      for (let attempt = 0; attempt < MAX_CHARACTER_ATTEMPTS; attempt += 1) {
        const resolvedPrompt = buildPrompt({
          scene:
            attempt === 0
              ? safeScene
              : buildCorrectionPrompt(safeScene),
          character: characterName || "the same exact character",
          mode: "character",
          style: style || "cinematic photorealistic still frame",
          negativePrompt: negativePrompt || "",
        });

        await updateGenerationRow(generationId, {
          metadata: {
            state: "processing",
            ...(attempt === 0
              ? { startedAt: new Date().toISOString() }
              : {}),
            lastProgressAt: new Date().toISOString(),
            characterId: characterId || null,
            characterName: characterName || null,
            referenceCount: referenceUrls.length,
            referenceUrls,
            provider: "fal",
            model: DREAMO_MODEL,
            identityMode: "dreamo_identity",
            attempt: attempt + 1,
            resolvedPrompt,
          },
        });

        try {
          await updateGenerationRow(generationId, {
            metadata: {
              lastProgressAt: new Date().toISOString(),
              progressStage: "generating_image",
            },
          });

          const generatedRemote = await runCharacterModel({
            prompt: resolvedPrompt,
            referenceUrls,
            size,
            ratio,
            seed,
          });

          const outputContentType = generatedRemote?.content_type || "image/png";
          const downloaded = await downloadImage(generatedRemote.url);

          const uploaded = await uploadGeneratedImage({
            userId,
            buffer: downloaded.buffer,
            contentType: outputContentType,
            fileExt: getFileExtFromContentType(outputContentType),
            generationId,
          });

          await updateGenerationRow(generationId, {
            images: [uploaded.publicUrl].filter(Boolean),
            style: style || "cinematic",
            mode: "image",
            metadata: {
              state: "succeeded",
              completedAt: new Date().toISOString(),
              lastProgressAt: new Date().toISOString(),
              progressStage: "completed",
              provider: "fal",
              model: DREAMO_MODEL,
              referenceUrls,
              referenceCount: referenceUrls.length,
              generatedRemote,
              storagePath: uploaded.storagePath,
              identityMode: "dreamo_identity",
              negativePrompt: negativePrompt || "",
              validation: {
                accepted: true,
                mode: "prompt_enforced",
                reason:
                  "Accepted from the primary DreamO identity generation path.",
              },
            },
          });

          return {
            success: true,
            generationId,
            imageUrl: uploaded.publicUrl,
          };
        } catch (attemptError: any) {
          await updateGenerationRow(generationId, {
            metadata: {
              lastProgressAt: new Date().toISOString(),
              progressStage: "attempt_failed",
              lastAttemptError:
                attemptError?.message || "Unknown attempt error",
            },
          });

          lastError = attemptError;
        }
      }

      throw (
        lastError ||
        new Error(
          lastValidation?.visibility?.reason ||
            "Character generation failed validation after retries."
        )
      );
    } catch (error: any) {
      await updateGenerationRow(generationId, {
        metadata: {
          state: "failed",
          failedAt: new Date().toISOString(),
          lastProgressAt: new Date().toISOString(),
          progressStage: "failed",
          error: error?.message || "Unknown generation error",
        },
      });

      throw error;
    }
  },
});

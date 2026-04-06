import { task } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";
import { fal } from "@fal-ai/client";
import Replicate from "replicate";
import OpenAI from "openai";
import {
  buildPrompt,
  buildCorrectionPrompt,
  adjustSceneForIdentity,
  getModelForTask,
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
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

fal.config({
  credentials: process.env.FAL_KEY!,
});

const GENERATED_BUCKET = "generated-images";
const FACE_MATCH_MODEL = process.env.FACE_MATCH_MODEL || "apna-mart/face-match";
const EVALUATOR_MODEL = process.env.EVALUATOR_MODEL || "gpt-4.1-mini";
const DEFAULT_IDENTITY_THRESHOLD = 0.82;
const MAX_CHARACTER_ATTEMPTS = 3;

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
  if (output?.output) return fileOutputToUrl(output.output);

  const asString = String(output || "").trim();
  if (asString.startsWith("http://") || asString.startsWith("https://")) {
    return asString;
  }

  return null;
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

  const result = (await fal.subscribe("fal-ai/dreamo", {
    input: {
      prompt,
      first_reference_image_url: cleanedRefs[0],
      first_reference_task: "ip",
      second_reference_image_url: cleanedRefs[1],
      second_reference_task: cleanedRefs[1] ? "ip" : undefined,
      width: dimensions.width,
      height: dimensions.height,
      num_images: 1,
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

async function runInstantIdGeneration({
  prompt,
  referenceUrls,
  ratio,
  size,
  seed,
}: {
  prompt: string;
  referenceUrls: string[];
  ratio?: string | null;
  size?: string | null;
  seed?: number | null;
}) {
  const primaryReference = normalizeImageUrl(referenceUrls?.[0]);
  if (!primaryReference) {
    throw new Error("No valid primary reference image was provided to InstantID.");
  }

  const output = await replicate.run("grandlineai/instant-id-photorealistic", {
    input: {
      image: primaryReference,
      prompt,
      aspect_ratio: String(ratio || size || "16:9"),
      output_format: "png",
      ip_adapter_scale: 0.85,
      controlnet_conditioning_scale: 0.8,
      seed: typeof seed === "number" ? seed : undefined,
    },
  });

  const imageUrl = await fileOutputToUrl(output);

  if (!imageUrl) {
    throw new Error("InstantID returned no image URL.");
  }

  return {
    url: imageUrl,
    width: null,
    height: null,
    content_type: "image/png",
    raw: output,
  };
}

function extractSimilarityScore(output: any): number | null {
  if (typeof output === "number") return output;

  if (typeof output === "string") {
    const n = Number(output);
    return Number.isFinite(n) ? n : null;
  }

  if (Array.isArray(output)) {
    for (const item of output) {
      const value = extractSimilarityScore(item);
      if (Number.isFinite(value)) return value;
    }
    return null;
  }

  if (output && typeof output === "object") {
    const possibleKeys = [
      "similarity",
      "score",
      "match_score",
      "confidence",
      "distance_score",
      "face_similarity",
    ];

    for (const key of possibleKeys) {
      const value = Number(output[key]);
      if (Number.isFinite(value)) return value;
    }

    for (const value of Object.values(output)) {
      const nested = extractSimilarityScore(value);
      if (Number.isFinite(nested)) return nested;
    }
  }

  return null;
}

function normalizeSimilarity(score: number | null) {
  const n = Number(score);
  if (!Number.isFinite(n)) return null;

  if (n > 1 && n <= 100) {
    return Math.max(0, Math.min(1, n / 100));
  }

  if (n >= 0 && n <= 1) {
    return n;
  }

  return null;
}

async function verifyIdentitySimilarity({
  referenceImageUrl,
  candidateImageUrl,
}: {
  referenceImageUrl: string;
  candidateImageUrl: string;
}) {
  const prediction = await replicate.models.predictions.create(FACE_MATCH_MODEL, {
    input: {
      image1: referenceImageUrl,
      image2: candidateImageUrl,
    },
  });

  const similarity = normalizeSimilarity(
    extractSimilarityScore(prediction?.output)
  );

  return {
    similarity,
    rawOutput: prediction?.output || null,
    predictionId: prediction?.id || null,
    accepted:
      Number.isFinite(Number(similarity)) &&
      Number(similarity) >= DEFAULT_IDENTITY_THRESHOLD,
  };
}

async function evaluateFaceVisibility({
  candidateImageUrl,
  characterName,
}: {
  candidateImageUrl: string;
  characterName?: string | null;
}) {
  if (!openai) {
    return {
      accepted: true,
      faceVisible: true,
      frontalOrThreeQuarter: true,
      severeBacklighting: false,
      heavyFogOnFace: false,
      silhouette: false,
      identityUsable: true,
      reason: "Vision evaluator disabled because OPENAI_API_KEY is missing.",
    };
  }

  const response: any = await openai.responses.create({
    model: EVALUATOR_MODEL,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              "Evaluate this generated image for character identity usability.",
              `Character name: ${characterName || "selected character"}.`,
              "Return JSON only.",
              "Reject if the face is not clearly visible, if the subject is mostly silhouette, if the face is heavily obscured by fog/shadow/hair, if strong backlighting destroys facial readability, or if the subject is back-facing.",
              "Accept only if the face is clearly visible, well-lit enough for identity recognition, and framed front-facing or slight 3/4.",
            ].join(" "),
          },
          {
            type: "input_image",
            image_url: candidateImageUrl,
            detail: "high",
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "identity_visibility_evaluation",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            accepted: { type: "boolean" },
            faceVisible: { type: "boolean" },
            frontalOrThreeQuarter: { type: "boolean" },
            severeBacklighting: { type: "boolean" },
            heavyFogOnFace: { type: "boolean" },
            silhouette: { type: "boolean" },
            identityUsable: { type: "boolean" },
            reason: { type: "string" },
          },
          required: [
            "accepted",
            "faceVisible",
            "frontalOrThreeQuarter",
            "severeBacklighting",
            "heavyFogOnFace",
            "silhouette",
            "identityUsable",
            "reason",
          ],
        },
      },
    },
  });

  const parsed =
    response?.output_parsed ||
    JSON.parse(response?.output_text || "{}");

  return parsed;
}

async function validateOutput({
  candidateImageUrl,
  referenceImageUrl,
  characterName,
}: {
  candidateImageUrl: string;
  referenceImageUrl: string;
  characterName?: string | null;
}) {
  const [visibility, identity] = await Promise.all([
    evaluateFaceVisibility({ candidateImageUrl, characterName }),
    verifyIdentitySimilarity({ referenceImageUrl, candidateImageUrl }),
  ]);

  const accepted =
    Boolean(visibility?.accepted) &&
    Boolean(visibility?.identityUsable) &&
    Boolean(identity?.accepted);

  return {
    accepted,
    visibility,
    identity,
    correctionPrompt: buildCorrectionPrompt(
      "Make the face clearly visible and well-lit, preserve identity."
    ),
  };
}

async function runCharacterModel({
  modelConfig,
  prompt,
  referenceUrls,
  ratio,
  size,
  seed,
}: {
  modelConfig: { provider: string; model: string; identityMode: string };
  prompt: string;
  referenceUrls: string[];
  ratio?: string | null;
  size?: string | null;
  seed?: number | null;
}) {
  if (modelConfig.provider === "fal") {
    return runDreamoGeneration({
      prompt,
      referenceUrls,
      ratio,
      size,
      seed,
    });
  }

  return runInstantIdGeneration({
    prompt,
    referenceUrls,
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
        const modelConfig = getModelForTask({
          hasCharacter: true,
          attempt,
        }) as { provider: string; model: string; identityMode: string };

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
            provider: modelConfig.provider,
            model: modelConfig.model,
            identityMode: modelConfig.identityMode,
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
            modelConfig,
            prompt: resolvedPrompt,
            referenceUrls,
            ratio,
            size,
            seed,
          });

          await updateGenerationRow(generationId, {
            metadata: {
              lastProgressAt: new Date().toISOString(),
              progressStage: "validating_output",
            },
          });

          const validation = await validateOutput({
            candidateImageUrl: generatedRemote.url,
            referenceImageUrl: referenceUrls[0],
            characterName,
          });

          lastValidation = validation;

          if (!validation.accepted) {
            await updateGenerationRow(generationId, {
              metadata: {
                lastProgressAt: new Date().toISOString(),
                progressStage: "retrying_after_validation_failure",
                lastValidation: validation,
              },
            });

            lastError = new Error(
              validation?.visibility?.reason ||
                "Generated image failed identity visibility validation."
            );
            continue;
          }

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
              provider: modelConfig.provider,
              model: modelConfig.model,
              referenceUrls,
              referenceCount: referenceUrls.length,
              generatedRemote,
              storagePath: uploaded.storagePath,
              identityMode: modelConfig.identityMode,
              negativePrompt: negativePrompt || "",
              validation,
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

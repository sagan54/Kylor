import { task } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";
import { fal } from "@fal-ai/client";
import {
  buildCameraRealismBlock,
  buildExpressionEnforcementBlock,
  buildExpressionNegativeBlock,
  buildLightingNegativeBlock,
  buildMicroDetailBlock,
  buildNegativeRealismBlock,
  buildRealismLightingBlock,
  buildSceneIntegrationBlock,
  buildShadowInteractionBlock,
  buildSkinRealismBlock,
  inferSceneExpression,
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
    case "1024x1024":
      return "square_hd";
    case "portrait":
    case "4:5":
    case "3:4":
    case "1024x1536":
      return "portrait_4_3";
    case "9:16":
      return "portrait_16_9";
    case "16:9":
    case "1536x1024":
      return "landscape_16_9";
    case "4:3":
      return "landscape_4_3";
    default:
      return "landscape_16_9";
  }
}

function inferSceneProfile(sceneText?: string | null, ratio?: string | null) {
  const haystack = `${String(sceneText || "")} ${String(ratio || "")}`.toLowerCase();
  const has = (pattern: RegExp) => pattern.test(haystack);

  const action = has(
    /(action|fight|fighting|boxing|boxer|ring|combat|battle|sparring|mid-punch|punch|kick|attack|impact|opponent|motion|running|sprinting|chase)/
  );
  const fullBody = has(
    /(full body|full-body|head to toe|head-to-toe|from head to toe|entire body)/
  );
  const closeUp = has(
    /(close up|close-up|tight shot|headshot|portrait crop|extreme close-up)/
  );
  const mediumShot = has(/(medium shot|mid shot|mid-shot|waist up|torso up)/);
  const wide = has(
    /(wide shot|wide-angle|wide angle|establishing shot|environment shot|arena|stadium|crowd|audience|inside a ring|16:9|21:9)/
  );
  const multiSubject = has(
    /(opponent|another person|another male fighter|another fighter|second person|two people|duo|group|crowd|audience|versus|vs\.?|faceoff)/
  );
  const dynamicAngle = has(
    /(dynamic angle|low angle|high angle|dramatic angle|tracking shot|cinematic angle|over the shoulder|over-the-shoulder)/
  );

  return {
    action,
    closeUp,
    mediumShot,
    fullBody,
    wide: wide || (action && !closeUp && !mediumShot && !fullBody),
    multiSubject,
    dynamicAngle: dynamicAngle || action,
  };
}

function buildReferenceUsageBlock(sceneText?: string | null) {
  const scene = String(sceneText || "").trim();

  return [
    "REFERENCE USAGE (HIGH PRIORITY):",
    "Use the provided reference images only to preserve the primary character's facial identity and recognizable likeness.",
    "Do not copy the reference background, blank wall, plain studio look, t-shirt, pose, framing, camera angle, or expression unless the scene explicitly asks for them.",
    "Replace the reference clothing, environment, action, and composition with the requested scene details.",
    scene
      ? `The final image must visibly show the requested scene, wardrobe, action, and environment: ${scene}`
      : "The final image must visibly show the requested scene, wardrobe, action, and environment.",
  ].join("\n");
}

function buildCompositionBlock(sceneText?: string | null, ratio?: string | null) {
  const profile = inferSceneProfile(sceneText, ratio);
  const lines = [
    "COMPOSITION AND CAMERA (HIGH PRIORITY):",
    "Do not collapse the result into a plain centered portrait unless the scene explicitly asks for a portrait.",
  ];

  if (profile.closeUp) {
    lines.push(
      "Use a close-up or portrait crop only because the scene explicitly requests it."
    );
  } else if (profile.fullBody) {
    lines.push(
      "Use full-body framing so the body, pose, wardrobe, and action are all clearly visible."
    );
  } else if (profile.wide) {
    lines.push(
      "Use a medium-wide or wide cinematic frame so the environment and action read clearly."
    );
  } else if (profile.mediumShot) {
    lines.push(
      "Use a medium shot that preserves identity without losing the requested scene context."
    );
  } else {
    lines.push(
      "Choose framing that best expresses the requested scene, not a default passport-style portrait."
    );
  }

  if (profile.dynamicAngle) {
    lines.push(
      "Allow dynamic camera angle, asymmetrical framing, motion, and foreshortening when the scene calls for action."
    );
  } else {
    lines.push("Use a natural cinematic camera angle instead of a rigid head-on studio setup.");
  }

  if (profile.multiSubject) {
    lines.push(
      "Keep the identity-locked character as the primary subject, but include the secondary person or opponent when requested."
    );
  } else {
    lines.push("Keep one primary identity-locked subject unless the scene explicitly adds more people.");
  }

  return lines.join("\n");
}

function buildIdentityVisibilityBlock(sceneText?: string | null) {
  const profile = inferSceneProfile(sceneText);
  const lines = [
    "IDENTITY VISIBILITY:",
    "Keep the primary character recognizable and anatomically consistent.",
    "When the face is visible, preserve the same eyes, nose, mouth, jawline, hairline, hairstyle, skin tone, and overall likeness.",
    "Do not turn the character into a different person.",
  ];

  if (profile.action || profile.wide || profile.fullBody) {
    lines.push(
      "Do not force direct eye contact, a centered front view, or perfectly symmetrical face presentation in action scenes."
    );
    lines.push(
      "Partial profile, motion, strain, and dynamic pose are allowed as long as the identity remains believable."
    );
  } else {
    lines.push("Prefer a readable face when the scene does not call for heavy motion or distance.");
  }

  lines.push(
    "Avoid fully hidden or rear-only views unless the scene explicitly requests them."
  );

  return lines.join("\n");
}

function mapFalQueueStage(status: unknown) {
  const queueStatus = String((status as any)?.status || "").toUpperCase();

  switch (queueStatus) {
    case "IN_QUEUE":
      return "queued_at_fal";
    case "IN_PROGRESS":
      return "generating_image";
    case "COMPLETED":
      return "fal_completed";
    default:
      return "generating_image";
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
  negativePrompt,
  style,
  ratio,
  referenceUrls = [],
}: {
  finalPrompt?: string | null;
  scenePrompt?: string | null;
  characterName?: string | null;
  characterPrompt?: string | null;
  negativePrompt?: string | null;
  style?: string | null;
  ratio?: string | null;
  referenceUrls?: string[];
}) {
  const charName = characterName || "the same character";
  const sceneText = String(
    scenePrompt || finalPrompt || "Create a cinematic photorealistic scene."
  ).trim();
  const figureGuide =
    referenceUrls.length > 0
      ? referenceUrls.map((_, idx) => `Figure ${idx + 1}`).join(", ")
      : "the provided reference images";
  const resolvedCharacterPrompt = String(
    characterPrompt || `Exact identity lock for ${charName}.`
  ).trim();
  const expression = inferSceneExpression(sceneText, style || "");
  const userNegativePrompt = String(negativePrompt || "").trim();
  const lightingBlock = buildRealismLightingBlock(sceneText, style || "");
  const sceneIntegrationBlock = buildSceneIntegrationBlock(sceneText, style || "");
  const skinRealismBlock = buildSkinRealismBlock(sceneText, style || "");
  const cameraRealismBlock = buildCameraRealismBlock();
  const expressionEnforcementBlock = buildExpressionEnforcementBlock();
  const shadowInteractionBlock = buildShadowInteractionBlock();
  const microDetailBlock = buildMicroDetailBlock();
  const avoidBlock = [
    userNegativePrompt,
    "different person",
    "identity drift",
    "unrecognizable primary character",
    "reference background copied into final scene",
    "reference clothing copied into final scene",
    "neutral studio portrait instead of requested scene",
    buildLightingNegativeBlock(sceneText, style || ""),
    buildExpressionNegativeBlock(sceneText, style || ""),
    buildNegativeRealismBlock(),
  ]
    .filter(Boolean)
    .join(", ");

  return `
Use ${figureGuide} as reference images of the SAME real person.

SCENE PRIORITY (HIGHEST PRIORITY):
The requested scene, wardrobe, action, environment, and expression must be visible in the final image.
Do not recreate the reference photo setup if it conflicts with the requested scene.

IDENTITY LOCK (STRICT):
Keep the exact same facial identity of ${charName}.
Do not create a different person.
Do not beautify or alter facial structure.
Keep the same face shape, eyes, nose, lips, jawline, hairline, hairstyle, skin tone, age impression, facial hair pattern, and recognizable likeness.
Do not preserve the previous expression, mood, or facial muscle tension.

Identity anchor:
${resolvedCharacterPrompt}

${buildReferenceUsageBlock(sceneText)}

Reference rules:
- Figure 1 is the primary identity anchor.
- All other figures are supporting views of the same person.
- Keep identity locked even if angle, lighting, camera distance, pose, wardrobe, or environment changes.
- Preserve identity from the references, but obey the new scene instead of copying the source photo composition.

${buildCompositionBlock(sceneText, ratio)}

${buildIdentityVisibilityBlock(sceneText)}

Expression:
${expression.guidance}
Facial muscle behavior:
${expression.muscleGuide}
Expression emphasis:
${expression.weighted}
${expressionEnforcementBlock}

Lighting realism:
${lightingBlock}

Scene integration:
${sceneIntegrationBlock}

Skin realism:
${skinRealismBlock}

Camera realism:
${cameraRealismBlock}

Shadow interaction:
${shadowInteractionBlock}

Micro detail:
${microDetailBlock}

SCENE PROMPT:
${sceneText}

Style:
${style || "cinematic photorealistic still frame"}

Aspect ratio:
${ratio || "16:9"}

Quality:
photorealistic, realistic lighting interaction, realistic eyes, cinematic composition, grounded atmosphere, identity-locked primary subject.

Avoid:
${avoidBlock}
`.trim();
}

async function runSeedreamCharacterGeneration({
  prompt,
  referenceUrls,
  size,
  seed,
  onQueueUpdate,
}: {
  prompt: string;
  referenceUrls: string[];
  size?: string | null;
  seed?: number | null;
  onQueueUpdate?: (status: unknown) => void;
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
    startTimeout: 30,
    onQueueUpdate,
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
  onQueueUpdate,
}: {
  prompt: string;
  referenceUrls: string[];
  size?: string | null;
  seed?: number | null;
  onQueueUpdate?: (status: unknown) => void;
}) {
  return runSeedreamCharacterGeneration({
    prompt,
    referenceUrls,
    size,
    seed,
    onQueueUpdate,
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
        negativePrompt,
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

      let lastQueueStatus = "";
      let lastQueuePosition: number | null = null;
      let lastQueueUpdateAt = 0;
      const handleFalQueueUpdate = (status: unknown) => {
        const queueStatus = String((status as any)?.status || "").toUpperCase();
        const queuePosition =
          typeof (status as any)?.queue_position === "number"
            ? (status as any).queue_position
            : null;
        const queueRequestId = String((status as any)?.request_id || "").trim() || null;
        const nowMs = Date.now();
        const shouldSkip =
          queueStatus === lastQueueStatus &&
          queuePosition === lastQueuePosition &&
          nowMs - lastQueueUpdateAt < 10000;

        if (shouldSkip) return;

        lastQueueStatus = queueStatus;
        lastQueuePosition = queuePosition;
        lastQueueUpdateAt = nowMs;

        void persistGenerationRow({
          metadata: {
            lastProgressAt: new Date(nowMs).toISOString(),
            progressStage: mapFalQueueStage(status),
            falQueueStatus: queueStatus || null,
            falQueuePosition: queuePosition,
            falRequestId: queueRequestId,
          },
        }).catch((queueUpdateError: any) => {
          console.warn("generate-image: failed to persist FAL queue update", {
            generationId,
            queueStatus,
            queuePosition,
            error:
              queueUpdateError?.message ||
              "Unknown FAL queue update persistence error",
          });
        });
      };

      const generatedRemote = await runCharacterModel({
        prompt: seedreamPrompt,
        referenceUrls,
        size: size || ratio,
        seed,
        onQueueUpdate: handleFalQueueUpdate,
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

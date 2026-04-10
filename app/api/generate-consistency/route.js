import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});
import { IMAGE_TYPES, IMAGE_ORDER, PACK_VIEWS } from "../../../lib/character-constants";
import { createClient } from "@supabase/supabase-js";
import { after } from "next/server";
import {
  buildCameraRealismBlock,
  buildExpressionBlock,
  buildExpressionNegativeBlock,
  buildLightingBlock,
  buildLightingNegativeBlock,
  buildNegativeRealismBlock,
  buildRealismBlock,
  buildRealismLightingBlock,
  buildSceneIntegrationBlock,
  buildShadowInteractionBlock,
  buildSkinRealismBlock,
} from "../../../lib/image-generation-rules";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MODEL = "black-forest-labs/flux-1.1-pro-ultra";
const STORAGE_BUCKET = "character-refs";
const JOB_TIMEOUT_MS = 90 * 1000;

function normalizeReferenceImage(image) {
  if (!image || typeof image !== "string") return null;

  if (image.startsWith("data:image/")) return image;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;

  return null;
}

function mapSizeToAspectRatio(size) {
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

function extractFalImageUrl(result) {
  const image =
    result?.data?.images?.[0] ||
    result?.data?.image ||
    result?.images?.[0] ||
    result?.image ||
    null;

  return image?.url || null;
}

function detectViewType(prompt = "") {
  const p = String(prompt || "").toLowerCase();

  if (
    p.includes("left profile") ||
    p.includes("left side profile") ||
    p.includes("strict left side profile") ||
    p.includes("facing left")
  ) {
    return "left_profile";
  }

  if (
    p.includes("right profile") ||
    p.includes("right side profile") ||
    p.includes("strict right side profile") ||
    p.includes("facing right")
  ) {
    return "right_profile";
  }

  if (
    p.includes("back view") ||
    p.includes("back shot") ||
    p.includes("back full-body") ||
    p.includes("facing away from camera")
  ) {
    return "back";
  }

  if (
    p.includes("close-up") ||
    p.includes("close up") ||
    p.includes("upper-body close-up") ||
    p.includes("upper body close-up") ||
    p.includes("tight portrait") ||
    p.includes("portrait")
  ) {
    return "closeup";
  }

  if (
    p.includes("upper body") ||
    p.includes("upper-body") ||
    p.includes("mid shot") ||
    p.includes("medium shot")
  ) {
    return "upper_body";
  }

  if (p.includes("full body") || p.includes("full-body") || p.includes("head to toe")) {
    return "full_body";
  }

  return "auto";
}

function buildShotInstruction(viewType) {
  switch (viewType) {
    case "left_profile":
      return [
        "Single person only.",
        "Strict left side profile.",
        "Face turned to the left.",
        "Preserve exact facial identity even from the side.",
        "Full body visible unless the user request explicitly asks otherwise.",
        "Standing straight, neutral pose, relaxed arms.",
        "Do not turn toward camera.",
      ].join(" ");

    case "right_profile":
      return [
        "Single person only.",
        "Strict right side profile.",
        "Face turned to the right.",
        "Preserve exact facial identity even from the side.",
        "Full body visible unless the user request explicitly asks otherwise.",
        "Standing straight, neutral pose, relaxed arms.",
        "Do not turn toward camera.",
      ].join(" ");

    case "back":
      return [
        "Single person only.",
        "Back view.",
        "Maintain the same body type, hairstyle, hair length, silhouette, neck, shoulders, and overall identity.",
        "Standing straight, neutral pose, relaxed arms.",
        "Full body visible.",
        "Do not show multiple angles.",
      ].join(" ");

    case "closeup":
      return [
        "Single person only.",
        "Tight close-up portrait or upper-body close-up depending on the request.",
        "Face clearly visible and highly recognizable.",
        "Preserve exact face shape, skin tone, hairstyle, hairline, eyebrows, eyes, nose, lips, jawline, ears, and facial hair.",
        "Natural realistic photography.",
      ].join(" ");

    case "upper_body":
      return [
        "Single person only.",
        "Upper body / mid shot framing.",
        "Face clearly visible and highly recognizable.",
        "Preserve exact face shape, skin tone, hairstyle, hairline, eyebrows, eyes, nose, lips, jawline, ears, and facial hair.",
        "Natural realistic photography.",
      ].join(" ");

    case "full_body":
      return [
        "Single person only.",
        "Full body visible from head to toe.",
        "Face must still remain clearly visible and recognizable.",
        "Natural realistic photography.",
      ].join(" ");

    default:
      return [
        "Single person only.",
        "Choose the most natural framing based on the request.",
        "Keep the face clearly visible and recognizable unless the request explicitly asks otherwise.",
        "Natural realistic photography.",
      ].join(" ");
  }
}

function buildIdentityLockBlock(hasRefs, strictIdentity = true) {
  if (!hasRefs) {
    return [
      "Create one stable realistic human identity.",
      "Keep face structure, hairstyle, skin tone, body type, and overall appearance internally consistent.",
      "Do not beautify, idealize, or redesign the face.",
      "Do not change age, gender expression, ethnicity presentation, or facial structure unexpectedly.",
    ].join(" ");
  }

  const strictLines = strictIdentity
    ? [
        "CRITICAL: Reconstruct the exact same face from the reference image. Identity must match at pixel-level similarity.",
"Do not approximate. Do not reinterpret. Do not generate a similar face.",
"The generated face must be indistinguishable from the reference identity.",
"Use the FIRST reference image as the PRIMARY identity anchor. Other references are secondary.",
        "Preserve exact identity from the reference image(s).",
        "Preserve exact face shape, jawline, cheek structure, forehead, hairline, eyebrows, eyes, eyelids, nose shape, nostrils, lips, chin, ears, skin tone, hairstyle, hair texture, hair volume, neck, shoulders, and body proportions.",
        "If facial hair is present in the reference, preserve the same moustache, beard, stubble pattern, density, and placement.",
        "Do not turn this person into someone else.",
      ]
    : [
        "Use the provided reference image(s) as the same person.",
        "Keep the person recognizable and consistent with the reference image(s).",
      ];

  return [
    ...strictLines,
    "Do not beautify, idealize, glamorize, age-shift, masculinity-shift, femininity-shift, ethnicity-shift, or redesign the face.",
    "Do not smooth away real skin texture.",
    "Do not make the subject look like CGI, a 3D render, plastic skin, wax skin, or beauty-filtered skin.",
    "Only change pose, framing, outfit, camera angle, environment, lighting mood, and action when requested.",
    "Identity must remain the same person at all times.",
  ].join(" ");
}

function buildNegativeBlock(negativePrompt = "", viewType = "auto") {
  const base = [
    "different person",
    "wrong identity",
    "identity drift",
    "generic face",
    "altered face shape",
    "different jawline",
    "different cheek structure",
    "different nose",
    "different eyes",
    "different lips",
    "different eyebrows",
    "different hairstyle",
    "different hairline",
    "different skin tone",
    "beauty filter",
    "airbrushed skin",
    "plastic skin",
    "waxy skin",
    "excessive skin smoothing",
    "cgi look",
    "3d render",
    "stylized face",
    "anime face",
    "doll face",
    "over-retouched skin",
    "blurry face",
    "deformed face",
    "duplicate person",
    "multiple people",
    "extra person",
    "collage",
    "split screen",
    "contact sheet",
    "character sheet",
    "text",
    "watermark",
    "emotion mismatch",
  ];

  if (
    viewType === "full_body" ||
    viewType === "left_profile" ||
    viewType === "right_profile" ||
    viewType === "back"
  ) {
    base.push("close-up crop", "head-only crop", "partial body cut-off", "cropped feet", "cropped head");
  }

  if (negativePrompt && String(negativePrompt).trim()) {
    base.push(String(negativePrompt).trim());
  }

  return base.join(", ");
}

function buildFinalPrompt({
  prompt,
  hasRefs,
  viewType,
  negativePrompt = "",
  strictIdentity = true,
}) {
  const identityBlock = buildIdentityLockBlock(hasRefs, strictIdentity);
  const shotBlock = buildShotInstruction(viewType);
  const safePrompt = String(prompt || "").trim();
  const lightingBlock = buildLightingBlock(safePrompt);
  const realismLightingBlock = buildRealismLightingBlock(safePrompt);
  const sceneIntegrationBlock = buildSceneIntegrationBlock(safePrompt);
  const skinRealismBlock = buildSkinRealismBlock(safePrompt);
  const cameraRealismBlock = buildCameraRealismBlock();
  const shadowInteractionBlock = buildShadowInteractionBlock();
  const realismBlock = buildRealismBlock(safePrompt);
  const expressionBlock = buildExpressionBlock(safePrompt);
  const negativeBlock = [
    buildNegativeBlock(negativePrompt, viewType),
    buildLightingNegativeBlock(safePrompt),
    buildExpressionNegativeBlock(safePrompt),
    buildNegativeRealismBlock(),
  ]
    .filter(Boolean)
    .join(", ");

  const strictBlock = strictIdentity
    ? [
        "Strict identity preservation mode.",
        "Face must stay as close as possible to the reference identity.",
        "Hairstyle must stay as close as possible to the reference identity unless the request explicitly asks for a hairstyle change.",
        "Skin tone must stay as close as possible to the reference identity.",
        "Do not creatively reinterpret the person.",
      ].join(" ")
    : "";

const faceLockBlock = hasRefs
  ? [
      "Face identity priority: MAXIMUM.",
      "Body, pose, clothing, and environment are secondary.",
      "If conflict occurs, ALWAYS preserve face identity over everything else.",
    ].join(" ")
  : "";

  return [
    identityBlock,
    strictBlock,
    shotBlock,
    faceLockBlock,
    lightingBlock,
    realismLightingBlock,
    sceneIntegrationBlock,
    skinRealismBlock,
    cameraRealismBlock,
    shadowInteractionBlock,
    realismBlock,
    expressionBlock,
    `User request: ${safePrompt}`,
    `Avoid: ${negativeBlock}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function getExtensionFromContentType(contentType = "") {
  const type = String(contentType).toLowerCase();

  if (type.includes("png")) return "png";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  if (type.includes("webp")) return "webp";

  return "png";
}

async function savePermanentImage({ imageUrl, userId = "anonymous", folder = "consistency" }) {
  if (!imageUrl) return null;

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download generated image: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = getExtensionFromContentType(contentType);

  const filePath = `${userId}/${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload image to Supabase");
  }

  const { data: publicData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return publicData?.publicUrl || null;
}

async function runSingleGeneration({
  prompt,
  refs,
  size,
  negativePrompt,
  strictIdentity,
  userId,
}) {
 const hasRefs = refs.length > 0;
 const aspect_ratio = mapSizeToAspectRatio(size);
const viewType = detectViewType(prompt);
const seedreamSize = mapSizeToSeedreamSize(size);

const finalPrompt = `
CRITICAL:
This is the SAME EXACT person from the reference image.
Do NOT change identity.
Do NOT reinterpret face.
Do NOT generate a different person.

${buildFinalPrompt({
  prompt,
  hasRefs,
  viewType,
  negativePrompt,
  strictIdentity,
})}
`;

const masterImage = refs[0]; // 🔥 always use first as master

if (!masterImage) {
  throw new Error("Master identity image is required");
}

const input = {
  prompt: finalPrompt,
  image_size: seedreamSize,
  num_images: 1,

  image_urls: [masterImage], // 🔥 ONLY ONE IMAGE

  sync_mode: true,
};

  const output = await replicate.run(MODEL, {
  input: {
    prompt: finalPrompt,
    input_images: refs, // 🔥 IMPORTANT (replicate uses input_images)
    num_outputs: 1,
    aspect_ratio: aspect_ratio,
  },
});
  const tempUrl = Array.isArray(output) ? output[0] : output;

  if (!tempUrl) {
    throw new Error("No image URL returned from fal");
  }

  const permanentUrl = await savePermanentImage({
    imageUrl: tempUrl,
    userId,
    folder: "consistency",
  });

  return {
    imageUrl: permanentUrl,
    tempUrl,
    finalPrompt,
    viewType,
    hasRefs,
    aspect_ratio,
  };
}

function dedupeResults(results) {
  const seen = new Set();
  const deduped = [];

  for (const item of results) {
    if (!item?.url) continue;
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    deduped.push(item);
  }

  return deduped.map((item, index) => ({
    ...item,
    starred: index === 0,
  }));
}

async function createPendingGeneration({
  userId = "anonymous",
  prompt,
  negativePrompt = "",
  size = "1024x1024",
  metadata = {},
}) {
  const payload = {
    user_id: userId || "anonymous",
    prompt: String(prompt || "").trim(),
    negative_prompt: String(negativePrompt || "").trim(),
    images: [],
    mode: "consistency",
    ratio: mapSizeToAspectRatio(size),
    style: "photorealistic",
    metadata: {
      state: "processing",
      progressStage: "queued",
      startedAt: new Date().toISOString(),
      ...metadata,
    },
  };

  const { data, error } = await supabase
    .from("image_generations")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create generation job");
  }

  return data;
}

async function updateGenerationJob(generationId, patch) {
  const { data: existing } = await supabase
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

  const { error } = await supabase
    .from("image_generations")
    .update(nextPatch)
    .eq("id", generationId);

  if (error) {
    throw new Error(error.message || "Failed to update generation job");
  }
}

function mapSizeToSeedreamSize(size) {
  switch (size) {
    case "1024x1024":
      return "square_hd";
    case "1536x1024":
      return "landscape_16_9";
    case "1024x1536":
      return "portrait_4_3";
    default:
      return "square_hd";
  }
}

function isTimedOut(startedAtMs) {
  return Date.now() - startedAtMs >= JOB_TIMEOUT_MS;
}

async function runGenerationJob(generationId, payload) {
  const startedAtMs = Date.now();
  const {
    prompt,
    size = "1024x1024",
    referenceImages = [],
    negativePrompt = "",
    strictIdentity = true,
    attempts = 2,
    userId = "anonymous",
  } = payload || {};

  try {
let refs = Array.isArray(referenceImages)
  ? referenceImages.map(normalizeReferenceImage).filter(Boolean).slice(0, 8)
  : [];

// 🔥 CRITICAL: Always force master identity as FIRST reference
if (refs.length > 1) {
  const master = refs[0]; // assuming first is master identity
  refs = [master, ...refs.filter(r => r !== master)];
}

    const safeAttempts = Math.min(Math.max(Number(attempts) || 1, 1), 4);
    const results = [];
    let lastError = null;
    let debug = null;

    await updateGenerationJob(generationId, {
      metadata: {
        state: "processing",
        progressStage: "running",
        startedAt: new Date(startedAtMs).toISOString(),
        strictIdentity: Boolean(strictIdentity),
        requestedAttempts: safeAttempts,
        referenceCount: refs.length,
      },
    });

    for (let i = 0; i < safeAttempts; i += 1) {
      if (isTimedOut(startedAtMs)) break;

      try {
        const generated = await runSingleGeneration({
          prompt,
          refs,
          size,
          negativePrompt,
          strictIdentity,
          userId,
        });

        debug = {
          finalPrompt: generated.finalPrompt,
          viewType: generated.viewType,
          hasRefs: generated.hasRefs,
          aspect_ratio: generated.aspect_ratio,
        };

        if (generated.imageUrl) {
          results.push({
            url: generated.imageUrl,
            starred: results.length === 0,
            attempt: i + 1,
          });
        }
      } catch (err) {
        lastError = err;
        console.error(`Consistency attempt ${i + 1} failed:`, err);
      }
    }

    const dedupedResults = dedupeResults(results);
    const timedOut = isTimedOut(startedAtMs);

    if (!dedupedResults.length) {
      throw new Error(
        timedOut
          ? "Generation timed out before any completed image was produced."
          : lastError?.message || "No image returned from fal"
      );
    }

    await updateGenerationJob(generationId, {
      images: dedupedResults.map((item) => item.url).filter(Boolean),
      metadata: {
        state: "completed",
        progressStage: timedOut ? "completed_partial_timeout" : "completed",
        completedAt: new Date().toISOString(),
        timedOut,
        model: MODEL,
        referenceCount: refs.length,
        usedReferences: refs.length > 0,
        strictIdentity: Boolean(strictIdentity),
        attempts: safeAttempts,
        returnedCount: dedupedResults.length,
        viewType: debug?.viewType || detectViewType(prompt),
        aspectRatio: debug?.aspect_ratio || mapSizeToAspectRatio(size),
        finalPrompt: debug?.finalPrompt || null,
        error: null,
      },
    });
  } catch (error) {
    console.error("Consistency background job error:", error);

    await updateGenerationJob(generationId, {
      metadata: {
        state: "failed",
        progressStage: "failed",
        failedAt: new Date().toISOString(),
        error: error?.message || "Failed to generate consistency image",
      },
    });
  }
}

export async function POST(req) {
  try {
    const {
      prompt,
      size = "1024x1024",
      referenceImages = [],
      negativePrompt = "",
      strictIdentity = true,
      attempts = 2,
      userId = "anonymous",
    } = await req.json();

    if (!prompt || !String(prompt).trim()) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    const pending = await createPendingGeneration({
      userId,
      prompt,
      negativePrompt,
      size,
      metadata: {
        route: "generate-consistency",
        strictIdentity: Boolean(strictIdentity),
        attempts: Math.min(Math.max(Number(attempts) || 1, 1), 4),
        referenceCount: Array.isArray(referenceImages)
          ? referenceImages.filter(Boolean).length
          : 0,
      },
    });

    after(() =>
      runGenerationJob(pending.id, {
        prompt,
        size,
        referenceImages,
        negativePrompt,
        strictIdentity,
        attempts,
        userId,
      }).catch(console.error)
    );

    return Response.json({
      success: true,
      predictionId: pending.id,
      status: "processing",
    });
  } catch (error) {
    console.error("Consistency generation error:", error);
    return Response.json(
      { error: error?.message || "Failed to generate consistency image" },
      { status: 500 }
    );
  }
}

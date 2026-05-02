import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import Replicate from "replicate";
import { expandScene } from "../../../lib/movieStudio/scenePlanner";
import { chooseVideoModel, getVideoModelFallbackReason, VIDEO_MODEL_FALLBACK_REASON } from "../../../lib/movieStudio/modelRouter";
import { createKlingVideoPrediction, KLING_MODEL } from "../../../lib/movieStudio/videoAdapters/klingAdapter";

export const runtime = "nodejs";
export const maxDuration = 300;

const GENERATED_BUCKET = "generated-images";
const FLUX_2_MAX_MODEL = "black-forest-labs/flux-2-max";
const FLUX_2_PRO_MODEL = "black-forest-labs/flux-2-pro";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

function sanitizeText(value) {
  return String(value ?? "").trim();
}

function normalizeRatio(value) {
  const ratio = sanitizeText(value) || "16:9";
  return ratio === "Auto" ? "16:9" : ratio;
}

function normalizeDuration(value) {
  const raw = sanitizeText(value) || "5s";
  const seconds = Number.parseInt(raw.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(seconds) && seconds > 0 ? `${seconds}s` : "5s";
}

function normalizeFluxResolution(value) {
  const resolution = sanitizeText(value).toLowerCase();
  if (resolution.includes("4k")) return "2 MP";
  if (resolution.includes("1080")) return "1 MP";
  return "1 MP";
}

function assertServerConfig({ requireReplicate = true } = {}) {
  if (requireReplicate && !process.env.REPLICATE_API_TOKEN) {
    throw new Error("Movie Studio generation is not configured.");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Movie Studio storage is not configured.");
  }
}

function isReplicateBillingError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return (
    message.includes("insufficient credit") ||
    message.includes("payment required") ||
    message.includes("billing") ||
    message.includes("402")
  );
}

function isReplicateRateLimitError(error) {
  const status =
    error?.status ||
    error?.response?.status ||
    error?.cause?.status ||
    error?.request?.status;
  const message = String(error?.message || error || "").toLowerCase();

  return (
    status === 429 ||
    message.includes("too many requests") ||
    message.includes("rate limit") ||
    message.includes("throttled")
  );
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

  return null;
}

function buildHeroFramePrompt(scenePlan, { genre, resolution }) {
  return [
    "Premium cinematic hero frame for image-to-video generation.",
    `Original scene: ${scenePlan.scene}`,
    `Subject: ${scenePlan.subject}.`,
    `Action: ${scenePlan.action}.`,
    `Environment: ${scenePlan.environment}.`,
    `Lighting: ${scenePlan.lighting}.`,
    `Mood: ${scenePlan.mood}.`,
    `Camera: ${scenePlan.shotType}, ${scenePlan.cameraMovement}, ${scenePlan.lens}.`,
    `Genre language: ${genre || "general"}.`,
    `Target finish: ${resolution || "1080p"}, cinematic color grade, sharp hero composition, high production value.`,
    "No text, no captions, no UI, no watermark.",
  ].join(" ");
}

function buildVideoPrompt(scenePlan) {
  return [
    scenePlan.scene,
    `Animate this as ${scenePlan.motionIntent}.`,
    `Subject motion: ${scenePlan.action}.`,
    `Camera motion: ${scenePlan.cameraMovement}.`,
    `Maintain ${scenePlan.mood} mood, ${scenePlan.lighting}, and coherent physical motion.`,
  ].join(" ");
}

async function generateHeroFrame({ scenePlan, ratio, genre, resolution }) {
  const prompt = buildHeroFramePrompt(scenePlan, { genre, resolution });
  const input = {
    prompt,
    aspect_ratio: normalizeRatio(ratio),
    resolution: normalizeFluxResolution(resolution),
    output_format: "png",
    output_quality: 95,
    safety_tolerance: 2,
  };

  try {
    console.log("[MovieStudio] generating hero frame with:", FLUX_2_MAX_MODEL);
    const output = await replicate.run(FLUX_2_MAX_MODEL, { input });
    const heroFrameUrl = await fileOutputToUrl(output);
    if (!heroFrameUrl) {
      throw new Error("No hero frame URL returned from FLUX.2 Max.");
    }

    return {
      heroFrameUrl,
      imageModelUsed: FLUX_2_MAX_MODEL,
      heroPrompt: prompt,
    };
  } catch (primaryError) {
    console.log("[MovieStudio] hero frame failed:", primaryError?.message || primaryError);
    if (isReplicateRateLimitError(primaryError)) {
      throw primaryError;
    }

    console.warn("[Movie Studio] FLUX.2 Max failed, falling back to FLUX.2 Pro:", {
      error: primaryError?.message || "Unknown FLUX.2 Max error",
    });
  }

  try {
    console.log("[MovieStudio] generating hero frame with:", FLUX_2_PRO_MODEL);
    const fallbackOutput = await replicate.run(FLUX_2_PRO_MODEL, { input });
    const fallbackHeroFrameUrl = await fileOutputToUrl(fallbackOutput);
    if (!fallbackHeroFrameUrl) {
      throw new Error("No hero frame URL returned from FLUX.2 Pro.");
    }

    return {
      heroFrameUrl: fallbackHeroFrameUrl,
      imageModelUsed: FLUX_2_PRO_MODEL,
      heroPrompt: prompt,
    };
  } catch (fallbackError) {
    console.log("[MovieStudio] hero frame failed:", fallbackError?.message || fallbackError);
    throw fallbackError;
  }
}

function getExtensionFromContentType(contentType = "", fallback = "bin") {
  const value = String(contentType).toLowerCase();

  if (value.includes("mp4")) return "mp4";
  if (value.includes("webm")) return "webm";
  if (value.includes("quicktime")) return "mov";
  if (value.includes("png")) return "png";
  if (value.includes("jpeg") || value.includes("jpg")) return "jpg";
  if (value.includes("webp")) return "webp";

  return fallback;
}

function getExtensionFromUrl(url = "", fallback = "bin") {
  const path = String(url).split("?")[0].split("#")[0];
  const match = path.match(/\.([a-z0-9]{2,5})$/i);
  return match ? match[1].toLowerCase() : fallback;
}

function isVideoResponse(url, contentType) {
  const type = String(contentType || "").toLowerCase();
  return (
    type.startsWith("video/") ||
    /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(String(url || ""))
  );
}

async function downloadRemoteAsset(remoteUrl, { expectedType }) {
  const response = await fetch(remoteUrl);
  if (!response.ok) {
    throw new Error(`Failed to download generated ${expectedType}: ${response.status}`);
  }

  const contentType =
    response.headers.get("content-type") ||
    (expectedType === "video" ? "video/mp4" : "image/png");

  if (expectedType === "video" && !isVideoResponse(remoteUrl, contentType)) {
    throw new Error("The video model returned a non-video output.");
  }

  const arrayBuffer = await response.arrayBuffer();
  const fallbackExt = getExtensionFromUrl(remoteUrl, expectedType === "video" ? "mp4" : "png");
  const fileExt = getExtensionFromContentType(contentType, fallbackExt);
  let uploadContentType = contentType;

  if (expectedType === "video" && !String(contentType).toLowerCase().startsWith("video/")) {
    uploadContentType = fileExt === "mov" ? "video/quicktime" : `video/${fileExt === "m4v" ? "mp4" : fileExt}`;
  }

  if (expectedType === "image" && !String(contentType).toLowerCase().startsWith("image/")) {
    uploadContentType = `image/${fileExt === "jpg" ? "jpeg" : fileExt}`;
  }

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: uploadContentType,
    fileExt,
  };
}

async function uploadRemoteAsset({ remoteUrl, userId, kind, expectedType }) {
  const { buffer, contentType, fileExt } = await downloadRemoteAsset(remoteUrl, {
    expectedType,
  });

  const safeUserId = userId || "anonymous";
  const filePath = `${safeUserId}/movie-studio/${Date.now()}-${randomUUID()}-${kind}.${fileExt}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(GENERATED_BUCKET)
    .upload(filePath, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Supabase upload failed: ${uploadError.message}`);
  }

  const { data } = supabaseAdmin.storage
    .from(GENERATED_BUCKET)
    .getPublicUrl(filePath);

  return {
    publicUrl: data?.publicUrl || null,
    storagePath: filePath,
    contentType,
  };
}

async function createVideoPredictionForModel({ modelUsed, imageUrl, prompt, duration, ratio }) {
  if (modelUsed === "kling") {
    return await createKlingVideoPrediction({ imageUrl, prompt, duration, ratio });
  }

  throw new Error(VIDEO_MODEL_FALLBACK_REASON);
}

async function saveMovieGeneration({
  userId,
  prompt,
  ratio,
  genre,
  duration,
  resolution,
  camera,
  selectedModel,
  videoUrl = null,
  heroFrameUrl,
  videoStoragePath = null,
  heroFrameStoragePath,
  predictionId = null,
  state = "processing",
  modelUsed,
  imageModelUsed,
  modelFallbackReason = null,
  scenePlan,
  heroPrompt,
  videoPrompt,
}) {
  const payload = {
    user_id: userId,
    prompt,
    negative_prompt: scenePlan.negativePrompt,
    mode: "movie-studio",
    images: [
      {
        type: "video",
        url: videoUrl || null,
        heroFrameUrl,
        modelUsed,
        imageModelUsed,
      },
    ],
    ratio,
    style: genre || "general",
    created_at: new Date().toISOString(),
    metadata: {
      state,
      source: "studio",
      studioType: "Video",
      pipeline: "movie-studio-video-v1",
      provider: "replicate",
      model: modelUsed === "kling" ? KLING_MODEL : modelUsed,
      modelUsed,
      imageModelUsed,
      selectedModel,
      modelFallbackReason,
      remotePredictionId: predictionId,
      duration,
      resolution,
      camera,
      ratio,
      videoUrl,
      heroFrameUrl,
      videoStoragePath,
      heroFrameStoragePath,
      scenePlan,
      heroPrompt,
      videoPrompt,
      startedAt: new Date().toISOString(),
      completedAt: state === "succeeded" ? new Date().toISOString() : null,
    },
  };

  const { data, error } = await supabaseAdmin
    .from("image_generations")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to save Movie Studio generation.");
  }

  return data;
}

export async function POST(req) {
  try {
    console.log("[MovieStudio] received request");

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        {
          success: false,
          status: "failed",
          error: "Movie Studio generation failed.",
          details: "Malformed JSON request body.",
        },
        { status: 200 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json(
        {
          success: false,
          status: "failed",
          error: "Movie Studio generation failed.",
          details: "Request body must be a JSON object.",
        },
        { status: 200 }
      );
    }

    const prompt = sanitizeText(body.prompt);
    const userId = sanitizeText(body.userId);
    const duration = normalizeDuration(body.duration);
    const ratio = normalizeRatio(body.ratio);
    const resolution = sanitizeText(body.resolution) || "1080p";
    const genre = sanitizeText(body.genre) || "general";
    const camera = sanitizeText(body.camera) || "Auto";
    const selectedModel = sanitizeText(body.selectedModel).toLowerCase() || "auto";
    const mockMode = process.env.MOVIE_STUDIO_MOCK === "true" || body.mockMode === true;

    if (!prompt) {
      return Response.json(
        {
          success: false,
          status: "failed",
          error: "Describe a scene before generating.",
          details: "Missing prompt.",
        },
        { status: 200 }
      );
    }

    if (!userId) {
      return Response.json(
        {
          success: false,
          status: "failed",
          error: "Please log in to save Movie Studio generations to your account.",
          details: "Missing userId.",
        },
        { status: 200 }
      );
    }

    if (!mockMode) {
      assertServerConfig({ requireReplicate: true });
    }

    const scenePlan = expandScene(prompt, {
      duration,
      ratio,
      resolution,
      genre,
      camera,
    });
    console.log("[MovieStudio] scene planned");

    const videoPrompt = buildVideoPrompt(scenePlan);

    if (mockMode) {
      const heroFrameUrl = "/mock/movie-studio-hero.jpg";
      const imageModelUsed = "mock-flux-2-max";
      let generationId = null;
      const predictionId = `mock-${randomUUID()}`;
      let requestedModelFallbackReason = getVideoModelFallbackReason(selectedModel);

      console.log("[MovieStudio] generating hero frame");
      console.log("[MovieStudio] hero frame generated");
      let modelUsed = chooseVideoModel({
        selectedModel,
        motionIntent: scenePlan.motionIntent,
        mood: scenePlan.mood,
        prompt,
      });
      if (modelUsed !== "kling") {
        modelUsed = "kling";
        requestedModelFallbackReason ||= VIDEO_MODEL_FALLBACK_REASON;
      }
      console.log("[MovieStudio] selected video model:", modelUsed);
      console.log("[MovieStudio] generating video");
      console.log("[MovieStudio] video generated");
      console.log("[MovieStudio] saving to Supabase");

      try {
        const savedGeneration = await saveMovieGeneration({
          userId,
          prompt,
          ratio,
          genre,
          duration,
          resolution,
          camera,
          selectedModel,
          videoUrl: null,
          heroFrameUrl,
          videoStoragePath: null,
          heroFrameStoragePath: null,
          predictionId,
          state: "processing",
          modelUsed,
          imageModelUsed,
          modelFallbackReason: requestedModelFallbackReason,
          scenePlan,
          heroPrompt: "mock movie studio hero frame",
          videoPrompt,
        });
        generationId = savedGeneration?.id || null;
      } catch (mockSaveError) {
        console.warn("[MovieStudio] mock Supabase save failed:", mockSaveError);
      }

      console.log("[MovieStudio] done");
      console.log("[MovieStudio] returning processing response", {
        predictionId,
        generationId: generationId || null,
        heroFrameUrl: Boolean(heroFrameUrl),
        modelUsed: "kling",
      });

      return Response.json({
        success: true,
        status: "processing",
        predictionId,
        generationId: generationId || null,
        heroFrameUrl,
        videoUrl: null,
        modelUsed: "kling",
        imageModelUsed,
        scenePlan,
        meta: {
          pipeline: "movie-studio-video-v1",
          async: true,
          ...(requestedModelFallbackReason ? { modelFallbackReason: requestedModelFallbackReason } : {}),
          mock: true,
        },
      });
    }

    console.log("[MovieStudio] generating hero frame");
    const {
      heroFrameUrl: temporaryHeroFrameUrl,
      imageModelUsed,
      heroPrompt,
    } = await generateHeroFrame({
      scenePlan,
      ratio,
      genre,
      resolution,
    });
    console.log("[MovieStudio] hero frame generated");

    const heroUpload = await uploadRemoteAsset({
      remoteUrl: temporaryHeroFrameUrl,
      userId,
      kind: "hero-frame",
      expectedType: "image",
    });

    if (!heroUpload.publicUrl) {
      throw new Error("Failed to upload hero frame.");
    }

    let modelUsed = chooseVideoModel({
      selectedModel,
      motionIntent: scenePlan.motionIntent,
      mood: scenePlan.mood,
      prompt,
    });
    let requestedModelFallbackReason = getVideoModelFallbackReason(selectedModel);
    if (modelUsed !== "kling") {
      modelUsed = "kling";
      requestedModelFallbackReason ||= VIDEO_MODEL_FALLBACK_REASON;
    }
    console.log("[MovieStudio] selected video model:", modelUsed);

    console.log("[MovieStudio] generating video");
    const videoPrediction = await createVideoPredictionForModel({
      modelUsed,
      imageUrl: heroUpload.publicUrl,
      prompt: videoPrompt,
      duration,
      ratio,
    });

    const predictionId = videoPrediction?.id || null;
    if (!predictionId) {
      throw new Error("Kling did not return a prediction id.");
    }

    console.log("[MovieStudio] saving to Supabase");
    let savedGeneration = null;
    try {
      savedGeneration = await saveMovieGeneration({
        userId,
        prompt,
        ratio,
        genre,
        duration,
        resolution,
        camera,
        selectedModel,
        videoUrl: null,
        heroFrameUrl: heroUpload.publicUrl,
        videoStoragePath: null,
        heroFrameStoragePath: heroUpload.storagePath,
        predictionId,
        state: "processing",
        modelUsed,
        imageModelUsed,
        modelFallbackReason: requestedModelFallbackReason,
        scenePlan,
        heroPrompt,
        videoPrompt,
      });
    } catch (saveError) {
      console.warn("[MovieStudio] pending Supabase save failed:", saveError);
    }
    console.log("[MovieStudio] done");

    console.log("[MovieStudio] returning processing response", {
      predictionId,
      generationId: savedGeneration?.id || null,
      heroFrameUrl: Boolean(heroUpload.publicUrl),
      modelUsed: "kling",
    });

    return Response.json({
      success: true,
      status: "processing",
      predictionId,
      generationId: savedGeneration?.id || null,
      heroFrameUrl: heroUpload.publicUrl,
      videoUrl: null,
      modelUsed: "kling",
      imageModelUsed,
      scenePlan,
      meta: {
        pipeline: "movie-studio-video-v1",
        async: true,
        ...(requestedModelFallbackReason ? { modelFallbackReason: requestedModelFallbackReason } : {}),
      },
    });
  } catch (error) {
    console.error("[MovieStudio] route failed:", error);

    const details = error?.message || String(error);
    const rateLimitError = isReplicateRateLimitError(error);
    const billingError = isReplicateBillingError(error);

    return Response.json(
      {
        success: false,
        status: "failed",
        error: rateLimitError
          ? "Replicate is rate-limiting this request. Wait 1–2 minutes and try again."
          : billingError
            ? "Replicate credit is insufficient. Add credits or enable MOVIE_STUDIO_MOCK=true to test without generation."
            : "Movie Studio generation failed.",
        details,
        ...(rateLimitError ? { retryAfter: 60 } : {}),
      },
      { status: 200 }
    );
  }
}

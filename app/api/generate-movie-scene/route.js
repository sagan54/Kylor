import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import Replicate from "replicate";
import { expandScene } from "../../../lib/movieStudio/scenePlanner";
import { chooseVideoModel } from "../../../lib/movieStudio/modelRouter";
import { generateKlingVideo, KLING_MODEL } from "../../../lib/movieStudio/videoAdapters/klingAdapter";
import { generateVeoVideo } from "../../../lib/movieStudio/videoAdapters/veoAdapter";
import { generateSeedanceVideo } from "../../../lib/movieStudio/videoAdapters/seedanceAdapter";

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

function assertServerConfig() {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("Movie Studio generation is not configured.");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Movie Studio storage is not configured.");
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
    console.warn("[Movie Studio] FLUX.2 Max failed, falling back to FLUX.2 Pro:", {
      error: primaryError?.message || "Unknown FLUX.2 Max error",
    });
  }

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

async function generateVideoForModel({ modelUsed, imageUrl, prompt, duration, ratio }) {
  if (modelUsed === "kling") {
    return await generateKlingVideo({ imageUrl, prompt, duration, ratio });
  }

  if (modelUsed === "veo") {
    return await generateVeoVideo({ imageUrl, prompt, duration, ratio });
  }

  if (modelUsed === "seedance") {
    return await generateSeedanceVideo({ imageUrl, prompt, duration, ratio });
  }

  throw new Error("Selected video model is not supported.");
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
  videoUrl,
  heroFrameUrl,
  videoStoragePath,
  heroFrameStoragePath,
  modelUsed,
  imageModelUsed,
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
        url: videoUrl,
        heroFrameUrl,
        modelUsed,
        imageModelUsed,
      },
    ],
    ratio,
    style: genre || "general",
    created_at: new Date().toISOString(),
    metadata: {
      state: "succeeded",
      source: "studio",
      studioType: "Video",
      pipeline: "movie-studio-video-v1",
      provider: "replicate",
      model: modelUsed === "kling" ? KLING_MODEL : modelUsed,
      modelUsed,
      imageModelUsed,
      selectedModel,
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
      completedAt: new Date().toISOString(),
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

function friendlyError(error) {
  const message = String(error?.message || error || "Movie Studio generation failed.");
  const lowered = message.toLowerCase();

  if (message.includes("402") || lowered.includes("insufficient") || lowered.includes("payment") || lowered.includes("billing") || lowered.includes("credit")) {
    return "Insufficient generation credits. Please add credits and try again.";
  }

  if (message.includes("429") || lowered.includes("rate limit") || lowered.includes("too many requests")) {
    return "The video service is busy. Please wait a moment and try again.";
  }

  if (lowered.includes("timeout") || lowered.includes("timed out")) {
    return "Movie Studio generation timed out. Please try a shorter scene or try again.";
  }

  if (lowered.includes("non-video")) {
    return "The video model did not return a playable video. Please try again.";
  }

  if (lowered.includes("veo not configured")) {
    return "Veo is not configured yet. Please use Auto or Kling for now.";
  }

  if (lowered.includes("seedance not configured")) {
    return "Seedance is not configured yet. Please use Auto or Kling for now.";
  }

  if (lowered.includes("not configured")) {
    return message;
  }

  return "Movie Studio generation failed. Please try again.";
}

export async function POST(req) {
  try {
    assertServerConfig();

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { success: false, error: "Malformed JSON request body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json(
        { success: false, error: "Request body must be a JSON object." },
        { status: 400 }
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

    if (!prompt) {
      return Response.json(
        { success: false, error: "Describe a scene before generating." },
        { status: 400 }
      );
    }

    if (!userId) {
      return Response.json(
        { success: false, error: "Please log in to save Movie Studio generations to your account." },
        { status: 401 }
      );
    }

    const scenePlan = expandScene(prompt, {
      duration,
      ratio,
      resolution,
      genre,
      camera,
    });

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

    const heroUpload = await uploadRemoteAsset({
      remoteUrl: temporaryHeroFrameUrl,
      userId,
      kind: "hero-frame",
      expectedType: "image",
    });

    if (!heroUpload.publicUrl) {
      throw new Error("Failed to upload hero frame.");
    }

    const modelUsed = chooseVideoModel({
      selectedModel,
      motionIntent: scenePlan.motionIntent,
      mood: scenePlan.mood,
      prompt,
    });

    const videoPrompt = buildVideoPrompt(scenePlan);
    const temporaryVideoUrl = await generateVideoForModel({
      modelUsed,
      imageUrl: heroUpload.publicUrl,
      prompt: videoPrompt,
      duration,
      ratio,
    });

    const videoUpload = await uploadRemoteAsset({
      remoteUrl: temporaryVideoUrl,
      userId,
      kind: "video",
      expectedType: "video",
    });

    if (!videoUpload.publicUrl) {
      throw new Error("Failed to upload generated video.");
    }

    const savedGeneration = await saveMovieGeneration({
      userId,
      prompt,
      ratio,
      genre,
      duration,
      resolution,
      camera,
      selectedModel,
      videoUrl: videoUpload.publicUrl,
      heroFrameUrl: heroUpload.publicUrl,
      videoStoragePath: videoUpload.storagePath,
      heroFrameStoragePath: heroUpload.storagePath,
      modelUsed,
      imageModelUsed,
      scenePlan,
      heroPrompt,
      videoPrompt,
    });

    return Response.json({
      success: true,
      videoUrl: videoUpload.publicUrl,
      heroFrameUrl: heroUpload.publicUrl,
      modelUsed,
      imageModelUsed,
      scenePlan,
      generationId: savedGeneration.id,
    });
  } catch (error) {
    console.error("generate-movie-scene failed:", {
      message: error?.message || "Unknown Movie Studio error",
      stack: error?.stack || null,
    });

    return Response.json(
      {
        success: false,
        error: friendlyError(error),
      },
      { status: 500 }
    );
  }
}

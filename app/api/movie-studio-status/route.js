import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import Replicate from "replicate";
import { fileOutputToUrl } from "../../../lib/movieStudio/videoAdapters/klingAdapter";

export const runtime = "nodejs";
export const maxDuration = 300;

const GENERATED_BUCKET = "generated-images";

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

function getExtensionFromContentType(contentType = "", fallback = "mp4") {
  const value = String(contentType).toLowerCase();
  if (value.includes("mp4")) return "mp4";
  if (value.includes("webm")) return "webm";
  if (value.includes("quicktime")) return "mov";
  return fallback;
}

function getExtensionFromUrl(url = "", fallback = "mp4") {
  const path = String(url).split("?")[0].split("#")[0];
  const match = path.match(/\.([a-z0-9]{2,5})$/i);
  return match ? match[1].toLowerCase() : fallback;
}

function isVideoResponse(url, contentType) {
  const type = String(contentType || "").toLowerCase();
  return (
    type.startsWith("video/") ||
    type.includes("application/octet-stream") ||
    /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(String(url || ""))
  );
}

async function downloadVideo(remoteUrl) {
  const response = await fetch(remoteUrl);
  if (!response.ok) {
    throw new Error(`Failed to download generated video: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "video/mp4";
  if (!isVideoResponse(remoteUrl, contentType)) {
    throw new Error("The video model returned a non-video output.");
  }

  const fallbackExt = getExtensionFromUrl(remoteUrl, "mp4");
  const fileExt = getExtensionFromContentType(contentType, fallbackExt);
  let uploadContentType = contentType;

  if (!String(contentType).toLowerCase().startsWith("video/")) {
    uploadContentType = fileExt === "mov" ? "video/quicktime" : `video/${fileExt === "m4v" ? "mp4" : fileExt}`;
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: uploadContentType,
    fileExt,
  };
}

async function uploadVideo({ remoteUrl, userId }) {
  const { buffer, contentType, fileExt } = await downloadVideo(remoteUrl);
  const safeUserId = userId || "anonymous";
  const filePath = `${safeUserId}/movie-studio/${Date.now()}-${randomUUID()}-video.${fileExt}`;

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
  };
}

async function loadGeneration(generationId) {
  if (!generationId) return null;

  const { data, error } = await supabaseAdmin
    .from("image_generations")
    .select("*")
    .eq("id", generationId)
    .single();

  if (error) {
    console.warn("[MovieStudio] failed to load generation:", error);
    return null;
  }

  return data || null;
}

async function updateGeneration(generationId, patch) {
  if (!generationId) return;

  const { error } = await supabaseAdmin
    .from("image_generations")
    .update(patch)
    .eq("id", generationId);

  if (error) {
    console.warn("[MovieStudio] failed to update generation:", error);
  }
}

function buildFailedResponse({ predictionId, generationId, details }) {
  return Response.json({
    success: false,
    status: "failed",
    predictionId,
    generationId: generationId || null,
    error: "Movie Studio video generation failed.",
    details: details || "Unknown Movie Studio video error.",
  });
}

export async function GET(req) {
  let predictionId = null;
  let generationId = null;

  try {
    const { searchParams } = new URL(req.url);
    predictionId = sanitizeText(searchParams.get("predictionId"));
    generationId = sanitizeText(searchParams.get("generationId")) || null;

    if (!predictionId) {
      return buildFailedResponse({
        predictionId: null,
        generationId,
        details: "Missing predictionId.",
      });
    }

    if (predictionId.startsWith("mock-")) {
      const videoUrl = "/mock/movie-studio-video.mp4";
      const generation = await loadGeneration(generationId);
      const metadata = generation?.metadata || {};
      const heroFrameUrl = metadata.heroFrameUrl || generation?.images?.[0]?.heroFrameUrl || "/mock/movie-studio-hero.jpg";

      if (generationId && generation) {
        await updateGeneration(generationId, {
          images: [
            {
              type: "video",
              status: "succeeded",
              url: videoUrl,
              heroFrameUrl,
              modelUsed: "kling",
              imageModelUsed: metadata.imageModelUsed || "mock-flux-2-max",
              title: metadata.title || "Movie Scene",
              cinematicPreset: metadata.cinematicPreset || null,
              heroFramePrompt: metadata.heroPrompt || null,
              videoMotionPrompt: metadata.videoPrompt || null,
            },
          ],
          metadata: {
            ...metadata,
            state: "succeeded",
            videoUrl,
            completedAt: new Date().toISOString(),
          },
        });
      }

      return Response.json({
        success: true,
        status: "succeeded",
        predictionId,
        generationId: generationId || null,
        videoUrl,
      });
    }

    const prediction = await replicate.predictions.get(predictionId);
    const remoteStatus = String(prediction?.status || "").toLowerCase();

    if (remoteStatus === "starting" || remoteStatus === "processing" || remoteStatus === "queued") {
      return Response.json({
        success: true,
        status: "processing",
        predictionId,
        generationId: generationId || null,
      });
    }

    if (remoteStatus === "failed" || remoteStatus === "canceled" || remoteStatus === "cancelled") {
      const details = prediction?.error || `Replicate prediction ${remoteStatus}.`;
      const generation = await loadGeneration(generationId);
      if (generationId && generation) {
        await updateGeneration(generationId, {
          metadata: {
            ...(generation.metadata || {}),
            state: "failed",
            error: details,
            remoteStatus,
            completedAt: new Date().toISOString(),
          },
        });
      }

      return buildFailedResponse({ predictionId, generationId, details });
    }

    if (remoteStatus !== "succeeded") {
      return Response.json({
        success: true,
        status: "processing",
        predictionId,
        generationId: generationId || null,
      });
    }

    const remoteVideoUrl = await fileOutputToUrl(prediction?.output);
    if (!remoteVideoUrl) {
      const details = "Kling succeeded without returning a video URL.";
      return buildFailedResponse({ predictionId, generationId, details });
    }

    const generation = await loadGeneration(generationId);
    let videoUrl = remoteVideoUrl;
    let videoStoragePath = null;

    if (generation) {
      const upload = await uploadVideo({
        remoteUrl: remoteVideoUrl,
        userId: generation.user_id || "anonymous",
      });
      videoUrl = upload.publicUrl || remoteVideoUrl;
      videoStoragePath = upload.storagePath;

      const metadata = generation.metadata || {};
      const heroFrameUrl = metadata.heroFrameUrl || generation.images?.[0]?.heroFrameUrl || null;

      await updateGeneration(generationId, {
        images: [
          {
            type: "video",
            status: "succeeded",
            url: videoUrl,
            heroFrameUrl,
            modelUsed: metadata.modelUsed || "kling",
            imageModelUsed: metadata.imageModelUsed || null,
            title: metadata.title || "Movie Scene",
            cinematicPreset: metadata.cinematicPreset || null,
            heroFramePrompt: metadata.heroPrompt || null,
            videoMotionPrompt: metadata.videoPrompt || null,
          },
        ],
        metadata: {
          ...metadata,
          state: "succeeded",
          remoteStatus,
          videoUrl,
          videoStoragePath,
          completedAt: new Date().toISOString(),
        },
      });
    }

    return Response.json({
      success: true,
      status: "succeeded",
      predictionId,
      generationId: generationId || null,
      videoUrl,
    });
  } catch (error) {
    console.error("[MovieStudio] status route failed:", error);
    return buildFailedResponse({
      predictionId,
      generationId,
      details: error?.message || String(error),
    });
  }
}

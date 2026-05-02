import Replicate from "replicate";

export const KLING_MODEL = "kwaivgi/kling-v2.1-master";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

function normalizeDuration(duration) {
  const seconds = Number.parseInt(String(duration || "5").replace(/[^\d]/g, ""), 10);
  return seconds > 5 ? 10 : 5;
}

function normalizeRatio(ratio) {
  const value = String(ratio || "16:9").trim();
  return value === "Auto" ? "16:9" : value;
}

function normalizeKlingResolution(resolution) {
  const value = String(resolution || "1080p").toLowerCase();
  return value.includes("4k") ? "1080p" : "1080p";
}

export function getKlingResolutionWarning(resolution) {
  return String(resolution || "").toLowerCase().includes("4k")
    ? "4K is not enabled for Kling yet. Using 1080p for stable cinematic video."
    : null;
}

function buildKlingInput({ imageUrl, prompt, duration, ratio, resolution }) {
  return {
    prompt,
    start_image: imageUrl,
    duration: normalizeDuration(duration),
    aspect_ratio: normalizeRatio(ratio),
    resolution: normalizeKlingResolution(resolution),
    negative_prompt:
      "cartoon, anime, illustration, CGI, 3D render, plastic skin, waxy face, beauty filter, over-smoothed skin, low detail face, distorted eyes, deformed hands, extra fingers, bad anatomy, warped body, duplicated person, multiple faces, identity drift, changing clothes, changing hairstyle, flicker, jitter, unstable camera, melting objects, morphing face, unrealistic motion, floating body, broken limbs, low resolution, blurry, text, watermark, logo",
  };
}

export async function fileOutputToUrl(output) {
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

export async function createKlingVideoPrediction({ imageUrl, prompt, duration, ratio, resolution }) {
  if (!imageUrl) {
    throw new Error("Kling requires a hero frame image.");
  }

  return await replicate.predictions.create({
    model: KLING_MODEL,
    input: buildKlingInput({ imageUrl, prompt, duration, ratio, resolution }),
  });
}

export async function generateKlingVideo({ imageUrl, prompt, duration, ratio, resolution }) {
  if (!imageUrl) {
    throw new Error("Kling requires a hero frame image.");
  }

  const output = await replicate.run(KLING_MODEL, {
    input: buildKlingInput({ imageUrl, prompt, duration, ratio, resolution }),
  });

  const videoUrl = await fileOutputToUrl(output);
  if (!videoUrl) {
    throw new Error("Kling did not return a video URL.");
  }

  return videoUrl;
}

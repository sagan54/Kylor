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

function buildKlingInput({ imageUrl, prompt, duration, ratio }) {
  return {
    prompt,
    start_image: imageUrl,
    duration: normalizeDuration(duration),
    aspect_ratio: normalizeRatio(ratio),
    negative_prompt:
      "low quality, blurry, distorted, flicker, jitter, text, watermark, logo, malformed motion",
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

export async function createKlingVideoPrediction({ imageUrl, prompt, duration, ratio }) {
  if (!imageUrl) {
    throw new Error("Kling requires a hero frame image.");
  }

  return await replicate.predictions.create({
    model: KLING_MODEL,
    input: buildKlingInput({ imageUrl, prompt, duration, ratio }),
  });
}

export async function generateKlingVideo({ imageUrl, prompt, duration, ratio }) {
  if (!imageUrl) {
    throw new Error("Kling requires a hero frame image.");
  }

  const output = await replicate.run(KLING_MODEL, {
    input: buildKlingInput({ imageUrl, prompt, duration, ratio }),
  });

  const videoUrl = await fileOutputToUrl(output);
  if (!videoUrl) {
    throw new Error("Kling did not return a video URL.");
  }

  return videoUrl;
}

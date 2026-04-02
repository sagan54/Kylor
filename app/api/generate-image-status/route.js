import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fileOutputToUrl(output) {
  if (!output) return null;

  if (typeof output === "string") return output;

  if (Array.isArray(output)) {
    const first = output[0];
    if (!first) return null;
    if (typeof first === "string") return first;
    if (typeof first.url === "function") return first.url();
    if (typeof first.url === "string") return first.url;
    return null;
  }

  if (typeof output.url === "function") return output.url();
  if (typeof output.url === "string") return output.url;

  return null;
}

async function persistImageToSupabase({
  imageUrl,
  userId,
  bucket = "generated-images",
}) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download generated image: ${response.status} ${response.statusText}`
    );
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let ext = "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
  if (contentType.includes("webp")) ext = "webp";

  const filePath = `${userId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload image to Supabase");
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

  return {
    url: data.publicUrl,
    path: filePath,
    starred: false,
  };
}

export async function POST(req) {
  try {
    const { predictionId, userId } = await req.json();

    if (!predictionId) {
      return Response.json({ error: "predictionId is required" }, { status: 400 });
    }

    const prediction = await replicate.predictions.get(predictionId);

    if (prediction.status !== "succeeded") {
      return Response.json({
        status: prediction.status,
        predictionId,
        error: prediction.error || null,
      });
    }

    const outputUrl = await fileOutputToUrl(prediction.output);

    if (!outputUrl) {
      return Response.json(
        { error: "Prediction completed but no output URL was found." },
        { status: 500 }
      );
    }

    if (!userId) {
      return Response.json({
        status: "succeeded",
        predictionId,
        image: outputUrl,
        images: [{ url: outputUrl }],
      });
    }

    const storedImage = await persistImageToSupabase({
      imageUrl: outputUrl,
      userId: String(userId),
      bucket: "generated-images",
    });

    return Response.json({
      status: "succeeded",
      predictionId,
      image: storedImage.url,
      images: [storedImage],
    });
  } catch (error) {
    console.error("generate-image-status error:", error);
    return Response.json(
      { error: error?.message || "Failed to check prediction status" },
      { status: 500 }
    );
  }
}
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function normalizeReferenceImage(image) {
  if (!image || typeof image !== "string") return null;

  // Keep data URLs as-is
  if (image.startsWith("data:image/")) return image;

  // Allow normal https public URLs (for Supabase public bucket refs)
  if (image.startsWith("http://") || image.startsWith("https://")) return image;

  return null;
}

export async function POST(req) {
  try {
    const {
      prompt,
      size = "1024x1024",
      quality = "medium",
      n = 1,
      referenceImages = [],
    } = await req.json();

    if (!prompt || !prompt.trim()) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    const safeN = Math.min(Math.max(Number(n) || 1, 1), 4);

    const refs = Array.isArray(referenceImages)
      ? referenceImages.map(normalizeReferenceImage).filter(Boolean).slice(0, 5)
      : [];

    // Stronger identity-preserving prompt when refs exist
    const finalPrompt = refs.length
      ? [
          "Use the provided reference image(s) as the same real person.",
          "Preserve the exact identity, face shape, jawline, nose, eyes, lips, eyebrows, skin tone, and hairstyle.",
          "Do not beautify, idealize, age-shift, masculinize, or change facial structure.",
          "Keep the same person, only change pose / framing / scene as requested.",
          prompt,
        ].join(" ")
      : prompt;

    let result;

    if (refs.length > 0) {
      // When references exist, use image edit / image-conditioned generation
      result = await client.images.edit({
        model: "gpt-image-1",
        image: refs,
        prompt: finalPrompt,
        size,
        quality,
        output_format: "png",
      });
    } else {
      result = await client.images.generate({
        model: "gpt-image-1",
        prompt: finalPrompt,
        size,
        quality,
        output_format: "png",
        n: safeN,
      });
    }

    const images =
      result?.data
        ?.map((item) =>
          item?.b64_json ? `data:image/png;base64,${item.b64_json}` : null
        )
        .filter(Boolean) || [];

    if (!images.length) {
      return Response.json(
        { error: "No image returned from OpenAI" },
        { status: 500 }
      );
    }

    return Response.json({
      image: images[0],
      images,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return Response.json(
      { error: error?.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}
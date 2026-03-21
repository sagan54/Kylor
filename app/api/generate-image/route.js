import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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

    const hasRefs = refs.length > 0;

    let identityPrompt;

    if (hasRefs) {
      identityPrompt = [
        "Use the provided reference image(s) as the same real person.",
        "Preserve the exact identity, face shape, jawline, nose, eyes, lips, eyebrows, skin tone, and hairstyle.",
        "Do not beautify, idealize, age-shift, masculinize, feminize, or change facial structure.",
        "Keep the same person, only change pose, framing, outfit, and scene as requested.",
        prompt,
      ].join(" ");
    } else {
      identityPrompt = [
        "Generate a realistic human image.",
        "Maintain coherent and believable facial structure, skin tone, hairstyle, and body proportions.",
        "Do not beautify excessively or create artificial CGI-like skin.",
        prompt,
      ].join(" ");
    }

    const realismBoost = [
      "photorealistic",
      "natural skin texture",
      "visible pores",
      "realistic facial detail",
      "subtle imperfections",
      "natural lighting",
      "realistic shadows",
      "camera shot",
      "DSLR photography",
      "documentary realism",
      "true-to-life skin tone variation",
      "realistic fabric texture",
      "grounded photography",
      "no smoothing",
      "no plastic skin",
      "no waxy skin",
      "no beauty filter",
      "no cgi look",
      "no 3d render look",
    ].join(", ");

    const finalPrompt = `${identityPrompt}, ${realismBoost}`;
    const aspect_ratio = mapSizeToAspectRatio(size);

    const requests = Array.from({ length: safeN }, async () => {
      const input = hasRefs
        ? {
            prompt: finalPrompt,
            aspect_ratio,
            output_format: "png",
            reference_images: refs,
          }
        : {
            prompt: finalPrompt,
            aspect_ratio,
            output_format: "png",
          };

      const output = await replicate.run("black-forest-labs/flux-1.1-pro", {
        input,
      });

      if (Array.isArray(output)) return output[0] || null;
      return output || null;
    });

    const images = (await Promise.all(requests)).filter(Boolean);

    if (!images.length) {
      return Response.json(
        { error: "No image returned from Replicate" },
        { status: 500 }
      );
    }

    return Response.json({
      image: images[0],
      images,
      meta: {
        model: "black-forest-labs/flux-1.1-pro",
        quality,
        referenceCount: refs.length,
        usedReferences: hasRefs,
      },
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return Response.json(
      { error: error?.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}
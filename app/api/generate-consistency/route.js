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
      referenceImages = [],
    } = await req.json();

    if (!prompt || !prompt.trim()) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    const refs = Array.isArray(referenceImages)
      ? referenceImages.map(normalizeReferenceImage).filter(Boolean).slice(0, 8)
      : [];

    const hasRefs = refs.length > 0;
    const aspect_ratio = mapSizeToAspectRatio(size);

    let finalPrompt;

    if (hasRefs) {
      finalPrompt = [
        "Use the provided reference images as the same exact person.",
        "Preserve the exact identity, face shape, jawline, nose, eyes, lips, eyebrows, skin tone, hairstyle, and body type.",
        "Do not beautify, idealize, age-shift, masculinize, feminize, or change facial structure.",
        "Keep the same person, only change pose, framing, camera angle, outfit, and scene as requested.",
        "Maintain realistic human skin texture, natural pores, subtle imperfections, realistic lighting, and grounded photography.",
        "No plastic skin, no waxy skin, no beauty filter, no CGI look, no 3D render look.",
        prompt,
      ].join(" ");
    } else {
      finalPrompt = [
        "Generate the same character consistently and keep facial identity stable across future generations.",
        "Create a realistic human character with stable identity, stable facial structure, and stable overall appearance.",
        "Preserve face shape, jawline, nose, eyes, lips, eyebrows, skin tone, hairstyle, and body type consistently.",
        "Do not beautify, idealize, age-shift, masculinize, feminize, or change facial structure.",
        "Maintain realistic human skin texture, natural pores, subtle imperfections, realistic lighting, and grounded photography.",
        "No plastic skin, no waxy skin, no beauty filter, no CGI look, no 3D render look.",
        prompt,
      ].join(" ");
    }

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

    const output = await replicate.run("black-forest-labs/flux-2-pro", {
      input,
    });

    const images = Array.isArray(output)
      ? output.filter(Boolean)
      : [output].filter(Boolean);

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
        model: "black-forest-labs/flux-2-pro",
        referenceCount: refs.length,
        usedReferences: hasRefs,
      },
    });
  } catch (error) {
    console.error("Consistency generation error:", error);
    return Response.json(
      { error: error?.message || "Failed to generate consistency image" },
      { status: 500 }
    );
  }
}
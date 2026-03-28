import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MODEL = "black-forest-labs/flux-2-pro";
const STORAGE_BUCKET = "character-refs";

function normalizeReferenceImage(image) {
  if (!image || typeof image !== "string") return null;

  if (image.startsWith("data:image/")) return image;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;

  return null;
}

async function fileOutputToUrl(output) {
  if (!output) return null;

  if (typeof output === "string") return output;

  if (Array.isArray(output)) {
    const first = output[0];
    if (!first) return null;

    if (typeof first === "string") return first;
    if (typeof first.url === "function") return await first.url();
    if (typeof first.url === "string") return first.url;

    const s = typeof first.toString === "function" ? first.toString() : null;
    return s && s !== "[object Object]" ? s : null;
  }

  if (typeof output.url === "function") return await output.url();
  if (typeof output.url === "string") return output.url;

  const s = typeof output.toString === "function" ? output.toString() : null;
  return s && s !== "[object Object]" ? s : null;
}

function buildMasterIdentityPrompt({
  prompt = "",
  negativePrompt = "",
  strictIdentity = true,
  hasRefs = false,
}) {
  const identityBlock = hasRefs
    ? [
        "Generate the EXACT SAME real person as the provided reference image(s).",
        "This is a specific real human identity, not a similar-looking person.",
        "Preserve exact face shape, forehead, hairline, eyebrows, eyes, eyelids, nose, lips, ears, jawline, cheek structure, chin, skin tone, hair texture, hair volume, hairstyle, facial hair pattern, neck, and shoulders.",
        "Do not beautify, idealize, glamorize, or redesign the person.",
        "Do not generate a different person.",
      ].join(" ")
    : [
        "Generate one stable realistic human identity.",
        "Keep the exact same identity consistently across outputs.",
      ].join(" ");

  const strictBlock = strictIdentity
    ? [
        "Strict identity preservation mode.",
        "Face must stay as close as possible to the reference identity.",
        "Hairstyle must stay as close as possible to the reference identity.",
        "Skin tone must stay as close as possible to the reference identity.",
        "Do not creatively reinterpret the person.",
      ].join(" ")
    : "";

  const shotBlock = [
    "Single person only.",
    "Close-up or upper-body portrait.",
    "Face facing camera or very slight 3/4 angle only.",
    "Neutral expression.",
    "Plain light studio background.",
    "Neutral reference-photo style.",
    "Natural realistic photography.",
  ].join(" ");

  const realismBlock = [
    "Photorealistic human image.",
    "Natural skin texture, realistic pores, real facial detail, realistic hair strands.",
    "No waxy skin, no plastic skin, no CGI look, no 3D render look, no beauty-filtered face.",
  ].join(" ");

  const avoidBlock = [
    "Avoid: different person, identity drift, generic face, altered face shape, altered nose, altered eyes, altered lips, altered jawline, changed hairstyle, changed hairline, changed skin tone, changed beard, multiple people, collage, split screen, text, watermark",
    negativePrompt || "",
  ]
    .filter(Boolean)
    .join(", ");

  return [
    identityBlock,
    strictBlock,
    shotBlock,
    realismBlock,
    `User request: ${String(prompt || "").trim() || "close-up master identity portrait"}`,
    `Avoid: ${avoidBlock}`,
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

async function savePermanentImage({ imageUrl, userId = "anonymous", folder = "master" }) {
  if (!imageUrl) return null;

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download Replicate image: ${response.status}`);
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

async function runSingleCandidate({
  refs,
  prompt,
  negativePrompt,
  strictIdentity,
  userId,
}) {
  const finalPrompt = buildMasterIdentityPrompt({
    prompt,
    negativePrompt,
    strictIdentity,
    hasRefs: refs.length > 0,
  });

  const input =
    refs.length > 0
      ? {
          prompt: finalPrompt,
          aspect_ratio: "1:1",
          output_format: "png",
          reference_images: refs,
        }
      : {
          prompt: finalPrompt,
          aspect_ratio: "1:1",
          output_format: "png",
        };

  const output = await replicate.run(MODEL, { input });
  const tempUrl = await fileOutputToUrl(output);

  if (!tempUrl) {
    throw new Error("No image URL returned from Replicate");
  }

  const permanentUrl = await savePermanentImage({
    imageUrl: tempUrl,
    userId,
    folder: "master",
  });

  return {
    imageUrl: permanentUrl,
    tempUrl,
    finalPrompt,
  };
}

export async function POST(req) {
  try {
    const {
      prompt = "",
      referenceImages = [],
      negativePrompt = "",
      strictIdentity = true,
      candidates = 4,
      userId = "anonymous",
    } = await req.json();

    const refs = Array.isArray(referenceImages)
      ? referenceImages.map(normalizeReferenceImage).filter(Boolean).slice(0, 8)
      : [];

    if (!refs.length) {
      return Response.json(
        { error: "At least one reference image is required" },
        { status: 400 }
      );
    }

    const safeCandidates = Math.min(Math.max(Number(candidates) || 4, 1), 6);

    const results = [];
    let lastError = null;
    let debugPrompt = null;

    for (let i = 0; i < safeCandidates; i += 1) {
      try {
        const candidate = await runSingleCandidate({
          refs,
          prompt,
          negativePrompt,
          strictIdentity,
          userId,
        });

        debugPrompt = candidate.finalPrompt;

        if (candidate.imageUrl) {
          results.push({
            id: `master-${Date.now()}-${i}`,
            url: candidate.imageUrl,
            attempt: i + 1,
          });
        }
      } catch (err) {
        lastError = err;
        console.error(`Master identity candidate ${i + 1} failed:`, err);
      }
    }

    if (!results.length) {
      return Response.json(
        { error: lastError?.message || "No master identity images returned" },
        { status: 500 }
      );
    }

    return Response.json({
      image: results[0]?.url || null,
      images: results,
      meta: {
        model: MODEL,
        returnedCount: results.length,
        strictIdentity: Boolean(strictIdentity),
        referenceCount: refs.length,
        finalPrompt: debugPrompt,
      },
    });
  } catch (error) {
    console.error("Master identity generation error:", error);
    return Response.json(
      { error: error?.message || "Failed to generate master identity" },
      { status: 500 }
    );
  }
}
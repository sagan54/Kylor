import { fal } from "@fal-ai/client";
import { createClient } from "@supabase/supabase-js";
import {
  buildCameraRealismBlock,
  buildLightingNegativeBlock,
  buildNegativeRealismBlock,
  buildRealismLightingBlock,
  buildShadowInteractionBlock,
  buildSkinRealismBlock,
} from "../../../lib/image-generation-rules";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

fal.config({
  credentials: process.env.FAL_KEY,
});

const MODEL = "fal-ai/bytedance/seedream/v4.5/edit";
const STORAGE_BUCKET = "character-refs";

function getSeedreamSize(size = "1024x1536") {
  switch (String(size || "").toLowerCase()) {
    case "1024x1024":
    case "square":
    case "1:1":
      return "square_hd";
    case "1536x1024":
    case "landscape":
    case "16:9":
      return "landscape_16_9";
    case "1024x1536":
    case "portrait":
    case "2:3":
    default:
      return "portrait_4_3";
  }
}

function normalizeReferenceImage(image) {
  if (!image || typeof image !== "string") return null;

  if (image.startsWith("data:image/")) return image;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;

  return null;
}

function extractFalImageUrl(result) {
  const image =
    result?.data?.images?.[0] ||
    result?.data?.image ||
    result?.images?.[0] ||
    result?.image ||
    null;

  return image?.url || null;
}

function buildMasterIdentityPrompt({
  prompt = "",
  negativePrompt = "",
  strictIdentity = true,
  hasRefs = false,
}) {
  const safePrompt = String(prompt || "").trim();
  const identityBlock = hasRefs
    ? [
        "Generate the EXACT SAME real person as the provided reference image(s).",
        "This is a real specific human identity, not a similar-looking person.",
        "The output must preserve the exact same ethnicity, facial identity, and overall appearance from the reference.",
        "Preserve exact face shape, skull shape, forehead, hairline, eyebrows, eyes, eyelids, nose bridge, nose tip, nostrils, lips, ears, jawline, cheek structure, chin, skin tone family, hair texture, hair density, hair volume, hairstyle, neck, and shoulders.",
        "Do not beautify, idealize, glamorize, age-shift, gender-shift, or ethnicity-shift the person.",
        "Do not generate a different person.",
        "Similarity is not enough. Identity match is required.",
      ].join(" ")
    : [
        "Generate one stable realistic human identity.",
        "Keep the exact same identity consistently across outputs.",
      ].join(" ");

  const strictBlock = strictIdentity
    ? [
        "Strict identity preservation mode.",
        "Face must remain as close as possible to the uploaded reference identity.",
        "Ethnicity must remain the same as the uploaded reference identity.",
        "Skin tone family must remain the same as the uploaded reference identity.",
        "Hairstyle, hairline, and facial proportions must remain as close as possible to the uploaded reference identity.",
        "Do not creatively reinterpret the person.",
      ].join(" ")
    : "";

  const shotBlock = [
    "Single person only.",
    "Clean close-up or upper-body portrait.",
    "Facing camera or very slight 3/4 angle only.",
    "Neutral expression.",
    "Simple clean background with realistic portrait framing.",
    "Reference-photo style.",
    "Natural realistic photography.",
  ].join(" ");

  const realismLightingBlock = buildRealismLightingBlock(safePrompt || shotBlock);
  const skinRealismBlock = buildSkinRealismBlock(safePrompt || shotBlock);
  const cameraRealismBlock = buildCameraRealismBlock();
  const shadowInteractionBlock = buildShadowInteractionBlock();
  const realismBlock = [
    "Photorealistic real human portrait.",
    "Natural facial depth, grounded exposure, realistic hair strands, and physically believable portrait rendering.",
    "No beauty retouching, no glamour look, no CGI, no 3D render, no stylized face.",
  ].join(" ");

  const avoidBlock = [
    "different person",
    "wrong identity",
    "identity drift",
    "different ethnicity",
    "ethnicity shift",
    "different skin tone family",
    "generic face",
    "altered face shape",
    "altered skull shape",
    "altered forehead",
    "altered jawline",
    "altered cheek structure",
    "altered nose",
    "altered eyes",
    "altered lips",
    "altered eyebrows",
    "changed hairstyle",
    "changed hairline",
    "changed facial proportions",
    "beauty filter",
    "airbrushed skin",
    "glamour portrait",
    "waxy skin",
    "plastic skin",
    "skin smoothing",
    "cgi",
    "3d render",
    "flat frontal lighting",
    "studio-lit face in a dark scene",
    buildLightingNegativeBlock(safePrompt || shotBlock),
    buildNegativeRealismBlock(),
    "multiple people",
    "collage",
    "split screen",
    "text",
    "watermark",
    negativePrompt || "",
  ]
    .filter(Boolean)
    .join(", ");

  return [
    identityBlock,
    strictBlock,
    shotBlock,
    realismLightingBlock,
    skinRealismBlock,
    cameraRealismBlock,
    shadowInteractionBlock,
    realismBlock,
    `User request: ${safePrompt || "exact same real-person master identity portrait"}`,
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
    throw new Error(`Failed to download generated image: ${response.status}`);
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
          image_size: getSeedreamSize("1024x1536"),
          num_images: 1,
          image_urls: refs,
          sync_mode: true,
        }
      : {
          prompt: finalPrompt,
          image_size: getSeedreamSize("1024x1536"),
          num_images: 1,
          sync_mode: true,
        };

  const output = await fal.subscribe(MODEL, { input });
  const tempUrl = extractFalImageUrl(output);

  if (!tempUrl) {
    throw new Error("No image URL returned from fal");
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
      candidates = 1,
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

    const safeCandidates = Math.min(Math.max(Number(candidates) || 1, 1), 4);

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

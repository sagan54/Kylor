import Replicate from "replicate";
import { IMAGE_TYPES, IMAGE_ORDER, PACK_VIEWS } from "../../../lib/character-constants";
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

function detectViewType(prompt = "") {
  const p = String(prompt || "").toLowerCase();

  if (
    p.includes("left profile") ||
    p.includes("left side profile") ||
    p.includes("strict left side profile") ||
    p.includes("facing left")
  ) {
    return "left_profile";
  }

  if (
    p.includes("right profile") ||
    p.includes("right side profile") ||
    p.includes("strict right side profile") ||
    p.includes("facing right")
  ) {
    return "right_profile";
  }

  if (
    p.includes("back view") ||
    p.includes("back shot") ||
    p.includes("back full-body") ||
    p.includes("facing away from camera")
  ) {
    return "back";
  }

  if (
    p.includes("close-up") ||
    p.includes("close up") ||
    p.includes("upper-body close-up") ||
    p.includes("upper body close-up") ||
    p.includes("tight portrait") ||
    p.includes("portrait")
  ) {
    return "closeup";
  }

  if (
    p.includes("upper body") ||
    p.includes("upper-body") ||
    p.includes("mid shot") ||
    p.includes("medium shot")
  ) {
    return "upper_body";
  }

  if (p.includes("full body") || p.includes("full-body") || p.includes("head to toe")) {
    return "full_body";
  }

  return "auto";
}

function buildShotInstruction(viewType) {
  switch (viewType) {
    case "left_profile":
      return [
        "Single person only.",
        "Strict left side profile.",
        "Face turned to the left.",
        "Preserve exact facial identity even from the side.",
        "Full body visible unless the user request explicitly asks otherwise.",
        "Standing straight, neutral pose, relaxed arms.",
        "Do not turn toward camera.",
      ].join(" ");

    case "right_profile":
      return [
        "Single person only.",
        "Strict right side profile.",
        "Face turned to the right.",
        "Preserve exact facial identity even from the side.",
        "Full body visible unless the user request explicitly asks otherwise.",
        "Standing straight, neutral pose, relaxed arms.",
        "Do not turn toward camera.",
      ].join(" ");

    case "back":
      return [
        "Single person only.",
        "Back view.",
        "Maintain the same body type, hairstyle, hair length, silhouette, neck, shoulders, and overall identity.",
        "Standing straight, neutral pose, relaxed arms.",
        "Full body visible.",
        "Do not show multiple angles.",
      ].join(" ");

    case "closeup":
      return [
        "Single person only.",
        "Tight close-up portrait or upper-body close-up depending on the request.",
        "Face clearly visible and highly recognizable.",
        "Preserve exact face shape, skin tone, hairstyle, hairline, eyebrows, eyes, nose, lips, jawline, ears, and facial hair.",
        "Natural realistic photography.",
      ].join(" ");

    case "upper_body":
      return [
        "Single person only.",
        "Upper body / mid shot framing.",
        "Face clearly visible and highly recognizable.",
        "Preserve exact face shape, skin tone, hairstyle, hairline, eyebrows, eyes, nose, lips, jawline, ears, and facial hair.",
        "Natural realistic photography.",
      ].join(" ");

    case "full_body":
      return [
        "Single person only.",
        "Full body visible from head to toe.",
        "Face must still remain clearly visible and recognizable.",
        "Natural realistic photography.",
      ].join(" ");

    default:
      return [
        "Single person only.",
        "Choose the most natural framing based on the request.",
        "Keep the face clearly visible and recognizable unless the request explicitly asks otherwise.",
        "Natural realistic photography.",
      ].join(" ");
  }
}

function buildIdentityLockBlock(hasRefs, strictIdentity = true) {
  if (!hasRefs) {
    return [
      "Create one stable realistic human identity.",
      "Keep face structure, hairstyle, skin tone, body type, and overall appearance internally consistent.",
      "Do not beautify, idealize, or redesign the face.",
      "Do not change age, gender expression, ethnicity presentation, or facial structure unexpectedly.",
    ].join(" ");
  }

  const strictLines = strictIdentity
    ? [
        "This is the SAME EXACT person from the reference image(s), not a similar-looking person.",
        "Preserve exact identity from the reference image(s).",
        "Preserve exact face shape, jawline, cheek structure, forehead, hairline, eyebrows, eyes, eyelids, nose shape, nostrils, lips, chin, ears, skin tone, hairstyle, hair texture, hair volume, neck, shoulders, and body proportions.",
        "If facial hair is present in the reference, preserve the same moustache, beard, stubble pattern, density, and placement.",
        "Do not turn this person into someone else.",
      ]
    : [
        "Use the provided reference image(s) as the same person.",
        "Keep the person recognizable and consistent with the reference image(s).",
      ];

  return [
    ...strictLines,
    "Do not beautify, idealize, glamorize, age-shift, masculinity-shift, femininity-shift, ethnicity-shift, or redesign the face.",
    "Do not smooth away real skin texture.",
    "Do not make the subject look like CGI, a 3D render, plastic skin, wax skin, or beauty-filtered skin.",
    "Only change pose, framing, outfit, camera angle, environment, lighting mood, and action when requested.",
    "Identity must remain the same person at all times.",
  ].join(" ");
}

function buildNegativeBlock(negativePrompt = "", viewType = "auto") {
  const base = [
    "different person",
    "wrong identity",
    "identity drift",
    "generic face",
    "altered face shape",
    "different jawline",
    "different cheek structure",
    "different nose",
    "different eyes",
    "different lips",
    "different eyebrows",
    "different hairstyle",
    "different hairline",
    "different skin tone",
    "beauty filter",
    "plastic skin",
    "waxy skin",
    "cgi look",
    "3d render",
    "stylized face",
    "anime face",
    "doll face",
    "over-retouched skin",
    "blurry face",
    "deformed face",
    "duplicate person",
    "multiple people",
    "extra person",
    "collage",
    "split screen",
    "contact sheet",
    "character sheet",
    "text",
    "watermark",
  ];

  if (
    viewType === "full_body" ||
    viewType === "left_profile" ||
    viewType === "right_profile" ||
    viewType === "back"
  ) {
    base.push("close-up crop", "head-only crop", "partial body cut-off", "cropped feet", "cropped head");
  }

  if (negativePrompt && String(negativePrompt).trim()) {
    base.push(String(negativePrompt).trim());
  }

  return base.join(", ");
}

function buildFinalPrompt({
  prompt,
  hasRefs,
  viewType,
  negativePrompt = "",
  strictIdentity = true,
}) {
  const identityBlock = buildIdentityLockBlock(hasRefs, strictIdentity);
  const shotBlock = buildShotInstruction(viewType);
  const negativeBlock = buildNegativeBlock(negativePrompt, viewType);

  const realismBlock = [
    "Highly realistic human photography.",
    "Natural skin texture, natural pores, realistic hair strands, realistic facial detail.",
    "Grounded lighting, physically believable skin and hair.",
    "No over-stylization.",
  ].join(" ");

  const strictBlock = strictIdentity
    ? [
        "Strict identity preservation mode.",
        "Face must stay as close as possible to the reference identity.",
        "Hairstyle must stay as close as possible to the reference identity unless the request explicitly asks for a hairstyle change.",
        "Skin tone must stay as close as possible to the reference identity.",
        "Do not creatively reinterpret the person.",
      ].join(" ")
    : "";

  return [
    identityBlock,
    strictBlock,
    shotBlock,
    realismBlock,
    `User request: ${String(prompt || "").trim()}`,
    `Avoid: ${negativeBlock}`,
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

async function savePermanentImage({ imageUrl, userId = "anonymous", folder = "consistency" }) {
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

async function runSingleGeneration({
  prompt,
  refs,
  size,
  negativePrompt,
  strictIdentity,
  userId,
}) {
  // ✅ SAFE PROMPT HANDLING (critical fix)
  const safePrompt =
    prompt && String(prompt).trim()
      ? prompt
      : "Same exact person, preserve identity";

  const hasRefs = refs.length > 0;
  const aspect_ratio = mapSizeToAspectRatio(size);

  // ✅ uses safePrompt now
  const viewType = detectViewType(safePrompt);

  const finalPrompt = buildFinalPrompt({
    prompt: safePrompt,
    hasRefs,
    viewType,
    negativePrompt,
    strictIdentity,
  });

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

  const output = await replicate.run(MODEL, { input });
  const tempUrl = await fileOutputToUrl(output);

  if (!tempUrl) {
    throw new Error("No image URL returned from Replicate");
  }

  const permanentUrl = await savePermanentImage({
    imageUrl: tempUrl,
    userId,
    folder: "consistency",
  });

  return {
    imageUrl: permanentUrl,
    tempUrl,
    finalPrompt,
    viewType,
    hasRefs,
    aspect_ratio,
  };
}

function dedupeResults(results) {
  const seen = new Set();
  const deduped = [];

  for (const item of results) {
    if (!item?.url) continue;
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    deduped.push(item);
  }

  return deduped.map((item, index) => ({
    ...item,
    starred: index === 0,
  }));
}

export async function POST(req) {
  try {
const {
  prompt,
  size = "1024x1024",
  referenceImages = [],
  negativePrompt = "",
  strictIdentity = true,
  attempts = 2,
  userId = "anonymous",
} = await req.json();

const safePrompt =
  prompt && String(prompt).trim()
    ? prompt
    : "Same exact person, preserve identity";

    const refs = Array.isArray(referenceImages)
      ? referenceImages.map(normalizeReferenceImage).filter(Boolean).slice(0, 8)
      : [];

    const safeAttempts = Math.min(Math.max(Number(attempts) || 1, 1), 4);

    let results = [];
    let lastError = null;
    let debug = null;

    for (let i = 0; i < safeAttempts; i += 1) {
      try {
        const generated = await runSingleGeneration({
          prompt,
          refs,
          size,
          negativePrompt,
          strictIdentity,
          userId,
        });

        debug = {
          finalPrompt: generated.finalPrompt,
          viewType: generated.viewType,
          hasRefs: generated.hasRefs,
          aspect_ratio: generated.aspect_ratio,
        };

        if (generated.imageUrl) {
          results.push({
            url: generated.imageUrl,
            starred: results.length === 0,
            attempt: i + 1,
          });
        }
      } catch (err) {
        lastError = err;
        console.error(`Consistency attempt ${i + 1} failed:`, err);
      }
    }

    results = dedupeResults(results);

    if (!results.length) {
      return Response.json(
        {
          error: lastError?.message || "No image returned from Replicate",
        },
        { status: 500 }
      );
    }

    return Response.json({
      image: results[0].url,
      images: results,
      meta: {
        model: MODEL,
        referenceCount: refs.length,
        usedReferences: refs.length > 0,
        strictIdentity: Boolean(strictIdentity),
        attempts: safeAttempts,
        returnedCount: results.length,
        viewType: debug?.viewType || detectViewType(prompt),
        aspectRatio: debug?.aspect_ratio || mapSizeToAspectRatio(size),
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
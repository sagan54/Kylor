import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";
import { IMAGE_TYPES } from "../../../lib/character-constants";

// ─── CONSTANTS ─────────────────────────────────────────

const SORT_ORDER = {
  [IMAGE_TYPES.FRONT]: 0,
  [IMAGE_TYPES.CLOSEUP]: 1,
  [IMAGE_TYPES.LEFT]: 2,
  [IMAGE_TYPES.RIGHT]: 3,
  [IMAGE_TYPES.BACK]: 4,
};

const CLEAN_VIEWS = [
  { key: IMAGE_TYPES.FRONT },
  { key: IMAGE_TYPES.CLOSEUP },
  { key: IMAGE_TYPES.LEFT },
  { key: IMAGE_TYPES.RIGHT },
  { key: IMAGE_TYPES.BACK },
];

const MODEL = "black-forest-labs/flux-1.1-pro-ultra";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── UTILS ─────────────────────────────────────────

function normalizeReferenceImage(image) {
  if (!image) return null;
  if (image.startsWith("http") || image.startsWith("data:image/")) return image;
  return null;
}

function mapSizeToAspectRatio(size) {
  if (size === "1024x1536") return "2:3";
  if (size === "1024x1024") return "1:1";
  return "2:3";
}

// ─── PROMPT SYSTEM (ULTIMATE LOCK) ─────────────────────────────────────────

function buildPrompt(viewType) {
  const identity = `
IDENTITY LOCK — HIGHEST PRIORITY

This is the SAME EXACT person from the reference image.

FACE IS THE PRIMARY IDENTITY ANCHOR.

The face must match EXACTLY:
- same skull structure
- same eyes
- same nose
- same lips
- same jawline
- same cheek structure
- same skin tone
- same hairline and hairstyle

DO NOT:
- generate a different person
- generate a similar person
- reinterpret identity
- beautify or stylize the face
- change ethnicity, gender, or age

If the face differs even slightly, the image is incorrect.
`;

  const environment = `
Clean neutral studio background.
Light grey background only.
No lighting variation.
No cinematic effects.
Same camera setup across all images.
`;

  const shots = {
    front: "Front-facing full body. Standing straight. Full body visible.",
    closeup: "Upper body close-up. Face centered. Must EXACTLY match reference face.",
    left: "Strict LEFT profile. 90-degree side view. Full body visible.",
    right: "Strict RIGHT profile. 90-degree side view. Full body visible.",
    back: "Full body BACK view. No face visible. Facing completely away.",
  };

  return `${identity}\n\n${environment}\n\n${shots[viewType]}`;
}

function buildNegativePrompt() {
  return [
    "different person",
    "identity drift",
    "different face",
    "face mutation",
    "new identity",
    "face variation",
    "multiple people",
    "collage",
    "split screen",
  ].join(", ");
}

// ─── GENERATION ─────────────────────────────────────────

async function generateImage(viewType, masterImage) {
  const aspect_ratio = viewType === IMAGE_TYPES.CLOSEUP ? "1:1" : "2:3";

  const prompt = buildPrompt(viewType);

  const input = {
    prompt,
    negative_prompt: buildNegativePrompt(),
    aspect_ratio,
    output_format: "png",

    // 🔥 TRIPLE REFERENCE (CRITICAL FIX)
    input_images: [masterImage, masterImage, masterImage],
  };

  const output = await replicate.run(MODEL, { input });

  if (Array.isArray(output)) return output[0];
  return output;
}

// ─── MAIN ROUTE ─────────────────────────────────────────

export async function POST(req) {
  try {
    const { characterId, masterImage, userId } = await req.json();

    if (!characterId || !masterImage || !userId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const masterRef = normalizeReferenceImage(masterImage);

    if (!masterRef) {
      return Response.json({ error: "Invalid master image" }, { status: 400 });
    }

    const results = [];

    // 🔥 GENERATE ALL 5 VIEWS
    for (const view of CLEAN_VIEWS) {
      try {
        const imageUrl = await generateImage(view.key, masterRef);

        results.push({
          type: view.key,
          url: imageUrl,
          sort_order: SORT_ORDER[view.key],
          accepted: true,
        });

      } catch (err) {
        console.error("Generation failed:", view.key, err);

        results.push({
          type: view.key,
          url: null,
          accepted: false,
        });
      }
    }

    // ─── BUILD PACK ─────────────────────────

    const pack = {
      front: results.find(r => r.type === IMAGE_TYPES.FRONT)?.url || null,
      closeup: results.find(r => r.type === IMAGE_TYPES.CLOSEUP)?.url || null,
      left: results.find(r => r.type === IMAGE_TYPES.LEFT)?.url || null,
      right: results.find(r => r.type === IMAGE_TYPES.RIGHT)?.url || null,
      back: results.find(r => r.type === IMAGE_TYPES.BACK)?.url || null,
    };

    return Response.json({
      success: true,
      characterId,
      pack,
    });

  } catch (err) {
    console.error("PACK ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
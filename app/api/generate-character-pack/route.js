import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ LOCKED MODEL (DO NOT CHANGE)
const MODEL = "black-forest-labs/flux-1.1-pro-ultra";

// ✅ ONLY 5 VIEWS
const VIEWS = ["front", "closeup", "left", "right", "back"];

// ✅ SIMPLE PROMPTS (NO OVER-ENGINEERING)
function getPrompt(view) {
  const baseIdentity =
    "Same exact person. Preserve exact face, hairstyle, proportions, and identity.";

  switch (view) {
    case "front":
      return `${baseIdentity}
Front-facing full body.
Standing straight, neutral pose.
Full body visible head to toe.
Centered composition.`;

    case "closeup":
      return `${baseIdentity}
Tight upper body close-up.
Face centered and clearly visible.
Highly recognizable identity.
Natural realistic skin.`;

    case "left":
      return `${baseIdentity}
Strict LEFT side profile.
Facing LEFT only.
True 90-degree side view.
No front angle.
Full body visible.`;

    case "right":
      return `${baseIdentity}
Strict RIGHT side profile.
Facing RIGHT only.
True 90-degree side view.
No front angle.
Full body visible.`;

    case "back":
      return `${baseIdentity}
Full body BACK view.
Character facing completely away from camera.
Back of head visible.
NO face visible.
NO side angle.
NO reflection.
Camera directly behind subject.`;

    default:
      return baseIdentity;
  }
}

// ✅ CLEAN GENERATION FUNCTION
async function generateImage({ prompt, refs }) {
  const input = {
    prompt,
    aspect_ratio: "2:3",
    output_format: "png",
    input_images: refs,
  };

  const output = await replicate.run(MODEL, { input });

  // normalize output
  if (typeof output === "string") return output;

  if (Array.isArray(output)) {
    return output[0];
  }

  if (output?.url) {
    return typeof output.url === "function"
      ? await output.url()
      : output.url;
  }

  throw new Error("No valid image returned");
}

// ✅ SAVE IMAGE
async function saveImage({ url, userId, characterId, view }) {
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());

  const path = `${userId}/${characterId}/${view}-${Date.now()}.png`;

  const { error } = await supabase.storage
    .from("character-refs")
    .upload(path, buffer, { contentType: "image/png" });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage
    .from("character-refs")
    .getPublicUrl(path);

  return data.publicUrl;
}

// ✅ MAIN HANDLER
export async function POST(req) {
  try {
    const { masterImage, userId, characterId, uploadedImages = [] } =
      await req.json();

    if (!masterImage) {
      return new Response(
        JSON.stringify({ error: "Master image required" }),
        { status: 400 }
      );
    }

    // ✅ STRICT REFERENCES (NO GENERATED IMAGES)
    const refs = [masterImage, ...uploadedImages]
      .filter(Boolean)
      .slice(0, 3); // limit

    // ✅ PARALLEL GENERATION (IMPORTANT 🔥)
    const results = await Promise.all(
      VIEWS.map(async (view) => {
        const prompt = getPrompt(view);

        const tempUrl = await generateImage({
          prompt,
          refs,
        });

        const finalUrl = await saveImage({
          url: tempUrl,
          userId,
          characterId,
          view,
        });

        return {
          type: view,
          url: finalUrl,
        };
      })
    );

    // ✅ CLEAN RESPONSE (ONLY 5)
    const ordered = {
      front: results.find((r) => r.type === "front")?.url,
      closeup: results.find((r) => r.type === "closeup")?.url,
      left: results.find((r) => r.type === "left")?.url,
      right: results.find((r) => r.type === "right")?.url,
      back: results.find((r) => r.type === "back")?.url,
    };

    return new Response(JSON.stringify(ordered), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
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

function mapSizeToAspectRatio(size, ratio = "1:1") {
  if (ratio && ratio !== "Auto") return ratio;

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

    if (typeof first.url === "function") {
      return first.url();
    }

    if (typeof first.url === "string") {
      return first.url;
    }

    if (typeof first.toString === "function") {
      const s = first.toString();
      if (s && s !== "[object Object]") return s;
    }

    return null;
  }

  if (typeof output.url === "function") {
    return output.url();
  }

  if (typeof output.url === "string") {
    return output.url;
  }

  if (typeof output.toString === "function") {
    const s = output.toString();
    if (s && s !== "[object Object]") return s;
  }

  return null;
}

export async function POST(req) {
  try {
    const {
  prompt,
  scenePrompt = "",
  characterPrompt = "",
  style = null,
  styleLabel = "",
  stylePrompt = "",
  negativePrompt = "",
  useCharacter = false,
  size = "1024x1024",
  quality = "medium",
  n = 1,
  referenceImages = [],
  ratio = "1:1",
} = await req.json();

    if (!prompt || !prompt.trim()) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    const safeN = Math.min(Math.max(Number(n) || 1, 1), 4);

    const refs = Array.isArray(referenceImages)
      ? referenceImages.map(normalizeReferenceImage).filter(Boolean).slice(0, 5)
      : [];

    const hasRefs = refs.length > 0;
const cleanedScenePrompt = String(scenePrompt || "").trim();
const cleanedCharacterPrompt = String(characterPrompt || "").trim();
const cleanedStylePrompt = String(stylePrompt || "").trim();
const cleanedNegativePrompt = String(negativePrompt || "").trim();

const hasCharacterRefs = hasRefs;
const shouldUseCharacterPrompt = Boolean(useCharacter) && Boolean(cleanedCharacterPrompt);

const referenceInstruction = hasCharacterRefs
  ? [
      "Use the provided reference image(s) as the same exact person.",
      "Preserve identity, facial structure, skin tone, hairstyle, and recognizable features.",
      "Do not change the person into someone else.",
      "Change only pose, camera framing, outfit, environment, action, and scene as requested.",
      "Do not default to a close-up portrait unless explicitly requested.",
    ].join(" ")
  : "";

const fallbackQualityInstruction = [
  "High-quality image generation.",
  "Strong scene fidelity.",
  "Accurate composition.",
  "Natural detail.",
  "Do not ignore framing instructions.",
].join(" ");

const avoidInstruction = [
  cleanedNegativePrompt,
  cleanedScenePrompt.toLowerCase().includes("wide shot") ||
  cleanedScenePrompt.toLowerCase().includes("full body") ||
  cleanedScenePrompt.toLowerCase().includes("full-body") ||
  ratio === "16:9" ||
  ratio === "21:9"
    ? "Avoid close-up portrait, extreme facial crop, headshot, face-only framing."
    : "",
]
  .filter(Boolean)
  .join(" ");

const finalPrompt = [
  cleanedScenePrompt,

  "Full body visible from head to toe. Subject occupies around 35 to 45 percent of the frame. Face clearly visible and large enough to recognize identity. Environment must remain clearly visible.",

  "Camera distance medium-wide, not extreme long shot.",

  "Same exact person as reference. Face must remain identical even in wide shot. Do not change identity even if subject is small in frame.",

  "Subject must face camera or 3/4 angle. Face clearly visible even in wide shot. Do not turn back to camera.",

  prompt?.trim() || "",
  hasCharacterRefs ? `Reference lock: ${referenceInstruction}` : null,

  !hasCharacterRefs && shouldUseCharacterPrompt
    ? `Character guidance: ${cleanedCharacterPrompt}`
    : null,

  cleanedStylePrompt ? `Style guidance: ${cleanedStylePrompt}` : null,

  fallbackQualityInstruction,

  avoidInstruction ? `Avoid: ${avoidInstruction}` : null,
]
  .filter(Boolean)
  .join("\n\n");
    

    const aspect_ratio = mapSizeToAspectRatio(size, ratio);
    const useConsistencyModel =
  Boolean(useCharacter) || refs.length > 0;

const model = useConsistencyModel
  ? "black-forest-labs/flux-1.1-pro-ultra"
  : "black-forest-labs/flux-1.1-pro";

    const requests = Array.from({ length: safeN }, async () => {
  let input;

if (useConsistencyModel) {
  input = {
    prompt: finalPrompt,
    aspect_ratio,
    output_format: "png",
  };
} else {
    input = {
      prompt: finalPrompt,
      aspect_ratio,
      output_format: "png",
      prompt_upsampling: false,
    };
  }

  const output = await replicate.run(model, {
    input,
  });

  return await fileOutputToUrl(output);
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
  model,
  mode: useConsistencyModel ? "consistency" : "standard",
  quality,
  style,
  styleLabel,
  referenceCount: refs.length,
  usedReferences: useConsistencyModel,
  usedNegativePrompt: Boolean(cleanedNegativePrompt),
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
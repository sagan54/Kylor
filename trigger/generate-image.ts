import { task } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";
import { fal } from "@fal-ai/client";

type GenerateImagePayload = {
  generationId: string;
  userId?: string | null;
  characterId?: string | null;
  characterName?: string | null;
  prompt?: string | null;
  finalPrompt?: string | null;
  scenePrompt?: string | null;
  negativePrompt?: string | null;
  size?: string | null;
  ratio?: string | null;
  mode?: string | null;
  style?: string | null;
  seed?: number | null;
  referenceUrls?: string[];
  usingCharacterMode?: boolean;
};

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

fal.config({
  credentials: process.env.FAL_KEY!,
});

const GENERATED_BUCKET = "generated-images";
const SEEDREAM_MODEL = "fal-ai/bytedance/seedream/v4.5/edit";

function normalizeImageUrl(value: unknown) {
  const url = String(value || "").trim();
  if (!url) return null;

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:image/")
  ) {
    return url;
  }

  return null;
}

function mapSizeToSeedreamImageSize(size?: string | null) {
  switch (String(size || "").toLowerCase()) {
    case "square":
    case "1:1":
      return "square_hd";

    case "portrait":
    case "4:5":
    case "3:4":
      return "portrait_4_3";

    case "9:16":
      return "portrait_16_9";

    case "16:9":
      return "landscape_16_9";

    case "4:3":
      return "landscape_4_3";

    default:
      return "landscape_16_9";
  }
}

function getFileExtFromContentType(contentType?: string | null) {
  const value = String(contentType || "").toLowerCase();

  if (value.includes("jpeg") || value.includes("jpg")) return "jpg";
  if (value.includes("webp")) return "webp";
  return "png";
}

async function updateGenerationRow(
  generationId: string,
  patch: Record<string, any>
) {
  const { error } = await supabaseAdmin
    .from("image_generations")
    .update(patch)
    .eq("id", generationId);

  if (error) {
    throw new Error(`Failed to update generation row: ${error.message}`);
  }
}

function buildSeedreamPrompt({
  finalPrompt,
  scenePrompt,
  characterName,
  style,
  ratio,
  referenceUrls = [],
}: {
  finalPrompt?: string | null;
  scenePrompt?: string | null;
  characterName?: string | null;
  style?: string | null;
  ratio?: string | null;
  referenceUrls?: string[];
}) {
  const charName = characterName || "the same character";

  const figureGuide =
    referenceUrls.length > 0
      ? referenceUrls.map((_, idx) => `Figure ${idx + 1}`).join(", ")
      : "the provided reference images";

  return `
Use ${figureGuide} as reference images of the SAME real person.

Highest priority:
Keep the exact same facial identity of ${charName}.
Do not create a different person.
Do not beautify or alter facial structure.
Keep the same face shape, eyes, nose, lips, hairstyle, hairline, skin tone, and age impression.

Reference rules:
- Figure 1 is the primary identity anchor.
- All other figures are supporting views of the same person.
- Keep identity locked even if angle, lighting, camera distance, pose, wardrobe, or environment changes.

Scene:
${scenePrompt || finalPrompt || "Create a cinematic photorealistic scene."}

Style:
${style || "cinematic photorealistic still frame"}

Aspect ratio:
${ratio || "16:9"}

Quality:
photorealistic, natural skin texture, realistic lighting, realistic eyes, realistic hands, cinematic composition, no plastic skin, no beauty filter, one main subject unless explicitly requested otherwise.
`.trim();
}

async function runSeedreamCharacterGeneration({
  prompt,
  imageSize,
  referenceUrls,
  seed,
}: {
  prompt: string;
  imageSize: string;
  referenceUrls: string[];
  seed?: number | null;
}) {
  const cleanedRefs = (referenceUrls || [])
    .map((url) => normalizeImageUrl(url))
    .filter(Boolean) as string[];

  if (!cleanedRefs.length) {
    throw new Error("No valid reference URLs were provided to Seedream.");
  }

  const result = (await fal.subscribe(SEEDREAM_MODEL, {
    input: {
      prompt,
      image_size: imageSize,
      num_images: 1,
      seed: typeof seed === "number" ? seed : undefined,
      image_urls: cleanedRefs,
    },
    logs: true,
  })) as any;

  const image =
    result?.data?.images?.[0] ||
    result?.data?.image ||
    result?.images?.[0] ||
    result?.image ||
    null;

  const imageUrl = image?.url || null;

  if (!imageUrl) {
    throw new Error("Seedream returned no image URL.");
  }

  return {
    url: imageUrl,
    width: image?.width || null,
    height: image?.height || null,
    content_type: image?.content_type || "image/png",
  };
}

async function downloadImageAsBuffer(imageUrl: string) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to download generated image: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadGeneratedImage({
  userId,
  buffer,
  contentType,
  fileExt,
  generationId,
}: {
  userId?: string | null;
  buffer: Buffer;
  contentType: string;
  fileExt: string;
  generationId: string;
}) {
  const safeUserId = userId || "anonymous";
  const filePath = `${safeUserId}/${generationId}.${fileExt}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(GENERATED_BUCKET)
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Supabase upload failed: ${uploadError.message}`);
  }

  const { data } = supabaseAdmin.storage
    .from(GENERATED_BUCKET)
    .getPublicUrl(filePath);

  return {
    publicUrl: data.publicUrl,
    storagePath: filePath,
  };
}

export const generateImageTask = task({
  id: "generate-image",
  run: async (payload: GenerateImagePayload) => {
    const {
      generationId,
      userId,
      characterId,
      characterName,
      prompt,
      finalPrompt,
      scenePrompt,
      negativePrompt,
      style,
      ratio,
      size,
      seed,
      referenceUrls = [],
      usingCharacterMode,
    } = payload;

    try {
      await updateGenerationRow(generationId, {
        metadata: {
          state: "processing",
          startedAt: new Date().toISOString(),
          characterId: characterId || null,
          characterName: characterName || null,
          referenceCount: referenceUrls.length,
          referenceUrls,
          provider: "fal",
          model: SEEDREAM_MODEL,
        },
      });

      if (!usingCharacterMode) {
        throw new Error(
          "No character selected. Reconnect your old FLUX/no-character generation path here before shipping."
        );
      }

      if (!referenceUrls.length) {
        throw new Error("No reference images available for this character.");
      }

      const seedreamPrompt = buildSeedreamPrompt({
        finalPrompt: finalPrompt || prompt || "",
        scenePrompt: scenePrompt || finalPrompt || prompt || "",
        characterName,
        style,
        ratio,
        referenceUrls,
      });

      console.log("Seedream request", {
        model: SEEDREAM_MODEL,
        generationId,
        characterId,
        characterName,
        referenceCount: referenceUrls.length,
        referenceUrls,
        size: size || ratio,
        seed,
      });

      const generatedRemote = await runSeedreamCharacterGeneration({
        prompt: seedreamPrompt,
        imageSize: mapSizeToSeedreamImageSize(size || ratio),
        referenceUrls,
        seed,
      });

      const outputContentType = generatedRemote?.content_type || "image/png";
      const buffer = await downloadImageAsBuffer(generatedRemote.url);

      const uploaded = await uploadGeneratedImage({
        userId,
        buffer,
        contentType: outputContentType,
        fileExt: getFileExtFromContentType(outputContentType),
        generationId,
      });

      await updateGenerationRow(generationId, {
        images: [uploaded.publicUrl].filter(Boolean),
        style: style || "cinematic",
        mode: "image",
        metadata: {
          state: "succeeded",
          completedAt: new Date().toISOString(),
          provider: "fal",
          model: SEEDREAM_MODEL,
          referenceUrls,
          referenceCount: referenceUrls.length,
          generatedRemote,
          storagePath: uploaded.storagePath,
          identityMode: "multi_reference_seedream",
          negativePrompt: negativePrompt || "",
        },
      });

      return {
        success: true,
        generationId,
        imageUrl: uploaded.publicUrl,
      };
    } catch (error: any) {
      await updateGenerationRow(generationId, {
        metadata: {
          state: "failed",
          failedAt: new Date().toISOString(),
          error: error?.message || "Unknown generation error",
          provider: "fal",
          model: SEEDREAM_MODEL,
        },
      });

      throw error;
    }
  },
});
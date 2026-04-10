import { task } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";
import Replicate from "replicate";
import sharp from "sharp";
import { IMAGE_ORDER, IMAGE_TYPES, PACK_VIEWS } from "../lib/character-constants";
import { FLUX_MODEL } from "../lib/image-generation-rules.js";

type GenerateCharacterPackPayload = {
  generationId: string;
  characterId: string;
  masterImage: string;
  userId: string;
  negativePrompt?: string | null;
};

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const MODEL = "fal-ai/flux-pro/v1.1-ultra";
const STORAGE_BUCKET = "character-refs";

const CORE_VIEWS = [
  {
    key: IMAGE_TYPES.FRONT,
    label: "Front Full-Body",
    size: "1024x1536",
    prompt:
      "front-facing full body of the same exact person, standing straight, neutral pose, relaxed arms, centered composition, plain studio-like framing",
  },
  {
    key: IMAGE_TYPES.LEFT,
    label: "Left Profile Full-Body",
    size: "1024x1536",
    prompt:
      "strict left side profile of the same exact person, full body, facing left, standing straight, neutral pose, relaxed arms, centered composition",
  },
  {
    key: IMAGE_TYPES.RIGHT,
    label: "Right Profile Full-Body",
    size: "1024x1536",
    prompt:
      "strict right side profile of the same exact person, full body, facing right, standing straight, neutral pose, relaxed arms, centered composition",
  },
  {
    key: IMAGE_TYPES.BACK,
    label: "Back Full-Body",
    size: "1024x1536",
    prompt:
      "back view of the same exact person, full body, facing away from camera, standing straight, neutral pose, relaxed arms, centered composition",
  },
];

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

function dedupeUrls(urls: unknown[] = []) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const raw of urls) {
    const url = normalizeImageUrl(raw);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    output.push(url);
  }

  return output;
}

function getExtensionFromContentType(contentType = "") {
  const type = String(contentType).toLowerCase();
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  if (type.includes("webp")) return "webp";
  return "png";
}

function mapSizeToSeedreamImageSize(size?: string | null) {
  switch (String(size || "").toLowerCase()) {
    case "1536x1024":
    case "16:9":
      return "landscape_16_9";
    case "1024x1536":
    default:
      return "portrait_4_3";
  }
}

function mapSizeToAspectRatio(size?: string | null) {
  switch (String(size || "").toLowerCase()) {
    case "1536x1024":
    case "16:9":
      return "16:9";
    case "1024x1536":
    default:
      return "2:3";
  }
}

async function fileOutputToUrl(output: any): Promise<string | null> {
  if (!output) return null;

  if (typeof output === "string") return output;

  if (Array.isArray(output)) {
    for (const item of output) {
      const url = await fileOutputToUrl(item);
      if (url) return url;
    }
    return null;
  }

  if (typeof output?.url === "function") {
    const url = await output.url();
    return typeof url === "string" ? url : String(url || "");
  }

  if (typeof output?.url === "string") return output.url;
  if (typeof output?.href === "string") return output.href;

  if (output?.output) {
    return await fileOutputToUrl(output.output);
  }

  const asString = String(output || "").trim();
  if (asString.startsWith("http://") || asString.startsWith("https://")) {
    return asString;
  }

  return null;
}

async function updateGenerationRow(
  generationId: string,
  patch: Record<string, any>,
  cachedMetadata?: Record<string, any> | null
) {
  const needsMetadataMerge =
    patch?.metadata && typeof patch.metadata === "object";

  let baseMetadata = cachedMetadata || null;

  if (needsMetadataMerge && !baseMetadata) {
    const { data: existing, error } = await supabaseAdmin
      .from("image_generations")
      .select("metadata")
      .eq("id", generationId)
      .single();

    if (error) {
      throw new Error(error.message || "Failed to load generation metadata");
    }

    baseMetadata = existing?.metadata || {};
  }

  const nextPatch = needsMetadataMerge
    ? {
        ...patch,
        metadata: {
          ...(baseMetadata || {}),
          ...patch.metadata,
        },
      }
    : patch;

  const { error } = await supabaseAdmin
    .from("image_generations")
    .update(nextPatch)
    .eq("id", generationId);

  if (error) {
    throw new Error(error.message || "Failed to update generation row");
  }

  return nextPatch?.metadata || baseMetadata || null;
}

async function loadReferenceUrls(characterId: string, masterImage: string) {
  const { data, error } = await supabaseAdmin
    .from("character_images")
    .select("image_url, source_type, is_canon, is_cover, sort_order, created_at")
    .eq("character_id", characterId)
    .in("source_type", ["upload", "master_identity"])
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to load character references");
  }

  return dedupeUrls([
    masterImage,
    ...(data || []).map((row) => row.image_url),
  ]).slice(0, 8);
}

async function fetchImageBuffer(imageUrl: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const arrayBuffer = await response.arrayBuffer();

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
  };
}

async function savePermanentBuffer({
  buffer,
  contentType = "image/jpeg",
  userId,
  characterId,
  viewType,
  generationId,
}: {
  buffer: Buffer;
  contentType?: string;
  userId: string;
  characterId: string;
  viewType: string;
  generationId: string;
}) {
  const ext = getExtensionFromContentType(contentType);
  const filePath = `${userId}/${characterId}/pack/${viewType}-${generationId}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload pack image");
  }

  const { data } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return data?.publicUrl || null;
}

function buildViewPrompt(viewPrompt: string, negativePrompt = "") {
  return [
    "Generate the SAME EXACT person from the reference image(s).",
    "Photorealistic studio consistency pack.",
    "Preserve exact face shape, hairline, hairstyle, skin tone, facial hair, body proportions, and identity.",
    "Plain white t-shirt and plain black pants only.",
    "Clean neutral light gray studio background.",
    "Single person only.",
    viewPrompt,
    negativePrompt ? `Avoid: ${negativePrompt}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function generateReplicateImage({
  prompt,
  refs,
  size,
}: {
  prompt: string;
  refs: string[];
  size: string;
}) {
  void refs;

  const output = await replicate.run(MODEL, {
    input: {
      prompt,
      aspect_ratio: mapSizeToAspectRatio(size),
      output_format: "png",
    },
  });

  const url = await fileOutputToUrl(output);
  if (!url) {
    throw new Error("No image URL returned from Replicate");
  }

  return url;
}

async function buildPortraitFromFullBody(imageUrl: string) {
  const { buffer } = await fetchImageBuffer(imageUrl);
  const source = sharp(buffer);
  const metadata = await source.metadata();
  const width = metadata.width || 1024;
  const height = metadata.height || 1536;
  const scale = Math.max(1600 / width, 2400 / height);
  const scaledWidth = Math.max(1600, Math.round(width * scale));
  const scaledHeight = Math.max(2400, Math.round(height * scale));

  return await source
    .resize(scaledWidth, scaledHeight, { fit: "cover" })
    .extract({
      left: Math.max(0, Math.round((scaledWidth - 1024) / 2)),
      top: Math.max(0, Math.round(scaledHeight * 0.06)),
      width: 1024,
      height: 1536,
    })
    .jpeg({ quality: 90 })
    .toBuffer();
}

async function fitForSheet(imageUrl: string, width: number, height: number) {
  const { buffer } = await fetchImageBuffer(imageUrl);
  return await sharp(buffer)
    .resize(width, height, {
      fit: "contain",
      background: { r: 247, g: 247, b: 247, alpha: 1 },
    })
    .png()
    .toBuffer();
}

async function fitBufferForSheet(buffer: Buffer, width: number, height: number) {
  return await sharp(buffer)
    .resize(width, height, {
      fit: "contain",
      background: { r: 247, g: 247, b: 247, alpha: 1 },
    })
    .png()
    .toBuffer();
}

async function buildProfileSheet({
  frontUrl,
  leftUrl,
  rightUrl,
  backUrl,
  frontPortraitBuffer,
  leftPortraitBuffer,
  rightPortraitBuffer,
}: {
  frontUrl: string;
  leftUrl: string;
  rightUrl: string;
  backUrl: string;
  frontPortraitBuffer: Buffer;
  leftPortraitBuffer: Buffer;
  rightPortraitBuffer: Buffer;
}) {
  const topY = 48;
  const bottomY = 622;
  const topW = 300;
  const topH = 500;
  const bottomW = 320;
  const bottomH = 320;
  const topXs = [24, 408, 792, 1176];
  const bottomXs = [128, 608, 1088];

  const [front, left, right, back, frontPortrait, leftPortrait, rightPortrait] =
    await Promise.all([
      fitForSheet(frontUrl, topW, topH),
      fitForSheet(leftUrl, topW, topH),
      fitForSheet(rightUrl, topW, topH),
      fitForSheet(backUrl, topW, topH),
      fitBufferForSheet(frontPortraitBuffer, bottomW, bottomH),
      fitBufferForSheet(leftPortraitBuffer, bottomW, bottomH),
      fitBufferForSheet(rightPortraitBuffer, bottomW, bottomH),
    ]);

  return await sharp({
    create: {
      width: 1536,
      height: 1024,
      channels: 3,
      background: { r: 247, g: 247, b: 247 },
    },
  })
    .composite([
      { input: front, left: topXs[0], top: topY },
      { input: left, left: topXs[1], top: topY },
      { input: right, left: topXs[2], top: topY },
      { input: back, left: topXs[3], top: topY },
      { input: leftPortrait, left: bottomXs[0], top: bottomY },
      { input: frontPortrait, left: bottomXs[1], top: bottomY },
      { input: rightPortrait, left: bottomXs[2], top: bottomY },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();
}

function buildPackResults(items: Array<{ type: string; url: string; label: string }>) {
  return items.map((item) => ({
    type: item.type,
    label: item.label,
    url: item.url,
    sort_order: IMAGE_ORDER[item.type as keyof typeof IMAGE_ORDER] ?? 0,
    accepted: true,
    finalScore: 8,
    scoreReason: "trigger_completed",
    failureType: "none",
  }));
}

export const generateCharacterPack = task({
  id: "generate-character-pack",
  run: async (payload: GenerateCharacterPackPayload) => {
    const { generationId, characterId, masterImage, userId, negativePrompt = "" } = payload;

    let metadataCache: Record<string, any> | null = null;
    const refs = await loadReferenceUrls(characterId, masterImage);

    metadataCache = await updateGenerationRow(
      generationId,
      {
        metadata: {
          state: "processing",
          progressStage: "generating_front",
          startedAt: new Date().toISOString(),
          referenceCount: refs.length,
          route: "trigger.generate-character-pack",
        },
      },
      metadataCache
    );

    try {
      const frontTempUrl = await generateReplicateImage({
        prompt: buildViewPrompt(CORE_VIEWS[0].prompt, negativePrompt ?? undefined),
        refs,
        size: CORE_VIEWS[0].size,
      });

      const frontSaved = await savePermanentBuffer({
        ...(await fetchImageBuffer(frontTempUrl)),
        userId,
        characterId,
        viewType: IMAGE_TYPES.FRONT,
        generationId,
      });

      metadataCache = await updateGenerationRow(
        generationId,
        {
          metadata: {
            state: "processing",
            progressStage: "generating_remaining_views",
            frontImageUrl: frontSaved,
          },
        },
        metadataCache
      );

      const remainingRefs = dedupeUrls([...refs, frontSaved]);
      const remainingViews = CORE_VIEWS.slice(1);

      const remainingResults = await Promise.all(
        remainingViews.map(async (view) => {
          const tempUrl = await generateReplicateImage({
            prompt: buildViewPrompt(view.prompt, negativePrompt ?? undefined),
            refs: remainingRefs,
            size: view.size,
          });

          const savedUrl = await savePermanentBuffer({
            ...(await fetchImageBuffer(tempUrl)),
            userId,
            characterId,
            viewType: view.key,
            generationId,
          });

          return {
            type: view.key,
            label: view.label,
            url: savedUrl!,
          };
        })
      );

      metadataCache = await updateGenerationRow(
        generationId,
        {
          metadata: {
            state: "processing",
            progressStage: "building_derived_assets",
          },
        },
        metadataCache
      );

      const leftUrl = remainingResults.find((item) => item.type === IMAGE_TYPES.LEFT)?.url;
      const rightUrl = remainingResults.find((item) => item.type === IMAGE_TYPES.RIGHT)?.url;
      const backUrl = remainingResults.find((item) => item.type === IMAGE_TYPES.BACK)?.url;

      if (!frontSaved || !leftUrl || !rightUrl || !backUrl) {
        throw new Error("Missing one or more required core pack views");
      }

      const [frontPortraitBuffer, leftPortraitBuffer, rightPortraitBuffer] = await Promise.all([
        buildPortraitFromFullBody(frontSaved),
        buildPortraitFromFullBody(leftUrl),
        buildPortraitFromFullBody(rightUrl),
      ]);

      const sheetBuffer = await buildProfileSheet({
        frontUrl: frontSaved,
        leftUrl,
        rightUrl,
        backUrl,
        frontPortraitBuffer,
        leftPortraitBuffer,
        rightPortraitBuffer,
      });

      const [frontPortraitUrl, leftPortraitUrl, rightPortraitUrl, sheetUrl] = await Promise.all([
        savePermanentBuffer({
          buffer: frontPortraitBuffer,
          contentType: "image/jpeg",
          userId,
          characterId,
          viewType: IMAGE_TYPES.CLOSEUP,
          generationId,
        }),
        savePermanentBuffer({
          buffer: leftPortraitBuffer,
          contentType: "image/jpeg",
          userId,
          characterId,
          viewType: IMAGE_TYPES.CLOSEUP_LEFT,
          generationId,
        }),
        savePermanentBuffer({
          buffer: rightPortraitBuffer,
          contentType: "image/jpeg",
          userId,
          characterId,
          viewType: IMAGE_TYPES.CLOSEUP_RIGHT,
          generationId,
        }),
        savePermanentBuffer({
          buffer: sheetBuffer,
          contentType: "image/jpeg",
          userId,
          characterId,
          viewType: IMAGE_TYPES.SHEET,
          generationId,
        }),
      ]);

      const finalItems = [
        {
          type: IMAGE_TYPES.SHEET,
          label: PACK_VIEWS.find((view) => view.key === IMAGE_TYPES.SHEET)?.label || "All Profiles Sheet",
          url: sheetUrl!,
        },
        {
          type: IMAGE_TYPES.FRONT,
          label: "Front Full-Body",
          url: frontSaved,
        },
        ...remainingResults,
        {
          type: IMAGE_TYPES.CLOSEUP_LEFT,
          label: PACK_VIEWS.find((view) => view.key === IMAGE_TYPES.CLOSEUP_LEFT)?.label || "Left Profile Portrait",
          url: leftPortraitUrl!,
        },
        {
          type: IMAGE_TYPES.CLOSEUP,
          label: PACK_VIEWS.find((view) => view.key === IMAGE_TYPES.CLOSEUP)?.label || "Front Portrait",
          url: frontPortraitUrl!,
        },
        {
          type: IMAGE_TYPES.CLOSEUP_RIGHT,
          label: PACK_VIEWS.find((view) => view.key === IMAGE_TYPES.CLOSEUP_RIGHT)?.label || "Right Profile Portrait",
          url: rightPortraitUrl!,
        },
      ];

      const pack = buildPackResults(finalItems);

      await supabaseAdmin
        .from("character_images")
        .delete()
        .eq("character_id", characterId)
        .eq("user_id", userId)
        .eq("image_type", "pack");

      const insertRows = finalItems.map((item) => ({
        character_id: characterId,
        user_id: userId,
        image_type: "pack",
        image_url: item.url,
        pack_view: item.type,
        source_type: "generated",
        is_canon: item.type === IMAGE_TYPES.FRONT || item.type === IMAGE_TYPES.CLOSEUP,
        is_cover: item.type === IMAGE_TYPES.FRONT,
        sort_order: IMAGE_ORDER[item.type as keyof typeof IMAGE_ORDER] ?? 0,
        metadata: {
          finalScore: 8,
          generatedBy: "trigger",
        },
      }));

      const { error: insertError } = await supabaseAdmin
        .from("character_images")
        .insert(insertRows);

      if (insertError) {
        throw new Error(insertError.message || "Failed to save pack images");
      }

      await supabaseAdmin
        .from("characters")
        .update({
          generated_images: finalItems.map((item) => item.url),
          cover_image: frontSaved,
          processing_error: null,
        })
        .eq("id", characterId)
        .eq("user_id", userId);

      await updateGenerationRow(
        generationId,
        {
          images: finalItems.map((item) => item.url),
          metadata: {
            state: "completed",
            progressStage: "completed",
            completedAt: new Date().toISOString(),
            pack,
            acceptedCount: finalItems.length,
            error: null,
          },
        },
        metadataCache
      );

      return {
        generationId,
        acceptedCount: finalItems.length,
      };
    } catch (error: any) {
      await updateGenerationRow(
        generationId,
        {
          metadata: {
            state: "failed",
            progressStage: "failed",
            failedAt: new Date().toISOString(),
            error: error?.message || "Failed to generate character pack",
          },
        },
        metadataCache
      );

      throw error;
    }
  },
});

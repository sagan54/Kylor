import { tasks } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SEEDREAM_MODEL = "fal-ai/bytedance/seedream/v4.5/edit";
const MAX_REFERENCE_IMAGES = 5;

function normalizeImageUrl(value) {
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

function dedupeUrls(urls = []) {
  const seen = new Set();
  const output = [];

  for (const raw of urls) {
    const url = normalizeImageUrl(raw);
    if (!url) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    output.push(url);
  }

  return output;
}

function safeJsonParse(value, fallback = null) {
  try {
    if (typeof value === "string") return JSON.parse(value);
    if (value && typeof value === "object") return value;
    return fallback;
  } catch {
    return fallback;
  }
}

async function loadCharacterData(characterId) {
  if (!characterId) return null;

  const { data, error } = await supabaseAdmin
    .from("characters")
    .select("*")
    .eq("id", characterId)
    .single();

  if (error || !data) return null;
  return data;
}

async function loadCharacterImages(characterId) {
  if (!characterId) return [];

  const { data, error } = await supabaseAdmin
    .from("character_images")
    .select("*")
    .eq("character_id", characterId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data;
}

function scoreReferenceRow(row) {
  let score = 0;

  if (row?.is_canon) score += 100;
  if (row?.is_cover) score += 80;

  switch (row?.source_type) {
    case "master_identity":
      score += 120;
      break;
    case "upload":
      score += 90;
      break;
    case "generated":
      score += 40;
      break;
    default:
      break;
  }

  switch (row?.pack_view) {
    case "closeup":
      score += 80;
      break;
    case "front":
      score += 70;
      break;
    case "left":
    case "right":
      score += 55;
      break;
    case "master":
      score += 100;
      break;
    case "back":
      score += 10;
      break;
    default:
      break;
  }

  return score;
}

function pickBestIdentityReferences(character, rows) {
  const candidateUrls = [];

  const sortedRows = [...(rows || [])]
    .filter((row) => normalizeImageUrl(row?.image_url || row?.storage_path))
    .sort((a, b) => scoreReferenceRow(b) - scoreReferenceRow(a));

  for (const row of sortedRows) {
    candidateUrls.push(row.image_url || row.storage_path);
  }

  candidateUrls.push(
    character?.master_image,
    character?.reference_image,
    character?.cover_image
  );

  const generatedImages = safeJsonParse(character?.generated_images, []);
  if (Array.isArray(generatedImages)) {
    for (const item of generatedImages) {
      if (typeof item === "string") candidateUrls.push(item);
      else if (item?.url) candidateUrls.push(item.url);
      else if (item?.image_url) candidateUrls.push(item.image_url);
    }
  }

  const deduped = dedupeUrls(candidateUrls);
  const filtered = deduped.filter((url) => {
    const row = (rows || []).find(
      (r) => (r.image_url || r.storage_path) === url
    );
    if (!row) return true;
    return row.pack_view !== "back";
  });

  return (filtered.length ? filtered : deduped).slice(0, MAX_REFERENCE_IMAGES);
}

async function createPendingGeneration({
  userId,
  prompt,
  negativePrompt = "",
  ratio = "16:9",
  style = "cinematic",
  characterId = null,
  metadata = {},
}) {
  const payload = {
    user_id: userId || null,
    prompt,
    negative_prompt: negativePrompt,
    images: [],
    mode: "image",
    ratio,
    style,
    character_id: characterId,
    metadata: {
      state: "processing",
      ...metadata,
    },
  };

  const { data, error } = await supabaseAdmin
    .from("image_generations")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create pending generation");
  }

  return data;
}

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      prompt,
      scenePrompt,
      negativePrompt = "",
      style = "cinematic",
      ratio = "16:9",
      size = "16:9",
      userId,
      characterId,
      seed,
    } = body || {};

    const finalPrompt = String(prompt || scenePrompt || "").trim();

    if (!finalPrompt) {
      return Response.json(
        { success: false, error: "Prompt is required." },
        { status: 400 }
      );
    }

    let character = null;
    let characterRows = [];
    let referenceUrls = [];

    if (characterId) {
      character = await loadCharacterData(characterId);

      if (!character) {
        return Response.json(
          { success: false, error: "Selected character not found." },
          { status: 404 }
        );
      }

      characterRows = await loadCharacterImages(characterId);
      referenceUrls = pickBestIdentityReferences(character, characterRows);

      if (!referenceUrls.length) {
        return Response.json(
          {
            success: false,
            error:
              "This character has no valid reference images. Generate or upload character references first.",
          },
          { status: 400 }
        );
      }
    }

    const usingCharacterMode = Boolean(characterId && referenceUrls.length > 0);

    const pendingRow = await createPendingGeneration({
      userId,
      prompt: finalPrompt,
      negativePrompt: negativePrompt || "",
      ratio,
      style,
      characterId: characterId || null,
      metadata: {
        characterId: characterId || null,
        characterName: character?.name || null,
        usedCharacter: usingCharacterMode,
        referenceCount: referenceUrls.length,
        referenceUrls,
        identityMode: usingCharacterMode ? "multi_reference_seedream" : null,
      },
    });

    await tasks.trigger("generate-image", {
      generationId: pendingRow.id,
      userId,
      characterId,
      characterName: character?.name || null,
      finalPrompt,
      scenePrompt: scenePrompt || finalPrompt,
      negativePrompt: negativePrompt || "",
      style,
      ratio,
      size,
      seed,
      referenceUrls,
      usingCharacterMode,
    });

    return Response.json({
      success: true,
      status: "processing",
      predictionId: pendingRow.id,
      generation: {
        id: pendingRow.id,
        prompt: pendingRow.prompt,
        negative_prompt: pendingRow.negative_prompt,
        ratio: pendingRow.ratio,
        mode: pendingRow.mode,
        style: pendingRow.style,
        created_at: pendingRow.created_at,
        images: [],
        metadata: {
          ...(pendingRow.metadata || {}),
          state: "processing",
        },
      },
      meta: {
        characterId: characterId || null,
        characterName: character?.name || null,
        usedCharacter: usingCharacterMode,
        scenePrompt: scenePrompt || prompt || "",
        finalPrompt,
        provider: "fal",
        model: SEEDREAM_MODEL,
        referenceCount: referenceUrls.length,
        referenceUrls,
        identityMode: usingCharacterMode ? "multi_reference_seedream" : null,
      },
    });
  } catch (error) {
    console.error("generate-image route failed:", error);

    return Response.json(
      {
        success: false,
        error: error?.message || "Image generation failed.",
      },
      { status: 500 }
    );
  }
}
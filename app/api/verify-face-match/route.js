import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FACE_MATCH_MODEL =
  process.env.FACE_MATCH_MODEL || "apna-mart/face-match";

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

async function loadCharacterAnchorImages(characterId) {
  if (!characterId) return [];

  const { data, error } = await supabaseAdmin
    .from("character_images")
    .select(
      "id, image_url, source_type, pack_view, is_canon, is_cover, sort_order, created_at"
    )
    .eq("character_id", characterId)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error || !Array.isArray(data)) {
    console.error("loadCharacterAnchorImages failed:", error);
    return [];
  }

  return data;
}

function scoreAnchor(row) {
  let score = 0;

  if (row?.source_type === "master_identity") score += 100;
  if (row?.source_type === "upload") score += 45;
  if (row?.source_type === "generated") score += 10;
  if (row?.is_canon) score += 40;
  if (row?.is_cover) score += 15;

  if (row?.pack_view === "closeup") score += 80;
  if (row?.pack_view === "front") score += 70;
  if (row?.pack_view === "left") score += 30;
  if (row?.pack_view === "right") score += 30;
  if (row?.pack_view === "back") score += 5;

  return score;
}

function pickBestReferenceImage(character, anchorRows = []) {
  const candidates = [];

  const push = (url, score, source) => {
    const normalized = normalizeImageUrl(url);
    if (!normalized) return;
    candidates.push({ url: normalized, score, source });
  };

  push(character?.master_image, 1000, "character.master_image");
  push(character?.reference_image, 900, "character.reference_image");
  push(character?.cover_image, 700, "character.cover_image");

  for (const row of anchorRows) {
    push(row?.image_url, scoreAnchor(row), `character_images:${row?.id || "row"}`);
  }

  candidates.sort((a, b) => b.score - a.score);

  return candidates[0] || null;
}

function extractSimilarityScore(output) {
  if (typeof output === "number") return output;

  if (typeof output === "string") {
    const n = Number(output);
    return Number.isFinite(n) ? n : null;
  }

  if (Array.isArray(output)) {
    for (const item of output) {
      const value = extractSimilarityScore(item);
      if (Number.isFinite(value)) return value;
    }
    return null;
  }

  if (output && typeof output === "object") {
    const possibleKeys = [
      "similarity",
      "score",
      "match_score",
      "confidence",
      "distance_score",
      "face_similarity",
    ];

    for (const key of possibleKeys) {
      const value = Number(output[key]);
      if (Number.isFinite(value)) return value;
    }

    for (const value of Object.values(output)) {
      const nested = extractSimilarityScore(value);
      if (Number.isFinite(nested)) return nested;
    }
  }

  return null;
}

function normalizeSimilarity(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return null;

  // If model returns 0..100, convert to 0..1
  if (n > 1 && n <= 100) {
    return Math.max(0, Math.min(1, n / 100));
  }

  // Already 0..1
  if (n >= 0 && n <= 1) {
    return n;
  }

  return null;
}

export async function POST(req) {
  try {
    const {
      characterId = null,
      referenceImage = null,
      candidateImage,
      threshold = null,
      saveToGenerationJobId = null,
    } = await req.json();

    const candidateUrl = normalizeImageUrl(candidateImage);
    if (!candidateUrl) {
      return Response.json(
        { error: "candidateImage is required" },
        { status: 400 }
      );
    }

    let resolvedReference = normalizeImageUrl(referenceImage);
    let resolvedCharacter = null;
    let bestRefMeta = null;

    if (!resolvedReference && characterId) {
      resolvedCharacter = await loadCharacterData(characterId);
      const anchorRows = await loadCharacterAnchorImages(characterId);
      bestRefMeta = pickBestReferenceImage(resolvedCharacter, anchorRows);
      resolvedReference = bestRefMeta?.url || null;
    }

    if (!resolvedReference) {
      return Response.json(
        {
          error:
            "No valid reference image found. Pass referenceImage or a characterId with master/reference images.",
        },
        { status: 400 }
      );
    }

    const comparisonThreshold =
      threshold ??
      Number(resolvedCharacter?.identity_threshold ?? 0.82);

    const prediction = await replicate.models.predictions.create(
      FACE_MATCH_MODEL,
      {
        input: {
          image1: resolvedReference,
          image2: candidateUrl,
        },
      }
    );

    const rawOutput = prediction?.output;
    const extracted = extractSimilarityScore(rawOutput);
    const similarity = normalizeSimilarity(extracted);

    if (!Number.isFinite(similarity)) {
      return Response.json(
        {
          error: "Could not parse similarity score from face match model output.",
          rawOutput,
          predictionId: prediction?.id || null,
        },
        { status: 500 }
      );
    }

    const accepted = similarity >= Number(comparisonThreshold);

    if (saveToGenerationJobId) {
      const { error: updateError } = await supabaseAdmin
        .from("generation_jobs")
        .update({
          evaluation: {
            identity_similarity: similarity,
            identity_threshold: Number(comparisonThreshold),
            identity_passed: accepted,
            verification_prediction_id: prediction?.id || null,
            verification_reference_image: resolvedReference,
            verification_candidate_image: candidateUrl,
          },
        })
        .eq("prediction_id", saveToGenerationJobId);

      if (updateError) {
        console.error("Failed to update generation job evaluation:", updateError);
      }
    }

    return Response.json({
      accepted,
      similarity,
      threshold: Number(comparisonThreshold),
      predictionId: prediction?.id || null,
      referenceImage: resolvedReference,
      candidateImage: candidateUrl,
      referenceSource: bestRefMeta?.source || (referenceImage ? "manual" : null),
      rawOutput,
    });
  } catch (error) {
    console.error("verify-face-match error:", error);

    return Response.json(
      {
        error: String(error?.message || "Failed to verify face match"),
      },
      { status: 500 }
    );
  }
}
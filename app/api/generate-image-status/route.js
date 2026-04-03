import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEFAULT_IDENTITY_THRESHOLD = 0.82;
const FACE_MATCH_MODEL =
  process.env.FACE_MATCH_MODEL || "cjwbw/face-similarity";

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
    push(
      row?.image_url,
      scoreAnchor(row),
      `character_images:${row?.id || "row"}`
    );
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

  if (n > 1 && n <= 100) {
    return Math.max(0, Math.min(1, n / 100));
  }

  if (n >= 0 && n <= 1) {
    return n;
  }

  return null;
}

async function verifyFaceMatch({
  referenceImage,
  candidateImage,
  threshold = DEFAULT_IDENTITY_THRESHOLD,
}) {
  const normalizedReference = normalizeImageUrl(referenceImage);
  const normalizedCandidate = normalizeImageUrl(candidateImage);

  if (!normalizedReference || !normalizedCandidate) {
    return {
      accepted: false,
      similarity: null,
      threshold: Number(threshold),
      predictionId: null,
      reason: "Missing valid reference or candidate image",
      rawOutput: null,
    };
  }

  let prediction;

if (FACE_MATCH_MODEL.includes(":")) {
  const [, version] = FACE_MATCH_MODEL.split(":");

  prediction = await replicate.predictions.create({
    version,
    input: {
      image1: normalizedReference,
      image2: normalizedCandidate,
    },
  });
} else {
  prediction = await replicate.predictions.create({
    model: FACE_MATCH_MODEL,
    input: {
      image1: normalizedReference,
      image2: normalizedCandidate,
    },
  });
}

  const rawOutput = prediction?.output;
  const extracted = extractSimilarityScore(rawOutput);
  const similarity = normalizeSimilarity(extracted);

  return {
    accepted: Number.isFinite(similarity)
      ? similarity >= Number(threshold)
      : false,
    similarity,
    threshold: Number(threshold),
    predictionId: prediction?.id || null,
    reason: Number.isFinite(similarity)
      ? null
      : "Could not parse similarity score",
    rawOutput,
  };
}

async function fileOutputToUrl(output) {
  if (!output) return null;

  if (typeof output === "string") return output;

  if (Array.isArray(output)) {
    const first = output[0];
    if (!first) return null;
    if (typeof first === "string") return first;
    if (typeof first.url === "function") return first.url();
    if (typeof first.url === "string") return first.url;
    return null;
  }

  if (typeof output.url === "function") return output.url();
  if (typeof output.url === "string") return output.url;

  return null;
}

async function persistImageToSupabase({
  imageUrl,
  userId,
  bucket = "generated-images",
}) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download generated image: ${response.status} ${response.statusText}`
    );
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let ext = "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
  if (contentType.includes("webp")) ext = "webp";

  const filePath = `${userId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload image to Supabase");
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

  return {
    url: data.publicUrl,
    path: filePath,
    starred: false,
  };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const predictionId = searchParams.get("predictionId");

    if (!predictionId) {
      return Response.json(
        { error: "predictionId is required" },
        { status: 400 }
      );
    }

    const prediction = await replicate.predictions.get(predictionId);

    if (prediction.status !== "succeeded") {
      return Response.json({
        status: prediction.status,
        predictionId,
        error: prediction.error || null,
      });
    }

    const { data: job, error: jobError } = await supabaseAdmin
      .from("generation_jobs")
      .select("*")
      .eq("prediction_id", predictionId)
      .maybeSingle();

    if (jobError) {
      throw new Error(jobError.message || "Failed to load generation job");
    }

    const outputUrl = await fileOutputToUrl(prediction.output);

    if (!outputUrl) {
      return Response.json(
        { error: "Prediction completed but no output URL was found." },
        { status: 500 }
      );
    }

    let identityVerification = null;

if (job?.character_id) {
  const character = await loadCharacterData(job.character_id);
  const anchorRows = await loadCharacterAnchorImages(job.character_id);
  const bestRef = pickBestReferenceImage(character, anchorRows);

  if (bestRef?.url) {
    const identityThreshold = Number(
      character?.identity_threshold ?? DEFAULT_IDENTITY_THRESHOLD
    );

    identityVerification = await verifyFaceMatch({
      referenceImage: bestRef.url,
      candidateImage: outputUrl,
      threshold: identityThreshold,
    });

    const mergedEvaluation = {
      ...(job.evaluation || {}),
      identity_similarity: identityVerification.similarity,
      identity_threshold: identityVerification.threshold,
      identity_passed: identityVerification.accepted,
      verification_prediction_id: identityVerification.predictionId || null,
      verification_reference_image: bestRef.url,
      verification_candidate_image: outputUrl,
      verification_reference_source: bestRef.source || null,
      verification_reason: identityVerification.reason || null,
    };

    const nextStatus = identityVerification.accepted
      ? "succeeded"
      : "identity_rejected";

    await supabaseAdmin
      .from("generation_jobs")
      .update({
        evaluation: mergedEvaluation,
        status: nextStatus,
      })
      .eq("prediction_id", predictionId);

    if (!identityVerification.accepted) {
      return Response.json({
        status: "identity_rejected",
        predictionId,
        rejected: true,
        reason:
          identityVerification.reason ||
          "Generated image failed identity verification",
        similarity: identityVerification.similarity,
        threshold: identityVerification.threshold,
        meta: job.meta || {},
      });
    }
  }
}

    if (!job?.user_id) {
      return Response.json({
        status: "succeeded",
        predictionId,
        image: outputUrl,
        images: [{ url: outputUrl, starred: false }],
      });
    }

    const { data: existingGeneration, error: existingError } = await supabaseAdmin
      .from("image_generations")
      .select(
        "id, prompt, negative_prompt, images, created_at, mode, ratio, style, character_id, prediction_id, evaluation"
      )
      .eq("prediction_id", predictionId)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message || "Failed to check existing generation");
    }

    if (existingGeneration) {
return Response.json({
  status: "succeeded",
  predictionId,
  generation: savedRow,
  identityVerification,
  meta: job.meta || {},
});
    }

    const storedImage = await persistImageToSupabase({
      imageUrl: outputUrl,
      userId: String(job.user_id),
      bucket: "generated-images",
    });

const generationPayload = {
  user_id: String(job.user_id),
  character_id: job.character_id || null,
  prediction_id: predictionId,
  prompt: job.prompt || "",
  negative_prompt: job.negative_prompt || "",
  ratio: job.ratio || "1:1",
  mode: job.mode || "scene_only",
  style: job.style || null,
  images: [storedImage],
  evaluation: {
    ...(job.evaluation || {}),
    ...(identityVerification
      ? {
          identity_similarity: identityVerification.similarity,
          identity_threshold: identityVerification.threshold,
          identity_passed: identityVerification.accepted,
          verification_prediction_id: identityVerification.predictionId || null,
          verification_reason: identityVerification.reason || null,
        }
      : {}),
  },
};

    const { data: savedRow, error: saveError } = await supabaseAdmin
      .from("image_generations")
      .insert(generationPayload)
      .select(
        "id, prompt, negative_prompt, images, created_at, mode, ratio, style, character_id, prediction_id, evaluation"
      )
      .single();

    if (saveError) {
      throw new Error(saveError.message || "Failed to save generation");
    }

    return Response.json({
      status: "succeeded",
      predictionId,
      generation: savedRow,
      meta: job.meta || {},
    });
  } catch (error) {
    console.error("generate-image-status error:", error);

    return Response.json(
      { error: error?.message || "Failed to check prediction status" },
      { status: 500 }
    );
  }
}
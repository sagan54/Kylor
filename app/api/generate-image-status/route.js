import { createClient } from "@supabase/supabase-js";
import Replicate from "replicate";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const STALE_JOB_MS = 5 * 60 * 1000;
const UNSTARTED_JOB_MS = 45 * 1000;
const GENERATED_BUCKET = "generated-images";

function getTimeMs(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function buildGenerationPayload(data) {
  return {
    id: data.id,
    status:
      data.metadata?.state ||
      (Array.isArray(data.images) && data.images.length > 0 ? "completed" : "processing"),
    prompt: data.prompt,
    negative_prompt: data.negative_prompt,
    ratio: data.ratio,
    mode: data.mode,
    style: data.style,
    created_at: data.created_at,
    images: data.images || [],
    error: data.error || data.metadata?.error || null,
    metadata: data.metadata || {},
  };
}

function isRecoverableSyncError(message) {
  const text = String(message || "").toLowerCase();
  return (
    text.includes("statement timeout") ||
    text.includes("failed to update generation row") ||
    text.includes("db sync") ||
    text.includes("canceling statement")
  );
}

async function fileOutputToUrl(output) {
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

function getFileExtFromContentType(contentType = "") {
  const value = String(contentType).toLowerCase();
  if (value.includes("jpeg") || value.includes("jpg")) return "jpg";
  if (value.includes("webp")) return "webp";
  return "png";
}

async function downloadImageAsBuffer(imageUrl) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to download generated image: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const arrayBuffer = await response.arrayBuffer();

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
  };
}

async function uploadGeneratedImage({
  userId,
  buffer,
  contentType,
  fileExt,
  generationId,
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

async function updateGenerationRow(generationId, patch) {
  const { data: existing } = await supabaseAdmin
    .from("image_generations")
    .select("metadata")
    .eq("id", generationId)
    .single();

  const nextPatch =
    patch?.metadata && typeof patch.metadata === "object"
      ? {
          ...patch,
          metadata: {
            ...(existing?.metadata || {}),
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
}

async function reconcileStoredImage(data) {
  const userFolder = data?.user_id || "anonymous";
  const { data: storageItems, error } = await supabaseAdmin.storage
    .from(GENERATED_BUCKET)
    .list(userFolder, {
      limit: 10,
      search: `${data.id}.`,
    });

  if (error) {
    console.warn("generate-image-status: storage reconciliation list failed", {
      generationId: data?.id,
      userFolder,
      error: error.message,
    });
    return null;
  }

  const matched = (storageItems || []).find((item) =>
    String(item?.name || "").startsWith(`${data.id}.`)
  );

  if (!matched) return null;

  const storagePath = `${userFolder}/${matched.name}`;
  const { data: publicData } = supabaseAdmin.storage
    .from(GENERATED_BUCKET)
    .getPublicUrl(storagePath);

  if (!publicData?.publicUrl) return null;

  console.info("generate-image-status: reconciled completed asset from storage", {
    generationId: data.id,
    storagePath,
  });

  try {
    await updateGenerationRow(data.id, {
      images: [publicData.publicUrl],
      metadata: {
        state: "succeeded",
        completedAt: new Date().toISOString(),
        reconciledAt: new Date().toISOString(),
        progressStage: "reconciled_from_storage",
        storagePath,
        syncRecovery: true,
      },
    });
  } catch (syncError) {
    console.warn("generate-image-status: reconcile update failed", {
      generationId: data.id,
      storagePath,
      error: syncError?.message || "Unknown reconcile update error",
    });
  }

  return {
    ...data,
    images: [publicData.publicUrl],
    metadata: {
      ...(data.metadata || {}),
      state: "succeeded",
      completedAt: new Date().toISOString(),
      reconciledAt: new Date().toISOString(),
      progressStage: "reconciled_from_storage",
      storagePath,
      syncRecovery: true,
    },
  };
}

async function finalizeReplicatePrediction(data) {
  const remotePredictionId = data?.metadata?.remotePredictionId;
  if (!remotePredictionId) return null;

  let prediction;
  try {
    prediction = await replicate.predictions.get(remotePredictionId);
  } catch (error) {
    console.warn("generate-image-status: replicate status fetch failed", {
      generationId: data?.id,
      remotePredictionId,
      error: error?.message || "Unknown Replicate status error",
    });
    return null;
  }

  const remoteStatus = String(prediction?.status || "").toLowerCase();
  const errorMessage = prediction?.error || null;

  if (remoteStatus === "succeeded") {
    const remoteUrl = await fileOutputToUrl(prediction?.output);
    if (!remoteUrl) {
      console.warn("generate-image-status: replicate succeeded without output URL", {
        generationId: data?.id,
        remotePredictionId,
      });
      return null;
    }

    console.info("generate-image-status: finalizing replicate prediction", {
      generationId: data.id,
      remotePredictionId,
      remoteStatus,
    });

    const downloaded = await downloadImageAsBuffer(remoteUrl);
    const uploaded = await uploadGeneratedImage({
      userId: data?.user_id || null,
      buffer: downloaded.buffer,
      contentType: downloaded.contentType,
      fileExt: getFileExtFromContentType(downloaded.contentType),
      generationId: data.id,
    });

    await updateGenerationRow(data.id, {
      images: [uploaded.publicUrl],
      mode: data.mode || "image",
      style: data.style || "cinematic",
      metadata: {
        state: "succeeded",
        completedAt: new Date().toISOString(),
        provider: "replicate",
        remotePredictionId,
        remoteStatus,
        remoteUrl,
        storagePath: uploaded.storagePath,
        progressStage: "completed",
        error: null,
      },
    });

    return {
      ...data,
      images: [uploaded.publicUrl],
      metadata: {
        ...(data.metadata || {}),
        state: "succeeded",
        completedAt: new Date().toISOString(),
        provider: "replicate",
        remotePredictionId,
        remoteStatus,
        remoteUrl,
        storagePath: uploaded.storagePath,
        progressStage: "completed",
        error: null,
      },
    };
  }

  if (remoteStatus === "failed" || remoteStatus === "canceled" || remoteStatus === "cancelled") {
    await updateGenerationRow(data.id, {
      metadata: {
        state: "failed",
        failedAt: new Date().toISOString(),
        provider: "replicate",
        remotePredictionId,
        remoteStatus,
        error: errorMessage || "Replicate prediction failed.",
        errorType: "generation_failure",
      },
    });

    return {
      ...data,
      metadata: {
        ...(data.metadata || {}),
        state: "failed",
        failedAt: new Date().toISOString(),
        provider: "replicate",
        remotePredictionId,
        remoteStatus,
        error: errorMessage || "Replicate prediction failed.",
        errorType: "generation_failure",
      },
    };
  }

  return {
    ...data,
    metadata: {
      ...(data.metadata || {}),
      remotePredictionId,
      remoteStatus: remoteStatus || "processing",
      lastRemoteCheckAt: new Date().toISOString(),
    },
  };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const predictionId = searchParams.get("predictionId");

    if (!predictionId) {
      return Response.json(
        { success: false, error: "Missing predictionId" },
        { status: 400 }
      );
    }

    let { data, error } = await supabaseAdmin
      .from("image_generations")
      .select("*")
      .eq("id", predictionId)
      .single();

    if (error || !data) {
      return Response.json(
        { success: false, error: "Generation not found" },
        { status: 404 }
      );
    }

    const metadata = data?.metadata || {};
    const state = String(metadata?.state || "").toLowerCase() || "processing";
    const hasImages = Array.isArray(data?.images) && data.images.length > 0;
    const createdAtMs = getTimeMs(data?.created_at);
    const startedAtMs = getTimeMs(metadata?.startedAt);
    const completedAtMs = getTimeMs(metadata?.completedAt);
    const now = Date.now();
    const ageMs = createdAtMs ? now - createdAtMs : null;
    const runtimeMs =
      (startedAtMs ? now - startedAtMs : null) ??
      (createdAtMs ? now - createdAtMs : null);
    const errorMessage = metadata?.error || "";

    if (state === "completed" || hasImages || completedAtMs) {
      return Response.json({
        success: true,
        status: data?.mode === "image" ? "succeeded" : "completed",
        images: data?.images || [],
        generation: buildGenerationPayload(data),
      });
    }

    if (state === "failed" && !isRecoverableSyncError(errorMessage)) {
      return Response.json({
        success: false,
        status: "failed",
        error: errorMessage || "Generation failed",
        images: data?.images || [],
        errorType: metadata?.errorType || "generation_failure",
        generation: buildGenerationPayload(data),
      });
    }

    if (String(metadata?.provider || "").toLowerCase() === "replicate") {
      const replicateResult = await finalizeReplicatePrediction(data);
      if (replicateResult?.images?.length) {
        return Response.json({
          success: true,
          status: "succeeded",
          images: replicateResult?.images || [],
          generation: buildGenerationPayload(replicateResult),
          syncState: "replicate_finalized",
        });
      }

      if (String(replicateResult?.metadata?.state || "").toLowerCase() === "failed") {
        return Response.json({
          success: false,
          status: "failed",
          error: replicateResult?.metadata?.error || "Generation failed",
          images: replicateResult?.images || [],
          errorType:
            replicateResult?.metadata?.errorType || "generation_failure",
          generation: buildGenerationPayload(replicateResult),
        });
      }

      if (replicateResult) {
        data = replicateResult;
      }
    }

    const reconciled = await reconcileStoredImage(data);
    if (reconciled) {
      return Response.json({
        success: true,
        status: "succeeded",
        images: reconciled?.images || [],
        generation: buildGenerationPayload(reconciled),
        syncState: "reconciled",
      });
    }

    if (!startedAtMs && ageMs !== null && ageMs > UNSTARTED_JOB_MS) {
      return Response.json({
        success: false,
        status: "failed",
        error:
          "Generation did not start in time. The background worker may be offline. Please try again.",
        images: data?.images || [],
        errorType: "generation_failure",
        generation: buildGenerationPayload(data),
      });
    }

    if (runtimeMs !== null && runtimeMs > STALE_JOB_MS) {
      console.info(
        "generate-image-status: generation still processing past soft timeout",
        {
          generationId: data.id,
          state,
          runtimeMs,
          progressStage: metadata?.progressStage || null,
        }
      );

      return Response.json({
        success: true,
        status: "processing",
        images: data?.images || [],
        recoverable: true,
        syncState: isRecoverableSyncError(errorMessage)
          ? "recovering_db_sync"
          : "processing",
        message: "Generation is still processing. Refreshing status...",
        generation: buildGenerationPayload(data),
      });
    }

    if (data?.mode && data.mode !== "image") {
      return Response.json({
        success: true,
        status: "processing",
        images: data?.images || [],
        error: errorMessage || null,
        generation: buildGenerationPayload(data),
      });
    }

    return Response.json({
      success: true,
      status: "processing",
      images: data?.images || [],
      recoverable: isRecoverableSyncError(errorMessage),
      syncState: isRecoverableSyncError(errorMessage)
        ? "recovering_db_sync"
        : "processing",
      message: isRecoverableSyncError(errorMessage)
        ? "Generation is still processing. Refreshing status..."
        : undefined,
      generation: buildGenerationPayload(data),
    });
  } catch (error) {
    console.error("generate-image-status failed:", error);

    return Response.json(
      {
        success: false,
        error: error?.message || "Status check failed",
      },
      { status: 500 }
    );
  }
}

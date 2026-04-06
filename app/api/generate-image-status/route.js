import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    prompt: data.prompt,
    negative_prompt: data.negative_prompt,
    ratio: data.ratio,
    mode: data.mode,
    style: data.style,
    created_at: data.created_at,
    images: data.images || [],
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

    const { data, error } = await supabaseAdmin
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

    if (hasImages || completedAtMs) {
      return Response.json({
        success: true,
        status: "succeeded",
        generation: buildGenerationPayload(data),
      });
    }

    const reconciled = await reconcileStoredImage(data);
    if (reconciled) {
      return Response.json({
        success: true,
        status: "succeeded",
        generation: buildGenerationPayload(reconciled),
        syncState: "reconciled",
      });
    }

    if (state === "failed" && !isRecoverableSyncError(errorMessage)) {
      return Response.json({
        success: false,
        status: "failed",
        error: errorMessage || "Generation failed",
        errorType: metadata?.errorType || "generation_failure",
        generation: buildGenerationPayload(data),
      });
    }

    if (!startedAtMs && ageMs !== null && ageMs > UNSTARTED_JOB_MS) {
      return Response.json({
        success: false,
        status: "failed",
        error:
          "Generation did not start in time. The background worker may be offline. Please try again.",
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
        recoverable: true,
        syncState: isRecoverableSyncError(errorMessage)
          ? "recovering_db_sync"
          : "processing",
        message: "Generation is still processing. Refreshing status...",
        generation: buildGenerationPayload(data),
      });
    }

    return Response.json({
      success: true,
      status: "processing",
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

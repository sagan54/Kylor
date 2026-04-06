import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STALE_JOB_MS = 5 * 60 * 1000;
const UNSTARTED_JOB_MS = 45 * 1000;

function getTimeMs(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
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

    if (hasImages || completedAtMs) {
      return Response.json({
        success: true,
        status: "succeeded",
        generation: data,
      });
    }

    if (state === "failed") {
      return Response.json({
        success: false,
        status: "failed",
        error: metadata?.error || "Generation failed",
        generation: data,
      });
    }

    if (state === "succeeded" && hasImages) {
      return Response.json({
        success: true,
        status: "succeeded",
        generation: data,
      });
    }

    if (!startedAtMs && ageMs !== null && ageMs > UNSTARTED_JOB_MS) {
      return Response.json({
        success: false,
        status: "failed",
        error:
          "Generation did not start in time. The background worker may be offline. Please try again.",
        generation: data,
      });
    }

    if (runtimeMs !== null && runtimeMs > STALE_JOB_MS) {
      return Response.json({
        success: false,
        status: "failed",
        error:
          "Generation is taking longer than expected and appears stalled. Please try again.",
        generation: data,
      });
    }

    return Response.json({
      success: true,
      status: "processing",
      generation: {
        id: data.id,
        prompt: data.prompt,
        negative_prompt: data.negative_prompt,
        ratio: data.ratio,
        mode: data.mode,
        style: data.style,
        created_at: data.created_at,
        images: data.images || [],
        metadata: data.metadata || {},
      },
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

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    const state = data?.metadata?.state || "processing";

    if (state === "failed") {
      return Response.json({
        success: false,
        status: "failed",
        error: data?.metadata?.error || "Generation failed",
        generation: data,
      });
    }

    if (
      state === "succeeded" &&
      Array.isArray(data.images) &&
      data.images.length > 0
    ) {
      return Response.json({
        success: true,
        status: "succeeded",
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
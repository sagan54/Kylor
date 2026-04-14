export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("id");

    if (!jobId) {
      return Response.json(
        { success: false, error: "Missing jobId" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle(); // ✅ FIXED (IMPORTANT)

    if (error) {
      console.error("Supabase error:", error);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return Response.json({
        success: true,
        status: "pending", // 👈 important fallback
        result: null,
        error: null,
      });
    }

    return Response.json({
      success: true,
      status: data.status,
      result: data.result,
      error: data.error,
    });

  } catch (err) {
    console.error("Job-status crash:", err);
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
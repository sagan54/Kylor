export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("id");

  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  return Response.json(data);
}
// Place this file at: app/api/characters/search/route.js

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = String(searchParams.get("q") || "").trim();

    let query = supabaseAdmin
      .from("characters")
      .select("id, name, description, master_image, reference_image, cover_image")
      .order("name", { ascending: true })
      .limit(20);

    if (q) {
      query = query.ilike("name", `%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      return Response.json({ characters: [] }, { status: 200 });
    }

    return Response.json({ characters: data || [] });
  } catch (err) {
    return Response.json({ characters: [] }, { status: 200 });
  }
}
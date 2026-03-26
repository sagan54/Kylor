import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CHAR_BUCKET = "characters";

export async function POST(req) {
  try {
    const { imageUrl, userId, characterId, folder = "generated" } = await req.json();

    if (!imageUrl || !userId || !characterId) {
      return Response.json(
        { error: "Missing imageUrl, userId, or characterId" },
        { status: 400 }
      );
    }

    const imageRes = await fetch(imageUrl);

    if (!imageRes.ok) {
      return Response.json(
        { error: `Failed to fetch external image: ${imageRes.status}` },
        { status: 400 }
      );
    }

    const blob = await imageRes.blob();
    const contentType = blob.type || "image/png";

    const ext =
      contentType.includes("webp")
        ? "webp"
        : contentType.includes("jpeg") || contentType.includes("jpg")
        ? "jpg"
        : "png";

    const fileName = `${folder}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const storagePath = `${userId}/${characterId}/${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(CHAR_BUCKET)
      .upload(storagePath, blob, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicData } = supabase.storage
      .from(CHAR_BUCKET)
      .getPublicUrl(storagePath);

    return Response.json({
      url: publicData?.publicUrl || null,
      storagePath,
    });
  } catch (err) {
    console.error("persist-character-image error:", err);
    return Response.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
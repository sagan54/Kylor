import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const {
      prompt,
      size = "1024x1024",
      quality = "medium",
      n = 1,
    } = await req.json();

    if (!prompt || !prompt.trim()) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size,
      quality,
      output_format: "png",
      n: Math.min(Number(n) || 1, 4),
    });

    const images =
      result?.data
        ?.map((item) => (item?.b64_json ? `data:image/png;base64,${item.b64_json}` : null))
        .filter(Boolean) || [];

    if (!images.length) {
      return Response.json(
        { error: "No image returned from OpenAI" },
        { status: 500 }
      );
    }

    return Response.json({
      image: images[0],
      images,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return Response.json(
      { error: error.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}
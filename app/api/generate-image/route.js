import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      size: "1024x1024"
    });

    return Response.json({
      image: result.data[0].url
    });

  } catch (error) {
    return Response.json({ error: error.message });
  }
}
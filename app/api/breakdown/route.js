import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req) {

  const { script } = await req.json();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Break this film script into scenes. For each scene include location, characters, props and mood."
      },
      {
        role: "user",
        content: script
      }
    ]
  });

  return Response.json({
    breakdown: completion.choices[0].message.content
  });

}
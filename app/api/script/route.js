export async function POST(req) {
  try {
    const { title, genre, tone, idea } = await req.json();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are an AI film writing assistant.

Return ONLY valid JSON.
Do not use markdown.
Do not add explanation text.
Do not wrap in backticks.

Use this exact JSON structure:
{
  "title": "string",
  "genre": "string",
  "tone": "string",
  "logline": "string",
  "theme": "string",
  "characters": ["character 1", "character 2", "character 3"],
  "act1": "string",
  "act2": "string",
  "act3": "string",
  "sceneBreakdown": ["scene 1", "scene 2", "scene 3", "scene 4"]
}
            `,
          },
          {
            role: "user",
            content: `
Project Title: ${title || "Create a strong original title"}
Genre: ${genre}
Tone: ${tone}
Idea: ${idea}

Create a cinematic film outline for filmmakers.
            `,
          },
        ],
      }),
    });

    const data = await response.json();

    console.log("OPENAI RESPONSE:", data);

    if (!response.ok) {
      return Response.json({
        result: "OpenAI API error: " + (data.error?.message || "Unknown error"),
      });
    }

    const rawText = data.choices?.[0]?.message?.content || "";

    try {
      const parsed = JSON.parse(rawText);

      return Response.json({
        result: rawText,
        structuredResult: parsed,
      });
    } catch (parseError) {
      return Response.json({
        result: rawText || "Failed to parse structured output.",
      });
    }
  } catch (error) {
    console.error("SERVER ERROR:", error);
    return Response.json({
      result: "Server error: " + error.message,
    });
  }
}
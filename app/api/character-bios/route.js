export async function POST(req) {
  try {
    const { title, genre, tone, idea, characters } = await req.json();

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
You are an AI film development assistant.

Return ONLY valid JSON.
Do not use markdown.
Do not add explanation text.
Do not wrap in backticks.

Use this exact structure:
{
  "characters": [
    {
      "name": "string",
      "role": "string",
      "personality": "string",
      "goal": "string",
      "conflict": "string",
      "arc": "string"
    }
  ]
}
            `,
          },
          {
            role: "user",
            content: `
Project Title: ${title}
Genre: ${genre}
Tone: ${tone}
Idea: ${idea}

Character names:
${(characters || []).join(", ")}

Generate strong cinematic character bios for this project.
            `,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({
        error: data.error?.message || "OpenAI API error",
      });
    }

    const rawText = data.choices?.[0]?.message?.content || "";

    try {
      const parsed = JSON.parse(rawText);
      return Response.json(parsed);
    } catch (error) {
      return Response.json({
        error: "Failed to parse character bios.",
        raw: rawText,
      });
    }
  } catch (error) {
    return Response.json({
      error: "Server error: " + error.message,
    });
  }
}
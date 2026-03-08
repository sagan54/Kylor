export async function POST(req) {
  try {
    const { title, genre, tone, idea, scene } = await req.json();

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
You are an AI film scene development assistant.

Return ONLY valid JSON.
Do not use markdown.
Do not add explanation text.
Do not wrap in backticks.

Use this exact structure:
{
  "location": "string",
  "timeOfDay": "string",
  "visualDescription": "string",
  "actionBeats": ["string", "string", "string"],
  "dialogueTone": "string",
  "cinematicNotes": "string"
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

Scene to expand:
${scene}

Create a cinematic expansion of this scene for filmmakers.
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
        error: "Failed to parse scene expansion.",
        raw: rawText,
      });
    }
  } catch (error) {
    return Response.json({
      error: "Server error: " + error.message,
    });
  }
}
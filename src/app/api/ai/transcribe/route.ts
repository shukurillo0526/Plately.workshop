import { NextResponse } from "next/server";

function getGeminiApiKey(): string | undefined {
  const key = process.env.GEMINI_API_KEY;
  if (key && !key.includes("your-")) {
    return key.trim();
  }
  return undefined;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { audioDataUrl } = body;

    if (!audioDataUrl || typeof audioDataUrl !== "string") {
      return NextResponse.json({ error: "audioDataUrl is required" }, { status: 400 });
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
    }

    const [header, base64Data] = audioDataUrl.split(",");
    const mimeType = header.split(";")[0].replace("data:", "") || "audio/webm";

    const prompt = `Transcribe the spoken words in this audio verbatim. If the audio is in Uzbek, Russian, or English, transcribe accurately in that language. Output ONLY the raw transcribed text with no quotes, markdown, or extra explanations.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.warn("[Transcribe API Error]:", err);
      return NextResponse.json({ error: err?.error?.message || "Transcription failed" }, { status: 500 });
    }

    const json = await res.json();
    const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    return NextResponse.json({
      success: true,
      text: rawText,
    });
  } catch (err: any) {
    console.error("[Transcribe] Internal error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getGeminiApiKey(): string | undefined {
  if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("your-")) {
    return process.env.GEMINI_API_KEY;
  }

  try {
    const envPaths = [
      path.join(process.cwd(), ".env.local"),
      path.join(process.cwd(), ".env"),
      path.join(process.cwd(), "..", "Plately.app", "backend", ".env"),
    ];
    for (const p of envPaths) {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, "utf-8");
        const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
        if (match && match[1]) {
          const val = match[1].trim();
          if (val && !val.includes("your-")) {
            process.env.GEMINI_API_KEY = val;
            return val;
          }
        }
      }
    }
  } catch (e) {
    console.warn("[Transcribe] Could not read env file from disk:", e);
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

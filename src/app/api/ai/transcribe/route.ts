import { NextResponse } from "next/server";

function getGeminiApiKey(): string | undefined {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (key && !key.includes("your-") && !key.includes("placeholder")) {
    return key.trim();
  }
  return undefined;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { audioDataUrl } = body;

    if (!audioDataUrl || typeof audioDataUrl !== "string") {
      return NextResponse.json(
        { error: "audioDataUrl is required" },
        { status: 400 }
      );
    }

    const apiKey = getGeminiApiKey();

    // In local development or testing environments where GEMINI_API_KEY is not configured,
    // return a resilient multilingual sample transcription so audio voice input functions without crashing.
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        text: "Osh va shashlik menyusi uchun yangi dizayn va stol bron qilish xaritasini qo'shing",
        simulated: true,
      });
    }

    let mimeType = "audio/webm";
    let base64Data = audioDataUrl;

    if (audioDataUrl.includes(",")) {
      const [header, data] = audioDataUrl.split(",");
      base64Data = data;
      mimeType = header.split(";")[0].replace("data:", "") || "audio/webm";
    }

    const prompt = `You are a high-accuracy multilingual audio transcription system for a restaurant management and website studio.
Transcribe the spoken audio verbatim in the exact language spoken.
Primary language support:
- Uzbek (O'zbekcha / Ўзбекча)
- Russian (Русский язык)
- English

Guidelines:
1. Accurately capture Uzbek culinary terms (e.g. Osh, Somsa, Shashlik, Lag'mon, Tandir, Halal, Choyxona, Bron qilish, Stollar, Menyus).
2. Output ONLY the raw transcribed text with NO quotes, NO markdown formatting, and NO commentary.
3. If no intelligible speech is detected, output an empty string.`;

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
      const err = await res.json().catch(() => ({}));
      console.warn("[Transcribe API Error]:", err);
      return NextResponse.json(
        { error: err?.error?.message || "Transcription failed" },
        { status: 500 }
      );
    }

    const json = await res.json();
    const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    return NextResponse.json({
      success: true,
      text: rawText,
    });
  } catch (err: any) {
    console.error("[Transcribe] Internal error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

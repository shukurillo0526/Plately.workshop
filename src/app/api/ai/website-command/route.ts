import { NextResponse } from "next/server";

export interface WebsiteSection {
  id: string;
  type:
    | "announcement"
    | "hero"
    | "about"
    | "highlights"
    | "booking"
    | "reviews"
    | "hours_location"
    | "gallery"
    | "faq"
    | "cta";
  title: string;
  subtitle?: string;
  content: string;
  enabled: boolean;
  meta?: Record<string, any>;
}

export interface WebsiteThemeConfig {
  primaryColor: string;
  secondaryColor?: string;
  backgroundColor?: string;
  cardColor?: string;
  textColor?: string;
  fontFamily: "Outfit" | "Inter" | "Playfair Display";
  heroTagline: string;
  heroHeadline: string;
  heroButtonText: string;
  heroButtonLink?: string;
  heroLayout?: "centered" | "split" | "minimal";
  heroImage?: string;
  aboutStory: string;
  aboutImage?: string;
  deliveryNotice: string;
  sections: WebsiteSection[];
}

export interface AttachedMedia {
  name: string;
  type: string;
  dataUrl: string; // base64 data URL
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      command,
      currentConfig,
      restaurantName = "Our Restaurant",
      model = "gemini-2.5-flash",
      attachments = [] as AttachedMedia[],
    } = body;

    if ((!command || typeof command !== "string") && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: "A text command or attachment is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. If Gemini API Key is available, use real Gemini Multimodal API
    if (apiKey) {
      try {
        const parts: any[] = [];

        // Add attachments as inlineData parts
        for (const file of attachments) {
          if (file.dataUrl && file.dataUrl.includes(",")) {
            const [header, base64Data] = file.dataUrl.split(",");
            const mimeType = file.type || header.split(";")[0].replace("data:", "") || "image/jpeg";
            parts.push({
              inlineData: {
                mimeType,
                data: base64Data,
              },
            });
          }
        }

        // System & User prompt
        const promptInstruction = `
You are the **Plately AI Website Architect & Senior UX Designer**.
The user wants to customize their restaurant digital presence.

RESTAURANT NAME: "${restaurantName}"
USER NATURAL LANGUAGE INSTRUCTION: "${command || "Design a stunning website matching the attached image/file"}"

CURRENT WEBSITE CONFIGURATION:
${JSON.stringify(currentConfig, null, 2)}

INSTRUCTIONS:
1. Carefully analyze the user prompt and any attached photos, logos, or media.
2. Return an updated, high-converting, aesthetically cohesive website configuration conforming strictly to the JSON schema below.
3. If the user describes a cuisine, luxury tier, festive occasion, or layout change:
   - Select harmonious hex colors: primaryColor, secondaryColor, backgroundColor, cardColor.
   - Choose the best typography pairing: "Outfit" (modern & warm), "Playfair Display" (luxury & classical), or "Inter" (clean & minimalist).
   - Write creative, appetizing copywriting for heroHeadline, heroTagline, and aboutStory tailored specifically to the cuisine.
   - Update, add, or enable relevant sections:
     - "announcement" (for promos, holiday hours, discounts)
     - "hero" (set heroLayout to "split", "centered", or "minimal")
     - "about" (heritage, passion, craft)
     - "highlights" (signature dishes)
     - "booking" (table reservation)
     - "reviews" (guest testimonials)
     - "hours_location" (branches & hours)
     - "gallery" (photo showcase)
     - "faq" (frequently asked questions)
     - "cta" (conversion banner)
4. If an image is attached and represents a dish or atmosphere, you can retain or specify high quality culinary imagery.
5. Provide a list of "changes" summarizing your key decisions, and a concise "message" for the user.

REQUIRED JSON FORMAT:
{
  "primaryColor": "#...",
  "secondaryColor": "#...",
  "backgroundColor": "#...",
  "cardColor": "#...",
  "fontFamily": "Outfit" | "Inter" | "Playfair Display",
  "heroHeadline": "...",
  "heroTagline": "...",
  "heroButtonText": "...",
  "heroButtonLink": "#menu" | "#booking",
  "heroLayout": "split" | "centered" | "minimal",
  "heroImage": "https://...",
  "aboutStory": "...",
  "aboutImage": "https://...",
  "deliveryNotice": "...",
  "sections": [
    { "id": "...", "type": "...", "title": "...", "subtitle": "...", "content": "...", "enabled": true }
  ],
  "changes": ["...", "..."],
  "message": "..."
}
`;

        parts.push({ text: promptInstruction });

        // Call Gemini generateContent
        const selectedModel = model || "gemini-2.5-flash";
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.7,
            },
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (rawText) {
            const parsed = JSON.parse(rawText);

            // Merge safely with currentConfig defaults
            const updatedConfig: WebsiteThemeConfig = {
              ...currentConfig,
              ...parsed,
              heroLayout: parsed.heroLayout === "split" || parsed.heroLayout === "centered" || parsed.heroLayout === "minimal"
                ? parsed.heroLayout
                : "split",
              sections: Array.isArray(parsed.sections) && parsed.sections.length > 0
                ? parsed.sections
                : currentConfig.sections,
            };

            return NextResponse.json({
              success: true,
              modelUsed: selectedModel,
              message: parsed.message || (parsed.changes ? parsed.changes.join(" • ") : "Design refreshed with Gemini AI"),
              changes: parsed.changes || ["Updated styling and layout with Gemini AI"],
              config: updatedConfig,
            });
          }
        } else {
          const errData = await res.json();
          console.warn("[Gemini API] Request returned error:", errData);
        }
      } catch (geminiError: any) {
        console.warn("[Gemini API] Exception, falling back to local engine:", geminiError);
      }
    }

    // 2. Intelligent Local Fallback Engine (Runs if offline or quota exceeded)
    const p = (command || "").toLowerCase().trim();
    const nextConfig: WebsiteThemeConfig = JSON.parse(JSON.stringify(currentConfig));
    const changes: string[] = [];

    if (p.includes("luxury") || p.includes("steak") || p.includes("gold") || p.includes("obsidian")) {
      nextConfig.primaryColor = "#d4af37";
      nextConfig.secondaryColor = "#f59e0b";
      nextConfig.backgroundColor = "#0b0d11";
      nextConfig.cardColor = "#141720";
      nextConfig.fontFamily = "Playfair Display";
      nextConfig.heroLayout = "split";
      changes.push("Applied Luxury Fine Dining theme with Royal Gold & Obsidian palette");
    } else if (p.includes("emerald") || p.includes("green") || p.includes("healthy") || p.includes("organic")) {
      nextConfig.primaryColor = "#10b981";
      nextConfig.secondaryColor = "#059669";
      nextConfig.backgroundColor = "#061510";
      nextConfig.cardColor = "#0b231b";
      nextConfig.fontFamily = "Outfit";
      changes.push("Applied Fresh Emerald Botanical theme with organic culinary styling");
    } else if (p.includes("flame") || p.includes("bbq") || p.includes("grill") || p.includes("plov") || p.includes("uzbek")) {
      nextConfig.primaryColor = "#f98b25";
      nextConfig.secondaryColor = "#e11d48";
      nextConfig.backgroundColor = "#0d1117";
      nextConfig.cardColor = "#161b22";
      nextConfig.fontFamily = "Outfit";
      nextConfig.heroLayout = "split";
      changes.push("Applied Uzbek Flame Grill & Saffron Amber theme with traditional warmth");
    } else if (p.includes("cafe") || p.includes("coffee") || p.includes("bakery")) {
      nextConfig.primaryColor = "#d97706";
      nextConfig.secondaryColor = "#f59e0b";
      nextConfig.backgroundColor = "#14100c";
      nextConfig.cardColor = "#1f1814";
      nextConfig.fontFamily = "Outfit";
      changes.push("Applied Artisan Coffeehouse & Warm Espresso palette");
    }

    if (p.includes("book") || p.includes("reserv") || p.includes("table")) {
      let bookingSec = nextConfig.sections.find((s) => s.type === "booking");
      if (!bookingSec) {
        bookingSec = {
          id: `sec-booking-${Date.now()}`,
          type: "booking",
          title: "Reserve a Table",
          subtitle: "ELEVATED DINING EXPERIENCE",
          content: "Book a table for lunch or dinner with instant SMS confirmation.",
          enabled: true,
        };
        nextConfig.sections.splice(2, 0, bookingSec);
        changes.push("Added interactive Table Reservation & Booking module");
      } else {
        bookingSec.enabled = true;
        changes.push("Enabled Table Reservation module");
      }
      nextConfig.heroButtonText = "Reserve a Table";
      nextConfig.heroButtonLink = "#booking";
    }

    if (p.includes("review") || p.includes("star") || p.includes("testimonial")) {
      let revSec = nextConfig.sections.find((s) => s.type === "reviews");
      if (!revSec) {
        revSec = {
          id: `sec-reviews-${Date.now()}`,
          type: "reviews",
          title: "Guest Testimonials",
          subtitle: "4.9 STARS ON GOOGLE & YANDEX",
          content: "Loved by thousands of food lovers across Tashkent.",
          enabled: true,
        };
        nextConfig.sections.push(revSec);
        changes.push("Added Customer Reviews & 4.9-Star Social Proof section");
      } else {
        revSec.enabled = true;
        changes.push("Enabled Customer Reviews section");
      }
    }

    if (p.includes("gallery") || p.includes("photo")) {
      let galSec = nextConfig.sections.find((s) => s.type === "gallery");
      if (!galSec) {
        galSec = {
          id: `sec-gallery-${Date.now()}`,
          type: "gallery",
          title: "Culinary Gallery & Moments",
          subtitle: "OUR ATMOSPHERE",
          content: "Experience the vibrant craft, open flame kitchens, and warm hospitality.",
          enabled: true,
        };
        nextConfig.sections.push(galSec);
        changes.push("Added Photo Gallery showcase");
      } else {
        galSec.enabled = true;
      }
    }

    return NextResponse.json({
      success: true,
      modelUsed: "local-heuristic-engine",
      message: changes.length > 0 ? changes.join(" • ") : "Design refreshed successfully",
      changes: changes.length > 0 ? changes : ["Updated styling and typography"],
      config: nextConfig,
    });
  } catch (err: any) {
    console.error("[WebsiteCommand] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process website command" },
      { status: 500 }
    );
  }
}

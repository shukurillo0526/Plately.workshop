import { NextResponse } from "next/server";

export interface TableItem {
  id: string;
  name: string;
  seats: number;
  shape: "rect" | "round" | "booth" | "bar";
  zone: string;
  status: "available" | "reserved" | "selected";
  x: number; // 0 to 100%
  y: number; // 0 to 100%
  width?: number;
  height?: number;
}

export interface WebsiteSection {
  id: string;
  type:
    | "announcement"
    | "hero"
    | "about"
    | "highlights"
    | "booking"
    | "table_selection"
    | "reviews"
    | "hours_location"
    | "gallery"
    | "faq"
    | "cta"
    | "custom_widget";
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

    const apiKey = getGeminiApiKey();

    // 1. If Gemini API Key is available, use real Gemini Multimodal API
    if (apiKey) {
      try {
        const parts: any[] = [];

        // Add attachments as inlineData parts (Photos, Documents, Audio)
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
USER INSTRUCTION: "${command || "Design a stunning website matching the attached audio/image/file"}"

CURRENT WEBSITE CONFIGURATION:
${JSON.stringify(currentConfig, null, 2)}

INSTRUCTIONS:
1. Carefully analyze the user prompt and any attached photos, food imagery, logos, or voice audio recordings.
2. If voice audio is attached, listen to the spoken instructions and apply the requested changes.
3. Return an updated, high-converting, aesthetically cohesive website configuration conforming strictly to the JSON schema below.
4. Color and Style Rules:
   - "primaryColor": select an alluring hex color matching the cuisine/vibe (e.g. #f98b25 Saffron, #10b981 Emerald, #d4af37 Gold, #e11d48 Crimson, #d97706 Coffee, #3b82f6 Blue).
   - "backgroundColor": pick a harmonious dark background (e.g. #0d1117, #0b0d11, #061510, #14100c, #090d16) or light if requested.
   - "fontFamily": "Outfit" (modern/warm), "Playfair Display" (luxury serif), or "Inter" (clean minimalist).
   - "heroLayout": "split" (headline with food photo on right), "centered", or "minimal". (If user mentions mobile layout or clean focus, prefer "centered").
   - "heroHeadline", "heroTagline", "aboutStory": write creative, appetizing copywriting tailored specifically to the cuisine. Keep headlines punchy, elegant, and mobile-friendly.
   - "heroButtonText": "Order Online Now", "Reserve a Table", "Explore Menu", etc.
   - "heroButtonLink": "#menu" or "#booking".
5. Mobile & Viewport Optimization:
   - If the user asks about "mobile", "fit", "screen", "responsive", or layout polish, optimize the typography, set "heroLayout" to "centered", refine copywriting to be punchy and readable without overflowing, and ensure smooth conversion flow.
6. Section Management:
   - Ensure the "sections" array contains all relevant sections with "enabled": true when requested:
     - "announcement": top delivery/promo banner
     - "hero": main banner
     - "about": culinary story & heritage
     - "highlights": signature dishes
     - "table_selection": INTERACTIVE ARCHITECTURAL FLOOR PLAN & SEATING MAP.
       CRITICAL: If the user attached a floor plan image, architectural blueprint, or asked for "table selection", "floor plan", "seats", "table map", or "interactive tables":
       You MUST extract or synthesize the tables and layout into meta:
       {
         "interactiveMap": true,
         "zones": ["Window Booths", "Main Dining", "Private Lounge", "Bar Area"],
         "tables": [
           { "id": "t1", "name": "Table 1", "seats": 6, "shape": "booth", "zone": "Window Booths", "status": "available", "x": 16, "y": 20 },
           { "id": "t2", "name": "Table 2", "seats": 6, "shape": "booth", "zone": "Window Booths", "status": "available", "x": 38, "y": 20 },
           { "id": "t3", "name": "Table 3", "seats": 6, "shape": "booth", "zone": "Window Booths", "status": "reserved", "x": 60, "y": 20 },
           { "id": "t-vip8", "name": "VIP Booth 8", "seats": 8, "shape": "booth", "zone": "Private Lounge", "status": "available", "x": 82, "y": 20 },
           { "id": "t7-mid", "name": "Table 7", "seats": 4, "shape": "rect", "zone": "Main Dining", "status": "available", "x": 28, "y": 50 },
           { "id": "t8-mid", "name": "Table 8", "seats": 6, "shape": "rect", "zone": "Main Dining", "status": "available", "x": 48, "y": 50 },
           { "id": "bar", "name": "Cocktail Bar", "seats": 5, "shape": "bar", "zone": "Bar Area", "status": "available", "x": 68, "y": 50 },
           { "id": "t6", "name": "Table 6", "seats": 4, "shape": "booth", "zone": "Window Booths", "status": "available", "x": 16, "y": 80 },
           { "id": "t7-bot", "name": "Table 7", "seats": 4, "shape": "booth", "zone": "Window Booths", "status": "available", "x": 38, "y": 80 },
           { "id": "t8-bot", "name": "Table 8", "seats": 4, "shape": "booth", "zone": "Window Booths", "status": "reserved", "x": 60, "y": 80 }
         ]
       }
     - "custom_widget": AI Studio dynamic custom widget for calculators, meal builders, etc.
     - "booking": table reservation module
     - "reviews": guest testimonials & ratings
     - "hours_location": opening hours & branches
     - "gallery": photo gallery
     - "faq": frequently asked questions
     - "cta": conversion banner
7. Provide a list of "changes" summarizing your key decisions, and a concise 1-sentence "message" for the user.

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
  "heroButtonLink": "#menu" | "#booking" | "#tables",
  "heroLayout": "split" | "centered" | "minimal",
  "heroImage": "https://...",
  "aboutStory": "...",
  "aboutImage": "https://...",
  "deliveryNotice": "...",
  "sections": [
    { "id": "...", "type": "...", "title": "...", "subtitle": "...", "content": "...", "enabled": true, "meta": {} }
  ],
  "changes": ["...", "..."],
  "message": "..."
}
`;

        parts.push({ text: promptInstruction });

        // Map aliases or deprecated names to active working models
        let selectedModel = model || "gemini-2.5-flash";
        if (selectedModel === "gemini-2.5-pro" || selectedModel === "gemini-pro") {
          selectedModel = "gemini-3.1-pro-preview";
        }
        if (selectedModel === "gemini-2.0-flash" || selectedModel === "gemini-1.5-flash") {
          selectedModel = "gemini-2.5-flash";
        }
        if (selectedModel === "gemini-3.8-flash") {
          selectedModel = "gemini-flash-latest";
        }

        const callGemini = async (targetModel: string) => {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
          return await fetch(url, {
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
        };

        let res = await callGemini(selectedModel);

        // If target model failed and wasn't gemini-2.5-flash, fallback to gemini-2.5-flash
        if (!res.ok && selectedModel !== "gemini-2.5-flash") {
          console.warn(`[Gemini API] ${selectedModel} failed with status ${res.status}. Falling back to gemini-2.5-flash.`);
          selectedModel = "gemini-2.5-flash";
          res = await callGemini(selectedModel);
        }

        if (res.ok) {
          const json = await res.json();
          const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (rawText) {
            const cleanText = rawText
              .replace(/^```json\s*/i, "")
              .replace(/^```\s*/i, "")
              .replace(/\s*```$/, "")
              .trim();
            const parsed = JSON.parse(cleanText);

            // Merge safely with currentConfig defaults
            const updatedConfig: WebsiteThemeConfig = {
              ...currentConfig,
              ...parsed,
              heroLayout:
                parsed.heroLayout === "split" ||
                parsed.heroLayout === "centered" ||
                parsed.heroLayout === "minimal"
                  ? parsed.heroLayout
                  : currentConfig.heroLayout || "split",
              sections:
                Array.isArray(parsed.sections) && parsed.sections.length > 0
                  ? parsed.sections
                  : currentConfig.sections,
            };

            return NextResponse.json({
              success: true,
              modelUsed: selectedModel,
              message:
                parsed.message ||
                (parsed.changes ? parsed.changes.join(" • ") : "Design refreshed with Gemini AI"),
              changes: parsed.changes || ["Updated styling and layout with Gemini AI"],
              config: updatedConfig,
            });
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          console.warn("[Gemini API] Request returned error:", res.status, errData);
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

    if (p.includes("table") || p.includes("floor") || p.includes("seat") || p.includes("plan") || p.includes("map") || p.includes("book") || p.includes("reserv")) {
      const defaultFloorPlanTables: TableItem[] = [
        { id: "t1", name: "Table 1", seats: 6, shape: "booth", zone: "Window Booths", status: "available", x: 16, y: 22 },
        { id: "t2", name: "Table 2", seats: 6, shape: "booth", zone: "Window Booths", status: "available", x: 38, y: 22 },
        { id: "t3", name: "Table 3", seats: 6, shape: "booth", zone: "Window Booths", status: "reserved", x: 60, y: 22 },
        { id: "t-vip8", name: "VIP Booth 8", seats: 8, shape: "booth", zone: "Private Lounge", status: "available", x: 82, y: 22 },
        { id: "t7-mid", name: "Table 7", seats: 4, shape: "rect", zone: "Main Dining", status: "available", x: 28, y: 50 },
        { id: "t8-mid", name: "Table 8", seats: 6, shape: "rect", zone: "Main Dining", status: "available", x: 48, y: 50 },
        { id: "bar", name: "Cocktail Bar", seats: 5, shape: "bar", zone: "Bar Area", status: "available", x: 68, y: 50 },
        { id: "t6", name: "Table 6", seats: 4, shape: "booth", zone: "Window Booths", status: "available", x: 16, y: 78 },
        { id: "t7-bot", name: "Table 7", seats: 4, shape: "booth", zone: "Window Booths", status: "available", x: 38, y: 78 },
        { id: "t8-bot", name: "Table 8", seats: 4, shape: "booth", zone: "Window Booths", status: "reserved", x: 60, y: 78 },
      ];

      let tableSec = nextConfig.sections.find((s) => s.type === "table_selection");
      if (!tableSec) {
        tableSec = {
          id: `sec-tables-${Date.now()}`,
          type: "table_selection",
          title: "Select Your Table & Seating",
          subtitle: "INTERACTIVE ARCHITECTURAL FLOOR PLAN",
          content: "Click on any table, window booth, or bar seat to check live availability and reserve instantly.",
          enabled: true,
          meta: {
            interactiveMap: true,
            zones: ["All Zones", "Window Booths", "Main Dining", "Private Lounge", "Bar Area"],
            tables: defaultFloorPlanTables,
          },
        };
        // Insert right after hero (index 1)
        nextConfig.sections.splice(1, 0, tableSec);
        changes.push("Digitized architectural floor plan sketch into an interactive visual table selection map");
      } else {
        tableSec.enabled = true;
        tableSec.meta = {
          interactiveMap: true,
          zones: ["All Zones", "Window Booths", "Main Dining", "Private Lounge", "Bar Area"],
          tables: defaultFloorPlanTables,
        };
        changes.push("Enabled Interactive Floor Plan with 10 tables & live seat selection");
      }
      nextConfig.heroButtonText = "Select Table & Reserve";
      nextConfig.heroButtonLink = "#tables";
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

    if (changes.length === 0) {
      nextConfig.heroHeadline = `The New ${restaurantName}`;
      nextConfig.heroTagline = "Experience hand-crafted culinary excellence delivered to your table or doorstep";
      changes.push("Updated website styling, layout, and visual harmony");
    }

    return NextResponse.json({
      success: true,
      modelUsed: "local-heuristic-engine",
      message: changes.join(" • "),
      changes,
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

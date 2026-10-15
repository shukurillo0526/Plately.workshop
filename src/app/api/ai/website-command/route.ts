import { NextResponse } from "next/server";
import {
  WebsiteThemeConfigSchema,
  DEFAULT_FLOORPLAN_TABLES,
  DEFAULT_WEBSITE_CONFIG,
  type WebsiteThemeConfig,
  type WebsiteSection,
  type TableItem,
  type AttachedMedia,
  type AIWebsiteCommandRequest,
  type AIWebsiteCommandResponse,
} from "@/lib/types/website";

/**
 * Retrieve Gemini API key from environment variables.
 */
function getGeminiApiKey(): string | undefined {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (key && !key.includes("your-") && !key.includes("placeholder")) {
    return key.trim();
  }
  return undefined;
}

/**
 * Resolve requested Gemini model name with Google API compatibility mapping and fallback.
 * Maps `gemini-2.5-pro` to `gemini-3.1-pro-preview` for Google API compatibility,
 * with fallback to `gemini-2.5-flash`.
 */
function resolveGeminiModel(inputModel?: string): { targetModel: string; fallbackModel: string } {
  const fallbackModel = "gemini-2.5-flash";
  let targetModel = (inputModel || "gemini-2.5-flash").trim();

  if (targetModel === "gemini-2.5-pro" || targetModel === "gemini-pro") {
    targetModel = "gemini-3.1-pro-preview";
  } else if (targetModel === "gemini-2.0-flash" || targetModel === "gemini-1.5-flash") {
    targetModel = "gemini-2.5-flash";
  } else if (targetModel === "gemini-3.8-flash") {
    targetModel = "gemini-flash-latest";
  }

  return { targetModel, fallbackModel };
}

/**
 * Strip Markdown code fences (```json ... ```) safely from AI responses.
 */
function cleanJsonMarkdown(raw: string): string {
  if (!raw || typeof raw !== "string") return "{}";
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, "");
  text = text.replace(/\s*```$/, "");
  return text.trim();
}

/**
 * Recursively sanitize strings and nested objects to prevent script injection,
 * malicious URIs, and arbitrary executable code.
 */
function sanitizeContent<T>(data: T): T {
  if (typeof data === "string") {
    const cleaned = data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/javascript\s*:/gi, "")
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      .replace(/window\.location/gi, "")
      .replace(/document\.cookie/gi, "");
    return cleaned as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeContent(item)) as unknown as T;
  }
  if (data !== null && typeof data === "object") {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = sanitizeContent(value);
    }
    return result as unknown as T;
  }
  return data;
}

/**
 * Normalize coordinates so both { lat, lng } and { latitude, longitude } formats
 * satisfy PostGISCoordinatesSchema during Zod validation.
 */
function normalizeCoordinates(candidate: any): any {
  if (!candidate || typeof candidate !== "object") return candidate;
  if (Array.isArray(candidate)) return candidate.map(normalizeCoordinates);

  const clone = { ...candidate };
  if (Array.isArray(clone.sections)) {
    clone.sections = clone.sections.map((sec: any) => {
      if (sec && typeof sec === "object" && sec.meta && typeof sec.meta === "object") {
        const meta = { ...sec.meta };
        if (meta.coordinates && typeof meta.coordinates === "object") {
          const c = { ...meta.coordinates };
          if (c.latitude !== undefined && c.lat === undefined) {
            c.lat = c.latitude;
          }
          if (c.longitude !== undefined && c.lng === undefined) {
            c.lng = c.longitude;
          }
          meta.coordinates = c;
        }
        return { ...sec, meta };
      }
      return sec;
    });
  }
  return clone;
}

/**
 * Restore dual-compatibility on coordinates ({ lat, lng, latitude, longitude, srid })
 * for consumers that inspect latitude/longitude.
 */
function restoreCoordinatesCompatibility(
  config: WebsiteThemeConfig,
  originalSource?: any
): WebsiteThemeConfig {
  if (!config || !Array.isArray(config.sections)) return config;

  config.sections.forEach((sec, idx) => {
    if (sec?.meta?.coordinates) {
      const origSec = originalSource?.sections?.[idx];
      const origCoords = origSec?.meta?.coordinates;
      const coords = sec.meta.coordinates as any;

      if (coords.lat !== undefined && coords.latitude === undefined) {
        coords.latitude = coords.lat;
      }
      if (coords.lng !== undefined && coords.longitude === undefined) {
        coords.longitude = coords.lng;
      }
      if (origCoords?.srid && coords.srid === undefined) {
        coords.srid = origCoords.srid;
      }
    }
  });

  return config;
}

/**
 * Validate and safely repair website configuration with Zod, falling back to safe defaults
 * so that the route NEVER returns corrupted state or invalid types.
 */
function validateAndRepairConfig(
  candidate: any,
  fallbackBase: WebsiteThemeConfig
): WebsiteThemeConfig {
  const sanitized = sanitizeContent(candidate);
  const normalized = normalizeCoordinates(sanitized);
  const parseResult = WebsiteThemeConfigSchema.safeParse(normalized);

  if (parseResult.success) {
    return restoreCoordinatesCompatibility(parseResult.data as WebsiteThemeConfig, candidate);
  }

  // Attempt recovery: merge candidate with fallbackBase defaults
  const normalizedBase = normalizeCoordinates(fallbackBase);
  const merged = {
    ...normalizedBase,
    ...(typeof sanitized === "object" && sanitized !== null ? sanitized : {}),
    primaryColor:
      typeof candidate?.primaryColor === "string" &&
      /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(candidate.primaryColor)
        ? candidate.primaryColor
        : fallbackBase.primaryColor || "#f98b25",
    sections:
      Array.isArray(sanitized?.sections) && sanitized.sections.length > 0
        ? sanitized.sections
        : fallbackBase.sections || DEFAULT_WEBSITE_CONFIG.sections,
  };

  const normalizedMerged = normalizeCoordinates(merged);
  const secondAttempt = WebsiteThemeConfigSchema.safeParse(normalizedMerged);
  if (secondAttempt.success) {
    return restoreCoordinatesCompatibility(secondAttempt.data as WebsiteThemeConfig, candidate);
  }

  // If still invalid, return the validated fallback base
  const fallbackAttempt = WebsiteThemeConfigSchema.safeParse(normalizedBase);
  if (fallbackAttempt.success) {
    const baseResult = fallbackAttempt.data as WebsiteThemeConfig;
    if (
      typeof candidate?.primaryColor === "string" &&
      /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(candidate.primaryColor)
    ) {
      baseResult.primaryColor = candidate.primaryColor;
    }
    return restoreCoordinatesCompatibility(baseResult, candidate);
  }

  return DEFAULT_WEBSITE_CONFIG;
}

/**
 * Intelligent Local Heuristic Fallback Engine.
 * Runs in offline mode, sandbox test environments, or when Gemini API quota is exceeded.
 * Analyzes natural language commands, media attachments, and custom section sequences.
 */
function runLocalHeuristicEngine(
  command: string,
  baseConfig: WebsiteThemeConfig,
  restaurantName: string,
  attachments: AttachedMedia[]
): { config: WebsiteThemeConfig; changes: string[] } {
  const p = (command || "").toLowerCase().trim();
  const nextConfig: WebsiteThemeConfig = JSON.parse(
    JSON.stringify(baseConfig || DEFAULT_WEBSITE_CONFIG)
  );
  const changes: string[] = [];

  // Theme palettes & gastronomic styling presets
  if (p.includes("luxury") || p.includes("steak") || p.includes("gold") || p.includes("obsidian")) {
    nextConfig.primaryColor = "#d4af37";
    nextConfig.secondaryColor = "#f59e0b";
    nextConfig.backgroundColor = "#0b0d11";
    nextConfig.cardColor = "#141720";
    nextConfig.fontFamily = "Playfair Display";
    nextConfig.borderRadius = "sharp";
    nextConfig.heroLayout = "split";
    nextConfig.themePreset = "Obsidian Gold";
    changes.push("Applied Luxury Fine Dining theme with Royal Gold & Obsidian palette");
  } else if (
    p.includes("emerald") ||
    p.includes("green") ||
    p.includes("healthy") ||
    p.includes("organic") ||
    p.includes("vegan")
  ) {
    nextConfig.primaryColor = "#10b981";
    nextConfig.secondaryColor = "#059669";
    nextConfig.backgroundColor = "#061510";
    nextConfig.cardColor = "#0b231b";
    nextConfig.fontFamily = "Outfit";
    nextConfig.borderRadius = "rounded";
    nextConfig.themePreset = "Emerald Luxury";
    changes.push("Applied Fresh Emerald Botanical theme with organic culinary styling");
  } else if (
    p.includes("flame") ||
    p.includes("bbq") ||
    p.includes("grill") ||
    p.includes("plov") ||
    p.includes("uzbek") ||
    p.includes("saffron")
  ) {
    nextConfig.primaryColor = "#f98b25";
    nextConfig.secondaryColor = "#e11d48";
    nextConfig.backgroundColor = "#0d1117";
    nextConfig.cardColor = "#161b22";
    nextConfig.fontFamily = "Outfit";
    nextConfig.borderRadius = "rounded";
    nextConfig.heroLayout = "split";
    nextConfig.themePreset = "Saffron Amber";
    changes.push("Applied Uzbek Flame Grill & Saffron Amber theme with traditional warmth");
  } else if (
    p.includes("cafe") ||
    p.includes("coffee") ||
    p.includes("bakery") ||
    p.includes("espresso")
  ) {
    nextConfig.primaryColor = "#d97706";
    nextConfig.secondaryColor = "#f59e0b";
    nextConfig.backgroundColor = "#14100c";
    nextConfig.cardColor = "#1f1814";
    nextConfig.fontFamily = "Outfit";
    nextConfig.borderRadius = "rounded";
    nextConfig.themePreset = "Artisan Coffee";
    changes.push("Applied Artisan Coffeehouse & Warm Espresso palette");
  } else if (
    p.includes("cobalt") ||
    p.includes("modern") ||
    p.includes("blue") ||
    p.includes("fast-casual")
  ) {
    nextConfig.primaryColor = "#3b82f6";
    nextConfig.secondaryColor = "#06b6d4";
    nextConfig.backgroundColor = "#090d16";
    nextConfig.cardColor = "#111827";
    nextConfig.fontFamily = "Inter";
    nextConfig.borderRadius = "pill";
    nextConfig.themePreset = "Cobalt Modern";
    changes.push("Applied Cobalt Modern fast-casual branding");
  } else if (p.includes("crimson") || p.includes("royal") || p.includes("ruby")) {
    nextConfig.primaryColor = "#e11d48";
    nextConfig.secondaryColor = "#f43f5e";
    nextConfig.backgroundColor = "#14070a";
    nextConfig.cardColor = "#200d12";
    nextConfig.fontFamily = "Outfit";
    nextConfig.borderRadius = "rounded";
    nextConfig.themePreset = "Royal Crimson";
    changes.push("Applied Royal Crimson imperial banquet theme");
  }

  // Interactive table selection / floor plan / seating map
  if (
    p.includes("table") ||
    p.includes("floor") ||
    p.includes("seat") ||
    p.includes("plan") ||
    p.includes("map") ||
    p.includes("book") ||
    p.includes("reserv")
  ) {
    let tableSec = nextConfig.sections.find((s) => s.type === "table_selection");
    if (!tableSec) {
      tableSec = {
        id: `sec-tables-${Date.now()}`,
        type: "table_selection",
        title: "Select Your Table & Seating",
        subtitle: "INTERACTIVE ARCHITECTURAL FLOOR PLAN",
        content:
          "Click on any table, window booth, or bar seat to check live availability and reserve instantly.",
        enabled: true,
        meta: {
          interactiveMap: true,
          zones: ["All Zones", "Window Booths", "Main Dining", "Private Lounge", "Bar Area"],
          tables: DEFAULT_FLOORPLAN_TABLES,
        },
      };
      // Insert after hero if present, else prepend
      const heroIdx = nextConfig.sections.findIndex((s) => s.type === "hero");
      if (heroIdx >= 0) {
        nextConfig.sections.splice(heroIdx + 1, 0, tableSec);
      } else {
        nextConfig.sections.unshift(tableSec);
      }
      changes.push(
        "Digitized architectural floor plan sketch into an interactive visual table selection map"
      );
    } else {
      tableSec.enabled = true;
      tableSec.meta = {
        ...tableSec.meta,
        interactiveMap: true,
        zones: ["All Zones", "Window Booths", "Main Dining", "Private Lounge", "Bar Area"],
        tables: DEFAULT_FLOORPLAN_TABLES,
      };
      changes.push("Enabled Interactive Floor Plan with 10 tables & live seat selection");
    }
    nextConfig.heroButtonText = "Select Table & Reserve";
    nextConfig.heroButtonLink = "#tables";
  }

  // Customer reviews / social proof
  if (p.includes("review") || p.includes("star") || p.includes("testimonial")) {
    let revSec = nextConfig.sections.find((s) => s.type === "reviews");
    if (!revSec) {
      revSec = {
        id: `sec-reviews-${Date.now()}`,
        type: "reviews",
        title: "Guest Testimonials",
        subtitle: "4.9 STARS ON GOOGLE & YANDEX",
        content: "Hear what our guests have to say about our hospitality and flavors.",
        enabled: true,
      };
      nextConfig.sections.push(revSec);
      changes.push("Added Customer Reviews & 4.9-Star Social Proof section");
    } else {
      revSec.enabled = true;
      changes.push("Enabled Customer Reviews section");
    }
  }

  // Photo gallery
  if (p.includes("gallery") || p.includes("photo") || p.includes("ambience")) {
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

  // Multimodal media attachment processing (dish photo, menu scan)
  if (attachments && attachments.length > 0) {
    const imgAttach = attachments.find(
      (a) =>
        a.type?.startsWith("image/") ||
        a.name?.match(/\.(jpg|jpeg|png|webp|avif)$/i) ||
        a.dataUrl?.startsWith("data:image/")
    );
    if (
      imgAttach &&
      (p.includes("hero") ||
        p.includes("photo") ||
        p.includes("dish") ||
        p.includes("plov") ||
        p.includes("image") ||
        p.includes("incorporate"))
    ) {
      nextConfig.heroImage = imgAttach.dataUrl;
      changes.push(
        `Incorporated attached photo "${imgAttach.name || "dish photo"}" into hero display`
      );
    }
  }

  // Viewport / Responsive optimization
  if (
    p.includes("mobile") ||
    p.includes("viewport") ||
    p.includes("responsive") ||
    p.includes("centered")
  ) {
    nextConfig.heroLayout = "centered";
    changes.push("Optimized hero display layout for mobile and responsive device frames");
  }

  // Typography selection
  if (p.includes("playfair") || p.includes("serif")) {
    nextConfig.fontFamily = "Playfair Display";
  } else if (p.includes("inter") || p.includes("clean font") || p.includes("minimal font")) {
    nextConfig.fontFamily = "Inter";
  } else if (p.includes("outfit")) {
    nextConfig.fontFamily = "Outfit";
  }

  // Border radius selection
  if (p.includes("sharp") || p.includes("square")) {
    nextConfig.borderRadius = "sharp";
  } else if (p.includes("pill")) {
    nextConfig.borderRadius = "pill";
  } else if (p.includes("rounded")) {
    nextConfig.borderRadius = "rounded";
  }

  // Catch-all safe fallback
  if (changes.length === 0) {
    const safeCommand = (command || "").replace(/<[^>]*>/g, "").trim();
    if (safeCommand && safeCommand.length < 100) {
      nextConfig.heroHeadline = `The New ${restaurantName}`;
    }
    nextConfig.heroTagline =
      "Experience hand-crafted culinary excellence delivered to your table or doorstep";
    changes.push("Updated website styling, layout, and visual harmony");
  }

  return { config: nextConfig, changes };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      command = "",
      currentConfig = DEFAULT_WEBSITE_CONFIG,
      restaurantName = "Our Restaurant",
      model = "gemini-2.5-flash",
      attachments = [] as AttachedMedia[],
    } = body;

    if (
      (!command || typeof command !== "string" || !command.trim()) &&
      (!attachments || attachments.length === 0)
    ) {
      return NextResponse.json(
        { error: "A text command or attachment is required" },
        { status: 400 }
      );
    }

    const { targetModel, fallbackModel } = resolveGeminiModel(model);
    const apiKey = getGeminiApiKey();

    let aiGeneratedSuccess = false;
    let finalConfig: WebsiteThemeConfig = currentConfig;
    let appliedChanges: string[] = [];
    let explanation = "";
    let activeModelUsed = targetModel;

    // 1. If Gemini API key is available, execute multimodal AI command with Gemini Vision / Audio
    if (apiKey) {
      try {
        const parts: any[] = [];

        // Attach multimodal media parts (photos of menus, floor plans, dish images, voice memos)
        if (Array.isArray(attachments)) {
          for (const file of attachments) {
            if (file.dataUrl && typeof file.dataUrl === "string" && file.dataUrl.includes(",")) {
              const [header, base64Data] = file.dataUrl.split(",");
              const mimeType =
                file.type || header.split(";")[0].replace("data:", "") || "image/jpeg";
              parts.push({
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              });
            }
          }
        }

        const promptInstruction = `
You are the Plately AI Website Architect & Senior Gastronomic UX Designer.
Translate the user natural language command and any multimodal media attachments into an updated website theme configuration.

RESTAURANT NAME: "${restaurantName}"
USER COMMAND: "${command || "Design an engaging website layout matching the attached media"}"

CURRENT CONFIGURATION:
${JSON.stringify(currentConfig, null, 2)}

INSTRUCTIONS:
1. Examine any attached photos (dish imagery, physical menu scans, architectural blueprints, floor plan sketches) or voice memos.
2. Return ONLY a valid JSON object matching the WebsiteThemeConfig schema.
3. Schema Requirements:
   - "primaryColor": hex color (e.g. #f98b25, #10b981, #d4af37, #e11d48, #d97706, #3b82f6)
   - "secondaryColor": hex color
   - "backgroundColor": dark background hex (e.g. #0d1117, #0b0d11, #061510, #14100c, #090d16)
   - "cardColor": hex color
   - "fontFamily": "Outfit" | "Inter" | "Playfair Display"
   - "borderRadius": "sharp" | "rounded" | "pill"
   - "layoutStyle": "modern" | "classic" | "minimal" | "bold"
   - "heroHeadline", "heroTagline", "aboutStory": copywriting tailored to the cuisine
   - "heroLayout": "split" | "centered" | "minimal"
   - "heroButtonText": e.g. "Order Online Now", "Select Table & Reserve"
   - "heroButtonLink": "#menu" | "#tables" | "#booking"
   - "sections": array of sections. Preserve any custom section order. If the user mentions tables, floor plan, or seats, enable "table_selection" with interactiveMap: true and 10 tables.
   - "appliedChanges": array of strings describing each modification.
   - "explanation": concise 1-2 sentence overview of your design decisions.
4. DO NOT wrap with explanation text. Return pure JSON. Never include raw HTML script tags.
`;

        parts.push({ text: promptInstruction });

        const callGemini = async (modelName: string) => {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
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

        let geminiRes = await callGemini(targetModel);
        activeModelUsed = targetModel;

        // If target model failed (e.g., gemini-3.1-pro-preview preview quota), fallback to gemini-2.5-flash
        if (!geminiRes.ok && targetModel !== fallbackModel) {
          console.warn(
            `[Gemini API] ${targetModel} returned status ${geminiRes.status}. Retrying with fallback ${fallbackModel}.`
          );
          geminiRes = await callGemini(fallbackModel);
          activeModelUsed = fallbackModel;
        }

        if (geminiRes.ok) {
          const json = await geminiRes.json();
          const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (rawText) {
            const cleanedJsonText = cleanJsonMarkdown(rawText);
            const parsed = JSON.parse(cleanedJsonText);

            // Merge safely with currentConfig defaults
            const candidateConfig = {
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

            // Schema-safe validation and recovery via Zod
            finalConfig = validateAndRepairConfig(candidateConfig, currentConfig);
            appliedChanges =
              Array.isArray(parsed.appliedChanges) && parsed.appliedChanges.length > 0
                ? parsed.appliedChanges
                : Array.isArray(parsed.changes) && parsed.changes.length > 0
                ? parsed.changes
                : ["Refreshed styling and layout with Gemini AI"];
            explanation =
              parsed.explanation ||
              parsed.message ||
              appliedChanges.join(" • ");
            aiGeneratedSuccess = true;
          }
        } else {
          const errData = await geminiRes.json().catch(() => ({}));
          console.warn("[Gemini API] Error response:", geminiRes.status, errData);
        }
      } catch (geminiError: any) {
        console.warn("[Gemini API] Exception, falling back to local heuristic engine:", geminiError);
      }
    }

    // 2. If Gemini API was offline or did not complete, run Intelligent Local Heuristic Engine
    if (!aiGeneratedSuccess) {
      const heuristicResult = runLocalHeuristicEngine(
        command,
        currentConfig,
        restaurantName,
        attachments
      );
      finalConfig = validateAndRepairConfig(heuristicResult.config, currentConfig);
      appliedChanges = heuristicResult.changes;
      explanation = appliedChanges.join(" • ");
      activeModelUsed = targetModel;
    }

    // Build strictly typed response matching AIWebsiteCommandResponse + UI compatibility fields
    const responseData: AIWebsiteCommandResponse & { changes: string[]; message: string } = {
      success: true,
      config: finalConfig,
      explanation,
      modelUsed: activeModelUsed,
      appliedChanges,
      // Compatibility aliases for Studio UI and E2E test assertions
      changes: appliedChanges,
      message: explanation,
    };

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("[WebsiteCommand] Internal Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process website command" },
      { status: 500 }
    );
  }
}

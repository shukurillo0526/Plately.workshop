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
  textColor?: string;
  cardColor?: string;
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { command, currentConfig, restaurantName = "Our Restaurant" } = body;

    if (!command || typeof command !== "string") {
      return NextResponse.json(
        { error: "Natural language command is required" },
        { status: 400 }
      );
    }

    const p = command.toLowerCase().trim();
    const nextConfig: WebsiteThemeConfig = JSON.parse(JSON.stringify(currentConfig));
    const changes: string[] = [];

    // 1. Color and Theme Archetypes
    if (p.includes("luxury") || p.includes("steak") || p.includes("fine dining") || p.includes("exclusive") || p.includes("gold") || p.includes("obsidian")) {
      nextConfig.primaryColor = "#d4af37"; // Elegant Gold
      nextConfig.secondaryColor = "#10b981";
      nextConfig.backgroundColor = "#0b0d11";
      nextConfig.cardColor = "#13171f";
      nextConfig.fontFamily = "Playfair Display";
      nextConfig.heroLayout = "split";
      changes.push("Applied Luxury Fine Dining theme with Royal Gold & Obsidian palette");
    } else if (p.includes("emerald") || p.includes("green") || p.includes("healthy") || p.includes("organic") || p.includes("salad") || p.includes("vegan")) {
      nextConfig.primaryColor = "#10b981"; // Emerald
      nextConfig.secondaryColor = "#059669";
      nextConfig.backgroundColor = "#061510";
      nextConfig.cardColor = "#0b231b";
      nextConfig.fontFamily = "Outfit";
      changes.push("Applied Fresh Emerald Botanical theme with organic culinary styling");
    } else if (p.includes("flame") || p.includes("bbq") || p.includes("grill") || p.includes("shashlik") || p.includes("plov") || p.includes("uzbek") || p.includes("fire")) {
      nextConfig.primaryColor = "#f98b25"; // Warm Saffron Amber
      nextConfig.secondaryColor = "#e11d48";
      nextConfig.backgroundColor = "#0d1117";
      nextConfig.cardColor = "#161b22";
      nextConfig.fontFamily = "Outfit";
      nextConfig.heroLayout = "split";
      changes.push("Applied Uzbek Flame Grill & Saffron Amber theme with traditional warmth");
    } else if (p.includes("cafe") || p.includes("coffee") || p.includes("bakery") || p.includes("pastry") || p.includes("dessert") || p.includes("cozy")) {
      nextConfig.primaryColor = "#d97706"; // Warm Caramel / Espresso
      nextConfig.secondaryColor = "#f59e0b";
      nextConfig.backgroundColor = "#14100c";
      nextConfig.cardColor = "#1e1814";
      nextConfig.fontFamily = "Outfit";
      changes.push("Applied Artisan Coffeehouse & Warm Espresso palette");
    } else if (p.includes("pizza") || p.includes("burger") || p.includes("fast") || p.includes("qsr") || p.includes("street")) {
      nextConfig.primaryColor = "#ef4444"; // Energetic Red
      nextConfig.secondaryColor = "#f59e0b";
      nextConfig.backgroundColor = "#0f172a";
      nextConfig.cardColor = "#1e293b";
      nextConfig.fontFamily = "Inter";
      changes.push("Applied High-Energy Fast-Casual Red & Amber theme");
    } else if (p.includes("blue") || p.includes("modern") || p.includes("minimal") || p.includes("clean") || p.includes("seafood")) {
      nextConfig.primaryColor = "#3b82f6"; // Cobalt Blue
      nextConfig.secondaryColor = "#06b6d4";
      nextConfig.backgroundColor = "#090d16";
      nextConfig.cardColor = "#111827";
      nextConfig.fontFamily = "Inter";
      changes.push("Applied Clean Modernist Cobalt Blue & Slate styling");
    }

    // Direct color tweaks
    if (p.includes("amber") || p.includes("orange")) {
      nextConfig.primaryColor = "#f98b25";
      changes.push("Switched primary accent to Saffron Amber (#f98b25)");
    } else if (p.includes("ruby") || p.includes("crimson") || p.includes("red")) {
      nextConfig.primaryColor = "#e11d48";
      changes.push("Switched primary accent to Crimson Ruby (#e11d48)");
    } else if (p.includes("purple") || p.includes("violet")) {
      nextConfig.primaryColor = "#8b5cf6";
      changes.push("Switched primary accent to Royal Violet (#8b5cf6)");
    }

    // Direct font tweaks
    if (p.includes("serif") || p.includes("playfair") || p.includes("classical") || p.includes("elegant font")) {
      nextConfig.fontFamily = "Playfair Display";
      changes.push("Updated typography pairing to Elegant Editorial Serif (Playfair Display)");
    } else if (p.includes("sans") || p.includes("modern font") || p.includes("clean font") || p.includes("inter")) {
      nextConfig.fontFamily = "Inter";
      changes.push("Updated typography pairing to Precision Modern Sans (Inter)");
    }

    // Hero Layout tweaks
    if (p.includes("split") || p.includes("side by side") || p.includes("showcase photo")) {
      nextConfig.heroLayout = "split";
      changes.push("Set Hero section layout to Split Showcase with food imagery");
    } else if (p.includes("centered") || p.includes("center")) {
      nextConfig.heroLayout = "centered";
      changes.push("Centered the Hero title, copy and call-to-action buttons");
    } else if (p.includes("minimal hero")) {
      nextConfig.heroLayout = "minimal";
      changes.push("Simplified Hero into minimal typography banner");
    }

    // Section Management: Table Booking
    if (p.includes("book") || p.includes("reserv") || p.includes("table")) {
      let bookingSec = nextConfig.sections.find((s) => s.type === "booking");
      if (!bookingSec) {
        bookingSec = {
          id: `sec-booking-${Date.now()}`,
          type: "booking",
          title: "Reserve a Table",
          subtitle: "Dine in luxury with friends and family",
          content: "Book your preferred date, time, and table seating in seconds with instant confirmation.",
          enabled: true,
        };
        // Place right after highlights or hero
        const insertIdx = Math.min(nextConfig.sections.length, 2);
        nextConfig.sections.splice(insertIdx, 0, bookingSec);
        changes.push("Added interactive Table Reservation & Booking module");
      } else {
        bookingSec.enabled = true;
        changes.push("Enabled Table Reservation module");
      }
      nextConfig.heroButtonText = "Reserve a Table";
      nextConfig.heroButtonLink = "#booking";
    }

    // Section Management: Reviews / Testimonials
    if (p.includes("review") || p.includes("testimonial") || p.includes("star") || p.includes("feedback")) {
      let reviewSec = nextConfig.sections.find((s) => s.type === "reviews");
      if (!reviewSec) {
        reviewSec = {
          id: `sec-reviews-${Date.now()}`,
          type: "reviews",
          title: "Guest Testimonials",
          subtitle: "Rated 4.9 Stars on Google & Yandex Maps",
          content: "Join over 12,000 happy food enthusiasts who savor our dishes every week.",
          enabled: true,
        };
        nextConfig.sections.push(reviewSec);
        changes.push("Added Customer Reviews & 4.9-Star Social Proof section");
      } else {
        reviewSec.enabled = true;
        changes.push("Enabled Customer Reviews section");
      }
    }

    // Section Management: Photo Gallery
    if (p.includes("gallery") || p.includes("photo") || p.includes("instagram") || p.includes("picture")) {
      let galSec = nextConfig.sections.find((s) => s.type === "gallery");
      if (!galSec) {
        galSec = {
          id: `sec-gallery-${Date.now()}`,
          type: "gallery",
          title: "Culinary Gallery & Moments",
          subtitle: "A glimpse behind the kitchen flames and warm dining hall",
          content: "Experience the vibrant ambiance, handcrafted dishes, and culinary mastery.",
          enabled: true,
        };
        nextConfig.sections.push(galSec);
        changes.push("Added Culinary Photo & Atmosphere Gallery");
      } else {
        galSec.enabled = true;
        changes.push("Enabled Photo Gallery section");
      }
    }

    // Section Management: FAQ
    if (p.includes("faq") || p.includes("question") || p.includes("halal") || p.includes("delivery policy")) {
      let faqSec = nextConfig.sections.find((s) => s.type === "faq");
      if (!faqSec) {
        faqSec = {
          id: `sec-faq-${Date.now()}`,
          type: "faq",
          title: "Frequently Asked Questions",
          subtitle: "Everything you need to know before dining or ordering",
          content: "100% Halal certified meat • 35-minute delivery radius • Private dining rooms available upon request.",
          enabled: true,
        };
        nextConfig.sections.push(faqSec);
        changes.push("Added FAQ Accordion with Halal & Delivery details");
      } else {
        faqSec.enabled = true;
        changes.push("Enabled FAQ section");
      }
    }

    // Section Management: Announcement Bar
    if (p.includes("announcement") || p.includes("discount") || p.includes("promo") || p.includes("ramadan") || p.includes("navruz") || p.includes("special")) {
      let annSec = nextConfig.sections.find((s) => s.type === "announcement");
      let msg = "⚡ Fast delivery in under 35 minutes across Tashkent • Free delivery on orders over 100,000 UZS";
      if (p.includes("ramadan") || p.includes("iftar")) {
        msg = "🌙 Special Iftar Sets & Family Sharing Platters now available for pre-order!";
      } else if (p.includes("discount") || p.includes("off") || p.includes("promo")) {
        msg = "🔥 Limited Time: 15% OFF your first direct order with code PLATELY15!";
      }
      nextConfig.deliveryNotice = msg;
      if (!annSec) {
        annSec = {
          id: `sec-announcement-${Date.now()}`,
          type: "announcement",
          title: "Top Announcement Bar",
          content: msg,
          enabled: true,
        };
        nextConfig.sections.unshift(annSec);
      } else {
        annSec.enabled = true;
        annSec.content = msg;
      }
      changes.push(`Updated Top Announcement banner: "${msg}"`);
    }

    // Copywriting tweaks based on keywords
    if (p.includes("plov") || p.includes("pilaf") || p.includes("wedding plov")) {
      nextConfig.heroHeadline = `Authentic Samarkand Feast at ${restaurantName}`;
      nextConfig.heroTagline = "Slow-cooked for 4 hours with tender marbled beef, golden carrots, and roasted mountain cumin";
      nextConfig.aboutStory = `At ${restaurantName}, every cauldron of plov is honored with centuries-old Central Asian culinary traditions. We source only grain-fed Halal beef, organic sweet carrots, and fragrant spices for an unmatched gastronomic journey.`;
      changes.push("Crafted signature Plov & Heritage storytelling copy");
    } else if (p.includes("steak") || p.includes("meat") || p.includes("shashlik") || p.includes("kebab")) {
      nextConfig.heroHeadline = `Master Charcoal Grill & Steaks at ${restaurantName}`;
      nextConfig.heroTagline = "Tender lamb skewers and prime dry-aged steaks flame-broiled over natural applewood charcoal";
      changes.push("Crafted Charcoal Grill & Prime Meat hero copy");
    } else if (p.includes("cozy") || p.includes("bakery") || p.includes("breakfast")) {
      nextConfig.heroHeadline = `Artisan Bakes & Morning Warmth at ${restaurantName}`;
      nextConfig.heroTagline = "Fresh sourdough, flaky clay-oven pastries, and specialty roasted espresso";
      changes.push("Crafted Artisan Bakery & Morning Café copy");
    } else if (changes.length === 0) {
      // General enhancement
      nextConfig.heroHeadline = `Welcome to the New ${restaurantName}`;
      nextConfig.heroTagline = "Experience hand-crafted culinary excellence delivered to your table or doorstep";
      changes.push("Refreshed hero branding, typography, and visual harmony");
    }

    return NextResponse.json({
      success: true,
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

import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// Plately Workshop — Website Studio & Storefront Data Contracts
// ═══════════════════════════════════════════════════════════════

/**
 * Viewport device mode in the live split-pane studio preview.
 */
export type DeviceMode = "desktop" | "tablet" | "mobile";

export const DeviceModeSchema = z.enum(["desktop", "tablet", "mobile"]);

/**
 * Supported section types for modular restaurant websites.
 */
export type SectionType =
  | "announcement"
  | "hero"
  | "about"
  | "menu"
  | "menu_showcase"
  | "highlights"
  | "chef_highlights"
  | "booking"
  | "table_selection"
  | "reviews"
  | "hours_location"
  | "gallery"
  | "faq"
  | "cta"
  | "custom_widget";

export const SectionTypeSchema = z.enum([
  "announcement",
  "hero",
  "about",
  "menu",
  "menu_showcase",
  "highlights",
  "chef_highlights",
  "booking",
  "table_selection",
  "reviews",
  "hours_location",
  "gallery",
  "faq",
  "cta",
  "custom_widget",
]);

/**
 * Interactive dining floor plan table item for real-time seating visualization.
 */
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

export const TableItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  seats: z.number().int().positive(),
  shape: z.enum(["rect", "round", "booth", "bar"]),
  zone: z.string(),
  status: z.enum(["available", "reserved", "selected"]),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().optional(),
  height: z.number().optional(),
});

/**
 * Dish showcase item within the interactive menu showcase block.
 */
export interface MenuShowcaseItem {
  id: string;
  name: string;
  desc?: string;
  description?: string;
  price: number; // In UZS integer
  category: string;
  image?: string;
  imageUrl?: string;
  tag?: string;
  dietary?: string[];
  prepTime?: number; // In minutes
  isAvailable?: boolean;
}

export type MenuItemShowcase = MenuShowcaseItem;

export const MenuShowcaseItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  desc: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0),
  category: z.string(),
  image: z.string().optional(),
  imageUrl: z.string().optional(),
  tag: z.string().optional(),
  dietary: z.array(z.string()).optional(),
  prepTime: z.number().optional(),
  isAvailable: z.boolean().optional(),
});

/**
 * Geographic coordinates compatible with Supabase PostGIS geography(POINT).
 */
export interface PostGISCoordinates {
  lat: number;
  lng: number;
  type?: "Point";
  coordinates?: [number, number]; // [lng, lat] GeoJSON format
}

export const PostGISCoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  type: z.literal("Point").optional(),
  coordinates: z.tuple([z.number(), z.number()]).optional(),
});

/**
 * PostGIS GeoJSON representation.
 */
export interface PostGISLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export const PostGISLocationSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([z.number(), z.number()]),
});

/**
 * Media attachment uploaded or pasted into the AI command bar.
 */
export interface AttachedMedia {
  name: string;
  type: string;
  dataUrl: string; // Base64 data URL
  size?: number;
}

export const AttachedMediaSchema = z.object({
  name: z.string(),
  type: z.string(),
  dataUrl: z.string(),
  size: z.number().optional(),
});

/**
 * Rich metadata attached to modular website sections.
 */
export interface WebsiteSectionMeta {
  buttonText?: string;
  buttonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  imageUrl?: string;
  layout?: "centered" | "split" | "minimal";
  badge?: string;
  features?: string[];
  stats?: Array<{ label: string; value: string }>;
  interactiveMap?: boolean;
  zones?: string[];
  tables?: TableItem[];
  timeSlots?: string[];
  categories?: string[];
  showSearch?: boolean;
  items?: Array<
    | MenuShowcaseItem
    | {
        title: string;
        desc?: string;
        description?: string;
        price?: number;
        image?: string;
        imageUrl?: string;
        tag?: string;
        rating?: number;
        [key: string]: any;
      }
  >;
  chefName?: string;
  chefTitle?: string;
  chefImage?: string;
  quote?: string;
  specialties?: string[];
  experienceYears?: number;
  branchName?: string;
  address?: string;
  phone?: string;
  hours?: string;
  coordinates?: PostGISCoordinates;
  postgisLocation?: PostGISLocation;
  deliveryRadiusKm?: number;
  widgetCode?: string;
  [key: string]: any;
}

export const WebsiteSectionMetaSchema = z
  .object({
    buttonText: z.string().optional(),
    buttonLink: z.string().optional(),
    secondaryButtonText: z.string().optional(),
    secondaryButtonLink: z.string().optional(),
    imageUrl: z.string().optional(),
    layout: z.enum(["centered", "split", "minimal"]).optional(),
    badge: z.string().optional(),
    features: z.array(z.string()).optional(),
    stats: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
    interactiveMap: z.boolean().optional(),
    zones: z.array(z.string()).optional(),
    tables: z.array(TableItemSchema).optional(),
    timeSlots: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    showSearch: z.boolean().optional(),
    items: z.array(z.any()).optional(),
    chefName: z.string().optional(),
    chefTitle: z.string().optional(),
    chefImage: z.string().optional(),
    quote: z.string().optional(),
    specialties: z.array(z.string()).optional(),
    experienceYears: z.number().optional(),
    branchName: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    hours: z.string().optional(),
    coordinates: PostGISCoordinatesSchema.optional(),
    postgisLocation: PostGISLocationSchema.optional(),
    deliveryRadiusKm: z.number().optional(),
    widgetCode: z.string().optional(),
  })
  .passthrough();

/**
 * Styling options for individual website sections.
 */
export interface SectionStyle {
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  padding?: "sm" | "md" | "lg" | "xl";
  alignment?: "left" | "center" | "right";
}

export const SectionStyleSchema = z.object({
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
  padding: z.enum(["sm", "md", "lg", "xl"]).optional(),
  alignment: z.enum(["left", "center", "right"]).optional(),
});

/**
 * Modular section within the website configuration tree.
 */
export interface WebsiteSection {
  id: string;
  type: SectionType;
  title: string;
  subtitle?: string;
  content: string | Record<string, any>;
  enabled: boolean;
  style?: SectionStyle;
  meta?: WebsiteSectionMeta;
}

export const WebsiteSectionSchema = z
  .object({
    id: z.string(),
    type: SectionTypeSchema,
    title: z.string(),
    subtitle: z.string().optional(),
    content: z.union([z.string(), z.record(z.string(), z.any())]).default(""),
    enabled: z.boolean().default(true),
    style: SectionStyleSchema.optional(),
    meta: WebsiteSectionMetaSchema.optional(),
  })
  .passthrough();

/**
 * Gastronomic theme preset containing cohesive branding and styling tokens.
 */
export interface GastronomicThemePreset {
  name: string;
  primary: string;
  secondary: string;
  bg: string;
  card: string;
  font: "Outfit" | "Inter" | "Playfair Display";
  borderRadius?: "sharp" | "rounded" | "pill";
  description?: string;
}

export const GastronomicThemePresetSchema = z.object({
  name: z.string(),
  primary: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Valid hex required"),
  secondary: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Valid hex required"),
  bg: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Valid hex required"),
  card: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Valid hex required"),
  font: z.enum(["Outfit", "Inter", "Playfair Display"]),
  borderRadius: z.enum(["sharp", "rounded", "pill"]).optional(),
  description: z.string().optional(),
});

/**
 * Unified website theme configuration persisted to Supabase and edited in the studio.
 */
export interface WebsiteThemeConfig {
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  cardColor?: string;
  textColor?: string;
  fontFamily: "Outfit" | "Inter" | "Playfair Display";
  borderRadius?: "sharp" | "rounded" | "pill";
  layoutStyle?: "modern" | "classic" | "minimal" | "bold";
  heroStyle?: "fullscreen" | "split" | "minimal";
  heroLayout?: "centered" | "split" | "minimal";
  heroHeadline?: string;
  heroTagline?: string;
  heroButtonText?: string;
  heroButtonLink?: string;
  heroImage?: string;
  aboutStory?: string;
  aboutImage?: string;
  deliveryNotice?: string;
  themePreset?: string;
  sections: WebsiteSection[];
}

export const WebsiteThemeConfigSchema = z
  .object({
    primaryColor: z
      .string()
      .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Primary color must be valid hex")
      .default("#f98b25"),
    secondaryColor: z
      .string()
      .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
      .optional(),
    accentColor: z
      .string()
      .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
      .optional(),
    backgroundColor: z
      .string()
      .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
      .optional(),
    cardColor: z
      .string()
      .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
      .optional(),
    textColor: z
      .string()
      .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
      .optional(),
    fontFamily: z.enum(["Outfit", "Inter", "Playfair Display"]).default("Outfit"),
    borderRadius: z.enum(["sharp", "rounded", "pill"]).optional(),
    layoutStyle: z.enum(["modern", "classic", "minimal", "bold"]).optional(),
    heroStyle: z.enum(["fullscreen", "split", "minimal"]).optional(),
    heroLayout: z.enum(["centered", "split", "minimal"]).optional(),
    heroHeadline: z.string().default("Experience Fine Dining"),
    heroTagline: z
      .string()
      .default("Authentic gastronomy, tender flame-grilled specialties, and rich hospitality."),
    heroButtonText: z.string().default("Order Online Now"),
    heroButtonLink: z.string().optional(),
    heroImage: z.string().optional(),
    aboutStory: z
      .string()
      .default("Rooted in culinary excellence, honoring the sacred craft of fire, spices, and fresh ingredients."),
    aboutImage: z.string().optional(),
    deliveryNotice: z
      .string()
      .default("⚡ Fast delivery across Tashkent • Free on orders over 100,000 UZS"),
    themePreset: z.string().optional(),
    sections: z.array(WebsiteSectionSchema).default([]),
  })
  .passthrough();

/**
 * AI Website Command Request Contract.
 */
export interface AIWebsiteCommandRequest {
  command: string;
  currentConfig: WebsiteThemeConfig;
  model: "gemini-2.5-flash" | "gemini-3.1-pro-preview" | "gemini-2.5-pro" | "gemini-flash-latest" | "gemini-2.5-flash-lite";
  attachments?: AttachedMedia[];
}

export const AIWebsiteCommandRequestSchema = z.object({
  command: z.string().min(1, "Command must not be empty"),
  currentConfig: WebsiteThemeConfigSchema,
  model: z.enum([
    "gemini-2.5-flash",
    "gemini-3.1-pro-preview",
    "gemini-2.5-pro",
    "gemini-flash-latest",
    "gemini-2.5-flash-lite",
  ]).default("gemini-2.5-flash"),
  attachments: z.array(AttachedMediaSchema).optional(),
});

/**
 * AI Website Command Response Contract.
 */
export interface AIWebsiteCommandResponse {
  success: boolean;
  config: WebsiteThemeConfig;
  explanation: string;
  modelUsed: string;
  appliedChanges: string[];
}

export const AIWebsiteCommandResponseSchema = z.object({
  success: z.boolean(),
  config: WebsiteThemeConfigSchema,
  explanation: z.string(),
  modelUsed: z.string(),
  appliedChanges: z.array(z.string()),
});

// ═══════════════════════════════════════════════════════════════
// Standard Default Configurations & Theme Presets
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_FLOORPLAN_TABLES: TableItem[] = [
  { id: "t1", name: "Table 1", seats: 6, shape: "booth", zone: "Window Booths", status: "available", x: 16, y: 22 },
  { id: "t2", name: "Table 2", seats: 6, shape: "booth", zone: "Window Booths", status: "available", x: 38, y: 22 },
  { id: "t3", name: "Table 3", seats: 6, shape: "booth", zone: "Window Booths", status: "reserved", x: 60, y: 22 },
  { id: "t-vip8", name: "VIP Booth 8", seats: 8, shape: "booth", zone: "Private Lounge", status: "available", x: 84, y: 22 },
  { id: "t7-mid", name: "Table 7", seats: 4, shape: "rect", zone: "Main Dining", status: "available", x: 28, y: 50 },
  { id: "t8-mid", name: "Table 8", seats: 6, shape: "rect", zone: "Main Dining", status: "available", x: 48, y: 50 },
  { id: "bar", name: "Central Bar", seats: 5, shape: "bar", zone: "Bar Area", status: "available", x: 70, y: 50 },
  { id: "t6", name: "Table 6", seats: 4, shape: "booth", zone: "Window Booths", status: "available", x: 16, y: 78 },
  { id: "t7-bot", name: "Table 7", seats: 4, shape: "booth", zone: "Window Booths", status: "available", x: 38, y: 78 },
  { id: "t8-bot", name: "Table 8", seats: 4, shape: "booth", zone: "Window Booths", status: "reserved", x: 60, y: 78 },
];

export const GASTRONOMIC_THEME_PRESETS: GastronomicThemePreset[] = [
  {
    name: "Saffron Amber",
    primary: "#f98b25",
    secondary: "#e11d48",
    bg: "#0d1117",
    card: "#161b22",
    font: "Outfit",
    borderRadius: "rounded",
    description: "Authentic Uzbek warmth, flame grill, and golden plov.",
  },
  {
    name: "Emerald Luxury",
    primary: "#10b981",
    secondary: "#059669",
    bg: "#061510",
    card: "#0b231b",
    font: "Playfair Display",
    borderRadius: "sharp",
    description: "Fresh botanical garden, organic farm-to-table, fine teas.",
  },
  {
    name: "Obsidian Gold",
    primary: "#d4af37",
    secondary: "#f59e0b",
    bg: "#0b0d11",
    card: "#141720",
    font: "Playfair Display",
    borderRadius: "sharp",
    description: "Luxury steakhouse, champagne bar, private VIP dining.",
  },
  {
    name: "Artisan Coffee",
    primary: "#d97706",
    secondary: "#f59e0b",
    bg: "#14100c",
    card: "#1f1814",
    font: "Outfit",
    borderRadius: "rounded",
    description: "Specialty roastery, artisan bakery, warm cinnamon tones.",
  },
  {
    name: "Cobalt Modern",
    primary: "#3b82f6",
    secondary: "#06b6d4",
    bg: "#090d16",
    card: "#111827",
    font: "Inter",
    borderRadius: "pill",
    description: "Fast-casual, tech-forward delivery brand, clean lines.",
  },
  {
    name: "Royal Crimson",
    primary: "#e11d48",
    secondary: "#f43f5e",
    bg: "#14070a",
    card: "#200d12",
    font: "Outfit",
    borderRadius: "rounded",
    description: "Imperial banquet, celebratory dining, rich ruby accents.",
  },
];

export const THEME_PRESETS = GASTRONOMIC_THEME_PRESETS;

export const PHOTO_PRESETS: Array<{ label: string; url: string }> = [
  { label: "Wedding Plov", url: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=900&auto=format&fit=crop&q=80" },
  { label: "Charcoal Shashlik", url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=900&auto=format&fit=crop&q=80" },
  { label: "Clay Oven Somsa", url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=900&auto=format&fit=crop&q=80" },
  { label: "Hand-pulled Noodles", url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=900&auto=format&fit=crop&q=80" },
  { label: "Dining Hall Ambience", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&auto=format&fit=crop&q=80" },
  { label: "Artisan Coffee & Pastry", url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&auto=format&fit=crop&q=80" },
];

export const DEFAULT_SECTIONS: WebsiteSection[] = [
  {
    id: "sec-announcement",
    type: "announcement",
    title: "Announcement Bar",
    subtitle: "EXCLUSIVE PROMOTION",
    content: "🎉 Free express delivery across Tashkent on all orders over 100,000 UZS • Order direct for VIP rewards!",
    enabled: true,
  },
  {
    id: "sec-hero",
    type: "hero",
    title: "Hero Banner",
    subtitle: "AUTHENTIC CENTRAL ASIAN CUISINE",
    content: "Flame-grilled succulent meats, slow-cooked wedding plov, and rich Eastern hospitality.",
    enabled: true,
    meta: {
      buttonText: "Order Online Now",
      buttonLink: "#menu",
      secondaryButtonText: "Book a Table",
      secondaryButtonLink: "#tables",
      layout: "split",
      badge: "⭐️ 4.9 (420+ Reviews) • 100% Halal",
      imageUrl: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=900&auto=format&fit=crop&q=80",
    },
  },
  {
    id: "sec-about",
    type: "about",
    title: "Our Heritage & Culinary Passion",
    subtitle: "GENERATIONS OF FLAVOR",
    content: "Rooted in the heart of Tashkent, our kitchen honors the sacred balance of fire, spices, and hand-selected meats to bring genuine hospitality to every table.",
    enabled: true,
    meta: {
      imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
      badge: "Family Owned • Est. 1998",
      features: [
        "100% Halal Certified Meats",
        "Handmade Tandir Bread Daily",
        "Traditional Clay Oven Cooking",
      ],
      stats: [
        { label: "Years of Craft", value: "25+" },
        { label: "Daily Guests", value: "1,200+" },
        { label: "Secret Recipes", value: "48" },
      ],
    },
  },
  {
    id: "sec-menu",
    type: "menu",
    title: "Signature Menu & Daily Specials",
    subtitle: "PREPARED FRESH DAILY",
    content: "Explore our authentic specialties made from fresh farm-sourced ingredients and centuries-old culinary traditions.",
    enabled: true,
    meta: {
      categories: ["All", "Main Dishes", "Shashlik & Grills", "Somsa & Bakery", "Beverages"],
      showSearch: true,
      items: [
        {
          id: "m1",
          name: "To'y Oshi (Wedding Plov)",
          desc: "Slow-cooked tender beef with golden carrots and raisins.",
          price: 38000,
          category: "Main Dishes",
          tag: "Signature",
          image: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500&auto=format&fit=crop&q=80",
          dietary: ["Halal"],
          prepTime: 20,
        },
        {
          id: "m2",
          name: "Charcoal Shashlik",
          desc: "Marinated lamb skewers charcoal-grilled with sweet onions.",
          price: 46000,
          category: "Shashlik & Grills",
          tag: "Flame Grilled",
          image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80",
          dietary: ["Halal"],
          prepTime: 15,
        },
        {
          id: "m3",
          name: "Tandir Somsa",
          desc: "Crispy clay-oven pastry with diced beef and cumin.",
          price: 16000,
          category: "Somsa & Bakery",
          tag: "Crispy",
          image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80",
          dietary: ["Halal"],
          prepTime: 10,
        },
      ],
    },
  },
  {
    id: "sec-highlights",
    type: "highlights",
    title: "Chef Highlights",
    subtitle: "CURATED SIGNATURE FLAVORS",
    content: "Chef recommendations slow-cooked and flame-grilled to perfection.",
    enabled: true,
    meta: {
      items: [
        {
          title: "To'y Oshi (Wedding Plov)",
          desc: "Slow-cooked tender beef with golden carrots and raisins.",
          price: 38000,
          tag: "Signature",
          image: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500&auto=format&fit=crop&q=80",
        },
        {
          title: "Tandir Somsa",
          desc: "Crispy clay-oven pastry with diced beef and cumin.",
          price: 16000,
          tag: "Crispy",
          image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80",
        },
        {
          title: "Charcoal Shashlik",
          desc: "Marinated lamb skewers charcoal-grilled with sweet onions.",
          price: 46000,
          tag: "Flame Grilled",
          image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80",
        },
      ],
    },
  },
  {
    id: "sec-tables",
    type: "table_selection",
    title: "Interactive Floor Plan & Table Selection",
    subtitle: "REAL-TIME SEATING MAP",
    content: "Select your preferred dining table, window booth, or bar seat with live architectural availability.",
    enabled: true,
    meta: {
      interactiveMap: true,
      zones: ["All Zones", "Window Booths", "Main Dining", "Private Lounge", "Bar Area"],
      tables: DEFAULT_FLOORPLAN_TABLES,
    },
  },
  {
    id: "sec-chef",
    type: "chef_highlights",
    title: "Meet Our Master Chef",
    subtitle: "MASTERY OF THE TANDIR & FLAME",
    content: "Food is the truest expression of Uzbek warmth and hospitality. Every grain of rice and cut of meat carries our tradition.",
    enabled: true,
    meta: {
      chefName: "Chef Rustam Aliyev",
      chefTitle: "Executive Chef & Pitmaster",
      chefImage: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&auto=format&fit=crop&q=80",
      experienceYears: 28,
      quote: "Cooking with open fire connects us to centuries of ancestors who gathered around the tandoor.",
      specialties: ["Osh Plov Legend", "Clay Oven Craft", "Charcoal Grill Specialist"],
    },
  },
  {
    id: "sec-booking",
    type: "booking",
    title: "Reserve a Table",
    subtitle: "ELEVATED DINING EXPERIENCE",
    content: "Book a table for family gatherings, business lunches, or romantic evenings with instant confirmation.",
    enabled: true,
    meta: {
      buttonText: "Confirm Table Reservation",
    },
  },
  {
    id: "sec-reviews",
    type: "reviews",
    title: "Loved by Tashkent Foodies",
    subtitle: "4.9 STARS ON GOOGLE & YANDEX",
    content: "Hear what our guests have to say about our hospitality and flavors.",
    enabled: true,
    meta: {
      items: [
        {
          title: "Aziz Rakhimov",
          desc: "The wedding plov here is legitimately the best in the city. The meat melts in your mouth and service is lightning fast!",
          tag: "Verified Diner",
          rating: 5,
        },
        {
          title: "Malika Yusupova",
          desc: "Stunning atmosphere and delicious crispy somsa. We reserved a table for our family anniversary and everything was flawless.",
          tag: "Food Critic",
          rating: 5,
        },
        {
          title: "Davron Karimov",
          desc: "Always fresh, hot delivery within 30 minutes. Plately makes direct ordering so seamless!",
          tag: "Loyal Regular",
          rating: 5,
        },
      ],
    },
  },
  {
    id: "sec-hours",
    type: "hours_location",
    title: "Hours & Locations",
    subtitle: "VISIT OUR BRANCHES",
    content: "Open Daily 10:00 - 23:00 • Central Tashkent & Chorsu Outlets",
    enabled: true,
    meta: {
      branchName: "Kamolon Central Branch",
      address: "Amir Timur Street 24, Tashkent, Uzbekistan",
      phone: "+998 71 200 00 00",
      hours: "10:00 - 23:00 Daily",
      coordinates: { lat: 41.2995, lng: 69.2401 },
      postgisLocation: { type: "Point", coordinates: [69.2401, 41.2995] },
      deliveryRadiusKm: 12,
    },
  },
  {
    id: "sec-gallery",
    type: "gallery",
    title: "Atmosphere & Kitchen Moments",
    subtitle: "VISUAL TASTING TOUR",
    content: "A glimpse inside our bustling open kitchen, clay ovens, and warm dining spaces.",
    enabled: true,
    meta: {
      items: [
        { title: "Tandoor Baking", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80" },
        { title: "Main Dining Hall", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=80" },
        { title: "Fresh Uzbek Plov", image: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500&auto=format&fit=crop&q=80" },
      ],
    },
  },
  {
    id: "sec-faq",
    type: "faq",
    title: "Frequently Asked Questions",
    subtitle: "EVERYTHING YOU NEED TO KNOW",
    content: "Common questions about delivery radius, dietary certifications, and private dining bookings.",
    enabled: true,
    meta: {
      items: [
        {
          title: "Is all meat 100% Halal certified?",
          desc: "Yes, all our meats are strictly sourced from certified local farms and prepared in full accordance with Halal standards.",
        },
        {
          title: "What is your standard delivery time?",
          desc: "Our average preparation and delivery time in central Tashkent is under 35 minutes.",
        },
        {
          title: "Can we reserve private dining rooms for events?",
          desc: "Absolutely. Our VIP lounges accommodate 10-30 guests with dedicated pitmaster service.",
        },
      ],
    },
  },
  {
    id: "sec-cta",
    type: "cta",
    title: "Ready to Taste True Tradition?",
    subtitle: "ORDER NOW OR RESERVE YOUR TABLE",
    content: "Experience the authentic flavors of Tashkent. Direct online ordering with real-time tracking.",
    enabled: true,
    meta: {
      buttonText: "Order Delivery Now",
      buttonLink: "#menu",
      secondaryButtonText: "Select a Table",
      secondaryButtonLink: "#tables",
    },
  },
];

export const DEFAULT_WEBSITE_CONFIG: WebsiteThemeConfig = {
  primaryColor: "#f98b25",
  secondaryColor: "#e11d48",
  accentColor: "#f59e0b",
  backgroundColor: "#0d1117",
  cardColor: "#161b22",
  textColor: "#f8fafc",
  fontFamily: "Outfit",
  borderRadius: "rounded",
  layoutStyle: "modern",
  heroStyle: "split",
  heroLayout: "split",
  heroHeadline: "Experience Kamolon",
  heroTagline: "Authentic Central Asian gastronomy, tender flame-grilled meats, and rich hospitality.",
  heroButtonText: "Order Online Now",
  heroButtonLink: "#menu",
  heroImage: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=900&auto=format&fit=crop&q=80",
  aboutStory: "Kamolon brings together authentic local culinary heritage, slow-cooked tender meats, and fresh seasonal ingredients for an unforgettable dining experience.",
  aboutImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
  deliveryNotice: "⚡ Fast delivery in under 35 minutes across Tashkent • Free delivery on orders over 100,000 UZS",
  themePreset: "Saffron Amber",
  sections: DEFAULT_SECTIONS,
};

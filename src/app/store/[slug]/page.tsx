"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import {
  ShoppingBag,
  Plus,
  Minus,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  UtensilsCrossed,
  Search,
  X,
  Loader2,
  Sparkles,
  Star,
  BookOpen,
  Calendar,
  Users,
  Check,
  ExternalLink,
  ShieldCheck,
  ChefHat,
  ArrowRight,
  Compass,
  HelpCircle,
  Megaphone,
  Images,
} from "lucide-react";
import { formatUZS } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type WebsiteThemeConfig as CoreWebsiteThemeConfig,
  type WebsiteSection,
  type TableItem,
  type MenuShowcaseItem,
  type SectionType,
  DEFAULT_FLOORPLAN_TABLES,
  DEFAULT_SECTIONS,
  DEFAULT_WEBSITE_CONFIG,
} from "@/lib/types/website";

export interface WebsiteThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  cardColor?: string;
  textColor?: string;
  fontFamily?: "Outfit" | "Inter" | "Playfair Display";
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
  sections?: WebsiteSection[];
}

export type { CoreWebsiteThemeConfig, WebsiteSection, TableItem, MenuShowcaseItem, SectionType };

export interface StoreMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  dietary_tags?: string[];
  prep_time_minutes?: number;
}

interface CartItem {
  item: StoreMenuItem;
  quantity: number;
}

const DEMO_ITEMS: StoreMenuItem[] = [
  {
    id: "demo-1",
    name: "To'y Oshi (Wedding Plov)",
    description: "Signature Uzbek rice pilaf with tender slow-cooked beef, yellow carrots, and raisins.",
    price: 38000,
    category: "Main Dishes",
    dietary_tags: ["Halal"],
    prep_time_minutes: 15,
    image_url: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "demo-2",
    name: "Tandir Somsa",
    description: "Flaky clay-oven pastry with hand-cut beef, sweet onions, and roasted cumin.",
    price: 16000,
    category: "Somsa & Bakery",
    dietary_tags: ["Halal"],
    prep_time_minutes: 10,
    image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "demo-3",
    name: "Uygur Lagman",
    description: "Fresh hand-pulled noodles with savory beef slices, bell peppers, and rich tomato broth.",
    price: 36000,
    category: "Main Dishes",
    dietary_tags: ["Halal"],
    prep_time_minutes: 15,
    image_url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "demo-4",
    name: "Charcoal Shashlik (Lamb)",
    description: "Tender lamb skewers charcoal-grilled to perfection, served with marinated white onion.",
    price: 46000,
    category: "Shashlik & Grills",
    dietary_tags: ["Halal", "Gluten-Free"],
    prep_time_minutes: 20,
    image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "demo-5",
    name: "Issiq Tandir Non",
    description: "Freshly baked traditional flatbread directly from the clay tandoor oven.",
    price: 5000,
    category: "Somsa & Bakery",
    dietary_tags: ["Halal", "Vegetarian"],
    prep_time_minutes: 5,
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "demo-6",
    name: "Ko'k Choy (Traditional Green Tea)",
    description: "Authentic fragrant green tea served in a traditional hand-painted teapot.",
    price: 8000,
    category: "Beverages",
    dietary_tags: ["Halal", "Vegan", "Gluten-Free"],
    prep_time_minutes: 5,
    image_url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
  },
];

export default function PublicStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [restaurant, setRestaurant] = useState<{
    id: string;
    name: string;
    cuisine: string;
    phone: string;
    address: string;
  }>({
    id: "demo-rest",
    name: "Tashkent Palace Restaurant",
    cuisine: "Uzbek Traditional",
    phone: "+998 90 123 45 67",
    address: "Amir Timur Street 24, Tashkent",
  });

  const [menuItems, setMenuItems] = useState<StoreMenuItem[]>(DEMO_ITEMS);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Cart & Checkout State
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+998 ");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string | null>(null);

  // Website Configuration from Supabase
  const [websiteConfig, setWebsiteConfig] = useState<WebsiteThemeConfig | null>(null);

  // Table Selection & Reservation State
  const [selectedZone, setSelectedZone] = useState("All Zones");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [resCustomerName, setResCustomerName] = useState("");
  const [resCustomerPhone, setResCustomerPhone] = useState("+998 ");
  const [resPartySize, setResPartySize] = useState(2);
  const [resDate, setResDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [resTime, setResTime] = useState("19:00");
  const [resSpecialNotes, setResSpecialNotes] = useState("");
  const [confirmedReservationId, setConfirmedReservationId] = useState<string | null>(null);

  useEffect(() => {
    async function loadStorefront() {
      try {
        setIsLoading(true);
        const supabase = createClient();

        // 1. Fetch restaurant by slug
        const { data: rest, error: restErr } = await supabase
          .from("restaurants")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (!restErr && rest) {
          setRestaurant({
            id: rest.id,
            name: rest.name,
            cuisine: rest.cuisine_type || "National Uzbek Cuisine",
            phone: rest.phone || "+998 71 200 00 00",
            address: rest.address || "Amir Timur Street 24, Tashkent",
          });

          // 2. Fetch active menu items
          const { data: items } = await supabase
            .from("menu_items")
            .select("*")
            .eq("restaurant_id", rest.id)
            .eq("is_available", true)
            .order("created_at", { ascending: false });

          if (items && items.length > 0) {
            setMenuItems(
              items.map((row) => ({
                id: row.id,
                name: row.name,
                description: row.description || "",
                price: row.price,
                category: row.category || "Dishes",
                image_url: row.image_url,
                dietary_tags: row.dietary_tags || [],
                prep_time_minutes: row.prep_time_minutes || 15,
              }))
            );
          }

          // 3. Fetch published website configuration
          const { data: webConfig } = await supabase
            .from("restaurant_website_configs")
            .select("template, is_published")
            .eq("restaurant_id", rest.id)
            .maybeSingle();

          if (webConfig?.template) {
            setWebsiteConfig(webConfig.template as WebsiteThemeConfig);
          } else {
            setWebsiteConfig(DEFAULT_WEBSITE_CONFIG);
          }
        } else {
          // Fallback to default configuration
          setWebsiteConfig(DEFAULT_WEBSITE_CONFIG);
        }
      } catch (err) {
        console.warn("[Storefront] Error loading storefront:", err);
        setWebsiteConfig(DEFAULT_WEBSITE_CONFIG);
      } finally {
        setIsLoading(false);
      }
    }

    loadStorefront();
  }, [slug]);

  // Design Tokens
  const brandColor = websiteConfig?.primaryColor || "#f98b25";
  const brandBg = websiteConfig?.backgroundColor || "#0D1117";
  const cardBg = websiteConfig?.cardColor || "#161b22";
  const textColor = websiteConfig?.textColor || "#f8fafc";
  const fontFamily = websiteConfig?.fontFamily || "Outfit";
  const borderRadius = websiteConfig?.borderRadius || "rounded";

  const radiusClass = useMemo(() => {
    switch (borderRadius) {
      case "sharp":
        return "rounded-none";
      case "pill":
        return "rounded-full";
      case "rounded":
      default:
        return "rounded-2xl";
    }
  }, [borderRadius]);

  const buttonRadiusClass = useMemo(() => {
    switch (borderRadius) {
      case "sharp":
        return "rounded-none";
      case "pill":
        return "rounded-full";
      case "rounded":
      default:
        return "rounded-xl";
    }
  }, [borderRadius]);

  const fontStyle = useMemo(() => {
    switch (fontFamily) {
      case "Playfair Display":
        return "'Playfair Display', Georgia, serif";
      case "Inter":
        return "'Inter', -apple-system, sans-serif";
      case "Outfit":
      default:
        return "'Outfit', -apple-system, sans-serif";
    }
  }, [fontFamily]);

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    menuItems.forEach((i) => i.category && set.add(i.category));
    return Array.from(set);
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat = activeCategory === "All" || item.category === activeCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  // Cart Operations
  const addToCart = (item: StoreMenuItem) => {
    setCart((prev) => {
      const existing = prev[item.id];
      const nextQty = existing ? existing.quantity + 1 : 1;
      return {
        ...prev,
        [item.id]: { item, quantity: nextQty },
      };
    });
    toast.success(`Added ${item.name} to cart`);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [itemId]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  const totalCartCount = useMemo(() => {
    return Object.values(cart).reduce((acc, c) => acc + c.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return Object.values(cart).reduce((acc, c) => acc + c.item.price * c.quantity, 0);
  }, [cart]);

  const deliveryFee = orderType === "delivery" ? 15000 : 0;
  const orderTotal = cartSubtotal + deliveryFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error("Please provide your name");
      return;
    }
    if (!customerPhone.trim() || !customerPhone.startsWith("+998")) {
      toast.error("Please provide a valid Uzbekistan phone number (+998)");
      return;
    }
    if (orderType === "delivery" && !deliveryAddress.trim()) {
      toast.error("Please provide a delivery address");
      return;
    }
    if (Object.keys(cart).length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsSubmittingOrder(true);
    const orderNum = `PLT-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      if (restaurant.id !== "demo-rest") {
        const supabase = createClient();
        const orderItemsPayload = Object.values(cart).map((c) => ({
          menu_item_id: c.item.id,
          name: c.item.name,
          quantity: c.quantity,
          unit_price: c.item.price,
          total_price: c.item.price * c.quantity,
        }));

        await supabase.from("orders").insert({
          restaurant_id: restaurant.id,
          order_number: orderNum,
          customer_name: customerName.trim(),
          phone: customerPhone.trim(),
          delivery_address: orderType === "delivery" ? deliveryAddress.trim() : null,
          type: orderType,
          status: "confirmed",
          subtotal: cartSubtotal,
          delivery_fee: deliveryFee,
          total: orderTotal,
          items: orderItemsPayload,
        });
      }

      setConfirmedOrderNumber(orderNum);
      setCart({});
      setIsCheckoutOpen(false);
      toast.success("Order placed successfully! Kitchen is preparing your dishes.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to place order");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Table Selection & Floor Plan Details
  const floorPlanSection = useMemo(() => {
    return websiteConfig?.sections?.find((s) => s.type === "table_selection");
  }, [websiteConfig]);

  const tablesList: TableItem[] = useMemo(() => {
    const list = floorPlanSection?.meta?.tables;
    if (Array.isArray(list) && list.length > 0) return list;
    return DEFAULT_FLOORPLAN_TABLES;
  }, [floorPlanSection]);

  const zonesList: string[] = useMemo(() => {
    const declared = floorPlanSection?.meta?.zones;
    if (Array.isArray(declared) && declared.length > 0) return declared;
    const dynamicZones = Array.from(new Set(tablesList.map((t) => t.zone)));
    return ["All Zones", ...dynamicZones];
  }, [floorPlanSection, tablesList]);

  const filteredTables = useMemo(() => {
    if (selectedZone === "All Zones") return tablesList;
    return tablesList.filter((t) => t.zone === selectedZone);
  }, [tablesList, selectedZone]);

  const selectedTable = useMemo(() => {
    if (!selectedTableId) return null;
    return tablesList.find((t) => t.id === selectedTableId) || null;
  }, [tablesList, selectedTableId]);

  const handleSelectTable = (table: TableItem) => {
    if (table.status === "reserved") {
      toast.info(`${table.name} is reserved for tonight. Please select another table.`);
      return;
    }
    if (selectedTableId === table.id) {
      setSelectedTableId(null);
    } else {
      setSelectedTableId(table.id);
      setResPartySize(table.seats);
      toast.success(`Selected ${table.name} (${table.zone}, ${table.seats} seats)`);
    }
  };

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resCustomerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!resCustomerPhone.trim() || !resCustomerPhone.startsWith("+998")) {
      toast.error("Please provide a valid Uzbekistan phone number (+998)");
      return;
    }

    const resId = `RES-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      if (restaurant.id && restaurant.id !== "demo-rest") {
        const supabase = createClient();
        const reservationDateTime = `${resDate}T${resTime}:00`;
        const { error } = await supabase.from("reservations").insert({
          restaurant_id: restaurant.id,
          customer_name: resCustomerName.trim(),
          customer_phone: resCustomerPhone.trim(),
          party_size: Number(resPartySize) || 2,
          reservation_time: new Date(reservationDateTime).toISOString(),
          table_number: selectedTable ? selectedTable.name : null,
          status: "pending",
          special_requests: resSpecialNotes.trim()
            ? `[Storefront Booking] Table: ${selectedTable?.name || "General"} (${selectedTable?.zone || "Dining"}). Notes: ${resSpecialNotes.trim()}`
            : `[Storefront Booking] Table: ${selectedTable?.name || "General"} (${selectedTable?.zone || "Dining"})`,
        });

        if (error) {
          console.error("[Storefront] Reservation insert error:", error);
          toast.error("Could not save reservation: " + error.message);
          return;
        }
      }

      setConfirmedReservationId(resId);
      setIsReserveModalOpen(false);
      toast.success(`🎉 Reservation submitted! Booking ID: #${resId}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit reservation");
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION RENDERERS
  // ═══════════════════════════════════════════════════════════════════════

  const renderHeroSection = (section: WebsiteSection) => {
    const headline = section.title || websiteConfig?.heroHeadline || "Authentic Uzbek Gastronomy";
    const tagline =
      section.subtitle ||
      websiteConfig?.heroTagline ||
      "Flame-grilled succulent meats, slow-cooked wedding plov, and rich Eastern hospitality.";
    const description =
      typeof section.content === "string"
        ? section.content
        : "Experience the timeless craft of Central Asian flavors cooked fresh daily.";
    const buttonText = section.meta?.buttonText || websiteConfig?.heroButtonText || "Order Online Now";
    const buttonLink = section.meta?.buttonLink || websiteConfig?.heroButtonLink || "#menu";
    const secondaryButtonText = section.meta?.secondaryButtonText || "Select a Table";
    const secondaryButtonLink = section.meta?.secondaryButtonLink || "#tables";
    const badge = section.meta?.badge || "⭐️ 4.9 (420+ Reviews) • 100% Halal";
    const imageUrl =
      section.meta?.imageUrl ||
      websiteConfig?.heroImage ||
      "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=900&auto=format&fit=crop&q=80";
    const layout = section.meta?.layout || websiteConfig?.heroLayout || "split";

    if (layout === "centered") {
      return (
        <section
          id="hero"
          key={section.id}
          className={`relative overflow-hidden py-16 sm:py-24 px-6 text-center border-b border-[rgba(255,255,255,0.06)] shadow-2xl`}
          style={{ backgroundColor: cardBg }}
        >
          {imageUrl && (
            <div
              className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          )}
          <div className="relative max-w-3xl mx-auto space-y-5 z-10">
            {badge && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-white/10"
                style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {badge}
              </span>
            )}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {headline}
            </h1>
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {tagline || description}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <a
                href={buttonLink}
                className={`px-6 py-3 font-bold text-xs sm:text-sm text-white shadow-xl hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer ${buttonRadiusClass}`}
                style={{ backgroundColor: brandColor }}
              >
                <span>{buttonText}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href={secondaryButtonLink}
                className={`px-6 py-3 font-semibold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/15 transition-all flex items-center gap-2 cursor-pointer border border-white/10 ${buttonRadiusClass}`}
              >
                <span>{secondaryButtonText}</span>
              </a>
            </div>
          </div>
        </section>
      );
    }

    // Default Split Layout
    return (
      <section
        id="hero"
        key={section.id}
        className="relative overflow-hidden py-12 sm:py-16 px-4 sm:px-8 border-b border-[rgba(255,255,255,0.06)]"
        style={{ backgroundColor: cardBg }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-5">
            {badge && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-white/10"
                style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {badge}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {headline}
            </h1>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              {tagline || description}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={buttonLink}
                className={`px-6 py-3 font-bold text-xs sm:text-sm text-white shadow-xl hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer ${buttonRadiusClass}`}
                style={{ backgroundColor: brandColor }}
              >
                <span>{buttonText}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href={secondaryButtonLink}
                className={`px-6 py-3 font-semibold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/15 transition-all flex items-center gap-2 cursor-pointer border border-white/10 ${buttonRadiusClass}`}
              >
                <span>{secondaryButtonText}</span>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" style={{ color: brandColor }} />
                {restaurant.address}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Avg. Prep: 15-20 min
              </span>
            </div>
          </div>

          {imageUrl && (
            <div className="relative">
              <div
                className={`overflow-hidden shadow-2xl border border-white/10 relative h-72 sm:h-96 ${radiusClass}`}
              >
                <img
                  src={imageUrl}
                  alt={headline}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 text-xs flex items-center justify-between">
                  <span className="font-semibold text-white">Chef Crafted Specialty</span>
                  <span className="text-emerald-400 font-mono font-bold">100% Fresh Daily</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderAboutSection = (section: WebsiteSection) => {
    const title = section.title || "Our Culinary Story";
    const subtitle = section.subtitle || "OUR HERITAGE";
    const story =
      typeof section.content === "string"
        ? section.content
        : websiteConfig?.aboutStory ||
          "Rooted in the heart of Tashkent, our kitchen honors the sacred balance of fire, spices, and hand-selected meats.";
    const imageUrl =
      section.meta?.imageUrl ||
      websiteConfig?.aboutImage ||
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80";
    const badge = section.meta?.badge || "Family Owned • Est. 1998";
    const features: string[] = section.meta?.features || [
      "100% Halal Certified Meats",
      "Handmade Tandir Bread Daily",
      "Traditional Clay Oven Cooking",
    ];
    const stats: Array<{ label: string; value: string }> = section.meta?.stats || [
      { label: "Years of Craft", value: "25+" },
      { label: "Daily Guests", value: "1,200+" },
      { label: "Secret Recipes", value: "48" },
    ];

    return (
      <section
        id="about"
        key={section.id}
        className={`border border-[rgba(255,255,255,0.06)] p-6 sm:p-10 shadow-xl max-w-6xl mx-auto w-full ${radiusClass}`}
        style={{ backgroundColor: cardBg }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] uppercase tracking-wider font-bold"
                style={{ color: brandColor }}
              >
                {subtitle}
              </span>
              {badge && (
                <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                  {badge}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              {story}
            </p>

            {features.length > 0 && (
              <div className="space-y-2 pt-2">
                {features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-200">
                    <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: brandColor }} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            )}

            {stats.length > 0 && (
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5">
                {stats.map((st, idx) => (
                  <div key={idx} className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-lg sm:text-xl font-bold font-mono text-white" style={{ color: brandColor }}>
                      {st.value}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{st.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {imageUrl && (
            <div className={`overflow-hidden relative h-64 sm:h-80 shadow-2xl border border-white/10 ${radiusClass}`}>
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderMenuSection = (section: WebsiteSection) => {
    const title = section.title || "Signature Menu & Daily Specials";
    const subtitle = section.subtitle || "PREPARED FRESH DAILY";
    const description =
      typeof section.content === "string"
        ? section.content
        : "Explore our authentic specialties made from fresh farm-sourced ingredients and centuries-old culinary traditions.";

    return (
      <section
        id="menu"
        key={section.id}
        className="max-w-6xl mx-auto w-full space-y-6"
      >
        <div className="text-center space-y-1">
          <span
            className="text-[11px] uppercase tracking-wider font-bold"
            style={{ color: brandColor }}
          >
            {subtitle}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
            {description}
          </p>
        </div>

        {/* Category Filter Pills & Search Bar */}
        <div
          className={`flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 p-3 border border-[rgba(255,255,255,0.06)] shadow-lg ${radiusClass}`}
          style={{ backgroundColor: cardBg }}
        >
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "text-white shadow-md font-bold"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
                style={
                  activeCategory === cat
                    ? { backgroundColor: brandColor }
                    : undefined
                }
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search menu dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0D1117] border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Dishes Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" style={{ color: brandColor }} />
            <p className="text-xs">Loading delicious menu...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => {
              const inCart = cart[item.id]?.quantity || 0;

              return (
                <div
                  key={item.id}
                  className={`border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.18)] p-5 flex flex-col justify-between transition-all hover:-translate-y-0.5 shadow-xl group overflow-hidden ${radiusClass}`}
                  style={{ backgroundColor: cardBg }}
                >
                  {/* Dish Image */}
                  {item.image_url && (
                    <div className="h-44 -mx-5 -mt-5 mb-4 overflow-hidden relative bg-[#0D1117]">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-white text-base leading-snug">
                        {item.name}
                      </h3>
                      <span className="text-[10px] text-gray-400 bg-[#0D1117] px-2 py-0.5 rounded-full border border-white/5 shrink-0">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {item.dietary_tags && item.dietary_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.dietary_tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                    <span
                      className="text-base font-bold font-mono"
                      style={{ color: brandColor }}
                    >
                      {formatUZS(item.price)}
                    </span>

                    {inCart > 0 ? (
                      <div className="flex items-center gap-2 bg-[#0D1117] border border-white/10 rounded-xl p-1">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono font-bold px-1 text-white">{inCart}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg text-white cursor-pointer"
                          style={{ backgroundColor: brandColor }}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-white font-medium text-xs transition-all shadow-md hover:brightness-110 cursor-pointer ${buttonRadiusClass}`}
                        style={{ backgroundColor: brandColor }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 text-xs">
            No dishes found matching your selection.
          </div>
        )}
      </section>
    );
  };

  const renderTableSelectionSection = (section: WebsiteSection) => {
    const title = section.title || "Interactive Floor Plan & Table Selection";
    const subtitle = section.subtitle || "REAL-TIME SEATING MAP";
    const description =
      typeof section.content === "string"
        ? section.content
        : "Select your preferred dining table, window booth, or VIP lounge with live architectural availability.";

    return (
      <section
        id="tables"
        key={section.id}
        className={`border border-[rgba(255,255,255,0.06)] p-6 sm:p-8 shadow-2xl max-w-6xl mx-auto w-full space-y-6 ${radiusClass}`}
        style={{ backgroundColor: cardBg }}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <span
              className="text-[11px] uppercase tracking-wider font-bold"
              style={{ color: brandColor }}
            >
              {subtitle}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl">
              {description}
            </p>
          </div>

          {/* Seating Map Legend */}
          <div className="flex items-center gap-4 text-xs bg-[#0D1117] p-2.5 rounded-xl border border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" />
              <span className="text-gray-300">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
              <span className="text-gray-400">Reserved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full ring-2 ring-white/50"
                style={{ backgroundColor: brandColor }}
              />
              <span className="text-white font-semibold">Selected</span>
            </div>
          </div>
        </div>

        {/* Zone Selector Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide border-b border-white/5">
          {zonesList.map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                selectedZone === zone
                  ? "bg-white/10 text-white font-bold border border-white/10"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {zone}
            </button>
          ))}
        </div>

        {/* Architectural Dining Floor Map Canvas */}
        <div className="relative bg-[#090d16] border border-white/10 rounded-2xl p-4 sm:p-6 min-h-[380px] sm:min-h-[460px] overflow-hidden shadow-inner flex flex-col justify-between">
          {/* Architectural Blueprint Watermarks */}
          <div className="absolute top-3 left-4 text-[10px] tracking-widest uppercase font-mono text-white/20 select-none">
            [ Panoramic Window View — Street Facing ]
          </div>
          <div className="absolute top-3 right-4 text-[10px] tracking-widest uppercase font-mono text-white/20 select-none">
            [ Private VIP Dining Lounge ]
          </div>
          <div className="absolute bottom-3 left-4 text-[10px] tracking-widest uppercase font-mono text-white/20 select-none">
            [ Main Entrance & Host Desk ]
          </div>
          <div className="absolute bottom-3 right-4 text-[10px] tracking-widest uppercase font-mono text-white/20 select-none">
            [ Open Tandoor & Kitchen Pass ]
          </div>

          {/* Tables Map Canvas */}
          <div className="relative w-full h-[320px] sm:h-[400px]">
            {filteredTables.map((table) => {
              const isSelected = selectedTableId === table.id;
              const isReserved = table.status === "reserved";

              let shapeStyle = "rounded-xl";
              if (table.shape === "round") shapeStyle = "rounded-full aspect-square";
              if (table.shape === "booth") shapeStyle = "rounded-2xl border-l-4";
              if (table.shape === "bar") shapeStyle = "rounded-lg border-dashed";

              return (
                <div
                  key={table.id}
                  onClick={() => handleSelectTable(table)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 sm:p-3 transition-all cursor-pointer select-none border text-center shadow-lg group ${shapeStyle} ${
                    isSelected
                      ? "ring-2 ring-white scale-110 z-20"
                      : isReserved
                      ? "opacity-40 border-rose-500/30 bg-rose-950/20 cursor-not-allowed"
                      : "hover:scale-105 hover:border-emerald-400/80 bg-[#161b22] border-white/15"
                  }`}
                  style={{
                    left: `${table.x}%`,
                    top: `${table.y}%`,
                    backgroundColor: isSelected ? `${brandColor}30` : undefined,
                    borderColor: isSelected ? brandColor : undefined,
                  }}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-[11px] sm:text-xs font-bold text-white whitespace-nowrap">
                      {table.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-0.5 text-[9px] sm:text-[10px] text-gray-300">
                    <Users className="w-2.5 h-2.5" />
                    <span>{table.seats}p</span>
                  </div>
                  <div className="mt-1">
                    {isReserved ? (
                      <span className="text-[8px] sm:text-[9px] text-rose-400 font-semibold uppercase">
                        Booked
                      </span>
                    ) : isSelected ? (
                      <span
                        className="text-[8px] sm:text-[9px] font-bold uppercase"
                        style={{ color: brandColor }}
                      >
                        Selected
                      </span>
                    ) : (
                      <span className="text-[8px] sm:text-[9px] text-emerald-400 font-semibold uppercase">
                        Open
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Table Confirmation & Reservation Callout */}
        {selectedTable ? (
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg animate-in fade-in duration-200`}
            style={{
              backgroundColor: `${brandColor}15`,
              borderColor: `${brandColor}40`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: brandColor }}
              >
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {selectedTable.name} Selected ({selectedTable.zone})
                </h4>
                <p className="text-xs text-gray-300">
                  Capacity: up to {selectedTable.seats} guests • Window & ambience view
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setSelectedTableId(null)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Clear Selection
              </button>
              <button
                onClick={() => setIsReserveModalOpen(true)}
                className={`flex-1 sm:flex-initial px-5 py-2.5 font-bold text-xs text-white shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer ${buttonRadiusClass}`}
                style={{ backgroundColor: brandColor }}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Reserve This Table</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-center text-gray-400">
            💡 Click on any available table above to view details and reserve for dining.
          </p>
        )}
      </section>
    );
  };

  const renderHighlightsSection = (section: WebsiteSection) => {
    const title = section.title || "Chef Highlights & Signatures";
    const subtitle = section.subtitle || "CURATED SIGNATURE FLAVORS";
    const description =
      typeof section.content === "string"
        ? section.content
        : "Chef recommendations slow-cooked and flame-grilled to perfection.";
    const items = section.meta?.items || [];
    const chefName = section.meta?.chefName;
    const chefTitle = section.meta?.chefTitle || "Executive Chef & Pitmaster";
    const chefImage = section.meta?.chefImage;
    const quote = section.meta?.quote;
    const specialties: string[] = section.meta?.specialties || [];

    return (
      <section
        id="highlights"
        key={section.id}
        className={`border border-[rgba(255,255,255,0.06)] p-6 sm:p-10 shadow-xl max-w-6xl mx-auto w-full space-y-6 ${radiusClass}`}
        style={{ backgroundColor: cardBg }}
      >
        <div className="text-center space-y-1">
          <span
            className="text-[11px] uppercase tracking-wider font-bold"
            style={{ color: brandColor }}
          >
            {subtitle}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
            {description}
          </p>
        </div>

        {/* Master Chef Spotlight (if configured) */}
        {chefName && (
          <div className="bg-[#0D1117] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-inner">
            {chefImage && (
              <img
                src={chefImage}
                alt={chefName}
                className="w-24 h-24 rounded-2xl object-cover border border-white/20 shrink-0"
              />
            )}
            <div className="space-y-2 text-center md:text-left flex-1">
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full font-semibold border border-amber-500/20">
                Master Culinary Artisan
              </span>
              <h3 className="text-lg font-bold text-white">{chefName}</h3>
              <p className="text-xs text-gray-400">{chefTitle}</p>
              {quote && (
                <p className="text-xs text-gray-300 italic border-l-2 border-amber-500 pl-3">
                  "{quote}"
                </p>
              )}
              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {specialties.map((sp, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] text-gray-300 bg-white/5 px-2 py-0.5 rounded-full border border-white/10"
                    >
                      {sp}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Highlights Items Grid */}
        {items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {items.map((item: any, idx: number) => (
              <div
                key={idx}
                className="bg-[#0D1117] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-lg group overflow-hidden"
              >
                {item.image && (
                  <div className="h-36 -mx-4 -mt-4 mb-3 overflow-hidden bg-black/40">
                    <img
                      src={item.image}
                      alt={item.title || item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-white text-sm">{item.title || item.name}</h4>
                    {item.tag && (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">{item.desc || item.description}</p>
                </div>
                {item.price && (
                  <div className="pt-3 mt-2 border-t border-white/5 flex justify-between items-center">
                    <span className="font-mono font-bold text-xs" style={{ color: brandColor }}>
                      {formatUZS(item.price)}
                    </span>
                    <button
                      onClick={() =>
                        addToCart({
                          id: `highlight-${idx}`,
                          name: item.title || item.name,
                          description: item.desc || item.description || "",
                          price: item.price,
                          category: "Highlights",
                        })
                      }
                      className={`px-2.5 py-1 text-white text-[11px] font-semibold flex items-center gap-1 hover:brightness-110 cursor-pointer ${buttonRadiusClass}`}
                      style={{ backgroundColor: brandColor }}
                    >
                      <Plus className="w-3 h-3" />
                      <span>Order</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  const renderBookingSection = (section: WebsiteSection) => {
    const title = section.title || "Reserve a Table";
    const subtitle = section.subtitle || "ELEVATED DINING EXPERIENCE";
    const description =
      typeof section.content === "string"
        ? section.content
        : "Book a table for family gatherings, business lunches, or romantic evenings with instant confirmation.";

    return (
      <section
        id="booking"
        key={section.id}
        className={`border border-[rgba(255,255,255,0.06)] p-6 sm:p-8 shadow-xl max-w-3xl mx-auto w-full space-y-6 ${radiusClass}`}
        style={{ backgroundColor: cardBg }}
      >
        <div className="text-center space-y-1">
          <span
            className="text-[11px] uppercase tracking-wider font-bold"
            style={{ color: brandColor }}
          >
            {subtitle}
          </span>
          <h2 className="text-2xl font-bold text-white">
            {title} at {restaurant.name}
          </h2>
          <p className="text-xs text-gray-400">
            {description}
          </p>
        </div>

        {selectedTable && (
          <div className="p-3 bg-[#0D1117] rounded-xl border border-white/10 flex items-center justify-between text-xs">
            <span className="text-gray-300">
              Reserved Seating: <strong className="text-white">{selectedTable.name}</strong> ({selectedTable.zone})
            </span>
            <span className="font-mono text-emerald-400 font-bold">Selected</span>
          </div>
        )}

        <form onSubmit={handleConfirmReservation} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-gray-300 block mb-1">Guests</label>
            <select
              value={resPartySize}
              onChange={(e) => setResPartySize(Number(e.target.value))}
              className="w-full bg-[#0D1117] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
            >
              <option value={2}>2 Guests</option>
              <option value={4}>4 Guests</option>
              <option value={6}>6 Guests</option>
              <option value={8}>8 Guests</option>
              <option value={10}>10+ Guests (Private VIP Room)</option>
            </select>
          </div>
          <div>
            <label className="text-gray-300 block mb-1">Date</label>
            <input
              type="date"
              value={resDate}
              onChange={(e) => setResDate(e.target.value)}
              className="w-full bg-[#0D1117] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="text-gray-300 block mb-1">Time Slot</label>
            <select
              value={resTime}
              onChange={(e) => setResTime(e.target.value)}
              className="w-full bg-[#0D1117] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
            >
              <option value="12:30">12:30 - Lunch</option>
              <option value="14:00">14:00 - Afternoon</option>
              <option value="18:30">18:30 - Early Dinner</option>
              <option value="20:00">20:00 - Prime Evening</option>
              <option value="21:30">21:30 - Late Night</option>
            </select>
          </div>

          <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-gray-300 block mb-1">Full Name *</label>
              <input
                type="text"
                value={resCustomerName}
                onChange={(e) => setResCustomerName(e.target.value)}
                placeholder="e.g. Alisher Navoiy"
                required
                className="w-full bg-[#0D1117] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-gray-300 block mb-1">Phone Number (+998) *</label>
              <input
                type="text"
                value={resCustomerPhone}
                onChange={(e) => setResCustomerPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                required
                className="w-full bg-[#0D1117] border border-white/10 rounded-xl p-2.5 text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="sm:col-span-3 pt-2">
            <button
              type="submit"
              className={`w-full py-3 font-bold text-xs text-white shadow-xl hover:brightness-110 transition-all cursor-pointer ${buttonRadiusClass}`}
              style={{ backgroundColor: brandColor }}
            >
              Confirm Table Reservation
            </button>
          </div>
        </form>
      </section>
    );
  };

  const renderReviewsSection = (section: WebsiteSection) => {
    const title = section.title || "Loved by Tashkent Diners";
    const subtitle = section.subtitle || "4.9 STARS ON GOOGLE & YANDEX";
    const description =
      typeof section.content === "string"
        ? section.content
        : "Hear what our guests have to say about our hospitality, wood-fired plov, and clay-oven somsa.";
    const items = section.meta?.items || [
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
    ];

    return (
      <section
        id="reviews"
        key={section.id}
        className="max-w-6xl mx-auto w-full space-y-6"
      >
        <div className="text-center space-y-1">
          <span
            className="text-[11px] uppercase tracking-wider font-bold"
            style={{ color: brandColor }}
          >
            {subtitle}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {items.map((rev: any, idx: number) => (
            <div
              key={idx}
              className={`border border-[rgba(255,255,255,0.06)] p-5 space-y-3 shadow-xl flex flex-col justify-between ${radiusClass}`}
              style={{ backgroundColor: cardBg }}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(rev.rating || 5)].map((_, si) => (
                    <Star key={si} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-gray-300 italic leading-relaxed">
                  "{rev.desc || rev.content || rev.quote}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px]">
                <span className="font-bold text-white">{rev.title || rev.name}</span>
                <span className="text-emerald-400 font-semibold">{rev.tag || "Verified Guest"}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderHoursLocationSection = (section: WebsiteSection) => {
    const title = section.title || "Hours & Locations";
    const subtitle = section.subtitle || "VISIT OUR BRANCHES";
    const address = section.meta?.address || restaurant.address;
    const phone = section.meta?.phone || restaurant.phone;
    const hours = section.meta?.hours || "10:00 - 23:00 Daily";
    const deliveryRadiusKm = section.meta?.deliveryRadiusKm || 12;

    // PostGIS geographic coordinates
    let lat = 41.2995;
    let lng = 69.2401;
    if (section.meta?.coordinates) {
      const c: any = section.meta.coordinates;
      lat = c.lat ?? c.latitude ?? lat;
      lng = c.lng ?? c.longitude ?? lng;
    } else if (section.meta?.postgisLocation?.coordinates) {
      lng = section.meta.postgisLocation.coordinates[0];
      lat = section.meta.postgisLocation.coordinates[1];
    }

    return (
      <section
        id="location"
        key={section.id}
        className={`border border-[rgba(255,255,255,0.06)] p-6 sm:p-8 shadow-xl max-w-6xl mx-auto w-full ${radiusClass}`}
        style={{ backgroundColor: cardBg }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-3">
            <span
              className="text-[11px] uppercase tracking-wider font-bold"
              style={{ color: brandColor }}
            >
              {subtitle}
            </span>
            <h2 className="text-2xl font-bold text-white">
              {title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#0D1117] border border-white/5">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: brandColor }} />
                <div>
                  <strong className="text-white block">Address</strong>
                  <span className="text-gray-400">{address}</span>
                  <div className="text-[10px] text-gray-500 font-mono mt-1">
                    Geo: {lat.toFixed(4)}°N, {lng.toFixed(4)}°E (PostGIS WGS84)
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#0D1117] border border-white/5">
                <Clock className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <strong className="text-white block">Operating Schedule</strong>
                  <span className="text-gray-400">{hours}</span>
                  <div className="text-[10px] text-emerald-400 font-medium mt-1">
                    Kitchen Active • Dine-in & Delivery
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] bg-white/5 text-gray-300 border border-white/10">
                <Compass className="w-3.5 h-3.5" style={{ color: brandColor }} />
                Delivery Radius: Up to {deliveryRadiusKm} km across Tashkent
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] bg-white/5 text-gray-300 border border-white/10">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Direct Desk: {phone}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 justify-center">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-3 font-bold text-xs text-white shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer ${buttonRadiusClass}`}
              style={{ backgroundColor: brandColor }}
            >
              <MapPin className="w-4 h-4" />
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={`https://yandex.com/maps/?text=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-2.5 font-semibold text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer ${buttonRadiusClass}`}
            >
              <span>Open in Yandex Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </section>
    );
  };

  const renderFaqSection = (section: WebsiteSection) => {
    const title = section.title || "Frequently Asked Questions";
    const subtitle = section.subtitle || "EVERYTHING YOU NEED TO KNOW";
    const items = section.meta?.items || [
      {
        title: "Is all meat 100% Halal certified?",
        desc: "Yes, all our beef, lamb, and chicken are certified Halal from local vetted farms.",
      },
      {
        title: "What is your average delivery speed?",
        desc: "We deliver across central Tashkent in under 35 minutes using thermal insulated packs.",
      },
      {
        title: "Can we reserve VIP dining rooms for events?",
        desc: "Absolutely. Our VIP lounges accommodate 10-30 guests with dedicated pitmaster service.",
      },
    ];

    return (
      <section
        id="faq"
        key={section.id}
        className={`border border-[rgba(255,255,255,0.06)] p-6 sm:p-8 shadow-xl max-w-4xl mx-auto w-full space-y-5 ${radiusClass}`}
        style={{ backgroundColor: cardBg }}
      >
        <div className="text-center space-y-1">
          <span
            className="text-[11px] uppercase tracking-wider font-bold"
            style={{ color: brandColor }}
          >
            {subtitle}
          </span>
          <h2 className="text-2xl font-bold text-white">
            {title}
          </h2>
        </div>

        <div className="space-y-3 text-xs">
          {items.map((item: any, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#0D1117] border border-white/5 space-y-1"
            >
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5" style={{ color: brandColor }} />
                <span>{item.title || item.question}</span>
              </h4>
              <p className="text-gray-400 pl-5 leading-relaxed">
                {item.desc || item.answer}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderCtaSection = (section: WebsiteSection) => {
    const title = section.title || "Ready to Taste True Tradition?";
    const subtitle = section.subtitle || "ORDER NOW OR RESERVE YOUR TABLE";
    const description =
      typeof section.content === "string"
        ? section.content
        : "Experience the authentic flavors of Tashkent. Direct online ordering with real-time tracking.";
    const buttonText = section.meta?.buttonText || "Order Delivery Now";
    const buttonLink = section.meta?.buttonLink || "#menu";
    const secondaryButtonText = section.meta?.secondaryButtonText || "Select a Table";
    const secondaryButtonLink = section.meta?.secondaryButtonLink || "#tables";

    return (
      <section
        id="cta"
        key={section.id}
        className={`relative overflow-hidden p-8 sm:p-12 text-center shadow-2xl border border-[rgba(255,255,255,0.08)] max-w-5xl mx-auto w-full space-y-5 ${radiusClass}`}
        style={{ backgroundColor: cardBg }}
      >
        <span
          className="text-[11px] uppercase tracking-wider font-bold"
          style={{ color: brandColor }}
        >
          {subtitle}
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto">
          {description}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <a
            href={buttonLink}
            className={`px-6 py-3 font-bold text-xs sm:text-sm text-white shadow-xl hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer ${buttonRadiusClass}`}
            style={{ backgroundColor: brandColor }}
          >
            <span>{buttonText}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href={secondaryButtonLink}
            className={`px-6 py-3 font-semibold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/15 transition-all flex items-center gap-2 cursor-pointer border border-white/10 ${buttonRadiusClass}`}
          >
            <span>{secondaryButtonText}</span>
          </a>
        </div>
      </section>
    );
  };

  const renderGallerySection = (section: WebsiteSection) => {
    const title = section.title || "Atmosphere & Kitchen Moments";
    const subtitle = section.subtitle || "VISUAL TASTING TOUR";
    const items = section.meta?.items || [
      {
        title: "Clay Oven Baking",
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80",
      },
      {
        title: "Main Dining Hall",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80",
      },
      {
        title: "Traditional Plov Preparation",
        image: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80",
      },
    ];

    return (
      <section
        id="gallery"
        key={section.id}
        className="max-w-6xl mx-auto w-full space-y-6"
      >
        <div className="text-center space-y-1">
          <span
            className="text-[11px] uppercase tracking-wider font-bold"
            style={{ color: brandColor }}
          >
            {subtitle}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item: any, idx: number) => (
            <div
              key={idx}
              className={`overflow-hidden relative h-56 group border border-white/10 shadow-lg ${radiusClass}`}
            >
              <img
                src={item.image || item.imageUrl}
                alt={item.title || "Gallery"}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                <span className="text-xs font-semibold text-white drop-shadow">
                  {item.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderAnnouncementSection = (section: WebsiteSection) => {
    const text =
      typeof section.content === "string"
        ? section.content
        : "🎉 Free express delivery across Tashkent on all orders over 100,000 UZS • Order direct for VIP rewards!";

    return (
      <div
        key={section.id}
        className="w-full px-4 py-2.5 text-center text-xs font-semibold tracking-wide text-white flex items-center justify-center gap-2 shadow-md"
        style={{ backgroundColor: brandColor }}
      >
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
        <span>{text}</span>
      </div>
    );
  };

  const renderSection = (section: WebsiteSection) => {
    switch (section.type) {
      case "announcement":
        return renderAnnouncementSection(section);
      case "hero":
        return renderHeroSection(section);
      case "about":
        return renderAboutSection(section);
      case "menu":
      case "menu_showcase":
        return renderMenuSection(section);
      case "table_selection":
        return renderTableSelectionSection(section);
      case "highlights":
      case "chef_highlights":
        return renderHighlightsSection(section);
      case "booking":
        return renderBookingSection(section);
      case "reviews":
        return renderReviewsSection(section);
      case "hours_location":
        return renderHoursLocationSection(section);
      case "gallery":
        return renderGallerySection(section);
      case "faq":
        return renderFaqSection(section);
      case "cta":
        return renderCtaSection(section);
      case "custom_widget":
      default:
        return (
          <div
            key={section.id}
            className={`border border-white/5 p-6 text-center text-xs text-gray-400 max-w-4xl mx-auto w-full ${radiusClass}`}
            style={{ backgroundColor: cardBg }}
          >
            <h4 className="font-bold text-white mb-1">{section.title}</h4>
            <p>{typeof section.content === "string" ? section.content : ""}</p>
          </div>
        );
    }
  };

  // Active modular sections in the EXACT order saved by the user
  const activeSections = useMemo(() => {
    if (!websiteConfig?.sections) {
      return DEFAULT_SECTIONS.filter((s) => s.enabled);
    }
    return websiteConfig.sections.filter((s) => s.enabled);
  }, [websiteConfig]);

  return (
    <div
      className="min-h-screen text-white flex flex-col"
      style={{
        backgroundColor: brandBg,
        color: textColor,
        fontFamily: fontStyle,
      }}
    >
      {/* Top Banner (if configured in hero settings or top delivery notice) */}
      {websiteConfig?.deliveryNotice && (
        <div
          className="px-4 py-2 text-center text-xs font-semibold tracking-wide text-white flex items-center justify-center gap-2 shadow-md"
          style={{ backgroundColor: brandColor }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{websiteConfig.deliveryNotice}</span>
        </div>
      )}

      {/* Top Sticky Navigation Bar */}
      <header
        className="border-b border-[rgba(255,255,255,0.08)] sticky top-0 z-40 shadow-xl backdrop-blur-md"
        style={{ backgroundColor: `${cardBg}ee` }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 flex items-center justify-center font-bold text-white shadow-md ${buttonRadiusClass}`}
              style={{ backgroundColor: brandColor }}
            >
              {restaurant.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold leading-tight text-white">
                {restaurant.name}
              </h1>
              <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                <span>{restaurant.cuisine}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Open Now</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Table Selection Quick Link */}
            <a
              href="#tables"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tables</span>
            </a>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`flex items-center gap-2.5 px-4 py-2 text-white font-medium text-xs transition-all shadow-lg hover:brightness-110 cursor-pointer ${buttonRadiusClass}`}
              style={{ backgroundColor: brandColor }}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {totalCartCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-black/30 font-mono text-[11px] font-bold">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Dynamic Modular Sections Rendered in Exact Config Sequence */}
      <main className="w-full flex-1 py-8 px-4 sm:px-6 space-y-12">
        {activeSections.map((section) => (
          <React.Fragment key={section.id}>
            {renderSection(section)}
          </React.Fragment>
        ))}
      </main>

      {/* Floating Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md border-l border-[rgba(255,255,255,0.08)] h-full overflow-y-auto p-6 flex flex-col justify-between"
            style={{ backgroundColor: cardBg }}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.06)]">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" style={{ color: brandColor }} />
                  <h3 className="font-bold text-white text-base">Your Order</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="py-4 space-y-3">
                {Object.values(cart).length > 0 ? (
                  Object.values(cart).map(({ item, quantity }) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[#0D1117] rounded-xl border border-[rgba(255,255,255,0.06)] flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-white">{item.name}</h4>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                          {formatUZS(item.price * quantity)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-[#161b22] rounded-lg p-1 border border-white/5">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-white cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono font-bold px-1 text-white">{quantity}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-5 h-5 flex items-center justify-center rounded text-white cursor-pointer"
                          style={{ backgroundColor: brandColor }}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500 text-xs">
                    Your cart is empty. Add dishes from the menu to start!
                  </div>
                )}
              </div>
            </div>

            {/* Cart Footer */}
            {totalCartCount > 0 && (
              <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal:</span>
                  <span className="font-mono font-bold text-white">{formatUZS(cartSubtotal)}</span>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className={`w-full py-3 text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all cursor-pointer ${buttonRadiusClass}`}
                  style={{ backgroundColor: brandColor }}
                >
                  Proceed to Checkout ({formatUZS(cartSubtotal)})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent
          className="max-w-md border-[rgba(255,255,255,0.08)] text-white p-6"
          style={{ backgroundColor: cardBg }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              Complete Your Order
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePlaceOrder} className="space-y-4 py-2 text-xs">
            <div className="flex gap-2 p-1 bg-[#0D1117] rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setOrderType("delivery")}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                  orderType === "delivery"
                    ? "text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
                style={
                  orderType === "delivery"
                    ? { backgroundColor: brandColor }
                    : undefined
                }
              >
                Delivery (+15,000 soʻm)
              </button>
              <button
                type="button"
                onClick={() => setOrderType("pickup")}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                  orderType === "pickup"
                    ? "text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
                style={
                  orderType === "pickup"
                    ? { backgroundColor: brandColor }
                    : undefined
                }
              >
                Pickup (Free)
              </button>
            </div>

            <div className="space-y-1">
              <Label className="text-gray-300">Your Full Name *</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Alisher Navoiy"
                required
                className="bg-[#0D1117] border-white/10 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-gray-300">Phone Number (Tashkent +998) *</Label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                required
                className="bg-[#0D1117] border-white/10 text-xs font-mono"
              />
            </div>

            {orderType === "delivery" && (
              <div className="space-y-1">
                <Label className="text-gray-300">Delivery Street Address *</Label>
                <Input
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. Yunusabad 19, Apt 4"
                  required
                  className="bg-[#0D1117] border-white/10 text-xs"
                />
              </div>
            )}

            <div className="p-3 bg-[#0D1117] rounded-xl border border-white/5 space-y-1.5 font-mono">
              <div className="flex justify-between text-gray-400">
                <span>Items:</span>
                <span>{formatUZS(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Delivery:</span>
                <span>{formatUZS(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-white/5">
                <span>Total:</span>
                <span style={{ color: brandColor }}>{formatUZS(orderTotal)}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingOrder}
                className={`w-full py-3 text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer ${buttonRadiusClass}`}
                style={{ backgroundColor: brandColor }}
              >
                {isSubmittingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending to Kitchen...
                  </>
                ) : (
                  `Place Order (${formatUZS(orderTotal)})`
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Table Reservation Dialog */}
      <Dialog open={isReserveModalOpen} onOpenChange={setIsReserveModalOpen}>
        <DialogContent
          className="max-w-md border-[rgba(255,255,255,0.08)] text-white p-6"
          style={{ backgroundColor: cardBg }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5" style={{ color: brandColor }} />
              <span>Reserve Table at {restaurant.name}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedTable && (
            <div className="p-3 bg-[#0D1117] rounded-xl border border-white/5 flex items-center justify-between text-xs">
              <div>
                <strong className="text-white block">{selectedTable.name}</strong>
                <span className="text-gray-400">{selectedTable.zone} • {selectedTable.seats} seats</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-400 bg-emerald-500/10">
                Available
              </span>
            </div>
          )}

          <form onSubmit={handleConfirmReservation} className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-gray-300">Your Full Name *</Label>
              <Input
                value={resCustomerName}
                onChange={(e) => setResCustomerName(e.target.value)}
                placeholder="e.g. Alisher Navoiy"
                required
                className="bg-[#0D1117] border-white/10 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-gray-300">Phone Number (+998) *</Label>
              <Input
                value={resCustomerPhone}
                onChange={(e) => setResCustomerPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                required
                className="bg-[#0D1117] border-white/10 text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-gray-300">Date *</Label>
                <Input
                  type="date"
                  value={resDate}
                  onChange={(e) => setResDate(e.target.value)}
                  className="bg-[#0D1117] border-white/10 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-300">Time Slot *</Label>
                <select
                  value={resTime}
                  onChange={(e) => setResTime(e.target.value)}
                  className="w-full bg-[#0D1117] border border-white/10 rounded-md p-2 text-white text-xs focus:outline-none"
                >
                  <option value="12:30">12:30 - Lunch</option>
                  <option value="14:00">14:00 - Afternoon</option>
                  <option value="18:30">18:30 - Early Dinner</option>
                  <option value="20:00">20:00 - Prime Evening</option>
                  <option value="21:30">21:30 - Late Night</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className={`w-full py-3 text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer ${buttonRadiusClass}`}
                style={{ backgroundColor: brandColor }}
              >
                <Check className="w-4 h-4" />
                <span>Confirm Reservation</span>
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reservation Confirmed Modal */}
      {confirmedReservationId && (
        <Dialog
          open={!!confirmedReservationId}
          onOpenChange={() => setConfirmedReservationId(null)}
        >
          <DialogContent
            className="max-w-md border-[rgba(255,255,255,0.08)] text-white p-6 text-center"
            style={{ backgroundColor: cardBg }}
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Table Reservation Confirmed!
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Your table is reserved. We look forward to hosting you at {restaurant.name}.
            </p>
            <div
              className="my-4 p-3 bg-[#0D1117] rounded-xl font-mono text-sm font-bold"
              style={{ color: brandColor }}
            >
              Booking Reference: #{confirmedReservationId}
            </div>
            <button
              onClick={() => setConfirmedReservationId(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
            >
              Done
            </button>
          </DialogContent>
        </Dialog>
      )}

      {/* Order Confirmation Modal */}
      {confirmedOrderNumber && (
        <Dialog
          open={!!confirmedOrderNumber}
          onOpenChange={() => setConfirmedOrderNumber(null)}
        >
          <DialogContent
            className="max-w-md border-[rgba(255,255,255,0.08)] text-white p-6 text-center"
            style={{ backgroundColor: cardBg }}
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Order Received!
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Your order is with the kitchen. We will prepare it right away.
            </p>
            <div
              className="my-4 p-3 bg-[#0D1117] rounded-xl font-mono text-sm font-bold"
              style={{ color: brandColor }}
            >
              Order ID: #{confirmedOrderNumber}
            </div>
            <button
              onClick={() => setConfirmedOrderNumber(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
            >
              Back to Menu
            </button>
          </DialogContent>
        </Dialog>
      )}

      {/* Storefront Footer */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] py-6 text-center text-xs text-gray-500">
        Powered by{" "}
        <span
          className="font-semibold"
          style={{ color: brandColor }}
        >
          Plately Workshop
        </span>{" "}
        • Direct Ordering Platform
      </footer>
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { Search, Plus, Clock } from "lucide-react";
import type { WebsiteSection, WebsiteThemeConfig, MenuShowcaseItem } from "@/lib/types/website";
import { formatUZS } from "@/lib/format";
import { getRadiusClass } from "./theme-utils";

interface MenuShowcaseSectionProps {
  section: WebsiteSection;
  config: WebsiteThemeConfig;
  isMobile?: boolean;
  onAddToCart?: (item: MenuShowcaseItem) => void;
}

const FALLBACK_MENU_ITEMS: MenuShowcaseItem[] = [
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
  {
    id: "m4",
    name: "Lagman Handmade Noodles",
    desc: "Hand-pulled long noodles with rich beef stew and crisp bell peppers.",
    price: 36000,
    category: "Main Dishes",
    tag: "Traditional",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=80",
    dietary: ["Halal"],
    prepTime: 15,
  },
  {
    id: "m5",
    name: "Samarkand Bread (Non)",
    desc: "Traditional clay-oven bread with nigella seeds and butter glaze.",
    price: 6000,
    category: "Somsa & Bakery",
    tag: "Hot & Fresh",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
    dietary: ["Halal", "Vegetarian"],
    prepTime: 5,
  },
  {
    id: "m6",
    name: "Kuk-Choy Teapot",
    desc: "Green tea with lemon, fresh mint, and Tashkent crystal sugar (navat).",
    price: 12000,
    category: "Beverages",
    tag: "Refreshing",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80",
    dietary: ["Halal", "Vegan"],
    prepTime: 5,
  },
];

export function MenuShowcaseSection({
  section,
  config,
  isMobile = false,
  onAddToCart,
}: MenuShowcaseSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const rawItems = (section.meta?.items as Record<string, unknown>[] | undefined) || FALLBACK_MENU_ITEMS;
  const items: MenuShowcaseItem[] = useMemo(() => {
    return rawItems.map((item, idx) => {
      const it = item as Record<string, unknown>;
      return {
        id: (it.id as string) || `dish-${idx}`,
        name: (it.name as string) || (it.title as string) || "Specialty Dish",
        desc: (it.desc as string) || (it.description as string) || "",
        price: typeof it.price === "number" ? it.price : 38000,
        category: (it.category as string) || "Main Dishes",
        image: (it.image as string) || (it.imageUrl as string) || "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500&auto=format&fit=crop&q=80",
        tag: it.tag as string | undefined,
        dietary: (it.dietary as string[]) || ["Halal"],
        prepTime: typeof it.prepTime === "number" ? it.prepTime : 15,
        isAvailable: it.isAvailable !== false,
      };
    });
  }, [rawItems]);

  const categories: string[] = useMemo(() => {
    if (section.meta?.categories && Array.isArray(section.meta.categories) && section.meta.categories.length > 0) {
      return section.meta.categories;
    }
    const catSet = new Set<string>(["All"]);
    items.forEach((it) => {
      if (it.category) catSet.add(it.category);
    });
    return Array.from(catSet);
  }, [section.meta, items]);

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const matchCat = activeCategory === "All" || it.category === activeCategory;
      const matchSearch =
        !searchQuery.trim() ||
        it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (it.desc && it.desc.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [items, activeCategory, searchQuery]);

  const cardRadius = getRadiusClass(config.borderRadius, "card");
  const btnRadius = getRadiusClass(config.borderRadius, "button");
  const badgeRadius = getRadiusClass(config.borderRadius, "badge");
  const inputRadius = getRadiusClass(config.borderRadius, "input");

  const showSearch = section.meta?.showSearch !== false;
  const contentText = typeof section.content === "string" ? section.content : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span
          className="text-xs font-bold uppercase tracking-widest inline-block"
          style={{ color: config.primaryColor }}
        >
          {section.subtitle || "PREPARED FRESH DAILY"}
        </span>
        <h2
          className={`font-extrabold text-white tracking-tight ${
            isMobile ? "text-xl sm:text-2xl" : "text-2xl md:text-4xl"
          }`}
        >
          {section.title || "Interactive Menu & Daily Specials"}
        </h2>
        {contentText && <p className="text-xs sm:text-sm text-slate-400">{contentText}</p>}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div
        className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white/[0.03] border border-white/10 ${cardRadius}`}
      >
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${btnRadius} ${
                activeCategory === cat
                  ? "text-white shadow-lg"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
              style={activeCategory === cat ? { backgroundColor: config.primaryColor } : {}}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        {showSearch && (
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes or ingredients..."
              className={`w-full bg-[#090d16] border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f98b25] ${inputRadius}`}
            />
          </div>
        )}
      </div>

      {/* Dishes Grid */}
      <div
        className={`grid gap-4 ${
          isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {filteredItems.map((dish) => (
          <div
            key={dish.id}
            className={`border border-white/10 overflow-hidden bg-slate-900/60 hover:border-white/20 transition-all flex flex-col justify-between group shadow-xl ${cardRadius}`}
          >
            {/* Dish Image */}
            {dish.image && (
              <div
                className={`bg-cover bg-center overflow-hidden relative ${
                  isMobile ? "h-44" : "h-40"
                }`}
                style={{ backgroundImage: `url(${dish.image})` }}
              >
                {dish.tag && (
                  <span
                    className={`absolute top-2.5 left-2.5 text-[10px] px-2.5 py-0.5 font-bold uppercase shadow-lg text-white ${badgeRadius}`}
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    {dish.tag}
                  </span>
                )}
                {dish.prepTime && (
                  <span className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-slate-300 flex items-center gap-1 font-mono">
                    <Clock className="w-2.5 h-2.5" />
                    {dish.prepTime} min
                  </span>
                )}
              </div>
            )}

            {/* Content Details */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-white leading-snug">
                    {dish.name}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-slate-400 shrink-0">
                    {dish.category}
                  </span>
                </div>

                {dish.desc && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {dish.desc}
                  </p>
                )}

                {dish.dietary && dish.dietary.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {dish.dietary.map((d, i) => (
                      <span
                        key={i}
                        className={`text-[9px] px-2 py-0.5 font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 ${badgeRadius}`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Price & Add Button */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span
                  className="font-extrabold text-sm sm:text-base font-mono"
                  style={{ color: config.primaryColor }}
                >
                  {formatUZS(dish.price)}
                </span>
                <button
                  type="button"
                  onClick={() => onAddToCart?.(dish)}
                  className={`px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-transform hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer ${btnRadius}`}
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-xs">
          No menu items found matching &ldquo;{searchQuery}&rdquo;. Try a different search.
        </div>
      )}
    </div>
  );
}

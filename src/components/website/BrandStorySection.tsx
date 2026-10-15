"use client";

import React from "react";
import type { WebsiteSection, WebsiteThemeConfig } from "@/lib/types/website";
import { getRadiusClass } from "./theme-utils";

interface BrandStorySectionProps {
  section: WebsiteSection;
  config: WebsiteThemeConfig;
  isMobile?: boolean;
}

export function BrandStorySection({
  section,
  config,
  isMobile = false,
}: BrandStorySectionProps) {
  const contentText = typeof section.content === "string" ? section.content : "";
  const story = config.aboutStory || contentText || "Rooted in culinary excellence, honoring the craft of fire, spices, and fresh ingredients.";
  const aboutImage =
    config.aboutImage ||
    section.meta?.imageUrl ||
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80";

  const badgeText = section.meta?.badge || "Family Owned • Est. 1998";
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

  const imgRadius = getRadiusClass(config.borderRadius, "image");
  const cardRadius = getRadiusClass(config.borderRadius, "card");
  const badgeRadius = getRadiusClass(config.borderRadius, "badge");

  return (
    <div
      className={`flex flex-col items-center gap-8 ${
        isMobile ? "" : "md:flex-row md:items-center gap-10 lg:gap-14"
      }`}
    >
      {/* Visual Image with Badge */}
      <div className={`relative ${isMobile ? "w-full" : "flex-1"}`}>
        <div
          className={`w-full overflow-hidden shadow-2xl border border-white/10 bg-cover bg-center ${imgRadius} ${
            isMobile ? "h-52 sm:h-64" : "h-72 md:h-88 lg:h-96"
          }`}
          style={{ backgroundImage: `url(${aboutImage})` }}
        />
        <div
          className={`absolute -bottom-3 -right-3 px-4 py-2 text-xs font-bold shadow-2xl border border-white/10 text-white ${badgeRadius}`}
          style={{ backgroundColor: config.primaryColor }}
        >
          {badgeText}
        </div>
      </div>

      {/* Story Content */}
      <div className={`space-y-4 ${isMobile ? "w-full text-center" : "flex-1"}`}>
        <span
          className="text-xs font-bold uppercase tracking-widest inline-block"
          style={{ color: config.primaryColor }}
        >
          {section.subtitle || "OUR HERITAGE"}
        </span>

        <h2
          className={`font-extrabold text-white tracking-tight ${
            isMobile ? "text-xl sm:text-2xl" : "text-2xl md:text-4xl"
          }`}
        >
          {section.title}
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{story}</p>

        {/* Feature Pills */}
        <div
          className={`pt-2 flex flex-wrap gap-2 text-xs text-slate-300 font-medium ${
            isMobile ? "justify-center" : "items-center"
          }`}
        >
          {features.map((feat, i) => (
            <span
              key={i}
              className={`px-3 py-1 bg-white/5 border border-white/10 ${badgeRadius}`}
            >
              ✓ {feat}
            </span>
          ))}
        </div>

        {/* Stats Row */}
        {stats && stats.length > 0 && (
          <div
            className={`grid grid-cols-3 gap-3 pt-4 border-t border-white/10 ${
              isMobile ? "text-center" : ""
            }`}
          >
            {stats.map((st, i) => (
              <div
                key={i}
                className={`p-3 bg-white/[0.03] border border-white/5 ${cardRadius}`}
              >
                <div
                  className="text-lg md:text-xl font-extrabold"
                  style={{ color: config.primaryColor }}
                >
                  {st.value}
                </div>
                <div className="text-[10px] md:text-xs text-slate-400 mt-0.5">{st.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

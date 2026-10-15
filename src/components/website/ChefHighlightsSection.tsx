"use client";

import React from "react";
import { ChefHat, Award, Flame } from "lucide-react";
import type { WebsiteSection, WebsiteThemeConfig } from "@/lib/types/website";
import { formatUZS } from "@/lib/format";
import { getRadiusClass } from "./theme-utils";

interface ChefHighlightsSectionProps {
  section: WebsiteSection;
  config: WebsiteThemeConfig;
  isMobile?: boolean;
}

export function ChefHighlightsSection({
  section,
  config,
  isMobile = false,
}: ChefHighlightsSectionProps) {
  const cardRadius = getRadiusClass(config.borderRadius, "card");
  const btnRadius = getRadiusClass(config.borderRadius, "button");
  const badgeRadius = getRadiusClass(config.borderRadius, "badge");
  const imgRadius = getRadiusClass(config.borderRadius, "image");

  const chefName = section.meta?.chefName;
  const chefTitle = section.meta?.chefTitle || "Executive Chef & Pitmaster";
  const chefImage =
    section.meta?.chefImage ||
    "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&auto=format&fit=crop&q=80";
  const experienceYears = section.meta?.experienceYears || 25;
  const quote =
    section.meta?.quote ||
    "Food is the truest expression of Uzbek warmth and hospitality. Every grain of rice and cut of meat carries centuries of tradition.";
  const specialties: string[] = section.meta?.specialties || [
    "Osh Plov Legend",
    "Clay Oven Craft",
    "Charcoal Grill Specialist",
  ];

  const items = (section.meta?.items as Record<string, unknown>[] | undefined) || [];
  const contentText = typeof section.content === "string" ? section.content : "";

  return (
    <div className="space-y-6">
      {/* Title & Subtitle */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span
          className="text-xs font-bold uppercase tracking-widest inline-block"
          style={{ color: config.primaryColor }}
        >
          {section.subtitle || "MASTERY OF THE TANDIR & FLAME"}
        </span>
        <h2
          className={`font-extrabold text-white tracking-tight ${
            isMobile ? "text-xl sm:text-2xl" : "text-2xl md:text-4xl"
          }`}
        >
          {section.title || (chefName ? "Meet Our Master Chef" : "Chef Highlights")}
        </h2>
        {contentText && <p className="text-xs sm:text-sm text-slate-400">{contentText}</p>}
      </div>

      {/* Master Chef Bio Card (if chef profile data is present) */}
      {chefName && (
        <div
          className={`border border-white/10 bg-slate-900/50 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-2xl ${cardRadius}`}
        >
          {/* Chef Portrait */}
          <div className="relative shrink-0">
            <div
              className={`w-36 h-36 md:w-48 md:h-48 overflow-hidden border-2 border-white/15 bg-cover bg-center shadow-xl ${imgRadius}`}
              style={{ backgroundImage: `url(${chefImage})` }}
            />
            <div
              className={`absolute -bottom-2 -right-2 px-3 py-1 text-xs font-bold shadow-lg text-white flex items-center gap-1 ${badgeRadius}`}
              style={{ backgroundColor: config.primaryColor }}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{experienceYears}+ Yrs</span>
            </div>
          </div>

          {/* Details */}
          <div className={`space-y-3 ${isMobile ? "text-center" : "text-left"} flex-1`}>
            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <ChefHat className="w-4 h-4" style={{ color: config.primaryColor }} />
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  {chefTitle}
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mt-0.5">{chefName}</h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
              &ldquo;{quote}&rdquo;
            </p>

            <div
              className={`flex flex-wrap gap-2 pt-1 ${
                isMobile ? "justify-center" : "justify-start"
              }`}
            >
              {specialties.map((spec, i) => (
                <span
                  key={i}
                  className={`text-xs px-3 py-1 bg-white/5 border border-white/10 text-slate-200 flex items-center gap-1.5 ${badgeRadius}`}
                >
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>{spec}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Curated Dishes Grid */}
      {items.length > 0 && (
        <div
          className={`grid gap-4 ${
            isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"
          }`}
        >
          {items.map((dish, i: number) => {
            const title = (dish.title as string) || (dish.name as string) || "Curated Special";
            const price = typeof dish.price === "number" ? dish.price : 38000;
            const image = (dish.image as string) || (dish.imageUrl as string);
            const tag = dish.tag as string | undefined;
            const desc = dish.desc as string | undefined;

            return (
              <div
                key={i}
                className={`border border-white/10 overflow-hidden bg-slate-900/60 hover:border-white/20 transition-all flex flex-col justify-between shadow-xl ${cardRadius}`}
              >
                {image && (
                  <div
                    className={`bg-cover bg-center ${isMobile ? "h-40" : "h-36"}`}
                    style={{ backgroundImage: `url(${image})` }}
                  />
                )}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-xs sm:text-sm text-white">{title}</h3>
                      {tag && (
                        <span
                          className={`text-[9px] px-2 py-0.5 font-bold uppercase ${badgeRadius}`}
                          style={{
                            backgroundColor: `${config.primaryColor}20`,
                            color: config.primaryColor,
                          }}
                        >
                          {tag}
                        </span>
                      )}
                    </div>
                    {desc && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{desc}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="font-bold text-xs sm:text-sm text-white font-mono">
                      {formatUZS(price)}
                    </span>
                    <button
                      type="button"
                      className={`px-3 py-1 text-xs font-semibold text-white cursor-pointer ${btnRadius}`}
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      + Order
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

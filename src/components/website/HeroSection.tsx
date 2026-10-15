"use client";

import React from "react";
import type { WebsiteSection, WebsiteThemeConfig } from "@/lib/types/website";
import { getRadiusClass } from "./theme-utils";

interface HeroSectionProps {
  section: WebsiteSection;
  config: WebsiteThemeConfig;
  isMobile?: boolean;
  onPrimaryCtaClick?: () => void;
  onSecondaryCtaClick?: () => void;
}

export function HeroSection({
  section,
  config,
  isMobile = false,
  onPrimaryCtaClick,
  onSecondaryCtaClick,
}: HeroSectionProps) {
  const contentText = typeof section.content === "string" ? section.content : "";
  const headline = config.heroHeadline || section.title || "Experience Fine Dining";
  const tagline = config.heroTagline || contentText || "Authentic culinary heritage and hospitality.";
  const primaryButtonText = config.heroButtonText || section.meta?.buttonText || "Order Online Now";
  const secondaryButtonText = section.meta?.secondaryButtonText || "Explore Full Menu";
  const heroImage =
    config.heroImage ||
    section.meta?.imageUrl ||
    "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=900&auto=format&fit=crop&q=80";

  const layout = isMobile ? "centered" : config.heroLayout || section.meta?.layout || "split";
  const btnRadius = getRadiusClass(config.borderRadius, "button");
  const imgRadius = getRadiusClass(config.borderRadius, "image");
  const badgeRadius = getRadiusClass(config.borderRadius, "badge");

  return (
    <div
      className={`flex flex-col ${
        layout === "split" && !isMobile
          ? "md:flex-row md:items-center gap-8 md:gap-12"
          : "items-center text-center max-w-3xl mx-auto gap-6"
      }`}
    >
      {/* Text Column */}
      <div className={`space-y-4 ${layout === "split" && !isMobile ? "flex-1" : "w-full"}`}>
        {section.meta?.badge && (
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 text-xs font-semibold tracking-wide uppercase ${badgeRadius}`}
            style={{
              backgroundColor: `${config.primaryColor}20`,
              color: config.primaryColor,
            }}
          >
            <span>{section.meta.badge}</span>
          </div>
        )}

        <h1
          className={`font-extrabold tracking-tight text-white leading-tight ${
            isMobile ? "text-2xl sm:text-3xl" : "text-3xl md:text-5xl lg:text-6xl"
          }`}
        >
          {headline}
        </h1>

        <p
          className={`text-slate-300 leading-relaxed ${
            isMobile ? "text-xs max-w-sm mx-auto" : "text-sm md:text-base max-w-xl"
          }`}
        >
          {tagline}
        </p>

        {/* CTA Buttons */}
        <div
          className={`pt-2 flex gap-3 ${
            isMobile ? "flex-col w-full" : layout === "split" ? "flex-row flex-wrap" : "justify-center flex-wrap"
          }`}
        >
          <button
            type="button"
            onClick={onPrimaryCtaClick}
            className={`font-bold text-white shadow-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer ${btnRadius} ${
              isMobile ? "w-full py-3 text-xs" : "px-7 py-3.5 text-sm"
            }`}
            style={{ backgroundColor: config.primaryColor }}
          >
            {primaryButtonText}
          </button>
          <button
            type="button"
            onClick={onSecondaryCtaClick}
            className={`font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors cursor-pointer ${btnRadius} ${
              isMobile ? "w-full py-2.5 text-xs" : "px-6 py-3.5 text-sm"
            }`}
          >
            {secondaryButtonText}
          </button>
        </div>
      </div>

      {/* Visual / Image Column */}
      {(layout === "split" || isMobile || heroImage) && (
        <div className={`relative ${layout === "split" && !isMobile ? "flex-1" : "w-full mt-2"}`}>
          <div
            className={`w-full overflow-hidden shadow-2xl border border-white/10 bg-cover bg-center ${imgRadius} ${
              isMobile ? "h-52 sm:h-60" : "h-72 md:h-96"
            }`}
            style={{ backgroundImage: `url(${heroImage})` }}
          />
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { Star, CheckCircle } from "lucide-react";
import type { WebsiteSection, WebsiteThemeConfig } from "@/lib/types/website";
import { getRadiusClass } from "./theme-utils";

interface ReviewsSectionProps {
  section: WebsiteSection;
  config: WebsiteThemeConfig;
  isMobile?: boolean;
}

const DEFAULT_REVIEWS = [
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

export function ReviewsSection({
  section,
  config,
  isMobile = false,
}: ReviewsSectionProps) {
  const cardRadius = getRadiusClass(config.borderRadius, "card");
  const badgeRadius = getRadiusClass(config.borderRadius, "badge");

  const rawReviews = (section.meta?.items as Record<string, unknown>[] | undefined) || DEFAULT_REVIEWS;
  const reviews = rawReviews.map((r, idx: number) => {
    const rObj = r as Record<string, unknown>;
    return {
      name: (rObj.title as string) || (rObj.name as string) || `Guest ${idx + 1}`,
      comment: (rObj.desc as string) || (rObj.description as string) || (rObj.comment as string) || "Exceptional food and hospitality!",
      tag: (rObj.tag as string) || "Verified Guest",
      rating: typeof rObj.rating === "number" ? rObj.rating : 5,
    };
  });

  const contentText = typeof section.content === "string" ? section.content : "";

  return (
    <div className="space-y-6">
      {/* Title & Subtitle */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span
          className="text-xs font-bold uppercase tracking-widest inline-block"
          style={{ color: config.primaryColor }}
        >
          {section.subtitle || "4.9 STARS ON GOOGLE & YANDEX"}
        </span>
        <h2
          className={`font-extrabold text-white tracking-tight ${
            isMobile ? "text-xl sm:text-2xl" : "text-2xl md:text-4xl"
          }`}
        >
          {section.title || "Loved by Tashkent Foodies"}
        </h2>
        {contentText && <p className="text-xs sm:text-sm text-slate-400">{contentText}</p>}
      </div>

      {/* Reviews Grid */}
      <div
        className={`grid gap-4 ${
          isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {reviews.map((rev, i: number) => (
          <div
            key={i}
            className={`border border-white/10 p-5 bg-slate-900/50 flex flex-col justify-between space-y-3.5 shadow-xl ${cardRadius}`}
          >
            {/* Stars */}
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(rev.rating || 5)].map((_, sI) => (
                <Star key={sI} className="w-3.5 h-3.5 fill-amber-400" />
              ))}
            </div>

            {/* Testimonial Quote */}
            <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
              &ldquo;{rev.comment}&rdquo;
            </p>

            {/* Diner Info */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span>{rev.name}</span>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              </span>
              <span
                className={`text-[10px] font-semibold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 ${badgeRadius}`}
              >
                {rev.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

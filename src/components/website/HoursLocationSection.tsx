"use client";

import React from "react";
import { Clock, MapPin, Phone, Compass, Navigation } from "lucide-react";
import type { WebsiteSection, WebsiteThemeConfig } from "@/lib/types/website";
import { getRadiusClass } from "./theme-utils";

interface HoursLocationSectionProps {
  section: WebsiteSection;
  config: WebsiteThemeConfig;
  isMobile?: boolean;
}

export function HoursLocationSection({
  section,
  config,
  isMobile = false,
}: HoursLocationSectionProps) {
  const cardRadius = getRadiusClass(config.borderRadius, "card");
  const btnRadius = getRadiusClass(config.borderRadius, "button");
  const badgeRadius = getRadiusClass(config.borderRadius, "badge");

  const meta = section.meta || {};
  const branchName = meta.branchName || "Central Outlet";
  const address = meta.address || "Amir Timur Street 24, Tashkent, Uzbekistan";
  const phone = meta.phone || "+998 71 200 00 00";
  const hours = meta.hours || "10:00 - 23:00 Daily";

  // Coordinates extraction: supports lat/lng, latitude/longitude, or PostGIS GeoJSON Point [lng, lat]
  const coords = meta.coordinates as Record<string, unknown> | undefined;
  const lat =
    (typeof coords?.lat === "number" ? coords.lat : undefined) ??
    (typeof coords?.latitude === "number" ? coords.latitude : undefined) ??
    (meta.postgisLocation?.coordinates ? meta.postgisLocation.coordinates[1] : 41.2995);

  const lng =
    (typeof coords?.lng === "number" ? coords.lng : undefined) ??
    (typeof coords?.longitude === "number" ? coords.longitude : undefined) ??
    (meta.postgisLocation?.coordinates ? meta.postgisLocation.coordinates[0] : 69.2401);

  const srid = typeof coords?.srid === "number" ? coords.srid : 4326;
  const deliveryRadiusKm = meta.deliveryRadiusKm || 12;

  // Operating Hours Schedule
  const schedule = (meta.schedule as { day: string; open: string; close: string }[] | undefined) || [
    { day: "Monday - Friday", open: "10:00", close: "23:00" },
    { day: "Saturday - Sunday", open: "10:00", close: "00:00" },
  ];

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  const contentText = typeof section.content === "string" ? section.content : "";

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span
          className="text-xs font-bold uppercase tracking-widest inline-block"
          style={{ color: config.primaryColor }}
        >
          {section.subtitle || "VISIT OUR BRANCHES"}
        </span>
        <h2
          className={`font-extrabold text-white tracking-tight ${
            isMobile ? "text-xl sm:text-2xl" : "text-2xl md:text-4xl"
          }`}
        >
          {section.title || "Hours & Location"}
        </h2>
        {contentText && <p className="text-xs sm:text-sm text-slate-400">{contentText}</p>}
      </div>

      {/* Main Location & Schedule Card */}
      <div
        className={`border border-white/10 bg-slate-900/60 p-6 md:p-8 shadow-2xl space-y-6 ${cardRadius}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Branch & Contact Info */}
          <div className="space-y-4">
            <div className="space-y-1">
              <span
                className={`text-[10px] font-bold uppercase px-2.5 py-0.5 ${badgeRadius}`}
                style={{
                  backgroundColor: `${config.primaryColor}20`,
                  color: config.primaryColor,
                }}
              >
                {branchName}
              </span>
              <h3 className="text-lg md:text-xl font-bold text-white pt-1">{address}</h3>
            </div>

            <div className="space-y-2 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{hours}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Delivery Radius: Up to {deliveryRadiusKm} km across Tashkent</span>
              </div>
            </div>

            {/* PostGIS Coordinate Badge */}
            <div
              className={`p-3 bg-black/40 border border-white/10 space-y-1 font-mono text-xs ${cardRadius}`}
            >
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="flex items-center gap-1.5 font-sans font-semibold text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>PostGIS Coordinates (EPSG:{srid})</span>
                </span>
                <span className="text-emerald-400 text-[10px] uppercase font-bold">Verified</span>
              </div>
              <div className="text-white text-xs">
                Latitude: <span className="text-amber-400">{lat}° N</span> • Longitude:{" "}
                <span className="text-amber-400">{lng}° E</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                GeoJSON POINT({lng} {lat})
              </div>
            </div>
          </div>

          {/* Operating Hours Weekly Schedule */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Weekly Service Schedule</span>
            </h4>

            <div className={`divide-y divide-white/5 bg-black/30 border border-white/5 ${cardRadius}`}>
              {schedule.map((slot, idx: number) => (
                <div
                  key={idx}
                  className="px-4 py-2.5 flex items-center justify-between text-xs"
                >
                  <span className="text-slate-300 font-medium">{slot.day}</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {slot.open} – {slot.close}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={mapsLink}
                target="_blank"
                rel="noreferrer"
                className={`flex-1 py-3 px-4 text-xs font-bold text-white shadow-xl transition-transform hover:scale-102 text-center flex items-center justify-center gap-2 cursor-pointer ${btnRadius}`}
                style={{ backgroundColor: config.primaryColor }}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Get Driving Directions</span>
              </a>
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className={`py-3 px-4 text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer ${btnRadius}`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Branch</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { ChefHat, Check } from "lucide-react";
import type { WebsiteSection, WebsiteThemeConfig, TableItem } from "@/lib/types/website";
import { DEFAULT_FLOORPLAN_TABLES } from "@/lib/types/website";
import { getRadiusClass } from "./theme-utils";

interface FloorPlanSectionProps {
  section: WebsiteSection;
  config: WebsiteThemeConfig;
  isMobile?: boolean;
  selectedTableId?: string;
  onTableSelect?: (table: TableItem) => void;
  onReservationConfirm?: (table: TableItem, timeSlot: string) => void;
}

export function FloorPlanSection({
  section,
  config,
  isMobile = false,
  selectedTableId: externalSelectedTableId,
  onTableSelect,
  onReservationConfirm,
}: FloorPlanSectionProps) {
  const tables: TableItem[] = section.meta?.tables || DEFAULT_FLOORPLAN_TABLES;
  const zones: string[] = section.meta?.zones || [
    "All Zones",
    "Window Booths",
    "Main Dining",
    "Private Lounge",
    "Bar Area",
  ];

  const [internalSelectedId, setInternalSelectedId] = useState<string>("t1");
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>("All Zones");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("19:30");

  const currentSelectedId = externalSelectedTableId || internalSelectedId;
  const activeTable = tables.find((t) => t.id === currentSelectedId) || tables[0];

  const filteredTables =
    selectedZoneFilter === "All Zones"
      ? tables
      : tables.filter((t) => t.zone === selectedZoneFilter);

  const cardRadius = getRadiusClass(config.borderRadius, "card");
  const btnRadius = getRadiusClass(config.borderRadius, "button");
  const badgeRadius = getRadiusClass(config.borderRadius, "badge");

  const handleTableClick = (table: TableItem) => {
    if (table.status === "reserved") {
      return;
    }
    setInternalSelectedId(table.id);
    onTableSelect?.(table);
  };

  const contentText = typeof section.content === "string" ? section.content : "";

  return (
    <div className="space-y-6">
      {/* Title & Subtitle */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span
          className={`text-xs font-bold uppercase tracking-widest px-3 py-1 border border-white/10 inline-block ${badgeRadius}`}
          style={{
            backgroundColor: `${config.primaryColor}15`,
            color: config.primaryColor,
          }}
        >
          {section.subtitle || "LIVE ARCHITECTURAL SEATING"}
        </span>
        <h2
          className={`font-extrabold text-white tracking-tight ${
            isMobile ? "text-xl sm:text-2xl" : "text-2xl md:text-4xl"
          }`}
        >
          {section.title || "Interactive Floor Plan & Table Selection"}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          {contentText ||
            "Select your preferred dining table, window booth, or bar seat with live architectural availability."}
        </p>
      </div>

      {/* Zone Filters & Status Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-white/[0.06] pb-3">
        {/* Zone Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {zones.map((zone) => (
            <button
              key={zone}
              type="button"
              onClick={() => setSelectedZoneFilter(zone)}
              className={`px-3 py-1 text-xs font-semibold transition-all shrink-0 cursor-pointer ${btnRadius} ${
                selectedZoneFilter === zone
                  ? "text-white shadow-md"
                  : "bg-white/5 text-slate-400 hover:text-white border border-white/5"
              }`}
              style={selectedZoneFilter === zone ? { backgroundColor: config.primaryColor } : {}}
            >
              {zone}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span>Available</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span>Reserved</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full border-2"
              style={{ borderColor: config.primaryColor }}
            />
            <span>Selected</span>
          </span>
        </div>
      </div>

      {/* Blueprint Canvas */}
      <div
        className={`relative w-full bg-[#090d16] border border-white/10 p-4 md:p-6 overflow-hidden shadow-2xl ${cardRadius}`}
      >
        {/* Blueprint Grid Texture */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Architectural Boundaries & Walls */}
        <div className="relative z-10 w-full min-h-[380px] md:min-h-[460px] border border-dashed border-white/20 rounded-xl p-3 flex flex-col justify-between">
          {/* Top Wall */}
          <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-widest text-slate-500 border-b border-white/10 pb-1">
            <span className="flex items-center gap-1">🪟 PANORAMIC WINDOW BOOTHS</span>
            <span className="text-amber-400/80">VIP PRIVATE SUITE (BOOTH 8) →</span>
          </div>

          {/* Tables Area */}
          <div className="relative flex-1 min-h-[300px] md:min-h-[380px] my-2">
            {/* Kitchen Marker */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-24 md:w-28 h-32 md:h-36 border border-white/10 rounded-lg bg-white/[0.02] p-2 flex flex-col items-center justify-center text-center pointer-events-none">
              <ChefHat className="w-5 h-5 text-slate-600 mb-1" />
              <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                KITCHEN
              </span>
              <span className="text-[8px] text-slate-600">Staff Pass Only</span>
            </div>

            {/* Tables */}
            {filteredTables.map((table) => {
              const isSelected = currentSelectedId === table.id;
              const isReserved = table.status === "reserved";

              return (
                <div
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 group select-none ${
                    table.shape === "bar"
                      ? "w-28 md:w-36 h-12 md:h-14"
                      : table.seats >= 6
                      ? "w-20 md:w-24 h-16 md:h-20"
                      : "w-16 md:w-18 h-14 md:h-16"
                  }`}
                  style={{
                    left: `${table.x}%`,
                    top: `${table.y}%`,
                  }}
                >
                  <div
                    className={`w-full h-full border flex flex-col items-center justify-center p-1 relative transition-all ${
                      config.borderRadius === "sharp"
                        ? "rounded-none"
                        : table.shape === "round"
                        ? "rounded-full"
                        : config.borderRadius === "pill"
                        ? "rounded-2xl"
                        : "rounded-xl"
                    } ${
                      isSelected
                        ? "shadow-xl ring-4 ring-offset-2 ring-offset-[#090d16] scale-105"
                        : isReserved
                        ? "bg-slate-900/60 border-rose-500/40 opacity-70"
                        : "bg-[#141a24] border-white/20 hover:border-emerald-400/80 hover:scale-105 shadow-md"
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${config.primaryColor}25`,
                            borderColor: config.primaryColor,
                            boxShadow: `0 0 25px ${config.primaryColor}50`,
                          }
                        : {}
                    }
                  >
                    {/* Chairs */}
                    {table.shape !== "bar" && (
                      <>
                        <div className="absolute -top-1.5 inset-x-2 flex justify-around pointer-events-none">
                          {[...Array(Math.ceil(table.seats / 2))].map((_, i) => (
                            <span
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-slate-500/80"
                            />
                          ))}
                        </div>
                        <div className="absolute -bottom-1.5 inset-x-2 flex justify-around pointer-events-none">
                          {[...Array(Math.floor(table.seats / 2))].map((_, i) => (
                            <span
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-slate-500/80"
                            />
                          ))}
                        </div>
                      </>
                    )}

                    <div className="text-[11px] font-bold text-white leading-tight flex items-center gap-1">
                      <span>{table.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      {table.shape === "bar" ? "5 Stools" : `${table.seats} Seats`}
                    </div>

                    <span
                      className={`text-[8px] font-bold uppercase px-1.5 py-0.2 rounded mt-0.5 ${
                        isReserved
                          ? "bg-rose-500/20 text-rose-400"
                          : isSelected
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-white/10 text-slate-300"
                      }`}
                    >
                      {isReserved ? "Booked" : isSelected ? "Selected" : "Open"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Wall */}
          <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-widest text-slate-500 border-t border-white/10 pt-1">
            <span>← COURTYARD PATIO</span>
            <span className="flex items-center gap-1 text-emerald-400">
              🚪 MAIN ENTRANCE & FOYER
            </span>
            <span>RESTROOMS 🚻</span>
          </div>
        </div>
      </div>

      {/* Active Table Booking Action Card */}
      {activeTable && (
        <div
          className={`border border-white/15 p-5 md:p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ${cardRadius}`}
          style={{ backgroundColor: `${config.cardColor || "#161b22"}e6` }}
        >
          <div className="space-y-2 text-left w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full animate-ping"
                style={{ backgroundColor: config.primaryColor }}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Selected Table:
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h3 className="text-xl md:text-2xl font-extrabold text-white">
                {activeTable.name}
              </h3>
              <span
                className={`text-xs px-2.5 py-0.5 font-bold uppercase ${badgeRadius}`}
                style={{
                  backgroundColor: `${config.primaryColor}25`,
                  color: config.primaryColor,
                }}
              >
                {activeTable.zone}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 bg-white/10 text-slate-300 font-medium ${badgeRadius}`}
              >
                Up to {activeTable.seats} Guests
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Includes complimentary tea service, dedicated table server, and immediate seating upon arrival.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 w-full md:w-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Select Time:
            </span>
            <div className="flex items-center gap-1.5">
              {["17:00", "18:30", "19:30", "20:30", "21:30"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTimeSlot(t)}
                  className={`px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${btnRadius} ${
                    selectedTimeSlot === t
                      ? "text-white shadow-lg"
                      : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                  }`}
                  style={selectedTimeSlot === t ? { backgroundColor: config.primaryColor } : {}}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={activeTable.status === "reserved"}
            onClick={() => {
              if (activeTable.status === "reserved") return;
              onReservationConfirm?.(activeTable, selectedTimeSlot);
            }}
            className={`w-full md:w-auto px-8 py-3.5 font-bold text-sm text-white shadow-2xl transition-all shrink-0 ${btnRadius} ${
              activeTable.status === "reserved"
                ? "opacity-50 cursor-not-allowed"
                : "hover:scale-105 cursor-pointer"
            }`}
            style={{ backgroundColor: config.primaryColor }}
          >
            {activeTable.status === "reserved"
              ? `Table ${activeTable.name} is Reserved`
              : `Confirm ${activeTable.name} (${selectedTimeSlot})`}
          </button>
        </div>
      )}
    </div>
  );
}

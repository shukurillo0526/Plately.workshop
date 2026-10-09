"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useBranchStore } from "@/stores/branch-store";
import { useAuthStore } from "@/stores/auth-store";
import { useLanguageStore } from "@/stores/language-store";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  ChevronDown,
  Building2,
  Check,
  Plus,
  Settings,
  MapPin,
} from "lucide-react";

export function BranchSwitcher() {
  const { user } = useAuthStore();
  const { branches, selectedBranchId, selectBranch, setBranches, getSelectedBranch } = useBranchStore();
  const { t } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const restaurantId = user?.restaurant_id;
  const activeBranch = getSelectedBranch();

  // Load branches if not loaded
  useEffect(() => {
    if (!restaurantId) return;

    async function loadBranches() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("branches")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .order("created_at", { ascending: true });

        if (!error && data && data.length > 0) {
          setBranches(
            data.map((b) => ({
              id: b.id,
              name: b.name,
              address: b.address || "",
              phone: b.phone || null,
              timezone: b.timezone || "Asia/Tashkent",
              is_active: b.is_active,
              accepts_delivery: b.accepts_delivery,
              accepts_pickup: b.accepts_pickup,
              accepts_dine_in: b.accepts_dine_in ?? true,
              default_prep_time_minutes: b.default_prep_time_minutes || 15,
            }))
          );
        }
      } catch (err) {
        console.warn("[BranchSwitcher] Failed to fetch branches:", err);
      }
    }

    if (branches.length === 0) {
      loadBranches();
    }
  }, [restaurantId, branches.length, setBranches]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (branchId: string, name: string) => {
    selectBranch(branchId);
    setIsOpen(false);
    toast.success(`${t("header.branch_switched", "Switched location to")} ${name}`);
  };

  const displayName = activeBranch?.name || t("header.main_branch", "Main Branch");

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#161b22] border border-[rgba(255,255,255,0.08)] rounded-full text-gray-300 hover:text-white hover:border-[rgba(255,255,255,0.2)] transition-all cursor-pointer focus:outline-none"
        title="Switch Branch Location"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Building2 className="w-3 h-3 text-[#f98b25]" />
        <span className="font-medium max-w-[140px] truncate">{displayName}</span>
        <ChevronDown
          className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-[#161b22] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl">
          <div className="px-3 py-1.5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {t("header.branches", "Locations & Branches")}
            </span>
            <span className="text-[10px] text-gray-500 bg-[#0D1117] px-1.5 py-0.5 rounded">
              {branches.length || 1}
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto py-1 space-y-0.5">
            {branches.length > 0 ? (
              branches.map((b) => {
                const isSelected = b.id === (selectedBranchId || branches[0]?.id);
                return (
                  <button
                    key={b.id}
                    onClick={() => handleSelect(b.id, b.name)}
                    className={`w-full flex items-start justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#f98b25]/15 text-white font-medium"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="truncate">{b.name}</span>
                        {!b.is_active && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-red-500/20 text-red-400">
                            Inactive
                          </span>
                        )}
                      </div>
                      {b.address && (
                        <p className="text-[10px] text-gray-400 truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          {b.address}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#f98b25] shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-xs text-gray-400">
                <div className="flex items-center justify-between">
                  <span>{displayName}</span>
                  <Check className="w-4 h-4 text-[#f98b25]" />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Default primary location</p>
              </div>
            )}
          </div>

          <div className="pt-1.5 mt-1 border-t border-[rgba(255,255,255,0.06)] px-2 space-y-1">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#f98b25]" />
              <span>{t("header.add_branch", "Add New Branch")}</span>
            </Link>
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{t("header.manage_branches", "Manage Locations")}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

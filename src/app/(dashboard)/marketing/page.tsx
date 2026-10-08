"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  Ticket,
  Sparkles,
  TrendingUp,
  Clock,
  Copy,
  Plus,
  Send,
  Check,
  Percent,
  Calendar,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatUZS } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import {
  predictHourlyDemand,
  generateMarketingCampaignDraft,
  type DemandPrediction,
  type MarketingCampaignDraft,
} from "@/lib/ai/intelligence";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Language } from "@/lib/i18n/types";

interface PromoItem {
  id: string;
  code: string;
  title: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue: number;
  usageCount: number;
  usageLimit: number | null;
  isActive: boolean;
  expiresAt: string | null;
}

const SAMPLE_PROMOS: PromoItem[] = [
  {
    id: "PROMO-1",
    code: "YANGI20",
    title: "Welcome 20% Discount",
    discountType: "percentage",
    discountValue: 20,
    minOrderValue: 80000,
    usageCount: 48,
    usageLimit: 100,
    isActive: true,
    expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
  },
  {
    id: "PROMO-2",
    code: "PLATOVOZ",
    title: "Free Delivery Surcharge Voucher",
    discountType: "fixed",
    discountValue: 15000,
    minOrderValue: 120000,
    usageCount: 112,
    usageLimit: 500,
    isActive: true,
    expiresAt: null,
  },
  {
    id: "PROMO-3",
    code: "LUNCH10",
    title: "Lunch Rush 10% Off",
    discountType: "percentage",
    discountValue: 10,
    minOrderValue: 50000,
    usageCount: 230,
    usageLimit: null,
    isActive: false,
    expiresAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export default function MarketingPage() {
  const { user } = useAuthStore();
  const [promos, setPromos] = useState<PromoItem[]>(SAMPLE_PROMOS);
  const [demandHours, setDemandHours] = useState<DemandPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // AI Campaign Generator State
  const [aiTitle, setAiTitle] = useState("Osh & Kebab Weekend");
  const [aiDiscount, setAiDiscount] = useState("15% chegirma");
  const [aiPlatform, setAiPlatform] = useState<"telegram" | "instagram" | "sms">("telegram");
  const [aiLang, setAiLang] = useState<Language>("uz");
  const [aiDraft, setAiDraft] = useState<MarketingCampaignDraft | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // New Promo Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"percentage" | "fixed">("percentage");
  const [newValue, setNewValue] = useState(15);
  const [newMinOrder, setNewMinOrder] = useState(60000);

  const restaurantId = user?.restaurant_id;

  // Load Promotions
  const loadPromotions = useCallback(async () => {
    if (!restaurantId) {
      setPromos(SAMPLE_PROMOS);
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        setPromos(
          data.map((p) => ({
            id: p.id,
            code: p.code,
            title: p.title,
            discountType: p.discount_type,
            discountValue: Number(p.discount_value),
            minOrderValue: Number(p.min_order_value) || 0,
            usageCount: p.usage_count || 0,
            usageLimit: p.usage_limit || null,
            isActive: p.is_active ?? true,
            expiresAt: p.expires_at || null,
          }))
        );
      } else {
        setPromos(SAMPLE_PROMOS);
      }
    } catch (err) {
      console.warn("[Marketing] Error loading promotions:", err);
      setPromos(SAMPLE_PROMOS);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadPromotions();
    setDemandHours(predictHourlyDemand());
  }, [loadPromotions]);

  // Generate initial draft
  useEffect(() => {
    const draft = generateMarketingCampaignDraft(
      "Sheikh Al-Hawk",
      aiTitle,
      aiDiscount,
      aiPlatform,
      aiLang
    );
    setAiDraft(draft);
  }, [aiTitle, aiDiscount, aiPlatform, aiLang]);

  const handleCopyDraft = () => {
    if (!aiDraft) return;
    navigator.clipboard.writeText(aiDraft.body);
    setIsCopied(true);
    toast.success("Marketing copy copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newTitle.trim()) {
      toast.error("Please enter a promo code and title");
      return;
    }

    const payload = {
      code: newCode.trim().toUpperCase(),
      title: newTitle.trim(),
      discount_type: newType,
      discount_value: Number(newValue),
      min_order_value: Number(newMinOrder) || 0,
      is_active: true,
    };

    if (restaurantId) {
      try {
        const supabase = createClient();
        const { error } = await supabase.from("promotions").insert({
          restaurant_id: restaurantId,
          ...payload,
        });

        if (error) throw error;
        toast.success(`Promo code "${payload.code}" published!`);
      } catch (err: any) {
        toast.error(err?.message || "Failed to create promo code");
        return;
      }
    } else {
      setPromos((prev) => [
        {
          id: `PROMO-${Date.now()}`,
          code: payload.code,
          title: payload.title,
          discountType: payload.discount_type,
          discountValue: payload.discount_value,
          minOrderValue: payload.min_order_value,
          usageCount: 0,
          usageLimit: null,
          isActive: true,
          expiresAt: null,
        },
        ...prev,
      ]);
      toast.success("Promo code added (demo mode)");
    }

    setIsCreateOpen(false);
    setNewCode("");
    setNewTitle("");
    loadPromotions();
  };

  const handleTogglePromo = async (id: string, current: boolean) => {
    setPromos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p))
    );

    if (restaurantId && !id.startsWith("PROMO-")) {
      try {
        const supabase = createClient();
        await supabase
          .from("promotions")
          .update({ is_active: !current })
          .eq("id", id);
      } catch (err) {
        console.warn("[Marketing] Toggle promo error:", err);
      }
    }
    toast.success(`Promo code ${!current ? "activated" : "paused"}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-[family-name:var(--font-display)] flex items-center gap-2">
            <Megaphone className="w-8 h-8 text-[#f98b25]" /> Marketing & Growth Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Create discount promo codes, generate AI social campaigns, and optimize peak-hour demand.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-[#f98b25] hover:bg-[#e07b1d] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-[#f98b25]/20"
        >
          <Plus className="w-4 h-4" /> Create Promo Code
        </button>
      </div>

      {/* Grid: AI Campaign Drafter & Demand Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Social Drafter */}
        <div className="lg:col-span-2 bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 font-[family-name:var(--font-display)]">
                <Sparkles className="w-5 h-5 text-amber-400" /> AI Campaign Drafter
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Draft localized, high-converting copy for Telegram, Instagram, and SMS.
              </p>
            </div>

            {/* Platform pills */}
            <div className="flex gap-1 bg-[#0D1117] p-1 rounded-lg border border-[rgba(255,255,255,0.04)]">
              {(["telegram", "instagram", "sms"] as const).map((plat) => (
                <button
                  key={plat}
                  onClick={() => setAiPlatform(plat)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                    aiPlatform === plat
                      ? "bg-[#f98b25] text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {plat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Campaign Theme</Label>
              <Input
                value={aiTitle}
                onChange={(e) => setAiTitle(e.target.value)}
                placeholder="e.g. Osh Weekend"
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-xs h-9 text-white focus:border-[#f98b25]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Offer Value</Label>
              <Input
                value={aiDiscount}
                onChange={(e) => setAiDiscount(e.target.value)}
                placeholder="e.g. 20% chegirma"
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-xs h-9 text-white focus:border-[#f98b25]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Language</Label>
              <div className="flex gap-1 h-9">
                {(["uz", "ru", "en"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setAiLang(lang)}
                    className={`flex-1 rounded-md text-xs font-bold uppercase transition-colors ${
                      aiLang === lang
                        ? "bg-slate-700 text-white border border-[#f98b25]"
                        : "bg-[#0D1117] text-slate-400 hover:text-white border border-[rgba(255,255,255,0.08)]"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Result Preview Box */}
          {aiDraft && (
            <div className="relative bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 font-sans text-xs text-slate-200 whitespace-pre-line leading-relaxed">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[rgba(255,255,255,0.06)]">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Draft Preview ({aiPlatform.toUpperCase()} • {aiLang.toUpperCase()})
                </span>
                <button
                  onClick={handleCopyDraft}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1 rounded text-xs transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopied ? "Copied" : "Copy Post"}
                </button>
              </div>

              <div>{aiDraft.body}</div>
            </div>
          )}
        </div>

        {/* Demand Intelligence Card */}
        <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-4 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2 font-[family-name:var(--font-display)]">
                <TrendingUp className="w-5 h-5 text-emerald-400" /> Demand Intelligence
              </h2>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Tashkent Rush Engine
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Predicted order surges for today based on regional dining patterns:
            </p>

            <div className="space-y-2.5">
              {demandHours.slice(1, 6).map((item) => (
                <div
                  key={item.hour}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#0D1117] border border-[rgba(255,255,255,0.04)] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-medium text-white">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-300 font-bold">~{item.predictedOrders} orders</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        item.trend === "peak"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {item.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)] text-[11px] text-slate-400">
            <span className="text-amber-400 font-semibold">💡 Recommended:</span> Stage delivery dispatchers 15 minutes before 12:00 and 19:00 peaks.
          </div>
        </div>
      </div>

      {/* Active Promo Codes Table */}
      <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-display)] flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#f98b25]" /> Active Promo Codes & Discounts
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Discounts applied automatically on your branded storefront checkout.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0D1117] text-slate-400 uppercase font-semibold border-b border-[rgba(255,255,255,0.06)]">
              <tr>
                <th className="px-6 py-3.5">Promo Code</th>
                <th className="px-6 py-3.5">Title</th>
                <th className="px-6 py-3.5">Discount</th>
                <th className="px-6 py-3.5">Min Order</th>
                <th className="px-6 py-3.5">Redemptions</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {promos.map((promo) => (
                <tr key={promo.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-white">
                    <span className="bg-[#0D1117] border border-[rgba(249,139,37,0.3)] text-[#f98b25] px-2.5 py-1 rounded">
                      {promo.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-200 font-medium">{promo.title}</td>
                  <td className="px-6 py-4 font-semibold text-emerald-400">
                    {promo.discountType === "percentage"
                      ? `${promo.discountValue}% OFF`
                      : `${formatUZS(promo.discountValue)} OFF`}
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono">
                    {promo.minOrderValue > 0 ? formatUZS(promo.minOrderValue) : "No minimum"}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {promo.usageCount} {promo.usageLimit ? `/ ${promo.usageLimit}` : "used"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        promo.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-slate-700/20 text-slate-400 border-slate-700/30"
                      }`}
                    >
                      {promo.isActive ? "Active" : "Paused"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleTogglePromo(promo.id, promo.isActive)}
                      className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
                        promo.isActive
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                          : "bg-[#f98b25] hover:bg-[#e07b1d] text-white"
                      }`}
                    >
                      {promo.isActive ? "Pause" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Promo Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md bg-[#161b22] border-[rgba(255,255,255,0.08)] text-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-[family-name:var(--font-display)] flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#f98b25]" /> New Promo Code
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreatePromo} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Code (e.g. TASHKENT20) *</Label>
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="PROMOCODE"
                required
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] uppercase font-mono focus:border-[#f98b25]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Offer Title *</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. 15% off first order"
                required
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Discount Type</Label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full h-10 rounded-md bg-[#0D1117] border border-[rgba(255,255,255,0.08)] px-3 text-sm text-white focus:outline-none focus:border-[#f98b25]"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed UZS (so'm)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Discount Value *</Label>
                <Input
                  type="number"
                  min="1"
                  value={newValue}
                  onChange={(e) => setNewValue(Number(e.target.value))}
                  required
                  className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Min Order Value (UZS)</Label>
              <Input
                type="number"
                min="0"
                step="5000"
                value={newMinOrder}
                onChange={(e) => setNewMinOrder(Number(e.target.value))}
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#f98b25] hover:bg-[#e07b1d] text-white text-sm font-semibold"
              >
                Save & Launch
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

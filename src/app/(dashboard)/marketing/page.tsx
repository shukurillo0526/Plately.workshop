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
  Video,
  Film,
  Image as ImageIcon,
  Flame,
  CheckCircle2,
  Globe,
  Eye,
  Share2,
  Compass,
  Layers,
  Bot,
  Play,
  ExternalLink,
  RefreshCw,
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

interface UzbekFoodPreset {
  label: string;
  type: "reel" | "story" | "post";
  title: string;
  caption: string;
  mediaUrl: string;
  tags: string;
}

const UZBEK_FOOD_PRESETS: UzbekFoodPreset[] = [
  {
    label: "Wedding Plov Reel",
    type: "reel",
    title: "Signature Samarkand Wedding Plov",
    caption: "Slow-cooked for 4 hours with tender beef, golden carrots, fragrant barberries, and roasted cumin. Served piping hot every day at Kamolon!",
    mediaUrl: "https://www.youtube.com/watch?v=ZX3gH0BSTR4",
    tags: "plov,uzbek,kamolon,tashkent,nationalfood,halal",
  },
  {
    label: "Hot Tandir Somsa Story",
    type: "story",
    title: "Tandir Somsa Fresh Out of Clay Oven",
    caption: "Crispy, juicy hand-cut beef somsa fresh out of our clay oven right now! Order in the Plately app for delivery in under 30 mins 🔥",
    mediaUrl: "https://images.unsplash.com/photo-1541544741938-0af808871cc0",
    tags: "somsa,tandir,fresh,hotfood,kamolon",
  },
  {
    label: "Charcoal Shashlik Special",
    type: "post",
    title: "Charcoal-Grilled Lamb Kebab Special",
    caption: "Marinated overnight in natural mountain herbs and grilled to perfection over applewood charcoal. Served with fresh flatbread and marinated white onions!",
    mediaUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
    tags: "shashlik,kebab,bbq,meatlovers,kamolon,uzbekistan",
  },
  {
    label: "Hand-Pulled Lagman Reel",
    type: "reel",
    title: "Hand-Pulled Uyghur Lagman in Action",
    caption: "Watch our master chef stretch and pull fresh noodles to order. Rich aromatic beef broth and fresh bell peppers!",
    mediaUrl: "https://www.youtube.com/watch?v=vsJtg5_sSHE",
    tags: "lagman,noodles,handmade,traditional,foodie",
  },
];

export default function MarketingPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"explore" | "promos" | "campaigns">("explore");
  const [promos, setPromos] = useState<PromoItem[]>(SAMPLE_PROMOS);
  const [demandHours, setDemandHours] = useState<DemandPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Content Studio / Explore Publisher State
  const [contentType, setContentType] = useState<"reel" | "story" | "post">("reel");
  const [contentTitle, setContentTitle] = useState("Signature Samarkand Wedding Plov");
  const [contentCaption, setContentCaption] = useState(
    "Slow-cooked for 4 hours with tender beef, golden carrots, fragrant barberries, and roasted cumin. Served piping hot every day at Kamolon!"
  );
  const [contentMediaUrl, setContentMediaUrl] = useState("https://www.youtube.com/watch?v=ZX3gH0BSTR4");
  const [contentTags, setContentTags] = useState("plov,uzbek,kamolon,tashkent,nationalfood,halal");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiPromptTopic, setAiPromptTopic] = useState("Authentic Wedding Plov with beef and yellow carrots");

  // AI Campaign Generator State (Legacy/External)
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

  const restaurantId = user?.restaurant_id || "7e1dd08c-c95d-496b-86d0-f7b40d7f9cdf";

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

  // Generate initial legacy draft
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

  // Select Preset
  const handleApplyPreset = (p: UzbekFoodPreset) => {
    setContentType(p.type);
    setContentTitle(p.title);
    setContentCaption(p.caption);
    setContentMediaUrl(p.mediaUrl);
    setContentTags(p.tags);
    toast.info(`Loaded "${p.label}" template`);
  };

  // AI Content Generator Agent
  const handleAgentGenerate = async () => {
    setIsGeneratingAi(true);
    try {
      await new Promise((r) => setTimeout(r, 600)); // Smooth agent simulation

      if (contentType === "reel") {
        setContentTitle(`🔥 Secret Technique: Master Chef ${aiPromptTopic}`);
        setContentCaption(
          `Craving genuine taste? Watch how our chefs prepare authentic ${aiPromptTopic} using traditional copper cauldrons and secret Uzbek spices. Order fresh right inside the Plately App!`
        );
        setContentTags("uzbekfood,tashkent,reels,masterchef,delicious,plately");
      } else if (contentType === "story") {
        setContentTitle(`Fresh Kitchen Alert: ${aiPromptTopic}`);
        setContentCaption(
          `Just arrived hot from the kitchen: fresh ${aiPromptTopic}! Only 15 portions remaining for lunch rush. Tap to order now on Plately ⏳🔥`
        );
        setContentTags("kitchenstory,hotandfresh,limited,kamolon");
      } else {
        setContentTitle(`Special Feature: ${aiPromptTopic}`);
        setContentCaption(
          `Introducing our chef's recommended ${aiPromptTopic}. Crafted with farm-fresh ingredients and 100% Halal beef. What's your favorite Uzbek side dish with this? Comment below! 🥗🥘`
        );
        setContentTags("community,foodlovers,platelyeats,tashkentculinary");
      }
      toast.success("AI Agent generated high-converting copy & hashtags!");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Publish to Plately Consumer App Explore Screen
  const handlePublishToExplore = async () => {
    if (!contentCaption.trim()) {
      toast.error("Please provide a caption or description for this content.");
      return;
    }

    setIsPublishing(true);
    try {
      const res = await fetch("/api/content/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: contentType,
          restaurantId,
          title: contentTitle.trim() || undefined,
          caption: contentCaption.trim(),
          mediaUrl: contentMediaUrl.trim(),
          tags: contentTags
            .split(",")
            .map((t) => t.trim().replace(/^#/, ""))
            .filter(Boolean),
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to publish content");
      }

      toast.success(
        `🎉 Successfully published ${contentType.toUpperCase()} to Plately App Explore screen! It is now live in the Reels/Community feeds.`
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish content to Plately App");
    } finally {
      setIsPublishing(false);
    }
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
            <Megaphone className="w-8 h-8 text-[#f98b25]" /> Marketing & Explore Studio
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Publish viral food reels, 24h stories, and community posts directly into the consumer app Explore page, or manage discount vouchers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "promos" && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 bg-[#f98b25] hover:bg-[#e07b1d] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-[#f98b25]/20"
            >
              <Plus className="w-4 h-4" /> Create Promo Code
            </button>
          )}
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 bg-[#161b22] p-1.5 rounded-xl border border-[rgba(255,255,255,0.06)] w-fit">
        <button
          onClick={() => setActiveTab("explore")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "explore"
              ? "bg-[#f98b25] text-white shadow-md shadow-[#f98b25]/25"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>App Explore Publisher & AI Agents</span>
        </button>

        <button
          onClick={() => setActiveTab("promos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "promos"
              ? "bg-[#f98b25] text-white shadow-md shadow-[#f98b25]/25"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Promo Codes & Vouchers</span>
        </button>

        <button
          onClick={() => setActiveTab("campaigns")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "campaigns"
              ? "bg-[#f98b25] text-white shadow-md shadow-[#f98b25]/25"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>External Campaigns & Rush Hours</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 1: APP EXPLORE & CONTENT STUDIO                         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === "explore" && (
        <div className="space-y-6">
          {/* Quick Presets Bar */}
          <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#f98b25]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                1-Click Food Presets:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {UZBEK_FOOD_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handleApplyPreset(p)}
                  className="bg-[#0D1117] hover:bg-white/5 border border-[rgba(255,255,255,0.08)] hover:border-[#f98b25]/50 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 transition-all"
                >
                  {p.type === "reel" ? "🎬" : p.type === "story" ? "⏱️" : "📸"} {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Studio & AI Controls */}
            <div className="lg:col-span-7 bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-[#f98b25]" /> Content Studio & AI Agent
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Generate authentic food stories or publish reels directly to the consumer app.
                  </p>
                </div>

                {/* Content Type Selector */}
                <div className="flex bg-[#0D1117] p-1 rounded-lg border border-[rgba(255,255,255,0.06)]">
                  {(
                    [
                      { id: "reel", label: "🎬 Reel", desc: "Reels Tab" },
                      { id: "story", label: "⏱️ Story", desc: "24h Ring" },
                      { id: "post", label: "📸 Post", desc: "Community" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setContentType(t.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        contentType === t.id
                          ? "bg-[#f98b25] text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Agent Generator Box */}
              <div className="bg-[#0D1117] border border-[rgba(249,139,37,0.2)] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#f98b25]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      AI Food Copywriter Agent
                    </span>
                  </div>
                  <span className="text-[10px] text-[#f98b25] bg-[#f98b25]/10 px-2 py-0.5 rounded border border-[#f98b25]/20 font-medium">
                    Plately AI Agent
                  </span>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={aiPromptTopic}
                    onChange={(e) => setAiPromptTopic(e.target.value)}
                    placeholder="e.g. Juicy Tashkent Shashlik with roasted tomatoes..."
                    className="bg-[#161b22] border-[rgba(255,255,255,0.08)] text-xs h-9 text-white focus:border-[#f98b25]"
                  />
                  <button
                    onClick={handleAgentGenerate}
                    disabled={isGeneratingAi}
                    className="bg-[#f98b25] hover:bg-[#e07b1d] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0"
                  >
                    {isGeneratingAi ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Bot className="w-3.5 h-3.5" />
                    )}
                    Generate Copy
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {contentType !== "story" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Title / Headline</Label>
                    <Input
                      value={contentTitle}
                      onChange={(e) => setContentTitle(e.target.value)}
                      placeholder="e.g. Wedding Plov Fresh Every Day"
                      className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-xs h-9 text-white focus:border-[#f98b25]"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Caption & Story Description</Label>
                  <textarea
                    rows={4}
                    value={contentCaption}
                    onChange={(e) => setContentCaption(e.target.value)}
                    placeholder="Describe your dish, cooking secret, or promotional deal..."
                    className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-lg p-3 text-xs text-white focus:border-[#f98b25] focus:outline-none resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">
                    {contentType === "reel" ? "Video URL (YouTube or MP4)" : "Image / Photo URL"}
                  </Label>
                  <Input
                    value={contentMediaUrl}
                    onChange={(e) => setContentMediaUrl(e.target.value)}
                    placeholder={
                      contentType === "reel"
                        ? "https://www.youtube.com/watch?v=..."
                        : "https://images.unsplash.com/..."
                    }
                    className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-xs h-9 text-white focus:border-[#f98b25]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Tags (comma-separated)</Label>
                  <Input
                    value={contentTags}
                    onChange={(e) => setContentTags(e.target.value)}
                    placeholder="plov, uzbek, somsa, tashkent, fresh"
                    className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-xs h-9 text-white focus:border-[#f98b25]"
                  />
                </div>
              </div>

              {/* Publish Action Button */}
              <div className="pt-2">
                <button
                  onClick={handlePublishToExplore}
                  disabled={isPublishing}
                  className="w-full bg-gradient-to-r from-[#f98b25] to-[#ff9d42] hover:from-[#e07b1d] hover:to-[#f98b25] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#f98b25]/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isPublishing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Publish to Plately App Explore Screen</span>
                </button>
              </div>
            </div>

            {/* Right: Live App Simulation Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-400" /> Live Plately App Preview
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                  {contentType === "reel" ? "Reels Tab" : contentType === "story" ? "Story Ring" : "Community Feed"}
                </span>
              </div>

              {/* Mockup Card */}
              <div className="bg-[#0D1117] border border-[rgba(255,255,255,0.1)] rounded-2xl overflow-hidden shadow-2xl relative">
                {/* Simulated Phone Top Header */}
                <div className="bg-[#161b22] px-4 py-2 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-white">✨ Explore</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                      VERIFIED RESTAURANT
                    </span>
                  </div>
                </div>

                {/* Body Preview depending on type */}
                {contentType === "reel" ? (
                  <div className="relative aspect-[9/14] bg-slate-950 flex flex-col justify-between p-4 overflow-hidden">
                    {/* Media background simulation */}
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-40"
                      style={{
                        backgroundImage: `url(${
                          contentMediaUrl.includes("youtube")
                            ? "https://img.youtube.com/vi/ZX3gH0BSTR4/hqdefault.jpg"
                            : contentMediaUrl || "https://images.unsplash.com/photo-1541544741938-0af808871cc0"
                        })`,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />

                    {/* Top restaurant badge */}
                    <div className="relative z-10 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#f98b25] flex items-center justify-center text-xs font-bold text-white shadow-md">
                        🍽️
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white drop-shadow">
                          @kamolon_official
                        </span>
                        <span className="block text-[10px] text-amber-300 font-semibold drop-shadow">
                          Official Restaurant Partner
                        </span>
                      </div>
                    </div>

                    {/* Play button preview */}
                    <div className="relative z-10 self-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white">
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </div>

                    {/* Bottom caption & tags */}
                    <div className="relative z-10 space-y-2">
                      <h4 className="text-sm font-bold text-white drop-shadow leading-snug">
                        {contentTitle || "Signature Uzbek Dish"}
                      </h4>
                      <p className="text-xs text-slate-200 line-clamp-3 drop-shadow leading-relaxed">
                        {contentCaption}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {contentTags
                          .split(",")
                          .slice(0, 3)
                          .map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] text-amber-300/90 font-medium"
                            >
                              #{t.trim().replace(/^#/, "")}
                            </span>
                          ))}
                      </div>

                      {/* Direct Order button on reel */}
                      <div className="pt-2">
                        <div className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 px-3 rounded-lg text-center flex items-center justify-center gap-1.5 shadow-lg">
                          <span>🍽️ Order from Restaurant</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : contentType === "story" ? (
                  <div className="p-4 space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-[rgba(255,255,255,0.06)]">
                      <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 to-rose-500">
                        <div className="w-full h-full rounded-full bg-[#161b22] flex items-center justify-center text-lg">
                          🥘
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Kamolon Restaurant</h4>
                        <span className="text-[10px] text-emerald-400 font-medium">
                          24h Story Ring Feature
                        </span>
                      </div>
                    </div>

                    <div className="aspect-square rounded-xl overflow-hidden relative border border-white/10">
                      <img
                        src={contentMediaUrl || "https://images.unsplash.com/photo-1541544741938-0af808871cc0"}
                        alt="Story preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as any).src =
                            "https://images.unsplash.com/photo-1541544741938-0af808871cc0";
                        }}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                        <p className="text-xs text-white leading-relaxed line-clamp-3">
                          {contentCaption}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#f98b25] flex items-center justify-center text-sm font-bold text-white">
                          K
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">Kamolon</span>
                            <span className="text-[9px] bg-[#f98b25]/20 text-[#f98b25] px-1.5 py-0.2 rounded font-bold">
                              BRAND
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">Namuna 15, Tashkent</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500">Just now</span>
                    </div>

                    <div className="aspect-[4/3] rounded-xl overflow-hidden border border-white/10">
                      <img
                        src={contentMediaUrl || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1"}
                        alt="Post media preview"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed">
                      {contentCaption}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.06)] text-xs text-slate-400">
                      <div className="flex items-center gap-4">
                        <span>❤️ 142 likes</span>
                        <span>💬 18 comments</span>
                      </div>
                      <span className="text-[#f98b25] font-semibold text-[11px]">
                        Order via Plately
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 2: PROMO CODES & VOUCHERS                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === "promos" && (
        <div className="space-y-6">
          <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-[rgba(255,255,255,0.06)] pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 font-[family-name:var(--font-display)]">
                <Ticket className="w-5 h-5 text-[#f98b25]" /> Active Discount Promo Codes
              </h2>
              <span className="text-xs text-slate-400">{promos.length} codes listed</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {promos.map((promo) => (
                <div
                  key={promo.id}
                  className="bg-[#0D1117] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 flex flex-col justify-between relative group hover:border-[#f98b25]/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#f98b25] bg-[#f98b25]/10 border border-[#f98b25]/20 px-2 py-0.5 rounded tracking-wider uppercase font-mono">
                        {promo.code}
                      </span>
                      <button
                        onClick={() => handleTogglePromo(promo.id, promo.isActive)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          promo.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {promo.isActive ? "Active" : "Paused"}
                      </button>
                    </div>

                    <h3 className="text-sm font-semibold text-white">{promo.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {promo.discountType === "percentage"
                        ? `${promo.discountValue}% OFF order`
                        : `${formatUZS(promo.discountValue)} Fixed Discount`}
                    </p>
                    {promo.minOrderValue > 0 && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Min. order: {formatUZS(promo.minOrderValue)}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.04)] flex items-center justify-between text-[11px] text-slate-500">
                    <span>Used {promo.usageCount} times</span>
                    {promo.usageLimit && <span>Limit: {promo.usageLimit}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 3: EXTERNAL CAMPAIGNS & RUSH HOURS                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === "campaigns" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Social Drafter */}
          <div className="lg:col-span-2 bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 font-[family-name:var(--font-display)]">
                  <Sparkles className="w-5 h-5 text-[#f98b25]" /> External Channel Campaign Drafter
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Generate Uzbek/Russian social promo texts for Telegram channels and Instagram.
                </p>
              </div>

              {/* Platform Selector */}
              <div className="flex bg-[#0D1117] p-1 rounded-lg border border-[rgba(255,255,255,0.06)]">
                {(["telegram", "instagram", "sms"] as const).map((plat) => (
                  <button
                    key={plat}
                    onClick={() => setAiPlatform(plat)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold uppercase transition-colors ${
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
                Real-time prediction of customer orders to adjust kitchen preparation and run flash discounts.
              </p>

              <div className="space-y-2">
                {demandHours.slice(0, 5).map((d) => (
                  <div
                    key={d.hour}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#0D1117] border border-[rgba(255,255,255,0.04)]"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-white font-medium">
                        {d.hour.toString().padStart(2, "0")}:00 - {(d.hour + 1).toString().padStart(2, "0")}:00
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-300 font-semibold">
                        ~{d.predictedOrders} orders
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          d.trend === "peak"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : d.trend === "normal"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {d.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)] text-xs text-slate-400">
              💡 <span className="font-semibold text-slate-300">Suggestion:</span> Prep +30 somsa before 12:00 lunch peak.
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Promo Code */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-[#161b22] border-[rgba(255,255,255,0.08)] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-[family-name:var(--font-display)]">
              Create New Promo Code
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreatePromo} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Promo Code (e.g. TASHKENT25)</Label>
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="PROMOCODE"
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-white uppercase font-mono tracking-wider focus:border-[#f98b25]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Promo Title / Internal Note</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Weekend Special 15%"
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-white focus:border-[#f98b25]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Discount Type</Label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-2 text-xs text-white focus:border-[#f98b25] focus:outline-none"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Sum (UZS)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">
                  Value ({newType === "percentage" ? "%" : "UZS"})
                </Label>
                <Input
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(Number(e.target.value))}
                  className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-white focus:border-[#f98b25]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Minimum Order Value (UZS)</Label>
              <Input
                type="number"
                value={newMinOrder}
                onChange={(e) => setNewMinOrder(Number(e.target.value))}
                placeholder="50000"
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-white focus:border-[#f98b25]"
              />
            </div>

            <DialogFooter className="pt-4">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#f98b25] hover:bg-[#e07b1d] text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-md shadow-[#f98b25]/20"
              >
                Publish Promo
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

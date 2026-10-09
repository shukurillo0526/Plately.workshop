"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Smartphone,
  Tablet,
  Monitor,
  Sparkles,
  Save,
  ExternalLink,
  Eye,
  Palette,
  Layout,
  Type,
  CheckCircle2,
  Undo2,
  RefreshCw,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export type DeviceMode = "desktop" | "tablet" | "mobile";

export interface WebsiteSection {
  id: string;
  type: "hero" | "about" | "highlights" | "hours_location" | "reviews" | "cta";
  title: string;
  content: string;
  enabled: boolean;
  meta?: Record<string, any>;
}

export interface WebsiteThemeConfig {
  primaryColor: string;
  fontFamily: "Outfit" | "Inter" | "Playfair Display";
  heroTagline: string;
  heroHeadline: string;
  heroButtonText: string;
  aboutStory: string;
  deliveryNotice: string;
  sections: WebsiteSection[];
}

const DEFAULT_SECTIONS: WebsiteSection[] = [
  {
    id: "sec-hero",
    type: "hero",
    title: "Hero Banner",
    content: "Authentic Central Asian Flavors",
    enabled: true,
  },
  {
    id: "sec-about",
    type: "about",
    title: "Our Heritage & Story",
    content: "Crafted with passion using generational recipes, fresh organic spices, and premium ingredients.",
    enabled: true,
  },
  {
    id: "sec-highlights",
    type: "highlights",
    title: "Signature Dishes",
    content: "Explore chef specials prepared fresh in our kitchen daily.",
    enabled: true,
  },
  {
    id: "sec-hours",
    type: "hours_location",
    title: "Hours & Location",
    content: "Daily 10:00 - 23:00 • Tashkent City Center",
    enabled: true,
  },
  {
    id: "sec-reviews",
    type: "reviews",
    title: "Guest Testimonials",
    content: "Loved by thousands of food lovers across Tashkent.",
    enabled: true,
  },
];

export default function WebsiteBuilderPage() {
  const { user } = useAuthStore();
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [activeTab, setActiveTab] = useState<"visual" | "ai" | "settings">("visual");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const restaurantName = user?.restaurant_name || "My Restaurant";
  const restaurantSlug = user?.restaurant_slug || "kamolon";
  const restaurantId = user?.restaurant_id;

  // Site Configuration State
  const [config, setConfig] = useState<WebsiteThemeConfig>({
    primaryColor: "#f98b25",
    fontFamily: "Outfit",
    heroHeadline: `Welcome to ${restaurantName}`,
    heroTagline: "The premier dining & delivery destination in Tashkent",
    heroButtonText: "Order Online Now",
    aboutStory: `${restaurantName} brings together authentic local gastronomy, tender slow-cooked meats, and fresh seasonal salads for an unforgettable dining experience.`,
    deliveryNotice: "⚡ Fast delivery in under 35 minutes across Tashkent",
    sections: DEFAULT_SECTIONS,
  });

  // Load existing website config from Supabase
  const loadConfig = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("restaurant_website_configs")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

      if (data && data.template) {
        setConfig((prev) => ({
          ...prev,
          ...(data.template as Partial<WebsiteThemeConfig>),
        }));
      }
    } catch (err) {
      console.warn("[Website] Config load fallback:", err);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Save & Publish to Supabase
  const handlePublish = async () => {
    if (!restaurantId) return;
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("restaurant_website_configs")
        .upsert({
          restaurant_id: restaurantId,
          template: config,
          updated_at: new Date().toISOString(),
        }, { onConflict: "restaurant_id" });

      if (error) throw error;
      toast.success("Website published successfully! Changes are live on your storefront.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish website");
    } finally {
      setIsSaving(false);
    }
  };

  // AI Prompt-to-Site Config Generator
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a description for your restaurant style");
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate generative prompt translation into structured configuration
      await new Promise((r) => setTimeout(r, 1200));

      const p = aiPrompt.toLowerCase();
      let color = config.primaryColor;
      let tagline = config.heroTagline;
      let headline = config.heroHeadline;
      let font: "Outfit" | "Inter" | "Playfair Display" = config.fontFamily;

      if (p.includes("cozy") || p.includes("bakery") || p.includes("cafe")) {
        color = "#e07a00";
        font = "Outfit";
        tagline = "Artisan treats, freshly brewed coffee, and heartwarming aromas";
        headline = `Sweet Moments at ${restaurantName}`;
      } else if (p.includes("pilaf") || p.includes("osh") || p.includes("milliy") || p.includes("national")) {
        color = "#f98b25";
        font = "Outfit";
        tagline = "Generations of culinary heritage cooked over open flame";
        headline = `Tashkent's Finest Hospitality at ${restaurantName}`;
      } else if (p.includes("luxury") || p.includes("fine") || p.includes("steak")) {
        color = "#34d399";
        font = "Playfair Display";
        tagline = "Elevated dining, curated ingredients, and refined atmosphere";
        headline = `Exquisite Culinary Art at ${restaurantName}`;
      } else {
        color = "#3b82f6";
        headline = `Experience ${restaurantName}`;
        tagline = "Fresh culinary creations delivered straight to your doorstep";
      }

      setConfig((prev) => ({
        ...prev,
        primaryColor: color,
        fontFamily: font,
        heroHeadline: headline,
        heroTagline: tagline,
      }));

      toast.success("AI draft applied! Review the live preview on the right.");
      setActiveTab("visual");
    } catch {
      toast.error("Failed to generate site draft");
    } finally {
      setIsGenerating(false);
    }
  };

  // Move section position
  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...config.sections];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newSections.length) return;
    const temp = newSections[index];
    newSections[index] = newSections[target];
    newSections[target] = temp;
    setConfig({ ...config, sections: newSections });
  };

  const toggleSection = (id: string) => {
    setConfig({
      ...config,
      sections: config.sections.map((s) =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      ),
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] text-slate-200">
      {/* Top Studio Control Bar */}
      <div className="h-14 border-b border-[rgba(255,255,255,0.06)] bg-[#161b22] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-[#f98b25]/20 text-[#f98b25]">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white font-[family-name:var(--font-display)] flex items-center gap-2">
              Website & Storefront Builder
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-normal">
                Live Engine
              </span>
            </h1>
          </div>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center bg-[#0D1117] border border-[rgba(255,255,255,0.08)] p-1 rounded-lg gap-1">
          <button
            onClick={() => setDevice("desktop")}
            className={`p-1.5 rounded-md transition-colors ${
              device === "desktop" ? "bg-[#161b22] text-[#f98b25] shadow-sm" : "text-gray-400 hover:text-white"
            }`}
            title="Desktop Preview"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDevice("tablet")}
            className={`p-1.5 rounded-md transition-colors ${
              device === "tablet" ? "bg-[#161b22] text-[#f98b25] shadow-sm" : "text-gray-400 hover:text-white"
            }`}
            title="Tablet Preview"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDevice("mobile")}
            className={`p-1.5 rounded-md transition-colors ${
              device === "mobile" ? "bg-[#161b22] text-[#f98b25] shadow-sm" : "text-gray-400 hover:text-white"
            }`}
            title="Mobile Preview"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Publish & Store Actions */}
        <div className="flex items-center gap-3">
          <a
            href={`/store/${restaurantSlug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-lg transition-colors"
          >
            <span>View Public Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Button
            onClick={handlePublish}
            disabled={isSaving}
            className="bg-[#f98b25] hover:bg-[#e07b1d] text-white text-xs font-semibold px-4 h-8"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            Publish Changes
          </Button>
        </div>
      </div>

      {/* Main Workspace Split: Controls Panel (Left) & Device Frame (Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Customization Controls */}
        <div className="w-96 border-r border-[rgba(255,255,255,0.06)] bg-[#161b22]/70 backdrop-blur-md flex flex-col shrink-0">
          {/* Sub Navigation */}
          <div className="flex border-b border-[rgba(255,255,255,0.06)] text-xs font-medium">
            <button
              onClick={() => setActiveTab("visual")}
              className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                activeTab === "visual"
                  ? "border-[#f98b25] text-white bg-slate-800/20"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Visual Blocks
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex-1 py-3 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === "ai"
                  ? "border-[#f98b25] text-[#f98b25] bg-slate-800/20"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Prompt Studio
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                activeTab === "settings"
                  ? "border-[#f98b25] text-white bg-slate-800/20"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Styling & Brand
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* TAB: VISUAL BLOCKS */}
            {activeTab === "visual" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Page Sections (Drag & Reorder)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enable, disable, and rearrange modules on your guest storefront.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {config.sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="p-3 rounded-lg bg-[#0D1117] border border-[rgba(255,255,255,0.06)] flex items-center justify-between group hover:border-[#f98b25]/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={sec.enabled}
                          onCheckedChange={() => toggleSection(sec.id)}
                        />
                        <div>
                          <p className={`text-xs font-semibold ${sec.enabled ? "text-white" : "text-slate-500"}`}>
                            {sec.title}
                          </p>
                          <p className="text-[10px] text-slate-500 capitalize">{sec.type}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveSection(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 rounded text-slate-500 hover:text-white disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveSection(idx, "down")}
                          disabled={idx === config.sections.length - 1}
                          className="p-1 rounded text-slate-500 hover:text-white disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Hero Content Editor */}
                <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-3">
                  <h4 className="text-xs font-semibold text-white">Hero Content</h4>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Headline</Label>
                    <Input
                      value={config.heroHeadline}
                      onChange={(e) => setConfig({ ...config, heroHeadline: e.target.value })}
                      className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Tagline</Label>
                    <Textarea
                      rows={2}
                      value={config.heroTagline}
                      onChange={(e) => setConfig({ ...config, heroTagline: e.target.value })}
                      className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">CTA Button Text</Label>
                    <Input
                      value={config.heroButtonText}
                      onChange={(e) => setConfig({ ...config, heroButtonText: e.target.value })}
                      className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-xs h-8"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: AI PROMPT STUDIO */}
            {activeTab === "ai" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#f98b25]/10 to-transparent border border-[#f98b25]/20">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
                    <Sparkles className="w-4 h-4 text-[#f98b25]" />
                    Conversational Site Architect
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Describe your vision, vibe, or target audience. Plately AI transforms your prompt into validated colors, typography, hero banners, and storytelling copy.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-300">Prompt your website:</Label>
                  <Textarea
                    rows={4}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. A traditional cozy Tashkent chayxona with dark amber ambiance, warm bread aromas, and signature lamb shashlik"
                    className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-xs"
                  />
                </div>

                <Button
                  onClick={handleAiGenerate}
                  disabled={isGenerating}
                  className="w-full bg-[#f98b25] hover:bg-[#e07b1d] text-white text-xs font-semibold py-2"
                >
                  {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                  Generate Website Draft
                </Button>

                <div className="space-y-2 pt-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Quick Prompts:</span>
                  <div className="flex flex-col gap-1.5">
                    {[
                      "Modern Minimalist Fast Casual (Burgers & Shakes)",
                      "Traditional Tashkent Choyxona & Pilaf Center",
                      "Artisan French-style Bakery & Coffee Roastery",
                    ].map((sample) => (
                      <button
                        key={sample}
                        onClick={() => setAiPrompt(sample)}
                        className="text-left text-[11px] p-2 rounded bg-[#0D1117] hover:bg-slate-800 text-slate-300 transition-colors border border-[rgba(255,255,255,0.04)]"
                      >
                        ⚡ {sample}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: STYLING & BRAND */}
            {activeTab === "settings" && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-300">Brand Accent Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded border border-white/20 cursor-pointer bg-transparent"
                    />
                    <span className="font-mono text-xs text-slate-300 uppercase">{config.primaryColor}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-300">Typography Mood</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {(["Outfit", "Inter", "Playfair Display"] as const).map((font) => (
                      <button
                        key={font}
                        onClick={() => setConfig({ ...config, fontFamily: font })}
                        className={`p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                          config.fontFamily === font
                            ? "border-[#f98b25] bg-[#f98b25]/10 text-white"
                            : "border-[rgba(255,255,255,0.06)] bg-[#0D1117] text-slate-400 hover:text-white"
                        }`}
                      >
                        <span>{font}</span>
                        {config.fontFamily === font && <CheckCircle2 className="w-3.5 h-3.5 text-[#f98b25]" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-300">Delivery Banner Announcement</Label>
                  <Input
                    value={config.deliveryNotice}
                    onChange={(e) => setConfig({ ...config, deliveryNotice: e.target.value })}
                    className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-xs h-8"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Interactive Device Viewport */}
        <div className="flex-1 bg-[#090d13] p-8 flex items-center justify-center overflow-auto">
          <div
            className={`transition-all duration-300 rounded-2xl border-4 border-slate-800 shadow-2xl bg-[#0D1117] overflow-hidden flex flex-col ${
              device === "desktop"
                ? "w-full max-w-4xl h-[640px]"
                : device === "tablet"
                ? "w-[600px] h-[720px]"
                : "w-[360px] h-[680px]"
            }`}
          >
            {/* Mock Browser Header */}
            <div className="h-8 bg-[#161b22] border-b border-[rgba(255,255,255,0.06)] px-3 flex items-center gap-2 shrink-0">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              </div>
              <div className="flex-1 max-w-xs mx-auto bg-[#0D1117] rounded px-2 py-0.5 text-[10px] text-gray-400 font-mono text-center truncate">
                https://{restaurantSlug}.theplately.com
              </div>
            </div>

            {/* Rendered Storefront Simulation */}
            <div className="flex-1 overflow-y-auto text-white">
              {/* Delivery Top Notice */}
              <div className="py-1.5 px-4 text-center text-xs font-medium bg-[#161b22] border-b border-white/5 text-amber-300">
                {config.deliveryNotice}
              </div>

              {/* Navigation Header */}
              <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-[#0D1117]/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm text-white"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    {restaurantName[0] || "P"}
                  </div>
                  <span className="font-bold text-sm tracking-tight">{restaurantName}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-400 hover:text-white cursor-pointer">Menu</span>
                  <span className="text-gray-400 hover:text-white cursor-pointer">About</span>
                  <Button
                    size="sm"
                    className="text-xs h-7 px-3 text-white font-medium"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    Book Table
                  </Button>
                </div>
              </header>

              {/* Section: HERO */}
              {config.sections.find((s) => s.id === "sec-hero")?.enabled && (
                <div className="relative py-16 px-8 text-center bg-gradient-to-b from-[#161b22]/50 to-transparent border-b border-white/5">
                  <div className="max-w-md mx-auto space-y-4">
                    <span
                      className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider"
                      style={{
                        borderColor: `${config.primaryColor}50`,
                        color: config.primaryColor,
                        backgroundColor: `${config.primaryColor}15`,
                      }}
                    >
                      Authentic Tashkent Taste
                    </span>
                    <h2 className="text-2xl font-black tracking-tight">{config.heroHeadline}</h2>
                    <p className="text-xs text-gray-400 leading-relaxed">{config.heroTagline}</p>
                    <div className="pt-2 flex justify-center gap-2.5">
                      <Button
                        className="text-xs font-semibold px-5 h-9 text-white shadow-lg"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        {config.heroButtonText}
                      </Button>
                      <Button
                        variant="outline"
                        className="text-xs font-semibold px-4 h-9 border-white/10 text-gray-300 hover:text-white"
                      >
                        Explore Menu
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Section: SIGNATURE DISHES */}
              {config.sections.find((s) => s.id === "sec-highlights")?.enabled && (
                <div className="py-10 px-6 border-b border-white/5">
                  <div className="text-center mb-6">
                    <h3 className="text-base font-bold">Signature Dishes</h3>
                    <p className="text-xs text-gray-400 mt-1">Prepared fresh daily by our masters</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                    {[
                      { name: "Tashkent Choyxona Palov", price: "45,000 UZS", tag: "Bestseller" },
                      { name: "Special Lamb Shashlik", price: "28,000 UZS", tag: "Grilled" },
                    ].map((dish) => (
                      <div
                        key={dish.name}
                        className="p-3 rounded-xl bg-[#161b22] border border-white/5 space-y-2 hover:border-white/10 transition-colors"
                      >
                        <div className="w-full h-20 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-600">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-white leading-tight">{dish.name}</p>
                            <span className="text-[10px] text-emerald-400 font-semibold">{dish.tag}</span>
                          </div>
                          <span className="text-xs font-mono font-bold" style={{ color: config.primaryColor }}>
                            {dish.price}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section: ABOUT STORY */}
              {config.sections.find((s) => s.id === "sec-about")?.enabled && (
                <div className="py-10 px-8 text-center bg-[#161b22]/30 border-b border-white/5">
                  <div className="max-w-md mx-auto space-y-3">
                    <h3 className="text-base font-bold">Our Heritage</h3>
                    <p className="text-xs text-gray-300 leading-relaxed">{config.aboutStory}</p>
                  </div>
                </div>
              )}

              {/* Section: HOURS & LOCATION */}
              {config.sections.find((s) => s.id === "sec-hours")?.enabled && (
                <div className="py-8 px-6 text-center border-b border-white/5">
                  <h3 className="text-sm font-bold text-white mb-2">Hours & Location</h3>
                  <p className="text-xs text-gray-400">Open Daily from 10:00 to 23:00</p>
                  <p className="text-xs text-gray-400">Tashkent City Center • Fast Courier Dispatch</p>
                </div>
              )}

              {/* Footer */}
              <footer className="py-6 px-6 text-center text-[10px] text-gray-500 bg-[#090d13]">
                <p>© {new Date().getFullYear()} {restaurantName}. Powered by Plately Workshop.</p>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

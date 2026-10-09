"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Globe,
  Smartphone,
  Tablet,
  Monitor,
  Sparkles,
  Save,
  ExternalLink,
  Eye,
  EyeOff,
  Palette,
  Layers,
  Undo2,
  Redo2,
  RefreshCw,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  CheckCircle2,
  Settings,
  X,
  Calendar,
  Utensils,
  Star,
  MapPin,
  Clock,
  Phone,
  Image as ImageIcon,
  HelpCircle,
  Megaphone,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Sliders,
  Send,
  Wand2,
  Copy,
  Paperclip,
  Mic,
  MicOff,
  FileText,
  Music,
  Check,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { formatUZS } from "@/lib/format";

export type DeviceMode = "desktop" | "tablet" | "mobile";

export type SectionType =
  | "announcement"
  | "hero"
  | "about"
  | "highlights"
  | "booking"
  | "reviews"
  | "hours_location"
  | "gallery"
  | "faq"
  | "cta";

export interface WebsiteSection {
  id: string;
  type: SectionType;
  title: string;
  subtitle?: string;
  content: string;
  enabled: boolean;
  meta?: {
    buttonText?: string;
    buttonLink?: string;
    imageUrl?: string;
    layout?: "centered" | "split" | "minimal";
    badge?: string;
    items?: Array<{
      title: string;
      desc?: string;
      price?: number;
      image?: string;
      tag?: string;
    }>;
  };
}

export interface WebsiteThemeConfig {
  primaryColor: string;
  secondaryColor?: string;
  backgroundColor?: string;
  cardColor?: string;
  textColor?: string;
  fontFamily: "Outfit" | "Inter" | "Playfair Display";
  borderRadius?: "sharp" | "rounded" | "pill";
  heroTagline: string;
  heroHeadline: string;
  heroButtonText: string;
  heroButtonLink?: string;
  heroLayout?: "centered" | "split" | "minimal";
  heroImage?: string;
  aboutStory: string;
  aboutImage?: string;
  deliveryNotice: string;
  sections: WebsiteSection[];
}

export interface AttachedMedia {
  name: string;
  type: string;
  dataUrl: string;
  size?: number;
}

const DEFAULT_SECTIONS: WebsiteSection[] = [
  {
    id: "sec-announcement",
    type: "announcement",
    title: "Delivery Announcement",
    content: "⚡ Fast delivery in under 35 minutes across Tashkent • Free delivery on orders over 100,000 UZS",
    enabled: true,
  },
  {
    id: "sec-hero",
    type: "hero",
    title: "Hero Banner",
    subtitle: "AUTHENTIC TASHKENT TASTE",
    content: "Crafted with passion using generational recipes, fresh organic spices, and premium ingredients.",
    enabled: true,
    meta: {
      buttonText: "Order Online Now",
      buttonLink: "#menu",
      layout: "split",
      imageUrl: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=900&auto=format&fit=crop&q=80",
      badge: "⭐️ 4.9 (420+ Reviews) • 100% Halal",
    },
  },
  {
    id: "sec-about",
    type: "about",
    title: "Our Heritage & Culinary Passion",
    subtitle: "GENERATIONS OF FLAVOR",
    content: "Rooted in the heart of Tashkent, our kitchen honors the sacred balance of fire, spices, and hand-selected meats to bring genuine hospitality to every table.",
    enabled: true,
    meta: {
      imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
      badge: "Family Owned • Est. 1998",
    },
  },
  {
    id: "sec-highlights",
    type: "highlights",
    title: "Signature Dishes",
    subtitle: "PREPARED FRESH DAILY",
    content: "Chef recommendations slow-cooked and flame-grilled to perfection.",
    enabled: true,
    meta: {
      items: [
        {
          title: "To'y Oshi (Wedding Plov)",
          desc: "Slow-cooked tender beef with golden carrots and raisins.",
          price: 38000,
          tag: "Signature",
          image: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500&auto=format&fit=crop&q=80",
        },
        {
          title: "Tandir Somsa",
          desc: "Crispy clay-oven pastry with diced beef and cumin.",
          price: 16000,
          tag: "Crispy",
          image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80",
        },
        {
          title: "Charcoal Shashlik",
          desc: "Marinated lamb skewers charcoal-grilled with sweet onions.",
          price: 46000,
          tag: "Flame Grilled",
          image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80",
        },
      ],
    },
  },
  {
    id: "sec-booking",
    type: "booking",
    title: "Reserve a Table",
    subtitle: "ELEVATED DINING EXPERIENCE",
    content: "Book a table for family gatherings, business lunches, or romantic evenings with instant confirmation.",
    enabled: true,
    meta: {
      buttonText: "Confirm Table Reservation",
    },
  },
  {
    id: "sec-reviews",
    type: "reviews",
    title: "Loved by Tashkent Foodies",
    subtitle: "4.9 STARS ON GOOGLE & YANDEX",
    content: "Hear what our guests have to say about our hospitality and flavors.",
    enabled: true,
    meta: {
      items: [
        {
          title: "Aziz Rakhimov",
          desc: "The wedding plov here is legitimately the best in the city. The meat melts in your mouth and service is lightning fast!",
          tag: "Verified Diner",
        },
        {
          title: "Malika Yusupova",
          desc: "Stunning atmosphere and delicious crispy somsa. We reserved a table for our family anniversary and everything was flawless.",
          tag: "Food Critic",
        },
        {
          title: "Davron Karimov",
          desc: "Always fresh, hot delivery within 30 minutes. Plately makes direct ordering so seamless!",
          tag: "Loyal Regular",
        },
      ],
    },
  },
  {
    id: "sec-hours",
    type: "hours_location",
    title: "Hours & Locations",
    subtitle: "VISIT OUR BRANCHES",
    content: "Open Daily 10:00 - 23:00 • Central Tashkent & Chorsu Outlets",
    enabled: true,
  },
];

const THEME_PRESETS = [
  {
    name: "Saffron Amber",
    primary: "#f98b25",
    secondary: "#e11d48",
    bg: "#0d1117",
    card: "#161b22",
    font: "Outfit" as const,
  },
  {
    name: "Emerald Luxury",
    primary: "#10b981",
    secondary: "#059669",
    bg: "#061510",
    card: "#0b231b",
    font: "Playfair Display" as const,
  },
  {
    name: "Obsidian Gold",
    primary: "#d4af37",
    secondary: "#f59e0b",
    bg: "#0b0d11",
    card: "#141720",
    font: "Playfair Display" as const,
  },
  {
    name: "Artisan Coffee",
    primary: "#d97706",
    secondary: "#f59e0b",
    bg: "#14100c",
    card: "#1f1814",
    font: "Outfit" as const,
  },
  {
    name: "Cobalt Modern",
    primary: "#3b82f6",
    secondary: "#06b6d4",
    bg: "#090d16",
    card: "#111827",
    font: "Inter" as const,
  },
  {
    name: "Royal Crimson",
    primary: "#e11d48",
    secondary: "#f43f5e",
    bg: "#14070a",
    card: "#200d12",
    font: "Outfit" as const,
  },
];

const PHOTO_PRESETS = [
  { label: "Wedding Plov", url: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=900&auto=format&fit=crop&q=80" },
  { label: "Charcoal Shashlik", url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=900&auto=format&fit=crop&q=80" },
  { label: "Clay Oven Somsa", url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=900&auto=format&fit=crop&q=80" },
  { label: "Hand-pulled Noodles", url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=900&auto=format&fit=crop&q=80" },
  { label: "Dining Hall Ambience", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&auto=format&fit=crop&q=80" },
  { label: "Artisan Coffee & Pastry", url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&auto=format&fit=crop&q=80" },
];

const GEMINI_MODELS = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    desc: "Lightning fast, high quality multimodal design",
    badge: "Recommended",
    icon: "⚡",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    desc: "Deep creative reasoning & tailored copywriting",
    badge: "Pro Creative",
    icon: "🧠",
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    desc: "Next-generation ultra fast intelligence",
    badge: "Next-Gen",
    icon: "🚀",
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Lite",
    desc: "Ultra lightweight, minimal latency edits",
    badge: "Lightweight",
    icon: "💨",
  },
];

export default function WebsiteBuilderPage() {
  const { user } = useAuthStore();
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [activeDrawer, setActiveDrawer] = useState<"none" | "blocks" | "inspector" | "theme">("none");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("sec-hero");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiCommandText, setAiCommandText] = useState("");
  const [aiStatusMsg, setAiStatusMsg] = useState("");

  // Gemini Model & Multimodal State
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-flash");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [attachments, setAttachments] = useState<AttachedMedia[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const restaurantName = user?.restaurant_name || "Kamolon";
  const restaurantSlug = user?.restaurant_slug || "kamolon";
  const restaurantId = user?.restaurant_id || "7e1dd08c-c95d-496b-86d0-f7b40d7f9cdf";

  // Initial Config
  const [config, setConfig] = useState<WebsiteThemeConfig>({
    primaryColor: "#f98b25",
    secondaryColor: "#e11d48",
    backgroundColor: "#0d1117",
    cardColor: "#161b22",
    textColor: "#f8fafc",
    fontFamily: "Outfit",
    borderRadius: "rounded",
    heroHeadline: `Experience ${restaurantName}`,
    heroTagline: "Authentic Central Asian gastronomy, tender flame-grilled meats, and rich hospitality.",
    heroButtonText: "Order Online Now",
    heroButtonLink: "#menu",
    heroLayout: "split",
    heroImage: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=900&auto=format&fit=crop&q=80",
    aboutStory: `${restaurantName} brings together authentic local culinary heritage, slow-cooked tender meats, and fresh seasonal ingredients for an unforgettable dining experience.`,
    aboutImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
    deliveryNotice: "⚡ Fast delivery in under 35 minutes across Tashkent • Free delivery on orders over 100,000 UZS",
    sections: DEFAULT_SECTIONS,
  });

  // History stack for Undo/Redo
  const [history, setHistory] = useState<WebsiteThemeConfig[]>([config]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Push new state into history
  const updateConfigWithHistory = useCallback(
    (newConfig: WebsiteThemeConfig | ((prev: WebsiteThemeConfig) => WebsiteThemeConfig)) => {
      setConfig((prev) => {
        const resolved = typeof newConfig === "function" ? newConfig(prev) : newConfig;
        setHistory((h) => {
          const nextH = h.slice(0, historyIndex + 1);
          return [...nextH, resolved];
        });
        setHistoryIndex((idx) => idx + 1);
        return resolved;
      });
    },
    [historyIndex]
  );

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setConfig(prev);
      toast.info("Undid last change");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setConfig(next);
      toast.info("Redid change");
    }
  };

  // Load existing config on mount from server API
  useEffect(() => {
    async function loadSavedConfig() {
      if (!restaurantId) return;
      try {
        const res = await fetch(`/api/website/config?restaurantId=${restaurantId}`);
        const data = await res.json();
        if (data.success && data.config) {
          setConfig((prev) => ({
            ...prev,
            ...data.config,
          }));
          setHistory([data.config]);
          setHistoryIndex(0);
        }
      } catch (e) {
        console.warn("[WebsiteStudio] Could not load saved config:", e);
      }
    }
    loadSavedConfig();
  }, [restaurantId]);

  // Save Draft (via server API)
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/website/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, config }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Save failed");
      toast.success("Website draft saved!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  // Publish Live
  const handlePublishLive = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch("/api/website/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, config }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Publish failed");
      toast.success("🎉 Website published live! Changes are active on your public storefront.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish live");
    } finally {
      setIsPublishing(false);
    }
  };

  // Attach Files & Photos Handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            dataUrl: reader.result as string,
            size: file.size,
          },
        ]);
        toast.success(`Attached "${file.name}" for Gemini Vision analysis`);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Clipboard Paste Handler (e.g. user presses Ctrl+V with an image in clipboard)
  const handleClipboardPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => {
            setAttachments((prev) => [
              ...prev,
              {
                name: `Pasted Image ${new Date().toLocaleTimeString()}.png`,
                type: blob.type,
                dataUrl: reader.result as string,
                size: blob.size,
              },
            ]);
            toast.success("Pasted image attached for Gemini Vision analysis!");
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  // Speech Recognition / Voice Input
  const toggleSpeechRecognition = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      toast.info("Microphone stopped");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsRecording(true);
        toast.info("🎙️ Listening... Speak your design changes!");
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setAiCommandText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsRecording(false);
        if (event.error !== "no-speech") {
          toast.error(`Microphone error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err: any) {
      toast.error("Could not access microphone: " + err.message);
      setIsRecording(false);
    }
  };

  // THE MAIN FEATURE: Gemini AI Text & Multimodal Command Execution
  const handleRunAiCommand = async (customPrompt?: string) => {
    const promptToRun = customPrompt || aiCommandText;
    if (!promptToRun.trim() && attachments.length === 0) {
      toast.error("Please enter a command or attach an image/file");
      return;
    }

    // Stop recording if active
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setIsAiProcessing(true);
    setAiStatusMsg(`Google Gemini (${selectedModel}) analyzing prompt & media...`);

    try {
      const res = await fetch("/api/ai/website-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: promptToRun,
          currentConfig: config,
          restaurantName,
          model: selectedModel,
          attachments,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "AI generation failed");

      if (data.config) {
        updateConfigWithHistory(data.config);
        toast.success(`✨ ${data.message || "Changes applied by Gemini AI!"}`);
        setAiCommandText("");
        setAttachments([]);
      }
    } catch (err: any) {
      toast.error(err?.message || "AI Command execution failed");
    } finally {
      setIsAiProcessing(false);
      setAiStatusMsg("");
    }
  };

  // Move Section Up/Down
  const moveSection = (index: number, dir: "up" | "down") => {
    const targetIdx = dir === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= config.sections.length) return;
    const nextSections = [...config.sections];
    const temp = nextSections[index];
    nextSections[index] = nextSections[targetIdx];
    nextSections[targetIdx] = temp;
    updateConfigWithHistory({ ...config, sections: nextSections });
  };

  // Toggle Section Visibility
  const toggleSection = (id: string) => {
    const nextSections = config.sections.map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    updateConfigWithHistory({ ...config, sections: nextSections });
  };

  // Delete Section
  const deleteSection = (id: string) => {
    const nextSections = config.sections.filter((s) => s.id !== id);
    updateConfigWithHistory({ ...config, sections: nextSections });
    toast.info("Section removed");
  };

  // Add Section from library
  const handleAddSection = (type: SectionType) => {
    const newId = `sec-${type}-${Date.now()}`;
    let newSec: WebsiteSection;

    switch (type) {
      case "booking":
        newSec = {
          id: newId,
          type: "booking",
          title: "Reserve a Table",
          subtitle: "DINE IN LUXURY",
          content: "Book a table for lunch or dinner with instant SMS and WhatsApp confirmation.",
          enabled: true,
          meta: { buttonText: "Book Now" },
        };
        break;
      case "gallery":
        newSec = {
          id: newId,
          type: "gallery",
          title: "Culinary Gallery & Moments",
          subtitle: "OUR ATMOSPHERE",
          content: "Experience the vibrant craft, open flame kitchens, and warm hospitality.",
          enabled: true,
        };
        break;
      case "faq":
        newSec = {
          id: newId,
          type: "faq",
          title: "Frequently Asked Questions",
          subtitle: "HELP & POLICIES",
          content: "100% Halal certified • 35-min delivery across Tashkent • Group bookings available.",
          enabled: true,
        };
        break;
      case "cta":
        newSec = {
          id: newId,
          type: "cta",
          title: "Ready to Taste the Finest?",
          subtitle: "ORDER OR DINE WITH US",
          content: "Enjoy special welcome treats and fast direct delivery on your first order.",
          enabled: true,
          meta: { buttonText: "Start Ordering Now" },
        };
        break;
      default:
        newSec = {
          id: newId,
          type: "highlights",
          title: "Special Features",
          subtitle: "OUR OFFERINGS",
          content: "Handcrafted selections prepared daily.",
          enabled: true,
        };
    }

    updateConfigWithHistory({ ...config, sections: [...config.sections, newSec] });
    setSelectedSectionId(newId);
    setActiveDrawer("inspector");
    toast.success(`Added new ${type.toUpperCase()} section`);
  };

  const selectedSection = config.sections.find((s) => s.id === selectedSectionId);
  const activeModelObj = GEMINI_MODELS.find((m) => m.id === selectedModel) || GEMINI_MODELS[0];

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] text-slate-100 bg-[#07090e] overflow-hidden select-none">
      {/* 1. TOP STUDIO BAR */}
      <header className="h-14 border-b border-white/[0.08] bg-[#0c1017] px-4 flex items-center justify-between shrink-0 z-30">
        {/* Left: Logo & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#f98b25]/15 border border-[#f98b25]/30 text-[#f98b25]">
            <Globe className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wide">Plately Studio</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-white">{restaurantName}</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Storefront Engine
            </span>
          </div>
        </div>

        {/* Center: Device Switcher & Undo/Redo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#141a24] border border-white/10 p-0.5 rounded-lg">
            <button
              onClick={() => setDevice("desktop")}
              className={`p-1.5 rounded-md transition-all ${
                device === "desktop" ? "bg-[#f98b25] text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
              title="Desktop View (1200px)"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevice("tablet")}
              className={`p-1.5 rounded-md transition-all ${
                device === "tablet" ? "bg-[#f98b25] text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevice("mobile")}
              className={`p-1.5 rounded-md transition-all ${
                device === "mobile" ? "bg-[#f98b25] text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
              title="Mobile View (390px)"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 border-l border-white/10 pl-3">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Drawer Toggles & Actions */}
        <div className="flex items-center gap-2">
          {/* Blocks Drawer Button */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === "blocks" ? "none" : "blocks")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              activeDrawer === "blocks"
                ? "bg-[#f98b25]/20 border-[#f98b25] text-[#f98b25]"
                : "bg-[#141a24] border-white/10 text-slate-300 hover:text-white hover:border-white/20"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Blocks</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">{config.sections.length}</span>
          </button>

          {/* Theme Drawer Button */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === "theme" ? "none" : "theme")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              activeDrawer === "theme"
                ? "bg-[#f98b25]/20 border-[#f98b25] text-[#f98b25]"
                : "bg-[#141a24] border-white/10 text-slate-300 hover:text-white hover:border-white/20"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme & Styles</span>
          </button>

          {/* Storefront Link */}
          <a
            href={`/store/${restaurantSlug}`}
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-[#141a24] border border-white/10 rounded-lg transition-colors"
            title="Open Live Public Storefront"
          >
            <span>Live Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Save Draft */}
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="border-white/10 bg-[#141a24] hover:bg-[#1c2432] text-slate-200 text-xs h-8 px-3"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            Save Draft
          </Button>

          {/* Publish Live */}
          <Button
            onClick={handlePublishLive}
            disabled={isPublishing}
            className="bg-[#f98b25] hover:bg-[#e07b1d] text-white text-xs font-semibold h-8 px-4 shadow-lg shadow-[#f98b25]/20"
          >
            {isPublishing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            )}
            Publish Live
          </Button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CANVAS + SLIDE-OVER DRAWERS */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* CENTER STAGE: LIVE INTERACTIVE PREVIEW */}
        <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 flex flex-col items-center justify-start bg-gradient-to-b from-[#0a0d14] to-[#040609]">
          {/* Realistic Browser Viewport Mockup */}
          <div
            className={`transition-all duration-300 shadow-2xl rounded-2xl border border-white/10 bg-[#0d1117] flex flex-col overflow-hidden mb-32 ${
              device === "desktop"
                ? "w-full max-w-5xl"
                : device === "tablet"
                ? "w-[768px]"
                : "w-[390px] rounded-[36px] border-4 border-slate-800"
            }`}
          >
            {/* Browser Header Bar */}
            <div className="h-9 bg-[#161b22] border-b border-white/[0.06] px-4 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>

              {/* URL Address Bar */}
              <div className="flex items-center gap-1.5 bg-[#0d1117] border border-white/5 px-3 py-1 rounded-md text-[11px] font-mono text-slate-300">
                <span className="text-emerald-400">🔒</span>
                <span>https://{restaurantSlug}.plately.uz</span>
              </div>

              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                {device.toUpperCase()}
              </div>
            </div>

            {/* LIVE PREVIEW CANVAS CONTENT */}
            <div
              className="flex-1 overflow-y-auto text-slate-100"
              style={{
                backgroundColor: config.backgroundColor || "#0d1117",
                fontFamily: config.fontFamily === "Playfair Display" ? "var(--font-serif, serif)" : "var(--font-sans, sans-serif)",
              }}
            >
              {/* TOP ANNOUNCEMENT BAR */}
              {config.sections.find((s) => s.type === "announcement" && s.enabled) && (
                <div
                  className="py-2 px-4 text-center text-xs font-medium border-b border-white/10 flex items-center justify-center gap-2 relative group"
                  style={{ backgroundColor: `${config.primaryColor}20`, color: config.primaryColor }}
                >
                  <span>{config.deliveryNotice}</span>
                  <button
                    onClick={() => {
                      setSelectedSectionId("sec-announcement");
                      setActiveDrawer("inspector");
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-[10px] underline"
                  >
                    Edit
                  </button>
                </div>
              )}

              {/* STOREFRONT HEADER NAV */}
              <nav className="border-b border-white/[0.08] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0d1117]/90 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-lg"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    {restaurantName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-white tracking-tight">{restaurantName}</h2>
                    <p className="text-[10px] text-slate-400">Authentic Cuisine • Tashkent</p>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-6 text-xs text-slate-300 font-medium">
                  <span className="hover:text-white cursor-pointer">Menu</span>
                  <span className="hover:text-white cursor-pointer">Our Story</span>
                  <span className="hover:text-white cursor-pointer">Table Booking</span>
                  <span className="hover:text-white cursor-pointer">Reviews</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-md transition-transform hover:scale-105"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    {config.heroButtonText}
                  </button>
                </div>
              </nav>

              {/* RENDER ACTIVE SECTIONS IN EXACT ORDER */}
              <div className="divide-y divide-white/[0.05]">
                {config.sections
                  .filter((s) => s.enabled)
                  .map((section, index) => (
                    <div
                      key={section.id}
                      onClick={() => {
                        setSelectedSectionId(section.id);
                        setActiveDrawer("inspector");
                      }}
                      className={`relative group p-6 md:p-10 transition-all cursor-pointer ${
                        selectedSectionId === section.id
                          ? "ring-2 ring-inset ring-[#f98b25] bg-[#f98b25]/[0.02]"
                          : "hover:bg-white/[0.01]"
                      }`}
                    >
                      {/* Section Hover Mini Toolbar */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all bg-[#161b22] border border-white/10 rounded-lg p-1 flex items-center gap-1 shadow-xl z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(index, "up");
                          }}
                          disabled={index === 0}
                          className="p-1 hover:text-[#f98b25] text-slate-400 disabled:opacity-20"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(index, "down");
                          }}
                          disabled={index === config.sections.length - 1}
                          className="p-1 hover:text-[#f98b25] text-slate-400 disabled:opacity-20"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSectionId(section.id);
                            setActiveDrawer("inspector");
                          }}
                          className="p-1 hover:text-white text-slate-400"
                          title="Edit in Inspector"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSection(section.id);
                          }}
                          className="p-1 hover:text-amber-400 text-slate-400"
                          title="Hide Section"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSection(section.id);
                          }}
                          className="p-1 hover:text-rose-400 text-slate-400"
                          title="Delete Section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* SECTION 1: HERO */}
                      {section.type === "hero" && (
                        <div
                          className={`flex flex-col ${
                            config.heroLayout === "split"
                              ? "md:flex-row md:items-center gap-8"
                              : "items-center text-center max-w-2xl mx-auto"
                          }`}
                        >
                          <div className="flex-1 space-y-4">
                            {section.meta?.badge && (
                              <div
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase"
                                style={{
                                  backgroundColor: `${config.primaryColor}20`,
                                  color: config.primaryColor,
                                }}
                              >
                                <span>{section.meta.badge}</span>
                              </div>
                            )}

                            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                              {config.heroHeadline}
                            </h1>

                            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                              {config.heroTagline}
                            </p>

                            <div className="pt-2 flex flex-wrap gap-3">
                              <button
                                className="px-6 py-3 rounded-xl font-bold text-sm text-white shadow-xl transition-transform hover:scale-105"
                                style={{ backgroundColor: config.primaryColor }}
                              >
                                {config.heroButtonText}
                              </button>
                              <button className="px-5 py-3 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors">
                                Explore Full Menu
                              </button>
                            </div>
                          </div>

                          {config.heroLayout === "split" && (
                            <div className="flex-1 relative">
                              <div
                                className="w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-cover bg-center"
                                style={{
                                  backgroundImage: `url(${config.heroImage || section.meta?.imageUrl})`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* SECTION 2: ABOUT & HERITAGE */}
                      {section.type === "about" && (
                        <div className="flex flex-col md:flex-row items-center gap-8">
                          <div className="flex-1 relative">
                            <div
                              className="w-full h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-cover bg-center"
                              style={{
                                backgroundImage: `url(${config.aboutImage || section.meta?.imageUrl})`,
                              }}
                            />
                            <div
                              className="absolute -bottom-4 -right-4 px-4 py-2 rounded-xl text-xs font-bold shadow-xl border border-white/10 text-white"
                              style={{ backgroundColor: config.primaryColor }}
                            >
                              {section.meta?.badge || "Est. 1998"}
                            </div>
                          </div>

                          <div className="flex-1 space-y-3">
                            <span
                              className="text-xs font-bold uppercase tracking-widest"
                              style={{ color: config.primaryColor }}
                            >
                              {section.subtitle || "OUR HERITAGE"}
                            </span>
                            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                              {section.title}
                            </h2>
                            <p className="text-sm text-slate-300 leading-relaxed">{config.aboutStory}</p>
                            <div className="pt-2 flex items-center gap-4 text-xs text-slate-400 font-medium">
                              <span>✓ Halal Certified Meat</span>
                              <span>✓ Clay Oven Bread Daily</span>
                              <span>✓ Organic Spices</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SECTION 3: SIGNATURE DISHES */}
                      {section.type === "highlights" && (
                        <div className="space-y-6">
                          <div className="text-center max-w-xl mx-auto space-y-1">
                            <span
                              className="text-xs font-bold uppercase tracking-widest"
                              style={{ color: config.primaryColor }}
                            >
                              {section.subtitle || "CHEF SPECIALS"}
                            </span>
                            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                              {section.title}
                            </h2>
                            <p className="text-xs text-slate-400">{section.content}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(section.meta?.items || []).map((dish, i) => (
                              <div
                                key={i}
                                className="rounded-xl border border-white/10 overflow-hidden bg-slate-900/60 hover:border-white/20 transition-all flex flex-col"
                              >
                                {dish.image && (
                                  <div
                                    className="h-36 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${dish.image})` }}
                                  />
                                )}
                                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <h3 className="font-bold text-sm text-white">{dish.title}</h3>
                                      {dish.tag && (
                                        <span
                                          className="text-[10px] px-2 py-0.5 rounded font-bold uppercase"
                                          style={{
                                            backgroundColor: `${config.primaryColor}20`,
                                            color: config.primaryColor,
                                          }}
                                        >
                                          {dish.tag}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{dish.desc}</p>
                                  </div>
                                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <span className="font-bold text-sm text-white">
                                      {dish.price ? formatUZS(dish.price) : "38,000 UZS"}
                                    </span>
                                    <button
                                      className="px-3 py-1 rounded text-xs font-semibold text-white"
                                      style={{ backgroundColor: config.primaryColor }}
                                    >
                                      + Add
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SECTION 4: TABLE RESERVATION */}
                      {section.type === "booking" && (
                        <div className="max-w-2xl mx-auto rounded-2xl border border-white/10 p-6 md:p-8 bg-[#141a24]/80 backdrop-blur-md shadow-2xl space-y-6">
                          <div className="text-center space-y-1">
                            <span
                              className="text-xs font-bold uppercase tracking-widest"
                              style={{ color: config.primaryColor }}
                            >
                              {section.subtitle || "RESERVE YOUR TABLE"}
                            </span>
                            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                              {section.title}
                            </h2>
                            <p className="text-xs text-slate-400">{section.content}</p>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            <div>
                              <label className="text-slate-400 block mb-1">Guests</label>
                              <select className="w-full bg-[#0d1117] border border-white/10 rounded-lg p-2 text-white">
                                <option>2 Guests (Romantic / Intimate)</option>
                                <option>4 Guests (Family Table)</option>
                                <option>6-8 Guests (Celebration)</option>
                                <option>10+ Guests (Private VIP Room)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-slate-400 block mb-1">Date</label>
                              <input
                                type="date"
                                defaultValue={new Date().toISOString().split("T")[0]}
                                className="w-full bg-[#0d1117] border border-white/10 rounded-lg p-2 text-white"
                              />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                              <label className="text-slate-400 block mb-1">Time Slot</label>
                              <select className="w-full bg-[#0d1117] border border-white/10 rounded-lg p-2 text-white">
                                <option>13:00 - Lunch Rush</option>
                                <option>18:30 - Early Dinner</option>
                                <option>20:00 - Prime Evening</option>
                              </select>
                            </div>
                          </div>

                          <button
                            className="w-full py-3 rounded-xl font-bold text-sm text-white shadow-xl transition-transform hover:scale-[1.01]"
                            style={{ backgroundColor: config.primaryColor }}
                          >
                            {section.meta?.buttonText || "Confirm Table Reservation"}
                          </button>
                        </div>
                      )}

                      {/* SECTION 5: CUSTOMER REVIEWS */}
                      {section.type === "reviews" && (
                        <div className="space-y-6">
                          <div className="text-center max-w-xl mx-auto space-y-1">
                            <span
                              className="text-xs font-bold uppercase tracking-widest"
                              style={{ color: config.primaryColor }}
                            >
                              {section.subtitle || "GUEST EXPERIENCES"}
                            </span>
                            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                              {section.title}
                            </h2>
                            <p className="text-xs text-slate-400">{section.content}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(section.meta?.items || []).map((rev, i) => (
                              <div
                                key={i}
                                className="rounded-xl border border-white/10 p-5 bg-slate-900/50 flex flex-col justify-between space-y-4"
                              >
                                <div className="flex items-center gap-1 text-amber-400">
                                  {[...Array(5)].map((_, starI) => (
                                    <Star key={starI} className="w-4 h-4 fill-amber-400" />
                                  ))}
                                </div>
                                <p className="text-xs text-slate-300 italic leading-relaxed">
                                  "{rev.desc}"
                                </p>
                                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                                  <span className="font-bold text-white">{rev.title}</span>
                                  <span className="text-[10px] text-emerald-400 font-semibold">{rev.tag}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SECTION 6: HOURS & LOCATION */}
                      {section.type === "hours_location" && (
                        <div className="rounded-2xl border border-white/10 p-6 md:p-8 bg-slate-900/40 flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="space-y-2">
                            <span
                              className="text-xs font-bold uppercase tracking-widest"
                              style={{ color: config.primaryColor }}
                            >
                              {section.subtitle || "FIND US"}
                            </span>
                            <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                            <p className="text-xs text-slate-400">{section.content}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-300 pt-2">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-amber-400" /> 10:00 - 23:00 Daily
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-emerald-400" /> +998 71 200 00 00
                              </span>
                            </div>
                          </div>

                          <button className="px-6 py-3 rounded-xl font-bold text-xs text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                            Open in Yandex & Google Maps
                          </button>
                        </div>
                      )}

                      {/* SECTION 7: PHOTO GALLERY */}
                      {section.type === "gallery" && (
                        <div className="space-y-4">
                          <div className="text-center max-w-xl mx-auto space-y-1">
                            <span
                              className="text-xs font-bold uppercase tracking-widest"
                              style={{ color: config.primaryColor }}
                            >
                              {section.subtitle || "GALLERY"}
                            </span>
                            <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {PHOTO_PRESETS.slice(0, 4).map((img, i) => (
                              <div
                                key={i}
                                className="h-36 rounded-xl bg-cover bg-center border border-white/10 overflow-hidden hover:scale-[1.02] transition-transform"
                                style={{ backgroundImage: `url(${img.url})` }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SECTION 8: FAQ */}
                      {section.type === "faq" && (
                        <div className="max-w-2xl mx-auto space-y-4">
                          <div className="text-center space-y-1">
                            <span
                              className="text-xs font-bold uppercase tracking-widest"
                              style={{ color: config.primaryColor }}
                            >
                              {section.subtitle || "FAQ"}
                            </span>
                            <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="p-3 rounded-lg border border-white/10 bg-slate-900/60">
                              <p className="font-bold text-white mb-1">Is all meat Halal certified?</p>
                              <p className="text-slate-400">Yes, 100% of our lamb, beef, and poultry are certified Halal from verified local farms.</p>
                            </div>
                            <div className="p-3 rounded-lg border border-white/10 bg-slate-900/60">
                              <p className="font-bold text-white mb-1">How fast is delivery?</p>
                              <p className="text-slate-400">Our couriers deliver fresh piping hot food within 35 minutes across Tashkent.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SECTION 9: CTA BANNER */}
                      {section.type === "cta" && (
                        <div
                          className="rounded-2xl p-8 text-center space-y-4 text-white shadow-2xl relative overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor || "#e11d48"})`,
                          }}
                        >
                          <h2 className="text-3xl font-extrabold">{section.title}</h2>
                          <p className="text-sm opacity-90 max-w-lg mx-auto">{section.content}</p>
                          <button className="px-8 py-3 rounded-xl font-bold text-sm bg-black text-white hover:bg-slate-900 shadow-xl transition-transform hover:scale-105">
                            {section.meta?.buttonText || "Order Online Now"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* FOOTER */}
              <footer className="border-t border-white/[0.08] p-8 text-center text-xs text-slate-500 space-y-2">
                <p className="text-slate-400 font-semibold">{restaurantName} • Official Digital Storefront</p>
                <p>© {new Date().getFullYear()} All Rights Reserved • Powered by Plately Workshop</p>
              </footer>
            </div>
          </div>
        </div>

        {/* 3. THE MAIN FEATURE: MULTIMODAL GEMINI AI COMMAND DOCK */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-40">
          <div className="bg-[#0e131d]/95 backdrop-blur-2xl border border-white/15 p-3 rounded-2xl shadow-2xl shadow-black/80 flex flex-col gap-2.5">
            {/* Top Bar: Model Selector, Quick Prompts & Mode Status */}
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2 text-[11px]">
              {/* Model Switcher Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-colors font-semibold"
                >
                  <span className="text-[#f98b25]">{activeModelObj.icon}</span>
                  <span>{activeModelObj.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isModelDropdownOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#141a24] border border-white/15 rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
                    <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Select Gemini AI Model
                    </div>
                    {GEMINI_MODELS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(m.id);
                          setIsModelDropdownOpen(false);
                          toast.info(`Switched to ${m.name}`);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                          selectedModel === m.id
                            ? "bg-[#f98b25]/20 text-[#f98b25] font-bold"
                            : "hover:bg-white/5 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{m.icon}</span>
                          <div>
                            <div className="text-xs font-semibold leading-tight">{m.name}</div>
                            <div className="text-[10px] text-slate-400 leading-tight">{m.desc}</div>
                          </div>
                        </div>
                        {selectedModel === m.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Suggestion Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none flex-1 justify-end">
                <button
                  onClick={() => handleRunAiCommand("Make design feel like luxury dark steakhouse with gold accents and table booking")}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 shrink-0 transition-colors"
                >
                  👑 Luxury Gold
                </button>
                <button
                  onClick={() => handleRunAiCommand("Switch to authentic Uzbek flame grill theme with signature wedding plov")}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 shrink-0 transition-colors"
                >
                  🔥 Uzbek Flame
                </button>
                <button
                  onClick={() => handleRunAiCommand("Add customer Google reviews with 4.9 stars and photo gallery")}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 shrink-0 transition-colors"
                >
                  ⭐️ Reviews
                </button>
                <button
                  onClick={() => handleRunAiCommand("Add special Ramadan holiday discount banner with 15% off")}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 shrink-0 transition-colors"
                >
                  🌙 Ramadan
                </button>
              </div>
            </div>

            {/* Attached Media Pills (Photos, Documents, Audio) */}
            {attachments.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141a24] border border-[#f98b25]/40 text-xs text-white shrink-0 shadow"
                  >
                    {file.type.startsWith("image/") ? (
                      <div
                        className="w-5 h-5 rounded bg-cover bg-center border border-white/20 shrink-0"
                        style={{ backgroundImage: `url(${file.dataUrl})` }}
                      />
                    ) : (
                      <FileText className="w-4 h-4 text-[#f98b25]" />
                    )}
                    <span className="max-w-[130px] truncate text-[11px] font-medium">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="p-0.5 hover:text-rose-400 text-slate-400 ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Main Command Input Row */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunAiCommand();
              }}
              className="flex items-center gap-2"
            >
              {/* Hidden File Picker */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                accept="image/*,application/pdf,.doc,.docx"
                className="hidden"
              />

              {/* Attach File/Photo Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl bg-[#141a24] border border-white/10 hover:border-[#f98b25] text-slate-300 hover:text-white transition-colors"
                title="Attach food photo, logo, or design reference"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Voice Dictation / Recording Button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2 rounded-xl border transition-all ${
                  isRecording
                    ? "bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse ring-2 ring-rose-500/40"
                    : "bg-[#141a24] border-white/10 hover:border-[#f98b25] text-slate-300 hover:text-white"
                }`}
                title={isRecording ? "Stop Voice Dictation" : "Voice Dictation: Speak changes"}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Input Field with Clipboard Paste Support */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#f98b25]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={aiCommandText}
                  onChange={(e) => setAiCommandText(e.target.value)}
                  onPaste={handleClipboardPaste}
                  placeholder={
                    isRecording
                      ? "Listening to your voice..."
                      : "Describe changes to Gemini... (attach photos, paste images, or speak)"
                  }
                  disabled={isAiProcessing}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#141a24] border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#f98b25] transition-all"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isAiProcessing || (!aiCommandText.trim() && attachments.length === 0)}
                className="bg-[#f98b25] hover:bg-[#e07b1d] text-white text-xs font-semibold px-4 h-9 rounded-xl shrink-0 shadow-lg shadow-[#f98b25]/20"
              >
                {isAiProcessing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                )}
                {isAiProcessing ? "Applying..." : "Generate"}
              </Button>
            </form>

            {aiStatusMsg && (
              <p className="text-[11px] text-[#f98b25] font-medium animate-pulse text-center">
                {aiStatusMsg}
              </p>
            )}
          </div>
        </div>

        {/* 4. ADDITIONAL FEATURE: COLLAPSIBLE SLIDE-OVER DRAWER (BLOCKS / INSPECTOR / THEME) */}
        {activeDrawer !== "none" && (
          <aside className="w-80 md:w-96 border-l border-white/10 bg-[#0d1117]/95 backdrop-blur-xl flex flex-col shrink-0 z-30 transition-all shadow-2xl">
            {/* Drawer Header */}
            <div className="h-12 border-b border-white/[0.08] px-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                {activeDrawer === "blocks" && (
                  <>
                    <Layers className="w-4 h-4 text-[#f98b25]" /> Page Blocks & Order
                  </>
                )}
                {activeDrawer === "inspector" && (
                  <>
                    <Sliders className="w-4 h-4 text-[#f98b25]" /> Block Content Inspector
                  </>
                )}
                {activeDrawer === "theme" && (
                  <>
                    <Palette className="w-4 h-4 text-[#f98b25]" /> Theme & Brand Styling
                  </>
                )}
              </div>
              <button
                onClick={() => setActiveDrawer("none")}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* DRAWER TAB 1: BLOCKS (DRAG & REORDER) */}
            {activeDrawer === "blocks" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Reorder or toggle sections:</span>
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-[#f98b25] font-semibold">{config.sections.filter((s) => s.enabled).length} Active</span>
                  </div>
                </div>

                {/* Section List */}
                <div className="space-y-2">
                  {config.sections.map((section, idx) => (
                    <div
                      key={section.id}
                      onClick={() => {
                        setSelectedSectionId(section.id);
                        setActiveDrawer("inspector");
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
                        selectedSectionId === section.id
                          ? "border-[#f98b25] bg-[#f98b25]/10 text-white"
                          : section.enabled
                          ? "border-white/10 bg-[#141a24] text-slate-200 hover:border-white/20"
                          : "border-white/5 bg-slate-900/40 text-slate-500 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <GripVertical className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="font-semibold truncate">{section.title}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(idx, "up");
                          }}
                          disabled={idx === 0}
                          className="p-1 hover:text-[#f98b25] text-slate-400 disabled:opacity-20"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(idx, "down");
                          }}
                          disabled={idx === config.sections.length - 1}
                          className="p-1 hover:text-[#f98b25] text-slate-400 disabled:opacity-20"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSection(section.id);
                          }}
                          className="p-1 hover:text-white text-slate-400"
                        >
                          {section.enabled ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSection(section.id);
                          }}
                          className="p-1 hover:text-rose-400 text-slate-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Block Palette */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Add Section to Page
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => handleAddSection("booking")}
                      className="p-2.5 rounded-lg border border-white/10 bg-[#141a24] hover:border-[#f98b25] text-left flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4 text-[#f98b25]" />
                      <span>Table Booking</span>
                    </button>
                    <button
                      onClick={() => handleAddSection("gallery")}
                      className="p-2.5 rounded-lg border border-white/10 bg-[#141a24] hover:border-[#f98b25] text-left flex items-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4 text-[#f98b25]" />
                      <span>Photo Gallery</span>
                    </button>
                    <button
                      onClick={() => handleAddSection("faq")}
                      className="p-2.5 rounded-lg border border-white/10 bg-[#141a24] hover:border-[#f98b25] text-left flex items-center gap-2"
                    >
                      <HelpCircle className="w-4 h-4 text-[#f98b25]" />
                      <span>FAQ Section</span>
                    </button>
                    <button
                      onClick={() => handleAddSection("cta")}
                      className="p-2.5 rounded-lg border border-white/10 bg-[#141a24] hover:border-[#f98b25] text-left flex items-center gap-2"
                    >
                      <Megaphone className="w-4 h-4 text-[#f98b25]" />
                      <span>CTA Banner</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DRAWER TAB 2: INSPECTOR (NO-CODE ELEMENT EDITOR) */}
            {activeDrawer === "inspector" && selectedSection && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Active Section:</span>
                  <span className="font-bold text-[#f98b25] uppercase tracking-wider">{selectedSection.type}</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-slate-300">Section Title</Label>
                    <Input
                      value={selectedSection.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateConfigWithHistory({
                          ...config,
                          sections: config.sections.map((s) =>
                            s.id === selectedSection.id ? { ...s, title: val } : s
                          ),
                        });
                      }}
                      className="bg-[#141a24] border-white/10 text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-slate-300">Subtitle / Tag</Label>
                    <Input
                      value={selectedSection.subtitle || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateConfigWithHistory({
                          ...config,
                          sections: config.sections.map((s) =>
                            s.id === selectedSection.id ? { ...s, subtitle: val } : s
                          ),
                        });
                      }}
                      className="bg-[#141a24] border-white/10 text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-slate-300">Description / Content</Label>
                    <Textarea
                      rows={3}
                      value={selectedSection.content}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateConfigWithHistory({
                          ...config,
                          sections: config.sections.map((s) =>
                            s.id === selectedSection.id ? { ...s, content: val } : s
                          ),
                        });
                      }}
                      className="bg-[#141a24] border-white/10 text-xs mt-1"
                    />
                  </div>

                  {/* HERO-SPECIFIC CONTROLS */}
                  {selectedSection.type === "hero" && (
                    <div className="space-y-3 pt-3 border-t border-white/10">
                      <div>
                        <Label className="text-xs text-slate-300">Headline</Label>
                        <Input
                          value={config.heroHeadline}
                          onChange={(e) =>
                            updateConfigWithHistory({ ...config, heroHeadline: e.target.value })
                          }
                          className="bg-[#141a24] border-white/10 text-xs mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-slate-300">Tagline</Label>
                        <Textarea
                          rows={2}
                          value={config.heroTagline}
                          onChange={(e) =>
                            updateConfigWithHistory({ ...config, heroTagline: e.target.value })
                          }
                          className="bg-[#141a24] border-white/10 text-xs mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-slate-300">CTA Button Text</Label>
                        <Input
                          value={config.heroButtonText}
                          onChange={(e) =>
                            updateConfigWithHistory({ ...config, heroButtonText: e.target.value })
                          }
                          className="bg-[#141a24] border-white/10 text-xs mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-slate-300">Hero Layout Variant</Label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <button
                            onClick={() => updateConfigWithHistory({ ...config, heroLayout: "split" })}
                            className={`p-2 rounded border text-xs ${
                              config.heroLayout === "split"
                                ? "border-[#f98b25] bg-[#f98b25]/15 text-white"
                                : "border-white/10 bg-[#141a24] text-slate-300"
                            }`}
                          >
                            Split Showcase
                          </button>
                          <button
                            onClick={() => updateConfigWithHistory({ ...config, heroLayout: "centered" })}
                            className={`p-2 rounded border text-xs ${
                              config.heroLayout === "centered"
                                ? "border-[#f98b25] bg-[#f98b25]/15 text-white"
                                : "border-white/10 bg-[#141a24] text-slate-300"
                            }`}
                          >
                            Centered Modern
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1-Click Photo Preset Selector */}
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <Label className="text-xs text-slate-300">Photo Presets (Uzbek & Dining)</Label>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      {PHOTO_PRESETS.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (selectedSection.type === "hero") {
                              updateConfigWithHistory({ ...config, heroImage: p.url });
                            } else if (selectedSection.type === "about") {
                              updateConfigWithHistory({ ...config, aboutImage: p.url });
                            }
                            toast.success(`Applied ${p.label} image`);
                          }}
                          className="p-1.5 rounded border border-white/10 bg-[#141a24] hover:border-[#f98b25] text-left truncate text-slate-300"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DRAWER TAB 3: THEME & STYLES */}
            {activeDrawer === "theme" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* 1-Click Palettes */}
                <div className="space-y-2">
                  <Label className="text-xs text-slate-300 uppercase tracking-wider font-bold">
                    Theme Presets
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {THEME_PRESETS.map((t, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          updateConfigWithHistory({
                            ...config,
                            primaryColor: t.primary,
                            secondaryColor: t.secondary,
                            backgroundColor: t.bg,
                            cardColor: t.card,
                            fontFamily: t.font,
                          });
                          toast.success(`Applied ${t.name} Theme`);
                        }}
                        className="p-2.5 rounded-xl border border-white/10 bg-[#141a24] hover:border-white/25 text-left space-y-2"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full shadow"
                            style={{ backgroundColor: t.primary }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full shadow"
                            style={{ backgroundColor: t.secondary }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ backgroundColor: t.bg }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-white block">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Pickers */}
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <Label className="text-xs text-slate-300 uppercase tracking-wider font-bold">
                    Custom Color Scheme
                  </Label>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Primary Accent</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) =>
                          updateConfigWithHistory({ ...config, primaryColor: e.target.value })
                        }
                        className="w-7 h-7 rounded border border-white/10 bg-transparent cursor-pointer"
                      />
                      <span className="font-mono text-slate-400">{config.primaryColor}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Background Tone</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.backgroundColor || "#0d1117"}
                        onChange={(e) =>
                          updateConfigWithHistory({ ...config, backgroundColor: e.target.value })
                        }
                        className="w-7 h-7 rounded border border-white/10 bg-transparent cursor-pointer"
                      />
                      <span className="font-mono text-slate-400">{config.backgroundColor || "#0d1117"}</span>
                    </div>
                  </div>
                </div>

                {/* Typography Mood */}
                <div className="space-y-2 pt-3 border-t border-white/10">
                  <Label className="text-xs text-slate-300 uppercase tracking-wider font-bold">
                    Typography Pairing
                  </Label>
                  <div className="space-y-2">
                    {[
                      { font: "Outfit" as const, label: "Outfit (Modern & Warm Grotesk)" },
                      { font: "Playfair Display" as const, label: "Playfair Display (Luxury Editorial Serif)" },
                      { font: "Inter" as const, label: "Inter (Clean Tech Precision)" },
                    ].map((f, i) => (
                      <button
                        key={i}
                        onClick={() => updateConfigWithHistory({ ...config, fontFamily: f.font })}
                        className={`w-full p-2.5 rounded-lg border text-left text-xs transition-all ${
                          config.fontFamily === f.font
                            ? "border-[#f98b25] bg-[#f98b25]/15 text-white font-bold"
                            : "border-white/10 bg-[#141a24] text-slate-300 hover:border-white/20"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

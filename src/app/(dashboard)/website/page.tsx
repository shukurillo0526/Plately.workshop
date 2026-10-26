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
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  CheckCircle2,
  X,
  Calendar,
  Utensils,
  Star,
  MapPin,
  Clock,
  Image as ImageIcon,
  HelpCircle,
  Megaphone,
  ChefHat,
  ChevronDown,
  Sliders,
  Send,
  Paperclip,
  Mic,
  MicOff,
  FileText,
  Check,
  Cpu,
  Menu as MenuIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Reorder } from "motion/react";
import type {
  DeviceMode,
  TableItem,
  SectionType,
  WebsiteSection,
  WebsiteThemeConfig,
  AttachedMedia,
  MenuShowcaseItem,
} from "@/lib/types/website";
export type {
  DeviceMode,
  TableItem,
  SectionType,
  WebsiteSection,
  WebsiteThemeConfig,
  AttachedMedia,
  MenuShowcaseItem,
};
import {
  DEFAULT_SECTIONS,
  THEME_PRESETS,
  PHOTO_PRESETS,
} from "@/lib/types/website";
import {
  HeroSection,
  BrandStorySection,
  MenuShowcaseSection,
  FloorPlanSection,
  ChefHighlightsSection,
  ReviewsSection,
  HoursLocationSection,
  getRadiusClass,
  getThemeStyles,
} from "@/components/website";

const GEMINI_MODELS = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    desc: "Lightning fast, high quality multimodal design",
    badge: "Recommended",
    icon: "⚡",
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    desc: "Deep creative reasoning & tailored copywriting",
    badge: "Pro Creative",
    icon: "🧠",
  },
  {
    id: "gemini-flash-latest",
    name: "Gemini Flash Latest",
    desc: "Flagship speed & responsive layout generation",
    badge: "Flagship",
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
  const isMobile = device === "mobile";
  const isTablet = device === "tablet";
  const [activeDrawer, setActiveDrawer] = useState<"none" | "blocks" | "inspector" | "theme">("none");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("sec-hero");
  const [selectedTableId, setSelectedTableId] = useState<string>("t1");
  const [isAiStudioMode, setIsAiStudioMode] = useState<boolean>(true);
  const [aiThoughts, setAiThoughts] = useState<string[]>([
    "Multimodal Vision: Analyzed architectural floor plan sketch & media",
    "Floor Plan Digitization: Extracted 10 interactive dining tables and zones",
    "Live Seating Binding: Connected status (Available, Reserved, Selected) to booking",
    "Responsive Viewport: Synchronized mobile, tablet, and desktop viewports",
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiCommandText, setAiCommandText] = useState("");
  const [aiStatusMsg, setAiStatusMsg] = useState("");

  // Gemini Model & Multimodal State
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-flash");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [attachments, setAttachments] = useState<AttachedMedia[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex((idx) => idx - 1);
      setConfig(prev);
      toast.info("Undid last change");
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex((idx) => idx + 1);
      setConfig(next);
      toast.info("Redid change");
    }
  }, [historyIndex, history]);

  // Global keyboard shortcuts for Undo (Ctrl+Z / Cmd+Z) and Redo (Ctrl+Y / Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

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
    } catch (err) {
      const error = err as Error;
      toast.error(error?.message || "Failed to save draft");
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
    } catch (err) {
      const error = err as Error;
      toast.error(error?.message || "Failed to publish live");
    } finally {
      setIsPublishing(false);
    }
  };

  // MediaRecorder Voice Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | number | null>(null);

  // Attach Files & Photos Handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64DataUrl = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            dataUrl: base64DataUrl,
            size: file.size,
          },
        ]);
        toast.success(`Attached "${file.name}" for Gemini analysis`);

        // If it's an audio file, automatically transcribe it with Gemini!
        if (file.type.startsWith("audio/")) {
          setIsTranscribing(true);
          setAiStatusMsg("Transcribing audio file with Gemini AI...");
          try {
            const res = await fetch("/api/ai/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audioDataUrl: base64DataUrl }),
            });
            const data = await res.json();
            if (data.text) {
              setAiCommandText((prev) => (prev ? `${prev} ${data.text}` : data.text));
              toast.success(`🎙️ Transcribed audio: "${data.text}"`);
            }
          } catch (e) {
            console.warn("Transcribe error:", e);
          } finally {
            setIsTranscribing(false);
            setAiStatusMsg("");
          }
        }
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

  // True MediaRecorder Voice Recording Engine
  const startAudioRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Microphone recording is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      }

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        stream.getTracks().forEach((track) => track.stop());

        if (audioChunksRef.current.length === 0) return;

        const actualType = mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: actualType });
        const reader = new FileReader();

        reader.onload = async () => {
          const base64DataUrl = reader.result as string;

          // 1. Attach voice memo to attachments pill
          setAttachments((prev) => [
            ...prev,
            {
              name: `Voice Memo (${recordingSeconds}s).webm`,
              type: actualType,
              dataUrl: base64DataUrl,
              size: audioBlob.size,
            },
          ]);

          // 2. Transcribe voice memo using Gemini AI
          setIsTranscribing(true);
          setAiStatusMsg("Gemini AI transcribing your spoken voice...");
          try {
            const res = await fetch("/api/ai/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audioDataUrl: base64DataUrl }),
            });
            const data = await res.json();
            if (data.text) {
              setAiCommandText((prev) => (prev ? `${prev} ${data.text}` : data.text));
              toast.success(`🎙️ Transcribed: "${data.text}"`);
            } else {
              toast.info("Voice memo recorded & attached for Gemini AI!");
            }
          } catch (e) {
            console.warn("Transcription error:", e);
            toast.info("Voice memo recorded & attached for Gemini AI!");
          } finally {
            setIsTranscribing(false);
            setAiStatusMsg("");
          }
        };

        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
      toast.info("🎙️ Recording started! Speak your website changes...");
    } catch (err) {
      const error = err as Error;
      console.error("Audio recording error:", error);
      toast.error("Microphone access denied: " + (error?.message || "Please allow mic permissions"));
      setIsRecording(false);
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const toggleAudioRecording = () => {
    if (isRecording) {
      stopAudioRecording();
    } else {
      startAudioRecording();
    }
  };

  // THE MAIN FEATURE: Gemini AI Text & Multimodal Command Execution
  const handleRunAiCommand = async (customPrompt?: string) => {
    const promptToRun = customPrompt || aiCommandText;
    if (!promptToRun.trim() && attachments.length === 0) {
      toast.error("Please enter a command, record audio, or attach an image/file");
      return;
    }

    // Stop recording if active
    if (isRecording) {
      stopAudioRecording();
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
        if (data.changes && Array.isArray(data.changes)) {
          setAiThoughts(data.changes);
        }
        toast.success(`✨ ${data.message || "Changes applied by Gemini AI!"}`);
        setAiCommandText("");
        setAttachments([]);
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error?.message || "AI Command execution failed");
    } finally {
      setIsAiProcessing(false);
      setAiStatusMsg("");
    }
  };

  // Move Section Up/Down
  const moveSection = (idOrIndex: string | number, dir: "up" | "down") => {
    const trueIndex =
      typeof idOrIndex === "string"
        ? config.sections.findIndex((s) => s.id === idOrIndex)
        : idOrIndex;
    if (trueIndex < 0 || trueIndex >= config.sections.length) return;
    const targetIdx = dir === "up" ? trueIndex - 1 : trueIndex + 1;
    if (targetIdx < 0 || targetIdx >= config.sections.length) return;
    const nextSections = [...config.sections];
    const temp = nextSections[trueIndex];
    nextSections[trueIndex] = nextSections[targetIdx];
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
    const newId = `sec-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const template = DEFAULT_SECTIONS.find((s) => s.type === type);
    const newSec: WebsiteSection = template
      ? {
          ...JSON.parse(JSON.stringify(template)),
          id: newId,
          enabled: true,
        }
      : {
          id: newId,
          type,
          title: `New ${type.replace(/_/g, " ").toUpperCase()} Section`,
          content: "Custom restaurant section content.",
          enabled: true,
        };

    updateConfigWithHistory({ ...config, sections: [...config.sections, newSec] });
    setSelectedSectionId(newId);
    setActiveDrawer("inspector");
    toast.success(`Added ${newSec.title}`);
  };

  const selectedSection = config.sections.find((s) => s.id === selectedSectionId);
  const activeModelObj = GEMINI_MODELS.find((m) => m.id === selectedModel) || GEMINI_MODELS[0];
  const activeSections = config.sections.filter((s) => s.enabled);

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
          {/* AI Studio Playground Mode Button */}
          <button
            onClick={() => setIsAiStudioMode(!isAiStudioMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              isAiStudioMode
                ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-[#f98b25] text-[#f98b25] shadow-lg shadow-[#f98b25]/10"
                : "bg-[#141a24] border-white/10 text-slate-300 hover:text-white hover:border-white/20"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Studio</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

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
        {/* LEFT AI STUDIO PLAYGROUND PANEL (Google AI Studio Experience) */}
        {isAiStudioMode && (
          <aside className="w-80 md:w-96 border-r border-white/10 bg-[#0c1017] flex flex-col shrink-0 h-full z-30 shadow-2xl transition-all">
            {/* Top Panel Header */}
            <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between bg-[#111622]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-[#f98b25] flex items-center justify-center text-white shadow">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">AI Studio Assistant</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Active: {activeModelObj.name}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAiStudioMode(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                title="Collapse AI Studio Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Studio Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Active Model Selector */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Intelligence Engine
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {GEMINI_MODELS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m.id);
                        toast.info(`Switched to ${m.name}`);
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedModel === m.id
                          ? "bg-[#f98b25]/15 border-[#f98b25] text-white"
                          : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <span>{m.icon}</span>
                        <span className="truncate">{m.name}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate mt-0.5">{m.badge}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step-by-Step AI Reasoning Bullets (Like Google AI Studio in Image 4!) */}
              <div className="space-y-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Verification & Trace</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Realtime</span>
                </div>

                <div className="space-y-2 pt-1 text-slate-300 text-[11px]">
                  {aiThoughts.map((t, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-[#f98b25] font-bold mt-0.5">•</span>
                      <p className="leading-snug">{t}</p>
                    </div>
                  ))}
                </div>

                {/* Checkpoint & History Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
                  <span className="text-slate-400">Checkpoint #{historyIndex + 1}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
                    >
                      Redo
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick AI Presets / Capabilities */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Quick Actions
                </span>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleRunAiCommand(
                        "Add interactive architectural floor plan & seating chart with live table booking"
                      )
                    }
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left text-slate-200 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <span>🗺️ Add Interactive Floor Plan</span>
                    <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">Run →</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleRunAiCommand(
                        "Design luxury dark steakhouse with royal gold buttons, fine dining typography, and VIP table reservations"
                      )
                    }
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left text-slate-200 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <span>👑 Luxury Gold Steakhouse</span>
                    <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">Run →</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleRunAiCommand(
                        "Switch to authentic Uzbek flame grill theme with signature wedding plov and clay oven somsa"
                      )
                    }
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left text-slate-200 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <span>🔥 Authentic Uzbek Flame Grill</span>
                    <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">Run →</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleRunAiCommand(
                        "Add special Ramadan holiday discount banner with 15% off and Iftar dates"
                      )
                    }
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left text-slate-200 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <span>🌙 Ramadan Iftar Special</span>
                    <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">Run →</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Command Dock inside Sidebar */}
            <div className="p-3 border-t border-white/10 bg-[#111622] space-y-2">
              {/* Attached Media List */}
              {attachments.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white shrink-0"
                    >
                      <span className="truncate max-w-[90px]">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="hover:text-rose-400 text-slate-400 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Recording indicator */}
              {isRecording && (
                <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
                  <span className="animate-pulse">🎙️ Recording: {recordingSeconds}s</span>
                  <button
                    type="button"
                    onClick={stopAudioRecording}
                    className="px-2 py-0.5 rounded bg-rose-500 text-white font-bold text-[10px] cursor-pointer"
                  >
                    Stop
                  </button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunAiCommand();
                }}
                className="flex items-center gap-1.5"
              >
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 cursor-pointer"
                  title="Attach Floor Plan or Photo"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={toggleAudioRecording}
                  className={`p-2 rounded-xl border cursor-pointer ${
                    isRecording
                      ? "bg-rose-500 text-white animate-pulse"
                      : "bg-white/5 text-slate-300 hover:text-white border-white/10"
                  }`}
                  title="Record Voice"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  value={aiCommandText}
                  onChange={(e) => setAiCommandText(e.target.value)}
                  onPaste={handleClipboardPaste}
                  placeholder="Ask Gemini to build anything..."
                  disabled={isAiProcessing}
                  className="flex-1 bg-[#090d16] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#f98b25]"
                />
                <Button
                  type="submit"
                  disabled={isAiProcessing || (!aiCommandText.trim() && attachments.length === 0)}
                  className="bg-[#f98b25] hover:bg-[#e07b1d] text-white h-8 px-3 rounded-xl shrink-0 cursor-pointer"
                >
                  {isAiProcessing ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                </Button>
              </form>
            </div>
          </aside>
        )}

        {/* CENTER STAGE: LIVE INTERACTIVE PREVIEW */}
        <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 flex flex-col items-center justify-start bg-gradient-to-b from-[#0a0d14] to-[#040609]">
          {/* Realistic Browser Viewport Mockup */}
          <div
            className={`transition-all duration-300 shadow-2xl bg-[#0d1117] flex flex-col overflow-hidden mb-36 ${
              isMobile
                ? "w-[390px] h-[780px] max-h-[82vh] rounded-[48px] border-[10px] border-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] ring-1 ring-white/10 relative"
                : isTablet
                ? "w-[768px] h-[850px] max-h-[85vh] rounded-[32px] border-[8px] border-slate-900 shadow-2xl ring-1 ring-white/10"
                : "w-full max-w-[1280px] rounded-2xl border border-white/10"
            }`}
          >
            {/* Realistic Header: Smartphone Dynamic Island or Desktop Browser Bar */}
            {isMobile ? (
              <div className="bg-[#161b22] border-b border-white/[0.04] shrink-0">
                <div className="h-9 px-6 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono font-bold text-white text-xs">9:41</span>
                  <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center gap-1.5 shadow-inner">
                    <span className="w-2 h-2 rounded-full bg-slate-900 border border-white/10" />
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300 text-[10px] font-semibold">
                    <span>5G</span>
                    <span className="w-4 h-2 border border-white/40 rounded-sm p-0.5 flex items-center">
                      <span className="w-full h-full bg-emerald-400 rounded-[1px]" />
                    </span>
                  </div>
                </div>
                {/* Mobile URL Address Bar */}
                <div className="px-4 pb-2 pt-0.5 flex items-center justify-center">
                  <div className="flex items-center gap-1.5 bg-[#0d1117] border border-white/5 px-3 py-1 rounded-full text-[11px] font-mono text-slate-300 w-full justify-center">
                    <span className="text-emerald-400 text-[10px]">🔒</span>
                    <span className="truncate">{restaurantSlug}.plately.uz</span>
                  </div>
                </div>
              </div>
            ) : (
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
            )}

            {/* LIVE PREVIEW CANVAS CONTENT */}
            <div
              className="flex-1 overflow-y-auto text-slate-100 scrollbar-thin"
              style={getThemeStyles(config)}
            >
              {/* TOP ANNOUNCEMENT BAR */}
              {config.sections.find((s) => s.type === "announcement" && s.enabled) && (
                <div
                  className={`text-center font-medium border-b border-white/10 flex items-center justify-center gap-2 relative group ${
                    isMobile ? "py-1.5 px-3 text-[11px]" : "py-2 px-4 text-xs"
                  }`}
                  style={{ backgroundColor: `${config.primaryColor}20`, color: config.primaryColor }}
                >
                  <span className="truncate">{config.deliveryNotice}</span>
                  <button
                    onClick={() => {
                      setSelectedSectionId("sec-announcement");
                      setActiveDrawer("inspector");
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-[10px] underline shrink-0 cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              )}

              {/* STOREFRONT HEADER NAV */}
              <nav
                className={`border-b border-white/[0.08] flex items-center justify-between sticky top-0 bg-[#0d1117]/90 backdrop-blur-md z-10 ${
                  isMobile ? "px-4 py-3" : "px-6 py-4"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`flex items-center justify-center font-bold text-white shadow-lg shrink-0 ${
                      getRadiusClass(config.borderRadius, "badge")
                    } ${
                      isMobile ? "w-8 h-8 text-xs" : "w-9 h-9 text-sm"
                    }`}
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    {restaurantName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-xs sm:text-sm text-white tracking-tight truncate">
                      {restaurantName}
                    </h2>
                    <p className="text-[9px] text-slate-400 truncate">Authentic Cuisine • Tashkent</p>
                  </div>
                </div>

                {/* Desktop Nav Links (Hidden on Mobile) */}
                {!isMobile && (
                  <div className="flex items-center gap-6 text-xs text-slate-300 font-medium">
                    <span className="hover:text-white cursor-pointer">Menu</span>
                    <span className="hover:text-white cursor-pointer">Our Story</span>
                    <span className="hover:text-white cursor-pointer">Floor Plan</span>
                    <span className="hover:text-white cursor-pointer">Reviews</span>
                  </div>
                )}

                {/* Right Action / Mobile Hamburger */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className={`font-semibold text-white shadow-md transition-transform hover:scale-105 shrink-0 ${
                      getRadiusClass(config.borderRadius, "button")
                    } ${
                      isMobile ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs"
                    }`}
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    {config.heroButtonText || "Order"}
                  </button>
                  {isMobile && (
                    <button className="p-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                      <MenuIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </nav>

              {/* RENDER ACTIVE SECTIONS IN EXACT ORDER */}
              <div className="divide-y divide-white/[0.05]">
                {activeSections.map((section, index) => (
                    <div
                      key={section.id}
                      onClick={() => {
                        setSelectedSectionId(section.id);
                        setActiveDrawer("inspector");
                      }}
                      className={`relative group transition-all cursor-pointer ${
                        isMobile ? "p-4" : "p-6 md:p-10"
                      } ${
                        selectedSectionId === section.id
                          ? "ring-2 ring-inset ring-[#f98b25] bg-[#f98b25]/[0.02]"
                          : "hover:bg-white/[0.01]"
                      }`}
                    >
                      {/* Section Hover Mini Toolbar */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all bg-[#161b22] border border-white/10 rounded-lg p-1 flex items-center gap-1 shadow-xl z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(section.id, "up");
                          }}
                          disabled={index === 0}
                          className="p-1 hover:text-[#f98b25] text-slate-400 disabled:opacity-20 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(section.id, "down");
                          }}
                          disabled={index === activeSections.length - 1}
                          className="p-1 hover:text-[#f98b25] text-slate-400 disabled:opacity-20 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSectionId(section.id);
                            setActiveDrawer("inspector");
                          }}
                          className="p-1 hover:text-white text-slate-400 cursor-pointer"
                          title="Edit in Inspector"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSection(section.id);
                          }}
                          className="p-1 hover:text-amber-400 text-slate-400 cursor-pointer"
                          title="Hide Section"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSection(section.id);
                          }}
                          className="p-1 hover:text-rose-400 text-slate-400 cursor-pointer"
                          title="Delete Section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* SECTION 1: HERO */}
                      {section.type === "hero" && (
                        <HeroSection
                          section={section}
                          config={config}
                          isMobile={isMobile}
                          onPrimaryCtaClick={() => toast.success("CTA: Order Online clicked")}
                          onSecondaryCtaClick={() => toast.success("CTA: Explore Menu clicked")}
                        />
                      )}

                      {/* SECTION 2: ABOUT & BRAND STORY */}
                      {section.type === "about" && (
                        <BrandStorySection
                          section={section}
                          config={config}
                          isMobile={isMobile}
                        />
                      )}

                      {/* SECTION 3: INTERACTIVE MENU SHOWCASE */}
                      {(section.type === "menu" || section.type === "menu_showcase") && (
                        <MenuShowcaseSection
                          section={section}
                          config={config}
                          isMobile={isMobile}
                          onAddToCart={(dish) => toast.success(`Added ${dish.name} to order`)}
                        />
                      )}

                      {/* SECTION 4: INTERACTIVE FLOOR PLAN & TABLE SELECTION */}
                      {section.type === "table_selection" && (
                        <FloorPlanSection
                          section={section}
                          config={config}
                          isMobile={isMobile}
                          selectedTableId={selectedTableId}
                          onTableSelect={(table) => setSelectedTableId(table.id)}
                          onReservationConfirm={(table, slot) =>
                            toast.success(
                              `🎉 ${table.name} reserved for ${slot}! Instant SMS & WhatsApp confirmation sent.`
                            )
                          }
                        />
                      )}

                      {/* SECTION 5: CHEF HIGHLIGHTS */}
                      {(section.type === "highlights" || section.type === "chef_highlights") && (
                        <ChefHighlightsSection
                          section={section}
                          config={config}
                          isMobile={isMobile}
                        />
                      )}

                      {/* SECTION 6: CUSTOMER REVIEWS */}
                      {section.type === "reviews" && (
                        <ReviewsSection
                          section={section}
                          config={config}
                          isMobile={isMobile}
                        />
                      )}

                      {/* SECTION 7: HOURS & LOCATION */}
                      {section.type === "hours_location" && (
                        <HoursLocationSection
                          section={section}
                          config={config}
                          isMobile={isMobile}
                        />
                      )}

                      {/* SECTION 8: TABLE BOOKING FORM */}
                      {section.type === "booking" && (
                        <div
                          className={`max-w-2xl mx-auto border border-white/10 bg-[#141a24]/80 backdrop-blur-md shadow-2xl space-y-4 ${
                            getRadiusClass(config.borderRadius, "card")
                          } ${isMobile ? "p-4" : "p-6 md:p-8 space-y-6"}`}
                        >
                          <div className="text-center space-y-1">
                            <span
                              className="text-[10px] font-bold uppercase tracking-widest"
                              style={{ color: config.primaryColor }}
                            >
                              {section.subtitle || "RESERVE YOUR TABLE"}
                            </span>
                            <h2
                              className={`font-bold text-white tracking-tight ${
                                isMobile ? "text-xl" : "text-2xl md:text-3xl"
                              }`}
                            >
                              {section.title}
                            </h2>
                            <p className="text-[11px] text-slate-400">
                              {typeof section.content === "string" ? section.content : ""}
                            </p>
                          </div>

                          <div
                            className={`gap-2.5 text-xs ${
                              isMobile ? "flex flex-col" : "grid grid-cols-2 md:grid-cols-3"
                            }`}
                          >
                            <div>
                              <label className="text-slate-400 block mb-1 text-[11px]">Guests</label>
                              <select className={`w-full bg-[#0d1117] border border-white/10 p-2 text-white text-xs ${getRadiusClass(config.borderRadius, "input")}`}>
                                <option>2 Guests (Romantic)</option>
                                <option>4 Guests (Family)</option>
                                <option>6-8 Guests (Celebration)</option>
                                <option>10+ Guests (Private Room)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-slate-400 block mb-1 text-[11px]">Date</label>
                              <input
                                type="date"
                                defaultValue={new Date().toISOString().split("T")[0]}
                                className={`w-full bg-[#0d1117] border border-white/10 p-2 text-white text-xs ${getRadiusClass(config.borderRadius, "input")}`}
                              />
                            </div>
                            <div className={isMobile ? "" : "col-span-2 md:col-span-1"}>
                              <label className="text-slate-400 block mb-1 text-[11px]">Time Slot</label>
                              <select className={`w-full bg-[#0d1117] border border-white/10 p-2 text-white text-xs ${getRadiusClass(config.borderRadius, "input")}`}>
                                <option>13:00 - Lunch</option>
                                <option>18:30 - Dinner</option>
                                <option>20:00 - Evening</option>
                              </select>
                            </div>
                          </div>

                          <button
                            type="button"
                            className={`w-full font-bold text-white shadow-xl transition-transform hover:scale-[1.01] cursor-pointer ${
                              getRadiusClass(config.borderRadius, "button")
                            } ${isMobile ? "py-2.5 text-xs" : "py-3 text-sm"}`}
                            style={{ backgroundColor: config.primaryColor }}
                            onClick={() => toast.success("Reservation request sent!")}
                          >
                            {section.meta?.buttonText || "Confirm Table Reservation"}
                          </button>
                        </div>
                      )}

                      {/* SECTION 9: PHOTO GALLERY */}
                      {section.type === "gallery" && (
                        <div className="space-y-3">
                          <div className="text-center max-w-xl mx-auto space-y-1">
                            <span
                              className="text-[10px] font-bold uppercase tracking-widest"
                              style={{ color: config.primaryColor }}
                            >
                              {section.subtitle || "GALLERY"}
                            </span>
                            <h2 className={`font-bold text-white ${isMobile ? "text-xl" : "text-2xl"}`}>
                              {section.title}
                            </h2>
                          </div>

                          <div
                            className={`grid gap-2 ${
                              isMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4 gap-3"
                            }`}
                          >
                            {PHOTO_PRESETS.slice(0, 4).map((img, i) => (
                              <div
                                key={i}
                                className={`bg-cover bg-center border border-white/10 overflow-hidden hover:scale-[1.02] transition-transform ${
                                  getRadiusClass(config.borderRadius, "card")
                                } ${isMobile ? "h-28" : "h-36"}`}
                                style={{ backgroundImage: `url(${img.url})` }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SECTION 10: FAQ */}
                      {section.type === "faq" && (
                        <div className="max-w-2xl mx-auto space-y-3">
                          <div className="text-center space-y-1">
                            <span
                              className="text-[10px] font-bold uppercase tracking-widest"
                              style={{ color: config.primaryColor }}
                            >
                              {section.subtitle || "FAQ"}
                            </span>
                            <h2 className={`font-bold text-white ${isMobile ? "text-xl" : "text-2xl"}`}>
                              {section.title}
                            </h2>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className={`p-3 border border-white/10 bg-slate-900/60 ${getRadiusClass(config.borderRadius, "card")}`}>
                              <p className="font-bold text-white mb-1">Is all meat Halal certified?</p>
                              <p className="text-slate-400">Yes, 100% of our lamb, beef, and poultry are certified Halal from verified local farms.</p>
                            </div>
                            <div className={`p-3 border border-white/10 bg-slate-900/60 ${getRadiusClass(config.borderRadius, "card")}`}>
                              <p className="font-bold text-white mb-1">How fast is delivery?</p>
                              <p className="text-slate-400">Our couriers deliver fresh piping hot food within 35 minutes across Tashkent.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SECTION 11: CTA BANNER */}
                      {section.type === "cta" && (
                        <div
                          className={`text-center space-y-3 text-white shadow-2xl relative overflow-hidden ${
                            getRadiusClass(config.borderRadius, "card")
                          } ${isMobile ? "p-5" : "p-8 space-y-4"}`}
                          style={{
                            background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor || "#e11d48"})`,
                          }}
                        >
                          <h2 className={`font-extrabold ${isMobile ? "text-xl" : "text-3xl"}`}>
                            {section.title}
                          </h2>
                          <p className={`opacity-90 max-w-lg mx-auto ${isMobile ? "text-xs" : "text-sm"}`}>
                            {typeof section.content === "string" ? section.content : ""}
                          </p>
                          <button
                            type="button"
                            className={`font-bold bg-black text-white hover:bg-slate-900 shadow-xl transition-transform hover:scale-105 cursor-pointer ${
                              getRadiusClass(config.borderRadius, "button")
                            } ${isMobile ? "w-full py-2.5 text-xs" : "px-8 py-3 text-sm"}`}
                            onClick={() => toast.success("CTA button clicked")}
                          >
                            {section.meta?.buttonText || "Order Online Now"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* FOOTER */}
              <footer className="border-t border-white/[0.08] p-6 text-center text-xs text-slate-500 space-y-1.5">
                <p className="text-slate-400 font-semibold">{restaurantName} • Official Digital Storefront</p>
                <p>© {new Date().getFullYear()} All Rights Reserved • Powered by Plately Workshop</p>
              </footer>
            </div>

            {/* Mobile Bottom Home Bar */}
            {isMobile && (
              <div className="h-6 bg-[#161b22] flex items-center justify-center shrink-0 border-t border-white/[0.04]">
                <div className="w-32 h-1 bg-white/20 rounded-full" />
              </div>
            )}
          </div>
        </div>

        {/* 3. THE MAIN FEATURE: MULTIMODAL GEMINI AI COMMAND DOCK (Shown when not in AI Studio mode) */}
        {!isAiStudioMode && (
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

            {/* Live Audio Recording Bar */}
            {isRecording && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs shadow-lg animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-bold text-white">Recording Voice Audio: {recordingSeconds}s</span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">(Speak Uzbek, Russian, or English...)</span>
                </div>
                <button
                  type="button"
                  onClick={stopAudioRecording}
                  className="px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-sm bg-white" />
                  <span>Stop & Transcribe</span>
                </button>
              </div>
            )}

            {/* Transcribing Indicator */}
            {isTranscribing && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#f98b25]/15 border border-[#f98b25]/30 text-[#f98b25] text-xs font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Gemini AI is transcribing your voice recording...</span>
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
                accept="image/*,audio/*,application/pdf,.doc,.docx"
                className="hidden"
              />

              {/* Attach File/Photo/Audio Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl bg-[#141a24] border border-white/10 hover:border-[#f98b25] text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Attach food photo, audio memo, logo, or PDF"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Voice Audio Recording Button */}
              <button
                type="button"
                onClick={toggleAudioRecording}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isRecording
                    ? "bg-rose-500 border-rose-400 text-white animate-pulse ring-4 ring-rose-500/40"
                    : "bg-[#141a24] border-white/10 hover:border-[#f98b25] text-slate-300 hover:text-white"
                }`}
                title={isRecording ? "Stop Audio Recording" : "Record Voice Memo (MediaRecorder)"}
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
        )}

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

                {/* Drag-and-Drop Reorder Section List */}
                <Reorder.Group
                  axis="y"
                  values={config.sections}
                  onReorder={(newOrder) => {
                    updateConfigWithHistory({ ...config, sections: newOrder });
                  }}
                  className="space-y-2"
                >
                  {config.sections.map((section, idx) => (
                    <Reorder.Item
                      key={section.id}
                      value={section}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors cursor-pointer select-none ${
                        selectedSectionId === section.id
                          ? "border-[#f98b25] bg-[#f98b25]/10 text-white shadow-md"
                          : section.enabled
                          ? "border-white/10 bg-[#141a24] text-slate-200 hover:border-white/20"
                          : "border-white/5 bg-slate-900/40 text-slate-500 opacity-60"
                      }`}
                      onClick={() => {
                        setSelectedSectionId(section.id);
                        setActiveDrawer("inspector");
                      }}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <GripVertical className="w-4 h-4 text-slate-500 shrink-0 cursor-grab active:cursor-grabbing hover:text-white transition-colors" />
                        <span className="font-semibold truncate">{section.title}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(idx, "up");
                          }}
                          disabled={idx === 0}
                          className="p-1 hover:text-[#f98b25] text-slate-400 disabled:opacity-20 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(idx, "down");
                          }}
                          disabled={idx === config.sections.length - 1}
                          className="p-1 hover:text-[#f98b25] text-slate-400 disabled:opacity-20 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSection(section.id);
                          }}
                          className="p-1 hover:text-white text-slate-400 cursor-pointer"
                          title={section.enabled ? "Hide Section" : "Show Section"}
                        >
                          {section.enabled ? (
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSection(section.id);
                          }}
                          className="p-1 hover:text-rose-400 text-slate-400 cursor-pointer"
                          title="Delete Section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>

                {/* Add Block Palette — All 7 Modular Sections + Utilities */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Add Section to Page
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleAddSection("hero")}
                      className="p-2.5 rounded-lg border border-white/10 bg-[#141a24] hover:border-[#f98b25] text-left flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-[#f98b25]" />
                      <span>Hero Banner</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection("about")}
                      className="p-2.5 rounded-lg border border-white/10 bg-[#141a24] hover:border-[#f98b25] text-left flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <FileText className="w-4 h-4 text-[#f98b25]" />
                      <span>Brand Story</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection("menu")}
                      className="p-2.5 rounded-lg border border-white/10 bg-[#141a24] hover:border-[#f98b25] text-left flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Utensils className="w-4 h-4 text-[#f98b25]" />
                      <span>Menu Showcase</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection("table_selection")}
                      className="p-2.5 rounded-lg border border-white/10 bg-[#141a24] hover:border-[#f98b25] text-left flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-[#f98b25]" />
                      <span>Floor Plan Map</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection("highlights")}
                      className="p-2.5 rounded-lg border border-white/10 bg-[#141a24] hover:border-[#f98b25] text-left flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <ChefHat className="w-4 h-4 text-[#f98b25]" />
                      <span>Chef Highlights</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection("reviews")}
                      className="p-2.5 rounded-lg border border-white/10 bg-[#141a24] hover:border-[#f98b25] text-left flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Star className="w-4 h-4 text-[#f98b25]" />
                      <span>Guest Reviews</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection("hours_location")}
                      className="p-2.5 rounded-lg border border-white/10 bg-[#141a24] hover:border-[#f98b25] text-left flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-[#f98b25]" />
                      <span>Hours & Location</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection("booking")}
                      className="p-2.5 rounded-lg border border-white/10 bg-[#141a24] hover:border-[#f98b25] text-left flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Clock className="w-4 h-4 text-[#f98b25]" />
                      <span>Table Booking</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection("gallery")}
                      className="p-2.5 rounded-lg border border-white/10 bg-[#141a24] hover:border-[#f98b25] text-left flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <ImageIcon className="w-4 h-4 text-[#f98b25]" />
                      <span>Photo Gallery</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection("faq")}
                      className="p-2.5 rounded-lg border border-white/10 bg-[#141a24] hover:border-[#f98b25] text-left flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-[#f98b25]" />
                      <span>FAQ Section</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection("cta")}
                      className="p-2.5 rounded-lg border border-white/10 bg-[#141a24] hover:border-[#f98b25] text-left flex items-center gap-2 cursor-pointer transition-colors"
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
                      value={
                        typeof selectedSection.content === "string"
                          ? selectedSection.content
                          : JSON.stringify(selectedSection.content, null, 2)
                      }
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
                        type="button"
                        onClick={() => {
                          updateConfigWithHistory({
                            ...config,
                            primaryColor: t.primary,
                            secondaryColor: t.secondary,
                            backgroundColor: t.bg,
                            cardColor: t.card,
                            fontFamily: t.font,
                            borderRadius: t.borderRadius || "rounded",
                          });
                          toast.success(`Applied ${t.name} Theme`);
                        }}
                        className="p-2.5 rounded-xl border border-white/10 bg-[#141a24] hover:border-white/25 text-left space-y-2 cursor-pointer transition-colors"
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

                {/* Border Radius Design Token Selector */}
                <div className="space-y-2 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-300 uppercase tracking-wider font-bold">
                      Border Radius Scale
                    </Label>
                    <span className="text-[10px] text-amber-400 font-mono font-bold uppercase">
                      {config.borderRadius || "rounded"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        value: "sharp" as const,
                        label: "Sharp",
                        sub: "0px",
                        previewClass: "rounded-none",
                      },
                      {
                        value: "rounded" as const,
                        label: "Rounded",
                        sub: "12px",
                        previewClass: "rounded-lg",
                      },
                      {
                        value: "pill" as const,
                        label: "Pill",
                        sub: "9999px",
                        previewClass: "rounded-full",
                      },
                    ].map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => {
                          updateConfigWithHistory({ ...config, borderRadius: r.value });
                          toast.info(`Border Radius: ${r.label} (${r.sub})`);
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          config.borderRadius === r.value
                            ? "border-[#f98b25] bg-[#f98b25]/15 text-white shadow-md font-bold"
                            : "border-white/10 bg-[#141a24] text-slate-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        <div className="flex justify-center mb-1.5">
                          <div
                            className={`w-8 h-4 border-2 ${r.previewClass}`}
                            style={{
                              borderColor:
                                config.borderRadius === r.value ? config.primaryColor : "#64748b",
                              backgroundColor:
                                config.borderRadius === r.value
                                  ? `${config.primaryColor}30`
                                  : "transparent",
                            }}
                          />
                        </div>
                        <div className="text-xs font-semibold leading-tight">{r.label}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{r.sub}</div>
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
                        type="button"
                        onClick={() => updateConfigWithHistory({ ...config, fontFamily: f.font })}
                        className={`w-full p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
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

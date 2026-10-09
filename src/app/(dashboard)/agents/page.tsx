"use client";

import React, { useState } from "react";
import {
  Bot,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Shield,
  Layers,
  TrendingUp,
  Megaphone,
  ChefHat,
  MessageSquare,
  PhoneCall,
  Truck,
  ArrowRight,
  AlertCircle,
  FileEdit,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export type AgentRole =
  | "setup_site"
  | "marketing"
  | "analytics"
  | "reputation"
  | "customer_service"
  | "voice_concierge"
  | "dispatch";

export interface AgentDefinition {
  id: AgentRole;
  name: string;
  category: string;
  icon: any;
  status: "idle" | "observing" | "action_ready";
  description: string;
  allowedData: string[];
  skills: string[];
}

export interface PendingAction {
  id: string;
  agentRole: AgentRole;
  agentName: string;
  title: string;
  summary: string;
  impact: string;
  suggestedAt: string;
  status: "pending" | "approved" | "rejected";
  payload: Record<string, any>;
}

const AGENTS: AgentDefinition[] = [
  {
    id: "marketing",
    name: "Marketing & Campaigns Agent",
    category: "Growth & Retention",
    icon: Megaphone,
    status: "action_ready",
    description: "Monitors guest frequency and drafts high-converting Telegram, Instagram, and SMS promotions.",
    allowedData: ["Orders", "Promotions", "Menu Items", "Customer Tags"],
    skills: ["Telegram Copywriter", "Promo Code Generator", "Instagram Visual Drafter"],
  },
  {
    id: "analytics",
    name: "Operational Analytics Agent",
    category: "Efficiency & Margin",
    icon: TrendingUp,
    status: "action_ready",
    description: "Evaluates dish profit margins, predicts hourly kitchen rushes, and flags slow-moving inventory.",
    allowedData: ["Sales History", "Order Prep Times", "Menu Costs"],
    skills: ["Demand Forecaster", "Price Suggestion", "Margin Optimization"],
  },
  {
    id: "reputation",
    name: "Reputation & Review Agent",
    category: "Brand Protection",
    icon: MessageSquare,
    status: "idle",
    description: "Monitors incoming guest ratings, drafts personalized multilingual replies, and highlights service issues.",
    allowedData: ["Guest Reviews", "Customer Profiles", "Order Details"],
    skills: ["Multilingual Response", "Sentiment Analysis", "Issue Escalation"],
  },
  {
    id: "voice_concierge",
    name: "Voice Concierge Agent",
    category: "Phone & Telephony",
    icon: PhoneCall,
    status: "action_ready",
    description: "Listens to incoming customer phone orders in Uzbek/Russian, validates menu stock, and prepares tickets.",
    allowedData: ["Phone Audio", "Menu Stock", "Delivery Zones"],
    skills: ["Speech-to-Text Parsing", "Human Escalation Guard", "Live Order Staging"],
  },
  {
    id: "dispatch",
    name: "Delivery Dispatcher Agent",
    category: "Logistics",
    icon: Truck,
    status: "idle",
    description: "Calculates optimal Noor/Yandex courier routes, monitors driver assignment, and protects against delivery delays.",
    allowedData: ["Active Deliveries", "Tashkent Traffic", "Courier Webhooks"],
    skills: ["Courier Auto-Selector", "Haversine Distance Engine", "ETA Calculator"],
  },
  {
    id: "setup_site",
    name: "Site & Storefront Agent",
    category: "Digital Presence",
    icon: Layers,
    status: "idle",
    description: "Continuously checks SEO meta tags, mobile responsiveness, and updates seasonal storefront banners.",
    allowedData: ["Website Config", "Menu Items", "Operating Hours"],
    skills: ["Prompt-to-Site Compiler", "SEO Generator", "Theme Customizer"],
  },
  {
    id: "customer_service",
    name: "Guest Concierge Agent",
    category: "Support",
    icon: ChefHat,
    status: "idle",
    description: "Answers guest dietary inquiries, table booking requests, and reservation modifications.",
    allowedData: ["Reservations", "Menu Allergens", "Guest History"],
    skills: ["Allergy Guard", "Booking Manager", "FAQ Assistant"],
  },
];

const INITIAL_ACTIONS: PendingAction[] = [
  {
    id: "act-101",
    agentRole: "marketing",
    agentName: "Marketing & Campaigns Agent",
    title: "Launch Friday Evening Osh Special (15% Off)",
    summary: "Predicted dinner rush on Friday between 18:00 and 21:00. Generated Telegram post and promo code 'KAMOLON15'.",
    impact: "+18-25 projected orders",
    suggestedAt: "10 minutes ago",
    status: "pending",
    payload: { promoCode: "KAMOLON15", discount: 15, platform: "Telegram" },
  },
  {
    id: "act-102",
    agentRole: "analytics",
    agentName: "Operational Analytics Agent",
    title: "Optimize Lamb Shashlik Price (+3,000 UZS)",
    summary: "Local Tashkent benchmark indicates grilled lamb skewers tolerate modest price adjustment to 31,000 UZS without guest loss.",
    impact: "+9.2% category margin",
    suggestedAt: "25 minutes ago",
    status: "pending",
    payload: { item: "Special Lamb Shashlik", currentPrice: 28000, newPrice: 31000 },
  },
  {
    id: "act-103",
    agentRole: "voice_concierge",
    agentName: "Voice Concierge Agent",
    title: "Phone Call Order Verified — Amir Temur St (108,000 UZS)",
    summary: "Caller ordered 2x Tashkent Choyxona Palov + 1x Achichuk. Address verified. Confidence score 94%. Ready to push to KDS.",
    impact: "Order ready for kitchen accept",
    suggestedAt: "3 minutes ago",
    status: "pending",
    payload: { itemsCount: 3, total: 108000, type: "delivery" },
  },
];

export default function AgentsHubPage() {
  const { user } = useAuthStore();
  const [actions, setActions] = useState<PendingAction[]>(INITIAL_ACTIONS);
  const [selectedAgent, setSelectedAgent] = useState<AgentRole>("marketing");
  const [commandInput, setCommandInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const pendingCount = actions.filter((a) => a.status === "pending").length;

  const handleApprove = (actionId: string) => {
    const act = actions.find((a) => a.id === actionId);
    setActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, status: "approved" } : a))
    );
    toast.success(`Action Approved: "${act?.title}" has been executed!`);
  };

  const handleReject = (actionId: string) => {
    const act = actions.find((a) => a.id === actionId);
    setActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, status: "rejected" } : a))
    );
    toast.info(`Action Dismissed: "${act?.title}" was rejected.`);
  };

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    setIsProcessing(true);
    setTimeout(() => {
      const newAction: PendingAction = {
        id: `act-${Date.now().toString().slice(-4)}`,
        agentRole: selectedAgent,
        agentName: AGENTS.find((a) => a.id === selectedAgent)?.name || "AI Agent",
        title: `Draft Task: ${commandInput.slice(0, 45)}...`,
        summary: `AI parsed your command: "${commandInput}". Ready for your approval.`,
        impact: "Requires owner confirmation",
        suggestedAt: "Just now",
        status: "pending",
        payload: { command: commandInput },
      };

      setActions((prev) => [newAction, ...prev]);
      setCommandInput("");
      setIsProcessing(false);
      toast.success("Agent processed your task! Check the Approval Inbox below.");
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-[#f98b25]/20 text-[#f98b25]">
              <Bot className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-white">
              AI Agent Operating System
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Dedicated specialized agents that observe, draft, and recommend operational improvements for {user?.restaurant_name || "your restaurant"}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-[#f98b25]/10 text-[#f98b25] border-[#f98b25]/30 px-3 py-1 text-xs">
            <Shield className="w-3.5 h-3.5 mr-1.5" />
            Human Approval Mandatory
          </Badge>
        </div>
      </div>

      {/* Global Conversational Agent Command Bar */}
      <div className="p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#161b22] shadow-xl">
        <form onSubmit={handleSendCommand} className="flex gap-3">
          <div className="relative flex-1">
            <Sparkles className="w-4 h-4 text-[#f98b25] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Ask any agent (e.g. 'Create a weekend SMS discount for regulars' or 'Analyze slow dishes on Monday')..."
              className="pl-10 bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-white text-xs h-10 focus:border-[#f98b25]"
            />
          </div>
          <Button
            type="submit"
            disabled={isProcessing}
            className="bg-[#f98b25] hover:bg-[#e07b1d] text-white text-xs px-5 h-10 font-semibold shrink-0"
          >
            {isProcessing ? "Processing..." : "Command Agent"}
            <Send className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </form>
      </div>

      {/* SECTION 1: APPROVAL INBOX */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-display)]">
              Agent Approval Inbox
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#f98b25]/20 text-[#f98b25] border border-[#f98b25]/30">
              {pendingCount} Pending Review
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Rule: Consequential business actions execute only after owner confirmation.
          </span>
        </div>

        {actions.length === 0 ? (
          <div className="p-8 text-center bg-[#161b22] rounded-xl border border-[rgba(255,255,255,0.06)] text-slate-400 text-xs">
            Inbox is clean. Agents are observing live store operations.
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((act) => (
              <div
                key={act.id}
                className={`p-4 rounded-xl border transition-all ${
                  act.status === "approved"
                    ? "bg-emerald-950/20 border-emerald-500/30 opacity-70"
                    : act.status === "rejected"
                    ? "bg-red-950/20 border-red-500/20 opacity-50"
                    : "bg-[#161b22] border-[rgba(255,255,255,0.08)] hover:border-[#f98b25]/30 shadow-lg"
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#f98b25] bg-[#f98b25]/10 px-2 py-0.5 rounded border border-[#f98b25]/20">
                        {act.agentName}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {act.suggestedAt}
                      </span>
                      {act.status !== "pending" && (
                        <Badge
                          className={`text-[10px] uppercase font-bold ${
                            act.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }`}
                        >
                          {act.status}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white">{act.title}</h3>
                    <p className="text-xs text-slate-400">{act.summary}</p>
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 pt-0.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Impact: {act.impact}</span>
                    </div>
                  </div>

                  {act.status === "pending" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(act.id)}
                        className="text-xs h-8 border-[rgba(255,255,255,0.1)] text-slate-400 hover:text-white"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1 text-red-400" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(act.id)}
                        className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Approve & Execute
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: SPECIALIZED AGENT ROSTER */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-white font-[family-name:var(--font-display)]">
          Active Specialized Agents (7)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENTS.map((agent) => {
            const Icon = agent.icon;
            const isSelected = selectedAgent === agent.id;

            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-[#1c2333] border-[#f98b25] shadow-lg shadow-orange-500/10"
                    : "bg-[#161b22] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-[#0D1117] text-[#f98b25] border border-white/5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      agent.status === "action_ready"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}
                  >
                    {agent.status === "action_ready" ? "Action Drafted" : "Observing"}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white leading-tight mb-1">{agent.name}</h3>
                <p className="text-[11px] text-slate-500 uppercase font-semibold mb-2">{agent.category}</p>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{agent.description}</p>

                <div className="space-y-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Skills:</div>
                  <div className="flex flex-wrap gap-1">
                    {agent.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#0D1117] text-slate-300 border border-white/5"
                      >
                        ⚡ {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

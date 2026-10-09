"use client";

import React, { useState } from "react";
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOff,
  Mic,
  Volume2,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  ArrowRight,
  ShoppingBag,
  MapPin,
  ChefHat,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  parseVoiceCallTranscript,
  type VoiceOrderDraft,
  type KnownMenuItem,
} from "@/lib/ai/voice-ordering";
import { formatUZS } from "@/lib/format";

const SAMPLE_MENU_CATALOG: KnownMenuItem[] = [
  { name: "Tashkent Choyxona Palov", aliases: ["osh", "palov", "плов"], priceUZS: 45000, inStock: true },
  { name: "Achichuk Salad", aliases: ["achichuk", "achichuq", "ачичук"], priceUZS: 18000, inStock: true },
  { name: "Tandir Somsa", aliases: ["somsa", "самса"], priceUZS: 15000, inStock: true },
  { name: "Special Lamb Shashlik", aliases: ["shashlik", "kabob", "шашлык"], priceUZS: 28000, inStock: false }, // out of stock to demonstrate escalation
  { name: "Lemon Mint Ice Tea", aliases: ["choy", "tea", "чай"], priceUZS: 14000, inStock: true },
];

const PRESET_CALL_SCENARIOS = [
  {
    id: "sc-1",
    caller: "+998 90 123 45 67 (Otabek)",
    lang: "Uzbek",
    transcript: "Assalomu alaykum aka! Bizga 2 ta osh va 2 ta achichuk yetkazib bering, manzil: Amir Temur ko'chasi 45-uy.",
  },
  {
    id: "sc-2",
    caller: "+998 93 555 77 88 (Dilfuza)",
    lang: "Russian",
    transcript: "Здравствуйте! Нам пожалуйста три самсы и один зеленый чай на вынос.",
  },
  {
    id: "sc-3",
    caller: "+998 97 999 11 22 (Azizbek)",
    lang: "Uzbek (Out of Stock Alert)",
    transcript: "Salom, bizga 4 ta shashlik tayyorlab turing, hozir borib olamiz.",
  },
];

export default function VoiceOrderingPage() {
  const { user } = useAuthStore();
  const [activeCall, setActiveCall] = useState<boolean>(false);
  const [currentScenario, setCurrentScenario] = useState(PRESET_CALL_SCENARIOS[0]);
  const [customTranscript, setCustomTranscript] = useState(PRESET_CALL_SCENARIOS[0].transcript);
  const [orderDraft, setOrderDraft] = useState<VoiceOrderDraft | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const startCall = (scenario: typeof PRESET_CALL_SCENARIOS[0]) => {
    setCurrentScenario(scenario);
    setCustomTranscript(scenario.transcript);
    setActiveCall(true);

    // AI parses the live speech stream
    const draft = parseVoiceCallTranscript(scenario.transcript, scenario.caller.split(" ")[0], SAMPLE_MENU_CATALOG);
    setOrderDraft(draft);

    if (draft.needsHumanEscalation) {
      toast.warning("Human Escalation Required: Item is out of stock!");
    } else {
      toast.success("Incoming call received and parsed by Voice Concierge!");
    }
  };

  const endCall = () => {
    setActiveCall(false);
    toast.info("Call concluded.");
  };

  const speakAiResponse = () => {
    if (!orderDraft) return;
    setIsSynthesizing(true);
    const text =
      orderDraft.detectedLanguage === "uz"
        ? `Buyurtmangiz qabul qilindi. Jami summa ${formatUZS(orderDraft.subtotalUZS)}. Tez orada yetkazib beramiz!`
        : `Ваш заказ принят. Общая сумма ${formatUZS(orderDraft.subtotalUZS)}. Доставим в течение 35 минут!`;

    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSynthesizing(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsSynthesizing(false), 1500);
    }
  };

  const handlePushToKDS = () => {
    if (!orderDraft) return;
    toast.success(`Voice Order pushed directly to Kitchen Display! (${orderDraft.items.length} items)`);
    endCall();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-[#f98b25]/20 text-[#f98b25]">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-white">
              AI Voice Ordering & Telephony Concierge
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Automated customer phone answering, speech-to-text ticket extraction, and intelligent human escalation for Tashkent.
          </p>
        </div>

        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 text-xs">
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Uzbek & Russian Speech Engine
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Virtual Phone / Call Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-2xl bg-[#161b22] border border-[rgba(255,255,255,0.06)] shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Virtual Phone Terminal
              </h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5 ${
                  activeCall
                    ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeCall ? "bg-red-400" : "bg-emerald-400"}`} />
                {activeCall ? "Live Call Connected" : "Ready for Calls"}
              </span>
            </div>

            {/* Caller ID Display */}
            <div className="p-4 rounded-xl bg-[#0D1117] border border-[rgba(255,255,255,0.06)] text-center space-y-2">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Incoming Line</p>
              <h3 className="text-lg font-mono font-bold text-white">
                {activeCall ? currentScenario.caller : "+998 71 200 00 00 (Workshop IVR)"}
              </h3>
              <p className="text-xs text-slate-400">
                {activeCall ? `Detected language: ${currentScenario.lang}` : "Awaiting caller"}
              </p>
            </div>

            {/* Call Action Buttons */}
            <div className="flex gap-3">
              {!activeCall ? (
                <Button
                  onClick={() => startCall(currentScenario)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 h-11"
                >
                  <PhoneIncoming className="w-4 h-4 mr-2" />
                  Simulate Call
                </Button>
              ) : (
                <Button
                  onClick={endCall}
                  variant="destructive"
                  className="flex-1 font-semibold py-3 h-11"
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  Hang Up Call
                </Button>
              )}
            </div>

            {/* Scenario Picker */}
            <div className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Test Scenarios:
              </span>
              <div className="space-y-2">
                {PRESET_CALL_SCENARIOS.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => startCall(sc)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-colors flex items-center justify-between ${
                      currentScenario.id === sc.id
                        ? "bg-[#1c2333] border-[#f98b25] text-white"
                        : "bg-[#0D1117] border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{sc.caller}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{sc.transcript}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {sc.lang}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Live Speech Parsing & Order Ticket (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {orderDraft ? (
            <div className="p-6 rounded-2xl bg-[#161b22] border border-[rgba(255,255,255,0.06)] shadow-xl space-y-6">
              {/* Status & Escalation Warning */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-[family-name:var(--font-display)]">
                    Live Call Order Draft #{orderDraft.callId}
                  </h3>
                  <p className="text-xs text-slate-400">Generated automatically via real-time speech extraction</p>
                </div>

                {orderDraft.needsHumanEscalation ? (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 px-3 py-1 text-xs">
                    <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                    Human Escalation Flagged
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Confidence {(orderDraft.confidenceScore * 100).toFixed(0)}%
                  </Badge>
                )}
              </div>

              {/* Escalation Notice */}
              {orderDraft.needsHumanEscalation && (
                <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-red-300">Escalation Reason:</p>
                    <p className="text-red-200/80 mt-0.5">{orderDraft.escalationReason}</p>
                    <p className="text-slate-400 mt-2">
                      Recommendation: Transfer caller to front-of-house staff or offer in-stock alternative.
                    </p>
                  </div>
                </div>
              )}

              {/* Transcript Speech Bubble */}
              <div className="p-4 rounded-xl bg-[#0D1117] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5 text-[#f98b25]">
                    <Mic className="w-3.5 h-3.5" /> Caller Speech Transcript:
                  </span>
                  <span className="uppercase text-[10px] text-slate-500">{orderDraft.detectedLanguage}</span>
                </div>
                <p className="text-xs italic text-slate-200 leading-relaxed font-mono">
                  &ldquo;{orderDraft.transcriptionSnippet}&rdquo;
                </p>
              </div>

              {/* Extracted Items */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Extracted Menu Dishes
                </h4>
                <div className="space-y-2">
                  {orderDraft.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#0D1117] border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-800 text-[11px]">
                          {item.quantity}x
                        </span>
                        <span className="font-semibold text-slate-200">{item.itemName}</span>
                      </div>
                      <span className="font-mono font-bold text-white">{formatUZS(item.totalUZS)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Address & Meta */}
              {orderDraft.deliveryAddress && (
                <div className="p-3 rounded-xl bg-[#0D1117] border border-white/5 flex items-center gap-2.5 text-xs">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-400">Delivery Address:</span>
                  <span className="font-semibold text-white">{orderDraft.deliveryAddress}</span>
                </div>
              )}

              {/* Subtotal & Actions */}
              <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-xs text-slate-500">Calculated Ticket Total:</span>
                  <div className="text-2xl font-black text-white font-mono">
                    {formatUZS(orderDraft.subtotalUZS)}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={speakAiResponse}
                    disabled={isSynthesizing}
                    className="flex-1 sm:flex-initial text-xs h-10 border-white/10 text-slate-300 hover:text-white"
                  >
                    <Volume2 className="w-3.5 h-3.5 mr-1.5 text-[#f98b25]" />
                    {isSynthesizing ? "Speaking..." : "Play Voice Reply"}
                  </Button>

                  <Button
                    onClick={handlePushToKDS}
                    className="flex-1 sm:flex-initial bg-[#f98b25] hover:bg-[#e07b1d] text-white text-xs font-semibold h-10 px-5"
                  >
                    <ChefHat className="w-4 h-4 mr-1.5" />
                    Push to Kitchen Display
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center bg-[#161b22] rounded-2xl border border-[rgba(255,255,255,0.06)] space-y-3">
              <PhoneCall className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Active Phone Call</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Select a test scenario on the left or click &ldquo;Simulate Call&rdquo; to experience real-time AI speech-to-ticket extraction in Uzbek and Russian.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

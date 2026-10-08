"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { Upload, Camera, PenLine, FileSpreadsheet, ChevronRight, ChevronLeft, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { useBranchStore } from "@/stores/branch-store";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
  { label: "Restaurant Details" },
  { label: "Branding" },
  { label: "Menu Source" },
  { label: "Review & Launch" }
];

const BRAND_COLORS = [
  { name: "Orange", value: "#f98b25" },
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#34d399" },
  { name: "Purple", value: "#a855f7" },
  { name: "Teal", value: "#14b8a6" }
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { setBranches } = useBranchStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    cuisine: "Uzbek",
    phone: "",
    address: "",
    description: "",
    primaryColor: "#f98b25",
    tagline: "",
    menuSource: "manual"
  });

  const handleLaunch = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a restaurant name");
      setCurrentStep(0);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to set up workshop");
      }

      // Refresh Supabase session to fetch updated app_metadata / claims
      const supabase = createClient();
      await supabase.auth.refreshSession();

      // Update Auth Store
      if (user) {
        setUser({
          ...user,
          restaurant_id: data.restaurant_id,
          restaurant_name: data.name,
          restaurant_slug: data.slug,
          role: "owner",
          branch_id: data.branch_id || null,
        });
      }

      // Set default active branch
      if (data.branch_id) {
        setBranches([
          {
            id: data.branch_id,
            name: "Main Branch",
            address: formData.address || "",
            phone: formData.phone || null,
            timezone: "Asia/Tashkent",
            is_active: true,
            accepts_delivery: true,
            accepts_pickup: true,
            accepts_dine_in: true,
            default_prep_time_minutes: 15,
          },
        ]);
      }

      toast.success("Workshop launched successfully! Welcome to Plately.");
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      console.error("[Onboarding] Submission error:", err);
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Set up your Workshop</h1>
          <p className="text-gray-400">Let's get your restaurant ready for Plately.</p>
        </div>

        <StepIndicator steps={STEPS} currentStep={currentStep} />

        <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-8 shadow-2xl">
          <div className="min-h-[400px]">
            {currentStep === 0 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Restaurant Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    placeholder="e.g. Navoi Milliy Taomlari"
                    className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#f98b25] transition-colors"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Cuisine Type</label>
                    <select
                      value={formData.cuisine}
                      onChange={(e) => updateFormData("cuisine", e.target.value)}
                      className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#f98b25] transition-colors appearance-none"
                    >
                      <option value="Uzbek">Uzbek</option>
                      <option value="Korean">Korean</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Italian">Italian</option>
                      <option value="Mixed">Mixed</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#f98b25] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => updateFormData("address", e.target.value)}
                    placeholder="Full street address"
                    rows={2}
                    className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#f98b25] transition-colors resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Description <span className="text-gray-500 font-normal">(Optional)</span></label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    placeholder="Tell your customers a bit about your restaurant"
                    rows={3}
                    className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#f98b25] transition-colors resize-none"
                  />
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Restaurant Logo</label>
                  <div className="border-2 border-dashed border-[rgba(255,255,255,0.15)] rounded-xl bg-[#0D1117] flex flex-col items-center justify-center py-10 hover:border-[#f98b25] transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-[#161b22] rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#f98b25]" />
                    </div>
                    <p className="text-sm text-gray-300 font-medium">Click or drag to upload your logo</p>
                    <p className="text-xs text-gray-500 mt-1">Accepted formats: PNG, JPG, SVG (Max 5MB)</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Primary Brand Color</label>
                  <div className="flex gap-4">
                    {BRAND_COLORS.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => updateFormData("primaryColor", color.value)}
                        className={cn(
                          "w-10 h-10 rounded-full transition-all flex items-center justify-center",
                          formData.primaryColor === color.value ? "ring-2 ring-white ring-offset-2 ring-offset-[#161b22] scale-110" : "hover:scale-110"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {formData.primaryColor === color.value && <CheckCircle2 className="w-5 h-5 text-white/90 drop-shadow-md" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Restaurant Tagline</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => updateFormData("tagline", e.target.value)}
                    placeholder="e.g. Taste the tradition"
                    className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#f98b25] transition-colors"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-sm text-gray-400 mb-6">Choose how you'd like to import your initial menu items. You can always add or edit items later.</p>
                
                <button 
                  onClick={() => updateFormData("menuSource", "scan")}
                  className={cn(
                    "w-full flex items-start p-5 rounded-xl border text-left transition-all",
                    formData.menuSource === "scan" 
                      ? "bg-[rgba(52,211,153,0.1)] border-[#34d399]" 
                      : "bg-[#0D1117] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)]"
                  )}
                >
                  <div className={cn("p-2.5 rounded-lg mr-4", formData.menuSource === "scan" ? "bg-[#34d399] text-black" : "bg-[#161b22] text-gray-300")}>
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-white">Scan Menu Photo</h3>
                      <span className="text-[10px] uppercase tracking-wider font-bold bg-[#34d399] text-black px-2 py-0.5 rounded-full">AI Powered</span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">Upload a photo of your existing menu. Our AI will extract items and prices automatically.</p>
                  </div>
                </button>

                <button 
                  onClick={() => updateFormData("menuSource", "manual")}
                  className={cn(
                    "w-full flex items-start p-5 rounded-xl border text-left transition-all",
                    formData.menuSource === "manual" 
                      ? "bg-[rgba(249,139,37,0.1)] border-[#f98b25]" 
                      : "bg-[#0D1117] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)]"
                  )}
                >
                  <div className={cn("p-2.5 rounded-lg mr-4", formData.menuSource === "manual" ? "bg-[#f98b25] text-white" : "bg-[#161b22] text-gray-300")}>
                    <PenLine className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Add Manually</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">Add your menu items one by one with full control over details and modifiers.</p>
                  </div>
                </button>

                <button 
                  disabled
                  className="w-full flex items-start p-5 rounded-xl border border-[rgba(255,255,255,0.04)] bg-[#0D1117]/50 text-left opacity-60 cursor-not-allowed"
                >
                  <div className="p-2.5 rounded-lg mr-4 bg-[#161b22] text-gray-500">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-400">Import from File</h3>
                      <span className="text-[10px] uppercase tracking-wider font-bold bg-[#161b22] text-gray-400 border border-[rgba(255,255,255,0.1)] px-2 py-0.5 rounded-full">Coming Soon</span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">Upload a CSV or Excel file with your menu data.</p>
                  </div>
                </button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[#0D1117] rounded-xl border border-[rgba(255,255,255,0.06)] p-6">
                  <h3 className="text-lg font-medium text-white mb-4">Review Details</h3>
                  
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
                      <dt className="text-gray-400">Restaurant</dt>
                      <dd className="font-medium text-white text-right">{formData.name || "Not provided"}</dd>
                    </div>
                    <div className="flex justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
                      <dt className="text-gray-400">Cuisine & Contact</dt>
                      <dd className="font-medium text-white text-right">{formData.cuisine} • {formData.phone || "No phone"}</dd>
                    </div>
                    <div className="flex justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
                      <dt className="text-gray-400">Brand Color</dt>
                      <dd className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: formData.primaryColor }}></span>
                        <span className="text-white uppercase font-mono text-xs">{formData.primaryColor}</span>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Menu Setup</dt>
                      <dd className="font-medium text-white text-right capitalize">{formData.menuSource || "Not selected"}</dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-3 px-2">
                  <h4 className="text-sm font-medium text-gray-300">What happens next?</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-400 gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
                      <span>Your restaurant will be visible on Plately</span>
                    </li>
                    <li className="flex items-center text-sm text-gray-400 gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
                      <span>KDS will be activated for incoming orders</span>
                    </li>
                    <li className="flex items-center text-sm text-gray-400 gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
                      <span>Staff can be invited from Settings</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <button
              onClick={handleBack}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                currentStep === 0 
                  ? "text-gray-600 cursor-not-allowed opacity-50" 
                  : "text-gray-300 hover:text-white hover:bg-[#0D1117]"
              )}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            
            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLaunch}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#f98b25] to-[#f57400] text-white text-sm font-medium shadow-[0_0_15px_rgba(249,139,37,0.3)] hover:shadow-[0_0_20px_rgba(249,139,37,0.5)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    Launch Workshop
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

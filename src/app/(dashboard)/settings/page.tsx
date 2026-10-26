"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Store,
  MapPin,
  Users,
  Truck,
  AlertTriangle,
  Plus,
  Save,
  Key,
  Shield,
  Loader2,
  UserCheck,
  CreditCard,
  Check,
  Sparkles,
  Globe,
  ExternalLink,
  Copy,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { useBranchStore } from "@/stores/branch-store";
import { createClient } from "@/lib/supabase/client";
import { formatUZS } from "@/lib/format";
import {
  checkTierLimit,
  TIER_DEFINITIONS,
  type SubscriptionTier,
} from "@/lib/billing/tiers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface StaffRow {
  id: string;
  user_id: string;
  role: string;
  display_name: string | null;
  is_active: boolean;
  invited_at?: string;
  created_at?: string;
}

interface BranchRow {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  accepts_delivery: boolean;
  accepts_pickup: boolean;
}

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { setBranches } = useBranchStore();
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurant Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [autoAccept, setAutoAccept] = useState(false);
  const [autoRejectMinutes, setAutoRejectMinutes] = useState(5);

  // Branches & Staff State
  const [branchesList, setBranchesList] = useState<BranchRow[]>([]);
  const [staffList, setStaffList] = useState<StaffRow[]>([]);
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>("free");

  // Domain & Storefront State
  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [isDomainVerified, setIsDomainVerified] = useState(false);
  const [domainVerifiedAt, setDomainVerifiedAt] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState("");
  const [isCheckingDns, setIsCheckingDns] = useState(false);
  const [isSavingSubdomain, setIsSavingSubdomain] = useState(false);
  const [dnsError, setDnsError] = useState<string | null>(null);

  // Modals
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchAddress, setNewBranchAddress] = useState("");
  const [newBranchPhone, setNewBranchPhone] = useState("");

  const [isInviteStaffOpen, setIsInviteStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("kitchen");

  const restaurantId = user?.restaurant_id;

  const loadSettings = useCallback(async () => {
    if (!restaurantId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();

      // 1. Fetch Restaurant details
      const { data: rest, error: restError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantId)
        .single();

      if (!restError && rest) {
        setName(rest.name || "");
        setSlug(rest.slug || "");
        setCuisine(rest.cuisine_type || "Uzbek");
        setPhone(rest.phone || "");
        setAddress(rest.address || "");
        setAutoAccept(rest.default_auto_accept || false);
        setAutoRejectMinutes(rest.auto_reject_minutes || 5);
        if (rest.subscription_tier) {
          setCurrentTier(rest.subscription_tier as SubscriptionTier);
        }
        setSubdomain(rest.subdomain || "");
        setCustomDomain(rest.custom_domain || "");
        setIsDomainVerified(Boolean(rest.custom_domain && rest.domain_verified_at));
        setDomainVerifiedAt(rest.domain_verified_at || null);
        setVerificationToken(rest.domain_verification_token || "");
      }

      // 2. Fetch Branches
      const { data: bData } = await supabase
        .from("branches")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: true });

      if (bData && bData.length > 0) {
        setBranchesList(bData);
        setBranches(
          bData.map((b) => ({
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

      // 3. Fetch Staff
      const { data: sData } = await supabase
        .from("staff")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: true });

      if (sData) {
        setStaffList(sData);
      }
    } catch (err) {
      console.warn("[Settings] Load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, setBranches]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save General Info
  const handleSaveGeneral = async () => {
    if (!name.trim()) {
      toast.error("Restaurant name cannot be empty");
      return;
    }

    if (!restaurantId) {
      toast.error("No restaurant associated with this account");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("restaurants")
        .update({
          name: name.trim(),
          cuisine_type: cuisine.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          default_auto_accept: autoAccept,
          auto_reject_minutes: autoRejectMinutes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", restaurantId);

      if (error) throw error;

      // Update local user context
      if (user) {
        setUser({ ...user, restaurant_name: name.trim() });
      }
      toast.success("Settings saved successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Create Branch
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim() || !restaurantId) return;

    // Check subscription branch limit
    const branchCheck = checkTierLimit(currentTier, "branches", branchesList.length);
    if (!branchCheck.allowed) {
      toast.error(branchCheck.message);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("branches")
        .insert({
          restaurant_id: restaurantId,
          name: newBranchName.trim(),
          address: newBranchAddress.trim() || null,
          phone: newBranchPhone.trim() || null,
          timezone: "Asia/Tashkent",
          is_active: true,
          accepts_delivery: true,
          accepts_pickup: true,
          accepts_dine_in: true,
        })
        .select("*")
        .single();

      if (error) throw error;

      toast.success(`Branch "${newBranchName}" added!`);
      setNewBranchName("");
      setNewBranchAddress("");
      setNewBranchPhone("");
      setIsAddBranchOpen(false);
      loadSettings();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create branch");
    }
  };

  // Add Staff Member
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.info("Staff invitation requires email invitation through Supabase Auth. Feature coming soon.");
    setIsInviteStaffOpen(false);
  };

  // Switch or Upgrade Subscription Plan
  const handleUpgradeTier = async (newTier: SubscriptionTier) => {
    if (!restaurantId) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("restaurants")
        .update({ subscription_tier: newTier })
        .eq("id", restaurantId);

      if (error) throw error;

      setCurrentTier(newTier);
      toast.success(`Subscription updated to ${TIER_DEFINITIONS[newTier].name}!`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update subscription tier");
    }
  };

  // Save Subdomain
  const handleSaveSubdomain = async () => {
    if (!restaurantId) return;
    setIsSavingSubdomain(true);
    try {
      const res = await fetch("/api/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          subdomain: subdomain.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update subdomain");
      }
      toast.success(
        subdomain.trim()
          ? `Subdomain claimed! Storefront live at ${subdomain.trim()}.plately.app`
          : "Subdomain cleared"
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to save subdomain");
    } finally {
      setIsSavingSubdomain(false);
    }
  };

  // Verify Custom Domain
  const handleVerifyCustomDomain = async () => {
    if (!restaurantId) return;
    if (!customDomain.trim()) {
      toast.error("Please enter a custom domain (e.g. order.myrestaurant.com)");
      return;
    }

    setIsCheckingDns(true);
    setDnsError(null);
    try {
      const res = await fetch("/api/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          customDomain: customDomain.trim(),
          action: "verify_dns",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "DNS verification request failed");
      }

      if (data.verified) {
        setIsDomainVerified(true);
        setDomainVerifiedAt(data.verifiedAt || new Date().toISOString());
        setDnsError(null);
        toast.success(data.message || "Domain verified successfully! Storefront is live.");
      } else {
        setIsDomainVerified(false);
        setDnsError(data.error || "DNS records not yet detected.");
        toast.error("DNS verification pending. Please verify your CNAME or TXT records.");
      }
    } catch (err: any) {
      setDnsError(err.message || "Verification failed");
      toast.error(err.message || "DNS verification failed");
    } finally {
      setIsCheckingDns(false);
    }
  };

  // Remove Custom Domain
  const handleRemoveCustomDomain = async () => {
    if (!restaurantId) return;
    try {
      const res = await fetch("/api/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          customDomain: null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove custom domain");
      }
      setCustomDomain("");
      setIsDomainVerified(false);
      setDomainVerifiedAt(null);
      setDnsError(null);
      toast.info("Custom domain disconnected");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove custom domain");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const tabs = [
    { id: "general", label: "General & Info", icon: Store },
    { id: "domains", label: "Domains & Storefront", icon: Globe },
    { id: "branches", label: "Branches", icon: MapPin },
    { id: "staff", label: "Staff & RBAC", icon: Users },
    { id: "billing", label: "Plan & Billing", icon: CreditCard },
    { id: "logistics", label: "Logistics & API", icon: Truck },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 text-slate-200">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 font-[family-name:var(--font-display)]">
          Workshop Settings
        </h1>
        <p className="text-slate-400">
          Manage your restaurant details, kitchen branches, team roles, and logistics.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-orange-500/10 text-[#f98b25] border-l-2 border-[#f98b25]"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-[500px]">
          {/* GENERAL TAB */}
          {activeTab === "general" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 shadow-xl">
                <h2 className="text-xl font-semibold text-white mb-4 font-[family-name:var(--font-display)]">
                  General Information
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Restaurant Name</Label>
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-white focus:border-[#f98b25]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Slug (URL)</Label>
                      <Input
                        type="text"
                        value={slug}
                        disabled
                        className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-slate-500 cursor-not-allowed font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Cuisine Type</Label>
                      <Input
                        type="text"
                        value={cuisine}
                        onChange={(e) => setCuisine(e.target.value)}
                        className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-white focus:border-[#f98b25]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Contact Phone</Label>
                      <Input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-white focus:border-[#f98b25]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">HQ Address</Label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#f98b25] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Order Automation & Operational Rules */}
              <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 shadow-xl space-y-5">
                <h2 className="text-xl font-semibold text-white font-[family-name:var(--font-display)]">
                  Order Rules & Automation
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#0D1117] border border-[rgba(255,255,255,0.06)] rounded-lg">
                    <div>
                      <p className="font-medium text-white text-sm">Default Auto-Accept Orders</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Automatically transition new orders to &quot;Preparing&quot; on the KDS.
                      </p>
                    </div>
                    <Switch
                      checked={autoAccept}
                      onCheckedChange={setAutoAccept}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#0D1117] border border-[rgba(255,255,255,0.06)] rounded-lg">
                    <div>
                      <p className="font-medium text-white text-sm">Auto-Reject Timeout (Minutes)</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Cancel unanswered orders if kitchen does not respond within this window.
                      </p>
                    </div>
                    <Input
                      type="number"
                      value={autoRejectMinutes}
                      onChange={(e) => setAutoRejectMinutes(Number(e.target.value) || 5)}
                      className="w-24 bg-[#161b22] border-[rgba(255,255,255,0.1)] text-right font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveGeneral}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-[#f98b25] hover:bg-[#e07b1d] text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-orange-500/10 disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* DOMAINS & STOREFRONT TAB */}
          {activeTab === "domains" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Overview Header */}
              <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-[#f98b25]">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white font-[family-name:var(--font-display)]">
                      Domains & Storefront Routing
                    </h2>
                    <p className="text-xs text-slate-400">
                      Host your AI-generated public storefront on a free Plately branded subdomain or connect your own external custom domain.
                    </p>
                  </div>
                </div>

                {/* Live URLs Summary */}
                <div className="mt-4 p-4 rounded-lg bg-[#0D1117] border border-[rgba(255,255,255,0.06)] space-y-3">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Storefront Endpoints</div>
                  
                  {/* Direct Internal Path */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Default URL:</span>
                    <a
                      href={`/store/${slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[#f98b25] hover:underline flex items-center gap-1"
                    >
                      /store/{slug || "your-slug"}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Subdomain URL */}
                  {subdomain && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Branded Subdomain:</span>
                      <a
                        href={`https://${subdomain}.plately.app`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        https://{subdomain}.plately.app
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Custom Domain URL */}
                  {customDomain && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Custom Domain:</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isDomainVerified
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {isDomainVerified ? "Verified" : "Pending DNS"}
                        </span>
                        <a
                          href={`https://${customDomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-white hover:underline flex items-center gap-1"
                        >
                          https://{customDomain}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Subdomain Configuration */}
              <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 shadow-xl space-y-4">
                <h3 className="text-lg font-semibold text-white font-[family-name:var(--font-display)] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#f98b25]" />
                  Branded Platform Subdomain
                </h3>
                <p className="text-xs text-slate-400">
                  Claim your free branded subdomain on Plately (e.g. <span className="font-mono text-slate-300">tashkent-grill.plately.app</span>).
                </p>

                <div className="flex items-center gap-2 max-w-lg">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="restaurant-name"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-white font-mono text-sm pr-28 focus:border-[#f98b25]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 pointer-events-none">
                      .plately.app
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveSubdomain}
                    disabled={isSavingSubdomain}
                    className="flex items-center gap-1.5 bg-[#f98b25] hover:bg-[#e07b1d] text-white px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-60"
                  >
                    {isSavingSubdomain ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Save Subdomain
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* External Custom Domain Configuration */}
              <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white font-[family-name:var(--font-display)] flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      External Custom Domain
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Connect your existing domain or subdomain (e.g. <span className="font-mono text-slate-300">order.mybrand.uz</span>).
                    </p>
                  </div>
                  {customDomain && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        isDomainVerified
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isDomainVerified ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                      {isDomainVerified ? "Verified & Live" : "Pending DNS Confirmation"}
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Input
                      type="text"
                      placeholder="order.restaurant.com"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value.toLowerCase().trim())}
                      className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-white font-mono text-sm flex-1 focus:border-[#f98b25]"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleVerifyCustomDomain}
                        disabled={isCheckingDns || !customDomain.trim()}
                        className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                      >
                        {isCheckingDns ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Checking DNS...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            Verify DNS Records
                          </>
                        )}
                      </button>

                      {customDomain && (
                        <button
                          type="button"
                          onClick={handleRemoveCustomDomain}
                          className="px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>
                  </div>

                  {/* DNS Error Callout */}
                  {dnsError && (
                    <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-red-200">DNS Verification Incomplete</div>
                        <div className="mt-0.5 text-red-300/80">{dnsError}</div>
                      </div>
                    </div>
                  )}

                  {/* Verification Success Callout */}
                  {isDomainVerified && domainVerifiedAt && (
                    <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Domain verified on {new Date(domainVerifiedAt).toLocaleString()}</span>
                      </div>
                      <a
                        href={`https://${customDomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        Test Live Routing <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* DNS Instructions Panel */}
                  <div className="p-4 rounded-lg bg-[#0D1117] border border-[rgba(255,255,255,0.06)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white">DNS Configuration Instructions</span>
                      <span className="text-[11px] text-slate-400">Configure at your DNS provider (Cloudflare, GoDaddy, Namecheap)</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-white/5 text-slate-400">
                            <th className="pb-2 font-medium">Type</th>
                            <th className="pb-2 font-medium">Host / Name</th>
                            <th className="pb-2 font-medium">Target / Value</th>
                            <th className="pb-2 font-medium text-right">Copy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                          {/* CNAME Record */}
                          <tr>
                            <td className="py-2.5 text-emerald-400 font-bold">CNAME</td>
                            <td className="py-2.5 text-slate-300">{customDomain ? customDomain.split(".")[0] : "order"}</td>
                            <td className="py-2.5 text-slate-300">cname.plately.app</td>
                            <td className="py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => copyToClipboard("cname.plately.app", "CNAME target")}
                                className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                                title="Copy target"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>

                          {/* TXT Verification Record */}
                          <tr>
                            <td className="py-2.5 text-[#f98b25] font-bold">TXT</td>
                            <td className="py-2.5 text-slate-300">_plately-challenge{customDomain ? `.${customDomain.split(".")[0]}` : ""}</td>
                            <td className="py-2.5 text-slate-300 max-w-[200px] truncate" title={verificationToken || "plately-verify-..."}>
                              {verificationToken || "Generating token..."}
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(verificationToken, "Verification token")}
                                className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                                title="Copy token"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BRANCHES TAB */}
          {activeTab === "branches" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white font-[family-name:var(--font-display)]">
                    Branch Management
                  </h2>
                  <p className="text-sm text-slate-400">
                    Manage kitchen and dining locations for your restaurant.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddBranchOpen(true)}
                  className="flex items-center gap-2 bg-[#f98b25] hover:bg-[#e07b1d] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Branch
                </button>
              </div>

              <div className="grid gap-4">
                {branchesList.map((branch) => (
                  <div
                    key={branch.id}
                    className="flex items-center justify-between bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 shadow-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-[#0D1117] border border-[rgba(255,255,255,0.06)] rounded-lg">
                        <Store className="w-6 h-6 text-[#f98b25]" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-white">{branch.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{branch.address || "No address specified"}</p>
                        {branch.phone && <p className="text-xs text-slate-500 mt-0.5">{branch.phone}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {slug && (
                        <a
                          href={`/store/${slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs text-[#f98b25] hover:text-[#ff9d42] bg-[#f98b25]/10 border border-[#f98b25]/20 px-3 py-1.5 rounded-lg transition-colors font-medium"
                          title="Open live branch storefront website"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Branch Website</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      )}
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          branch.is_active
                            ? "bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/20"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {branch.is_active ? "Active in App" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STAFF TAB */}
          {activeTab === "staff" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white font-[family-name:var(--font-display)]">
                    Staff & Role Permissions
                  </h2>
                  <p className="text-sm text-slate-400">
                    Control permissions across owner, manager, and kitchen display operators.
                  </p>
                </div>
                <button
                  type="button"
                  disabled
                  title="Email invitation coming soon"
                  className="flex items-center gap-2 bg-slate-800 text-slate-500 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  Invite Staff
                </button>
              </div>

              <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden shadow-xl">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-[#0D1117]/60 border-b border-[rgba(255,255,255,0.06)]">
                    <tr>
                      <th className="px-6 py-4 font-medium">Name</th>
                      <th className="px-6 py-4 font-medium">Role</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                    {staffList.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-slate-500" />
                          {member.display_name || "Team Member"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-[#0D1117] text-[#f98b25] border border-[rgba(249,139,37,0.3)] px-2.5 py-0.5 rounded text-xs font-mono uppercase">
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-emerald-400">
                          {member.is_active ? "Active" : "Inactive"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PLAN & BILLING TAB */}
          {activeTab === "billing" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(255,255,255,0.06)]">
                  <div>
                    <h2 className="text-xl font-semibold text-white font-[family-name:var(--font-display)] flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#f98b25]" />
                      Subscription & Plan Management
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Choose the capacity that fits your restaurant. Scale branches, team seats, and AI tools anytime.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#0D1117] px-3.5 py-2 rounded-lg border border-[rgba(249,139,37,0.3)]">
                    <span className="text-xs text-slate-400">Current Plan:</span>
                    <span className="text-xs font-bold text-[#f98b25] uppercase tracking-wider">
                      {TIER_DEFINITIONS[currentTier]?.name || currentTier}
                    </span>
                  </div>
                </div>

                {/* Usage meter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-[#0D1117] p-4 rounded-lg border border-[rgba(255,255,255,0.04)]">
                    <span className="text-xs text-slate-400 block mb-1">Active Branches</span>
                    <span className="text-lg font-bold text-white">
                      {branchesList.length} / {TIER_DEFINITIONS[currentTier]?.maxBranches === Infinity ? "∞" : TIER_DEFINITIONS[currentTier]?.maxBranches}
                    </span>
                  </div>
                  <div className="bg-[#0D1117] p-4 rounded-lg border border-[rgba(255,255,255,0.04)]">
                    <span className="text-xs text-slate-400 block mb-1">Staff Seats</span>
                    <span className="text-lg font-bold text-white">
                      {staffList.length} / {TIER_DEFINITIONS[currentTier]?.maxStaff === Infinity ? "∞" : TIER_DEFINITIONS[currentTier]?.maxStaff}
                    </span>
                  </div>
                  <div className="bg-[#0D1117] p-4 rounded-lg border border-[rgba(255,255,255,0.04)]">
                    <span className="text-xs text-slate-400 block mb-1">3PL Dispatch</span>
                    <span className={`text-sm font-semibold ${TIER_DEFINITIONS[currentTier]?.canDispatch ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {TIER_DEFINITIONS[currentTier]?.canDispatch ? "Enabled" : "Disabled (Starter+)"}
                    </span>
                  </div>
                  <div className="bg-[#0D1117] p-4 rounded-lg border border-[rgba(255,255,255,0.04)]">
                    <span className="text-xs text-slate-400 block mb-1">Loyalty CRM</span>
                    <span className={`text-sm font-semibold ${TIER_DEFINITIONS[currentTier]?.canUseLoyalty ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {TIER_DEFINITIONS[currentTier]?.canUseLoyalty ? "Enabled" : "Pro Plan"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tier Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {(Object.keys(TIER_DEFINITIONS) as SubscriptionTier[]).map((tierKey) => {
                  const def = TIER_DEFINITIONS[tierKey];
                  const isCurrent = currentTier === tierKey;
                  const isPopular = tierKey === "pro";

                  return (
                    <div
                      key={tierKey}
                      className={`relative flex flex-col justify-between rounded-xl p-5 border transition-all ${
                        isCurrent
                          ? "bg-[#161b22] border-[#f98b25] shadow-lg shadow-[#f98b25]/10"
                          : isPopular
                          ? "bg-[#161b22]/90 border-orange-500/30 hover:border-orange-500/60"
                          : "bg-[#161b22]/60 border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]"
                      }`}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#f98b25] to-amber-500 text-black text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Most Popular
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-base font-bold text-white font-[family-name:var(--font-display)]">
                            {def.name}
                          </h3>
                          {isCurrent && (
                            <span className="text-[10px] bg-[#f98b25]/20 text-[#f98b25] border border-[#f98b25]/30 px-2 py-0.5 rounded font-semibold uppercase">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="my-3">
                          <div className="text-2xl font-black text-white">
                            {def.monthlyFeeUZS === 0 ? "Free" : formatUZS(def.monthlyFeeUZS)}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {def.monthlyFeeUSD === 0 ? "$0 / month" : `~$${def.monthlyFeeUSD} USD / month`}
                          </div>
                        </div>

                        {/* Limits Checklist */}
                        <ul className="space-y-2 mt-4 text-xs text-slate-300">
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{def.maxMenuItems === Infinity ? "Unlimited" : `Up to ${def.maxMenuItems}`} menu items</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{def.maxMonthlyOrders === Infinity ? "Unlimited" : `${def.maxMonthlyOrders}`} orders/mo</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{def.maxBranches === Infinity ? "Unlimited" : `${def.maxBranches}`} branch location{def.maxBranches > 1 ? 's' : ''}</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{def.maxStaff === Infinity ? "Unlimited" : `${def.maxStaff}`} staff seats</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className={`w-3.5 h-3.5 ${def.canDispatch ? 'text-emerald-400' : 'text-slate-600'} shrink-0`} />
                            <span className={def.canDispatch ? 'text-slate-200' : 'text-slate-500'}>
                              {def.canDispatch ? "Noor 3PL dispatch" : "No 3PL dispatch"}
                            </span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className={`w-3.5 h-3.5 ${def.canUseLoyalty ? 'text-emerald-400' : 'text-slate-600'} shrink-0`} />
                            <span className={def.canUseLoyalty ? 'text-slate-200' : 'text-slate-500'}>
                              {def.canUseLoyalty ? "CRM loyalty & points" : "Basic customer list"}
                            </span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{def.analyticsRetentionDays}-day analytics</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className={`w-3.5 h-3.5 ${def.ocrScansPerMonth > 0 ? 'text-emerald-400' : 'text-slate-600'} shrink-0`} />
                            <span>{def.ocrScansPerMonth === Infinity ? "Unlimited" : `${def.ocrScansPerMonth}/mo`} AI OCR scans</span>
                          </li>
                        </ul>
                      </div>

                      <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                        {isCurrent ? (
                          <button
                            disabled
                            className="w-full py-2 rounded-lg bg-slate-800 text-slate-400 text-xs font-semibold cursor-not-allowed"
                          >
                            Current Plan
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpgradeTier(tierKey)}
                            className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${
                              isPopular
                                ? "bg-[#f98b25] hover:bg-[#e07b1d] text-white shadow-md shadow-[#f98b25]/20"
                                : "bg-slate-800 hover:bg-slate-700 text-white"
                            }`}
                          >
                            Switch to {def.name}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LOGISTICS & 3PL TAB */}
          {activeTab === "logistics" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <Truck className="w-6 h-6 text-[#f98b25]" />
                  <h2 className="text-xl font-semibold text-white font-[family-name:var(--font-display)]">
                    Logistics & Courier Integrations
                  </h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-300 flex items-center justify-between">
                      Noor 3PL API Key (Tashkent)
                      <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                        <Shield className="w-3 h-3" /> Coming Soon (Not Connected)
                      </span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        defaultValue="noor_live_test_7a8f9d0"
                        disabled
                        className="flex-1 bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-slate-500 focus:border-[#f98b25] cursor-not-allowed"
                      />
                      <button
                        type="button"
                        disabled
                        title="Noor 3PL integration coming soon"
                        className="bg-slate-800 text-slate-500 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed flex items-center gap-2 opacity-60"
                      >
                        Update
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
                          Coming Soon
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-300 flex items-center justify-between">
                      <span>Webhook Secret</span>
                      <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded font-mono">
                        Coming Soon
                      </span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        readOnly
                        disabled
                        value="whsec_8f92j3f928j3f9823jf9823j"
                        className="flex-1 bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-slate-500 font-mono text-xs cursor-not-allowed"
                      />
                      <button
                        type="button"
                        disabled
                        title="Webhook secret generation coming soon"
                        className="bg-slate-800 text-slate-500 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed flex items-center gap-2 opacity-60"
                      >
                        <Key className="w-4 h-4" /> Generate
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
                          Coming Soon
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DANGER ZONE TAB */}
          {activeTab === "danger" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border border-red-900/40 bg-red-950/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-red-500 mb-6 flex items-center gap-2 font-[family-name:var(--font-display)]">
                  <AlertTriangle className="w-5 h-5" /> Danger Zone
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-red-900/20 rounded-lg bg-[#0D1117]">
                    <div>
                      <h4 className="font-medium text-white text-sm">Archive Restaurant</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Temporarily hide restaurant from consumer ordering. All records remain intact.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled
                      title="Restaurant archiving coming soon"
                      className="bg-slate-800 text-slate-500 px-4 py-2 rounded-lg text-xs font-medium cursor-not-allowed flex items-center gap-1.5 opacity-60"
                    >
                      Archive
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
                        Coming Soon
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Branch Dialog */}
      <Dialog open={isAddBranchOpen} onOpenChange={setIsAddBranchOpen}>
        <DialogContent className="max-w-md bg-[#161b22] border-[rgba(255,255,255,0.08)] text-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-[family-name:var(--font-display)]">
              Add Restaurant Branch
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBranch} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Branch Name *</Label>
              <Input
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="e.g. Chorsu Express"
                required
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Street Address</Label>
              <Input
                value={newBranchAddress}
                onChange={(e) => setNewBranchAddress(e.target.value)}
                placeholder="e.g. Navoi Avenue 14, Tashkent"
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Contact Phone</Label>
              <Input
                value={newBranchPhone}
                onChange={(e) => setNewBranchPhone(e.target.value)}
                placeholder="+998 90 000 00 00"
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
              />
            </div>
            <DialogFooter className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <button
                type="button"
                onClick={() => setIsAddBranchOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#f98b25] hover:bg-[#e07b1d] text-white text-sm font-semibold"
              >
                Create Branch
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite Staff Dialog */}
      <Dialog open={isInviteStaffOpen} onOpenChange={setIsInviteStaffOpen}>
        <DialogContent className="max-w-md bg-[#161b22] border-[rgba(255,255,255,0.08)] text-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-[family-name:var(--font-display)]">
              Invite Staff Member
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddStaff} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Staff Member Name *</Label>
              <Input
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                placeholder="e.g. Dilshod (Head Chef)"
                required
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Access Role *</Label>
              <select
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value)}
                className="w-full h-10 rounded-md bg-[#0D1117] border border-[rgba(255,255,255,0.08)] px-3 text-sm text-white focus:outline-none focus:border-[#f98b25]"
              >
                <option value="kitchen">Kitchen (KDS & Orders)</option>
                <option value="manager">Manager (Menu & Analytics)</option>
                <option value="admin">Admin (All Settings)</option>
                <option value="driver">Driver (Dispatch)</option>
                <option value="viewer">Viewer (Read Only)</option>
              </select>
            </div>
            <DialogFooter className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <button
                type="button"
                onClick={() => setIsInviteStaffOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#f98b25] hover:bg-[#e07b1d] text-white text-sm font-semibold"
              >
                Send Invite
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

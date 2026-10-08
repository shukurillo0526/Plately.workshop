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
  Trash2,
  UserCheck,
  CreditCard,
  Check,
  Sparkles,
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

    setIsSaving(true);
    try {
      if (restaurantId) {
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
    if (!newStaffName.trim() || !restaurantId) return;

    // Check subscription staff limit
    const staffCheck = checkTierLimit(currentTier, "staff", staffList.length);
    if (!staffCheck.allowed) {
      toast.error(staffCheck.message);
      return;
    }

    try {
      const supabase = createClient();
      // Generate a mock or secondary user ID for the invitation
      const mockUserId = crypto.randomUUID();

      const { error } = await supabase.from("staff").insert({
        user_id: mockUserId,
        restaurant_id: restaurantId,
        display_name: newStaffName.trim(),
        role: newStaffRole,
        is_active: true,
        invited_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success(`Staff member "${newStaffName}" invited as ${newStaffRole}!`);
      setNewStaffName("");
      setNewStaffRole("kitchen");
      setIsInviteStaffOpen(false);
      loadSettings();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add staff member");
    }
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

  const tabs = [
    { id: "general", label: "General & Info", icon: Store },
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
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          branch.is_active
                            ? "bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/20"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {branch.is_active ? "Active" : "Inactive"}
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
                  onClick={() => setIsInviteStaffOpen(true)}
                  className="flex items-center gap-2 bg-[#f98b25] hover:bg-[#e07b1d] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
                      <span className="text-xs text-[#34d399] flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Ready / Simulator
                      </span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        defaultValue="noor_live_test_7a8f9d0"
                        className="flex-1 bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-white focus:border-[#f98b25]"
                      />
                      <button
                        type="button"
                        onClick={() => toast.success("API key stored securely")}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Update
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-300">Webhook Secret</Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        readOnly
                        value="whsec_8f92j3f928j3f9823jf9823j"
                        className="flex-1 bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-slate-400 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => toast.success("Secret regenerated")}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Key className="w-4 h-4" /> Generate
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
                      onClick={() => toast.info("Restaurant archived")}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      Archive
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

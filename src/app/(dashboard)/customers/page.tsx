"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Calendar,
  Tag,
  Edit3,
  X,
  PlusCircle,
  MinusCircle,
  Loader2,
  UserCheck,
} from "lucide-react";
import { formatUZS } from "@/lib/format";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoyaltyTier = "VIP Platinum" | "Gold" | "Silver" | "New";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyTier: LoyaltyTier;
  loyaltyPoints: number;
  lastOrderDate: string;
  notes: string[];
}

const mockCustomers: Customer[] = [
  {
    id: "C-1001",
    name: "Sardor Rakhimov",
    phone: "+998 90 123 45 67",
    email: "s.rakhimov@example.uz",
    totalOrders: 42,
    totalSpent: 4250000,
    loyaltyTier: "VIP Platinum",
    loyaltyPoints: 12500,
    lastOrderDate: "2026-08-01T12:30:00Z",
    notes: ["Prefers non-spicy", "Regular lunch customer"],
  },
  {
    id: "C-1002",
    name: "Nigora Alimova",
    phone: "+998 94 987 65 43",
    email: "nigora.a@gmail.com",
    totalOrders: 18,
    totalSpent: 1850000,
    loyaltyTier: "Gold",
    loyaltyPoints: 5400,
    lastOrderDate: "2026-08-05T19:00:00Z",
    notes: ["Allergic to peanuts", "Always orders with delivery"],
  },
  {
    id: "C-1003",
    name: "Bekzod Umarov",
    phone: "+998 97 555 12 34",
    email: "b.umarov@company.uz",
    totalOrders: 8,
    totalSpent: 920000,
    loyaltyTier: "Silver",
    loyaltyPoints: 2100,
    lastOrderDate: "2026-07-28T14:15:00Z",
    notes: ["Corporate orders on Fridays"],
  },
  {
    id: "C-1004",
    name: "Kamila Tursunova",
    phone: "+998 93 111 22 33",
    email: "k.tursunova@inbox.uz",
    totalOrders: 1,
    totalSpent: 125000,
    loyaltyTier: "New",
    loyaltyPoints: 300,
    lastOrderDate: "2026-08-07T11:45:00Z",
    notes: [],
  },
];

const getTierColor = (tier: LoyaltyTier) => {
  switch (tier) {
    case "VIP Platinum":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "Gold":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "Silver":
      return "bg-gray-400/10 text-gray-300 border-gray-400/20";
    case "New":
      return "bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20";
    default:
      return "bg-gray-800 text-gray-300 border-gray-700";
  }
};

export default function CustomersPage() {
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | LoyaltyTier>("All");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newNote, setNewNote] = useState("");

  // Add Customer Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const restaurantId = user?.restaurant_id;

  const loadCustomers = useCallback(async () => {
    if (!restaurantId) return;
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("merchant_customers")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        setCustomers(
          data.map((row) => {
            const spent = Number(row.total_spent) || 0;
            let tier: LoyaltyTier = "New";
            if (spent > 3000000) tier = "VIP Platinum";
            else if (spent > 1500000) tier = "Gold";
            else if (spent > 500000) tier = "Silver";

            return {
              id: row.id,
              name: row.name,
              phone: row.phone || "—",
              email: row.email || "—",
              totalOrders: row.total_orders || 0,
              totalSpent: spent,
              loyaltyTier: tier,
              loyaltyPoints: Math.round(spent / 100),
              lastOrderDate: row.updated_at || row.created_at || new Date().toISOString(),
              notes: row.notes ? [row.notes] : [],
            };
          })
        );
      }
    } catch (err) {
      console.warn("[CRM] Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTier = activeTab === "All" || customer.loyaltyTier === activeTab;
      return matchesSearch && matchesTier;
    });
  }, [customers, searchQuery, activeTab]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedCustomer) return;
    const noteText = newNote.trim();

    setSelectedCustomer({
      ...selectedCustomer,
      notes: [...selectedCustomer.notes, noteText],
    });

    if (restaurantId && !selectedCustomer.id.startsWith("C-")) {
      const supabase = createClient();
      await supabase
        .from("merchant_customers")
        .update({ notes: noteText })
        .eq("id", selectedCustomer.id);
    }

    setNewNote("");
    toast.success("Note added successfully");
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    if (restaurantId) {
      try {
        const supabase = createClient();
        const { error } = await supabase.from("merchant_customers").insert({
          restaurant_id: restaurantId,
          name: newName.trim(),
          phone: newPhone.trim() || null,
          email: newEmail.trim() || null,
          total_orders: 0,
          total_spent: 0,
        });

        if (error) throw error;
        toast.success(`Customer "${newName}" registered!`);
        setIsAddOpen(false);
        setNewName("");
        setNewPhone("");
        setNewEmail("");
        loadCustomers();
        return;
      } catch (err: any) {
        toast.error(err?.message || "Failed to add customer");
      }
    }

    // Demo fallback
    const newCust: Customer = {
      id: `C-${Date.now().toString().slice(-4)}`,
      name: newName.trim(),
      phone: newPhone.trim() || "—",
      email: newEmail.trim() || "—",
      totalOrders: 0,
      totalSpent: 0,
      loyaltyTier: "New",
      loyaltyPoints: 0,
      lastOrderDate: new Date().toISOString(),
      notes: [],
    };
    setCustomers([newCust, ...customers]);
    toast.success(`Customer "${newName}" registered!`);
    setIsAddOpen(false);
    setNewName("");
    setNewPhone("");
    setNewEmail("");
  };

  const stats = useMemo(() => {
    const totalSpent = customers.reduce((acc, c) => acc + c.totalSpent, 0);
    const avgLTV = customers.length > 0 ? Math.round(totalSpent / customers.length) : 0;
    const totalPoints = customers.reduce((acc, c) => acc + c.loyaltyPoints, 0);

    return {
      totalRegistered: customers.length,
      activeThisMonth: Math.round(customers.length * 0.4) || 1,
      totalPoints,
      avgLTV,
    };
  }, [customers]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-white">
      {/* Header & Stats */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] flex items-center gap-2">
              <Users className="w-6 h-6 text-[#f98b25]" />
              Customer CRM & Loyalty
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage your guest records, repeat orders, and rewards.
            </p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-[#f98b25] hover:bg-[#e07a1f] text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm shadow-md shadow-orange-500/10"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
            <p className="text-sm text-gray-400 font-medium">Total Registered</p>
            <p className="text-2xl font-semibold font-[family-name:var(--font-mono)] text-gray-100 mt-2">
              {stats.totalRegistered}
            </p>
          </div>
          <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
            <p className="text-sm text-gray-400 font-medium">Active Guests</p>
            <p className="text-2xl font-semibold font-[family-name:var(--font-mono)] text-[#34d399] mt-2">
              {stats.activeThisMonth}
            </p>
          </div>
          <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
            <p className="text-sm text-gray-400 font-medium">Points Distributed</p>
            <p className="text-2xl font-semibold font-[family-name:var(--font-mono)] text-[#f98b25] mt-2">
              {stats.totalPoints.toLocaleString()}{" "}
              <span className="text-sm text-gray-500 font-normal">pts</span>
            </p>
          </div>
          <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
            <p className="text-sm text-gray-400 font-medium">Average LTV</p>
            <p className="text-2xl font-semibold font-[family-name:var(--font-mono)] text-gray-100 mt-2">
              {formatUZS(stats.avgLTV)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-hide">
          {(["All", "VIP Platinum", "Gold", "Silver", "New"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? "bg-[#21262d] text-gray-100 border border-[rgba(255,255,255,0.1)]"
                  : "text-gray-400 hover:text-gray-200 hover:bg-[#21262d]/50 border border-transparent"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.06)] rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#f98b25] transition-colors placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-[#21262d]/50 border-b border-[rgba(255,255,255,0.06)]">
              <tr>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Orders</th>
                <th className="px-6 py-4 font-medium">Total Spent</th>
                <th className="px-6 py-4 font-medium">Loyalty Tier</th>
                <th className="px-6 py-4 font-medium">Last Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-[#21262d]/30 transition-colors cursor-pointer group"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-100">{customer.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{customer.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-gray-500" /> {customer.phone}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-gray-500" /> {customer.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-[family-name:var(--font-mono)]">
                    {customer.totalOrders}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-200 font-[family-name:var(--font-mono)]">
                    {formatUZS(customer.totalSpent)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getTierColor(
                        customer.loyaltyTier
                      )}`}
                    >
                      {customer.loyaltyTier}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {new Date(customer.lastOrderDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#161b22] border-l border-[rgba(255,255,255,0.08)] h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.06)]">
              <div>
                <h2 className="text-lg font-bold text-white font-[family-name:var(--font-display)]">
                  {selectedCustomer.name}
                </h2>
                <span
                  className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTierColor(
                    selectedCustomer.loyaltyTier
                  )}`}
                >
                  {selectedCustomer.loyaltyTier}
                </span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="p-4 bg-[#0D1117] rounded-xl border border-[rgba(255,255,255,0.06)] space-y-2">
                <p className="text-xs text-gray-400 font-medium">Contact Details</p>
                <p className="flex items-center gap-2 text-gray-200">
                  <Phone className="w-4 h-4 text-gray-500" /> {selectedCustomer.phone}
                </p>
                <p className="flex items-center gap-2 text-gray-200">
                  <Mail className="w-4 h-4 text-gray-500" /> {selectedCustomer.email}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#0D1117] rounded-xl border border-[rgba(255,255,255,0.06)]">
                  <p className="text-xs text-gray-400">Total Spent</p>
                  <p className="text-lg font-semibold text-white font-[family-name:var(--font-mono)] mt-1">
                    {formatUZS(selectedCustomer.totalSpent)}
                  </p>
                </div>
                <div className="p-3 bg-[#0D1117] rounded-xl border border-[rgba(255,255,255,0.06)]">
                  <p className="text-xs text-gray-400">Loyalty Points</p>
                  <p className="text-lg font-semibold text-[#f98b25] font-[family-name:var(--font-mono)] mt-1">
                    {selectedCustomer.loyaltyPoints} pts
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs text-gray-400 font-medium">Preferences & Notes</p>
                {selectedCustomer.notes.map((note, i) => (
                  <div
                    key={i}
                    className="p-3 bg-[#0D1117] rounded-lg text-xs text-gray-300 border border-[rgba(255,255,255,0.04)]"
                  >
                    {note}
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add customer note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-xs text-white"
                  />
                  <button
                    onClick={handleAddNote}
                    className="bg-[#f98b25] hover:bg-[#e07a1f] text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-[#161b22] border-[rgba(255,255,255,0.08)] text-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-[family-name:var(--font-display)]">
              Register Customer
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCustomer} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Customer Full Name *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Jasur Akhmedov"
                required
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Phone Number</Label>
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Email Address</Label>
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="guest@example.com"
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
              />
            </div>
            <DialogFooter className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#f98b25] hover:bg-[#e07a1f] text-white text-sm font-semibold"
              >
                Register
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

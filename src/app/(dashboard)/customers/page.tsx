"use client";

import React, { useState } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  MoreVertical, 
  ChevronRight, 
  Phone, 
  Mail, 
  MapPin, 
  ShoppingBag, 
  Calendar, 
  Tag, 
  Edit3,
  X,
  PlusCircle,
  MinusCircle
} from "lucide-react";
import { formatUZS } from "@/lib/format";
import { toast } from "sonner";

// Mock Data
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
    loyaltyPoints: 4200,
    lastOrderDate: "2026-07-28T18:45:00Z",
    notes: ["Allergic to peanuts"],
  },
  {
    id: "C-1003",
    name: "Aziz Tursunov",
    phone: "+998 97 111 22 33",
    email: "aziz_tursunov88@mail.ru",
    totalOrders: 8,
    totalSpent: 720000,
    loyaltyTier: "Silver",
    loyaltyPoints: 1100,
    lastOrderDate: "2026-07-15T20:15:00Z",
    notes: ["Always requests extra sauce"],
  },
  {
    id: "C-1004",
    name: "Dilnoza Karimova",
    phone: "+998 93 444 55 66",
    email: "d.karimova_uz@example.com",
    totalOrders: 2,
    totalSpent: 180000,
    loyaltyTier: "New",
    loyaltyPoints: 200,
    lastOrderDate: "2026-08-01T09:00:00Z",
    notes: [],
  },
  {
    id: "C-1005",
    name: "Rustam Qodirov",
    phone: "+998 99 777 88 99",
    email: "rustam.qodirov@yandex.ru",
    totalOrders: 24,
    totalSpent: 2950000,
    loyaltyTier: "Gold",
    loyaltyPoints: 8500,
    lastOrderDate: "2026-07-30T13:20:00Z",
    notes: ["Corporate client", "Needs receipts"],
  },
  {
    id: "C-1006",
    name: "Madina Umarova",
    phone: "+998 90 555 44 33",
    email: "m.umarova95@example.uz",
    totalOrders: 56,
    totalSpent: 6800000,
    loyaltyTier: "VIP Platinum",
    loyaltyPoints: 24000,
    lastOrderDate: "2026-07-31T19:00:00Z",
    notes: ["Family dinners on weekends", "Prefers quiet corner table"],
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | LoyaltyTier>("All");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newNote, setNewNote] = useState("");

  const filteredCustomers = mockCustomers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTier = activeTab === "All" || customer.loyaltyTier === activeTab;
    
    return matchesSearch && matchesTier;
  });

  const handleAddNote = () => {
    if (!newNote.trim() || !selectedCustomer) return;
    setSelectedCustomer({
      ...selectedCustomer,
      notes: [...selectedCustomer.notes, newNote.trim()],
    });
    setNewNote("");
    toast.success("Note added successfully");
  };

  const handleAdjustPoints = (amount: number) => {
    if (!selectedCustomer) return;
    const newPoints = Math.max(0, selectedCustomer.loyaltyPoints + amount);
    setSelectedCustomer({
      ...selectedCustomer,
      loyaltyPoints: newPoints,
    });
    toast.success(`Points ${amount > 0 ? "added" : "deducted"} successfully`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-100 flex items-center gap-2">
              <Users className="w-6 h-6 text-[#f98b25]" />
              Customer CRM & Loyalty
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage your customer relationships and loyalty programs.
            </p>
          </div>
          <button className="bg-[#f98b25] hover:bg-[#e07a1f] text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
            <p className="text-sm text-gray-400 font-medium">Total Registered</p>
            <p className="text-2xl font-semibold text-gray-100 mt-2">842</p>
          </div>
          <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
            <p className="text-sm text-gray-400 font-medium">Active This Month</p>
            <p className="text-2xl font-semibold text-[#34d399] mt-2">315</p>
          </div>
          <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
            <p className="text-sm text-gray-400 font-medium">Points Awarded</p>
            <p className="text-2xl font-semibold text-[#f98b25] mt-2">124,500 <span className="text-base text-gray-500 font-normal">pts</span></p>
          </div>
          <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
            <p className="text-sm text-gray-400 font-medium">Average LTV</p>
            <p className="text-2xl font-semibold text-gray-100 mt-2">{formatUZS(890000)}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-hide">
          {(["All", "VIP Platinum", "Gold", "Silver", "New"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? "bg-[#21262d] text-gray-100 border border-[rgba(255,255,255,0.1)]"
                  : "text-gray-400 hover:text-gray-200 hover:bg-[#21262d]/50 border border-transparent"
              }`}
            >
              {tab} {tab === "All" ? "(842)" : tab === "VIP Platinum" ? "(48)" : tab === "Gold" ? "(124)" : tab === "Silver" ? "(280)" : "(390)"}
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
      <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
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
                <th className="px-6 py-4 font-medium text-right">Actions</th>
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
                    <div className="text-xs text-gray-500 mt-1">{customer.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-gray-500"/> {customer.phone}</span>
                      <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-gray-500"/> {customer.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{customer.totalOrders}</td>
                  <td className="px-6 py-4 font-medium text-gray-200">{formatUZS(customer.totalSpent)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getTierColor(customer.loyaltyTier)}`}>
                      {customer.loyaltyTier}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(customer.lastOrderDate).toLocaleDateString("en-GB", {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      className="text-gray-400 hover:text-[#f98b25] transition-colors p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomer(customer);
                      }}
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No customers found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer/Modal Overlay */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-[#161b22] border-l border-[rgba(255,255,255,0.06)] h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300"
          >
            {/* Drawer Header */}
            <div className="sticky top-0 bg-[#161b22]/90 backdrop-blur-md z-10 border-b border-[rgba(255,255,255,0.06)] px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                Customer Profile
              </h2>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#21262d] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Profile Info */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-20 h-20 bg-[#21262d] rounded-full flex items-center justify-center border border-[rgba(255,255,255,0.06)] text-2xl font-semibold text-gray-300">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-100">{selectedCustomer.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{selectedCustomer.id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTierColor(selectedCustomer.loyaltyTier)}`}>
                  {selectedCustomer.loyaltyTier}
                </span>
              </div>

              {/* Contact & Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0D1117] p-4 rounded-xl border border-[rgba(255,255,255,0.06)] space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="truncate">{selectedCustomer.email}</span>
                  </div>
                </div>
                <div className="bg-[#0D1117] p-4 rounded-xl border border-[rgba(255,255,255,0.06)] space-y-1 flex flex-col justify-center">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total LTV</p>
                  <p className="text-lg font-semibold text-[#34d399]">{formatUZS(selectedCustomer.totalSpent)}</p>
                  <p className="text-xs text-gray-500">{selectedCustomer.totalOrders} lifetime orders</p>
                </div>
              </div>

              {/* Loyalty Points Manager */}
              <div className="bg-[#0D1117] p-5 rounded-xl border border-[rgba(255,255,255,0.06)] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#f98b25]" />
                    <h4 className="font-medium text-gray-200">Loyalty Balance</h4>
                  </div>
                  <span className="text-xl font-bold text-[#f98b25]">{selectedCustomer.loyaltyPoints} <span className="text-sm font-normal text-gray-500">pts</span></span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAdjustPoints(-100)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#21262d] hover:bg-[#21262d]/80 text-gray-300 rounded-lg text-sm transition-colors border border-[rgba(255,255,255,0.06)]"
                  >
                    <MinusCircle className="w-4 h-4" /> Deduct 100
                  </button>
                  <button 
                    onClick={() => handleAdjustPoints(100)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#f98b25]/10 hover:bg-[#f98b25]/20 text-[#f98b25] border border-[#f98b25]/20 rounded-lg text-sm transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" /> Add 100
                  </button>
                </div>
              </div>

              {/* Staff Notes */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-200 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  Staff Notes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.notes.map((note, idx) => (
                    <div key={idx} className="bg-[#21262d] text-gray-300 text-sm px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.06)] flex items-center gap-2">
                      {note}
                      <button 
                        className="text-gray-500 hover:text-red-400 transition-colors"
                        onClick={() => {
                          const newNotes = [...selectedCustomer.notes];
                          newNotes.splice(idx, 1);
                          setSelectedCustomer({...selectedCustomer, notes: newNotes});
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {selectedCustomer.notes.length === 0 && (
                    <span className="text-sm text-gray-500 italic">No notes added yet.</span>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    className="flex-1 bg-[#0D1117] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#f98b25] transition-colors"
                  />
                  <button 
                    onClick={handleAddNote}
                    className="bg-[#21262d] hover:bg-gray-700 text-gray-200 px-3 py-2 rounded-lg border border-[rgba(255,255,255,0.06)] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Order History Preview */}
              <div className="space-y-3 pb-8">
                <h4 className="font-medium text-gray-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Recent Activity
                </h4>
                <div className="space-y-3">
                  {[1, 2, 3].map((_, idx) => (
                    <div key={idx} className="bg-[#0D1117] p-3 rounded-lg border border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-200">Order #ORD-{9823 + idx}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Dine-in • 3 items</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-300">{formatUZS(125000 + (idx * 45000))}</p>
                        <p className="text-xs text-[#34d399] mt-0.5">Completed</p>
                      </div>
                    </div>
                  ))}
                  <button className="w-full text-center text-sm text-[#f98b25] hover:text-[#e07a1f] py-2 transition-colors">
                    View Full Order History
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

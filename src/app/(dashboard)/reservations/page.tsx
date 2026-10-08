"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Plus,
  CheckCircle2,
  XCircle,
  UserCheck,
  AlertCircle,
  Search,
  Filter,
  Loader2,
} from "lucide-react";
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

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled"
  | "no_show";

export interface ReservationItem {
  id: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  reservationTime: string;
  tableNumber: string | null;
  status: ReservationStatus;
  specialRequests: string | null;
  createdAt?: string;
}

const SAMPLE_RESERVATIONS: ReservationItem[] = [
  {
    id: "RES-101",
    customerName: "Otabek Madrahimov",
    customerPhone: "+998 90 123 45 67",
    partySize: 4,
    reservationTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    tableNumber: "T-04",
    status: "confirmed",
    specialRequests: "Window seat preferred. Celebrating birthday.",
  },
  {
    id: "RES-102",
    customerName: "Dilfuza Karimova",
    customerPhone: "+998 93 555 77 88",
    partySize: 2,
    reservationTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    tableNumber: "T-02",
    status: "pending",
    specialRequests: "Quiet corner table.",
  },
  {
    id: "RES-103",
    customerName: "Azamat Shodiev",
    customerPhone: "+998 97 999 11 22",
    partySize: 6,
    reservationTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    tableNumber: "VIP-1",
    status: "seated",
    specialRequests: "Pre-ordered 1 kg Lamb Osh.",
  },
  {
    id: "RES-104",
    customerName: "Elena V.",
    customerPhone: "+998 91 333 44 55",
    partySize: 3,
    reservationTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    tableNumber: "T-08",
    status: "completed",
    specialRequests: null,
  },
];

const STATUS_CONFIG: Record<
  ReservationStatus,
  { label: string; badgeClass: string }
> = {
  pending: {
    label: "Pending",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  confirmed: {
    label: "Confirmed",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  seated: {
    label: "Seated",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  no_show: {
    label: "No Show",
    badgeClass: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  },
};

export default function ReservationsPage() {
  const { user } = useAuthStore();
  const [reservations, setReservations] = useState<ReservationItem[]>(SAMPLE_RESERVATIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReservationStatus>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [reservationTime, setReservationTime] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const restaurantId = user?.restaurant_id;

  const loadReservations = useCallback(async () => {
    if (!restaurantId) {
      setReservations(SAMPLE_RESERVATIONS);
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("reservation_time", { ascending: true });

      if (!error && data && data.length > 0) {
        setReservations(
          data.map((r) => ({
            id: r.id,
            customerName: r.customer_name,
            customerPhone: r.customer_phone,
            partySize: r.party_size,
            reservationTime: r.reservation_time,
            tableNumber: r.table_number,
            status: (r.status as ReservationStatus) || "pending",
            specialRequests: r.special_requests,
            createdAt: r.created_at,
          }))
        );
      } else {
        setReservations(SAMPLE_RESERVATIONS);
      }
    } catch (err) {
      console.warn("[Reservations] Load error:", err);
      setReservations(SAMPLE_RESERVATIONS);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const handleUpdateStatus = async (id: string, newStatus: ReservationStatus) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );

    if (restaurantId && !id.startsWith("RES-")) {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("reservations")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      } catch (err: any) {
        toast.error("Failed to update status: " + err?.message);
        loadReservations();
        return;
      }
    }

    toast.success(`Reservation marked as ${STATUS_CONFIG[newStatus].label}`);
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !reservationTime) {
      toast.error("Please fill in required fields");
      return;
    }

    const payload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      partySize: Number(partySize) || 2,
      reservationTime: new Date(reservationTime).toISOString(),
      tableNumber: tableNumber.trim() || null,
      status: "confirmed" as ReservationStatus,
      specialRequests: specialRequests.trim() || null,
    };

    if (restaurantId) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("reservations")
          .insert({
            restaurant_id: restaurantId,
            customer_name: payload.customerName,
            customer_phone: payload.customerPhone,
            party_size: payload.partySize,
            reservation_time: payload.reservationTime,
            table_number: payload.tableNumber,
            status: payload.status,
            special_requests: payload.specialRequests,
          })
          .select()
          .single();

        if (error) throw error;

        toast.success("Reservation confirmed!");
      } catch (err: any) {
        toast.error(err?.message || "Failed to create reservation");
        return;
      }
    } else {
      const newRes: ReservationItem = {
        id: `RES-${Date.now()}`,
        ...payload,
      };
      setReservations((prev) => [newRes, ...prev]);
      toast.success("Reservation confirmed (demo mode)");
    }

    setIsModalOpen(false);
    setCustomerName("");
    setCustomerPhone("");
    setPartySize(2);
    setReservationTime("");
    setTableNumber("");
    setSpecialRequests("");
    loadReservations();
  };

  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesSearch =
        r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customerPhone.includes(searchQuery) ||
        (r.tableNumber && r.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [reservations, statusFilter, searchQuery]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-[family-name:var(--font-display)] flex items-center gap-2">
            <Calendar className="w-8 h-8 text-[#f98b25]" /> Table Reservations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage table bookings, guest arrivals, seating, and special dining requests.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#f98b25] hover:bg-[#e07b1d] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-[#f98b25]/20"
        >
          <Plus className="w-4 h-4" /> New Booking
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#161b22] border border-[rgba(255,255,255,0.06)] p-3 rounded-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {(["all", "pending", "confirmed", "seated", "completed", "cancelled"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  statusFilter === tab
                    ? "bg-[#f98b25] text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {tab === "all" ? "All Bookings" : tab}
              </button>
            )
          )}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guest or table..."
            className="pl-9 bg-[#0D1117] border-[rgba(255,255,255,0.08)] text-xs h-9 text-white focus:border-[#f98b25]"
          />
        </div>
      </div>

      {/* Reservations Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#f98b25]" />
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No reservations found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery
              ? "No reservations match your search query."
              : "No table bookings match the selected status filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReservations.map((res) => {
            const date = new Date(res.reservationTime);
            const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
            const config = STATUS_CONFIG[res.status];

            return (
              <div
                key={res.id}
                className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(249,139,37,0.3)] rounded-xl p-5 flex flex-col justify-between space-y-4 transition-all shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-white font-[family-name:var(--font-display)]">
                        {res.customerName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{res.customerPhone}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${config.badgeClass}`}
                    >
                      {config.label}
                    </span>
                  </div>

                  {/* Booking details */}
                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                    <div className="bg-[#0D1117] p-2.5 rounded-lg border border-[rgba(255,255,255,0.04)]">
                      <div className="text-slate-500 text-[10px] flex items-center gap-1 mb-0.5">
                        <Clock className="w-3 h-3" /> Time & Date
                      </div>
                      <div className="font-semibold text-white">
                        {timeStr} • {dateStr}
                      </div>
                    </div>

                    <div className="bg-[#0D1117] p-2.5 rounded-lg border border-[rgba(255,255,255,0.04)]">
                      <div className="text-slate-500 text-[10px] flex items-center gap-1 mb-0.5">
                        <Users className="w-3 h-3" /> Party & Table
                      </div>
                      <div className="font-semibold text-white">
                        {res.partySize} guests {res.tableNumber ? `• ${res.tableNumber}` : ""}
                      </div>
                    </div>
                  </div>

                  {res.specialRequests && (
                    <div className="mt-3 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg text-xs text-amber-300/90 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                      <span>{res.specialRequests}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between gap-2">
                  {res.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(res.id, "confirmed")}
                        className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(res.id, "cancelled")}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-red-400 text-xs font-semibold"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {res.status === "confirmed" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(res.id, "seated")}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        Seat Guests
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(res.id, "no_show")}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold"
                      >
                        No Show
                      </button>
                    </>
                  )}

                  {res.status === "seated" && (
                    <button
                      onClick={() => handleUpdateStatus(res.id, "completed")}
                      className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                    >
                      Complete & Free Table
                    </button>
                  )}

                  {(res.status === "completed" || res.status === "cancelled" || res.status === "no_show") && (
                    <span className="text-xs text-slate-500 italic">Archived</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Reservation Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-[#161b22] border-[rgba(255,255,255,0.08)] text-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-[family-name:var(--font-display)] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#f98b25]" /> Book a Table
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateReservation} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Guest Name *</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Alisher Navoiy"
                required
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Phone Number *</Label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+998 90 000 00 00"
                required
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Party Size *</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  required
                  className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Table (Optional)</Label>
                <Input
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. T-12 / VIP"
                  className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Date & Time *</Label>
              <Input
                type="datetime-local"
                value={reservationTime}
                onChange={(e) => setReservationTime(e.target.value)}
                required
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Special Notes / Allergies</Label>
              <Input
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="e.g. Birthday setup, non-smoking room"
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#f98b25] hover:bg-[#e07b1d] text-white text-sm font-semibold"
              >
                Confirm Booking
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

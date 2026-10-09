"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { formatUZS } from "@/lib/format";
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Banknote,
  Activity,
  Zap,
  Settings,
  ShieldCheck,
  Package,
  ExternalLink,
  ChevronRight,
  Calculator,
  X,
  Plus,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import {
  calculateNoorFee,
  createNoorQuote,
  dispatchNoorDelivery,
} from "@/lib/dispatch/noor-service";
import { NOOR_PRICING, type DeliveryStatus } from "@/lib/dispatch/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeliveryItem {
  id: string;
  orderNumber: string;
  customerName: string;
  dropoffAddress: string;
  driver: string;
  status: DeliveryStatus;
  etaMins: number;
  trackingUrl?: string | null;
  fee: number;
}

const FALLBACK_DELIVERIES: DeliveryItem[] = [
  {
    id: "DEL-10241",
    orderNumber: "PLT-10241",
    customerName: "Anvar M.",
    dropoffAddress: "Mirzo Ulugbek 44, Tashkent",
    driver: "Sardor M. • White Tact #402",
    status: "picked_up",
    etaMins: 12,
    fee: 19500,
    trackingUrl: "https://track.noor.uz/DEL-10241",
  },
  {
    id: "DEL-10244",
    orderNumber: "PLT-10244",
    customerName: "Zarina T.",
    dropoffAddress: "Yakkasaray 12-b, Tashkent",
    driver: "Aziz K. • Yellow Spark #890",
    status: "driver_at_pickup",
    etaMins: 22,
    fee: 24000,
    trackingUrl: "https://track.noor.uz/DEL-10244",
  },
  {
    id: "DEL-10246",
    orderNumber: "PLT-10246",
    customerName: "Olim R.",
    dropoffAddress: "Chilonzor 7-23, Tashkent",
    driver: "Dilshod N. • Cobalt #102",
    status: "driver_assigned",
    etaMins: 35,
    fee: 28500,
    trackingUrl: "https://track.noor.uz/DEL-10246",
  },
];

const STATUS_PROGRESSION: DeliveryStatus[] = [
  "driver_assigned",
  "driver_at_pickup",
  "picked_up",
  "delivered",
];

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  created: "Created",
  driver_assigned: "Courier Assigned",
  driver_at_pickup: "At Pickup",
  picked_up: "In Transit",
  driver_at_dropoff: "At Dropoff",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Failed",
  returned: "Returned",
};

export default function DispatchPage() {
  const { user } = useAuthStore();
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>(FALLBACK_DELIVERIES);
  const [distance, setDistance] = useState<number>(4.5);
  const [isLoading, setIsLoading] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [manualCustomer, setManualCustomer] = useState("");
  const [manualDistance, setManualDistance] = useState<number>(4);
  const [isDispatching, setIsDispatching] = useState(false);

  const restaurantId = user?.restaurant_id;

  const loadDeliveries = useCallback(async () => {
    if (!restaurantId) return;
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("deliveries")
        .select("*, orders(order_number, delivery_address, total)")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        setDeliveries(
          data.map((row) => ({
            id: row.id,
            orderNumber: row.orders?.order_number || `ORD-${row.order_id?.slice(0, 5) || "0000"}`,
            customerName: row.driver_name ? `Customer for ${row.driver_name}` : "Guest Customer",
            dropoffAddress: row.orders?.delivery_address || "Tashkent Address",
            driver: row.driver_name ? `${row.driver_name} (${row.driver_phone || "Noor"})` : "Assigning Courier...",
            status: row.status as DeliveryStatus,
            etaMins: 20,
            fee: row.fee || calculateNoorFee(4.5),
            trackingUrl: row.tracking_url,
          }))
        );
      }
    } catch (err) {
      console.warn("[Dispatch] Load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  // Fee calculation using the Noor Pricing Engine
  const currentFee = useMemo(() => {
    return calculateNoorFee(distance);
  }, [distance]);

  const advanceDeliveryStatus = async (deliveryId: string) => {
    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery) return;

    const currentIdx = STATUS_PROGRESSION.indexOf(delivery.status);
    if (currentIdx >= 0 && currentIdx < STATUS_PROGRESSION.length - 1) {
      const nextStatus = STATUS_PROGRESSION[currentIdx + 1];

      // Optimistic update
      setDeliveries((prev) =>
        prev.map((d) => (d.id === deliveryId ? { ...d, status: nextStatus } : d))
      );

      if (restaurantId && !deliveryId.startsWith("DEL-")) {
        const supabase = createClient();
        await supabase
          .from("deliveries")
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq("id", deliveryId);
      }

      toast.success(
        `Delivery ${delivery.orderNumber} updated to "${STATUS_LABELS[nextStatus]}"`,
        { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> }
      );
    } else {
      toast.info(`Delivery ${delivery.orderNumber} is already completed`);
    }
  };

  const handleManualDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAddress.trim()) {
      toast.error("Please enter a dropoff address");
      return;
    }

    setIsDispatching(true);
    try {
      const quote = createNoorQuote({
        pickupLat: 41.2995,
        pickupLng: 69.2401,
        dropoffLat: 41.3111,
        dropoffLng: 69.2797,
      });

      const dispatchResult = await dispatchNoorDelivery({
        order_id: crypto.randomUUID(),
        provider: "noor",
        pickup: {
          address: user?.restaurant_name ? `${user.restaurant_name} HQ` : "Tashkent Kitchen",
          location: { lat: 41.2995, lng: 69.2401 },
          phone: "+998 90 000 00 00",
          instructions: "Package ready at counter",
          ready_at: new Date().toISOString(),
        },
        dropoff: {
          address: manualAddress.trim(),
          location: { lat: 41.3111, lng: 69.2797 },
          phone: "+998 90 123 45 67",
          customer_name: manualCustomer.trim() || "Guest Customer",
          instructions: "Door delivery",
        },
        order_value: 120000,
      });

      const newDelItem: DeliveryItem = {
        id: dispatchResult.external_delivery_id,
        orderNumber: `PLT-${Math.floor(10000 + Math.random() * 90000)}`,
        customerName: manualCustomer.trim() || "Direct Dispatch",
        dropoffAddress: manualAddress.trim(),
        driver: "Noor Tech Courier Assigned",
        status: "driver_assigned",
        etaMins: quote.eta_minutes,
        fee: dispatchResult.fee,
        trackingUrl: dispatchResult.tracking_url,
      };

      // Persist to Supabase orders & deliveries if restaurant exists
      if (restaurantId) {
        try {
          const supabase = createClient();
          const { data: orderData } = await supabase
            .from("orders")
            .insert({
              restaurant_id: restaurantId,
              order_number: newDelItem.orderNumber,
              customer_name: manualCustomer.trim() || "Direct Dispatch",
              phone: "+998 90 123 45 67",
              delivery_address: manualAddress.trim(),
              type: "delivery",
              status: "confirmed",
              total: 120000,
              items: [],
            })
            .select("id")
            .single();

          if (orderData?.id) {
            await supabase.from("deliveries").insert({
              order_id: orderData.id,
              restaurant_id: restaurantId,
              provider: "noor",
              external_delivery_id: dispatchResult.external_delivery_id,
              status: "assigned",
              tracking_url: dispatchResult.tracking_url,
              driver_name: "Noor Tech Courier",
              driver_phone: "+998 90 888 77 66",
              fee: dispatchResult.fee,
            });
          }
        } catch (dbErr) {
          console.warn("[Dispatch] DB persistence fallback:", dbErr);
        }
      }

      setDeliveries([newDelItem, ...deliveries]);
      toast.success(
        `Courier dispatched via Noor! ID: ${dispatchResult.external_delivery_id}`,
        {
          description: `Fee: ${formatUZS(dispatchResult.fee)} • ETA: ${quote.eta_minutes}m`,
        }
      );
      setIsManualModalOpen(false);
      setManualAddress("");
      setManualCustomer("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to dispatch courier");
    } finally {
      setIsDispatching(false);
    }
  };

  const activeCount = deliveries.filter((d) => d.status !== "delivered").length;

  return (
    <div className="min-h-screen bg-[#0D1117] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#f98b25]/10 rounded-xl">
            <Truck className="w-6 h-6 text-[#f98b25]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-display)]">
              Fleet Dispatch & Logistics
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Tashkent courier dispatch powered by Noor 3PL
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadDeliveries}
            disabled={isLoading}
            className="p-2 rounded-lg bg-[#161b22] border border-white/5 hover:border-white/10 text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#f98b25]" : ""}`} />
          </button>
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Noor Logistics Active</span>
          </div>
        </div>
      </div>

      {/* Top Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Active Shipments", value: activeCount.toString(), icon: Package, color: "text-blue-400" },
          { label: "Avg Courier Pickup", value: "8m 30s", icon: Clock, color: "text-[#f98b25]" },
          { label: "Est. Avg Delivery Fee", value: formatUZS(22500), icon: Banknote, color: "text-emerald-400" },
          { label: "Courier Fulfillment Rate", value: "99.1%", icon: ShieldCheck, color: "text-purple-400" },
        ].map((stat, i) => (
          <div key={i} className="bg-[#161b22] border border-white/5 rounded-xl p-4 flex items-center space-x-4 shadow-lg">
            <div className={`p-3 rounded-lg bg-[#0D1117] ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">{stat.label}</p>
              <p className="text-xl font-bold font-[family-name:var(--font-mono)] mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Panel: Active Deliveries */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-[#161b22] border border-white/5 rounded-xl p-4">
            <h2 className="text-base font-semibold flex items-center gap-2 font-[family-name:var(--font-display)]">
              <Zap className="w-5 h-5 text-[#f98b25]" /> Live Delivery Tracker
            </h2>
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="flex items-center space-x-2 bg-[#f98b25] hover:bg-[#e07b1d] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-md shadow-orange-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>Manual Dispatch</span>
            </button>
          </div>

          <div className="space-y-4">
            {deliveries.map((delivery) => {
              const currentStepIdx = STATUS_PROGRESSION.indexOf(delivery.status);

              return (
                <div
                  key={delivery.id}
                  className="bg-[#161b22] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors shadow-lg"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white font-[family-name:var(--font-mono)]">
                          {delivery.orderNumber}
                        </h3>
                        <span className="text-[10px] text-gray-500 bg-[#0D1117] px-2 py-0.5 rounded font-mono">
                          {delivery.id}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs mt-1">
                        {delivery.customerName} • {delivery.dropoffAddress}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Truck className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-medium text-gray-300">{delivery.driver}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                        <Clock className="w-3.5 h-3.5 text-[#f98b25]" />
                        <span className="text-xs font-medium text-[#f98b25] font-mono">
                          {delivery.etaMins}m ETA
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2 font-mono">
                        Fee: {formatUZS(delivery.fee)}
                      </p>
                    </div>
                  </div>

                  {/* Status Progress Bar */}
                  <div className="relative mt-6 mb-6 px-2">
                    <div className="absolute top-2 left-4 right-4 h-0.5 bg-white/5 -z-0" />
                    <div className="flex justify-between relative z-10">
                      {STATUS_PROGRESSION.map((step, idx) => {
                        const isDone = currentStepIdx >= idx;
                        const isCurrent = currentStepIdx === idx;

                        return (
                          <div key={step} className="flex flex-col items-center">
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                isDone
                                  ? "bg-emerald-500 border-emerald-500"
                                  : "bg-[#161b22] border-gray-600"
                              } ${isCurrent ? "ring-4 ring-emerald-500/20" : ""}`}
                            >
                              {isDone && <CheckCircle2 className="w-2.5 h-2.5 text-[#161b22]" />}
                            </div>
                            <span
                              className={`text-[10px] mt-1.5 font-medium whitespace-nowrap ${
                                isCurrent
                                  ? "text-white"
                                  : isDone
                                  ? "text-emerald-400"
                                  : "text-gray-500"
                              }`}
                            >
                              {STATUS_LABELS[step]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/5">
                    <button
                      onClick={() => advanceDeliveryStatus(delivery.id)}
                      disabled={delivery.status === "delivered"}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                      <span>Advance Status</span>
                    </button>
                    {delivery.trackingUrl && (
                      <a
                        href={delivery.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#f98b25] hover:bg-[#e07b1d] text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Tracking Link</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Noor Calculator & Provider Config */}
        <div className="space-y-6">
          {/* Noor Delivery Fee Calculator */}
          <div className="bg-[#161b22] border border-white/5 rounded-xl p-5 shadow-lg">
            <h2 className="text-base font-semibold flex items-center gap-2 mb-4 font-[family-name:var(--font-display)]">
              <Calculator className="w-5 h-5 text-[#34d399]" /> Noor Fee Engine
            </h2>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">Delivery Distance (Tashkent)</span>
                  <span className="font-bold text-white font-mono">{distance} km</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="0.5"
                  value={distance}
                  onChange={(e) => setDistance(parseFloat(e.target.value))}
                  className="w-full accent-[#f98b25] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="bg-[#0D1117] rounded-lg p-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Base Door-to-Door</span>
                  <span className="font-mono">{formatUZS(NOOR_PRICING.base_fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    Distance ({distance}km x {NOOR_PRICING.per_km.toLocaleString()})
                  </span>
                  <span className="font-mono">{formatUZS(distance * NOOR_PRICING.per_km)}</span>
                </div>
                {distance >= 7 && distance <= 10 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">7-10 km Surcharge</span>
                    <span className="text-[#f98b25] font-mono">
                      +{formatUZS(NOOR_PRICING.surcharge_7_10_km)}
                    </span>
                  </div>
                )}
                {distance > 10 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">&gt;10 km Surcharge</span>
                    <span className="text-[#f98b25] font-mono">
                      +{formatUZS(NOOR_PRICING.surcharge_over_10_km)}
                    </span>
                  </div>
                )}
                <div className="pt-3 border-t border-white/10 flex justify-between font-bold text-sm">
                  <span>Courier Quote</span>
                  <span className="text-emerald-400 font-mono text-base">
                    {formatUZS(currentFee)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Provider Config Status */}
          <div className="bg-[#161b22] border border-white/5 rounded-xl p-5 shadow-lg space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2 font-[family-name:var(--font-display)]">
              <Settings className="w-5 h-5 text-gray-400" /> Integration Health
            </h2>

            <div className="p-3 bg-[#0D1117] rounded-lg border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-white">Noor Tech 3PL</p>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
                  Connected
                </span>
              </div>
              <p className="text-[10px] text-gray-400">
                Webhook listener active at <code>/api/webhooks/noor</code>
              </p>
            </div>

            <div className="p-3 bg-[#0D1117] rounded-lg border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-white">HMAC SHA-256</p>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[10px] text-gray-400">
                Payload verification verified on driver status updates
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Dispatch Modal */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="max-w-md bg-[#161b22] border-[rgba(255,255,255,0.08)] text-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-[family-name:var(--font-display)]">
              Manual Courier Dispatch
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleManualDispatch} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Customer Name</Label>
              <Input
                value={manualCustomer}
                onChange={(e) => setManualCustomer(e.target.value)}
                placeholder="e.g. Jasur Akhmedov"
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Dropoff Address (Tashkent) *</Label>
              <Input
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="e.g. Mirzo Ulugbek 44, Apt 12"
                required
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">
                Estimated Distance: {manualDistance} km (Est. {formatUZS(calculateNoorFee(manualDistance))})
              </Label>
              <input
                type="range"
                min="1"
                max="15"
                step="0.5"
                value={manualDistance}
                onChange={(e) => setManualDistance(parseFloat(e.target.value))}
                className="w-full accent-[#f98b25] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <DialogFooter className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDispatching}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#f98b25] hover:bg-[#e07b1d] text-white text-sm font-semibold transition-all disabled:opacity-60"
              >
                {isDispatching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  "Confirm & Dispatch"
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

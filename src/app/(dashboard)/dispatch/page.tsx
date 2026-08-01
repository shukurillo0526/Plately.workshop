"use client";

import React, { useState, useEffect } from "react";
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
  ToggleRight,
  ToggleLeft,
  X,
  Plus
} from "lucide-react";
import { toast } from "sonner";

type DeliveryStatus = "Dispatched" | "At Pickup" | "In Transit" | "Delivered";

interface Delivery {
  id: string;
  customerName: string;
  dropoffAddress: string;
  driver: string;
  status: DeliveryStatus;
  etaMins: number;
}

const initialDeliveries: Delivery[] = [
  { id: "PLT-10241", customerName: "Anvar M.", dropoffAddress: "Mirzo Ulugbek 44, Tashkent", driver: "Sardor M. • White Honda Tact #402", status: "In Transit", etaMins: 12 },
  { id: "PLT-10244", customerName: "Zarina T.", dropoffAddress: "Yakkasaray 12-b, Tashkent", driver: "Aziz K. • Yellow Spark #890", status: "At Pickup", etaMins: 25 },
  { id: "PLT-10246", customerName: "Olim R.", dropoffAddress: "Chilonzor 7-23, Tashkent", driver: "Dilshod N. • Black Cobalt #102", status: "Dispatched", etaMins: 35 },
  { id: "PLT-10247", customerName: "Kamola I.", dropoffAddress: "Yunusobod 4-45, Tashkent", driver: "Pending Assignment", status: "Dispatched", etaMins: 40 },
];

const STATUS_STEPS: DeliveryStatus[] = ["Dispatched", "At Pickup", "In Transit", "Delivered"];

export default function DispatchPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>(initialDeliveries);
  const [distance, setDistance] = useState<number>(5);
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualDistance, setManualDistance] = useState<number>(4);

  // Fee calculation
  const calculateFee = (km: number) => {
    const base = 15000;
    const distanceCharge = Math.ceil(km) * 2250;
    let surcharge = 0;
    if (km > 10) surcharge = 5000;
    else if (km > 7) surcharge = 3000;
    return {
      base,
      distanceCharge,
      surcharge,
      total: base + distanceCharge + surcharge
    };
  };

  const feeDetails = calculateFee(distance);

  const advanceStatus = (deliveryId: string) => {
    setDeliveries(prev => prev.map(d => {
      if (d.id === deliveryId) {
        const currentIndex = STATUS_STEPS.indexOf(d.status);
        if (currentIndex < STATUS_STEPS.length - 1) {
          const nextStatus = STATUS_STEPS[currentIndex + 1] as DeliveryStatus;
          toast.success(`Order ${d.id} updated to ${nextStatus}`, {
            icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          });
          return { ...d, status: nextStatus };
        } else {
          toast.info(`Order ${d.id} is already Delivered`);
        }
      }
      return d;
    }));
  };

  const activeCount = deliveries.filter(d => d.status !== "Delivered").length;

  const handleManualDispatch = () => {
    toast.success("Manual dispatch successful. Courier is on the way!");
    setIsManualModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-white p-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#f98b25]/10 rounded-lg">
            <Truck className="w-6 h-6 text-[#f98b25]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Fleet Dispatch & Logistics</h1>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">Noor Logistics Active</span>
        </div>
      </div>

      {/* Top Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Active Deliveries", value: activeCount.toString(), icon: Package, color: "text-blue-400" },
          { label: "Avg Dispatch Time", value: "3m 40s", icon: Clock, color: "text-[#f98b25]" },
          { label: "Avg Delivery Fee", value: formatUZS(18500), icon: Banknote, color: "text-emerald-400" },
          { label: "On-Time Delivery Rate", value: "98.4%", icon: ShieldCheck, color: "text-purple-400" },
        ].map((stat, i) => (
          <div key={i} className="bg-[#161b22] border border-white/5 rounded-xl p-4 flex items-center space-x-4">
            <div className={`p-3 rounded-lg bg-white/5 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Panel: Active Deliveries */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-[#161b22] border border-white/5 rounded-xl p-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#f98b25]" /> Live Delivery Tracker
            </h2>
            <button 
              onClick={() => setIsManualModalOpen(true)}
              className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-white/10"
            >
              <Plus className="w-4 h-4" />
              <span>Manual Dispatch</span>
            </button>
          </div>

          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="bg-[#161b22] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{delivery.id}</h3>
                    <p className="text-gray-400 text-sm">{delivery.customerName} • {delivery.dropoffAddress}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Truck className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-300">{delivery.driver}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                      <Clock className="w-3.5 h-3.5 text-[#f98b25]" />
                      <span className="text-sm font-medium text-[#f98b25]">{delivery.etaMins}m ETA</span>
                    </div>
                  </div>
                </div>

                {/* Status Tracker */}
                <div className="relative mt-6 mb-8">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2"></div>
                  <div className="relative flex justify-between">
                    {STATUS_STEPS.map((step, index) => {
                      const currentIndex = STATUS_STEPS.indexOf(delivery.status);
                      const isCompleted = index <= currentIndex;
                      const isCurrent = index === currentIndex;
                      
                      return (
                        <div key={step} className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center z-10 
                            ${isCompleted ? 'bg-emerald-500 border-emerald-500' : 'bg-[#161b22] border-gray-600'}
                            ${isCurrent ? 'ring-4 ring-emerald-500/20' : ''}
                          `}>
                            {isCompleted && <CheckCircle2 className="w-2.5 h-2.5 text-[#161b22]" />}
                          </div>
                          <span className={`absolute top-6 text-xs font-medium whitespace-nowrap
                            ${isCurrent ? 'text-white' : isCompleted ? 'text-emerald-400' : 'text-gray-500'}
                          `}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-2 border-t border-white/5">
                  <button 
                    onClick={() => advanceStatus(delivery.id)}
                    disabled={delivery.status === "Delivered"}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>Simulate Advance</span>
                  </button>
                  <button 
                    className="flex items-center space-x-1.5 px-4 py-1.5 bg-[#f98b25] hover:bg-[#f98b25]/90 text-[#0D1117] rounded-lg text-sm font-bold transition-colors"
                    onClick={() => toast("Tracking opened in new tab")}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Track Courier</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Configurations & Calculator */}
        <div className="space-y-6">
          
          {/* Noor Delivery Fee Calculator */}
          <div className="bg-[#161b22] border border-white/5 rounded-xl p-5">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-[#34d399]" /> Delivery Fee Calculator
            </h2>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Delivery Distance</span>
                  <span className="font-bold text-white">{distance} km</span>
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

              <div className="bg-[#0D1117] rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Base Door-to-Door</span>
                  <span>{formatUZS(feeDetails.base)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Distance ({distance}km x 2,250)</span>
                  <span>{formatUZS(feeDetails.distanceCharge)}</span>
                </div>
                {feeDetails.surcharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Long-distance Surcharge</span>
                    <span className="text-[#f98b25]">+{formatUZS(feeDetails.surcharge)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-white/10 flex justify-between font-bold">
                  <span>Total Estimated</span>
                  <span className="text-emerald-400 text-lg">{formatUZS(feeDetails.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Provider Config */}
          <div className="bg-[#161b22] border border-white/5 rounded-xl p-5">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-gray-400" /> Provider Configuration
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                <div>
                  <p className="text-sm font-medium">Noor Tech API</p>
                  <p className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Operational (42ms)
                  </p>
                </div>
                <div className="px-2 py-1 bg-white/10 rounded text-xs text-gray-400 font-mono">
                  v2.4.1
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                <div>
                  <p className="text-sm font-medium">Webhook Security</p>
                  <p className="text-xs text-gray-400 mt-0.5">Signature verification active</p>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="flex items-start justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                <div className="pr-4">
                  <p className="text-sm font-medium">Auto-dispatch Rules</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Automatically dispatch delivery orders when marked as Ready in Kitchen Display System (KDS).
                  </p>
                </div>
                <button onClick={() => setAutoDispatch(!autoDispatch)} className="mt-1">
                  {autoDispatch ? (
                    <ToggleRight className="w-8 h-8 text-[#f98b25]" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Manual Dispatch Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#161b22] border border-white/10 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h3 className="font-bold text-lg">Manual Dispatch Quote</h3>
              <button onClick={() => setIsManualModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Select Ready Order</label>
                <select className="w-full bg-[#0D1117] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#f98b25]">
                  <option>PLT-10255 (Kamron B. - 4km)</option>
                  <option>PLT-10256 (Rustam A. - 8.5km)</option>
                </select>
              </div>

              <div className="bg-[#0D1117] rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-[#f98b25] mb-2 font-medium">
                  <MapPin className="w-4 h-4" /> Live Quote Preview
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Distance</span>
                  <span>4.0 km</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Estimated Time</span>
                  <span>14 mins</span>
                </div>
                <div className="pt-3 border-t border-white/10 flex justify-between font-bold">
                  <span>Total Fee</span>
                  <span className="text-emerald-400">{formatUZS(calculateFee(4).total)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-white/5 flex gap-3 justify-end">
              <button 
                onClick={() => setIsManualModalOpen(false)}
                className="px-4 py-2 text-sm font-medium hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleManualDispatch}
                className="px-4 py-2 bg-[#f98b25] hover:bg-[#f98b25]/90 text-[#0D1117] text-sm font-bold rounded-lg transition-colors"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

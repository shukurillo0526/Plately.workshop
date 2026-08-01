"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  ShoppingBag,
  DollarSign,
  ChefHat,
} from "lucide-react";
import { formatUZS } from "@/lib/format";

type TimeFilter = "7d" | "30d" | "90d";

const MOCK_DATA = {
  "7d": {
    revenue: 74500000,
    revenueGrowth: 14.2,
    orders: 1420,
    aov: 52400,
    ordersGrowth: 8.5,
    prepTime: "12m 45s",
    prepTimeDiff: "-1m 15s",
    repeatRate: 42.8,
    repeatGrowth: 2.1,
    revenueTrend: [
      { label: "Mon", value: 9200000 },
      { label: "Tue", value: 8500000 },
      { label: "Wed", value: 10100000 },
      { label: "Thu", value: 9800000 },
      { label: "Fri", value: 14500000 },
      { label: "Sat", value: 16200000 },
      { label: "Sun", value: 6200000 },
    ],
  },
  "30d": {
    revenue: 295000000,
    revenueGrowth: 5.4,
    orders: 5800,
    aov: 50800,
    ordersGrowth: 3.2,
    prepTime: "13m 10s",
    prepTimeDiff: "-30s",
    repeatRate: 40.5,
    repeatGrowth: 1.2,
    revenueTrend: Array.from({ length: 12 }, (_, i) => ({
      label: `Day ${i * 2 + 1}`,
      value: 7000000 + Math.random() * 5000000,
    })),
  },
  "90d": {
    revenue: 850000000,
    revenueGrowth: -2.1,
    orders: 17200,
    aov: 49400,
    ordersGrowth: -1.5,
    prepTime: "14m 05s",
    prepTimeDiff: "+45s",
    repeatRate: 38.2,
    repeatGrowth: -0.5,
    revenueTrend: Array.from({ length: 12 }, (_, i) => ({
      label: `Wk ${i + 1}`,
      value: 50000000 + Math.random() * 30000000,
    })),
  },
};

const TOP_ITEMS = [
  { name: "Osh Plov", count: 845, revenue: 38000000, progress: 100 },
  { name: "Somsa (Meat)", count: 1250, revenue: 15000000, progress: 75 },
  { name: "Shashlik (Lamb)", count: 620, revenue: 18600000, progress: 65 },
  { name: "Lagman", count: 480, revenue: 16800000, progress: 50 },
  { name: "Manti", count: 410, revenue: 14350000, progress: 40 },
];

export default function AnalyticsDashboard() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("7d");
  const data = MOCK_DATA[timeFilter];

  const handleExport = () => {
    // In a real app, this would generate and download a CSV
    alert("Exporting CSV report...");
  };

  const maxTrendValue = useMemo(() => {
    return Math.max(...data.revenueTrend.map((d) => d.value));
  }, [data.revenueTrend]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-lg">
            <BarChart3 className="w-6 h-6 text-[#f98b25]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Analytics & Insights
            </h1>
            <p className="text-sm text-gray-400">
              Track your restaurant's performance metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-lg">
            {(["7d", "30d", "90d"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timeFilter === filter
                    ? "bg-[#21262d] text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {filter === "7d" ? "7 Days" : filter === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Gross Revenue"
          value={formatUZS(data.revenue)}
          growth={data.revenueGrowth}
          icon={<DollarSign className="w-5 h-5 text-[#f98b25]" />}
        />
        <MetricCard
          title="Total Orders"
          value={data.orders.toLocaleString()}
          subtitle={`Avg ${formatUZS(data.aov)}`}
          growth={data.ordersGrowth}
          icon={<ShoppingBag className="w-5 h-5 text-[#34d399]" />}
        />
        <MetricCard
          title="Kitchen Efficiency"
          value={data.prepTime}
          growthText={data.prepTimeDiff}
          growthPositive={data.prepTimeDiff.startsWith("-")}
          icon={<ChefHat className="w-5 h-5 text-blue-400" />}
        />
        <MetricCard
          title="Repeat Customer Rate"
          value={`${data.repeatRate}%`}
          growth={data.repeatGrowth}
          icon={<Users className="w-5 h-5 text-purple-400" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-white">Revenue Trend</h2>
          </div>
          <div className="h-64 flex items-end gap-2">
            {data.revenueTrend.map((item, idx) => {
              const isMax = item.value === maxTrendValue;
              const heightPct = (item.value / maxTrendValue) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10 border border-gray-700 shadow-lg">
                    {formatUZS(item.value)}
                  </div>
                  <div className="w-full h-full flex items-end justify-center pb-2">
                    <div
                      className={`w-full max-w-[40px] rounded-t-sm transition-all duration-500 ease-out ${
                        isMax ? "bg-[#f98b25]" : "bg-[#21262d] group-hover:bg-[#30363d]"
                      }`}
                      style={{ height: `${Math.max(heightPct, 5)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 truncate w-full text-center">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performing Menu Items */}
        <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
          <h2 className="text-lg font-medium text-white mb-6">Top Menu Items</h2>
          <div className="space-y-5">
            {TOP_ITEMS.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-200">{item.name}</span>
                  <span className="text-gray-400">{item.count} orders</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-[#21262d] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#34d399] rounded-full"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-300 w-24 text-right">
                    {formatUZS(item.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Type Distribution */}
        <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
          <h2 className="text-lg font-medium text-white mb-6">Order Distribution</h2>
          <div className="flex items-center justify-center gap-8 h-48">
            {/* Custom Doughnut using SVG */}
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Delivery 58% */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f98b25" strokeWidth="20" strokeDasharray="364.4" strokeDashoffset="0" className="hover:opacity-80 cursor-pointer transition-opacity" />
                {/* Pickup 28% */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#34d399" strokeWidth="20" strokeDasharray="175.9 300" strokeDashoffset="-176.4" className="hover:opacity-80 cursor-pointer transition-opacity" />
                {/* Dine-in 14% */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#8b5cf6" strokeWidth="20" strokeDasharray="87.9 300" strokeDashoffset="-288" className="hover:opacity-80 cursor-pointer transition-opacity" />
              </svg>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#f98b25]" />
                <div>
                  <div className="text-sm font-medium text-gray-200">Delivery</div>
                  <div className="text-xs text-gray-400">58%</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#34d399]" />
                <div>
                  <div className="text-sm font-medium text-gray-200">Pickup</div>
                  <div className="text-xs text-gray-400">28%</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
                <div>
                  <div className="text-sm font-medium text-gray-200">Dine-in</div>
                  <div className="text-xs text-gray-400">14%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Peak Hours Heatmap */}
        <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
          <h2 className="text-lg font-medium text-white mb-6">Peak Hours</h2>
          <div className="h-48 flex items-end gap-1">
            {Array.from({ length: 24 }).map((_, i) => {
              // Create bimodal distribution for lunch (12-14) and dinner (18-21)
              let activity = 10 + Math.random() * 20; // baseline
              if (i >= 11 && i <= 14) activity += 50 + Math.random() * 20;
              if (i >= 17 && i <= 21) activity += 60 + Math.random() * 30;
              
              const isPeak = activity > 70;
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10">
                    {i}:00
                  </div>
                  <div 
                    className={`w-full rounded-sm transition-all ${
                      isPeak ? "bg-[#34d399]" : "bg-[#21262d] group-hover:bg-[#30363d]"
                    }`}
                    style={{ height: `${activity}%` }}
                  />
                  {i % 4 === 0 && (
                    <span className="text-[10px] text-gray-500 mt-2 block w-full text-center">
                      {i}h
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  growth,
  growthText,
  growthPositive,
  icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  growth?: number;
  growthText?: string;
  growthPositive?: boolean;
  icon: React.ReactNode;
}) {
  const isPositive = growth !== undefined ? growth > 0 : growthPositive;
  const displayGrowth = growth !== undefined ? `${growth > 0 ? "+" : ""}${growth}%` : growthText;

  return (
    <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <div className="p-2 bg-[#0D1117] rounded-lg border border-[rgba(255,255,255,0.02)]">
          {icon}
        </div>
      </div>
      <div>
        <div className="text-2xl font-semibold text-white mb-1">{value}</div>
        <div className="flex items-center gap-2">
          {displayGrowth && (
            <div
              className={`flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                isPositive
                  ? "bg-emerald-500/10 text-[#34d399]"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {displayGrowth}
            </div>
          )}
          {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  ChefHat,
  Utensils,
  CheckCircle2,
  Circle,
  Sparkles,
  LayoutGrid,
  Bot,
  Globe,
  PhoneCall,
  Calendar,
  AlertTriangle,
  MoveUp,
  MoveDown,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { formatUZS } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export type WorkspacePreset = 'default' | 'evening_rush' | 'morning_prep' | 'growth';

export type WidgetId =
  | 'stats'
  | 'ai_briefing'
  | 'kds_stream'
  | 'recent_orders'
  | 'reservations'
  | 'quick_actions';

interface DashboardStats {
  revenueToday: number;
  ordersToday: number;
  avgPrepTime: string;
  activeOrdersCount: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  itemsSummary: string;
  type: string;
  total: number;
  status: string;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    revenueToday: 2450000,
    ordersToday: 142,
    avgPrepTime: '14m 20s',
    activeOrdersCount: 28,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [menuCount, setMenuCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Part B5: Customizable Window Workspace State
  const [activePreset, setActivePreset] = useState<WorkspacePreset>('default');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [widgets, setWidgets] = useState<Array<{ id: WidgetId; name: string; enabled: boolean }>>([
    { id: 'stats', name: 'Performance Ticker', enabled: true },
    { id: 'ai_briefing', name: 'AI Agent Briefing', enabled: true },
    { id: 'kds_stream', name: 'Kitchen Display Radar', enabled: true },
    { id: 'recent_orders', name: 'Live Orders Stream', enabled: true },
    { id: 'reservations', name: 'Table Reservations Today', enabled: true },
    { id: 'quick_actions', name: 'Operational Shortcuts', enabled: true },
  ]);

  const restaurantId = user?.restaurant_id;

  const loadDashboardData = useCallback(async () => {
    if (!restaurantId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();

      // 1. Fetch menu count for checklist
      const { count: dishCount } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId);

      setMenuCount(dishCount || 0);

      // 2. Fetch today's orders
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data: todayOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', startOfDay.toISOString())
        .order('created_at', { ascending: false });

      if (!ordersError && todayOrders) {
        const valid = todayOrders.filter((o) => o.status !== 'cancelled' && o.status !== 'rejected');
        const rev = valid.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        const active = todayOrders.filter((o) => ['confirmed', 'preparing', 'ready', 'dispatched'].includes(o.status)).length;

        setStats({
          revenueToday: rev,
          ordersToday: todayOrders.length,
          avgPrepTime: '15m 00s',
          activeOrdersCount: active,
        });

        if (todayOrders.length > 0) {
          setRecentOrders(
            todayOrders.slice(0, 5).map((o) => {
              let summary = 'Dishes';
              if (Array.isArray(o.items) && o.items.length > 0) {
                summary = `${o.items.length} item${o.items.length > 1 ? 's' : ''}`;
              }
              return {
                id: o.id,
                orderNumber: o.order_number || `ORD-${String(o.id).slice(0, 5)}`,
                itemsSummary: `${summary} • ${o.type || 'Order'}`,
                type: o.type || 'delivery',
                total: Number(o.total) || 0,
                status: o.status || 'confirmed',
              };
            })
          );
        }
      }
    } catch (err) {
      console.warn('[Dashboard] Data fetch fallback:', err);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Apply Workspace Presets
  const applyPreset = (preset: WorkspacePreset) => {
    setActivePreset(preset);
    if (preset === 'evening_rush') {
      setWidgets([
        { id: 'kds_stream', name: 'Kitchen Display Radar', enabled: true },
        { id: 'recent_orders', name: 'Live Orders Stream', enabled: true },
        { id: 'stats', name: 'Performance Ticker', enabled: true },
        { id: 'ai_briefing', name: 'AI Agent Briefing', enabled: false },
        { id: 'reservations', name: 'Table Reservations Today', enabled: true },
        { id: 'quick_actions', name: 'Operational Shortcuts', enabled: true },
      ]);
      toast.success('Applied "Friday Evening Rush" workspace layout!');
    } else if (preset === 'growth') {
      setWidgets([
        { id: 'ai_briefing', name: 'AI Agent Briefing', enabled: true },
        { id: 'stats', name: 'Performance Ticker', enabled: true },
        { id: 'reservations', name: 'Table Reservations Today', enabled: true },
        { id: 'recent_orders', name: 'Live Orders Stream', enabled: true },
        { id: 'kds_stream', name: 'Kitchen Display Radar', enabled: false },
        { id: 'quick_actions', name: 'Operational Shortcuts', enabled: true },
      ]);
      toast.success('Applied "Growth & Marketing" workspace layout!');
    } else {
      setWidgets([
        { id: 'stats', name: 'Performance Ticker', enabled: true },
        { id: 'ai_briefing', name: 'AI Agent Briefing', enabled: true },
        { id: 'kds_stream', name: 'Kitchen Display Radar', enabled: true },
        { id: 'recent_orders', name: 'Live Orders Stream', enabled: true },
        { id: 'reservations', name: 'Table Reservations Today', enabled: true },
        { id: 'quick_actions', name: 'Operational Shortcuts', enabled: true },
      ]);
      toast.info('Reset to Default Executive workspace.');
    }
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const list = [...widgets];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) return;
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    setWidgets(list);
  };

  const toggleWidget = (id: WidgetId) => {
    setWidgets(widgets.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)));
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatUZS(stats.revenueToday),
      unit: '',
      change: '+12%',
      trend: 'up' as const,
      subtitle: 'today',
      icon: DollarSign,
      gradient: 'from-amber-500/20 to-orange-500/10',
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
    },
    {
      title: 'Orders Today',
      value: String(stats.ordersToday),
      unit: '',
      change: '+5%',
      trend: 'up' as const,
      subtitle: 'orders placed',
      icon: ShoppingBag,
      gradient: 'from-blue-500/20 to-indigo-500/10',
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
    },
    {
      title: 'Avg Prep Time',
      value: stats.avgPrepTime,
      unit: '',
      change: '',
      trend: 'up' as const,
      subtitle: 'target < 20m',
      icon: Clock,
      gradient: 'from-purple-500/20 to-violet-500/10',
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10',
    },
    {
      title: 'Active Orders',
      value: String(stats.activeOrdersCount),
      unit: '',
      change: '',
      trend: 'up' as const,
      subtitle: 'Kitchen in progress',
      icon: Users,
      gradient: 'from-emerald-500/20 to-teal-500/10',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="space-y-8 text-slate-200">
      {/* Workspace Header & Preset Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-white">
            Command Center
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Welcome back to {user?.restaurant_name || 'Kamolon'}. Customizable operating system overview.
          </p>
        </div>

        {/* Workspace Customizer Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-lg p-1 text-xs">
            <button
              onClick={() => applyPreset('default')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activePreset === 'default' ? 'bg-[#f98b25] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => applyPreset('evening_rush')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activePreset === 'evening_rush' ? 'bg-[#f98b25] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Evening Rush
            </button>
            <button
              onClick={() => applyPreset('growth')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activePreset === 'growth' ? 'bg-[#f98b25] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🚀 Growth & AI
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCustomizing(!isCustomizing)}
            className="text-xs h-9 border-[rgba(255,255,255,0.08)] text-slate-300 hover:text-white"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-[#f98b25]" />
            {isCustomizing ? 'Done' : 'Customize Windows'}
          </Button>
        </div>
      </div>

      {/* WINDOW REORDERING TRAY (PART B5) */}
      {isCustomizing && (
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#f98b25]/30 space-y-3 animate-in fade-in duration-200 shadow-xl">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-[#f98b25]" /> Drag & Reorder Workspace Windows
            </span>
            <span className="text-slate-400">Toggle or move windows to personalize your shift</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {widgets.map((w, idx) => (
              <div
                key={w.id}
                className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                  w.enabled
                    ? 'bg-[#0D1117] border-[rgba(255,255,255,0.12)] text-white'
                    : 'bg-[#0D1117]/40 border-white/5 text-slate-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold truncate text-[11px]">{w.name}</span>
                  <input
                    type="checkbox"
                    checked={w.enabled}
                    onChange={() => toggleWidget(w.id)}
                    className="rounded accent-[#f98b25]"
                  />
                </div>
                <div className="flex items-center gap-1 justify-end pt-1 border-t border-white/5">
                  <button
                    disabled={idx === 0}
                    onClick={() => moveWidget(idx, 'up')}
                    className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20"
                  >
                    <MoveUp className="w-3 h-3" />
                  </button>
                  <button
                    disabled={idx === widgets.length - 1}
                    onClick={() => moveWidget(idx, 'down')}
                    className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20"
                  >
                    <MoveDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setup Checklist Banner (shown when setting up) */}
      {menuCount < 5 && (
        <div className="p-5 rounded-xl border border-[rgba(249,139,37,0.3)] bg-gradient-to-r from-[rgba(249,139,37,0.1)] to-transparent flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-semibold text-white text-base flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#f98b25]" />
              Setup your restaurant presence
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Complete these steps to get your kitchen ready for incoming orders.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link
              href="/menu"
              className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors"
            >
              {menuCount > 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Circle className="w-4 h-4 text-gray-500" />
              )}
              Add 5 dishes ({menuCount}/5)
            </Link>
            <Link
              href="/kds"
              className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Test Kitchen Display
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors"
            >
              <Circle className="w-4 h-4 text-gray-500" />
              Configure hours & staff
            </Link>
          </div>
        </div>
      )}

      {/* RENDER DYNAMIC WORKSPACE WINDOWS */}
      {widgets
        .filter((w) => w.enabled)
        .map((w) => {
          if (w.id === 'stats') {
            return (
              <div key="stats" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {statCards.map((stat) => {
                  const Icon = stat.icon;
                  const isPositive = stat.trend === 'up' && stat.title !== 'Avg Prep Time';
                  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
                  const trendColor = isPositive ? 'text-emerald-400' : 'text-red-400';

                  return (
                    <div
                      key={stat.title}
                      className="group relative overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#161b22] p-5 hover:border-[rgba(255,255,255,0.12)] transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                      />

                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-gray-400">{stat.title}</h3>
                          <div className={`w-9 h-9 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                            <Icon className={`w-[18px] h-[18px] ${stat.iconColor}`} />
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold font-[family-name:var(--font-mono)] text-white tracking-tight">
                            {stat.value}
                          </p>
                          {stat.unit && (
                            <span className="text-sm text-gray-500 font-medium">{stat.unit}</span>
                          )}
                        </div>
                        {stat.change && (
                          <div className="flex items-center gap-1 mt-2">
                            <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
                            <span className={`text-xs font-medium ${trendColor}`}>{stat.change}</span>
                            <span className="text-xs text-gray-600">{stat.subtitle}</span>
                          </div>
                        )}
                        {!stat.change && stat.subtitle && (
                          <p className="text-xs text-gray-600 mt-2">{stat.subtitle}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }

          if (w.id === 'ai_briefing') {
            return (
              <div
                key="ai_briefing"
                className="p-5 rounded-xl border border-[rgba(249,139,37,0.2)] bg-gradient-to-r from-[#161b22] via-[#1c2333] to-[#161b22] flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#f98b25]" />
                    <h3 className="text-sm font-bold text-white">AI Agent Shift Briefing</h3>
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                      3 Actionable Recommendations
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    Marketing Agent generated a Friday 15% Telegram promotion; Analytics Agent recommends +3,000 UZS on Lamb Shashlik.
                  </p>
                </div>

                <Link href="/agents">
                  <Button size="sm" className="bg-[#f98b25] hover:bg-[#e07b1d] text-white text-xs font-semibold h-8 px-4">
                    Open Agents Inbox <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            );
          }

          if (w.id === 'kds_stream') {
            return (
              <div key="kds_stream" className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#161b22] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-[#f98b25]" />
                    <h2 className="text-base font-semibold text-white font-[family-name:var(--font-display)]">
                      Kitchen Display System Radar
                    </h2>
                  </div>
                  <Link href="/kds" className="text-xs text-[#f98b25] hover:underline flex items-center gap-1">
                    Open Fullscreen KDS <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#0D1117] border border-amber-500/20 flex justify-between items-center">
                    <div>
                      <p className="text-slate-400 font-medium">New Orders</p>
                      <p className="text-lg font-bold text-amber-400">4</p>
                    </div>
                    <Badge className="bg-amber-500/10 text-amber-400 text-[10px]">Awaiting Accept</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0D1117] border border-blue-500/20 flex justify-between items-center">
                    <div>
                      <p className="text-slate-400 font-medium">Cooking / Prep</p>
                      <p className="text-lg font-bold text-blue-400">6</p>
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-400 text-[10px]">Line Active</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0D1117] border border-emerald-500/20 flex justify-between items-center">
                    <div>
                      <p className="text-slate-400 font-medium">Ready for Staging</p>
                      <p className="text-lg font-bold text-emerald-400">2</p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 text-[10px]">Expedite</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0D1117] border border-purple-500/20 flex justify-between items-center">
                    <div>
                      <p className="text-slate-400 font-medium">Out with Couriers</p>
                      <p className="text-lg font-bold text-purple-400">3</p>
                    </div>
                    <Badge className="bg-purple-500/10 text-purple-400 text-[10px]">Delivering</Badge>
                  </div>
                </div>
              </div>
            );
          }

          if (w.id === 'recent_orders') {
            return (
              <div key="recent_orders" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#161b22] p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold font-[family-name:var(--font-display)] text-white">
                      Live Orders Stream
                    </h2>
                    <Link href="/orders" className="text-xs text-[#f98b25] hover:underline">
                      View all
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {recentOrders.length > 0 ? (
                      recentOrders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.04)] last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#1c2333] flex items-center justify-center">
                              <Utensils className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{order.orderNumber}</p>
                              <p className="text-xs text-gray-500">{order.itemsSummary}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium font-[family-name:var(--font-mono)] text-white">
                              {formatUZS(order.total)}
                            </p>
                            <p className="text-xs text-emerald-400 capitalize">{order.status}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      [1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.04)] last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#1c2333] flex items-center justify-center">
                              <Utensils className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                PLT-{String(10240 + i).padStart(5, '0')}
                              </p>
                              <p className="text-xs text-gray-500">2 items • Delivery</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium font-[family-name:var(--font-mono)] text-white">
                              {formatUZS(35000 + i * 12000)}
                            </p>
                            <p className="text-xs text-emerald-400">Completed</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Operational Shortcuts */}
                <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#161b22] p-6 space-y-4">
                  <h2 className="text-base font-semibold font-[family-name:var(--font-display)] text-white">
                    Omnichannel Hubs
                  </h2>
                  <div className="space-y-2">
                    <Link
                      href="/website"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Website & Storefront</p>
                        <p className="text-xs text-gray-500">Visual site builder</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-white" />
                    </Link>

                    <Link
                      href="/voice"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Voice & Phone Orders</p>
                        <p className="text-xs text-gray-500">Telephony simulator</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-white" />
                    </Link>

                    <Link
                      href="/agents"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">AI Agents Console</p>
                        <p className="text-xs text-gray-500">Approval inbox & skills</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-white" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          }

          if (w.id === 'reservations') {
            return (
              <div key="reservations" className="p-6 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#161b22] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-400" />
                    <h2 className="text-base font-semibold text-white font-[family-name:var(--font-display)]">
                      Table Reservations Today
                    </h2>
                  </div>
                  <Link href="/reservations" className="text-xs text-[#f98b25] hover:underline flex items-center gap-1">
                    Manage Table Bookings <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#0D1117] border border-white/5 space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>Otabek M.</span>
                      <span className="text-amber-400">19:30</span>
                    </div>
                    <p className="text-slate-400">Party of 4 • Table T-04 (Window)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0D1117] border border-white/5 space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>Dilfuza K.</span>
                      <span className="text-amber-400">20:00</span>
                    </div>
                    <p className="text-slate-400">Party of 2 • Table T-02</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0D1117] border border-white/5 space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>Azamat Sh.</span>
                      <span className="text-amber-400">21:15</span>
                    </div>
                    <p className="text-slate-400">Party of 6 • VIP-1 (Pre-ordered Osh)</p>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}
    </div>
  );
}

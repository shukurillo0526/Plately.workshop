'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { formatUZS } from '@/lib/format';

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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-white">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back to {user?.restaurant_name || 'Plately Workshop'}. Here&apos;s your live overview.
        </p>
      </div>

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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
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

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#161b22] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold font-[family-name:var(--font-display)] text-white">
              Recent Orders
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

        {/* Quick Actions */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#161b22] p-6">
          <h2 className="text-base font-semibold font-[family-name:var(--font-display)] text-white mb-5">
            Quick Actions
          </h2>
          <div className="space-y-2.5">
            {[
              {
                label: 'Open KDS',
                desc: 'Kitchen display screen',
                icon: ChefHat,
                href: '/kds',
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
              },
              {
                label: 'Manage Orders',
                desc: 'History & statuses',
                icon: ShoppingBag,
                href: '/orders',
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
              },
              {
                label: 'Edit Menu',
                desc: 'Dishes, modifiers & prices',
                icon: Utensils,
                href: '/menu',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
              },
            ].map((action) => {
              const ActionIcon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors group"
                >
                  <div className={`w-9 h-9 rounded-lg ${action.bg} flex items-center justify-center`}>
                    <ActionIcon className={`w-[18px] h-[18px] ${action.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{action.label}</p>
                    <p className="text-xs text-gray-500">{action.desc}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

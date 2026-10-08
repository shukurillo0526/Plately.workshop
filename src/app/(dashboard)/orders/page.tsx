"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ClipboardList, Search, ChevronUp, ChevronDown, RefreshCw, Loader2 } from "lucide-react";
import { formatUZS, formatOrderNumber, formatRelativeTime } from "@/lib/format";
import { StatusBadge, OrderStatus } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";

type OrderType = "delivery" | "pickup" | "dine_in";

interface Order {
  id: string | number;
  customerName: string;
  itemsSummary: string;
  type: OrderType;
  total: number;
  status: OrderStatus;
  time: Date;
}

const SAMPLE_ORDERS: Order[] = [
  { id: 10250, customerName: "Alisher N.", itemsSummary: "2x Osh, 1x Somsa", type: "delivery", total: 115000, status: "preparing", time: new Date(Date.now() - 5 * 60000) },
  { id: 10249, customerName: "Dilnoza M.", itemsSummary: "1x Manti, 2x Choy", type: "dine_in", total: 45000, status: "ready", time: new Date(Date.now() - 15 * 60000) },
  { id: 10248, customerName: "Bobur T.", itemsSummary: "3x Shashlik, 1x Non", type: "pickup", total: 120000, status: "completed", time: new Date(Date.now() - 30 * 60000) },
  { id: 10247, customerName: "Zarina K.", itemsSummary: "2x Lagman", type: "delivery", total: 90000, status: "confirmed", time: new Date(Date.now() - 45 * 60000) },
  { id: 10246, customerName: "Timur Y.", itemsSummary: "1x Qozonkabob", type: "dine_in", total: 85000, status: "completed", time: new Date(Date.now() - 60 * 60000) },
  { id: 10245, customerName: "Nodira S.", itemsSummary: "4x Somsa, 1x Choy", type: "pickup", total: 40000, status: "completed", time: new Date(Date.now() - 90 * 60000) },
  { id: 10244, customerName: "Jasur D.", itemsSummary: "1x Osh", type: "delivery", total: 45000, status: "cancelled", time: new Date(Date.now() - 120 * 60000) },
  { id: 10243, customerName: "Sevara A.", itemsSummary: "2x Manti, 1x Qatiq", type: "dine_in", total: 65000, status: "completed", time: new Date(Date.now() - 150 * 60000) },
  { id: 10242, customerName: "Rustam B.", itemsSummary: "5x Shashlik, 2x Non", type: "pickup", total: 210000, status: "completed", time: new Date(Date.now() - 180 * 60000) },
  { id: 10241, customerName: "Gulnora R.", itemsSummary: "1x Norin, 1x Choy", type: "delivery", total: 55000, status: "completed", time: new Date(Date.now() - 240 * 60000) },
];

type SortField = 'id' | 'customerName' | 'total' | 'status' | 'time';
type SortDirection = 'asc' | 'desc';

export default function OrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [sortField, setSortField] = useState<SortField>("time");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const restaurantId = user?.restaurant_id;

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) {
      setOrders(SAMPLE_ORDERS);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[OrdersPage] Supabase query failed:', error.message);
        setOrders(SAMPLE_ORDERS);
      } else if (data && data.length > 0) {
        setOrders(
          data.map((row) => {
            let summary = 'Dishes';
            if (Array.isArray(row.items) && row.items.length > 0) {
              summary = row.items.map((i: any) => `${i.quantity || 1}x ${i.name || 'Item'}`).join(', ');
            }
            return {
              id: row.order_number || row.id,
              customerName: row.customer_name || 'Guest Customer',
              itemsSummary: summary,
              type: (row.type as OrderType) || 'delivery',
              total: Number(row.total) || 0,
              status: (row.status as OrderStatus) || 'confirmed',
              time: row.created_at ? new Date(row.created_at) : new Date(),
            };
          })
        );
      } else {
        setOrders(SAMPLE_ORDERS);
      }
    } catch (err) {
      console.error('[OrdersPage] Error:', err);
      setOrders(SAMPLE_ORDERS);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter and sort logic
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const orderIdStr = String(order.id).toLowerCase();
        const matchesSearch =
          orderIdStr.includes(searchQuery.toLowerCase()) ||
          order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.itemsSummary.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const multiplier = sortDirection === 'asc' ? 1 : -1;
        if (sortField === 'id') return String(a.id).localeCompare(String(b.id)) * multiplier;
        if (sortField === 'total') return (a.total - b.total) * multiplier;
        if (sortField === 'time') return (a.time.getTime() - b.time.getTime()) * multiplier;
        if (sortField === 'customerName') return a.customerName.localeCompare(b.customerName) * multiplier;
        if (sortField === 'status') return a.status.localeCompare(b.status) * multiplier;
        return 0;
      });
  }, [orders, searchQuery, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 ml-1 inline-block" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1 inline-block" />
    );
  };

  const stats = useMemo(() => {
    const valid = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'rejected');
    const revenue = valid.reduce((acc, o) => acc + o.total, 0);
    const avg = valid.length > 0 ? Math.round(revenue / valid.length) : 0;
    const completed = orders.filter((o) => o.status === 'completed').length;
    const rate = orders.length > 0 ? Math.round((completed / orders.length) * 100) : 0;
    return {
      totalOrders: orders.length,
      revenue,
      avgValue: avg,
      completionRate: rate,
    };
  }, [orders]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#f98b25]/10 text-[#f98b25] rounded-xl">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-white">
              Order History
            </h1>
            <p className="text-gray-400 text-sm">Manage and track your restaurant orders</p>
          </div>
        </div>

        <button
          onClick={fetchOrders}
          disabled={isLoading}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-[#161b22] px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] transition-colors"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin text-[#f98b25]")} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: stats.totalOrders },
          { label: "Total Revenue", value: formatUZS(stats.revenue), mono: true },
          { label: "Avg Order Value", value: formatUZS(stats.avgValue), mono: true },
          { label: "Completion Rate", value: `${stats.completionRate}%` },
        ].map((stat, i) => (
          <div key={i} className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
            <p className={cn("text-2xl font-bold text-white", stat.mono && "font-[family-name:var(--font-mono)]")}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-[#161b22] p-4 rounded-xl border border-[rgba(255,255,255,0.06)]">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by order ID, customer, dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f98b25] transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {(["all", "confirmed", "preparing", "ready", "dispatched", "completed", "cancelled"] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border shrink-0",
                  statusFilter === status
                    ? "bg-[#f98b25]/15 text-[#f98b25] border-[#f98b25]/30 shadow-sm"
                    : "text-gray-400 border-transparent hover:text-white hover:bg-[rgba(255,255,255,0.04)]"
                )}
              >
                {status}
              </button>
            )
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)] text-xs text-gray-400 bg-[#0D1117]/50">
                <th className="p-4 font-medium cursor-pointer hover:text-gray-300" onClick={() => handleSort('id')}>
                  Order # {getSortIcon('id')}
                </th>
                <th className="p-4 font-medium cursor-pointer hover:text-gray-300" onClick={() => handleSort('customerName')}>
                  Customer {getSortIcon('customerName')}
                </th>
                <th className="p-4 font-medium">Items Summary</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium cursor-pointer hover:text-gray-300" onClick={() => handleSort('total')}>
                  Total {getSortIcon('total')}
                </th>
                <th className="p-4 font-medium cursor-pointer hover:text-gray-300" onClick={() => handleSort('status')}>
                  Status {getSortIcon('status')}
                </th>
                <th className="p-4 font-medium cursor-pointer hover:text-gray-300" onClick={() => handleSort('time')}>
                  Time {getSortIcon('time')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 text-sm">
                    <Loader2 className="w-6 h-6 animate-spin text-[#f98b25] mx-auto mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order, idx) => (
                  <tr
                    key={String(order.id)}
                    className={cn(
                      "hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer group",
                      idx % 2 === 0 ? "bg-transparent" : "bg-black/10"
                    )}
                  >
                    <td className="p-4 whitespace-nowrap font-[family-name:var(--font-mono)] text-sm font-medium text-[#f98b25]">
                      {typeof order.id === 'number' ? formatOrderNumber(order.id) : String(order.id)}
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm text-gray-200">
                      {order.customerName}
                    </td>
                    <td className="p-4 text-sm text-gray-400 max-w-[200px] truncate">
                      {order.itemsSummary}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="text-xs px-2 py-1 rounded bg-[rgba(255,255,255,0.05)] text-gray-300 capitalize border border-[rgba(255,255,255,0.06)]">
                        {order.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap font-[family-name:var(--font-mono)] text-sm text-gray-200">
                      {formatUZS(order.total)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm text-gray-400">
                      {formatRelativeTime(order.time)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 text-sm">
                    No orders found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

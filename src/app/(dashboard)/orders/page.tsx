"use client";

import { useState } from "react";
import { ClipboardList, Search, Calendar, Download, ChevronUp, ChevronDown } from "lucide-react";
import { formatUZS, formatOrderNumber, formatRelativeTime } from "@/lib/format";
import { StatusBadge, OrderStatus } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

type OrderType = "delivery" | "pickup" | "dine_in";

interface Order {
  id: number;
  customerName: string;
  itemsSummary: string;
  type: OrderType;
  total: number;
  status: OrderStatus;
  time: Date;
}

const sampleOrders: Order[] = [
  { id: 10250, customerName: "Alisher", itemsSummary: "2x Osh, 1x Somsa", type: "delivery", total: 115000, status: "preparing", time: new Date(Date.now() - 5 * 60000) },
  { id: 10249, customerName: "Dilnoza", itemsSummary: "1x Manti, 2x Choy", type: "dine_in", total: 45000, status: "ready", time: new Date(Date.now() - 15 * 60000) },
  { id: 10248, customerName: "Bobur", itemsSummary: "3x Shashlik, 1x Non", type: "pickup", total: 120000, status: "completed", time: new Date(Date.now() - 30 * 60000) },
  { id: 10247, customerName: "Zarina", itemsSummary: "2x Lagman", type: "delivery", total: 90000, status: "confirmed", time: new Date(Date.now() - 45 * 60000) },
  { id: 10246, customerName: "Timur", itemsSummary: "1x Qozonkabob", type: "dine_in", total: 85000, status: "completed", time: new Date(Date.now() - 60 * 60000) },
  { id: 10245, customerName: "Nodira", itemsSummary: "4x Somsa, 1x Choy", type: "pickup", total: 40000, status: "completed", time: new Date(Date.now() - 90 * 60000) },
  { id: 10244, customerName: "Jasur", itemsSummary: "1x Osh", type: "delivery", total: 45000, status: "cancelled", time: new Date(Date.now() - 120 * 60000) },
  { id: 10243, customerName: "Sevara", itemsSummary: "2x Manti, 1x Qatiq", type: "dine_in", total: 65000, status: "completed", time: new Date(Date.now() - 150 * 60000) },
  { id: 10242, customerName: "Rustam", itemsSummary: "5x Shashlik, 2x Non", type: "pickup", total: 210000, status: "completed", time: new Date(Date.now() - 180 * 60000) },
  { id: 10241, customerName: "Gulnora", itemsSummary: "1x Norin, 1x Choy", type: "delivery", total: 55000, status: "completed", time: new Date(Date.now() - 240 * 60000) },
];

type SortField = 'id' | 'customerName' | 'total' | 'status' | 'time';
type SortDirection = 'asc' | 'desc';

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Filter and sort logic
  const filteredOrders = sampleOrders.filter(order => {
    const matchesSearch = 
      formatOrderNumber(order.id).toLowerCase().includes(searchQuery.toLowerCase()) || 
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    if (sortField === 'id') return (a.id - b.id) * multiplier;
    if (sortField === 'total') return (a.total - b.total) * multiplier;
    if (sortField === 'time') return (a.time.getTime() - b.time.getTime()) * multiplier;
    if (sortField === 'customerName') return a.customerName.localeCompare(b.customerName) * multiplier;
    if (sortField === 'status') return a.status.localeCompare(b.status) * multiplier;
    return 0;
  });

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
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1 inline-block" /> : <ChevronDown className="w-4 h-4 ml-1 inline-block" />;
  };

  const stats = {
    totalOrders: sampleOrders.length,
    revenue: sampleOrders.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + o.total, 0),
    avgValue: Math.round(sampleOrders.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + o.total, 0) / Math.max(1, sampleOrders.filter(o => o.status !== 'cancelled').length)),
    completionRate: Math.round((sampleOrders.filter(o => o.status === 'completed').length / sampleOrders.length) * 100)
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-[#f98b25]/10 text-[#f98b25] rounded-xl">
          <ClipboardList className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold var(--font-display) text-white">Order History</h1>
          <p className="text-gray-400 text-sm">Manage and track your restaurant orders</p>
        </div>
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
            <p className={cn("text-2xl font-bold text-white", stat.mono && "var(--font-mono)")}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-lg p-1">
          {[
            { id: "all", label: "All" },
            { id: "completed", label: "Completed" },
            { id: "preparing", label: "Preparing" },
            { id: "cancelled", label: "Cancelled" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                statusFilter === tab.id 
                  ? "bg-[#1c2333] text-white shadow-sm" 
                  : "text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)]"
              )}
            >
              {tab.label}
              {tab.id !== "all" && (
                <span className="ml-2 text-[10px] bg-black/20 px-1.5 py-0.5 rounded-full">
                  {sampleOrders.filter(o => o.status === tab.id).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f98b25]/50 transition-colors"
            />
          </div>
          
          <button className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-gray-300 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Date Range</span>
          </button>
          
          <button className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-gray-300 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#161b22] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1c2333] text-xs text-gray-500 uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">
                <th className="p-4 font-medium cursor-pointer hover:text-gray-300" onClick={() => handleSort('id')}>
                  Order # {getSortIcon('id')}
                </th>
                <th className="p-4 font-medium cursor-pointer hover:text-gray-300" onClick={() => handleSort('customerName')}>
                  Customer {getSortIcon('customerName')}
                </th>
                <th className="p-4 font-medium">Items</th>
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
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order, idx) => (
                  <tr 
                    key={order.id} 
                    className={cn(
                      "hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer group",
                      idx % 2 === 0 ? "bg-transparent" : "bg-black/10"
                    )}
                  >
                    <td className="p-4 whitespace-nowrap var(--font-mono) text-sm font-medium text-[#f98b25]">
                      {formatOrderNumber(order.id)}
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
                    <td className="p-4 whitespace-nowrap var(--font-mono) text-sm text-gray-200">
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

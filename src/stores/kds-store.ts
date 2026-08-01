// ═══════════════════════════════════════════════════════════════
// Plately Workshop — KDS Zustand Store
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OrderStatus } from '@/lib/orders/state-machine';

/**
 * A single order item as displayed on the KDS board.
 */
export interface KDSOrderItem {
  menu_item_id: string;
  name: string;
  quantity: number;
  modifiers: string[];
  special_instructions: string | null;
}

/**
 * An order as displayed on the KDS board.
 */
export interface KDSOrder {
  id: string;
  order_number: string;
  status: OrderStatus;
  items: KDSOrderItem[];
  customer_name: string;
  order_type: 'delivery' | 'pickup' | 'dine_in';
  created_at: string;
  accepted_at: string | null;
  estimated_minutes: number | null;
  priority: 'normal' | 'rush';
  /** Delivery address (if delivery order) */
  delivery_address: string | null;
  /** Auto-reject deadline */
  auto_reject_at: string | null;
  /** Total order price in UZS */
  total?: number;
  /** Special instructions note */
  special_instructions?: string | null;
}

interface KDSStore {
  /** All active orders indexed by ID */
  orders: Record<string, KDSOrder>;
  /** WebSocket connection health */
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
  /** Last successful sync time (ISO string) */
  lastSyncAt: string | null;
  /** Currently selected order (for detail panel) */
  selectedOrderId: string | null;

  // ── Actions ──────────────────────────────────────────────
  setOrders: (orders: KDSOrder[]) => void;
  addOrder: (order: KDSOrder) => void;
  updateOrder: (order: Partial<KDSOrder> & { id: string }) => void;
  removeOrder: (orderId: string) => void;
  setConnectionStatus: (status: KDSStore['connectionStatus']) => void;
  setSelectedOrder: (orderId: string | null) => void;

  // ── Selectors ────────────────────────────────────────────
  getOrdersByStatus: (status: OrderStatus) => KDSOrder[];
  getOrderCount: (status: OrderStatus) => number;
  getOldestByStatus: (status: OrderStatus) => KDSOrder | null;
}

export const useKDSStore = create<KDSStore>()(
  persist(
    (set, get) => ({
      orders: {},
      connectionStatus: 'disconnected',
      lastSyncAt: null,
      selectedOrderId: null,

      setOrders: (orders) => {
        const map: Record<string, KDSOrder> = {};
        for (const order of orders) {
          map[order.id] = order;
        }
        set({ orders: map, lastSyncAt: new Date().toISOString() });
      },

      addOrder: (order) =>
        set((state) => ({
          orders: { ...state.orders, [order.id]: order },
        })),

      updateOrder: (partial) =>
        set((state) => {
          const existing = state.orders[partial.id];
          if (!existing) return state;
          return {
            orders: {
              ...state.orders,
              [partial.id]: { ...existing, ...partial },
            },
          };
        }),

      removeOrder: (orderId) =>
        set((state) => {
          const { [orderId]: _, ...rest } = state.orders;
          return { orders: rest };
        }),

      setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

      setSelectedOrder: (selectedOrderId) => set({ selectedOrderId }),

      getOrdersByStatus: (status) => {
        return Object.values(get().orders)
          .filter((o) => o.status === status)
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );
      },

      getOrderCount: (status) => {
        return Object.values(get().orders).filter((o) => o.status === status)
          .length;
      },

      getOldestByStatus: (status) => {
        const orders = get().getOrdersByStatus(status);
        return orders[0] ?? null;
      },
    }),
    {
      name: 'plately-kds-store',
      // Only persist orders and lastSyncAt (not connection status)
      partialize: (state) => ({
        orders: state.orders,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);

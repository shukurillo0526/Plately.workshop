'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChefHat, Maximize2, Minimize2, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { OrderCard } from '@/components/kds/order-card';
import { PrintReceiptDialog } from '@/components/orders/print-receipt-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { KDSOrder } from '@/stores/kds-store';
import { useRealtimeOrders } from '@/lib/supabase/hooks/use-realtime-orders';
import {
  fetchActiveKDSOrders,
  normalizeKDSOrder,
  updateOrderStatusWithOfflineSync,
  syncOfflineOrderQueue,
} from '@/lib/orders/order-service';
import type { OrderStatus } from '@/lib/orders/state-machine';

// Sample fallback orders for demo/offline preview
const createSampleOrders = (): KDSOrder[] => {
  const now = Date.now();
  return [
    {
      id: 'sample-1', order_number: 'PLT-10241', status: 'confirmed' as const, customer_name: 'Alisher N.', 
      order_type: 'delivery' as const, created_at: new Date(now - 60000).toISOString(), accepted_at: null, estimated_minutes: null, priority: 'normal' as const, delivery_address: 'Mirabad 4, Tashkent', auto_reject_at: null,
      items: [{ menu_item_id: '1', name: 'Osh (Plov)', quantity: 2, modifiers: [], special_instructions: null }, { menu_item_id: '2', name: 'Achichuk', quantity: 1, modifiers: [], special_instructions: null }],
      total: 125000
    },
    {
      id: 'sample-2', order_number: 'PLT-10242', status: 'confirmed' as const, customer_name: 'Dildora T.', 
      order_type: 'pickup' as const, created_at: new Date(now - 200000).toISOString(), accepted_at: null, estimated_minutes: null, priority: 'normal' as const, delivery_address: null, auto_reject_at: null,
      items: [{ menu_item_id: '3', name: 'Somsa', quantity: 4, modifiers: [], special_instructions: 'Extra spicy please' }],
      total: 40000
    },
    {
      id: 'sample-3', order_number: 'PLT-10243', status: 'preparing' as const, customer_name: 'Timur Y.', 
      order_type: 'dine_in' as const, created_at: new Date(now - 600000).toISOString(), accepted_at: null, estimated_minutes: null, priority: 'normal' as const, delivery_address: null, auto_reject_at: null,
      items: [{ menu_item_id: '4', name: 'Shashlik (Beef)', quantity: 3, modifiers: [], special_instructions: null }, { menu_item_id: '5', name: 'Non', quantity: 2, modifiers: [], special_instructions: null }],
      total: 85000
    },
    {
      id: 'sample-4', order_number: 'PLT-10244', status: 'preparing' as const, customer_name: 'Malika B.', 
      order_type: 'delivery' as const, created_at: new Date(now - 1000000).toISOString(), accepted_at: null, estimated_minutes: null, priority: 'normal' as const, delivery_address: 'Chilanzar 9, Tashkent', auto_reject_at: null,
      items: [{ menu_item_id: '6', name: 'Manti', quantity: 1, modifiers: [], special_instructions: null }],
      total: 45000
    },
    {
      id: 'sample-5', order_number: 'PLT-10245', status: 'ready' as const, customer_name: 'Rustam A.', 
      order_type: 'pickup' as const, created_at: new Date(now - 1500000).toISOString(), accepted_at: null, estimated_minutes: null, priority: 'normal' as const, delivery_address: null, auto_reject_at: null,
      items: [{ menu_item_id: '7', name: 'Lagman', quantity: 2, modifiers: [], special_instructions: null }],
      total: 90000
    },
    {
      id: 'sample-6', order_number: 'PLT-10246', status: 'ready' as const, customer_name: 'Aziz K.', 
      order_type: 'delivery' as const, created_at: new Date(now - 1800000).toISOString(), accepted_at: null, estimated_minutes: null, priority: 'normal' as const, delivery_address: 'Yakkasaray 12', auto_reject_at: null,
      items: [{ menu_item_id: '8', name: 'Choyxona Palov', quantity: 5, modifiers: [], special_instructions: null }],
      total: 250000
    },
    {
      id: 'sample-7', order_number: 'PLT-10247', status: 'dispatched' as const, customer_name: 'Nodira S.', 
      order_type: 'delivery' as const, created_at: new Date(now - 3000000).toISOString(), accepted_at: null, estimated_minutes: null, priority: 'normal' as const, delivery_address: 'Yunusabad 19', auto_reject_at: null,
      items: [{ menu_item_id: '3', name: 'Somsa', quantity: 10, modifiers: [], special_instructions: null }],
      total: 100000
    }
  ];
};

export default function KDSPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<KDSOrder[]>(createSampleOrders);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<KDSOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const restaurantId = user?.restaurant_id;

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial active orders
  const loadOrders = useCallback(async () => {
    if (!restaurantId) return;
    setIsLoading(true);
    try {
      const realOrders = await fetchActiveKDSOrders(restaurantId);
      if (realOrders.length > 0) {
        setOrders(realOrders);
      }
    } catch (err) {
      console.error('[KDS] Failed to load orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Status transition handler
  const handleAction = async (orderId: string, action: string) => {
    let nextStatus: OrderStatus = 'confirmed';
    switch (action) {
      case 'accept': nextStatus = 'preparing'; break;
      case 'reject': nextStatus = 'rejected'; break;
      case 'ready': nextStatus = 'ready'; break;
      case 'dispatch': nextStatus = 'dispatched'; break;
      case 'complete': nextStatus = 'completed'; break;
    }

    // Optimistic local state update
    setOrders((prev) =>
      prev
        .map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order))
        .filter((order) => nextStatus !== 'rejected' && nextStatus !== 'completed' || order.id !== orderId)
    );

    if (orderId.startsWith('sample-')) {
      toast.success(`Demo order moved to ${nextStatus}`);
      return;
    }

    // Perform database update with offline queue resilience
    const res = await updateOrderStatusWithOfflineSync(orderId, nextStatus);
    if (res.offline) {
      toast.info(`Action queued offline: will sync when connected`);
    } else {
      toast.success(`Order moved to ${nextStatus}`);
    }
  };

  // Real-time Supabase subscription
  useRealtimeOrders({
    restaurantId,
    enableAudioAlert: isSoundEnabled,
    onOrderInsert: (newOrderRaw) => {
      const newOrder = normalizeKDSOrder(newOrderRaw);
      setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);

      if (autoAccept && newOrder.status === 'confirmed') {
        handleAction(newOrder.id, 'accept');
      }
    },
    onOrderUpdate: (updatedRaw) => {
      const updated = normalizeKDSOrder(updatedRaw);
      setOrders((prev) => {
        // If moved to completed or rejected, remove from active KDS columns
        if (updated.status === 'completed' || updated.status === 'rejected' || updated.status === 'cancelled') {
          return prev.filter((o) => o.id !== updated.id);
        }
        return prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o));
      });
    },
  });

  // Reconnection flush
  useEffect(() => {
    const handleOnline = async () => {
      const syncedCount = await syncOfflineOrderQueue();
      if (syncedCount > 0) {
        toast.success(`Reconnected: synced ${syncedCount} queued updates!`);
        loadOrders();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [loadOrders]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Tashkent',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const columns = [
    { id: 'confirmed' as const, title: 'NEW', color: 'bg-amber-500' },
    { id: 'preparing' as const, title: 'PREPARING', color: 'bg-blue-500' },
    { id: 'ready' as const, title: 'READY', color: 'bg-emerald-500' },
    { id: 'dispatched' as const, title: 'DISPATCHED', color: 'bg-purple-500' },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#0D1117] text-white overflow-hidden">
      {/* KDS Header Toolbar */}
      <header className="h-16 border-b border-[rgba(255,255,255,0.06)] bg-[#161b22] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[#f98b25] p-2 rounded-lg text-white shadow-md shadow-orange-500/20">
            <ChefHat size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight font-[family-name:var(--font-display)]">
            Kitchen Display
          </h1>
          <div className="ml-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Live KDS</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={loadOrders}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors"
            title="Refresh orders"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin text-[#f98b25]' : ''} />
          </button>

          <div className="font-mono text-xl font-semibold text-gray-200 tracking-wider">
            {formattedTime}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="auto-accept"
              checked={autoAccept}
              onCheckedChange={setAutoAccept}
              className="data-[state=checked]:bg-emerald-500"
            />
            <Label htmlFor="auto-accept" className="text-sm text-gray-300">
              Auto-accept
            </Label>
          </div>

          <div className="h-6 w-px bg-[rgba(255,255,255,0.1)]" />

          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="text-gray-400 hover:text-white transition-colors"
            title={isSoundEnabled ? 'Sound alerts enabled' : 'Sound alerts muted'}
          >
            {isSoundEnabled ? <Volume2 size={20} className="text-[#f98b25]" /> : <VolumeX size={20} />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="text-gray-400 hover:text-white transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 overflow-hidden p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
          {columns.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.id);

            return (
              <div
                key={col.id}
                className="flex flex-col h-full bg-[#1c2333]/50 rounded-2xl border border-[rgba(255,255,255,0.04)] overflow-hidden"
              >
                <div className="p-4 border-b border-[rgba(255,255,255,0.04)] bg-[#1c2333]">
                  <div className={`w-12 h-1 rounded-full mb-3 ${col.color}`} />
                  <div className="flex justify-between items-center">
                    <h2 className="font-bold text-gray-200 tracking-wide text-sm">{col.title}</h2>
                    <div className="bg-[rgba(255,255,255,0.1)] text-white px-2.5 py-0.5 rounded-full text-xs font-semibold font-[family-name:var(--font-mono)]">
                      {colOrders.length}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <AnimatePresence mode="popLayout">
                    {colOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        column={col.id}
                        onAction={handleAction}
                        onPrint={(o) => setPrintingOrder(o)}
                      />
                    ))}
                  </AnimatePresence>

                  {colOrders.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 py-12">
                      <ChefHat size={40} className="mb-3" />
                      <p className="text-xs">No active orders</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <PrintReceiptDialog
        order={printingOrder}
        open={!!printingOrder}
        onOpenChange={(open) => !open && setPrintingOrder(null)}
      />
    </div>
  );
}

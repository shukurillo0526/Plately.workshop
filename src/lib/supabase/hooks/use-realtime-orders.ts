// ═══════════════════════════════════════════════════════════════
// Plately Workshop — Supabase Realtime Order Subscription Hook
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useKDSStore } from '@/stores/kds-store';
import { playNewOrderChime } from '@/lib/audio/sound-effects';
import { toast } from 'sonner';

interface RealtimeOrdersOptions {
  restaurantId?: string;
  enableAudioAlert?: boolean;
  onOrderInsert?: (newOrder: Record<string, unknown>) => void;
  onOrderUpdate?: (updatedOrder: Record<string, unknown>) => void;
}

/**
 * Custom hook to subscribe to real-time order changes for a restaurant.
 * Listens to INSERT and UPDATE events on the `orders` table via Supabase Realtime WebSockets.
 */
export function useRealtimeOrders(options: RealtimeOrdersOptions = {}) {
  const { restaurantId, enableAudioAlert = true, onOrderInsert, onOrderUpdate } = options;
  const { setConnectionStatus } = useKDSStore();

  useEffect(() => {
    const supabase = createClient();
    const filter = restaurantId ? `restaurant_id=eq.${restaurantId}` : undefined;

    setConnectionStatus('reconnecting');

    const channel = supabase
      .channel('workshop-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter,
        },
        (payload) => {
          console.log('[Realtime] New order received:', payload.new);

          if (enableAudioAlert) {
            playNewOrderChime();
          }

          toast.success(`New Order Received! #${payload.new.order_number || payload.new.id}`, {
            description: `Type: ${payload.new.type} • Total: ${payload.new.total} UZS`,
            duration: 5000,
          });

          onOrderInsert?.(payload.new as Record<string, unknown>);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter,
        },
        (payload) => {
          console.log('[Realtime] Order status updated:', payload.new);
          onOrderUpdate?.(payload.new as Record<string, unknown>);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionStatus('disconnected');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, enableAudioAlert, onOrderInsert, onOrderUpdate, setConnectionStatus]);
}

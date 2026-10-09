// ═══════════════════════════════════════════════════════════════
// Plately Workshop — Supabase Realtime Order Subscription Hook
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
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

  const onInsertRef = useRef(onOrderInsert);
  const onUpdateRef = useRef(onOrderUpdate);
  const audioAlertRef = useRef(enableAudioAlert);

  useEffect(() => {
    onInsertRef.current = onOrderInsert;
    onUpdateRef.current = onOrderUpdate;
    audioAlertRef.current = enableAudioAlert;
  });

  useEffect(() => {
    if (!restaurantId) return;

    const supabase = createClient();
    const filter = `restaurant_id=eq.${restaurantId}`;
    const setStatus = useKDSStore.getState().setConnectionStatus;

    setStatus('reconnecting');

    const channel = supabase
      .channel(`workshop-orders-${restaurantId}`)
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

          if (audioAlertRef.current) {
            playNewOrderChime();
          }

          toast.success(`New Order Received! #${payload.new.order_number || payload.new.id}`, {
            description: `Type: ${payload.new.type} • Total: ${payload.new.total} UZS`,
            duration: 5000,
          });

          onInsertRef.current?.(payload.new as Record<string, unknown>);
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
          onUpdateRef.current?.(payload.new as Record<string, unknown>);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setStatus('disconnected');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);
}

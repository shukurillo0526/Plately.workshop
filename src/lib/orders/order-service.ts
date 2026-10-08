import { createClient } from '@/lib/supabase/client';
import { queueAction, flushQueue } from '@/lib/offline/action-queue';
import type { KDSOrder, KDSOrderItem } from '@/stores/kds-store';
import type { OrderStatus } from '@/lib/orders/state-machine';

/**
 * Normalizes raw order row from Supabase into KDSOrder format
 */
export function normalizeKDSOrder(row: any): KDSOrder {
  let items: KDSOrderItem[] = [];

  // Parse items from jsonb column or joined order_items
  if (Array.isArray(row.items) && row.items.length > 0) {
    items = row.items.map((item: any) => ({
      menu_item_id: item.id || item.menu_item_id || '',
      name: item.name || 'Dish',
      quantity: Number(item.quantity) || 1,
      modifiers: Array.isArray(item.modifiers) ? item.modifiers : [],
      special_instructions: item.special_instructions || null,
    }));
  } else if (Array.isArray(row.order_items) && row.order_items.length > 0) {
    items = row.order_items.map((oi: any) => ({
      menu_item_id: oi.menu_item_id || oi.id,
      name: oi.name || (oi.menu_items?.name) || 'Dish',
      quantity: Number(oi.quantity) || 1,
      modifiers: [],
      special_instructions: oi.special_instructions || null,
    }));
  }

  return {
    id: String(row.id),
    order_number: row.order_number || `ORD-${String(row.id).slice(0, 6).toUpperCase()}`,
    status: (row.status as OrderStatus) || 'confirmed',
    items,
    customer_name: row.customer_name || (row.profiles?.display_name) || 'Guest Customer',
    order_type: (row.type as 'delivery' | 'pickup' | 'dine_in') || 'dine_in',
    created_at: row.created_at || new Date().toISOString(),
    accepted_at: row.accepted_at || null,
    estimated_minutes: row.estimated_minutes || null,
    priority: row.priority || 'normal',
    delivery_address: row.delivery_address || null,
    auto_reject_at: row.auto_reject_at || null,
    total: Number(row.total) || 0,
    special_instructions: row.customer_note || null,
  };
}

/**
 * Fetch active orders for Kitchen Display System
 */
export async function fetchActiveKDSOrders(restaurantId: string): Promise<KDSOrder[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .in('status', ['confirmed', 'preparing', 'ready', 'dispatched'])
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[OrderService] fetchActiveKDSOrders error:', error.message);
      return [];
    }

    return (data || []).map(normalizeKDSOrder);
  } catch (err) {
    console.error('[OrderService] Unexpected fetchActiveKDSOrders error:', err);
    return [];
  }
}

/**
 * Update order status with automatic offline IndexedDB queueing
 */
export async function updateOrderStatusWithOfflineSync(
  orderId: string,
  nextStatus: OrderStatus
): Promise<{ success: boolean; offline: boolean; error?: string }> {
  // Check if navigator reports offline
  if (typeof window !== 'undefined' && !navigator.onLine) {
    await queueAction('update_order_status', { orderId, nextStatus });
    return { success: true, offline: true };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('orders')
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      console.warn('[OrderService] Direct status update failed, queueing offline:', error.message);
      await queueAction('update_order_status', { orderId, nextStatus });
      return { success: true, offline: true, error: error.message };
    }

    // If order was completed, trigger CRM sync in the background
    if (nextStatus === 'completed' || nextStatus === 'picked_up') {
      try {
        const { data: orderData } = await supabase
          .from('orders')
          .select('restaurant_id, customer_name, total')
          .eq('id', orderId)
          .single();

        if (orderData?.restaurant_id && orderData?.customer_name) {
          const { syncCustomerFromOrder } = await import('@/lib/customers/crm-service');
          syncCustomerFromOrder({
            restaurantId: orderData.restaurant_id,
            customerName: orderData.customer_name,
            orderTotal: Number(orderData.total) || 0,
          }).catch((err) => console.warn('[OrderService] CRM sync failed:', err));
        }
      } catch (crmErr) {
        console.warn('[OrderService] Background CRM sync trigger error:', crmErr);
      }
    }

    return { success: true, offline: false };
  } catch (err: any) {
    console.warn('[OrderService] Network exception, queueing offline:', err?.message);
    await queueAction('update_order_status', { orderId, nextStatus });
    return { success: true, offline: true, error: err?.message };
  }
}

/**
 * Flush pending offline updates
 */
export async function syncOfflineOrderQueue(): Promise<number> {
  const supabase = createClient();
  return flushQueue(async (action) => {
    if (action.action === 'update_order_status') {
      const { orderId, nextStatus } = action.payload as { orderId: string; nextStatus: OrderStatus };
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw error;
    }
  });
}

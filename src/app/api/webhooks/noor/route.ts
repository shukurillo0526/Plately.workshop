import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { NOOR_STATUS_MAP } from '@/lib/dispatch/types';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get('x-noor-signature') || req.headers.get('authorization');
    
    const secret = process.env.NOOR_WEBHOOK_SECRET;

    // Validate Signature if SECRET is configured
    if (secret) {
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature header' }, { status: 401 });
      }

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
      
      const sigToCompare = signature.replace(/^Bearer\s+/i, '');

      if (sigToCompare !== expectedSignature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.warn('[Noor Webhook] Warning: NOOR_WEBHOOK_SECRET not set. Processing in dev mode.');
    }

    const payload = JSON.parse(rawBody);
    const { delivery_id, status, driver_name, driver_phone, tracking_url, timestamp } = payload;

    if (!delivery_id || !status) {
      return NextResponse.json({ error: 'Missing delivery_id or status in payload' }, { status: 400 });
    }

    const mappedStatus = NOOR_STATUS_MAP[status] || status;
    const admin = createAdminClient();
    const idempotencyKey = `noor:${delivery_id}:${status}:${timestamp || Date.now()}`;

    // 1. Idempotency Check & Event Log
    try {
      const { error: eventError } = await admin.from('webhook_events').insert({
        provider: 'noor',
        idempotency_key: idempotencyKey,
        event_type: `delivery.${status}`,
        payload,
      });

      if (eventError && eventError.code === '23505') {
        // Unique constraint violation: duplicate webhook event
        return NextResponse.json(
          { success: true, message: 'Event already processed' },
          { status: 200 }
        );
      }
    } catch {
      // Continue even if logging fails
    }

    // 2. Lookup and update delivery record
    // Match either by UUID id or external_delivery_id
    const { data: delivery, error: lookupError } = await admin
      .from('deliveries')
      .select('id, order_id, status, restaurant_id')
      .or(`id.eq.${delivery_id},external_delivery_id.eq.${delivery_id}`)
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      console.warn('[Noor Webhook] Lookup warning:', lookupError.message);
    }

    const now = new Date().toISOString();

    if (delivery) {
      // Update delivery state
      await admin
        .from('deliveries')
        .update({
          status: mappedStatus,
          driver_name: driver_name || undefined,
          driver_phone: driver_phone || undefined,
          tracking_url: tracking_url || undefined,
          updated_at: now,
        })
        .eq('id', delivery.id);

      // 3. Synchronize parent Order status based on delivery milestone
      if (delivery.order_id) {
        if (mappedStatus === 'delivered') {
          await admin
            .from('orders')
            .update({
              status: 'completed',
              delivered_at: now,
              updated_at: now,
            })
            .eq('id', delivery.order_id);
        } else if (mappedStatus === 'picked_up') {
          await admin
            .from('orders')
            .update({
              status: 'delivering',
              dispatched_at: now,
              updated_at: now,
            })
            .eq('id', delivery.order_id);
        } else if (mappedStatus === 'failed') {
          await admin
            .from('orders')
            .update({
              status: 'failed_delivery',
              rejection_reason: 'Delivery failed by 3PL courier',
              updated_at: now,
            })
            .eq('id', delivery.order_id);
        }
      }
    }

    // Mark webhook event as processed
    try {
      await admin
        .from('webhook_events')
        .update({ processed_at: now })
        .eq('idempotency_key', idempotencyKey);
    } catch {
      // Non-critical
    }

    return NextResponse.json(
      { success: true, deliveryId: delivery_id, status: mappedStatus },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Noor Webhook] Error processing request:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { NOOR_STATUS_MAP } from '@/lib/dispatch/types';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get('x-noor-signature') || req.headers.get('authorization');
    
    const secret = process.env.NOOR_WEBHOOK_SECRET;

    // Validate Signature if SECRET is set
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
      console.warn('[Noor Webhook] Warning: NOOR_WEBHOOK_SECRET is not set. Allowing request in dev.');
    }

    const payload = JSON.parse(rawBody);
    const { delivery_id, status, driver_name, driver_phone, tracking_url, timestamp } = payload;

    if (!delivery_id || !status) {
      return NextResponse.json({ error: 'Missing delivery_id or status in payload' }, { status: 400 });
    }

    const mappedStatus = NOOR_STATUS_MAP[status];
    if (!mappedStatus) {
      console.warn(`[Noor Webhook] Unrecognized status received: ${status}`);
    }

    console.log(`[Noor Webhook] Processing event for ${delivery_id}: ${status} -> ${mappedStatus || 'unknown'}`);

    // Here we simulate the logging to webhook_events idempotency check.
    // In a real application, you would initialize Supabase and perform:
    // await supabase.from('webhook_events').insert({ ... })
    // and check for unique constraints for idempotency logic.

    return NextResponse.json(
      { success: true, status: mappedStatus || status },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Noor Webhook] Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

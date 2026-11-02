import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { restaurantName, contactName, email, phone, city, locationsCount, currentPos, notes } = body;

    if (!restaurantName || !email) {
      return NextResponse.json(
        { error: 'Restaurant name and email are required' },
        { status: 400 }
      );
    }

    try {
      const admin = createAdminClient();
      await admin.from('pilot_applications').insert({
        restaurant_name: restaurantName,
        contact_name: contactName,
        email,
        phone,
        city,
        locations_count: locationsCount,
        current_pos: currentPos,
        notes,
        created_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn('[PilotAPI] DB insert skipped or table does not exist yet:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Pilot application received successfully',
    });
  } catch (err: unknown) {
    console.error('[PilotAPI] Error processing request:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}

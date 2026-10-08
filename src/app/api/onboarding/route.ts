import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in first.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      cuisine = 'Uzbek',
      phone,
      address,
      description,
      primaryColor = '#f98b25',
      tagline,
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Restaurant name is required.' },
        { status: 400 }
      );
    }

    // Attempt RPC call first (defined in migration 006)
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'create_restaurant_onboarding',
      {
        p_name: name.trim(),
        p_cuisine: cuisine,
        p_phone: phone || null,
        p_address: address || null,
        p_description: description || null,
        p_primary_color: primaryColor,
        p_tagline: tagline || null,
      }
    );

    if (!rpcError && rpcData) {
      return NextResponse.json({
        success: true,
        restaurant_id: rpcData.restaurant_id,
        branch_id: rpcData.branch_id,
        slug: rpcData.slug,
        name: rpcData.name,
      });
    }

    // Fallback: Direct table operations if RPC function hasn't been executed yet
    console.warn('[Onboarding] RPC failed or not found, falling back to direct inserts:', rpcError?.message);

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(2, 8)}`;
    const website_config = {
      primary_color: primaryColor,
      tagline,
      cuisine,
    };

    // 1. Insert Restaurant
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .insert({
        name: name.trim(),
        slug,
        owner_id: user.id,
        cuisine_type: cuisine,
        phone: phone || null,
        address: address || null,
        description: description || null,
        website_config,
        timezone: 'Asia/Tashkent',
        currency: 'UZS',
        is_open: true,
        subscription_tier: 'free',
      })
      .select('id, name, slug')
      .single();

    if (restError || !restaurant) {
      throw new Error(restError?.message || 'Failed to create restaurant');
    }

    // 2. Insert Main Branch
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .insert({
        restaurant_id: restaurant.id,
        name: 'Main Branch',
        address: address || null,
        phone: phone || null,
        timezone: 'Asia/Tashkent',
        is_active: true,
        accepts_delivery: true,
        accepts_pickup: true,
        accepts_dine_in: true,
        default_prep_time_minutes: 15,
      })
      .select('id, name')
      .single();

    const branchId = branch?.id || null;
    if (branchError) {
      console.warn('[Onboarding] Branch insertion warning:', branchError.message);
    }

    // 3. Insert Staff record (role: 'owner')
    const { error: staffError } = await supabase.from('staff').insert({
      user_id: user.id,
      restaurant_id: restaurant.id,
      branch_id: branchId,
      role: 'owner',
      display_name: `${name.trim()} Owner`,
      is_active: true,
      accepted_at: new Date().toISOString(),
    });

    if (staffError) {
      console.warn('[Onboarding] Staff creation warning:', staffError.message);
    }

    return NextResponse.json({
      success: true,
      restaurant_id: restaurant.id,
      branch_id: branchId,
      slug: restaurant.slug,
      name: restaurant.name,
    });
  } catch (error: unknown) {
    console.error('[Onboarding] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

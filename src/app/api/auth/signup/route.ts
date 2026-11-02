import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      restaurantName,
      cuisine = 'Uzbek',
      phone,
      address,
    } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }
    if (!restaurantName || !restaurantName.trim()) {
      return NextResponse.json(
        { error: 'Restaurant name is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanRestaurantName = restaurantName.trim();
    const admin = createAdminClient();

    // 1. Check if user already exists
    const { data: userList } = await admin.auth.admin.listUsers();
    let existingUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    let userId: string;

    if (existingUser) {
      // If user exists and already has a confirmed account, prompt to sign in
      if (existingUser.email_confirmed_at && existingUser.app_metadata?.restaurant_id) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in.' },
          { status: 409 }
        );
      }

      // If user exists unconfirmed or without restaurant, repair and update
      userId = existingUser.id;
      await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });
    } else {
      // Create new auto-confirmed user
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          name: cleanRestaurantName + ' Owner',
          display_name: cleanRestaurantName + ' Owner',
          restaurant_name: cleanRestaurantName,
          role: 'owner',
        },
      });

      if (createError || !newUser?.user) {
        return NextResponse.json(
          { error: createError?.message || 'Failed to create user account.' },
          { status: 400 }
        );
      }
      userId = newUser.user.id;
    }

    // 2. Create Restaurant in database
    const slug = `${cleanRestaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(2, 8)}`;
    const website_config = {
      primary_color: '#f98b25',
      tagline: 'Authentic dining experience',
      cuisine: Array.isArray(cuisine) ? cuisine[0] : cuisine,
    };

    const { data: restaurant, error: restError } = await admin
      .from('restaurants')
      .insert({
        name: cleanRestaurantName,
        slug,
        owner_id: userId,
        cuisine_type: Array.isArray(cuisine) ? cuisine : [cuisine || 'Uzbek'],
        phone: phone || null,
        address: address || null,
        description: `Welcome to ${cleanRestaurantName}`,
        website_config,
        timezone: 'Asia/Tashkent',
        currency: 'UZS',
        is_open: true,
        subscription_tier: 'free',
      })
      .select('id, name, slug')
      .single();

    if (restError || !restaurant) {
      console.error('[Auth Signup] Restaurant creation error:', restError);
      return NextResponse.json(
        { error: restError?.message || 'Failed to initialize restaurant profile.' },
        { status: 500 }
      );
    }

    // 3. Create Main Branch
    const { data: branch, error: branchError } = await admin
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

    if (branchError) {
      console.warn('[Auth Signup] Branch creation warning:', branchError.message);
    }

    const branchId = branch?.id || null;

    // 4. Create Owner Staff Record
    const { error: staffError } = await admin.from('staff').upsert(
      {
        user_id: userId,
        restaurant_id: restaurant.id,
        branch_id: branchId,
        role: 'owner',
        display_name: `${cleanRestaurantName} Owner`,
        email: normalizedEmail,
        is_active: true,
        accepted_at: new Date().toISOString(),
      },
      { onConflict: 'user_id, restaurant_id' }
    );

    if (staffError) {
      console.warn('[Auth Signup] Staff creation warning:', staffError.message);
    }

    // 5. Update user JWT app_metadata and user_metadata
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: {
        restaurant_id: restaurant.id,
        branch_id: branchId,
        staff_role: 'owner',
        role: 'owner',
        restaurant_name: restaurant.name,
        restaurant_slug: restaurant.slug,
      },
      user_metadata: {
        restaurant_id: restaurant.id,
        branch_id: branchId,
        role: 'owner',
        restaurant_name: restaurant.name,
        restaurant_slug: restaurant.slug,
      },
    });

    // 6. Sign in on the server to immediately establish cookies on the response
    const cookieStore = await cookies();
    const response = NextResponse.json({
      success: true,
      redirect: '/',
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.name,
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) {
      console.warn('[Auth Signup] Server sign-in error:', signInError.message);
      // Fallback: client can sign in with password
      return NextResponse.json({
        success: true,
        requiresClientLogin: true,
        email: normalizedEmail,
      });
    }

    return response;
  } catch (err: unknown) {
    console.error('[Auth Signup] Unexpected error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

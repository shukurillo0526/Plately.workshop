import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cookieStore = await cookies();
    const response = NextResponse.json({ success: true, redirect: '/' });

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

    // 1. Attempt standard password login
    let { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    // 2. Resilience: If email is unconfirmed, auto-confirm using admin client and retry
    if (error && (error.message?.toLowerCase().includes('email not confirmed') || error.code === 'email_not_confirmed')) {
      try {
        const admin = createAdminClient();
        const { data: userList } = await admin.auth.admin.listUsers();
        const targetUser = userList?.users?.find(
          (u) => u.email?.toLowerCase() === normalizedEmail
        );

        if (targetUser) {
          await admin.auth.admin.updateUserById(targetUser.id, {
            email_confirm: true,
          });

          // Retry login after auto-confirming
          const retry = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });
          data = retry.data;
          error = retry.error;
        }
      } catch (adminErr) {
        console.warn('[Auth Login] Auto-confirm resilience warning:', adminErr);
      }
    }

    if (error || !data?.user) {
      return NextResponse.json(
        { error: error?.message || 'Invalid login credentials.' },
        { status: 401 }
      );
    }

    const user = data.user;
    const admin = createAdminClient();

    // 3. Self-Healing Claims: Ensure user has restaurant_id in app_metadata
    let restaurantId = user.app_metadata?.restaurant_id;
    let branchId = user.app_metadata?.branch_id;

    if (!restaurantId) {
      // Check if staff record exists
      const { data: staffData } = await admin
        .from('staff')
        .select('restaurant_id, branch_id, role, restaurants(id, name, slug)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (staffData?.restaurant_id) {
        restaurantId = staffData.restaurant_id;
        branchId = staffData.branch_id;
        const rest = staffData.restaurants as any;
        const rName = rest?.name || 'My Restaurant';
        const rSlug = rest?.slug || '';

        await admin.auth.admin.updateUserById(user.id, {
          app_metadata: {
            restaurant_id: restaurantId,
            branch_id: branchId,
            staff_role: staffData.role || 'owner',
            role: staffData.role || 'owner',
            restaurant_name: rName,
            restaurant_slug: rSlug,
          },
          user_metadata: {
            restaurant_id: restaurantId,
            branch_id: branchId,
            role: staffData.role || 'owner',
            restaurant_name: rName,
            restaurant_slug: rSlug,
          },
        });
      } else {
        // Create initial restaurant & branch for this user
        const rName = (user.user_metadata?.restaurant_name as string) || 'My Restaurant';
        const rSlug = `${rName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(2, 8)}`;

        const { data: newRest } = await admin
          .from('restaurants')
          .insert({
            name: rName,
            slug: rSlug,
            owner_id: user.id,
            cuisine_type: ['Uzbek'],
            timezone: 'Asia/Tashkent',
            currency: 'UZS',
            is_open: true,
            subscription_tier: 'free',
          })
          .select('id, name, slug')
          .single();

        if (newRest) {
          restaurantId = newRest.id;
          const { data: newBranch } = await admin
            .from('branches')
            .insert({
              restaurant_id: newRest.id,
              name: 'Main Branch',
              timezone: 'Asia/Tashkent',
              is_active: true,
              accepts_delivery: true,
              accepts_pickup: true,
              accepts_dine_in: true,
              default_prep_time_minutes: 15,
            })
            .select('id')
            .single();

          branchId = newBranch?.id || null;

          await admin.from('staff').insert({
            user_id: user.id,
            restaurant_id: newRest.id,
            branch_id: branchId,
            role: 'owner',
            display_name: user.user_metadata?.name || 'Owner',
            email: user.email,
            is_active: true,
          });

          await admin.auth.admin.updateUserById(user.id, {
            app_metadata: {
              restaurant_id: newRest.id,
              branch_id: branchId,
              staff_role: 'owner',
              role: 'owner',
              restaurant_name: newRest.name,
              restaurant_slug: newRest.slug,
            },
            user_metadata: {
              restaurant_id: newRest.id,
              branch_id: branchId,
              role: 'owner',
              restaurant_name: newRest.name,
              restaurant_slug: newRest.slug,
            },
          });
        }
      }

      // Refresh session to embed updated claims in JWT
      await supabase.auth.refreshSession();
    }

    return response;
  } catch (err: unknown) {
    console.error('[Auth Login] Unexpected error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

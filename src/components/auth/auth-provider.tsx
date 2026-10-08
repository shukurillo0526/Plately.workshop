'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore, type StaffRole } from '@/stores/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    const resolveUser = async (user: any) => {
      const meta = user.app_metadata ?? {};
      const userMeta = user.user_metadata ?? {};

      let restaurantId = meta.restaurant_id || userMeta.restaurant_id || '';
      let restaurantName = meta.restaurant_name || userMeta.restaurant_name || '';
      let restaurantSlug = meta.restaurant_slug || userMeta.restaurant_slug || '';
      let role = (meta.staff_role as StaffRole) || (userMeta.role as StaffRole) || 'owner';
      let branchId = meta.branch_id || userMeta.branch_id || null;

      // Fallback: Query staff & restaurants from database if missing from JWT claims
      if (!restaurantId) {
        try {
          const { data: staffData } = await supabase
            .from('staff')
            .select('restaurant_id, role, branch_id, restaurants(id, name, slug)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (staffData) {
            restaurantId = staffData.restaurant_id;
            role = (staffData.role as StaffRole) || 'owner';
            branchId = staffData.branch_id || null;
            const rest = staffData.restaurants as any;
            if (rest) {
              restaurantName = rest.name || 'My Restaurant';
              restaurantSlug = rest.slug || '';
            }
          }
        } catch (e) {
          console.warn('[AuthProvider] Database fallback error:', e);
        }
      }

      setUser({
        id: user.id,
        email: user.email ?? '',
        display_name: userMeta.display_name || userMeta.name || meta.display_name || user.email?.split('@')[0] || 'Staff',
        avatar_url: userMeta.avatar_url || null,
        restaurant_id: restaurantId,
        restaurant_name: restaurantName || 'My Restaurant',
        restaurant_slug: restaurantSlug,
        role: role,
        branch_id: branchId,
      });
    };

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        resolveUser(user);
      } else {
        setUser(null);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
          await resolveUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}

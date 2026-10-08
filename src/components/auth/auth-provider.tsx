'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore, type StaffRole } from '@/stores/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const meta = user.app_metadata ?? {};
        setUser({
          id: user.id,
          email: user.email ?? '',
          display_name: meta.display_name ?? user.email?.split('@')[0] ?? '',
          avatar_url: null,
          restaurant_id: meta.restaurant_id ?? '',
          restaurant_name: meta.restaurant_name ?? '',
          restaurant_slug: meta.restaurant_slug ?? '',
          role: (meta.staff_role as StaffRole) ?? 'viewer',
          branch_id: meta.branch_id ?? null,
        });
      } else {
        setUser(null);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const user = session.user;
          const meta = user.app_metadata ?? {};
          setUser({
            id: user.id,
            email: user.email ?? '',
            display_name: meta.display_name ?? user.email?.split('@')[0] ?? '',
            avatar_url: null,
            restaurant_id: meta.restaurant_id ?? '',
            restaurant_name: meta.restaurant_name ?? '',
            restaurant_slug: meta.restaurant_slug ?? '',
            role: (meta.staff_role as StaffRole) ?? 'viewer',
            branch_id: meta.branch_id ?? null,
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}

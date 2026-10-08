// ═══════════════════════════════════════════════════════════════
// Plately Workshop — Auth Store
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';

export type StaffRole = 'owner' | 'admin' | 'manager' | 'kitchen' | 'driver' | 'viewer';

/**
 * Role hierarchy — lower index = more privileged.
 */
const ROLE_HIERARCHY: StaffRole[] = [
  'owner',
  'admin',
  'manager',
  'kitchen',
  'driver',
  'viewer',
];

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_slug: string;
  role: StaffRole;
  branch_id: string | null;
}

interface AuthStore {
  user: AuthUser | null;
  isLoading: boolean;
  
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  
  /** Check if user has at least the given role level */
  hasRole: (minimumRole: StaffRole) => boolean;
  /** Check if user is authenticated */
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),

  hasRole: (minimumRole) => {
    const user = get().user;
    if (!user) return false;
    const userIndex = ROLE_HIERARCHY.indexOf(user.role);
    const requiredIndex = ROLE_HIERARCHY.indexOf(minimumRole);
    return userIndex <= requiredIndex; // Lower index = more privileged
  },

  isAuthenticated: () => get().user !== null,
}));

/**
 * Check if a role has sufficient privilege.
 * Can be used server-side without the store.
 */
export function hasMinimumRole(
  userRole: StaffRole,
  minimumRole: StaffRole
): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole);
  const requiredIndex = ROLE_HIERARCHY.indexOf(minimumRole);
  return userIndex >= 0 && requiredIndex >= 0 && userIndex <= requiredIndex;
}

/**
 * Route protection matrix — which routes require which minimum role.
 */
export const ROUTE_PERMISSIONS: Record<string, StaffRole> = {
  '/kds': 'kitchen',
  '/menu': 'manager',
  '/orders': 'kitchen',
  '/dispatch': 'manager',
  '/reservations': 'kitchen',
  '/customers': 'manager',
  '/marketing': 'manager',
  '/analytics': 'manager',
  '/settings': 'admin',
  '/settings/staff': 'admin',
  '/settings/fleet': 'owner',
  '/onboarding': 'admin',
};

import { describe, it, expect } from 'vitest';
import { hasMinimumRole, ROUTE_PERMISSIONS, type StaffRole } from '@/stores/auth-store';

describe('Auth RBAC & Role Hierarchy', () => {
  it('correctly evaluates owner hierarchy (highest privilege)', () => {
    expect(hasMinimumRole('owner', 'owner')).toBe(true);
    expect(hasMinimumRole('owner', 'admin')).toBe(true);
    expect(hasMinimumRole('owner', 'manager')).toBe(true);
    expect(hasMinimumRole('owner', 'kitchen')).toBe(true);
    expect(hasMinimumRole('owner', 'driver')).toBe(true);
    expect(hasMinimumRole('owner', 'viewer')).toBe(true);
  });

  it('correctly evaluates manager hierarchy', () => {
    expect(hasMinimumRole('manager', 'owner')).toBe(false);
    expect(hasMinimumRole('manager', 'admin')).toBe(false);
    expect(hasMinimumRole('manager', 'manager')).toBe(true);
    expect(hasMinimumRole('manager', 'kitchen')).toBe(true);
    expect(hasMinimumRole('manager', 'driver')).toBe(true);
    expect(hasMinimumRole('manager', 'viewer')).toBe(true);
  });

  it('correctly evaluates kitchen staff hierarchy', () => {
    expect(hasMinimumRole('kitchen', 'manager')).toBe(false);
    expect(hasMinimumRole('kitchen', 'kitchen')).toBe(true);
    expect(hasMinimumRole('kitchen', 'viewer')).toBe(true);
  });

  it('verifies route permission matrix configuration', () => {
    expect(ROUTE_PERMISSIONS['/kds']).toBe('kitchen');
    expect(ROUTE_PERMISSIONS['/orders']).toBe('kitchen');
    expect(ROUTE_PERMISSIONS['/menu']).toBe('manager');
    expect(ROUTE_PERMISSIONS['/analytics']).toBe('manager');
    expect(ROUTE_PERMISSIONS['/settings']).toBe('admin');
    expect(ROUTE_PERMISSIONS['/settings/fleet']).toBe('owner');
  });
});

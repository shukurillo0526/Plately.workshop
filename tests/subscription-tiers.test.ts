import { describe, it, expect } from 'vitest';
import { checkTierLimit, TIER_DEFINITIONS } from '@/lib/billing/tiers';

describe('Subscription Tiers & Gating (Phase 2)', () => {
  it('enforces menu item limits across tiers', () => {
    // Free: max 30 items
    expect(checkTierLimit('free', 'menu_items', 15).allowed).toBe(true);
    expect(checkTierLimit('free', 'menu_items', 30).allowed).toBe(false);
    expect(checkTierLimit('free', 'menu_items', 35).message).toContain('Menu item limit of 30');

    // Starter: unlimited
    expect(checkTierLimit('starter', 'menu_items', 250).allowed).toBe(true);
  });

  it('enforces monthly order limits across tiers', () => {
    // Free: max 100 orders
    expect(checkTierLimit('free', 'monthly_orders', 99).allowed).toBe(true);
    expect(checkTierLimit('free', 'monthly_orders', 100).allowed).toBe(false);

    // Starter: max 500 orders
    expect(checkTierLimit('starter', 'monthly_orders', 450).allowed).toBe(true);
    expect(checkTierLimit('starter', 'monthly_orders', 500).allowed).toBe(false);

    // Pro: unlimited
    expect(checkTierLimit('pro', 'monthly_orders', 5000).allowed).toBe(true);
  });

  it('enforces branch location limits', () => {
    // Free & Starter: 1 branch only
    expect(checkTierLimit('free', 'branches', 0).allowed).toBe(true);
    expect(checkTierLimit('free', 'branches', 1).allowed).toBe(false);
    expect(checkTierLimit('starter', 'branches', 1).allowed).toBe(false);

    // Pro: up to 3 branches
    expect(checkTierLimit('pro', 'branches', 2).allowed).toBe(true);
    expect(checkTierLimit('pro', 'branches', 3).allowed).toBe(false);

    // Enterprise: unlimited
    expect(checkTierLimit('enterprise', 'branches', 15).allowed).toBe(true);
  });

  it('gates courier dispatch and loyalty CRM by tier', () => {
    // Dispatch is disabled on Free, enabled on Starter+
    expect(checkTierLimit('free', 'dispatch').allowed).toBe(false);
    expect(checkTierLimit('starter', 'dispatch').allowed).toBe(true);
    expect(checkTierLimit('pro', 'dispatch').allowed).toBe(true);

    // Loyalty CRM is disabled on Free & Starter, enabled on Pro+
    expect(checkTierLimit('free', 'loyalty').allowed).toBe(false);
    expect(checkTierLimit('starter', 'loyalty').allowed).toBe(false);
    expect(checkTierLimit('pro', 'loyalty').allowed).toBe(true);
    expect(checkTierLimit('enterprise', 'loyalty').allowed).toBe(true);
  });

  it('verifies pricing definitions match commercial model', () => {
    expect(TIER_DEFINITIONS.free.monthlyFeeUZS).toBe(0);
    expect(TIER_DEFINITIONS.starter.monthlyFeeUZS).toBe(350000);
    expect(TIER_DEFINITIONS.pro.monthlyFeeUZS).toBe(950000);
    expect(TIER_DEFINITIONS.enterprise.monthlyFeeUZS).toBe(2500000);
  });
});

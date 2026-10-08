import { describe, it, expect } from 'vitest';
import { determineLoyaltyTier, calculatePointsEarned } from '@/lib/customers/crm-service';

describe('Customer CRM Automation (Phase 2)', () => {
  it('determines loyalty tier correctly based on spending threshold in UZS', () => {
    // New: < 500,000 UZS
    expect(determineLoyaltyTier(0)).toBe('New');
    expect(determineLoyaltyTier(250000)).toBe('New');
    expect(determineLoyaltyTier(499999)).toBe('New');

    // Silver: >= 500,000 UZS
    expect(determineLoyaltyTier(500000)).toBe('Silver');
    expect(determineLoyaltyTier(1200000)).toBe('Silver');

    // Gold: >= 1,500,000 UZS
    expect(determineLoyaltyTier(1500000)).toBe('Gold');
    expect(determineLoyaltyTier(2800000)).toBe('Gold');

    // VIP Platinum: >= 3,000,000 UZS
    expect(determineLoyaltyTier(3000000)).toBe('VIP Platinum');
    expect(determineLoyaltyTier(15000000)).toBe('VIP Platinum');
  });

  it('calculates loyalty points at standard 1 point per 1,000 UZS spent', () => {
    expect(calculatePointsEarned(0)).toBe(0);
    expect(calculatePointsEarned(-500)).toBe(0);
    expect(calculatePointsEarned(35000)).toBe(35);
    expect(calculatePointsEarned(124999)).toBe(124);
    expect(calculatePointsEarned(1500000)).toBe(1500);
  });
});

import { describe, it, expect } from 'vitest';
import {
  canTransition,
  validateTransition,
  getNextStatuses,
  ORDER_STATUSES,
  STATUS_CONFIG,
  type OrderStatus,
} from '@/lib/orders/state-machine';

describe('Order State Machine', () => {
  it('should include all 10 canonical statuses', () => {
    expect(ORDER_STATUSES).toHaveLength(10);
    expect(ORDER_STATUSES).toContain('confirmed');
    expect(ORDER_STATUSES).toContain('preparing');
    expect(ORDER_STATUSES).toContain('ready');
    expect(ORDER_STATUSES).toContain('dispatched');
    expect(ORDER_STATUSES).toContain('delivering');
    expect(ORDER_STATUSES).toContain('picked_up');
    expect(ORDER_STATUSES).toContain('completed');
    expect(ORDER_STATUSES).toContain('cancelled');
    expect(ORDER_STATUSES).toContain('rejected');
    expect(ORDER_STATUSES).toContain('failed_delivery');
  });

  it('should provide Uzbek translations for all statuses', () => {
    for (const status of ORDER_STATUSES) {
      const config = STATUS_CONFIG[status];
      expect(config).toBeDefined();
      expect(config.labelUz).toBeDefined();
      expect(config.labelUz.length).toBeGreaterThan(0);
    }
  });

  describe('canTransition', () => {
    it('allows confirmed -> preparing', () => {
      expect(canTransition('confirmed', 'preparing')).toBe(true);
    });

    it('allows confirmed -> rejected', () => {
      expect(canTransition('confirmed', 'rejected')).toBe(true);
    });

    it('allows preparing -> ready', () => {
      expect(canTransition('preparing', 'ready')).toBe(true);
    });

    it('allows ready -> dispatched', () => {
      expect(canTransition('ready', 'dispatched')).toBe(true);
    });

    it('allows ready -> picked_up', () => {
      expect(canTransition('ready', 'picked_up')).toBe(true);
    });

    it('allows delivering -> completed', () => {
      expect(canTransition('delivering', 'completed')).toBe(true);
    });

    it('allows delivering -> failed_delivery', () => {
      expect(canTransition('delivering', 'failed_delivery')).toBe(true);
    });

    it('allows failed_delivery -> dispatched (retry)', () => {
      expect(canTransition('failed_delivery', 'dispatched')).toBe(true);
    });

    it('forbids invalid transitions', () => {
      expect(canTransition('confirmed', 'completed')).toBe(false);
      expect(canTransition('completed', 'preparing')).toBe(false);
      expect(canTransition('rejected', 'confirmed')).toBe(false);
      expect(canTransition('cancelled', 'ready')).toBe(false);
    });
  });

  describe('validateTransition', () => {
    it('does not throw for allowed transitions', () => {
      expect(() => validateTransition('confirmed', 'preparing')).not.toThrow();
      expect(() => validateTransition('preparing', 'ready')).not.toThrow();
    });

    it('throws descriptive error for illegal moves', () => {
      expect(() => validateTransition('confirmed', 'completed')).toThrow(
        /Invalid order transition: "confirmed" → "completed"/
      );
    });
  });

  describe('getNextStatuses', () => {
    it('returns empty array for terminal statuses', () => {
      expect(getNextStatuses('completed')).toEqual([]);
      expect(getNextStatuses('rejected')).toEqual([]);
      expect(getNextStatuses('cancelled')).toEqual([]);
    });

    it('returns expected next targets from confirmed', () => {
      const targets = getNextStatuses('confirmed');
      expect(targets).toContain('preparing');
      expect(targets).toContain('rejected');
      expect(targets).toContain('cancelled');
    });
  });
});

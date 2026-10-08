import { describe, it, expect } from 'vitest';
import { getPOSAdapter, POS_ADAPTERS, type POSOrderSyncPayload } from '@/lib/pos';

describe('Third-Party POS Adapters (Phase 3+)', () => {
  const sampleOrder: POSOrderSyncPayload = {
    orderId: 'ORD-9872',
    restaurantId: 'rest-001',
    items: [
      { name: 'Tashkent Choyxona Palov', price: 45000, quantity: 2 },
      { name: 'Ayran 500ml', price: 12000, quantity: 2 },
    ],
    totalUZS: 114000,
    customerName: 'Shukurillo',
    customerPhone: '+998 90 123 45 67',
  };

  it('provides adapters for iiko, R-Keeper, Poster POS, and Direct POS', () => {
    expect(POS_ADAPTERS.iiko).toBeDefined();
    expect(POS_ADAPTERS.rkeeper).toBeDefined();
    expect(POS_ADAPTERS.poster).toBeDefined();
    expect(POS_ADAPTERS.direct).toBeDefined();
  });

  describe('iikoAdapter', () => {
    it('syncs order successfully when API key is provided', async () => {
      const adapter = getPOSAdapter('iiko');
      const result = await adapter.syncOrder(
        { provider: 'iiko', apiKey: 'iiko_live_key_99182', syncInventory: true, autoSendOrders: true, isActive: true },
        sampleOrder
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe('iiko');
      expect(result.externalOrderId).toContain('IIKO');
    });

    it('rejects order sync when API key is missing', async () => {
      const adapter = getPOSAdapter('iiko');
      const result = await adapter.syncOrder(
        { provider: 'iiko', apiKey: '', syncInventory: true, autoSendOrders: true, isActive: true },
        sampleOrder
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('API Key');
    });
  });

  describe('posterAdapter', () => {
    it('syncs order with Poster POS and fetches inventory items', async () => {
      const adapter = getPOSAdapter('poster');
      const result = await adapter.syncOrder(
        { provider: 'poster', apiKey: 'poster_token_abc', syncInventory: true, autoSendOrders: true, isActive: true },
        sampleOrder
      );

      expect(result.success).toBe(true);
      expect(result.externalOrderId).toContain('POSTER');

      const items = await adapter.fetchInventory({ provider: 'poster', syncInventory: true, autoSendOrders: true, isActive: true });
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].name).toBeDefined();
    });
  });
});

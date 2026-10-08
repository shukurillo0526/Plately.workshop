import { describe, it, expect } from 'vitest';
import { DeliveryRegistry } from '@/lib/dispatch/registry';
import type { DispatchRequest } from '@/lib/dispatch/types';

describe('Delivery Fleet Provider & Registry (Phase 2)', () => {
  it('registers and retrieves default providers', () => {
    const noor = DeliveryRegistry.getProvider('noor');
    expect(noor).toBeDefined();
    expect(noor?.provider).toBe('noor');
    expect(noor?.isAvailable).toBe(true);

    const self = DeliveryRegistry.getProvider('self');
    expect(self).toBeDefined();
    expect(self?.provider).toBe('self');
  });

  it('lists all available fleet providers', () => {
    const list = DeliveryRegistry.getAvailableProviders();
    expect(list.length).toBeGreaterThanOrEqual(2);
    const names = list.map((p) => p.provider);
    expect(names).toContain('noor');
    expect(names).toContain('self');
  });

  it('calculates Noor quote with tiered Tashkent distance surcharge', async () => {
    const noor = DeliveryRegistry.getProvider('noor');
    expect(noor).toBeDefined();

    const quote = await noor!.getQuote({
      pickup: { lat: 41.311081, lng: 69.240562, address: 'Navoi St 1, Tashkent' },
      dropoff: { lat: 41.285514, lng: 69.204322, address: 'Chilonzor 9, Tashkent' },
    });

    expect(quote.provider).toBe('noor');
    expect(quote.fee).toBeGreaterThanOrEqual(8000);
    expect(quote.fee % 500).toBe(0); // Rounded to nearest 500 UZS
    expect(quote.eta_minutes).toBeGreaterThan(0);
  });

  it('calculates Self Delivery quote (in-house fee vs free over threshold)', async () => {
    const self = DeliveryRegistry.getProvider('self');
    expect(self).toBeDefined();

    // Under 150,000 UZS -> flat fee 10,000 UZS
    const quote1 = await self!.getQuote({
      pickup: { lat: 41.3, lng: 69.2, address: 'Restaurant Branch' },
      dropoff: { lat: 41.32, lng: 69.25, address: 'Customer Home' },
      orderValue: 80000,
    });
    expect(quote1.fee).toBe(10000);

    // Over 150,000 UZS -> free delivery (0 UZS)
    const quote2 = await self!.getQuote({
      pickup: { lat: 41.3, lng: 69.2, address: 'Restaurant Branch' },
      dropoff: { lat: 41.32, lng: 69.25, address: 'Customer Home' },
      orderValue: 220000,
    });
    expect(quote2.fee).toBe(0);
  });

  it('dispatches delivery request to provider', async () => {
    const noor = DeliveryRegistry.getProvider('noor');
    const request: DispatchRequest = {
      order_id: 'ORD-991',
      provider: 'noor',
      pickup: {
        address: 'Mirzo Ulugbek 20',
        location: { lat: 41.31, lng: 69.28 },
        phone: '+998901112233',
        instructions: 'Pickup at kitchen backdoor',
        ready_at: new Date().toISOString(),
      },
      dropoff: {
        address: 'Buyuk Ipak Yoli 45',
        location: { lat: 41.33, lng: 69.32 },
        phone: '+998909998877',
        customer_name: 'Alisher K.',
        instructions: 'Leave at reception',
      },
      order_value: 70000,
    };

    const result = await noor!.dispatch(request);

    expect(result.external_delivery_id).toMatch(/NOOR-/);
    expect(result.provider).toBe('noor');
    expect(result.tracking_url).toContain('track.noor.uz');
  });
});

import { describe, it, expect } from 'vitest';
import { calculateNoorFee, createNoorQuote } from '@/lib/dispatch/noor-service';
import { NOOR_PRICING } from '@/lib/dispatch/types';

describe('Noor 3PL Dispatch & Pricing Engine', () => {
  it('calculates base fee correctly for short distances (< 7 km)', () => {
    // 2 km: base 15000 + (2 * 2250 = 4500) = 19500 UZS
    const fee2km = calculateNoorFee(2);
    expect(fee2km).toBe(19500);

    // 4 km: base 15000 + (4 * 2250 = 9000) = 24000 UZS
    const fee4km = calculateNoorFee(4);
    expect(fee4km).toBe(24000);
  });

  it('applies 7-10 km surcharge (+2000 UZS)', () => {
    // 8 km: base 15000 + (8 * 2250 = 18000) + surcharge 2000 = 35000 UZS
    const fee8km = calculateNoorFee(8);
    expect(fee8km).toBe(35000);
  });

  it('applies > 10 km surcharge (+4000 UZS)', () => {
    // 12 km: base 15000 + (12 * 2250 = 27000) + surcharge 4000 = 46000 UZS
    const fee12km = calculateNoorFee(12);
    expect(fee12km).toBe(46000);
  });

  it('rounds fees to the nearest 500 UZS', () => {
    // 3.1 km: base 15000 + (3.1 * 2250 = 6975) = 21975 -> rounded to 22000 UZS
    const fee = calculateNoorFee(3.1);
    expect(fee % 500).toBe(0);
    expect(fee).toBe(22000);
  });

  it('generates a valid quote with Tashkent coordinates', () => {
    const quote = createNoorQuote({
      pickupLat: 41.2995,
      pickupLng: 69.2401,
      dropoffLat: 41.3111,
      dropoffLng: 69.2797,
    });

    expect(quote.provider).toBe('noor');
    expect(quote.fee).toBeGreaterThan(0);
    expect(quote.fee % 500).toBe(0);
    expect(quote.eta_minutes).toBeGreaterThanOrEqual(15);
    expect(quote.distance_meters).toBeGreaterThan(0);
    expect(new Date(quote.expires_at).getTime()).toBeGreaterThan(Date.now());
  });
});

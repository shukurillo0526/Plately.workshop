import { describe, it, expect } from 'vitest';
import type { ReservationStatus, ReservationItem } from '@/app/(dashboard)/reservations/page';

describe('Table Reservations Management (Phase 3)', () => {
  const validTransitions: Record<ReservationStatus, ReservationStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['seated', 'cancelled', 'no_show'],
    seated: ['completed'],
    completed: [],
    cancelled: [],
    no_show: [],
  };

  function canTransitionReservation(from: ReservationStatus, to: ReservationStatus): boolean {
    return validTransitions[from]?.includes(to) ?? false;
  }

  function validateReservationInput(data: {
    customerName: string;
    customerPhone: string;
    partySize: number;
    reservationTime: string;
  }): { valid: boolean; error?: string } {
    if (!data.customerName.trim()) {
      return { valid: false, error: 'Customer name is required' };
    }
    if (!data.customerPhone.trim() || !data.customerPhone.startsWith('+998')) {
      return { valid: false, error: 'Valid Uzbekistan phone number (+998...) required' };
    }
    if (data.partySize < 1 || data.partySize > 50) {
      return { valid: false, error: 'Party size must be between 1 and 50' };
    }
    const resDate = new Date(data.reservationTime);
    if (isNaN(resDate.getTime())) {
      return { valid: false, error: 'Invalid reservation timestamp' };
    }
    return { valid: true };
  }

  it('verifies standard reservation lifecycle progression', () => {
    expect(canTransitionReservation('pending', 'confirmed')).toBe(true);
    expect(canTransitionReservation('confirmed', 'seated')).toBe(true);
    expect(canTransitionReservation('seated', 'completed')).toBe(true);

    // Terminal states cannot transition further
    expect(canTransitionReservation('completed', 'seated')).toBe(false);
    expect(canTransitionReservation('cancelled', 'confirmed')).toBe(false);
  });

  it('allows cancellation from pending and confirmed states', () => {
    expect(canTransitionReservation('pending', 'cancelled')).toBe(true);
    expect(canTransitionReservation('confirmed', 'cancelled')).toBe(true);
    expect(canTransitionReservation('seated', 'cancelled')).toBe(false);
  });

  it('validates customer phone number with Uzbekistan country code', () => {
    const invalidPhone = validateReservationInput({
      customerName: 'Javohir',
      customerPhone: '901234567',
      partySize: 4,
      reservationTime: new Date().toISOString(),
    });
    expect(invalidPhone.valid).toBe(false);
    expect(invalidPhone.error).toContain('+998');

    const validBooking = validateReservationInput({
      customerName: 'Javohir',
      customerPhone: '+998 90 123 45 67',
      partySize: 4,
      reservationTime: new Date().toISOString(),
    });
    expect(validBooking.valid).toBe(true);
  });

  it('restricts party size to sensible limits', () => {
    const tooSmall = validateReservationInput({
      customerName: 'Rustam',
      customerPhone: '+998 99 888 77 66',
      partySize: 0,
      reservationTime: new Date().toISOString(),
    });
    expect(tooSmall.valid).toBe(false);

    const tooLarge = validateReservationInput({
      customerName: 'Rustam',
      customerPhone: '+998 99 888 77 66',
      partySize: 60,
      reservationTime: new Date().toISOString(),
    });
    expect(tooLarge.valid).toBe(false);
  });
});

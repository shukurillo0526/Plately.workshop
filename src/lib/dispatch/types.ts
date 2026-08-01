// ═══════════════════════════════════════════════════════════════
// Plately Workshop — Fleet Dispatch Types
// ═══════════════════════════════════════════════════════════════

/**
 * Supported fleet providers.
 * - 'noor': Primary provider for Uzbekistan (Noor Tech, Tashkent)
 * - 'self': Restaurant's own delivery staff
 * - 'doordash' / 'uber_direct': International providers (future)
 */
export type FleetProvider = 'noor' | 'self' | 'doordash' | 'uber_direct';

/**
 * Delivery statuses — maps to the `delivery_status` enum in PostgreSQL.
 */
export type DeliveryStatus =
  | 'created'
  | 'driver_assigned'
  | 'driver_at_pickup'
  | 'picked_up'
  | 'driver_at_dropoff'
  | 'delivered'
  | 'cancelled'
  | 'failed'
  | 'returned';

/**
 * Request to dispatch a delivery.
 */
export interface DispatchRequest {
  order_id: string;
  provider: FleetProvider;
  pickup: {
    address: string;
    location: { lat: number; lng: number };
    phone: string;
    instructions: string;
    /** ISO timestamp when food will be ready */
    ready_at: string;
  };
  dropoff: {
    address: string;
    location: { lat: number; lng: number };
    phone: string;
    customer_name: string;
    instructions: string;
  };
  /** Order total in UZS */
  order_value: number;
  /** Tip in UZS (optional) */
  tip?: number;
}

/**
 * Result from a successful dispatch.
 */
export interface DispatchResult {
  external_delivery_id: string;
  provider: FleetProvider;
  tracking_url: string | null;
  estimated_pickup_at: string | null;
  estimated_delivery_at: string | null;
  /** Delivery fee in UZS */
  fee: number;
}

/**
 * Quote from a fleet provider.
 */
export interface DeliveryQuote {
  provider: FleetProvider;
  /** Fee in UZS */
  fee: number;
  /** Estimated delivery time in minutes */
  eta_minutes: number;
  /** Distance in meters */
  distance_meters: number;
  /** ISO timestamp when this quote expires */
  expires_at: string;
}

/**
 * Noor-specific pricing reference (from commercial proposal).
 * Base: 15,000 UZS door-to-door
 * Per km: 2,250 UZS
 * 7-10 km surcharge: +2,000 UZS
 * Over 10 km surcharge: +4,000 UZS
 * Waiting: first 10 min free, then 500 UZS/min
 * Additional address: +5,000 UZS
 */
export const NOOR_PRICING = {
  base_fee: 15_000,         // UZS
  per_km: 2_250,            // UZS
  surcharge_7_10_km: 2_000, // UZS
  surcharge_over_10_km: 4_000, // UZS
  free_waiting_minutes: 10,
  waiting_per_minute: 500,  // UZS
  additional_address: 5_000, // UZS
} as const;

/**
 * Map Noor webhook statuses to internal delivery statuses.
 * This is a best-guess based on the operational flow described
 * in the Noor business documents. Will be finalized when Noor
 * provides their API documentation.
 */
export const NOOR_STATUS_MAP: Record<string, DeliveryStatus> = {
  'assigned': 'driver_assigned',
  'courier_assigned': 'driver_assigned',
  'at_pickup': 'driver_at_pickup',
  'arrived_at_sender': 'driver_at_pickup',
  'picked_up': 'picked_up',
  'in_transit': 'picked_up',
  'at_dropoff': 'driver_at_dropoff',
  'arrived_at_recipient': 'driver_at_dropoff',
  'delivered': 'delivered',
  'completed': 'delivered',
  'cancelled': 'cancelled',
  'failed': 'failed',
  'returned': 'returned',
};

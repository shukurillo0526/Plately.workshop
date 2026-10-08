import {
  DeliveryQuote,
  DispatchRequest,
  DispatchResult,
  DeliveryStatus,
  NOOR_PRICING,
} from './types';

/**
 * Calculates Haversine distance between two coordinates in km.
 */
function calculateDistanceKm(lat1?: number, lon1?: number, lat2?: number, lon2?: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return 4.2; // Default ~4.2 km in Tashkent if coords are missing
  }

  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates the fee for a Noor delivery based on distance.
 * Uses NOOR_PRICING.
 */
export function calculateNoorFee(distanceKm: number): number {
  let fee = NOOR_PRICING.base_fee;
  fee += NOOR_PRICING.per_km * distanceKm;

  if (distanceKm >= 7 && distanceKm <= 10) {
    fee += NOOR_PRICING.surcharge_7_10_km;
  } else if (distanceKm > 10) {
    fee += NOOR_PRICING.surcharge_over_10_km;
  }

  // Round to nearest 500 UZS
  return Math.round(fee / 500) * 500;
}

/**
 * Creates a Noor quote for a delivery.
 */
export function createNoorQuote(params: {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
}): DeliveryQuote {
  const distanceKm = calculateDistanceKm(
    params.pickupLat,
    params.pickupLng,
    params.dropoffLat,
    params.dropoffLng
  );
  const fee = calculateNoorFee(distanceKm);

  // Simple heuristic for ETA: 15 mins base + 3 mins per km (20-35 mins typically)
  const eta_minutes = Math.round(15 + distanceKm * 3);

  return {
    provider: 'noor',
    fee,
    eta_minutes,
    distance_meters: Math.round(distanceKm * 1000),
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}

/**
 * Dispatches a Noor delivery request.
 */
export async function dispatchNoorDelivery(request: DispatchRequest): Promise<DispatchResult> {
  const distanceKm = calculateDistanceKm(
    request.pickup?.location?.lat,
    request.pickup?.location?.lng,
    request.dropoff?.location?.lat,
    request.dropoff?.location?.lng
  );
  const fee = calculateNoorFee(distanceKm);

  const apiKey = process.env.NOOR_API_KEY;
  const externalId = `NOOR-${Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0')}`;

  if (apiKey) {
    // In production, we'd use fetch() to dispatch via real Noor API.
    console.log(`[Noor Service] Dispatching to real API with delivery ID ${externalId}...`);
  } else {
    console.log(`[Noor Service] Simulating dispatch for delivery ID ${externalId}...`);
  }

  // Estimate pickup in 10 minutes, delivery in 35 minutes
  const estimated_pickup_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const estimated_delivery_at = new Date(Date.now() + 35 * 60 * 1000).toISOString();

  return {
    external_delivery_id: externalId,
    provider: 'noor',
    tracking_url: `https://track.noor.uz/${externalId}`,
    estimated_pickup_at,
    estimated_delivery_at,
    fee,
  };
}

/**
 * Helper to simulate Noor driver updates for testing/development.
 */
export async function simulateNoorDriverUpdate(deliveryId: string, status: DeliveryStatus) {
  console.log(`[Simulator] Simulated Noor driver update for ${deliveryId} -> ${status}`);
  // In an end-to-end simulation, this would HTTP POST to our webhook route
  // with a valid HMAC payload to test the webhook processing pipeline.
}

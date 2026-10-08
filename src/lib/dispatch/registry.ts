import type { DeliveryFleetProvider, QuoteParams } from './provider-interface';
import type {
  FleetProvider,
  DeliveryStatus,
  DispatchRequest,
  DispatchResult,
  DeliveryQuote,
} from './types';
import {
  calculateNoorFee,
  createNoorQuote,
  dispatchNoorDelivery,
} from './noor-service';
import crypto from 'crypto';

/**
 * Noor Tech Fleet Provider (Tashkent 3PL)
 */
export class NoorDeliveryProvider implements DeliveryFleetProvider {
  readonly provider: FleetProvider = 'noor';
  readonly name = 'Noor Tech Fleet (Tashkent)';
  readonly isAvailable = true;

  async getQuote(params: QuoteParams): Promise<DeliveryQuote> {
    return createNoorQuote({
      pickupLat: params.pickup.lat,
      pickupLng: params.pickup.lng,
      dropoffLat: params.dropoff.lat,
      dropoffLng: params.dropoff.lng,
    });
  }

  async dispatch(request: DispatchRequest): Promise<DispatchResult> {
    return dispatchNoorDelivery(request);
  }

  async cancel(deliveryId: string): Promise<{ success: boolean; message?: string }> {
    console.log(`[Noor] Cancellation requested for ${deliveryId}`);
    return { success: true, message: 'Cancelled successfully' };
  }

  async getStatus(deliveryId: string): Promise<DeliveryStatus> {
    return 'driver_assigned';
  }

  verifyWebhook(payload: string, signature: string): boolean {
    const secret = process.env.NOOR_WEBHOOK_SECRET || 'whsec_demo_secret';
    try {
      const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }
}

/**
 * Self Delivery Provider (Restaurant in-house couriers)
 */
export class SelfDeliveryProvider implements DeliveryFleetProvider {
  readonly provider: FleetProvider = 'self';
  readonly name = 'Restaurant In-House Fleet';
  readonly isAvailable = true;

  async getQuote(params: QuoteParams): Promise<DeliveryQuote> {
    // In-house flat fee: 10,000 UZS or free above 150,000 UZS
    const isFree = (params.orderValue || 0) >= 150000;
    const fee = isFree ? 0 : 10000;

    return {
      provider: 'self',
      fee,
      eta_minutes: 30,
      distance_meters: 3500,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  async dispatch(request: DispatchRequest): Promise<DispatchResult> {
    const externalId = `SELF-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      external_delivery_id: externalId,
      provider: 'self',
      tracking_url: null,
      estimated_pickup_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      estimated_delivery_at: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      fee: 10000,
    };
  }

  async cancel(deliveryId: string): Promise<{ success: boolean; message?: string }> {
    return { success: true };
  }

  async getStatus(deliveryId: string): Promise<DeliveryStatus> {
    return 'driver_assigned';
  }

  verifyWebhook(): boolean {
    return true;
  }
}

const noorInstance = new NoorDeliveryProvider();
const selfInstance = new SelfDeliveryProvider();

export class DeliveryRegistry {
  private static providers: Map<FleetProvider, DeliveryFleetProvider> = new Map<FleetProvider, DeliveryFleetProvider>([
    ['noor', noorInstance as DeliveryFleetProvider],
    ['self', selfInstance as DeliveryFleetProvider],
  ]);

  static register(provider: DeliveryFleetProvider): void {
    this.providers.set(provider.provider, provider);
  }

  static getProvider(provider: FleetProvider): DeliveryFleetProvider | undefined {
    return this.providers.get(provider);
  }

  static getAvailableProviders(): DeliveryFleetProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.isAvailable);
  }
}

export function getFleetProvider(provider: FleetProvider): DeliveryFleetProvider {
  return DeliveryRegistry.getProvider(provider) || noorInstance;
}


import type {
  FleetProvider,
  DeliveryStatus,
  DispatchRequest,
  DispatchResult,
  DeliveryQuote,
} from './types';

export interface QuoteParams {
  pickup: { lat: number; lng: number; address?: string };
  dropoff: { lat: number; lng: number; address?: string };
  orderValue?: number;
}

/**
 * Standard fleet provider interface across all 3PL carriers (Noor, Self, DoorDash, Uber Direct)
 * Guarantees vendor neutrality and straightforward pluggability.
 */
export interface DeliveryFleetProvider {
  readonly provider: FleetProvider;
  readonly name: string;
  readonly isAvailable: boolean;

  getQuote(params: QuoteParams): Promise<DeliveryQuote>;
  dispatch(request: DispatchRequest): Promise<DispatchResult>;
  cancel(deliveryId: string): Promise<{ success: boolean; message?: string }>;
  getStatus(deliveryId: string): Promise<DeliveryStatus>;
  verifyWebhook(payload: string, signature: string): boolean;
}

export type POSType = 'iiko' | 'rkeeper' | 'poster' | 'direct';

export interface POSConnectionConfig {
  provider: POSType;
  apiKey?: string;
  serverUrl?: string;
  terminalGroupId?: string;
  syncInventory: boolean;
  autoSendOrders: boolean;
  isActive: boolean;
}

export interface POSOrderSyncPayload {
  orderId: string;
  restaurantId: string;
  items: Array<{
    posItemId?: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
  }>;
  totalUZS: number;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
}

export interface POSSyncResult {
  success: boolean;
  externalOrderId?: string;
  provider: POSType;
  syncedAt: string;
  error?: string;
}

export interface POSInventoryItem {
  posId: string;
  name: string;
  priceUZS: number;
  category: string;
  inStock: boolean;
  quantityOnHand?: number;
}

/**
 * Universal POS Adapter Interface for Central Asian restaurant tech stack
 * (iiko, R-Keeper, Poster POS).
 */
export interface POSAdapter {
  provider: POSType;
  syncOrder(config: POSConnectionConfig, order: POSOrderSyncPayload): Promise<POSSyncResult>;
  fetchInventory(config: POSConnectionConfig): Promise<POSInventoryItem[]>;
  testConnection(config: POSConnectionConfig): Promise<{ healthy: boolean; latencyMs: number }>;
}

/**
 * iiko Cloud REST API Adapter (Widely adopted across Tashkent fine dining and chains)
 */
export const iikoAdapter: POSAdapter = {
  provider: 'iiko',
  async syncOrder(config, order) {
    if (!config.apiKey) {
      return {
        success: false,
        provider: 'iiko',
        syncedAt: new Date().toISOString(),
        error: 'Missing iiko Cloud API Key',
      };
    }
    // Simulation / Direct Cloud API call
    return {
      success: true,
      externalOrderId: `IIKO-${order.orderId.replace(/[^0-9]/g, '').slice(-6) || Math.floor(100000 + Math.random() * 900000)}`,
      provider: 'iiko',
      syncedAt: new Date().toISOString(),
    };
  },
  async fetchInventory() {
    return [
      { posId: 'iiko-01', name: 'Tashkent Choyxona Palov', priceUZS: 45000, category: 'Main', inStock: true },
      { posId: 'iiko-02', name: 'Lamb Shashlik', priceUZS: 28000, category: 'Grill', inStock: true },
    ];
  },
  async testConnection(config) {
    if (!config.apiKey) return { healthy: false, latencyMs: 0 };
    return { healthy: true, latencyMs: 65 };
  },
};

/**
 * R-Keeper XML/Cloud Adapter (Traditional enterprise restaurants & hospitality)
 */
export const rkeeperAdapter: POSAdapter = {
  provider: 'rkeeper',
  async syncOrder(config, order) {
    if (!config.apiKey) {
      return {
        success: false,
        provider: 'rkeeper',
        syncedAt: new Date().toISOString(),
        error: 'Missing R-Keeper credentials',
      };
    }
    return {
      success: true,
      externalOrderId: `RK-${Math.floor(100000 + Math.random() * 900000)}`,
      provider: 'rkeeper',
      syncedAt: new Date().toISOString(),
    };
  },
  async fetchInventory() {
    return [];
  },
  async testConnection(config) {
    return { healthy: Boolean(config.apiKey), latencyMs: 110 };
  },
};

/**
 * Poster POS REST Adapter (Modern independent cafés & bakeries in Tashkent)
 */
export const posterAdapter: POSAdapter = {
  provider: 'poster',
  async syncOrder(config, order) {
    if (!config.apiKey) {
      return {
        success: false,
        provider: 'poster',
        syncedAt: new Date().toISOString(),
        error: 'Missing Poster POS token',
      };
    }
    return {
      success: true,
      externalOrderId: `POSTER-${Math.floor(100000 + Math.random() * 900000)}`,
      provider: 'poster',
      syncedAt: new Date().toISOString(),
    };
  },
  async fetchInventory() {
    return [
      { posId: 'pst-10', name: 'Flat White', priceUZS: 26000, category: 'Coffee', inStock: true },
      { posId: 'pst-11', name: 'Almond Croissant', priceUZS: 22000, category: 'Bakery', inStock: true },
    ];
  },
  async testConnection(config) {
    return { healthy: Boolean(config.apiKey), latencyMs: 45 };
  },
};

export const POS_ADAPTERS: Record<POSType, POSAdapter> = {
  iiko: iikoAdapter,
  rkeeper: rkeeperAdapter,
  poster: posterAdapter,
  direct: {
    provider: 'direct',
    async syncOrder(_, order) {
      return { success: true, externalOrderId: order.orderId, provider: 'direct', syncedAt: new Date().toISOString() };
    },
    async fetchInventory() {
      return [];
    },
    async testConnection() {
      return { healthy: true, latencyMs: 5 };
    },
  },
};

export function getPOSAdapter(provider: POSType): POSAdapter {
  return POS_ADAPTERS[provider] || POS_ADAPTERS.direct;
}

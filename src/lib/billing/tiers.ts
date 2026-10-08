export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface TierLimits {
  name: string;
  monthlyFeeUZS: number;
  monthlyFeeUSD: number;
  maxMenuItems: number; // Infinity for unlimited
  maxMonthlyOrders: number; // Infinity for unlimited
  maxBranches: number;
  maxStaff: number;
  canDispatch: boolean;
  canUseLoyalty: boolean;
  analyticsRetentionDays: number;
  brandedStorefront: 'none' | 'plately_subdomain' | 'custom_domain';
  ocrScansPerMonth: number;
  apiAccess: boolean;
}

export const TIER_DEFINITIONS: Record<SubscriptionTier, TierLimits> = {
  free: {
    name: 'Free Starter',
    monthlyFeeUZS: 0,
    monthlyFeeUSD: 0,
    maxMenuItems: 30,
    maxMonthlyOrders: 100,
    maxBranches: 1,
    maxStaff: 2,
    canDispatch: false,
    canUseLoyalty: false,
    analyticsRetentionDays: 7,
    brandedStorefront: 'none',
    ocrScansPerMonth: 5,
    apiAccess: false,
  },
  starter: {
    name: 'Starter Kitchen',
    monthlyFeeUZS: 350000,
    monthlyFeeUSD: 29,
    maxMenuItems: Infinity,
    maxMonthlyOrders: 500,
    maxBranches: 1,
    maxStaff: 5,
    canDispatch: true,
    canUseLoyalty: false,
    analyticsRetentionDays: 30,
    brandedStorefront: 'plately_subdomain',
    ocrScansPerMonth: 50,
    apiAccess: false,
  },
  pro: {
    name: 'Growth Pro',
    monthlyFeeUZS: 950000,
    monthlyFeeUSD: 79,
    maxMenuItems: Infinity,
    maxMonthlyOrders: Infinity,
    maxBranches: 3,
    maxStaff: 15,
    canDispatch: true,
    canUseLoyalty: true,
    analyticsRetentionDays: 90,
    brandedStorefront: 'custom_domain',
    ocrScansPerMonth: Infinity,
    apiAccess: true,
  },
  enterprise: {
    name: 'Enterprise Fleet',
    monthlyFeeUZS: 2500000,
    monthlyFeeUSD: 199,
    maxMenuItems: Infinity,
    maxMonthlyOrders: Infinity,
    maxBranches: Infinity,
    maxStaff: Infinity,
    canDispatch: true,
    canUseLoyalty: true,
    analyticsRetentionDays: 365,
    brandedStorefront: 'custom_domain',
    ocrScansPerMonth: Infinity,
    apiAccess: true,
  },
};

export type TierFeature =
  | 'menu_items'
  | 'monthly_orders'
  | 'branches'
  | 'staff'
  | 'dispatch'
  | 'loyalty'
  | 'ocr_scans'
  | 'api_access'
  | 'custom_domain';

export interface TierCheckResult {
  allowed: boolean;
  limit: number | boolean;
  current: number | boolean;
  tier: SubscriptionTier;
  message?: string;
}

/**
 * Check whether a restaurant's current subscription tier permits an action or resource usage.
 */
export function checkTierLimit(
  tier: SubscriptionTier = 'free',
  feature: TierFeature,
  currentUsage: number = 0
): TierCheckResult {
  const config = TIER_DEFINITIONS[tier] || TIER_DEFINITIONS.free;

  switch (feature) {
    case 'menu_items': {
      const allowed = currentUsage < config.maxMenuItems;
      return {
        allowed,
        limit: config.maxMenuItems,
        current: currentUsage,
        tier,
        message: allowed
          ? undefined
          : `Menu item limit of ${config.maxMenuItems} reached on ${config.name} plan. Upgrade to Starter or Pro to add unlimited dishes.`,
      };
    }

    case 'monthly_orders': {
      const allowed = currentUsage < config.maxMonthlyOrders;
      return {
        allowed,
        limit: config.maxMonthlyOrders,
        current: currentUsage,
        tier,
        message: allowed
          ? undefined
          : `Monthly order limit of ${config.maxMonthlyOrders} reached on ${config.name} plan. Upgrade to accept more orders.`,
      };
    }

    case 'branches': {
      const allowed = currentUsage < config.maxBranches;
      return {
        allowed,
        limit: config.maxBranches,
        current: currentUsage,
        tier,
        message: allowed
          ? undefined
          : `Branch limit of ${config.maxBranches} reached. Pro plan supports up to 3 locations; Enterprise supports unlimited.`,
      };
    }

    case 'staff': {
      const allowed = currentUsage < config.maxStaff;
      return {
        allowed,
        limit: config.maxStaff,
        current: currentUsage,
        tier,
        message: allowed
          ? undefined
          : `Staff seat limit of ${config.maxStaff} reached on ${config.name} plan.`,
      };
    }

    case 'dispatch': {
      return {
        allowed: config.canDispatch,
        limit: config.canDispatch,
        current: config.canDispatch,
        tier,
        message: config.canDispatch
          ? undefined
          : `Courier & Noor dispatch is available starting on the Starter plan.`,
      };
    }

    case 'loyalty': {
      return {
        allowed: config.canUseLoyalty,
        limit: config.canUseLoyalty,
        current: config.canUseLoyalty,
        tier,
        message: config.canUseLoyalty
          ? undefined
          : `Automated CRM loyalty tiers & points accrual are unlocked on the Pro plan.`,
      };
    }

    case 'ocr_scans': {
      const allowed = currentUsage < config.ocrScansPerMonth;
      return {
        allowed,
        limit: config.ocrScansPerMonth,
        current: currentUsage,
        tier,
        message: allowed
          ? undefined
          : `Monthly AI menu OCR limit of ${config.ocrScansPerMonth} reached.`,
      };
    }

    case 'custom_domain': {
      const allowed = config.brandedStorefront === 'custom_domain';
      return {
        allowed,
        limit: allowed,
        current: allowed,
        tier,
        message: allowed
          ? undefined
          : `Custom domain mapping is available on Pro and Enterprise tiers.`,
      };
    }

    case 'api_access': {
      return {
        allowed: config.apiAccess,
        limit: config.apiAccess,
        current: config.apiAccess,
        tier,
        message: config.apiAccess
          ? undefined
          : `Public API & webhook access is available on Pro and Enterprise plans.`,
      };
    }

    default:
      return { allowed: true, limit: true, current: 0, tier };
  }
}

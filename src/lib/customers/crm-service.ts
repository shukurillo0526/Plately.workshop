import { createClient } from '@/lib/supabase/client';

export type LoyaltyTier = 'VIP Platinum' | 'Gold' | 'Silver' | 'New';

export interface CustomerSyncInput {
  restaurantId: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  orderTotal: number;
}

export interface CustomerSyncResult {
  customerId: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyTier: LoyaltyTier;
  pointsEarned: number;
  isNewCustomer: boolean;
}

/**
 * Determine loyalty tier based on cumulative spending in UZS
 */
export function determineLoyaltyTier(totalSpent: number): LoyaltyTier {
  if (totalSpent >= 3000000) return 'VIP Platinum';
  if (totalSpent >= 1500000) return 'Gold';
  if (totalSpent >= 500000) return 'Silver';
  return 'New';
}

/**
 * Accrual rate: 1 loyalty point per 1,000 UZS spent
 */
export function calculatePointsEarned(orderTotal: number): number {
  if (orderTotal <= 0) return 0;
  return Math.floor(orderTotal / 1000);
}

/**
 * Automatically creates or updates customer records and loyalty status upon order completion.
 */
export async function syncCustomerFromOrder(
  input: CustomerSyncInput
): Promise<CustomerSyncResult | null> {
  const { restaurantId, customerName, customerPhone, customerEmail, orderTotal } = input;
  if (!restaurantId || !customerName) return null;

  const pointsEarned = calculatePointsEarned(orderTotal);

  try {
    const supabase = createClient();

    // 1. Check if customer already exists for this restaurant by phone or email
    let query = supabase
      .from('merchant_customers')
      .select('*')
      .eq('restaurant_id', restaurantId);

    if (customerPhone && customerPhone.trim().length > 5) {
      query = query.eq('phone', customerPhone.trim());
    } else if (customerEmail && customerEmail.includes('@')) {
      query = query.eq('email', customerEmail.trim());
    } else {
      query = query.eq('name', customerName.trim());
    }

    const { data: existingRows, error: findError } = await query.limit(1);

    if (findError) {
      console.warn('[CRMService] Lookup error:', findError.message);
    }

    const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;

    if (existing) {
      const newTotalOrders = (existing.total_orders || 0) + 1;
      const newTotalSpent = (existing.total_spent || 0) + Math.max(0, orderTotal);
      const newTier = determineLoyaltyTier(newTotalSpent);

      const existingTags: string[] = Array.isArray(existing.tags) ? existing.tags : [];
      const updatedTags = Array.from(new Set([...existingTags, `Tier: ${newTier}`]));

      const { data: updated, error: updateError } = await supabase
        .from('merchant_customers')
        .update({
          total_orders: newTotalOrders,
          total_spent: newTotalSpent,
          tags: updatedTags,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.warn('[CRMService] Update customer failed:', updateError.message);
      }

      return {
        customerId: existing.id,
        totalOrders: newTotalOrders,
        totalSpent: newTotalSpent,
        loyaltyTier: newTier,
        pointsEarned,
        isNewCustomer: false,
      };
    } else {
      // Create new customer
      const initialSpent = Math.max(0, orderTotal);
      const initialTier = determineLoyaltyTier(initialSpent);

      const { data: created, error: insertError } = await supabase
        .from('merchant_customers')
        .insert({
          restaurant_id: restaurantId,
          name: customerName.trim(),
          phone: customerPhone?.trim() || null,
          email: customerEmail?.trim() || null,
          total_orders: 1,
          total_spent: initialSpent,
          tags: [`Tier: ${initialTier}`, 'Source: Direct Order'],
        })
        .select()
        .single();

      if (insertError) {
        console.warn('[CRMService] Insert customer failed:', insertError.message);
        return {
          customerId: 'mock-customer-id',
          totalOrders: 1,
          totalSpent: initialSpent,
          loyaltyTier: initialTier,
          pointsEarned,
          isNewCustomer: true,
        };
      }

      return {
        customerId: created.id,
        totalOrders: 1,
        totalSpent: initialSpent,
        loyaltyTier: initialTier,
        pointsEarned,
        isNewCustomer: true,
      };
    }
  } catch (err) {
    console.error('[CRMService] Unexpected error syncing customer:', err);
    return null;
  }
}

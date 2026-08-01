// ═══════════════════════════════════════════════════════════════
// Plately Workshop — Database Type Definitions
// ═══════════════════════════════════════════════════════════════
// These types mirror the Supabase schema from migrations 001-002.
// They will be auto-generated via `supabase gen types` once connected.

export type OrderType = 'pickup' | 'delivery' | 'dine_in';
export type OrderStatus =
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivering'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'dispatched'
  | 'failed_delivery';

export type OrderPriority = 'normal' | 'rush';

export type StaffRole = 'owner' | 'admin' | 'manager' | 'kitchen' | 'driver' | 'viewer';

export type DeliveryProvider = 'noor' | 'self' | 'doordash' | 'uber_direct';

export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'returned'
  | 'cancelled';

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise';

// ─── Restaurant ──────────────────────────────────────────
export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  slug: string | null;
  description: string | null;
  cuisine_type: string | null;
  price_range: string | null;
  rating: number | null;
  review_count: number;
  address: string | null;
  phone: string | null;
  image_url: string | null;
  logo_url_hi_res: string | null;
  is_open: boolean;
  timezone: string;
  currency: string;
  opening_hours: Record<string, unknown> | null;
  avg_prep_minutes: number | null;
  delivery_fee: number | null;
  delivery_radius_meters: number | null;
  has_delivery: boolean;
  has_reservation: boolean;
  has_dine_in: boolean;
  tags: string[];
  subscription_tier: SubscriptionTier;
  default_auto_accept: boolean;
  auto_reject_minutes: number;
  website_config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ─── Branch ──────────────────────────────────────────────
export interface Branch {
  id: string;
  restaurant_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  timezone: string;
  operating_hours: Record<string, unknown> | null;
  is_active: boolean;
  accepts_delivery: boolean;
  accepts_pickup: boolean;
  accepts_dine_in: boolean;
  default_prep_time_minutes: number;
  created_at: string;
  updated_at: string;
}

// ─── Staff ───────────────────────────────────────────────
export interface Staff {
  id: string;
  user_id: string;
  restaurant_id: string;
  branch_id: string | null;
  role: StaffRole;
  display_name: string;
  is_active: boolean;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
}

// ─── Menu Item ───────────────────────────────────────────
export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number; // UZS integer
  image_url: string | null;
  category: string;
  subcategory: string | null;
  is_available: boolean;
  is_featured: boolean;
  is_draft: boolean;
  calories: number | null;
  tags: string[];
  dietary_tags: string[];
  allergens: string[];
  sort_order: number;
  prep_time_minutes: number | null;
  ai_confidence: number | null;
  created_at: string;
  updated_at: string;
}

// ─── Modifier Group ──────────────────────────────────────
export interface ModifierGroup {
  id: string;
  menu_item_id: string;
  restaurant_id: string;
  name: string;
  selection_type: 'single' | 'multi';
  is_required: boolean;
  min_selections: number;
  max_selections: number | null;
  sort_order: number;
  created_at: string;
}

// ─── Modifier ────────────────────────────────────────────
export interface Modifier {
  id: string;
  group_id: string;
  restaurant_id: string;
  name: string;
  price_delta: number; // UZS integer
  is_default: boolean;
  is_available: boolean;
  sort_order: number;
  created_at: string;
}

// ─── Order ───────────────────────────────────────────────
export interface Order {
  id: string;
  order_number: string | null;
  user_id: string;
  restaurant_id: string;
  type: OrderType;
  status: OrderStatus;
  priority: OrderPriority;
  pickup_code: string | null;
  items: OrderItemJSON[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  estimated_minutes: number | null;
  delivery_address: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  driver_id: string | null;
  customer_note: string | null;
  cancel_reason: string | null;
  rejection_reason: string | null;
  created_at: string;
  confirmed_at: string | null;
  accepted_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  auto_reject_at: string | null;
}

// Legacy JSON items from consumer app
export interface OrderItemJSON {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

// ─── Order Item (normalized) ─────────────────────────────
export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  restaurant_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions: string | null;
  modifiers?: OrderItemModifier[];
}

// ─── Order Item Modifier ─────────────────────────────────
export interface OrderItemModifier {
  id: string;
  order_item_id: string;
  modifier_id: string | null;
  modifier_name: string;
  price_delta: number;
}

// ─── Delivery ────────────────────────────────────────────
export interface Delivery {
  id: string;
  order_id: string;
  restaurant_id: string;
  provider: DeliveryProvider;
  external_delivery_id: string | null;
  status: DeliveryStatus;
  tracking_url: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  estimated_pickup_at: string | null;
  estimated_delivery_at: string | null;
  actual_pickup_at: string | null;
  actual_delivery_at: string | null;
  fee: number;
  tip: number;
  distance_meters: number | null;
  created_at: string;
  updated_at: string;
}

// ─── Merchant Customer ───────────────────────────────────
export interface MerchantCustomer {
  id: string;
  restaurant_id: string;
  consumer_user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  total_orders: number;
  total_spent: number; // UZS
  first_order_at: string | null;
  last_order_at: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Analytics View ──────────────────────────────────────
export interface MerchantAnalytics {
  restaurant_id: string;
  revenue_30d: number;
  orders_30d: number;
  avg_order_value: number;
  avg_prep_time_minutes: number;
  unique_customers_30d: number;
}

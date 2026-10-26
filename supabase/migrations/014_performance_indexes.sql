-- 014_performance_indexes.sql
-- Performance optimization indexes for Plately high-throughput queries:
-- KDS, Orders dashboard, Menu browsing, Reservations, and Deliveries.

-- 1. Orders: Highly frequent filtering by restaurant, status, and recency
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status_created 
  ON orders (restaurant_id, status, created_at DESC);

-- Orders: Timeline and revenue aggregation by restaurant
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created_at 
  ON orders (restaurant_id, created_at DESC);

-- Orders: Consumer order history lookup
CREATE INDEX IF NOT EXISTS idx_orders_user_created_at 
  ON orders (user_id, created_at DESC);

-- 2. Menu Items: Grouping and sorting by restaurant and category
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_category_sort 
  ON menu_items (restaurant_id, category, sort_order);

-- Menu Items: Fast filtering of available items for consumer app
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_available 
  ON menu_items (restaurant_id, is_available) 
  WHERE is_available = true;

-- 3. Branches: Active status filtering for dispatch and location selection
CREATE INDEX IF NOT EXISTS idx_branches_restaurant_active 
  ON branches (restaurant_id, is_active);

-- 4. Reservations: Filtering by restaurant, reservation_time, and status
CREATE INDEX IF NOT EXISTS idx_reservations_restaurant_time_status 
  ON reservations (restaurant_id, reservation_time, status);

-- 5. Deliveries: Active dispatch queries by restaurant and status
CREATE INDEX IF NOT EXISTS idx_deliveries_restaurant_status_created 
  ON deliveries (restaurant_id, status, created_at DESC);

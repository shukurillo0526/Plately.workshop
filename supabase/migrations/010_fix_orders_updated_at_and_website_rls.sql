-- Migration 010: Fix Orders updated_at column & Restore Tenant-Scoped RLS for Website Configs
-- =========================================================================================

-- 1. Ensure updated_at column exists on orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Create trigger to keep orders.updated_at updated
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_orders_updated_at();

-- 3. Fix website config RLS: replace open 'USING (true)' with tenant isolation
DROP POLICY IF EXISTS "Allow authenticated staff to manage website configs" ON restaurant_website_configs;
DROP POLICY IF EXISTS "Public can view active website configs" ON restaurant_website_configs;

-- Public can view published configs
CREATE POLICY "Public can view published website configs"
ON restaurant_website_configs
FOR SELECT
USING (is_published = true);

-- Authenticated staff can view their own restaurant's config
CREATE POLICY "Staff can view own restaurant website config"
ON restaurant_website_configs
FOR SELECT
TO authenticated
USING (
  restaurant_id = (auth.jwt() -> 'app_metadata' ->> 'restaurant_id')::uuid
  OR EXISTS (
    SELECT 1 FROM staff
    WHERE staff.user_id = auth.uid()
      AND staff.restaurant_id = restaurant_website_configs.restaurant_id
      AND staff.is_active = true
  )
);

-- Authenticated staff (with manager/owner role) can modify their own config
CREATE POLICY "Staff can modify own restaurant website config"
ON restaurant_website_configs
FOR ALL
TO authenticated
USING (
  restaurant_id = (auth.jwt() -> 'app_metadata' ->> 'restaurant_id')::uuid
  OR EXISTS (
    SELECT 1 FROM staff
    WHERE staff.user_id = auth.uid()
      AND staff.restaurant_id = restaurant_website_configs.restaurant_id
      AND staff.is_active = true
      AND staff.role IN ('owner', 'admin', 'manager')
  )
)
WITH CHECK (
  restaurant_id = (auth.jwt() -> 'app_metadata' ->> 'restaurant_id')::uuid
  OR EXISTS (
    SELECT 1 FROM staff
    WHERE staff.user_id = auth.uid()
      AND staff.restaurant_id = restaurant_website_configs.restaurant_id
      AND staff.is_active = true
      AND staff.role IN ('owner', 'admin', 'manager')
  )
);

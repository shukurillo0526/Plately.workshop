-- Migration 012: Custom Domains & DNS Verification Registry
-- =========================================================================

-- 1. Extend restaurants table with custom domain columns
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS domain_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS domain_verification_token TEXT;

-- Generate verification token for existing restaurants lacking one
UPDATE restaurants
SET domain_verification_token = 'plately-verify-' || substr(md5(random()::text || id::text), 1, 16)
WHERE domain_verification_token IS NULL;

-- 2. Multi-domain registry table (supports secondary domains, staging hosts, etc.)
CREATE TABLE IF NOT EXISTS restaurant_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  domain_type TEXT NOT NULL DEFAULT 'custom' CHECK (domain_type IN ('subdomain', 'custom')),
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  verification_token TEXT NOT NULL DEFAULT ('plately-verify-' || substr(md5(random()::text), 1, 16)),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. High-performance lookup indexes for Edge Proxy hostname resolution (<5ms)
CREATE INDEX IF NOT EXISTS idx_restaurants_subdomain ON restaurants(subdomain);
CREATE INDEX IF NOT EXISTS idx_restaurants_custom_domain ON restaurants(custom_domain);
CREATE INDEX IF NOT EXISTS idx_restaurant_domains_domain ON restaurant_domains(domain);
CREATE INDEX IF NOT EXISTS idx_restaurant_domains_restaurant_id ON restaurant_domains(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_domains_status ON restaurant_domains(verification_status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE restaurant_domains ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view verified domains" ON restaurant_domains;
DROP POLICY IF EXISTS "Staff can view own restaurant domains" ON restaurant_domains;
DROP POLICY IF EXISTS "Staff can manage own restaurant domains" ON restaurant_domains;

-- Public can resolve verified domains
CREATE POLICY "Public can view verified domains"
ON restaurant_domains
FOR SELECT
USING (verification_status = 'verified');

-- Staff can view their own restaurant domains
CREATE POLICY "Staff can view own restaurant domains"
ON restaurant_domains
FOR SELECT
TO authenticated
USING (
  restaurant_id = (auth.jwt() -> 'app_metadata' ->> 'restaurant_id')::uuid
  OR EXISTS (
    SELECT 1 FROM staff
    WHERE staff.user_id = auth.uid()
      AND staff.restaurant_id = restaurant_domains.restaurant_id
      AND staff.is_active = true
  )
);

-- Staff (owner, admin, manager) can manage their restaurant domains
CREATE POLICY "Staff can manage own restaurant domains"
ON restaurant_domains
FOR ALL
TO authenticated
USING (
  restaurant_id = (auth.jwt() -> 'app_metadata' ->> 'restaurant_id')::uuid
  OR EXISTS (
    SELECT 1 FROM staff
    WHERE staff.user_id = auth.uid()
      AND staff.restaurant_id = restaurant_domains.restaurant_id
      AND staff.is_active = true
      AND staff.role IN ('owner', 'admin', 'manager')
  )
)
WITH CHECK (
  restaurant_id = (auth.jwt() -> 'app_metadata' ->> 'restaurant_id')::uuid
  OR EXISTS (
    SELECT 1 FROM staff
    WHERE staff.user_id = auth.uid()
      AND staff.restaurant_id = restaurant_domains.restaurant_id
      AND staff.is_active = true
      AND staff.role IN ('owner', 'admin', 'manager')
  )
);

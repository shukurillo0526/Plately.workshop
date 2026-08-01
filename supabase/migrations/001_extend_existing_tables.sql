-- 1. Extend restaurants table
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS logo_url_hi_res TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Tashkent',
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'UZS',
ADD COLUMN IF NOT EXISTS website_config JSONB,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free','starter','pro','enterprise')),
ADD COLUMN IF NOT EXISTS default_auto_accept BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_reject_minutes INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Generate slugs for existing restaurants
UPDATE restaurants SET slug = lower(regexp_replace(name, '\s+', '-', 'g')) || '-' || substr(id::text, 1, 8) WHERE slug IS NULL;

-- 2. Extend menu_items table
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS dietary_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS allergens TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prep_time_minutes INT,
ADD COLUMN IF NOT EXISTS ai_confidence REAL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Extend orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_number TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal','rush')),
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS preparing_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_reject_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Drop and recreate orders status check constraint
DO $$
DECLARE constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'orders'::regclass AND conname LIKE '%status%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE orders DROP CONSTRAINT ' || constraint_name;
    END IF;

    ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('confirmed','preparing','ready','picked_up','delivering','completed','cancelled','rejected','dispatched','failed_delivery'));
END $$;

-- Add order_number generation trigger
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'ORD-' || to_char(NOW(), 'YYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_order_number ON orders;
CREATE TRIGGER trg_generate_order_number
BEFORE INSERT ON orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL)
EXECUTE FUNCTION generate_order_number();

-- Add auto_reject_at index
CREATE INDEX IF NOT EXISTS idx_orders_auto_reject_at ON orders(auto_reject_at);

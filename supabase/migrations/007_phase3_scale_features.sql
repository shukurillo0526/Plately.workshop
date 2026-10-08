-- Migration 007: Phase 3 Scale Features (Reservations & Promotions)

-- 1. Table Reservations
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    party_size INT NOT NULL DEFAULT 2,
    reservation_time TIMESTAMPTZ NOT NULL,
    table_number TEXT,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')) DEFAULT 'pending',
    special_requests TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_restaurant_id ON reservations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_time ON reservations(reservation_time);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view reservations" ON reservations
FOR SELECT USING (
    restaurant_id = (SELECT public.restaurant_id())
);

CREATE POLICY "Staff can update reservations" ON reservations
FOR UPDATE USING (
    restaurant_id = (SELECT public.restaurant_id())
);

CREATE POLICY "Staff can insert reservations" ON reservations
FOR INSERT WITH CHECK (
    restaurant_id = (SELECT public.restaurant_id())
);

CREATE POLICY "Admins+ can delete reservations" ON reservations
FOR DELETE USING (
    restaurant_id = (SELECT public.restaurant_id()) AND
    (SELECT public.has_min_role('admin')) = true
);


-- 2. Promotions & Marketing Promo Codes
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) NOT NULL,
    discount_value NUMERIC NOT NULL,
    min_order_value NUMERIC DEFAULT 0,
    max_discount_value NUMERIC,
    starts_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    usage_limit INT,
    usage_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(restaurant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_promotions_restaurant_id ON promotions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view promotions" ON promotions
FOR SELECT USING (
    restaurant_id = (SELECT public.restaurant_id())
);

CREATE POLICY "Managers+ can manage promotions" ON promotions
FOR ALL USING (
    restaurant_id = (SELECT public.restaurant_id()) AND
    (SELECT public.has_min_role('manager')) = true
);

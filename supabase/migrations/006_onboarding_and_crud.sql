-- Migration 006: Onboarding RPC and Menu Management Policies

-- 1. Explicit RLS Policies for Onboarding
DROP POLICY IF EXISTS "Authenticated users can create restaurant" ON restaurants;
CREATE POLICY "Authenticated users can create restaurant" ON restaurants
FOR INSERT WITH CHECK (
    auth.uid() = owner_id
);

DROP POLICY IF EXISTS "Owners can insert initial branch" ON branches;
CREATE POLICY "Owners can insert initial branch" ON branches
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM restaurants 
        WHERE id = branches.restaurant_id AND owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Owners can insert staff" ON staff;
CREATE POLICY "Owners can insert staff" ON staff
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM restaurants 
        WHERE id = staff.restaurant_id AND owner_id = auth.uid()
    )
);

-- 2. Atomic Onboarding Function (SECURITY DEFINER)
-- Atomically creates restaurant, main branch, and owner staff record
CREATE OR REPLACE FUNCTION create_restaurant_onboarding(
    p_name TEXT,
    p_cuisine TEXT DEFAULT 'Uzbek',
    p_phone TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_primary_color TEXT DEFAULT '#f98b25',
    p_tagline TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_restaurant_id UUID;
    v_branch_id UUID;
    v_slug TEXT;
    v_website_config JSONB;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Generate a clean slug
    v_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6);

    -- Build initial website/branding config
    v_website_config := jsonb_build_object(
        'primary_color', p_primary_color,
        'tagline', p_tagline,
        'cuisine', p_cuisine
    );

    -- 1. Create restaurant
    INSERT INTO restaurants (
        name,
        slug,
        owner_id,
        cuisine_type,
        phone,
        address,
        description,
        website_config,
        timezone,
        currency,
        is_open,
        subscription_tier
    ) VALUES (
        p_name,
        v_slug,
        v_user_id,
        p_cuisine,
        p_phone,
        p_address,
        p_description,
        v_website_config,
        'Asia/Tashkent',
        'UZS',
        true,
        'free'
    )
    RETURNING id INTO v_restaurant_id;

    -- 2. Create main branch
    INSERT INTO branches (
        restaurant_id,
        name,
        address,
        phone,
        timezone,
        is_active,
        accepts_delivery,
        accepts_pickup,
        accepts_dine_in,
        default_prep_time_minutes
    ) VALUES (
        v_restaurant_id,
        'Main Branch',
        p_address,
        p_phone,
        'Asia/Tashkent',
        true,
        true,
        true,
        true,
        15
    )
    RETURNING id INTO v_branch_id;

    -- 3. Create owner staff record
    INSERT INTO staff (
        user_id,
        restaurant_id,
        branch_id,
        role,
        display_name,
        is_active,
        accepted_at
    ) VALUES (
        v_user_id,
        v_restaurant_id,
        v_branch_id,
        'owner'::staff_role,
        COALESCE(p_name || ' Owner', 'Owner'),
        true,
        NOW()
    );

    -- Return full result object
    RETURN jsonb_build_object(
        'restaurant_id', v_restaurant_id,
        'branch_id', v_branch_id,
        'slug', v_slug,
        'name', p_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

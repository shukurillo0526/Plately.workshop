-- Auth helper functions
CREATE OR REPLACE FUNCTION auth.restaurant_id() RETURNS UUID AS $$
    SELECT (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'restaurant_id')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.current_staff_role() RETURNS TEXT AS $$
    SELECT current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'staff_role';
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.has_min_role(min_role TEXT) RETURNS BOOLEAN AS $$
DECLARE
    current_role TEXT := auth.current_staff_role();
    role_weights JSONB := '{"owner": 5, "admin": 4, "manager": 3, "kitchen": 2, "driver": 1, "viewer": 0}';
BEGIN
    RETURN (role_weights->>current_role)::INT >= (role_weights->>min_role)::INT;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable RLS on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_fleet_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_website_configs ENABLE ROW LEVEL SECURITY;

-- 1. Policies for restaurants
CREATE POLICY "Owners can update their restaurant" ON restaurants
FOR UPDATE USING (
    id = (SELECT auth.restaurant_id()) AND 
    (SELECT auth.current_staff_role()) = 'owner'
);

-- 2. Policies for menu_items
CREATE POLICY "Managers+ can insert menu items" ON menu_items
FOR INSERT WITH CHECK (
    restaurant_id = (SELECT auth.restaurant_id()) AND 
    (SELECT auth.has_min_role('manager')) = true
);

CREATE POLICY "Managers+ can update menu items" ON menu_items
FOR UPDATE USING (
    restaurant_id = (SELECT auth.restaurant_id()) AND 
    (SELECT auth.has_min_role('manager')) = true
);

CREATE POLICY "Admins+ can delete menu items" ON menu_items
FOR DELETE USING (
    restaurant_id = (SELECT auth.restaurant_id()) AND 
    (SELECT auth.has_min_role('admin')) = true
);

-- 3. Policies for orders
CREATE POLICY "Staff can view their restaurant orders" ON orders
FOR SELECT USING (
    restaurant_id = (SELECT auth.restaurant_id())
);

CREATE POLICY "Staff can update their restaurant orders" ON orders
FOR UPDATE USING (
    restaurant_id = (SELECT auth.restaurant_id())
);

-- 4. Policies for branches, staff, modifiers, etc. (Match restaurant_id)
CREATE POLICY "Staff can view branches" ON branches FOR SELECT USING (restaurant_id = (SELECT auth.restaurant_id()));
CREATE POLICY "Managers+ can modify branches" ON branches FOR ALL USING (restaurant_id = (SELECT auth.restaurant_id()) AND (SELECT auth.has_min_role('manager')) = true);

CREATE POLICY "Staff can view staff" ON staff FOR SELECT USING (restaurant_id = (SELECT auth.restaurant_id()));
CREATE POLICY "Admins+ can modify staff" ON staff FOR ALL USING (restaurant_id = (SELECT auth.restaurant_id()) AND (SELECT auth.has_min_role('admin')) = true);

CREATE POLICY "Staff can view modifier groups" ON modifier_groups FOR SELECT USING (restaurant_id = (SELECT auth.restaurant_id()));
CREATE POLICY "Managers+ can modify modifier groups" ON modifier_groups FOR ALL USING (restaurant_id = (SELECT auth.restaurant_id()) AND (SELECT auth.has_min_role('manager')) = true);

CREATE POLICY "Staff can view modifiers" ON modifiers FOR SELECT USING (restaurant_id = (SELECT auth.restaurant_id()));
CREATE POLICY "Managers+ can modify modifiers" ON modifiers FOR ALL USING (restaurant_id = (SELECT auth.restaurant_id()) AND (SELECT auth.has_min_role('manager')) = true);

CREATE POLICY "Staff can view order items" ON order_items FOR SELECT USING (restaurant_id = (SELECT auth.restaurant_id()));
CREATE POLICY "Staff can modify order items" ON order_items FOR ALL USING (restaurant_id = (SELECT auth.restaurant_id()));

CREATE POLICY "Staff can view order item modifiers" ON order_item_modifiers FOR SELECT USING (
    EXISTS (SELECT 1 FROM order_items WHERE id = order_item_modifiers.order_item_id AND restaurant_id = (SELECT auth.restaurant_id()))
);
CREATE POLICY "Staff can modify order item modifiers" ON order_item_modifiers FOR ALL USING (
    EXISTS (SELECT 1 FROM order_items WHERE id = order_item_modifiers.order_item_id AND restaurant_id = (SELECT auth.restaurant_id()))
);

CREATE POLICY "Staff can view deliveries" ON deliveries FOR SELECT USING (restaurant_id = (SELECT auth.restaurant_id()));
CREATE POLICY "Staff can modify deliveries" ON deliveries FOR ALL USING (restaurant_id = (SELECT auth.restaurant_id()));

CREATE POLICY "Staff can view merchant customers" ON merchant_customers FOR SELECT USING (restaurant_id = (SELECT auth.restaurant_id()));
CREATE POLICY "Managers+ can modify merchant customers" ON merchant_customers FOR ALL USING (restaurant_id = (SELECT auth.restaurant_id()) AND (SELECT auth.has_min_role('manager')) = true);

CREATE POLICY "Staff can view loyalty programs" ON loyalty_programs FOR SELECT USING (restaurant_id = (SELECT auth.restaurant_id()));
CREATE POLICY "Managers+ can modify loyalty programs" ON loyalty_programs FOR ALL USING (restaurant_id = (SELECT auth.restaurant_id()) AND (SELECT auth.has_min_role('manager')) = true);

CREATE POLICY "Staff can view customer loyalty" ON customer_loyalty FOR SELECT USING (restaurant_id = (SELECT auth.restaurant_id()));
CREATE POLICY "Managers+ can modify customer loyalty" ON customer_loyalty FOR ALL USING (restaurant_id = (SELECT auth.restaurant_id()) AND (SELECT auth.has_min_role('manager')) = true);

CREATE POLICY "Admins+ can view fleet configs" ON restaurant_fleet_configs FOR SELECT USING (restaurant_id = (SELECT auth.restaurant_id()) AND (SELECT auth.has_min_role('admin')) = true);
CREATE POLICY "Owners can modify fleet configs" ON restaurant_fleet_configs FOR ALL USING (restaurant_id = (SELECT auth.restaurant_id()) AND (SELECT auth.has_min_role('owner')) = true);

CREATE POLICY "Staff can view website configs" ON restaurant_website_configs FOR SELECT USING (restaurant_id = (SELECT auth.restaurant_id()));
CREATE POLICY "Owners can modify website configs" ON restaurant_website_configs FOR ALL USING (restaurant_id = (SELECT auth.restaurant_id()) AND (SELECT auth.has_min_role('owner')) = true);

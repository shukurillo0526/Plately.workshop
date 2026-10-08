-- Migration 005: Missing policies and Order State Machine Trigger

-- 1. Missing SELECT Policies for Staff

-- Staff can view their own restaurant
DROP POLICY IF EXISTS "Staff can view their restaurant" ON restaurants;
CREATE POLICY "Staff can view their restaurant" ON restaurants
FOR SELECT USING (
    id = (SELECT auth.restaurant_id())
);

-- Staff can view menu items
DROP POLICY IF EXISTS "Staff can view menu items" ON menu_items;
CREATE POLICY "Staff can view menu items" ON menu_items
FOR SELECT USING (
    restaurant_id = (SELECT auth.restaurant_id())
);


-- 2. Consumer Order Policies

-- Consumers can create orders (authenticated users)
DROP POLICY IF EXISTS "Consumers can create orders" ON orders;
CREATE POLICY "Consumers can create orders" ON orders
FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

-- Consumers can view their own orders
-- Note: PostgreSQL combines multiple SELECT policies with OR, so this works 
-- alongside the existing "Staff can view their restaurant orders" policy.
DROP POLICY IF EXISTS "Consumers can view their orders" ON orders;
CREATE POLICY "Consumers can view their orders" ON orders
FOR SELECT USING (
    auth.uid() = user_id
);


-- 3. webhook_events Policies

-- Prevent any client-side access. Service role automatically bypasses RLS.
DROP POLICY IF EXISTS "No client access to webhooks" ON webhook_events;
CREATE POLICY "No client access to webhooks" ON webhook_events
FOR ALL USING (false);


-- 4. Server-side Order Status FSM Trigger

CREATE OR REPLACE FUNCTION validate_order_transition()
RETURNS TRIGGER AS $$
DECLARE
    -- Aligned with src/lib/orders/state-machine.ts ORDER_STATUSES and TRANSITIONS
    allowed_transitions JSONB := '{
        "confirmed": ["preparing", "rejected", "cancelled"],
        "preparing": ["ready", "cancelled"],
        "ready": ["dispatched", "picked_up", "cancelled"],
        "dispatched": ["delivering", "picked_up", "failed_delivery"],
        "delivering": ["completed", "failed_delivery"],
        "picked_up": ["completed"],
        "completed": [],
        "rejected": [],
        "cancelled": [],
        "failed_delivery": ["dispatched", "cancelled"]
    }';
    valid_targets JSONB;
BEGIN
    -- Skip if status hasn't changed
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    valid_targets := allowed_transitions->OLD.status;
    
    IF valid_targets IS NULL THEN
        RAISE EXCEPTION 'Unknown order status: %. Valid statuses: confirmed, preparing, ready, dispatched, delivering, picked_up, completed, rejected, cancelled, failed_delivery', OLD.status;
    END IF;
    
    IF NOT valid_targets ? NEW.status THEN
        RAISE EXCEPTION 'Invalid order transition: % → %. Allowed from %: %', OLD.status, NEW.status, OLD.status, valid_targets;
    END IF;
    
    -- Automatically set timestamp columns on transition
    CASE NEW.status
        WHEN 'preparing' THEN
            NEW.accepted_at := COALESCE(NEW.accepted_at, NOW());
            NEW.preparing_at := NOW();
        WHEN 'dispatched' THEN NEW.dispatched_at := NOW();
        WHEN 'completed' THEN NEW.delivered_at := NOW();
        ELSE NULL;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_order_transition ON orders;
CREATE TRIGGER trg_validate_order_transition
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION validate_order_transition();

-- Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. Auth Hook
GRANT SELECT ON staff TO supabase_auth_admin;

CREATE OR REPLACE FUNCTION custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    claims jsonb;
    user_id uuid;
    staff_record record;
BEGIN
    claims := event->'claims';
    user_id := (event->>'user_id')::uuid;

    SELECT restaurant_id, branch_id, role INTO staff_record FROM public.staff WHERE staff.user_id = user_id LIMIT 1;

    IF FOUND THEN
        claims := jsonb_set(claims, '{app_metadata, restaurant_id}', to_jsonb(staff_record.restaurant_id));
        claims := jsonb_set(claims, '{app_metadata, branch_id}', to_jsonb(staff_record.branch_id));
        claims := jsonb_set(claims, '{app_metadata, staff_role}', to_jsonb(staff_record.role::text));
    END IF;

    event := jsonb_set(event, '{claims}', claims);
    RETURN event;
END;
$$;

GRANT EXECUTE ON FUNCTION custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION custom_access_token_hook(jsonb) FROM authenticated, anon, public;

-- 2. Cron: Auto-reject stale orders
CREATE OR REPLACE FUNCTION auto_reject_stale_orders()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE orders
    SET status = 'rejected', rejection_reason = 'Auto-rejected: Not accepted in time', updated_at = now()
    WHERE status = 'confirmed' AND auto_reject_at <= now();
END;
$$;

SELECT cron.schedule('auto_reject_orders_cron', '* * * * *', 'SELECT auto_reject_stale_orders();');

-- 3. Cron: Clean up webhook events
CREATE OR REPLACE FUNCTION cleanup_webhook_events()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM webhook_events WHERE created_at < now() - INTERVAL '30 days';
END;
$$;

SELECT cron.schedule('cleanup_webhook_events_cron', '0 0 * * *', 'SELECT cleanup_webhook_events();');

-- 4. Materialized view and cron
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_merchant_analytics AS
SELECT 
    r.id AS restaurant_id,
    COALESCE(SUM(o.total), 0) AS revenue_30d,
    COUNT(o.id) AS orders_30d,
    CASE WHEN COUNT(o.id) > 0 THEN SUM(o.total) / COUNT(o.id) ELSE 0 END AS avg_order_value,
    AVG(EXTRACT(EPOCH FROM (o.completed_at - o.preparing_at))/60) AS avg_prep_time_minutes,
    COUNT(DISTINCT o.user_id) AS unique_customers_30d
FROM restaurants r
LEFT JOIN orders o ON r.id = o.restaurant_id AND o.created_at >= now() - INTERVAL '30 days' AND o.status = 'completed'
GROUP BY r.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_merchant_analytics_restaurant_id ON mv_merchant_analytics(restaurant_id);

CREATE OR REPLACE FUNCTION refresh_merchant_analytics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_merchant_analytics;
END;
$$;

SELECT cron.schedule('refresh_analytics_cron', '*/5 * * * *', 'SELECT refresh_merchant_analytics();');

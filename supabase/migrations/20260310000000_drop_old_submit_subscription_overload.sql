-- Drop the old 6-parameter overload of submit_subscription_request
-- that was created in 20260213140000_subscription_requests.sql.
-- The newer 7-parameter version (with p_keep_store_ids) from 
-- 20260214150000_subscription_downgrade_logic.sql is the correct one.
-- Having both causes "Could not choose the best candidate function" errors.

DROP FUNCTION IF EXISTS submit_subscription_request(UUID, UUID, TEXT, NUMERIC, TEXT, TEXT);

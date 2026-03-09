-- Drop the old 6-parameter overload of submit_subscription_request
-- that was created in 20260213140000_subscription_requests.sql.
-- The newer 7-parameter version (with p_keep_store_ids) from 
-- 20260214150000_subscription_downgrade_logic.sql is the correct one.
-- Having both causes "Could not choose the best candidate function" errors.

DROP FUNCTION IF EXISTS submit_subscription_request(UUID, UUID, TEXT, NUMERIC, TEXT, TEXT);

-- Also drop the old 1-parameter overload of approve_subscription_request
-- (created in 20260213140000). The newer 2-parameter version 
-- (with p_keep_store_ids) from 20260214150000 is the correct one.

DROP FUNCTION IF EXISTS approve_subscription_request(UUID);

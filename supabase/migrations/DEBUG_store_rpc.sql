-- Debug RPC call (Attempt 2)
BEGIN;
    -- Call the function with default params
    SELECT get_all_stores_paginated(1, 10, NULL, NULL);
ROLLBACK;

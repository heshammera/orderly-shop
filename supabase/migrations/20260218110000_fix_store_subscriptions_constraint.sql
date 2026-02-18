-- Fix for "there is no unique or exclusion constraint matching the ON CONFLICT specification"
-- This error happens when using INSERT ... ON CONFLICT (store_id) without a unique constraint on store_id.

-- 1. Safety Cleanup: Remove duplicate subscriptions for the same store if any exist.
-- We keep the most recently updated one.
WITH duplicates AS (
    SELECT id, store_id,
           ROW_NUMBER() OVER (PARTITION BY store_id ORDER BY updated_at DESC) as rnum
    FROM store_subscriptions
)
DELETE FROM store_subscriptions
WHERE id IN (
    SELECT id FROM duplicates WHERE rnum > 1
);

-- 2. Add Unique Constraint
ALTER TABLE store_subscriptions DROP CONSTRAINT IF EXISTS store_subscriptions_store_id_key;
ALTER TABLE store_subscriptions ADD CONSTRAINT store_subscriptions_store_id_key UNIQUE (store_id);

-- Enforce activation for authenticated PostgREST access, including direct RPC calls.
-- Anonymous storefront traffic and service-role/admin operations remain available.
ALTER ROLE authenticator SET pgrst.db_pre_request = 'public.enforce_merchant_verification';
NOTIFY pgrst, 'reload config';

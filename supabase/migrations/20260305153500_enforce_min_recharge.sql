-- Enforce a minimum recharge amount of $5 USD at the database level
ALTER TABLE public.wallet_recharge_requests 
ADD CONSTRAINT min_recharge_amount_usd 
CHECK (amount_usd >= 5.00);

-- Update comment
COMMENT ON CONSTRAINT min_recharge_amount_usd ON public.wallet_recharge_requests IS 'Recharge requests must be at least $5.00 USD';

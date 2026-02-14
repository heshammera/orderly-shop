-- Update stores table with wallet fields
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS commission_type TEXT NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('fixed', 'percentage')),
ADD COLUMN IF NOT EXISTS commission_value DECIMAL(10,2) NOT NULL DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS has_unlimited_balance BOOLEAN NOT NULL DEFAULT false;

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL, -- Positive for deposit, Negative for commission
    type TEXT NOT NULL CHECK (type IN ('deposit', 'commission', 'withdrawal', 'adjustment', 'recharge')),
    reference_id UUID, -- Optional link to Order ID or Recharge Request ID
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for wallet_transactions
CREATE POLICY "Store owners can view their transactions" 
    ON public.wallet_transactions FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.stores 
        WHERE stores.id = wallet_transactions.store_id 
        AND stores.owner_id = auth.uid()
    ));

CREATE POLICY "Admins can view all transactions" 
    ON public.wallet_transactions FOR SELECT 
    USING (public.has_role(auth.uid(), 'admin'));

-- Create wallet_recharge_requests table
CREATE TABLE IF NOT EXISTS public.wallet_recharge_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    amount_usd DECIMAL(10,2) NOT NULL,
    amount_local DECIMAL(12,2) NOT NULL,
    exchange_rate DECIMAL(10,4) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    proof_image TEXT, -- Path in storage
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for recharge requests
ALTER TABLE public.wallet_recharge_requests ENABLE ROW LEVEL SECURITY;

-- Policies for wallet_recharge_requests
CREATE POLICY "Store owners can view their requests" 
    ON public.wallet_recharge_requests FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.stores 
        WHERE stores.id = wallet_recharge_requests.store_id 
        AND stores.owner_id = auth.uid()
    ));

CREATE POLICY "Store owners can create requests" 
    ON public.wallet_recharge_requests FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.stores 
        WHERE stores.id = wallet_recharge_requests.store_id 
        AND stores.owner_id = auth.uid()
    ));

CREATE POLICY "Admins can view all requests" 
    ON public.wallet_recharge_requests FOR ALL 
    USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_wallet_recharge_requests_updated_at
    BEFORE UPDATE ON public.wallet_recharge_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create Storage Bucket for Recharge Proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('recharge-proofs', 'recharge-proofs', false) -- Private bucket, only authenticated access via RLS
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Store owners can upload proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recharge-proofs' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Store owners can view their own proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'recharge-proofs' AND
  auth.uid() = owner -- Supabase storage owner matches auth.uid
);

CREATE POLICY "Admins can view all proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'recharge-proofs' AND
  public.has_role(auth.uid(), 'admin')
);

-- Indexes
CREATE INDEX idx_wallet_transactions_store_id ON public.wallet_transactions(store_id);
CREATE INDEX idx_recharge_requests_store_id ON public.wallet_recharge_requests(store_id);
CREATE INDEX idx_recharge_requests_status ON public.wallet_recharge_requests(status);

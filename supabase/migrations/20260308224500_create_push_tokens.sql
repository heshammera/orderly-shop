-- Create push_tokens table for Expo Push Notifications
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage tokens (for the API route)
CREATE POLICY "Service role can manage all push tokens" 
ON public.push_tokens 
USING (true) 
WITH CHECK (true);

-- Allow public inserts for token registration (since customers/guests might register too in some scenarios, 
-- but here we primarily care about merchants for now)
CREATE POLICY "Anyone can insert push tokens" 
ON public.push_tokens FOR INSERT 
WITH CHECK (true);

-- Allow users to see their store tokens
CREATE POLICY "Store members can view their store tokens" 
ON public.push_tokens FOR SELECT 
USING (public.is_store_member(auth.uid(), store_id));

-- Add Index
CREATE INDEX IF NOT EXISTS idx_push_tokens_store_id ON public.push_tokens(store_id);

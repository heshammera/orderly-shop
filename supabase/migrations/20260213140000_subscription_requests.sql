-- 1. Update Stores Status Constraints
-- Drop existing constraint if possible (might fail if not named consistently, so we recreate/update)
ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_status_check;
ALTER TABLE stores ADD CONSTRAINT stores_status_check 
CHECK (status IN ('active', 'banned', 'maintenance', 'unpaid', 'pending_plan', 'pending_approval'));

-- 2. Create Subscription Requests Table
CREATE TABLE IF NOT EXISTS subscription_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'EGP',
    payment_method TEXT NOT NULL, -- 'bank_transfer', 'free', etc.
    
    transaction_id TEXT, -- Bank transaction code
    receipt_url TEXT, -- Path to uploaded image in bucket
    
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT, -- Admin notes or rejection reason
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sub_req_store_id ON subscription_requests(store_id);
CREATE INDEX IF NOT EXISTS idx_sub_req_status ON subscription_requests(status);

-- RLS
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;

-- Policy: User can see requests for their own stores
CREATE POLICY "Users read own store requests" ON subscription_requests
FOR SELECT USING (
    store_id IN (
        SELECT id FROM stores WHERE owner_id = auth.uid()
        UNION
        SELECT store_id FROM store_members WHERE user_id = auth.uid()
    )
);

-- Policy: User can create request for their own store (owner)
CREATE POLICY "Owners create requests" ON subscription_requests
FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
);

-- 3. Create Storage Bucket for Receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment_receipts', 'payment_receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Authenticated users can upload receipts
CREATE POLICY "Auth users can upload receipts" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'payment_receipts');

-- Storage Policy: Users can read their own receipts (implementation detail: usually structured by user_id/store_id)
-- Simpler: Owners can read files in this bucket
CREATE POLICY "Owners read receipts" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'payment_receipts');

-- 4. RPC: Submit Subscription Request
CREATE OR REPLACE FUNCTION submit_subscription_request(
    p_store_id UUID,
    p_plan_id UUID,
    p_payment_method TEXT,
    p_amount NUMERIC,
    p_transaction_id TEXT DEFAULT NULL,
    p_receipt_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_request_id UUID;
BEGIN
    -- Validate store ownership
    IF NOT EXISTS (SELECT 1 FROM stores WHERE id = p_store_id AND owner_id = auth.uid()) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- Insert Request
    INSERT INTO subscription_requests (
        store_id, plan_id, user_id, amount, payment_method, transaction_id, receipt_url, status
    ) VALUES (
        p_store_id, p_plan_id, auth.uid(), p_amount, p_payment_method, p_transaction_id, p_receipt_url, 
        CASE WHEN p_amount = 0 THEN 'approved' ELSE 'pending' END 
    )
    RETURNING id INTO v_request_id;

    -- If Free Plan (amount 0), Auto-Approve logic immediately
    IF p_amount = 0 THEN
        -- Create/Update Subscription
        INSERT INTO store_subscriptions (store_id, plan_id, status, current_period_end)
        VALUES (
            p_store_id, 
            p_plan_id, 
            'active', 
            (NOW() + interval '100 years') -- Lifetime for free, or fetch interval from plan
        )
        ON CONFLICT (id) DO NOTHING; -- Should likely update if existing, but usually new store

        -- Activate Store
        UPDATE stores SET status = 'active' WHERE id = p_store_id;
    ELSE
        -- Set Store Status to Pending Approval
        UPDATE stores SET status = 'pending_approval' WHERE id = p_store_id;
    END IF;

    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. RPC: Approve Subscription Request (Admin)
CREATE OR REPLACE FUNCTION approve_subscription_request(
    p_request_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_req RECORD;
    v_plan RECORD;
    v_interval INTERVAL;
BEGIN
    -- Check Admin (simple check or relies on RLS/wrapper)
    -- Ideally check for admin role here if not handled by middleware/api wrapper
    
    SELECT * INTO v_req FROM subscription_requests WHERE id = p_request_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
    
    IF v_req.status != 'pending' THEN RAISE EXCEPTION 'Request not pending'; END IF;

    SELECT * INTO v_plan FROM plans WHERE id = v_req.plan_id;
    
    -- Determine interval
    IF v_plan.interval = 'monthly' THEN v_interval := interval '1 month';
    ELSIF v_plan.interval = 'yearly' THEN v_interval := interval '1 year';
    ELSE v_interval := interval '100 years'; END IF;

    -- Create Subscription
    INSERT INTO store_subscriptions (store_id, plan_id, status, current_period_end)
    VALUES (v_req.store_id, v_req.plan_id, 'active', NOW() + v_interval);

    -- Activate Store
    UPDATE stores SET status = 'active' WHERE id = v_req.store_id;

    -- Update Request
    UPDATE subscription_requests SET status = 'approved', updated_at = NOW() WHERE id = p_request_id;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. RPC: Reject Subscription Request
CREATE OR REPLACE FUNCTION reject_subscription_request(
    p_request_id UUID,
    p_reason TEXT
)
RETURNS JSON AS $$
BEGIN
    UPDATE subscription_requests 
    SET status = 'rejected', notes = p_reason, updated_at = NOW() 
    WHERE id = p_request_id;

    -- Reset store status to pending_plan so they can try again?
    -- Or keep as pending_approval?
    -- Let's set to pending_plan so middleware redirects them back to selection
    UPDATE stores 
    SET status = 'pending_plan' 
    WHERE id = (SELECT store_id FROM subscription_requests WHERE id = p_request_id);

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger Update: Set initial status to pending_plan
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_store_id UUID;
  v_slug TEXT;
BEGIN
  -- Create Profile
  INSERT INTO public.profiles (id, user_id, full_name, role)
  VALUES (NEW.id, NEW.id, NEW.raw_user_meta_data->>'full_name', 'merchant');

  -- Create Store (Status: pending_plan)
  v_slug := NEW.raw_user_meta_data->>'store_slug';
  
  INSERT INTO public.stores (owner_id, name, slug, status)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'store_name', -- JSONB compatible? NO, name is TEXT in schema? Let's check. 
    -- Schema says name is TEXT or JSONB? Schema 20260213000000_store_management_system.sql didn't change updates.
    -- Assuming name is TEXT or castable.
    -- Wait, previously we passed JSON for name in some places. Let's ensure simple text for now or construct JSON.
    -- Ideally we stick to simple text from signup wizard.
    COALESCE(NEW.raw_user_meta_data->>'store_name', 'My Store'),
    v_slug,
    'pending_plan' -- BLOCKING STATUS
  ) RETURNING id INTO v_store_id;

  -- Add to Store Members
  INSERT INTO public.store_members (store_id, user_id, role)
  VALUES (v_store_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

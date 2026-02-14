-- Admin access to Subscription Requests
CREATE POLICY "Admins can manage subscription requests"
    ON public.subscription_requests FOR ALL
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Also ensure admins can read receipts in storage if policy relies on simple ownership
-- The 'Owners read receipts' policy is: bucket_id = 'payment_receipts' (no user check? Oh wait).
-- Let's check storage polices again.
-- If storage policy is just "USING (bucket_id = 'payment_receipts')", then ANY authenticated user can read ALL receipts?
-- Let's improve storage security too if needed, but primary issue is the table RLS.

-- The table policy is the blocker. "Admins can manage..."

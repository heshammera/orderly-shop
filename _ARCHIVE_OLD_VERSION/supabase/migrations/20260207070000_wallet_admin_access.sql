-- Allow admins to insert wallet transactions
CREATE POLICY "Admins can insert transactions" 
    ON public.wallet_transactions FOR INSERT 
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

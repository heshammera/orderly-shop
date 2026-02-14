-- Allow Admins to update stores (needed for commission settings, status, etc. via client)
CREATE POLICY "Admins can update all stores"
    ON public.stores FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

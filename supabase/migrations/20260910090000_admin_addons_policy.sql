BEGIN;
CREATE POLICY "Platform admins manage store add-ons"
ON public.store_add_ons FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
COMMIT;

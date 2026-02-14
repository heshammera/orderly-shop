-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage plans" ON public.plans;
DROP POLICY IF EXISTS "Admins can manage store_subscriptions" ON public.store_subscriptions;

-- Recreate policies with full access
CREATE POLICY "Admins can manage plans" ON public.plans FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage store_subscriptions" ON public.store_subscriptions FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

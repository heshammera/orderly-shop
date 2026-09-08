-- Compatibility with the current plan editor, pricing page, and plan RPCs.
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS name jsonb,
  ADD COLUMN IF NOT EXISTS description jsonb,
  ADD COLUMN IF NOT EXISTS price_monthly numeric(10,2),
  ADD COLUMN IF NOT EXISTS price_yearly numeric(10,2),
  ADD COLUMN IF NOT EXISTS limits jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS display_features jsonb NOT NULL DEFAULT '{"ar":[],"en":[]}';
UPDATE public.plans SET
  slug=coalesce(slug,lower(regexp_replace(name_en,'[^a-zA-Z0-9]+','-','g'))),
  name=coalesce(name,jsonb_build_object('ar',name_ar,'en',name_en)),
  description=coalesce(description,jsonb_build_object('ar',description_ar,'en',description_en)),
  price_monthly=coalesce(price_monthly,CASE WHEN interval='monthly' THEN price WHEN interval='yearly' THEN price/12 ELSE 0 END),
  price_yearly=coalesce(price_yearly,CASE WHEN interval='yearly' THEN price WHEN interval='monthly' THEN price*12 ELSE 0 END);
CREATE UNIQUE INDEX IF NOT EXISTS plans_slug_unique ON public.plans(slug);
ALTER TABLE public.plans ALTER COLUMN interval SET DEFAULT 'monthly';
NOTIFY pgrst,'reload schema';

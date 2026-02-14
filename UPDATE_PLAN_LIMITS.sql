
-- Update 'Basic' plan to have 0 orders limit instead of -1 (Unlimited)
UPDATE public.plans
SET limits = jsonb_set(limits, '{orders_monthly}', '0')
WHERE name->>'en' = 'Basic' OR name->>'ar' = 'بداية';

-- Verify the change
SELECT name, limits FROM public.plans WHERE name->>'en' = 'Basic' OR name->>'ar' = 'بداية';

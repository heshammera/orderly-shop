BEGIN;
CREATE TABLE IF NOT EXISTS public.marketing_events (
 id uuid PRIMARY KEY,
 session_id uuid NOT NULL,
 event_name text NOT NULL CHECK (event_name IN ('homepage_view','signup_click','demo_click','theme_preview','plan_select','signup_start')),
 device text NOT NULL CHECK(device IN ('mobile','desktop')),
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.marketing_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.marketing_events FROM anon,authenticated;
GRANT SELECT,INSERT,DELETE ON public.marketing_events TO service_role;
CREATE INDEX IF NOT EXISTS marketing_events_created_idx ON public.marketing_events(created_at);
CREATE OR REPLACE FUNCTION public.marketing_funnel_report(p_days integer DEFAULT 30)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 WITH cohort AS (SELECT id FROM auth.users WHERE created_at>=now()-make_interval(days=>LEAST(GREATEST(p_days,1),90))),
 events AS (SELECT event_name,count(*) AS total,count(DISTINCT session_id) AS sessions FROM public.marketing_events WHERE created_at>=now()-make_interval(days=>LEAST(GREATEST(p_days,1),90)) GROUP BY event_name)
 SELECT jsonb_build_object('days',LEAST(GREATEST(p_days,1),90),'events',COALESCE((SELECT jsonb_agg(to_jsonb(events)) FROM events),'[]'::jsonb),
 'accounts',(SELECT count(*) FROM cohort),
 'verified',(SELECT count(*) FROM cohort c WHERE public.merchant_is_verified(c.id)),
 'with_store',(SELECT count(*) FROM cohort c WHERE EXISTS(SELECT 1 FROM public.stores s WHERE s.owner_id=c.id)),
 'with_product',(SELECT count(*) FROM cohort c WHERE EXISTS(SELECT 1 FROM public.stores s JOIN public.products p ON p.store_id=s.id WHERE s.owner_id=c.id)),
 'with_order',(SELECT count(*) FROM cohort c WHERE EXISTS(SELECT 1 FROM public.stores s JOIN public.orders o ON o.store_id=s.id WHERE s.owner_id=c.id)));
$$;
REVOKE ALL ON FUNCTION public.marketing_funnel_report(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.marketing_funnel_report(integer) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;

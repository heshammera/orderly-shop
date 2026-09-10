CREATE OR REPLACE FUNCTION public.public_store_settings(s jsonb) RETURNS jsonb
LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT coalesce((SELECT jsonb_object_agg(key,value) FROM jsonb_each(coalesce(s,'{}'))
 WHERE key IN ('public_contact','shipping','checkout','about_us','privacy_policy','terms_of_service','seo','social_links','contact','theme','loyalty_earning_rate','loyalty_redemption_rate')), '{}')
 || jsonb_build_object('loyalty_program_enabled',false,
 'integrations',jsonb_build_object('facebook_pixels',s->'integrations'->'facebook_pixels','tiktok_pixels',s->'integrations'->'tiktok_pixels','snapchat_pixels',s->'integrations'->'snapchat_pixels','google_analytics_ids',s->'integrations'->'google_analytics_ids'));
$$;
CREATE OR REPLACE VIEW public.public_stores AS SELECT id,name,description,slug,logo_url,currency,status,
 has_removed_copyright,NULL::text AS contact_email,NULL::text AS contact_phone,timezone,
 public.public_store_settings(settings) AS settings FROM public.stores WHERE status='active';
NOTIFY pgrst,'reload schema';

-- Supabase installs pgcrypto in extensions; the upstream admin functions call
-- crypt(), gen_salt(), and gen_random_bytes() without schema qualification.
ALTER FUNCTION public.login_super_admin(text,text,text,text) SET search_path=public,extensions,pg_temp;
ALTER FUNCTION public.admin_change_password(uuid,text) SET search_path=public,extensions,pg_temp;
NOTIFY pgrst,'reload schema';

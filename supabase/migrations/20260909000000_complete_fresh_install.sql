-- Tables used by the support API. Access goes through the server, which checks
-- the merchant identity or guest session before using the service-role client.
CREATE TABLE public.support_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  session_id text,
  user_type text NOT NULL CHECK (user_type IN ('guest','merchant')),
  guest_name text,
  guest_email text,
  status text NOT NULL DEFAULT 'open',
  unread_admin_count integer NOT NULL DEFAULT 0,
  unread_user_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX support_merchant_store ON public.support_conversations(store_id) WHERE user_type='merchant';
CREATE UNIQUE INDEX support_guest_session ON public.support_conversations(session_id) WHERE user_type='guest';
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK(sender_type IN ('user','admin')),
  sender_id text,
  content text,
  image_url text,
  message_type text NOT NULL DEFAULT 'text',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX support_messages_conversation ON public.support_messages(conversation_id,created_at);
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Compatibility names used by older components, with the underlying RLS intact.
CREATE VIEW public.team_members WITH (security_invoker=true) AS SELECT * FROM public.store_members;
CREATE VIEW public.recharge_requests WITH (security_invoker=true) AS SELECT * FROM public.wallet_recharge_requests;
CREATE VIEW public.usage_records WITH (security_invoker=true) AS
SELECT store_id, 'products_count'::text AS metric, count(*)::bigint AS value FROM public.products GROUP BY store_id
UNION ALL
SELECT store_id, 'orders_count'::text, count(*)::bigint FROM public.orders WHERE created_at>=date_trunc('month',now()) GROUP BY store_id
UNION ALL
SELECT store_id, 'staff_count'::text, count(*)::bigint FROM public.store_members WHERE role<>'owner' GROUP BY store_id;

-- Upstream seeds a known administrator. Keep it disabled on every fresh deploy.
UPDATE public.super_admins SET is_active=false WHERE email='admin@social-commerce.com';
REVOKE ALL ON FUNCTION public.admin_change_password(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_password(uuid,text) TO service_role;

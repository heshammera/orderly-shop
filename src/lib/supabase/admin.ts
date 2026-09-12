import { createClient } from '@supabase/supabase-js';

export const createAdminClient = (options?: { noStore?: boolean }) => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            ...(options?.noStore ? { global: { fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, cache: 'no-store' }) } } : {}),
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
};

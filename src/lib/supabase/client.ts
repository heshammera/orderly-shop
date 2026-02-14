import { createBrowserClient } from '@supabase/ssr'

const createSupabaseClient = () => {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                // Custom lock handler that bypasses Navigator Locks API
                // This prevents AbortError in development with HMR
                lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
                    return await fn()
                }
            },
            cookieOptions: {
                // Strictly HostOnly cookies (no domain set)
                path: '/',
            }
        }
    )
}

export function createClient() {
    if (typeof window === 'undefined') {
        return createSupabaseClient()
    }

    // Singleton pattern attached to window to survive HMR in development
    if (!(window as any).__supabaseClient) {
        (window as any).__supabaseClient = createSupabaseClient()
    }

    return (window as any).__supabaseClient
}

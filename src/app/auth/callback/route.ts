import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin, protocol, host } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        request.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                    },
                    remove(name: string, options: CookieOptions) {
                        request.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                    },
                },
            }
        )
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.session) {
            // Get user's store to redirect to subdomain
            const { data: store } = await supabase
                .from('stores')
                .select('slug')
                .eq('owner_id', data.session.user.id)
                .single();

            if (store && store.slug) {
                // Determine root domain
                let rootDomain = host;
                if (host.includes('localhost') && host.includes(':')) {
                    rootDomain = `localhost:${host.split(':')[1]}`; // Keep port
                } else if (host.startsWith('www.')) {
                    rootDomain = host.replace('www.', '');
                }

                // Construct Tenant URL
                // e.g. http://my-store.localhost:3000/dashboard?verified=true
                const tenantUrl = `${protocol}//${store.slug}.${rootDomain}/dashboard?verified=true`;
                return NextResponse.redirect(tenantUrl);
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

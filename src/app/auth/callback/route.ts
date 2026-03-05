export const runtime = 'edge';

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const origin = siteUrl || request.headers.get('origin') || requestUrl.origin;

    // Parse protocol and host from siteUrl if available, else fallback to requestUrl
    let protocol = requestUrl.protocol;
    let host = requestUrl.host;
    if (siteUrl) {
        try {
            const parsedSiteUrl = new URL(siteUrl);
            protocol = parsedSiteUrl.protocol;
            host = parsedSiteUrl.host;
        } catch (e) {
            console.error('Invalid NEXT_PUBLIC_SITE_URL', e);
        }
    }

    const { searchParams } = requestUrl;
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
            // If this is an impersonation flow, respect the 'next' parameter directly
            if (searchParams.get('impersonate') === 'true' && next !== '/') {
                return NextResponse.redirect(`${origin}${next}`);
            }

            // Normal login flow: Get user's store to redirect to subdomain
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
                let tenantUrl = '';
                if (host.endsWith('.vercel.app')) {
                    tenantUrl = `${protocol}//${host}/s/${store.slug}/dashboard?verified=true`;
                } else {
                    tenantUrl = `${protocol}//${store.slug}.${rootDomain}/dashboard?verified=true`;
                }

                return NextResponse.redirect(tenantUrl);
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const host = request.headers.get('host') || '';

    // 1. EXTRACT CLEAN HOSTNAME (handle IPv6 and ports)
    // Examples: "localhost:3000" -> "localhost", "[::1]:3000" -> "::1"
    const hostname = host.replace(/:\d+$/, '').replace(/^\[(.+)\]$/, '$1').toLowerCase().trim();

    console.log(`[Middleware Entry] Host: ${JSON.stringify(host)}, Cleaned Hostname: ${JSON.stringify(hostname)}, Path: ${pathname}`);

    // 2. DEFINE MAIN DOMAIN
    const isMainDomain = hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.endsWith('.vercel.app'); // Treat Vercel deployments as main domain

    // 3. SECURE ADMIN ROUTES (BLOCK ON SUBDOMAINS)
    if (pathname.startsWith('/admin')) {
        console.log(`[Admin Check] Hostname: ${hostname}, IsMainDomain: ${isMainDomain}`);

        // Block admin routes on subdomains - redirect to main domain
        if (!isMainDomain) {
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.hostname = 'localhost';

            // Port is handled by Next.js if omitted, but let's be safe if it was in host header
            const port = host.split(':')[1];
            if (port) redirectUrl.port = port;

            console.log(`[Admin Block] Redirecting ${host} to ${redirectUrl.host}`);
            return NextResponse.redirect(redirectUrl);
        }

        // Allow public admin routes (only on main domain)
        if (pathname === '/admin/login' || pathname === '/api/admin/login') {
            return NextResponse.next();
        }

        const adminToken = request.cookies.get('admin_session_token')?.value;
        let isValid = false;

        if (adminToken) {
            try {
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
                const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

                // Validate session via RPC
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/validate_super_admin_session`, {
                    method: 'POST',
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${supabaseAnonKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ p_token: adminToken })
                });

                if (response.ok) {
                    const data = await response.json();
                    isValid = data.valid;
                }
            } catch (e) {
                console.error('[Middleware] Admin validation error:', e);
            }
        }

        if (!isValid) {
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = '/admin/login';
            // Provide a return URL if needed, but simple redirect for now
            return NextResponse.redirect(loginUrl);
        }

        // If valid admin, stop here and do not execute standard store auth
        return NextResponse.next();
    }

    // 4. SKIP FOR ASSETS (After admin check to be safe)
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.includes('/favicon.ico') ||
        pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot|webp|map)$/)
    ) {
        return NextResponse.next();
    }

    // --- SHARED VARIABLES FOR SUBSEQUENT LOGIC ---
    const hostnameWithoutPort = hostname;
    const hostParts = hostnameWithoutPort.split('.');

    // Update Supabase session
    const response = await updateSession(request);

    // --- STORE STATUS & SUBSCRIPTION CHECK ---
    // Check if logged in user has a store with pending issues
    // Check if accessing dashboard or other protected user routes
    if (pathname.startsWith('/dashboard') || pathname === '/select-plan' || pathname === '/subscription-success') {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return request.cookies.getAll() },
                    setAll(cookiesToSet) {
                        // Session update already handled above
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // --- EMAIL VERIFICATION ENFORCEMENT ---
            if (!user.email_confirmed_at && !pathname.startsWith('/email-verify') && !pathname.startsWith('/auth/callback')) {
                const url = request.nextUrl.clone();
                url.pathname = '/email-verify';
                return NextResponse.redirect(url);
            }
            // -------------------------------------

            // Fetch store status
            // We need to find the store associated with the user
            // If checking /dashboard/[storeId], we use that ID.
            // If just navigating, we look up by owner_id.

            let storeId: string | null = null;
            if (pathname.startsWith('/dashboard/')) {
                const pathParts = pathname.split('/');
                if (pathParts[2] && pathParts[2].length > 20) {
                    storeId = pathParts[2];
                }
            }

            // Fetch store
            let query = supabase.from('stores').select('id, status, status_reason');

            if (storeId) {
                query = query.eq('id', storeId);
            } else {
                query = query.eq('owner_id', user.id);
            }

            const { data: store } = await query.single();

            if (store) {
                // Determine if we should redirect or just pass through to the layout
                // We no longer redirect for status issues like banned/maintenance
                // but we still redirect for pending_plan to force plan selection.

                if (store.status === 'pending_plan' && !pathname.startsWith('/select-plan')) {
                    const url = request.nextUrl.clone();
                    url.pathname = '/select-plan';
                    return NextResponse.redirect(url);
                }

                if (store.status === 'pending_approval' && !pathname.startsWith('/subscription-success')) {
                    const url = request.nextUrl.clone();
                    url.pathname = '/subscription-success';
                    return NextResponse.redirect(url);
                }

                console.log(`[Middleware] Store status check: ${store.status} for ${pathname}`);
            }
        }
    }
    // --------------------------

    const url = request.nextUrl;

    // Define reserved subdomains
    const reservedSubdomains = [
        'www',
        'app',
        'api',
        'admin',
        'dashboard',
        'cdn',
        'static',
        'assets',
        'public',
    ];

    let subdomain = '';
    let isSubdomainRequest = false;

    // Check if hostname is just 'localhost' (no subdomain)
    if (isMainDomain) {
        // This is the main site - don't rewrite
        return response;
    }

    // Check for localhost subdomain: store.localhost
    if (hostnameWithoutPort.endsWith('.localhost')) {
        subdomain = hostParts[0];
        isSubdomainRequest = !reservedSubdomains.includes(subdomain);
    }
    // Check for production subdomain: store.example.com
    else if (hostParts.length > 2) {
        subdomain = hostParts[0];
        isSubdomainRequest = !reservedSubdomains.includes(subdomain);
    }

    // Handle Dashboard/Editor Subdomain Rewrite
    // Rewrite subdomain.site/dashboard/* -> /dashboard/[storeId]/*
    if (isSubdomainRequest &&
        (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/editor')) &&
        !url.pathname.startsWith('/dashboard/new-store') &&
        !url.searchParams.has('showAll')
    ) {
        // Prevent loop: If already rewritten to /dashboard/[uuid], pass through
        // UUID regex: 8-4-4-4-12 hex digits
        const hasStoreId = /\/dashboard\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(url.pathname);
        if (hasStoreId) {
            return response;
        }

        console.log(`[Middleware] Dashboard/Editor request on subdomain: ${subdomain}`);

        // We need to resolve the subdomain (slug) to a store ID
        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

            // Use RPC to fetch store ID by slug (Bypasses RLS for routing purposes)
            const fetchUrl = `${supabaseUrl}/rest/v1/rpc/get_store_id_by_slug`;

            const res = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ p_slug: subdomain })
            });

            if (res.ok) {
                const storeId = await res.json(); // Returns UUID string directly or null

                if (storeId) {
                    let newPathname = url.pathname;

                    // Handle /editor path specifically
                    if (newPathname.startsWith('/editor')) {
                        newPathname = newPathname.replace('/editor', `/dashboard/${storeId}/editor`);
                    } else {
                        // Regular dashboard path
                        newPathname = newPathname.replace('/dashboard', `/dashboard/${storeId}`);
                    }

                    const newUrl = url.clone();
                    newUrl.pathname = newPathname;

                    console.log(`[Middleware] Rewriting to: ${newUrl.pathname}`);

                    // Rewrite to the internal path
                    const rewriteResponse = NextResponse.rewrite(newUrl, {
                        request: { headers: request.headers }
                    });

                    // Copy cookies from updateSession response (ESSENTIAL for session)
                    response.headers.forEach((value, key) => {
                        if (key === 'set-cookie') {
                            rewriteResponse.headers.set(key, value);
                        }
                    });

                    return rewriteResponse;
                }
            }
        } catch (e) {
            console.error('[Middleware] Error resolving store slug:', e);
        }
    }

    // Rewrite subdomain requests to /s/[slug] internally (Existing Logic)
    if (isSubdomainRequest &&
        !url.pathname.startsWith('/s/') &&
        !url.pathname.startsWith('/api/') &&
        !url.pathname.startsWith('/select-plan') &&
        !url.pathname.startsWith('/email-verify') &&
        !url.pathname.startsWith('/subscription-success') &&
        !url.pathname.startsWith('/login') &&
        !url.pathname.startsWith('/signup') &&
        !url.pathname.startsWith('/sso') &&
        !url.pathname.startsWith('/dashboard') &&
        !url.pathname.startsWith('/editor')
    ) {
        const newUrl = url.clone();
        newUrl.pathname = `/s/${subdomain}${url.pathname}`;

        const rewriteResponse = NextResponse.rewrite(newUrl, {
            request: {
                headers: request.headers,
            },
        });

        // Copy cookies from updateSession response
        response.headers.forEach((value, key) => {
            if (key === 'set-cookie') {
                rewriteResponse.headers.set(key, value);
            }
        });

        return rewriteResponse;
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};

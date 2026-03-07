import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getAdminSessionToken } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { visitor_id, current_page, hostname } = body;

        if (!visitor_id || !current_page) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();
        let user_id: string | null = null;
        let user_type = 'visitor';
        let store_name: string | null = null;

        // Detect if hostname is a store subdomain
        let detectedStoreSlug = null;
        if (hostname) {
            const h = hostname.toLowerCase();
            const isMainDomain = h === 'localhost' || h === '127.0.0.1' || h === '::1' ||
                h.endsWith('.vercel.app') || h === 'orderlyshops.com' || h === 'www.orderlyshops.com';

            if (!isMainDomain) {
                if (h.endsWith('.localhost')) {
                    detectedStoreSlug = h.split('.')[0];
                } else {
                    const parts = h.split('.');
                    if (parts.length > 2) detectedStoreSlug = parts[0];
                }
            }
        }

        // 1. Check if Admin (Server-side reliable)
        const adminToken = await getAdminSessionToken();
        console.log('[Heartbeat] Admin token present:', !!adminToken);

        if (adminToken) {
            const { data: validation, error: vError } = await supabaseAdmin.rpc('validate_super_admin_session', { p_token: adminToken });
            console.log('[Heartbeat] Admin validation:', validation, vError);
            if (validation && validation.valid) {
                user_type = 'admin';
            }
        }

        // 2. If not Admin, check Supabase Auth for Regular User / Store Owner
        if (user_type === 'visitor') {
            const supabaseServer = createServerClient();
            const { data: { user } } = await supabaseServer.auth.getUser();
            console.log('[Heartbeat] Supabase User:', user?.id);

            if (user) {
                user_id = user.id;
                // Check if Store Owner (try stores table first)
                const { data: store, error: sError } = await supabaseAdmin
                    .from('stores')
                    .select('name')
                    .eq('owner_id', user.id)
                    .maybeSingle();

                console.log('[Heartbeat] Store check:', store, sError);

                if (store) {
                    user_type = 'store_owner';
                    // Handle Json name {ar: "", en: ""}
                    const nameObj = typeof store.name === 'string' ? JSON.parse(store.name) : store.name;
                    store_name = nameObj?.ar || nameObj?.en || 'Store';
                } else {
                    // Fallback: check store_members
                    const { data: member } = await supabaseAdmin
                        .from('store_members')
                        .select('role, stores(name)')
                        .eq('user_id', user.id)
                        .eq('role', 'owner')
                        .maybeSingle();

                    if (member) {
                        user_type = 'store_owner';
                        const s = member.stores as any;
                        const nameObj = typeof s?.name === 'string' ? JSON.parse(s.name) : s?.name;
                        store_name = nameObj?.ar || nameObj?.en || 'Store';
                    }
                }
            }
        }

        // 3. Identify Store Name if not already found (from Hostname or Path (/s/[slug]))
        if (!store_name) {
            let slug = detectedStoreSlug;

            // If not in host, check in path (/s/slug/...)
            if (!slug && current_page.startsWith('/s/')) {
                const parts = current_page.split('/').filter(Boolean); // ["s", "slug", ...]
                if (parts[1] && parts[1] !== 'dashboard') slug = parts[1];
            }

            if (slug) {
                const { data: storeBySlug } = await supabaseAdmin
                    .from('stores')
                    .select('name')
                    .eq('slug', slug)
                    .maybeSingle();

                if (storeBySlug) {
                    const nameObj = typeof storeBySlug.name === 'string' ? JSON.parse(storeBySlug.name) : storeBySlug.name;
                    store_name = nameObj?.ar || nameObj?.en || 'Store';
                }
            }
        }

        console.log('[Heartbeat] Final Detection:', { user_id, user_type, store_name, visitor_id, current_page });

        // Upsert heartbeat
        const { error } = await supabaseAdmin
            .from('online_users')
            .upsert(
                {
                    visitor_id,
                    user_id,
                    user_type,
                    current_page,
                    store_name,
                    last_seen: new Date().toISOString(),
                },
                { onConflict: 'visitor_id' }
            );

        if (error) {
            console.error('Heartbeat upsert error:', error);
            return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 });
        }

        return NextResponse.json({ ok: true, detected_type: user_type });
    } catch (error) {
        console.error('Heartbeat API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

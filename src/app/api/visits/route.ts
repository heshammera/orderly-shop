import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getAdminSessionToken } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { visitor_id, page_path, referrer, user_agent, hostname } = body;

        if (!visitor_id || !page_path) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();
        let user_id: string | null = null;
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

        // 1. Detect User ID from Supabase Session (if any)
        const supabaseServer = createServerClient();
        const { data: { user } } = await supabaseServer.auth.getUser();
        if (user) {
            user_id = user.id;
        }

        // 2. Identify Store Name (from Hostname or Path (/s/[slug]))
        let slug = detectedStoreSlug;
        if (!slug && page_path.startsWith('/s/')) {
            const parts = page_path.split('/').filter(Boolean);
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

        // Log the visit
        const { error } = await supabaseAdmin
            .from('platform_visits')
            .insert({
                visitor_id,
                user_id,
                page_path,
                referrer: referrer || null,
                user_agent: user_agent || null,
                store_name, // Added store_name column to log
            });

        if (error) {
            console.error('Visit logging error:', error);
            return NextResponse.json({ error: 'Failed to log visit' }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Visits API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

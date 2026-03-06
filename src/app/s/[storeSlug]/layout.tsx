import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { StoreClientLayout } from '@/components/store/StoreClientLayout';
import { AffiliateTracker } from '@/components/store/AffiliateTracker';
import { StatusPage } from '@/components/store-status/StatusPage';
import { VisitLogger } from '@/components/store/VisitLogger';
import { Metadata } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Generate dynamic metadata for the store
export async function generateMetadata({ params }: { params: { storeSlug: string } }): Promise<Metadata> {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: store } = await supabaseAdmin
        .from('stores')
        .select('name, description, logo_url')
        .eq('slug', params.storeSlug)
        .single();

    if (!store) return { title: 'Store Not Found' };

    const name = typeof store.name === 'string' ? JSON.parse(store.name) : store.name;
    const desc = typeof store.description === 'string' ? JSON.parse(store.description) : store.description;

    const title = name?.en || name?.ar || 'Store';
    const description = desc?.en || desc?.ar || '';

    return {
        title: {
            template: `%s | ${title}`,
            default: title,
        },
        description: description,
        icons: store.logo_url ? [store.logo_url] : [],
    };
}

export default async function Layout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { storeSlug: string };
}) {
    // We use the admin client here because the store might be 'pending_approval' or 'pending_plan'
    // and standard RLS policies prevent anonymous users from seeing it.
    // However, we MUST render the layout (e.g. for the /login page) so the owner can access it.
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch Store Data & Integrations using admin privileges
    const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, name, description, logo_url, currency, settings, slug, status, has_removed_copyright')
        .eq('slug', params.storeSlug)
        .single();

    if (storeError || !store) {
        return notFound();
    }

    // Fetch categories with show_in_header = true
    const { data: headerCategories } = await supabaseAdmin
        .from('categories')
        .select('id, name')
        .eq('store_id', store.id)
        .eq('status', 'active')
        .eq('show_in_header', true)
        .order('sort_order');

    const parsedHeaderCategories = headerCategories?.map(c => ({
        ...c,
        name: typeof c.name === 'string' ? JSON.parse(c.name) : c.name,
    })) || [];

    // Parse JSON fields safely
    const parsedStore = {
        ...store,
        name: typeof store.name === 'string' ? JSON.parse(store.name) : store.name,
        description: typeof store.description === 'string' ? JSON.parse(store.description) : store.description,
    };

    // Get integrations from store settings
    const integrations = store?.settings?.integrations || {};

    // Check if store has status issues - render status page instead of layout
    if (store.status && ['banned', 'maintenance', 'unpaid'].includes(store.status)) {
        return <StatusPage type={store.status as 'banned' | 'maintenance' | 'unpaid'} isAdminView={false} />;
    }

    return (
        <StoreClientLayout store={parsedStore} integrations={integrations} headerCategories={parsedHeaderCategories}>
            <AffiliateTracker storeId={store.id} />
            <VisitLogger storeId={store.id} />
            {children}
        </StoreClientLayout>
    );
}

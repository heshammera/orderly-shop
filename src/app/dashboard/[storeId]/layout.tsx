import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

export default async function Layout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { storeId: string };
}) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    );

    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser();

    if (!user) {
        // No user found, redirecting to login
        redirect('/login');
    }

    const { data: store, error } = await supabase
        .from('stores')
        .select('name, slug')
        .eq('id', params.storeId)
        .single();

    if (error) {
        console.error(`[Dashboard Layout] Error fetching store: ${error.message}`);
    }

    if (error || !store) {
        return notFound();
    }

    const storeName = typeof store.name === 'string' ? JSON.parse(store.name) : store.name;

    // Fetch full store data for status check
    const { data: fullStore } = await supabase
        .from('stores')
        .select('status, status_reason')
        .eq('id', params.storeId)
        .single();

    // Detect if we are on a subdomain to adjust links
    const hostname = headers().get('host') || '';
    const isSubdomain = store.slug && hostname.startsWith(store.slug);

    // Check for status issues (Except for super admins if we had that flag, 
    // but here we check if the store itself is restricted)
    const isRestricted = fullStore && ['banned', 'maintenance', 'unpaid'].includes(fullStore.status);

    if (isRestricted) {
        const { StatusPage } = await import('@/components/store-status/StatusPage');
        return (
            <DashboardLayout
                storeId={params.storeId}
                storeName={storeName}
                storeSlug={store.slug}
                isSubdomain={!!isSubdomain}
                hideSidebar={true}
            >
                <StatusPage
                    type={fullStore.status as 'banned' | 'maintenance' | 'unpaid'}
                    isAdminView={true}
                    reason={fullStore.status_reason}
                />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            storeId={params.storeId}
            storeName={storeName}
            storeSlug={store.slug}
            isSubdomain={!!isSubdomain}
        >
            {children}
        </DashboardLayout>
    );
}

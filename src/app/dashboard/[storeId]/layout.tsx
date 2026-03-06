import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { storeId: string } }): Promise<Metadata> {
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

    const { data: store } = await supabase
        .from('stores')
        .select('name, logo_url')
        .eq('id', params.storeId)
        .single();

    if (!store) return { title: 'Dashboard' };

    const nameObj = typeof store.name === 'string' ? JSON.parse(store.name) : store.name;
    const storeName = nameObj?.ar || nameObj?.en || 'Store Dashboard';

    return {
        title: {
            template: `%s | ${storeName}`,
            default: `${storeName}`,
        },
        icons: store.logo_url ? [store.logo_url] : [],
    };
}

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

    // Fetch store and settings in parallel
    const [storeRes, settingRes] = await Promise.all([
        supabase
            .from('stores')
            .select('name, slug, status, status_reason')
            .eq('id', params.storeId)
            .single(),
        supabase.rpc('get_setting', { setting_key: 'tutorials_enabled_dashboard' })
    ]);

    const { data: store, error } = storeRes;

    if (error) {
        console.error(`[Dashboard Layout] Error fetching store: ${error.message}`);
    }

    if (error || !store) {
        return notFound();
    }

    const storeName = typeof store.name === 'string' ? JSON.parse(store.name) : store.name;

    // Fetch tutorials enabled setting
    let tutorialsEnabled = true;
    try {
        if (settingRes.data !== null && settingRes.data !== undefined) {
            const val = String(settingRes.data).replace(/"/g, '');
            tutorialsEnabled = val === 'true';
        }
    } catch (e) {
        console.error("Failed to parse tutorials setting", e);
    }

    // Detect if we are on a subdomain to adjust links
    const hostname = headers().get('host') || '';
    const isSubdomain = store.slug && hostname.startsWith(store.slug);

    // Check for status issues
    const isRestricted = store && ['banned', 'maintenance', 'unpaid'].includes(store.status);

    if (isRestricted) {
        const { StatusPage } = await import('@/components/store-status/StatusPage');
        return (
            <DashboardLayout
                storeId={params.storeId}
                storeName={storeName}
                storeSlug={store.slug}
                isSubdomain={!!isSubdomain}
                hideSidebar={true}
                tutorialsEnabled={tutorialsEnabled}
            >
                <StatusPage
                    type={store.status as 'banned' | 'maintenance' | 'unpaid'}
                    isAdminView={true}
                    reason={store.status_reason}
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
            tutorialsEnabled={tutorialsEnabled}
        >
            {children}
        </DashboardLayout>
    );
}

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { RenderEngine } from '@/components/store/builder/RenderEngine';
import { DEFAULT_STORE_LAYOUT } from '@/lib/store-builder/types';
import { Metadata } from 'next';

export const revalidate = 0;

export async function generateMetadata({ params }: { params: { storeSlug: string } }): Promise<Metadata> {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    );

    const { data: store } = await supabase
        .from('stores')
        .select('name, description, logo_url')
        .eq('slug', params.storeSlug)
        .single();

    if (!store) return { title: 'Store Not Found' };

    const storeName = typeof store.name === 'string' ? store.name : store.name?.en || store.name?.ar || 'Store';
    const storeDesc = typeof store.description === 'string' ? store.description : store.description?.en || store.description?.ar || 'Welcome to our store';

    return {
        title: `${storeName} | Social Commerce Hub`,
        description: storeDesc,
        openGraph: {
            title: storeName,
            description: storeDesc,
            images: store.logo_url ? [store.logo_url] : [],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: storeName,
            description: storeDesc,
            images: store.logo_url ? [store.logo_url] : [],
        },
    };
}

export default async function StorePage({ params }: { params: { storeSlug: string } }) {
    // Use admin client to fetch store even if pending
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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

    // Fetch Store
    // console.log(`[StorePage] Fetching store for slug: ${params.storeSlug}`);
    const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, name, logo_url, currency, status, slug, has_removed_copyright')
        .eq('slug', params.storeSlug)
        .single();

    if (storeError) {
        console.error(`[StorePage] Error fetching store:`, storeError);
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl border border-red-100">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Database Error Detected</h1>
                    <p className="text-gray-600 mb-6">
                        An error occurred while fetching the storefront data. This usually happens when a recent database migration has not been applied.
                    </p>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-left overflow-auto text-sm font-mono whitespace-pre-wrap">
                        {JSON.stringify(storeError, null, 2)}
                    </div>
                </div>
            </div>
        );
    }

    if (!store) {
        notFound();
    }

    const storeName = typeof store.name === 'string' ? store.name : store.name?.en || store.name?.ar || 'Store';

    // Handle Non-Active Stores (Pending Plan, Pending Approval, etc.)
    if (store.status !== 'active') {

        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center space-y-6">
                <div className="bg-gray-50 p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
                    {store.logo_url && (
                        <img
                            src={store.logo_url}
                            alt={storeName}
                            className="w-20 h-20 mx-auto rounded-xl object-cover mb-4 shadow-sm"
                        />
                    )}
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {storeName}
                    </h1>
                    <div className="space-y-4">
                        <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm font-medium">
                            Store Under Construction
                        </div>
                        <p className="text-gray-500">
                            This store is currently not active. If you are the owner, please login to complete the setup and activate your store.
                        </p>
                        <hr className="border-gray-100" />
                        <a
                            href="/login"
                            className="block w-full py-2.5 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Login to Activate
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // Fetch Home Page Layout for Active Stores
    // console.log('[StorePage] Fetching home page for store_id:', store.id);
    const { data: page, error: pageError } = await supabase
        .from('store_pages')
        .select('content, updated_at')
        .eq('store_id', store.id)
        .eq('slug', 'home')
        .eq('is_published', true)
        .maybeSingle();

    if (pageError) {
        console.error('[StorePage] Error fetching page:', pageError);
    }

    // console.log('[StorePage] Page data - exists:', !!page, 'sections:', page?.content?.sections?.length);

    // Use DB content or Fallback to Professional Default
    const pageContent = page?.content || DEFAULT_STORE_LAYOUT;
    // console.log('[StorePage] Using content with sections count:', pageContent?.sections?.length);

    return (
        <main>
            <RenderEngine
                schema={pageContent}
                storeId={store.id}
                storeCurrency={store.currency || 'SAR'}
                storeSlug={params.storeSlug}
                store={store}
            />
        </main>
    );
}


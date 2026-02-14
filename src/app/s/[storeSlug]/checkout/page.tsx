import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { CheckoutPage } from '@/components/store/CheckoutPage';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { storeSlug: string } }): Promise<Metadata> {
    return {
        title: 'Checkout',
        description: 'Complete your purchase.',
    };
}

export default async function Page({ params }: { params: { storeSlug: string } }) {
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

    const [storeRes, pageRes] = await Promise.all([
        supabase
            .from('stores')
            .select('id, currency, settings, slug, name') // Added name
            .eq('slug', params.storeSlug)
            .eq('status', 'active')
            .single(),
        supabase
            .from('store_pages')
            .select('content')
            .eq('store_slug', params.storeSlug) // Check if store_pages uses store_id or slug? 
        // In editor page we used store_id. Here we have storeSlug from params.
        // Ideally we need store_id to query store_pages.
        // So we must fetch store first, OR join.
        // Let's fetch store first, then page.
        // Or use a join if possible? store_pages usually linked by store_id.
        // I'll fetch store first.
    ]);
    // ... wait, I can't double await easily in parallel if one depends on other.
    // Let's split.

    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, currency, settings, slug, name')
        .eq('slug', params.storeSlug)
        .eq('status', 'active')
        .single();

    if (storeError || !store) {
        return notFound();
    }

    const { data: pageData } = await supabase
        .from('store_pages')
        .select('content')
        .eq('store_id', store.id)
        .eq('slug', 'checkout')
        .single();

    return <CheckoutPage store={store} pageSchema={pageData?.content || null} />;
}

import { createClient } from '@supabase/supabase-js';
import { cache } from 'react';

const getAdminClient = cache(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
});

export default async function LandingPageLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { storeSlug: string; productId: string };
}) {
    const supabase = getAdminClient();

    // Check if this landing page is standalone (no store header/footer)
    let isStandalone = true;
    try {
        if (supabase) {
            const { data: lp } = await supabase
                .from('product_landing_pages')
                .select('is_standalone')
                .eq('product_id', params.productId)
                .eq('is_enabled', true)
                .maybeSingle();
            if (lp) isStandalone = lp.is_standalone ?? true;
        }
    } catch { /* fallback to standalone */ }

    // If standalone, render with no wrapper (pure landing page)
    if (isStandalone) {
        return <>{children}</>;
    }

    // If integrated with store, wrap with store layout
    // We import the store layout dynamically based on storeSlug
    // For now we render children — the store header/footer are rendered
    // by the parent /s/[storeSlug]/layout.tsx automatically
    return <>{children}</>;
}

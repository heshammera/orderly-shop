'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function saveStoreLayout(storeId: string, layout: any, storeSlug?: string) {
    console.log('[saveStoreLayout] Starting save for storeId:', storeId, 'slug:', storeSlug);
    console.log('[saveStoreLayout] Layout sections count:', layout?.sections?.length);

    const cookieStore = cookies()

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
    )

    const dataToSave = {
        store_id: storeId,
        slug: 'home',
        content: layout,
        is_published: true,
        updated_at: new Date().toISOString()
    };

    console.log('[saveStoreLayout] About to upsert data');

    const { data, error } = await supabase
        .from('store_pages')
        .upsert(dataToSave, { onConflict: 'store_id, slug' })
        .select()

    console.log('[saveStoreLayout] Upsert result - error:', error, 'saved data:', !!data);

    if (error) {
        console.error('[saveStoreLayout] Save failed:', error);
        return { success: false, error: error.message }
    }

    console.log('[saveStoreLayout] Save successful, revalidating paths...');

    // Revalidate the store page to show changes immediately
    if (storeSlug) {
        console.log('[saveStoreLayout] Revalidating /s/' + storeSlug);
        revalidatePath(`/s/${storeSlug}`)
    }
    revalidatePath(`/dashboard/${storeId}/editor`)

    console.log('[saveStoreLayout] Completed successfully');
    return { success: true }
}

'use server';

import { revalidatePath } from 'next/cache';

export async function revalidateLandingPage(storeSlug: string, productId: string) {
    try {
        // Revalidate the specific landing page path
        revalidatePath(`/s/${storeSlug}/lp/${productId}`);
        // Also revalidate the generic path if used
        revalidatePath(`/lp/${productId}`);
        return { success: true };
    } catch (e) {
        console.error('Revalidation error:', e);
        return { success: false };
    }
}

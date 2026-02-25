"use server";

import { createClient } from "@supabase/supabase-js";

export async function trackOrder(storeSlug: string, searchQuery: string) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get store ID
    const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, currency')
        .eq('slug', storeSlug)
        .single();

    if (storeError || !store) {
        return { success: false, error: 'Store not found' };
    }

    const query = searchQuery.trim();
    if (!query) {
        return { success: false, error: 'Please enter an order number or phone number' };
    }

    // Try to find the order by exact order_number, or if it looks like a phone number, by phone.
    let orQuery = `order_number.ilike.%${query}%`;

    // Basic check if it contains mostly numbers, it could be a phone
    const digitsOnly = query.replace(/\D/g, '');
    if (digitsOnly.length >= 8) {
        // Querying JSONB in PostgREST:
        orQuery += `,customer_snapshot->>phone.ilike.%${digitsOnly}%`;
    }

    const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select(`
            id, order_number, created_at, status, total, notes,
            shipping_address, customer_snapshot,
            order_items (
                id, quantity, unit_price, product_snapshot
            )
        `)
        .eq('store_id', store.id)
        .or(orQuery)
        .order('created_at', { ascending: false })
        .limit(10);

    if (ordersError) {
        console.error('Error tracking order:', ordersError);
        return { success: false, error: 'Failed to search for orders' };
    }

    if (!orders || orders.length === 0) {
        return { success: false, error: 'No orders found.' };
    }

    return { success: true, orders, currency: store.currency };
}

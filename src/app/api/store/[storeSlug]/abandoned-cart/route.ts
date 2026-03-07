import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
    request: NextRequest,
    { params }: { params: { storeSlug: string } }
) {
    try {
        const body = await request.json();
        const { cartId, customer_name, customer_phone, cart_items, total_price } = body;

        // We only save if we have at least a phone number or name to contact them
        if (!customer_name && !customer_phone) {
            return NextResponse.json({ error: 'Missing contact info' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Get the store id
        const { data: storeData, error: storeError } = await supabase
            .from('stores')
            .select('id')
            .eq('slug', params.storeSlug)
            .single();

        if (storeError || !storeData) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        // 2. Insert or Update Abandoned Cart
        // If the client has a cartId stored in localStorage or state, we update it.
        // Otherwise, we insert a new one and return the ID.

        let resultData;

        if (cartId) {
            const { data, error } = await supabase
                .from('abandoned_carts')
                .update({
                    customer_name,
                    customer_phone,
                    cart_items,
                    total_price,
                    updated_at: new Date().toISOString()
                })
                .eq('id', cartId)
                .eq('store_id', storeData.id)
                .select('id')
                .single();

            if (error) {
                // If update fails (e.g. cartId not found), silently fall back to insert
                console.warn('Abandoned cart update failed, attempting insert', error);
                const { data: newData, error: newError } = await supabase
                    .from('abandoned_carts')
                    .insert({
                        store_id: storeData.id,
                        customer_name,
                        customer_phone,
                        cart_items,
                        total_price,
                        recovery_status: 'pending'
                    })
                    .select('id')
                    .single();

                if (newError) throw newError;
                resultData = newData;
            } else {
                resultData = data;
            }
        } else {
            // New abandoned cart
            const { data, error } = await supabase
                .from('abandoned_carts')
                .insert({
                    store_id: storeData.id,
                    customer_name,
                    customer_phone,
                    cart_items,
                    total_price,
                    recovery_status: 'pending'
                })
                .select('id')
                .single();

            if (error) throw error;
            resultData = data;
        }

        return NextResponse.json({
            success: true,
            cartId: resultData.id
        });

    } catch (error: any) {
        console.error('Abandoned cart API error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

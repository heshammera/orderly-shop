import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
    request: NextRequest,
    { params }: { params: { storeSlug: string } }
) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const cartId = searchParams.get('cartId');

        if (!cartId) {
            return NextResponse.json({ error: 'Missing cartId' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Get the store id
        const { data: storeData, error: storeError } = await supabase
            .from('stores')
            .select('id')
            .eq('slug', params.storeSlug)
            .single();

        if (storeError || !storeData) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        // Get the abandoned cart
        const { data: cart, error: cartError } = await supabase
            .from('abandoned_carts')
            .select('id, customer_name, customer_phone, cart_items, total_price')
            .eq('id', cartId)
            .eq('store_id', storeData.id)
            .eq('recovery_status', 'pending')
            .single();

        if (cartError || !cart) {
            return NextResponse.json({ error: 'Cart not found or already recovered' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            cart: {
                id: cart.id,
                customerName: cart.customer_name,
                customerPhone: cart.customer_phone,
                items: cart.cart_items,
                totalPrice: cart.total_price,
            }
        });

    } catch (error: any) {
        console.error('Recovery cart API error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

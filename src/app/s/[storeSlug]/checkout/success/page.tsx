import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { CheckoutSuccessClient } from './CheckoutSuccessClient';

export const metadata: Metadata = {
    title: 'Order Confirmed',
    description: 'Your order has been placed successfully.',
};

export default async function Page({ params, searchParams }: { params: { storeSlug: string }; searchParams: { orderId?: string } }) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: store } = await supabase
        .from('stores')
        .select('id, name, slug, logo_url, currency, settings')
        .eq('slug', params.storeSlug)
        .single();

    if (!store) return notFound();

    const parsedStore = {
        ...store,
        name: typeof store.name === 'string' ? JSON.parse(store.name) : store.name,
    };

    // Fetch order details if orderId provided
    let order = null;
    if (searchParams.orderId) {
        const { data } = await supabase
            .from('orders')
            .select('id, order_number, total, currency, status, customer_snapshot, created_at, shipping_cost, subtotal, discount_amount')
            .eq('store_id', store.id)
            .eq('order_number', searchParams.orderId)
            .single();
        order = data;
    }

    return <CheckoutSuccessClient store={parsedStore} order={order} />;
}

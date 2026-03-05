export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { store_id, product, quantity, variants, selections, formData, selectedGovernorate, shippingCost, subtotal, total, currency } = body;

        if (!store_id || !product || !formData?.name || !formData?.phone) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 0. Check Subscription Order Limit
        const { data: planData } = await supabase.rpc('get_store_effective_plan', { p_store_id: store_id });
        if (planData && planData.has_plan) {
            const ordersLimit = planData.plan?.features?.orders_limit;
            if (ordersLimit !== undefined && ordersLimit !== -1) {
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);

                const { count: ordersCount } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('store_id', store_id)
                    .gte('created_at', startOfMonth.toISOString());

                if (ordersCount !== null && ordersCount >= ordersLimit) {
                    return NextResponse.json({
                        error: 'عذراً، وصل المتجر للحد الأقصى للطلبات في هذه الباقة. / Store has reached its monthly order limit.'
                    }, { status: 403 });
                }
            }
        }

        // 1. Create Customer
        const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .insert({
                store_id,
                name: formData.name,
                phone: formData.phone,
                address: {
                    city: formData.city,
                    full_address: formData.address,
                    governorate_id: selectedGovernorate,
                    alt_phone: formData.alt_phone
                },
                total_orders: 1,
                total_spent: total
            })
            .select()
            .single();

        if (customerError) {
            console.error('Customer creation error:', customerError);
            return NextResponse.json({ error: 'Failed to create customer: ' + customerError.message }, { status: 500 });
        }

        // 2. Create Order
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
                store_id,
                customer_id: customerData.id,
                order_number: orderNumber,
                status: 'pending',
                subtotal,
                total,
                shipping_cost: shippingCost,
                currency,
                customer_snapshot: {
                    name: formData.name,
                    phone: formData.phone,
                    alt_phone: formData.alt_phone,
                    city: formData.city,
                    governorate_id: selectedGovernorate,
                    address: formData.address
                },
                shipping_address: {
                    city: formData.city,
                    address: formData.address,
                    governorate_id: selectedGovernorate
                },
                notes: formData.notes
            })
            .select()
            .single();

        if (orderError) {
            console.error('Order creation error:', orderError);
            return NextResponse.json({ error: 'Failed to create order: ' + orderError.message }, { status: 500 });
        }

        // 3. Create Order Items
        const orderItems: any[] = [];
        for (let i = 0; i < quantity; i++) {
            const itemSelections = selections[i] || {};
            let itemPrice = product.price;
            const variantSnapshot = (variants || []).map((v: any) => {
                const selectedOpt = v.options.find((o: any) => o.id === itemSelections[v.id]);
                if (selectedOpt?.price_modifier) {
                    itemPrice += selectedOpt.price_modifier;
                }
                return {
                    variantId: v.id,
                    variantName: typeof v.name === 'string' ? v.name : (v.name?.ar || v.name?.en || ''),
                    optionId: selectedOpt?.id,
                    optionLabel: typeof selectedOpt?.label === 'string' ? selectedOpt?.label : (selectedOpt?.label?.ar || selectedOpt?.label?.en || ''),
                    priceModifier: selectedOpt?.price_modifier || 0
                };
            });

            orderItems.push({
                order_id: orderData.id,
                product_id: product.id,
                quantity: 1,
                unit_price: itemPrice,
                total_price: itemPrice,
                product_snapshot: {
                    name: product.name,
                    variants: variantSnapshot
                }
            });
        }

        const { error: itemError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemError) {
            console.error('Order items creation error:', itemError);
            return NextResponse.json({ error: 'Failed to create order items: ' + itemError.message }, { status: 500 });
        }

        // 4. Trigger Google Sheets Sync (await with timeout, so Vercel doesn't kill the process)
        try {
            const protocol = request.headers.get('x-forwarded-proto') || 'https';
            const host = request.headers.get('host');
            const baseUrl = `${protocol}://${host}`;
            const syncUrl = `${baseUrl}/api/integrations/google-sheets/sync`;

            const syncRes = await fetch(syncUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderData.id, storeId: store_id }),
                signal: AbortSignal.timeout(15000),
            });

            if (!syncRes.ok) {
                const syncBody = await syncRes.text().catch(() => '');
                console.error(`GS sync failed for order ${orderData.id}: HTTP ${syncRes.status}`, syncBody);
            }
        } catch (e: any) {
            console.error(`GS sync error for order ${orderData.id}:`, e.message);
        }

        return NextResponse.json({
            success: true,
            order_number: orderData.order_number,
            order_id: orderData.id
        });

    } catch (error: any) {
        console.error('Quick order API error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

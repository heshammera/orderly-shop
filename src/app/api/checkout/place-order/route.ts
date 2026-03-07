

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncOrderToGoogleSheets } from '@/lib/integrations/google-sheets-sync';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            store_id,
            cart,
            formData,
            selectedGovernorate,
            cityOrGovName,
            shippingCost,
            subtotal,
            total,
            discount,
            couponCode,
            currency,
            notes,
            affiliate_code,
            bumpOffer,
            redeemPoints,
            pointsToRedeem,
            language,
        } = body;

        if (!store_id || !cart?.length || !formData?.name || !formData?.phone) {
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
                        error: language === 'ar' ? 'عذراً، وصل المتجر للحد الأقصى للطلبات في هذه الباقة.' : 'Store has reached its monthly order limit.'
                    }, { status: 403 });
                }
            }
        }

        // 1. Find or Create Customer
        let customerId = crypto.randomUUID();
        const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id, loyalty_points')
            .eq('store_id', store_id)
            .eq('phone', formData.phone)
            .single();

        if (existingCustomer) {
            customerId = existingCustomer.id;
        } else {
            const { error: customerError } = await supabase
                .from('customers')
                .insert({
                    id: customerId,
                    store_id,
                    name: formData.name,
                    phone: formData.phone,
                    address: {
                        city: cityOrGovName,
                        full_address: formData.address,
                        governorate_id: selectedGovernorate,
                        alt_phone: formData.alt_phone
                    },
                    total_orders: 1,
                    total_spent: total
                });
            if (customerError) {
                console.error('Customer creation error:', customerError);
                return NextResponse.json({ error: 'Failed to create customer: ' + customerError.message }, { status: 500 });
            }
        }

        // 2. Create Order
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
        const bumpOfferTotal = bumpOffer?.selected ? bumpOffer.price : 0;

        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
                store_id,
                customer_id: customerId,
                order_number: orderNumber,
                status: 'pending',
                subtotal: subtotal + bumpOfferTotal,
                discount_amount: discount,
                coupon_code: couponCode || null,
                subtotal_amount: subtotal,
                total,
                shipping_cost: shippingCost,
                currency,
                customer_snapshot: {
                    name: formData.name,
                    phone: formData.phone,
                    alt_phone: formData.alt_phone,
                    city: cityOrGovName,
                    governorate_id: selectedGovernorate,
                    address: formData.address
                },
                shipping_address: {
                    city: cityOrGovName,
                    address: formData.address,
                    governorate_id: selectedGovernorate
                },
                notes: notes || null,
                affiliate_code: affiliate_code || null
            })
            .select()
            .single();

        if (orderError) {
            console.error('Order creation error:', orderError);
            return NextResponse.json({ error: 'Failed to create order: ' + orderError.message }, { status: 500 });
        }

        // 3. Create Order Items
        const orderItems = cart.map((item: any) => ({
            order_id: orderData.id,
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.unitPrice * item.quantity,
            product_snapshot: {
                name: typeof item.productName === 'string' ? item.productName : item.productName[language || 'ar'],
                variants: (item.variants || []).map((v: any) => ({
                    ...v,
                    variantName: typeof v.variantName === 'string' ? v.variantName : (v.variantName[language || 'ar'] || v.variantName.ar),
                    optionLabel: typeof v.optionLabel === 'string' ? v.optionLabel : (v.optionLabel[language || 'ar'] || v.optionLabel.ar)
                }))
            }
        }));

        if (bumpOffer?.selected) {
            orderItems.push({
                order_id: orderData.id,
                product_id: 'bump-offer',
                quantity: 1,
                unit_price: bumpOffer.price,
                total_price: bumpOffer.price,
                product_snapshot: {
                    name: bumpOffer.label,
                    variants: []
                }
            });
        }

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Order items creation error:', itemsError);
            return NextResponse.json({ error: 'Failed to create order items: ' + itemsError.message }, { status: 500 });
        }

        // Create an order notification for the merchant
        try {
            await createNotification(supabase, {
                store_id,
                title: language === 'ar' ? 'طلب جديد' : 'New Order',
                message: language === 'ar'
                    ? `تم استلام طلب جديد (${orderData.order_number}) بقيمة ${total} ${currency}`
                    : `New order received (${orderData.order_number}) for ${total} ${currency}`,
                type: 'order',
                link: `/dashboard/${store_id}/orders?search=${orderData.order_number}`
            });
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
        }

        // 4. Increment Coupon Usage
        if (couponCode) {
            await supabase.rpc('increment_coupon_usage', {
                coupon_code: couponCode,
                store_id_param: store_id
            });
        }

        // 5. Redeem Loyalty Points
        if (redeemPoints && pointsToRedeem > 0) {
            await supabase.from('loyalty_transactions').insert({
                store_id,
                customer_id: customerId,
                points: -Math.floor(pointsToRedeem),
                type: 'redeem',
                order_id: orderData.id,
                description: `Redeemed for Order #${orderData.order_number}`
            });
        }

        // 6. Trigger Google Sheets Sync
        try {
            await syncOrderToGoogleSheets(orderData.id, store_id);
        } catch (e: any) {
            console.error(`GS sync error for order ${orderData.id}:`, e.message);
        }

        return NextResponse.json({
            success: true,
            order_number: orderData.order_number,
            order_id: orderData.id
        });

    } catch (error: any) {
        console.error('Place order API error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
            const protocol = request.headers.get('x-forwarded-proto') || 'http';
            const host = request.headers.get('host');
            const baseUrl = `${protocol}://${host}`;
            fetch(`${baseUrl}/api/integrations/google-sheets/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderData.id, storeId: store_id })
            }).catch(e => console.error('Failed to trigger GS sync:', e));
        } catch (e) {
            console.error('Failed to initiate sync call:', e);
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

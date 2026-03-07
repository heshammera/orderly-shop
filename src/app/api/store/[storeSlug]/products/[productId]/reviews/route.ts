import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createNotification } from '@/lib/notifications';

// POST: Add a new review
export async function POST(
    request: NextRequest,
    { params }: { params: { storeSlug: string, productId: string } }
) {
    try {
        const body = await request.json();
        const { rating, comment, customer_name, customer_phone } = body;

        if (!rating || !customer_name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Get the store id from slug and verify product belongs to store
        const { data: storeData, error: storeError } = await supabase
            .from('stores')
            .select('id')
            .eq('slug', params.storeSlug)
            .single();

        if (storeError || !storeData) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        const { data: productData, error: productError } = await supabase
            .from('products')
            .select('id, name')
            .eq('id', params.productId)
            .eq('store_id', storeData.id)
            .single();

        if (productError || !productData) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // 2. (Optional) Try to find customer by phone to link the review
        let customerId = null;
        if (customer_phone) {
            const { data: customerData } = await supabase
                .from('customers')
                .select('id')
                .eq('store_id', storeData.id)
                .eq('phone', customer_phone)
                .single();

            if (customerData) {
                customerId = customerData.id;
            }
        }

        // 3. Insert the review (status will be 'pending' by default based on schema)
        const { data: reviewData, error: reviewError } = await supabase
            .from('product_reviews')
            .insert({
                product_id: params.productId,
                store_id: storeData.id,
                customer_id: customerId,
                customer_name,
                rating,
                comment: comment || null,
                status: 'pending' // explicit for clarity
            })
            .select()
            .single();

        if (reviewError) {
            console.error('Review creation error:', reviewError);
            return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
        }

        // 4. Create a notification for the merchant
        const productName = typeof productData.name === 'string'
            ? productData.name
            : (productData.name as any).ar || (productData.name as any).en || 'Product';

        try {
            await createNotification(supabase, {
                store_id: storeData.id,
                title: 'تقييم جديد بانتظار الموافقة',
                message: `تم إضافة تقييم جديد (${rating} نجوم) للمنتج: ${productName}`,
                type: 'review',
                link: `/dashboard/${storeData.id}/reviews`
            });
        } catch (notifError) {
            console.error('Failed to create review notification:', notifError);
        }

        return NextResponse.json({
            success: true,
            message: 'Review submitted successfully and is pending approval'
        });

    } catch (error: any) {
        console.error('Submit review API error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

// GET: Fetch approved reviews for a product
export async function GET(
    request: NextRequest,
    { params }: { params: { storeSlug: string, productId: string } }
) {
    try {
        const supabase = createAdminClient();

        // We only use the admin client to bypass any potential RLS issues on public endpoints,
        // but we explicitly filter to only return 'approved' reviews
        const { data, error } = await supabase
            .from('product_reviews')
            .select('id, customer_name, rating, comment, created_at')
            .eq('product_id', params.productId)
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ reviews: data || [] });

    } catch (error: any) {
        console.error('Fetch reviews API error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

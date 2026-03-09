export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const { storeId, products } = await req.json();

        if (!storeId || !products || !Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ error: 'Missing storeId or products array' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: storeMember } = await supabase
            .from('store_members')
            .select('*')
            .eq('store_id', storeId)
            .eq('user_id', user.id)
            .single();

        if (!storeMember) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_super_admin')
                .eq('id', user.id)
                .single();

            if (!profile?.is_super_admin) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        // 2. Check subscription product limit
        const { data: planData } = await supabase.rpc('get_store_effective_plan', { p_store_id: storeId });
        if (planData && planData.has_plan) {
            const productsLimit = planData.plan?.features?.products_limit;
            if (productsLimit !== undefined && productsLimit !== -1) {
                const { count: productsCount } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true })
                    .eq('store_id', storeId);

                const remaining = productsLimit - (productsCount || 0);
                if (remaining <= 0) {
                    return NextResponse.json({
                        error: 'لقد وصلت للحد الأقصى للمنتجات في باقتك الحالية.',
                        error_code: 'LIMIT_REACHED'
                    }, { status: 403 });
                }

                if (products.length > remaining) {
                    return NextResponse.json({
                        error: `يمكنك إضافة ${remaining} منتج/منتجات فقط ضمن باقتك الحالية. لديك ${products.length} منتج في الملف.`,
                        error_code: 'LIMIT_EXCEEDED'
                    }, { status: 403 });
                }
            }
        }

        // 3. Validate and insert products
        const results: { success: number; failed: number; errors: { row: number; error: string }[] } = {
            success: 0,
            failed: 0,
            errors: []
        };

        // Process in batches of 20
        const batchSize = 20;
        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);
            const payloads: any[] = [];

            for (let j = 0; j < batch.length; j++) {
                const p = batch[j];
                const rowIndex = i + j + 1; // 1-based row number (matching Excel)

                // Validate required fields
                if (!p.name_ar && !p.name_en) {
                    results.failed++;
                    results.errors.push({ row: rowIndex, error: 'اسم المنتج مطلوب (عربي أو إنجليزي)' });
                    continue;
                }

                if (!p.price || isNaN(parseFloat(p.price)) || parseFloat(p.price) <= 0) {
                    results.failed++;
                    results.errors.push({ row: rowIndex, error: 'السعر مطلوب ويجب أن يكون رقم أكبر من 0' });
                    continue;
                }

                payloads.push({
                    store_id: storeId,
                    name: JSON.stringify({ ar: p.name_ar || '', en: p.name_en || '' }),
                    description: JSON.stringify({ ar: p.description_ar || '', en: p.description_en || '' }),
                    price: parseFloat(p.price),
                    sale_price: p.sale_price && parseFloat(p.sale_price) > 0 ? parseFloat(p.sale_price) : null,
                    stock_quantity: p.stock_quantity && parseInt(p.stock_quantity) >= 0 ? parseInt(p.stock_quantity) : 0,
                    sku: p.sku || null,
                    images: p.image_url ? JSON.stringify([p.image_url]) : null,
                    status: 'active',
                });
            }

            if (payloads.length > 0) {
                const { data, error: insertError } = await supabase
                    .from('products')
                    .insert(payloads)
                    .select('id');

                if (insertError) {
                    results.failed += payloads.length;
                    results.errors.push({ row: i + 1, error: `خطأ في الإدراج: ${insertError.message}` });
                } else {
                    results.success += data?.length || payloads.length;
                }
            }
        }

        return NextResponse.json({
            success: true,
            results
        });

    } catch (error: any) {
        console.error('Error in bulk import:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

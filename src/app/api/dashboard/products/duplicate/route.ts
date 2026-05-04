export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const { storeId, productId } = await req.json();

        if (!storeId || !productId) {
            return NextResponse.json({ error: 'Missing storeId or productId' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Verify user authentication and authorization
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: storeMember, error: memberError } = await supabase
            .from('store_members')
            .select('*')
            .eq('store_id', storeId)
            .eq('user_id', user.id)
            .single();

        if (memberError || !storeMember) {
            // Check if Super Admin
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_super_admin')
                .eq('id', user.id)
                .single();

            if (!profile?.is_super_admin) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        // 1.5 Check Subscription Product Limit
        const { data: planData } = await supabase.rpc('get_store_effective_plan', { p_store_id: storeId });
        if (planData && planData.has_plan) {
            const productsLimit = planData.plan?.features?.products_limit;
            if (productsLimit !== undefined && productsLimit !== -1) {
                const { count: productsCount } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true })
                    .eq('store_id', storeId);

                if (productsCount !== null && productsCount >= productsLimit) {
                    return NextResponse.json({
                        error: 'لقد وصلت للحد الأقصى للمنتجات في باقتك الحالية.'
                    }, { status: 403 });
                }
            }
        }

        // 2. Fetch original product
        const { data: originalProduct, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .eq('store_id', storeId)
            .single();

        if (productError || !originalProduct) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // 3. Duplicate product
        const getDuplicatedName = (nameObj: any) => {
            let parsed = nameObj;
            try {
                if (typeof nameObj === 'string') parsed = JSON.parse(nameObj);
            } catch (e) {
                parsed = { ar: nameObj, en: nameObj };
            }
            
            return {
                ar: `نسخة من ${parsed?.ar || 'منتج'}`,
                en: `Copy of ${parsed?.en || 'Product'}`
            };
        };

        const newProductPayload: any = {
            store_id: storeId,
            name: JSON.stringify(getDuplicatedName(originalProduct.name)),
            description: originalProduct.description,
            price: originalProduct.price,
            stock_quantity: originalProduct.stock_quantity,
            sku: originalProduct.sku ? `${originalProduct.sku}-COPY` : null,
            images: typeof originalProduct.images === 'object' ? JSON.stringify(originalProduct.images) : originalProduct.images,
            status: 'active',
            metadata: originalProduct.metadata,
            skip_cart: originalProduct.skip_cart,
            free_shipping: originalProduct.free_shipping,
            fake_countdown_enabled: originalProduct.fake_countdown_enabled,
            fake_countdown_minutes: originalProduct.fake_countdown_minutes,
            fake_visitors_enabled: originalProduct.fake_visitors_enabled,
            fake_visitors_min: originalProduct.fake_visitors_min,
            fake_visitors_max: originalProduct.fake_visitors_max,
            ignore_stock: originalProduct.ignore_stock,
            sale_price: originalProduct.sale_price,
        };

        const { data: newProduct, error: insertProductError } = await supabase
            .from('products')
            .insert(newProductPayload)
            .select()
            .single();

        if (insertProductError || !newProduct) {
            throw new Error(`Failed to create duplicate product: ${insertProductError?.message}`);
        }

        const newProductId = newProduct.id;

        // 4. Duplicate product variants and their options
        const { data: originalVariants, error: fetchVariantsError } = await supabase
            .from('product_variants')
            .select('*, variant_options(*)')
            .eq('product_id', productId);

        const variantErrors: any[] = [];
        if (fetchVariantsError) variantErrors.push(`Fetch variants error: ${fetchVariantsError.message}`);

        if (originalVariants && originalVariants.length > 0) {
            for (const variant of originalVariants) {
                const { data: newVariant, error: vError } = await supabase
                    .from('product_variants')
                    .insert({
                        product_id: newProductId,
                        name: variant.name,
                        display_type: variant.display_type,
                        option_type: variant.option_type,
                        required: variant.required,
                        sort_order: variant.sort_order,
                    })
                    .select()
                    .single();

                if (vError) {
                    variantErrors.push(`Variant insert error (${variant.name?.ar || 'unnamed'}): ${vError.message}`);
                    continue;
                }

                if (newVariant && variant.variant_options && variant.variant_options.length > 0) {
                    const newOptionsPayload = variant.variant_options.map((opt: any) => ({
                        variant_id: newVariant.id,
                        label: opt.label,
                        value: opt.value,
                        price: opt.price,
                        stock: opt.stock,
                        manage_stock: opt.manage_stock,
                        is_default: opt.is_default,
                        sort_order: opt.sort_order,
                        in_stock: opt.in_stock,
                    }));

                    const { error: optError } = await supabase.from('variant_options').insert(newOptionsPayload);
                    if (optError) {
                        variantErrors.push(`Options insert error for variant ${newVariant.id}: ${optError.message}`);
                    }
                }
            }
        }

        if (variantErrors.length > 0) {
            console.error('[Duplicate Product] Variant Errors:', variantErrors);
        }

        // 5. Duplicate product categories
        const { data: originalCategories } = await supabase
            .from('product_categories')
            .select('category_id')
            .eq('product_id', productId);

        if (originalCategories && originalCategories.length > 0) {
            const newCategoryPayloads = originalCategories.map(cat => ({
                product_id: newProductId,
                category_id: cat.category_id
            }));
            await supabase.from('product_categories').insert(newCategoryPayloads);
        }

        // 6. Duplicate upsell offers
        const { data: originalUpsells } = await supabase
            .from('upsell_offers')
            .select('*')
            .eq('product_id', productId);

        if (originalUpsells && originalUpsells.length > 0) {
            const newUpsellsPayload = originalUpsells.map(upsell => ({
                product_id: newProductId,
                min_quantity: upsell.min_quantity,
                discount_type: upsell.discount_type,
                discount_value: upsell.discount_value,
                label: upsell.label,
                badge: upsell.badge,
                is_active: upsell.is_active,
                sort_order: upsell.sort_order
            }));
            await supabase.from('upsell_offers').insert(newUpsellsPayload);
        }


        return NextResponse.json({ 
            success: true, 
            product: newProduct,
            debug: {
                variantsProcessed: originalVariants?.length || 0,
                variantErrors: variantErrors.length > 0 ? variantErrors : null
            }
        });

    } catch (error: any) {
        console.error('Error duplicating product:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

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
            if (!nameObj) return { ar: 'نسخة من منتج', en: 'Copy of Product' };
            const parsed = typeof nameObj === 'string' ? JSON.parse(nameObj) : nameObj;
            return {
                ar: `نسخة من ${parsed?.ar || 'منتج'}`,
                en: `Copy of ${parsed?.en || 'Product'}`
            };
        };

        const newProductPayload = {
            store_id: storeId,
            name: JSON.stringify(getDuplicatedName(originalProduct.name)),
            description: originalProduct.description,
            price: originalProduct.price,
            stock_quantity: originalProduct.stock_quantity,
            sku: originalProduct.sku ? `${originalProduct.sku}-COPY` : null,
            images: originalProduct.images,
            status: 'active', // Set as active
            metadata: originalProduct.metadata,
            skip_cart: originalProduct.skip_cart,
            free_shipping: originalProduct.free_shipping,
            fake_countdown_enabled: originalProduct.fake_countdown_enabled,
            fake_countdown_minutes: originalProduct.fake_countdown_minutes,
            fake_visitors_enabled: originalProduct.fake_visitors_enabled,
            fake_visitors_min: originalProduct.fake_visitors_min,
            fake_visitors_max: originalProduct.fake_visitors_max,
            ignore_stock: originalProduct.ignore_stock,
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

        // 4. Duplicate product variants
        const { data: originalVariants } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', productId);

        if (originalVariants && originalVariants.length > 0) {
            for (const variant of originalVariants) {
                const newVariantPayload = {
                    product_id: newProductId,
                    name: variant.name,
                    display_type: variant.display_type,
                    option_type: variant.option_type,
                    required: variant.required,
                    sort_order: variant.sort_order,
                };

                const { data: newVariant, error: vError } = await supabase
                    .from('product_variants')
                    .insert(newVariantPayload)
                    .select()
                    .single();

                if (!vError && newVariant) {
                    // Fetch and duplicate variant options
                    const { data: originalOptions } = await supabase
                        .from('variant_options')
                        .select('*')
                        .eq('variant_id', variant.id);

                    if (originalOptions && originalOptions.length > 0) {
                        const newOptionsPayload = originalOptions.map(opt => ({
                            variant_id: newVariant.id,
                            label: opt.label,
                            value: opt.value,
                            price: opt.price,
                            stock: opt.stock,
                            manage_stock: opt.manage_stock,
                            is_default: opt.is_default,
                            sort_order: opt.sort_order,
                            in_stock: opt.in_stock,
                            sku: opt.sku ? `${opt.sku}-COPY` : null,
                        }));

                        await supabase
                            .from('variant_options')
                            .insert(newOptionsPayload);
                    }
                }
            }
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
            await supabase
                .from('product_categories')
                .insert(newCategoryPayloads);
        }

        // 6. Duplicate upsell offers (both sides where product is the main product)
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


        return NextResponse.json({ success: true, product: newProduct });

    } catch (error: any) {
        console.error('Error duplicating product:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

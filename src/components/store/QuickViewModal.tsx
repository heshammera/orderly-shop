"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { ProductDetail } from '@/components/store/ProductDetail';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function QuickViewModal({
    isOpen,
    onOpenChange,
    productId,
    storeId
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    productId: string;
    storeId: string;
}) {
    const { language } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ product: any, variants: any[], upsellOffers: any[], store: any } | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        const fetchData = async () => {
            setLoading(true);
            try {
                // Determine if storeId is ID or Slug
                let storeQuery = supabase.from('stores').select('*');
                // Simple heuristic: if it's uuid shape, it's ID, otherwise slug.
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId);

                if (isUuid) {
                    storeQuery = storeQuery.eq('id', storeId).single();
                } else {
                    storeQuery = storeQuery.eq('slug', storeId).single();
                }

                const { data: store, error: storeError } = await storeQuery;
                if (!store || storeError) throw new Error('Store not found');

                const [productRes, variantsRes, upsellRes] = await Promise.all([
                    supabase
                        .from('products')
                        .select('*')
                        .eq('id', productId)
                        .single(),
                    supabase
                        .from('product_variants')
                        .select('*, variant_options(*)')
                        .eq('product_id', productId)
                        .order('sort_order'),
                    supabase
                        .from('upsell_offers')
                        .select('*')
                        .eq('product_id', productId)
                        .eq('is_active', true)
                        .order('min_quantity'),
                ]);

                if (!isMounted) return;

                const productData = productRes.data;
                if (!productData) return;

                const parsedProduct = {
                    ...productData,
                    name: typeof productData.name === 'string' ? JSON.parse(productData.name) : productData.name,
                    description: typeof productData.description === 'string' ? JSON.parse(productData.description) : productData.description,
                    images: typeof productData.images === 'string' ? JSON.parse(productData.images) : productData.images,
                };

                const parsedVariants = variantsRes.data?.map((v: any) => ({
                    ...v,
                    name: typeof v.name === 'string' ? JSON.parse(v.name) : v.name,
                    options: (v.variant_options || []).map((o: any) => ({
                        ...o,
                        label: typeof o.label === 'string' ? JSON.parse(o.label) : o.label,
                    })),
                })) || [];

                const parsedUpsells = upsellRes.data?.map((u: any) => ({
                    ...u,
                    label: typeof u.label === 'string' ? JSON.parse(u.label) : u.label,
                    badge: typeof u.badge === 'string' ? JSON.parse(u.badge) : u.badge,
                })) || [];

                const parsedStore = {
                    ...store,
                    name: typeof store.name === 'string' ? JSON.parse(store.name) : store.name,
                };

                setData({
                    product: parsedProduct,
                    variants: parsedVariants,
                    upsellOffers: parsedUpsells,
                    store: parsedStore,
                });
            } catch (error) {
                console.error("Error fetching quick view data", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => { isMounted = false; };
    }, [isOpen, productId, storeId, supabase]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 gap-0 border-none bg-background sm:rounded-2xl">
                <DialogTitle className="sr-only">Quick View</DialogTitle>
                <DialogDescription className="sr-only">Product quick view details</DialogDescription>
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : data ? (
                    <div className="bg-background w-full overflow-hidden">
                        <ProductDetail
                            product={data.product}
                            variants={data.variants}
                            upsellOffers={data.upsellOffers}
                            store={data.store}
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-center p-8 h-64 text-muted-foreground">
                        {language === 'ar' ? 'فشل تحميل المنتج.' : 'Failed to load product.'}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

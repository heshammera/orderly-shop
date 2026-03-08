"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useCheckout } from '@/contexts/CheckoutContext';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export function ProductRecommendations() {
    const { language } = useLanguage();
    const { cart, addToCart } = useCart();
    const { store, formatPrice } = useCheckout();
    const { toast } = useToast();

    const getImageUrl = (imageVal: any) => {
        if (!imageVal) return '';
        if (typeof imageVal === 'string') {
            try {
                const parsed = JSON.parse(imageVal);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
            } catch (e) {
                return imageVal;
            }
        }
        if (Array.isArray(imageVal) && imageVal.length > 0) return imageVal[0];
        return String(imageVal);
    };

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!store?.id) return;

        const fetchRecommendations = async () => {
            const supabase = createClient();
            const cartProductIds = cart.map(item => item.productId);

            let query = supabase
                .from('products')
                .select('id, name, price, images, compare_at_price, max_per_order, quantity')
                .eq('store_id', store.id)
                .eq('status', 'active');

            if (cartProductIds.length > 0) {
                cartProductIds.forEach(id => {
                    query = query.neq('id', id);
                });
            }

            const { data } = await query.limit(3).order('created_at', { ascending: false });

            if (data) {
                const parsedData = data.map(p => {
                    let n = p.name;
                    let i = p.images;
                    try { if (typeof n === 'string') n = JSON.parse(n); } catch (e) { }
                    try { if (typeof i === 'string') i = JSON.parse(i); } catch (e) { }
                    return { ...p, name: n, images: i };
                });
                setProducts(parsedData);
            }
            setLoading(false);
        };

        fetchRecommendations();
    }, [store?.id, cart]);

    const handleAdd = (product: any) => {
        addToCart({
            productId: product.id,
            productName: product.name,
            productImage: getImageUrl(product.images),
            basePrice: product.price,
            unitPrice: product.price,
            quantity: 1,
            maxQuantity: product.max_per_order || product.quantity || 100,
            variants: [],
            addedAt: new Date().toISOString()
        });
        toast({
            title: language === 'ar' ? 'تمت الإضافة للسلة' : 'Added to cart',
        });
    }

    if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;
    if (products.length === 0) return null;

    return (
        <div className="pt-6 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-3">
                {language === 'ar' ? 'قد يعجبك أيضاً' : 'You might also like'}
            </h4>
            <div className="space-y-3">
                {products.map(product => (
                    <div key={product.id} className="flex gap-3 items-center p-2 rounded-lg border border-slate-100 bg-white shadow-sm hover:border-primary/20 transition-all">
                        <div className="w-12 h-12 rounded bg-slate-50 overflow-hidden flex-shrink-0">
                            {product.images && getImageUrl(product.images) && (
                                <img src={getImageUrl(product.images)} alt="" className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="flex-grow min-w-0">
                            <h5 className="text-xs font-semibold truncate leading-tight mb-1">
                                {typeof product.name === 'string' ? product.name : (product.name?.[language] || product.name?.ar)}
                            </h5>
                            <div className="flex items-center gap-1.5 line-clamp-1">
                                <span className="text-xs font-bold text-slate-900">
                                    {formatPrice(product.price)}
                                </span>
                                {product.compare_at_price > product.price && (
                                    <span className="text-[10px] text-slate-400 line-through">
                                        {formatPrice(product.compare_at_price)}
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-full border-slate-200 text-slate-600 flex-shrink-0 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                            onClick={() => handleAdd(product)}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}

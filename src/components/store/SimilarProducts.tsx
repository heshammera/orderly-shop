"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface StoreData {
    id: string;
    slug: string;
    currency: string;
}

interface SimilarProductsProps {
    store: StoreData;
    productId: string;
    categoryId?: string;
}

export function SimilarProducts({ store, productId, categoryId }: SimilarProductsProps) {
    const { language } = useLanguage();
    const { addToCart } = useCart();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSimilar = async () => {
            try {
                // Fetch products in the same category, excluding the current product
                let url = `/api/store/search?storeId=${store.id}&limit=4`;
                if (categoryId) {
                    url += `&category=${categoryId}`;
                }

                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data.products.filter((p: any) => p.id !== productId).slice(0, 4));
                }
            } catch (error) {
                console.error("Failed to fetch similar products:", error);
            } finally {
                setLoading(false);
            }
        };

        if (store.id) {
            fetchSimilar();
        }
    }, [store.id, productId, categoryId]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (products.length === 0) return null;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
            style: 'currency',
            currency: store.currency,
        }).format(price);
    };

    return (
        <section className="mt-16 border-t pt-12">
            <h2 className="text-2xl font-bold mb-8">
                {language === 'ar' ? 'قد يعجبك أيضاً' : 'You May Also Like'}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                    <div key={product.id} className="group">
                        <Link href={`/s/${store.slug}/p/${product.id}`} className="block h-full cursor-pointer">
                            <Card className="overflow-hidden hover:shadow-lg transition-all h-full flex flex-col border border-gray-100">
                                <CardContent className="p-0 flex flex-col h-full">
                                    <div className="aspect-square bg-muted relative overflow-hidden flex-shrink-0">
                                        {product.images?.length > 0 ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name[language] || product.name.ar}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                                <span className="text-4xl font-bold text-primary/20">
                                                    {(product.name[language] || product.name.ar || '').charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                        {product.compare_at_price && product.compare_at_price > product.price && (
                                            <Badge className="absolute top-2 start-2 bg-destructive border-none shadow-sm">
                                                {language === 'ar' ? 'تخفيض' : 'Sale'}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="p-4 flex flex-col flex-grow">
                                        <h3 className="font-medium text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                            {product.name[language] || product.name.ar}
                                        </h3>
                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-primary font-mono text-base">
                                                    {formatPrice(product.price)}
                                                </span>
                                                {product.compare_at_price && product.compare_at_price > product.price && (
                                                    <span className="text-xs text-muted-foreground line-through font-mono">
                                                        {formatPrice(product.compare_at_price)}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    addToCart({
                                                        productId: product.id,
                                                        productName: product.name,
                                                        productImage: product.images?.[0] || null,
                                                        basePrice: product.price,
                                                        unitPrice: product.price,
                                                        quantity: 1,
                                                        variants: [],
                                                        addedAt: new Date().toISOString()
                                                    });
                                                }}
                                                className="bg-gray-100 hover:bg-primary text-gray-800 hover:text-white p-2 rounded-full transition-colors flex-shrink-0"
                                                title={language === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                ))}
            </div>
        </section>
    );
}

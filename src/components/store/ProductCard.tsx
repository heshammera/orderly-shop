"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Eye, Loader2, Star } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { QuickViewModal } from './QuickViewModal';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductCardProps {
    product: any;
    storeId: string; // Or storeSlug
}

export function ProductCard({ product, storeId }: ProductCardProps) {
    const { language } = useLanguage();
    const { addToCart } = useCart();
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    // Helper to safer parse JSON names
    const getName = (json: any) => {
        if (typeof json === 'string') {
            try {
                const parsed = JSON.parse(json);
                return parsed.en || parsed.ar || json;
            } catch { return json; }
        }
        return json?.en || json?.ar || 'Unknown Product';
    };

    const name = getName(product.name);
    const images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
    const image = images?.[0] || '/placeholder-product.jpg';

    // Simple Add To Cart. If there are variants required, we better open QuickView.
    // Since we don't know the variants here, we just open QuickView for now on AddToCart click
    // to guarantee all required options are selected properly.
    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsQuickViewOpen(true);
    };

    const handleQuickViewClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsQuickViewOpen(true);
    };

    return (
        <>
            <div className="group relative border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all bg-white dark:bg-card flex flex-col h-full">
                <Link href={`/s/${storeId}/p/${product.id}`} className="block aspect-square relative overflow-hidden bg-gray-100 dark:bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={image}
                        alt={name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Quick View Overlay (Hover) */}
                    <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="pointer-events-auto rounded-full shadow-lg bg-background/90 backdrop-blur-sm hover:bg-background hover:scale-105 transition-all w-10 h-10 p-0"
                            onClick={handleQuickViewClick}
                            title={language === 'ar' ? 'معاينة سريعة' : 'Quick View'}
                        >
                            <Eye className="w-4 h-4" />
                        </Button>
                    </div>
                </Link>

                <div className="p-4 flex flex-col flex-grow">
                    <Link href={`/s/${storeId}/p/${product.id}`} className="hover:underline">
                        <h3 className="font-semibold text-sm md:text-base line-clamp-1 mb-1">{name}</h3>
                    </Link>

                    {Number(product.average_rating) > 0 && (
                        <div className="flex items-center gap-1 mb-2 mt-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-medium">{Number(product.average_rating).toFixed(1)}</span>
                            <span className="text-[10px] text-muted-foreground ms-1">({product.reviews_count || 0})</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-4 gap-2">
                        <div className="flex flex-col">
                            <p className="font-bold text-base md:text-lg text-primary leading-tight">
                                {product.sale_price || product.price} {product.currency || 'USD'}
                            </p>
                            {product.compare_at_price > (product.sale_price || product.price) && (
                                <p className="text-xs text-muted-foreground line-through">
                                    {product.compare_at_price} {product.currency || 'USD'}
                                </p>
                            )}
                        </div>
                        <Button
                            size="sm"
                            variant="default"
                            className="rounded-full shadow-md hover:scale-105 transition-transform flex-shrink-0"
                            onClick={handleQuickAdd}
                        >
                            <ShoppingCart className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">{language === 'ar' ? 'أضف للسلة' : 'Add'}</span>
                        </Button>
                    </div>
                </div>
            </div>

            {isQuickViewOpen && (
                <QuickViewModal
                    isOpen={isQuickViewOpen}
                    onOpenChange={setIsQuickViewOpen}
                    productId={product.id}
                    storeId={storeId}
                />
            )}
        </>
    );
}

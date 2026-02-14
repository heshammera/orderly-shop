"use client";

import { useEffect, useState } from 'react';
import { ComponentSchema } from '@/lib/store-builder/types';
import { createClient } from '@/lib/supabase/client';
// import { ProductCard } from '@/components/store/ProductCard'; // Removed unused import
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

export function ProductGrid({ data, storeId, storeCurrency, storeSlug, isEditable = false, onUpdate }: { data: ComponentSchema, storeId: string, storeCurrency?: string, storeSlug?: string, isEditable?: boolean, onUpdate?: (id: string, content: any) => void }) {
    const { settings, content, id } = data;
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const { language, t } = useLanguage();

    useEffect(() => {
        const fetchProducts = async () => {
            // In a real generic engine, this fetching logic might be centralized or server-side
            // For now, client-side fetch is fine for interaction
            let query = supabase
                .from('products')
                .select('*')
                .eq('store_id', storeId)
                .eq('status', 'active');

            if (settings.categoryId && settings.categoryId !== 'all') {
                query = query.eq('category_id', settings.categoryId);
            }

            const { data: fetchedProducts } = await query
                .limit(settings.limit || 8)
                .order('created_at', { ascending: false });

            setProducts(fetchedProducts || []);
            setLoading(false);
        };

        if (storeId) fetchProducts();
    }, [storeId, settings.limit, settings.categoryId]);

    const gridStyle = settings.style || 'cards';

    const getText = (field: any) => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        return field[language] || field.en || '';
    };

    const handleUpdate = (field: string, value: any) => {
        if (!onUpdate) return;
        let newVal = value;
        const currentVal = content[field];
        if (typeof currentVal === 'object' && currentVal !== null) {
            newVal = { ...currentVal, [language]: value };
        }
        onUpdate(id, { [field]: newVal });
    };

    return (
        <section className="py-16 container px-4" id="products">
            <div className="text-center mb-12">
                <h2
                    className={`text-3xl font-bold mb-4 ${isEditable ? 'outline-dashed outline-2 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(e) => handleUpdate('title', e.currentTarget.textContent || '')}
                >
                    {getText(content.title)}
                </h2>
                {content.subtitle && (
                    <p
                        className={`text-muted-foreground text-lg ${isEditable ? 'outline-dashed outline-2 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                        contentEditable={isEditable}
                        suppressContentEditableWarning
                        onBlur={(e) => handleUpdate('subtitle', e.currentTarget.textContent || '')}
                    >
                        {getText(content.subtitle)}
                    </p>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
            ) : products.length > 0 ? (
                <div className={
                    gridStyle === 'list'
                        ? "grid grid-cols-1 gap-6 max-w-4xl mx-auto"
                        : `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${settings.columns || 4} gap-6`
                }>
                    {products.map((product) => {
                        let name = 'Product';
                        try {
                            if (typeof product.name === 'string') {
                                if (product.name.startsWith('{')) {
                                    const parsedName = JSON.parse(product.name);
                                    name = parsedName[language] || parsedName.en || 'Product';
                                } else {
                                    name = product.name;
                                }
                            } else if (typeof product.name === 'object') {
                                name = product.name[language] || product.name.en || 'Product';
                            }
                        } catch (e) {
                            console.error('Error parsing product name:', e);
                            name = 'Product';
                        }

                        const currencyResult = product.currency || storeCurrency || 'SAR';
                        const price = `${product.price} ${currencyResult}`;

                        let image = '/placeholder-product.jpg';
                        try {
                            if (product.images) {
                                if (typeof product.images === 'string') {
                                    if (product.images.trim().startsWith('[')) {
                                        const parsedImages = JSON.parse(product.images);
                                        image = parsedImages[0] || image;
                                    } else {
                                        image = product.images;
                                    }
                                } else if (Array.isArray(product.images)) {
                                    image = product.images[0] || image;
                                }
                            }
                        } catch (e) {
                            console.error('Error parsing product image:', e);
                        }

                        if (gridStyle === 'list') {
                            return (
                                <div key={product.id} className="group flex gap-6 items-center border rounded-xl p-4 hover:shadow-lg transition-all bg-white">
                                    <div className="w-32 h-32 relative overflow-hidden rounded-lg bg-gray-100 flex-shrink-0">
                                        <Image
                                            src={image}
                                            alt={name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform"
                                            sizes="(max-width: 768px) 100vw, 128px"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-xl mb-1">{name}</h3>
                                        <p className="text-primary font-bold text-lg mb-4">{price}</p>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/s/${storeSlug || storeId}/p/${product.id}`}>{(t as any).store?.viewDetails || 'View Details'}</Link>
                                        </Button>
                                    </div>
                                </div>
                            );
                        }

                        if (gridStyle === 'minimal') {
                            return (
                                <Link
                                    key={product.id}
                                    href={`/s/${storeSlug || storeId}/p/${product.id}`}
                                    className="group cursor-pointer block"
                                >
                                    <div className="aspect-square relative overflow-hidden rounded-md bg-gray-100 mb-3">
                                        <Image
                                            src={image}
                                            alt={name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    </div>
                                    <h3 className="font-medium text-base leading-tight group-hover:underline">{name}</h3>
                                    <p className="text-muted-foreground mt-1">{price}</p>
                                </Link>
                            );
                        }

                        // Default 'cards'
                        return (
                            <div key={product.id} className="group relative border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all bg-white">
                                <div className="aspect-square relative overflow-hidden bg-gray-100">
                                    <Image
                                        src={image}
                                        alt={name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-lg line-clamp-1">{name}</h3>
                                    <p className="text-primary font-bold mt-2">{price}</p>
                                    <Button className="w-full mt-4" variant="outline" asChild>
                                        <Link href={`/s/${storeSlug || storeId}/p/${product.id}`}>{(t as any).store?.viewDetails || 'View Details'}</Link>
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                    <p className="text-muted-foreground">{(t as any).store?.noProducts || 'No products found in this collection.'}</p>
                </div>
            )}
        </section>
    );
}

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
        <section className="py-20 lg:py-28 container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="products">
            <div className="text-center mb-16 max-w-3xl mx-auto">
                <h2
                    className={`text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 mb-4 ${isEditable ? 'outline-dashed outline-2 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(e) => handleUpdate('title', e.currentTarget.textContent || '')}
                >
                    {getText(content.title)}
                </h2>
                {content.subtitle && (
                    <p
                        className={`text-lg md:text-xl text-gray-500 dark:text-gray-400 ${isEditable ? 'outline-dashed outline-2 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
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
                                    <div className="aspect-[4/5] relative overflow-hidden rounded-2xl bg-gray-50 mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                                        <Image
                                            src={image}
                                            alt={name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                                    </div>
                                    <h3 className="font-semibold text-lg text-gray-900 tracking-tight group-hover:text-primary transition-colors">{name}</h3>
                                    <p className="text-gray-500 font-medium mt-1">{price}</p>
                                </Link>
                            );
                        }

                        // Default 'cards'
                        return (
                            <div key={product.id} className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <Link href={`/s/${storeSlug || storeId}/p/${product.id}`} className="block aspect-[4/5] relative overflow-hidden bg-gray-50">
                                    <Image
                                        src={image}
                                        alt={name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                                </Link>
                                <div className="p-5 sm:p-6 flex flex-col flex-1">
                                    <Link href={`/s/${storeSlug || storeId}/p/${product.id}`} className="block mb-2">
                                        <h3 className="font-bold text-xl text-gray-900 line-clamp-2 hover:text-primary transition-colors tracking-tight">{name}</h3>
                                    </Link>
                                    <p className="text-primary font-extrabold text-lg mt-auto mb-4">{price}</p>
                                    <Button className="w-full font-semibold rounded-xl bg-gray-900 text-white hover:bg-primary hover:text-primary-foreground transition-colors shadow-none hover:shadow-lg" asChild>
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

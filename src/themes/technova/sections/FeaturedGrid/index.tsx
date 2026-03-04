import React from 'react';
import Link from 'next/link';
import InlineEditableText from '@/components/ThemeEngine/InlineEditableText';

interface ProductSnippet {
    id: string;
    handle: string;
    title: string;
    price: string;
    image: string;
    href?: string;
}

interface FeaturedGridProps {
    settings: {
        heading?: string;
        subheading?: string;
    };
    blocks: {
        type: 'product';
        settings: {
            product_id: string;
        };
    }[];
    storeContext?: any;
    sectionId?: string;
}

function ProductCard({ item }: { item: ProductSnippet }) {
    return (
        <div className="group relative rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Link href={item.href || `/product/${item.handle}`} className="block">
                {/* Image */}
                <div className="aspect-square overflow-hidden relative">
                    <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(0deg, rgba(10,10,26,0.8) 0%, transparent 50%)' }}></div>
                </div>

                {/* Info */}
                <div className="p-4">
                    <h3 className="text-white font-semibold text-sm mb-2 line-clamp-1 group-hover:text-cyan-400 transition-colors">{item.title}</h3>
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-black" style={{ color: '#00d4ff' }}>{item.price}</span>
                        <button className="px-4 py-2 rounded-full text-xs font-bold text-white transition-all opacity-80 group-hover:opacity-100" style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
                            أضف للسلة
                        </button>
                    </div>
                </div>
            </Link>

            {/* Hover Glow */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(0,212,255,0.1)' }}></div>
        </div>
    );
}

export default function FeaturedGrid({ settings, blocks, storeContext, sectionId = 'featured_grid_1' }: FeaturedGridProps) {
    const storeIdentifier = storeContext?.store?.slug || storeContext?.storeData?.slug || storeContext?.slug || storeContext?.id || '';
    const baseUrl = storeIdentifier ? `/s/${storeIdentifier}/p` : '/product';
    const currency = storeContext?.store?.currency || storeContext?.storeData?.currency || storeContext?.currency || 'SAR';

    const mockProducts: ProductSnippet[] = [
        { id: 'prod_1', handle: 'product-1', title: 'iPhone 16 Pro Max', price: `4,999 ${currency}`, image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80' },
        { id: 'prod_2', handle: 'product-2', title: 'MacBook Pro M4', price: `8,999 ${currency}`, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80' },
        { id: 'prod_3', handle: 'product-3', title: 'Sony WH-1000XM5', price: `1,299 ${currency}`, image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80' },
        { id: 'prod_4', handle: 'product-4', title: 'Apple Watch Ultra 2', price: `3,199 ${currency}`, image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&q=80' },
    ];

    const realProducts = storeContext?.products || [];

    const formatProduct = (p: any): ProductSnippet => {
        let title = p.name;
        try {
            if (typeof p.name === 'string' && p.name.startsWith('{')) {
                const parsed = JSON.parse(p.name);
                title = parsed.ar || parsed.en || p.name;
            } else if (typeof p.name === 'object') {
                title = p.name.ar || p.name.en || 'Unnamed';
            }
        } catch (e) { }

        let image = 'https://via.placeholder.com/600';
        try {
            const parsedImages = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
            if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                image = parsedImages[0];
            }
        } catch (e) { }

        return {
            id: p.id,
            handle: p.id,
            title,
            price: `${p.sale_price || p.price || 0} ${currency}`,
            image,
            href: `${baseUrl}/${p.id}`
        };
    };

    const products = blocks?.length > 0
        ? blocks.map((b, idx) => {
            const realFound = realProducts.find((p: any) => p.id === b.settings?.product_id);
            if (realFound) return formatProduct(realFound);

            const mockFound = mockProducts.find(p => p.id === b.settings?.product_id);
            // Fallback to the mock product at the same index if no ID is provided or product not found
            const fallback = mockFound || mockProducts[idx % mockProducts.length];
            return { ...fallback, href: `${baseUrl}/${fallback.handle}` };
        })
        : mockProducts.map(p => ({ ...p, href: `${baseUrl}/${p.handle}` }));

    if (!products || products.length === 0) return null;

    return (
        <section className="py-20 px-4" style={{ background: '#0d0d20' }}>
            <div className="container mx-auto">
                {settings.heading && (
                    <div className="mb-12 text-center">
                        <InlineEditableText
                            as="h2"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-3xl md:text-4xl font-bold text-white inline-block"
                        />
                        {settings.subheading && (
                            <div className="mt-3">
                                <InlineEditableText
                                    as="p"
                                    sectionId={sectionId}
                                    settingId="subheading"
                                    value={settings.subheading}
                                    className="text-gray-500 text-lg"
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map((item, index) => (
                        <ProductCard key={index} item={item} />
                    ))}
                </div>
            </div>
        </section>
    );
}

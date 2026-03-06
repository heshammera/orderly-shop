import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import InlineEditableText from '@/components/ThemeEngine/InlineEditableText';
import { QuickViewModal } from '@/components/store/QuickViewModal';
import { Eye, ShoppingCart } from 'lucide-react';


// Helper interface
interface ProductSnippet {
    id: string;
    handle: string;
    title: string;
    price: string;
    image: string;
    category?: string;
    compareAtPrice?: string;
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

function ProductCard({ item, storeId }: { item: ProductSnippet, storeId: string }) {
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    const handleQuickAction = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsQuickViewOpen(true);
    };
    return (
        <div className="w-full sm:w-1/2 lg:w-1/4 px-4 mb-8">
            <div className="bg-white p-3 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 group">
                <Link href={item.href || `/product/${item.handle}`} className="block relative overflow-hidden rounded-lg mb-4 aspect-[4/5] bg-gray-50">
                    <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                </Link>
                <div className="px-1 text-left rtl:text-right">
                    <Link href={item.href || `/product/${item.handle}`} className="text-lg font-bold text-gray-900 mb-1 hover:text-primary transition-colors line-clamp-1 block">
                        {item.title}
                    </Link>
                    <p className="text-sm text-gray-500 mb-3">{item.category || 'Women, Fashion'}</p>
                    <div className="flex items-center mb-4 gap-2">
                        <span className="text-xl font-black text-primary">{item.price}</span>
                        {item.compareAtPrice && (
                            <span className="text-sm line-through text-gray-400">{item.compareAtPrice}</span>
                        )}
                    </div>
                    <button className="bg-primary hover:bg-transparent text-white hover:text-primary py-2.5 px-4 rounded-full w-full font-bold transition-all border-2 border-primary">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function FeaturedGrid({ settings, blocks, storeContext, sectionId = 'featured_grid_1' }: FeaturedGridProps) {
    const storeIdentifier = storeContext?.store?.slug || storeContext?.storeData?.slug || storeContext?.slug || storeContext?.id || '';
    const baseUrl = storeIdentifier ? `/s/${storeIdentifier}/p` : '/product';
    const currency = storeContext?.store?.currency || storeContext?.storeData?.currency || storeContext?.currency || 'SAR';

    const mockProducts: ProductSnippet[] = [
        { id: 'prod_1', handle: 'product-1', title: 'Summer Black Dress', price: '$19.99', compareAtPrice: '$24.99', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80', category: 'Women' },
        { id: 'prod_2', handle: 'product-2', title: 'Black Suit', price: '$29.99', image: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400&q=80', category: 'Women' },
        { id: 'prod_3', handle: 'product-3', title: 'Black Long Dress', price: '$15.99', compareAtPrice: '$19.99', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&q=80', category: 'Women, Accessories' },
        { id: 'prod_4', handle: 'product-4', title: 'Black Leather Jacket', price: '$39.99', compareAtPrice: '$49.99', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80', category: 'Women' },
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
        <section className="py-16 bg-gray-50/50">
            <div className="container mx-auto px-4">
                {settings.heading && (
                    <div className="mb-10 text-left rtl:text-right">
                        <InlineEditableText
                            as="h2"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-3xl font-extrabold text-gray-900 inline-block relative border-b-4 border-primary pb-2"
                        />
                        {settings.subheading && (
                            <div className="mt-4 text-gray-500 text-lg">
                                <InlineEditableText
                                    as="p"
                                    sectionId={sectionId}
                                    settingId="subheading"
                                    value={settings.subheading}
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap -mx-4 justify-center md:justify-start">
                    {products.slice(0, Math.max(4, products.length)).map((item, index) => (
                        <ProductCard key={index} item={item} storeId={storeIdentifier} />
                    ))}
                </div>
            </div>
        </section>
    );
}

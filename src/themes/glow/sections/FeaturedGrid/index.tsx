import React from 'react';
import Link from 'next/link';
import InlineEditableText from '@/components/ThemeEngine/InlineEditableText';

// Helper interface
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
            product_id: string; // The ID of the product chosen in the customizer
        };
    }[];
    storeContext?: any; // To access dynamic data like translated strings
    sectionId?: string; // ID for inline editing
}

// Dummy GridTileImage snippet (will be extracted properly later)
function GridTileImage({ src, alt, label }: any) {
    return (
        <div className="relative h-full w-full bg-white overflow-hidden group shadow-[0_5px_15px_rgba(0,0,0,0.03)] border border-stone-100 transition-all duration-700 hover:shadow-[0_20px_40px_rgba(224,175,160,0.2)]">
            <img src={src} alt={alt} className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#fff5f5]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            {label && (
                <div className="absolute bottom-0 left-0 w-full p-6 translate-y-4 group-hover:translate-y-0 transition-all duration-700 opacity-0 group-hover:opacity-100">
                    <div className="bg-white/80 backdrop-blur-lg p-5 rounded-2xl border border-white/50 shadow-xl">
                        <h3 className="font-bold text-stone-800 text-sm mb-1">{label.title}</h3>
                        <span className="text-[#e0afa0] text-xs font-black tracking-widest uppercase">{label.amount}</span>
                    </div>
                </div>
            )}
        </div>
    )
}

function GridItem({ item, size }: { item: ProductSnippet, size: 'full' | 'half' }) {
    return (
        <div
            className={`
            ${size === "full" ? "md:col-span-3 md:row-span-2" : "md:col-span-3 md:row-span-1"}
            w-full
          `}
        >
            <Link
                className="relative block aspect-[4/5] md:aspect-auto h-full w-full"
                href={item.href || `/product/${item.handle}`}
                prefetch={true}
            >
                <GridTileImage
                    src={item.image}
                    alt={item.title}
                    label={{
                        title: item.title,
                        amount: item.price,
                    }}
                />
            </Link>
        </div>
    );
}

export default function FeaturedGrid({ settings, blocks, storeContext, sectionId = 'featured_grid_1' }: FeaturedGridProps) {
    const storeIdentifier = storeContext?.store?.slug || storeContext?.storeData?.slug || storeContext?.slug || storeContext?.id || '';
    const baseUrl = storeIdentifier ? `/s/${storeIdentifier}/p` : '/product';
    const currency = storeContext?.store?.currency || storeContext?.storeData?.currency || storeContext?.currency || 'SAR';

    const mockProducts: ProductSnippet[] = [
        { id: 'prod_1', handle: 'product-1', title: 'سيروم النضارة الفائق', price: `180 ${currency}`, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80' },
        { id: 'prod_2', handle: 'product-2', title: 'مرطب الشفاه الوردي', price: `45 ${currency}`, image: 'https://images.unsplash.com/photo-1599733594230-6b823276abcc?w=600&q=80' },
        { id: 'prod_3', handle: 'product-3', title: 'قناع الطين الطبيعي', price: `120 ${currency}`, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80' },
        { id: 'prod_4', handle: 'product-4', title: 'عطر الزهور البرية', price: `299 ${currency}`, image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80' },
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
        <section className="bg-white py-32">
            <div className="mx-auto w-full max-w-7xl px-4">
                {settings.heading && (
                    <div className="mb-20 text-center space-y-4">
                        <span className="text-[#e0afa0] tracking-[0.4em] text-[10px] uppercase font-black">Exclusive Selection</span>
                        <InlineEditableText
                            as="h2"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-4xl md:text-6xl font-light text-stone-800 tracking-tight italic"
                        />
                        {settings.subheading && (
                            <div className="mt-4 text-stone-500 font-medium max-w-2xl mx-auto">
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

                <div className="grid grid-cols-1 md:grid-cols-6 gap-8 md:h-[900px]">
                    {products[0] && <GridItem size="full" item={products[0]} />}
                    <div className="md:col-span-3 grid grid-cols-1 gap-8">
                        {products[1] && <GridItem size="half" item={products[1]} />}
                        {products[2] && <GridItem size="half" item={products[2]} />}
                    </div>
                </div>
            </div>
        </section>
    );
}

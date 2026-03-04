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
        <div className="relative h-full w-full bg-[#f9fbf9] overflow-hidden group border border-[#ecf3ec] rounded-2xl transition-all duration-500 hover:shadow-[0_20px_40px_rgba(82,183,136,0.1)]">
            <img src={src} alt={alt} className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            {label && (
                <div className="absolute top-4 left-4">
                    <span className="bg-[#52b788] text-white px-4 py-1 rounded-full text-xs font-black shadow-lg">
                        {label.amount}
                    </span>
                </div>
            )}
            {label && (
                <div className="absolute bottom-6 left-6 right-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="font-black text-[#1b4332] text-xl tracking-tight bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-xl inline-block">
                        {label.title}
                    </h3>
                </div>
            )}
        </div>
    )
}

function GridItem({ item, size }: { item: ProductSnippet, size: 'full' | 'half' }) {
    return (
        <div
            className={`
            ${size === "full" ? "md:col-span-4 md:row-span-2" : "md:col-span-2 md:row-span-1"}
            w-full
          `}
        >
            <Link
                className="relative block aspect-square h-full w-full"
                href={`/product/${item.handle}`}
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
    const mockProducts: ProductSnippet[] = [
        { id: 'prod_1', handle: 'product-1', title: 'سلة الخضروات العضوية', price: '120 SAR', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80' },
        { id: 'prod_2', handle: 'product-2', title: 'فواكه موسمية طازجة', price: '85 SAR', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80' },
        { id: 'prod_3', handle: 'product-3', title: 'عسل جبلي طبيعي', price: '150 SAR', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80' },
        { id: 'prod_4', handle: 'product-4', title: 'زيت زيتون بكر', price: '75 SAR', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbadcbaf?w=600&q=80' },
    ];

    const products = blocks?.length > 0
        ? blocks.map((b, idx) => {
            const found = mockProducts.find(p => p.id === b.settings?.product_id);
            // Fallback to the mock product at the same index if no ID is provided or product not found
            return found || mockProducts[idx % mockProducts.length];
        })
        : mockProducts;

    if (!products || products.length < 3) return null;

    return (
        <section className="bg-white py-24">
            <div className="mx-auto w-full max-w-7xl px-4">
                {settings.heading && (
                    <div className="mb-20 text-center space-y-4">
                        <InlineEditableText
                            as="h2"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-5xl md:text-6xl font-black text-[#1b4332] tracking-tighter"
                        />
                        {settings.subheading && (
                            <div className="text-[#52b788] font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-4">
                                <div className="h-px w-8 bg-[#52b788]/30"></div>
                                <InlineEditableText
                                    as="p"
                                    sectionId={sectionId}
                                    settingId="subheading"
                                    value={settings.subheading}
                                />
                                <div className="h-px w-8 bg-[#52b788]/30"></div>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-6 gap-8 h-auto md:h-[min(80vh,800px)]">
                    {products[0] && <GridItem size="full" item={products[0]} />}
                    {products[1] && <GridItem size="half" item={products[1]} />}
                    {products[2] && <GridItem size="half" item={products[2]} />}
                </div>
            </div>
        </section>
    );
}

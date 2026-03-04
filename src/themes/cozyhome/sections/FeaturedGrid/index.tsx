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
        <div className="relative h-full w-full bg-[#fdfaf6] overflow-hidden group rounded-[2rem] border-4 border-white shadow-soft">
            <img src={src} alt={alt} className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute inset-0 bg-stone-900/5 group-hover:bg-transparent transition-colors duration-500"></div>
            {label && (
                <div className={`absolute bottom-0 w-full p-4 md:p-6`}>
                    <div className="bg-white/40 backdrop-blur-xl border border-white/30 text-stone-900 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 transform transition-all duration-500 group-hover:translate-y-[-8px]">
                        <div>
                            <h3 className="font-bold text-sm md:text-base leading-none mb-1">{label.title}</h3>
                            <p className="text-stone-600 text-[10px] md:text-xs">تصميم عصري مريح</p>
                        </div>
                        <span className="bg-stone-900 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-lg">{label.amount}</span>
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
            w-full group
          `}
        >
            <Link
                className="relative block aspect-[4/5] md:aspect-auto h-full w-full"
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
        { id: 'prod_1', handle: 'product-1', title: 'كنبة مخملية خضراء', price: '3,200 SAR', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80' },
        { id: 'prod_2', handle: 'product-2', title: 'طاولة خشبية بسيطة', price: '850 SAR', image: 'https://images.unsplash.com/photo-1581641033102-4f361ea335f6?w=600&q=80' },
        { id: 'prod_3', handle: 'product-3', title: 'كرسي القراءة المريح', price: '540 SAR', image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&q=80' },
        { id: 'prod_4', handle: 'product-4', title: 'مصباح أرضي مودرن', price: '290 SAR', image: 'https://images.unsplash.com/photo-1507473885765-e6ed03a2748e?w=600&q=80' },
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
        <section className="bg-[#faf9f6]/50 py-20">
            <div className="mx-auto w-full max-w-7xl px-4">
                {settings.heading && (
                    <div className="mb-12 text-center">
                        <InlineEditableText
                            as="h2"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-3xl md:text-5xl font-bold tracking-tight text-stone-900 inline-block mb-3"
                        />
                        {settings.subheading && (
                            <div className="text-stone-500 text-lg max-w-2xl mx-auto font-medium">
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

                <div className="grid grid-cols-1 md:grid-cols-6 gap-6 md:h-[700px]">
                    {products[0] && <GridItem size="full" item={products[0]} />}
                    <div className="md:col-span-3 grid grid-cols-1 gap-6 md:h-full">
                        {products[1] && <GridItem size="half" item={products[1]} />}
                        {products[2] && <GridItem size="half" item={products[2]} />}
                    </div>
                </div>
            </div>
        </section>
    );
}

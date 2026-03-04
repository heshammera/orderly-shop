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
        <div className="relative h-full w-full bg-zinc-900 overflow-hidden group border border-zinc-800 transition-all duration-300">
            <img src={src} alt={alt} className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110 brightness-75 group-hover:brightness-100" />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {label && (
                <div className="absolute top-0 right-0 p-4">
                    <span className="bg-blue-600 text-white px-3 py-1 font-black skew-x-[-15deg] inline-block shadow-[4px_4px_0_rgba(0,0,0,1)]">
                        <span className="skew-x-[15deg] block">{label.amount}</span>
                    </span>
                </div>
            )}
            {label && (
                <div className="absolute bottom-4 left-4 right-4">
                    <div className="h-1 w-0 bg-blue-600 group-hover:w-full transition-all duration-500 mb-2"></div>
                    <h3 className="font-black text-white uppercase italic tracking-tighter text-lg">{label.title}</h3>
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
            w-full shadow-2xl transition-all duration-300 hover:z-10 hover:scale-[1.02]
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
        { id: 'prod_1', handle: 'product-1', title: 'حذاء الجري الاحترافي', price: '450 SAR', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80' },
        { id: 'prod_2', handle: 'product-2', title: 'ساعة ذكية رياضية Pro', price: '899 SAR', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80' },
        { id: 'prod_3', handle: 'product-3', title: 'حقيبة تدريب ليلية', price: '190 SAR', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80' },
        { id: 'prod_4', handle: 'product-4', title: 'زجاجة مياه ذكية', price: '95 SAR', image: 'https://images.unsplash.com/photo-1602143307185-838712502674?w=600&q=80' },
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
        <section className="bg-black py-24">
            <div className="mx-auto w-full max-w-7xl px-4">
                {settings.heading && (
                    <div className="mb-16 flex flex-col md:flex-row items-baseline gap-6 border-b border-zinc-900 pb-8">
                        <InlineEditableText
                            as="h2"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter"
                        />
                        {settings.subheading && (
                            <div className="text-zinc-500 font-bold uppercase tracking-widest text-sm">
                                <InlineEditableText
                                    as="p"
                                    sectionId={sectionId}
                                    settingId="subheading"
                                    value={settings.subheading}
                                />
                            </div>
                        )}
                        <div className="flex-1"></div>
                        <div className="h-0.5 w-32 bg-blue-600 hidden md:block"></div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-6 gap-6 h-auto md:h-[min(80vh,800px)]">
                    {products[0] && <GridItem size="full" item={products[0]} />}
                    {products[1] && <GridItem size="half" item={products[1]} />}
                    {products[2] && <GridItem size="half" item={products[2]} />}
                </div>
            </div>
        </section>
    );
}

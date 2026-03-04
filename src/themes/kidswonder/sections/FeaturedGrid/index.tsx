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
function GridTileImage({ src, alt, label, colorClass }: any) {
    return (
        <div className={`relative h-full w-full bg-white overflow-hidden group border-4 ${colorClass} rounded-[2.5rem] shadow-xl transition-all duration-500 hover:scale-[1.02] hover:-rotate-1`}>
            <img src={src} alt={alt} className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            {label && (
                <div className="absolute top-6 left-6">
                    <span className={`bg-white ${colorClass.replace('border-', 'text-')} px-5 py-2 rounded-full text-sm font-black shadow-xl border-2 ${colorClass}`}>
                        {label.amount}
                    </span>
                </div>
            )}
            {label && (
                <div className="absolute bottom-8 left-8 right-8 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                    <h3 className="font-black text-white text-2xl tracking-tight drop-shadow-lg">
                        {label.title}
                    </h3>
                </div>
            )}
        </div>
    )
}

function GridItem({ item, size, index }: { item: ProductSnippet, size: 'full' | 'half', index: number }) {
    const colors = ['border-[#ff6b6b]', 'border-[#ffbe0b]', 'border-[#00b4d8]', 'border-[#ffafcc]', 'border-[#cdb4db]'];
    const colorClass = colors[index % colors.length];

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
                    colorClass={colorClass}
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
        { id: 'prod_1', handle: 'product-1', title: 'مجموعة بناء القصر التعليمية', price: '250 SAR', image: 'https://images.unsplash.com/photo-1585366119957-e556f24975af?w=800&q=80' },
        { id: 'prod_2', handle: 'product-2', title: 'دب تيدي ناعم وكبير', price: '120 SAR', image: 'https://images.unsplash.com/photo-1559411933-7286395fb7eb?w=600&q=80' },
        { id: 'prod_3', handle: 'product-3', title: 'سيارة دفع رباعي لاسلكية', price: '180 SAR', image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&q=80' },
        { id: 'prod_4', handle: 'product-4', title: 'مكعبات ملونة للأطفال', price: '65 SAR', image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80' },
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
        <section className="bg-[#fffcf2] py-24 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-10 left-10 w-20 h-20 bg-[#ff6b6b]/5 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-[#00b4d8]/5 rounded-full blur-xl"></div>

            <div className="mx-auto w-full max-w-7xl px-4 relative z-10">
                {settings.heading && (
                    <div className="mb-20 text-center space-y-4">
                        <div className="inline-block bg-[#ffbe0b] text-white px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg rotate-1">
                            Discovery Zone
                        </div>
                        <InlineEditableText
                            as="h2"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-5xl md:text-7xl font-black text-[#ff6b6b] tracking-tight leading-none"
                        />
                        {settings.subheading && (
                            <InlineEditableText
                                as="p"
                                sectionId={sectionId}
                                settingId="subheading"
                                value={settings.subheading}
                                className="text-xl text-[#ffbe0b] font-black max-w-2xl mx-auto"
                            />
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-6 gap-10 h-auto md:h-[min(90vh,900px)]">
                    {products[0] && <GridItem index={0} size="full" item={products[0]} />}
                    {products[1] && <GridItem index={1} size="half" item={products[1]} />}
                    {products[2] && <GridItem index={2} size="half" item={products[2]} />}
                </div>
            </div>
        </section>
    );
}

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import InlineEditableText from '@/components/ThemeEngine/InlineEditableText';
import { QuickViewModal } from '@/components/store/QuickViewModal';
import { Eye } from 'lucide-react';
import React, { useState } from 'react';

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
function GridTileImage({ src, alt, label, colorClass, onQuickView }: any) {
    return (
        <div className={`relative h-full w-full bg-white overflow-hidden group border-4 ${colorClass} rounded-[2.5rem] shadow-xl transition-all duration-500 hover:scale-[1.02] hover:-rotate-1`}>
            <img src={src} alt={alt} className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110" />

            {/* Quick View Button Overlay */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10">
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView && onQuickView(); }}
                    className="pointer-events-auto bg-white/90 backdrop-blur-md rounded-full w-12 h-12 flex items-center justify-center text-gray-800 shadow-xl hover:bg-primary hover:text-white hover:scale-110 transition-all"
                    title="Quick View"
                >
                    <Eye className="w-6 h-6" />
                </button>
            </div>

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

function GridItem({ item, size, index, onQuickView }: { item: ProductSnippet, size: 'full' | 'half', index: number, onQuickView: () => void }) {
    const router = useRouter();
    const colors = ['border-[#ff6b6b]', 'border-[#ffbe0b]', 'border-[#00b4d8]', 'border-[#ffafcc]', 'border-[#cdb4db]'];
    const colorClass = colors[index % colors.length];

    return (
        <div
            className={`
            ${size === "full" ? "md:col-span-4 md:row-span-2" : "md:col-span-2 md:row-span-1"}
            w-full
          `}
        >
            <div
                className="relative block aspect-square h-full w-full cursor-pointer"
                onClick={(e) => { e.preventDefault(); router.push(item.href || `/product/${item.handle}`); }}
            >
                <Link href={item.href || `/product/${item.handle}`} className="sr-only" prefetch={true} aria-hidden="true">{item.title}</Link>
                <GridTileImage
                    src={item.image}
                    alt={item.title}
                    colorClass={colorClass}
                    label={{
                        title: item.title,
                        amount: item.price,
                    }}
                    onQuickView={(e: React.MouseEvent) => {
                        if (e) { e.preventDefault(); e.stopPropagation(); }
                        onQuickView && onQuickView();
                    }}
                />
            </div>
        </div>
    );
}

export default function FeaturedGrid({ settings, blocks, storeContext, sectionId = 'featured_grid_1' }: FeaturedGridProps) {
    const [quickViewProduct, setQuickViewProduct] = useState<string | null>(null);
    const storeIdentifier = storeContext?.store?.slug || storeContext?.storeData?.slug || storeContext?.slug || storeContext?.id || '';
    const baseUrl = '';
    const currency = storeContext?.store?.currency || storeContext?.storeData?.currency || storeContext?.currency || 'SAR';

    const mockProducts: ProductSnippet[] = [
        { id: 'prod_1', handle: 'product-1', title: 'مجموعة بناء القصر التعليمية', price: `250 ${currency}`, image: 'https://images.unsplash.com/photo-1585366119957-e556f24975af?w=800&q=80' },
        { id: 'prod_2', handle: 'product-2', title: 'دب تيدي ناعم وكبير', price: `120 ${currency}`, image: 'https://images.unsplash.com/photo-1559411933-7286395fb7eb?w=600&q=80' },
        { id: 'prod_3', handle: 'product-3', title: 'سيارة دفع رباعي لاسلكية', price: `180 ${currency}`, image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&q=80' },
        { id: 'prod_4', handle: 'product-4', title: 'مكعبات ملونة للأطفال', price: `65 ${currency}`, image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80' },
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
                    {products[0] && <GridItem index={0} size="full" item={products[0]} onQuickView={() => setQuickViewProduct(products[0].id)} />}
                    {products[1] && <GridItem index={1} size="half" item={products[1]} onQuickView={() => setQuickViewProduct(products[1].id)} />}
                    {products[2] && <GridItem index={2} size="half" item={products[2]} onQuickView={() => setQuickViewProduct(products[2].id)} />}
                </div>
            </div>
        </section>
    );
}

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
function GridTileImage({ src, alt, label, onQuickView }: any) {
    return (
        <div className="relative h-full w-full bg-[#0d0d0d] overflow-hidden group border border-zinc-900 transition-all duration-700 hover:border-amber-400">
            <img src={src} alt={alt} className="object-cover w-full h-full transition-all duration-1000 group-hover:scale-110 group-hover:opacity-60 grayscale group-hover:grayscale-0" />

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

            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-all duration-500"></div>
            {label && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0">
                    <div className="w-10 h-[1px] bg-amber-400 mb-4"></div>
                    <h3 className="font-serif text-2xl text-white italic mb-2 text-center">{label.title}</h3>
                    <span className="text-amber-400 text-sm tracking-[0.3em] font-light uppercase mb-4">{label.amount}</span>
                    <div className="w-10 h-[1px] bg-amber-400"></div>
                </div>
            )}
        </div>
    )
}

function GridItem({ item, size, onQuickView }: { item: ProductSnippet, size: 'full' | 'half', onQuickView: () => void }) {
    const router = useRouter();
    return (
        <div
            className={`
            ${size === "full" ? "md:col-span-3 md:row-span-2" : "md:col-span-3 md:row-span-1"}
            w-full transition-all duration-700
          `}
        >
            <div
                className="relative block aspect-[3/4] md:aspect-auto h-full w-full cursor-pointer"
                onClick={(e) => { e.preventDefault(); router.push(item.href || `/product/${item.handle}`); }}
            >
                <Link href={item.href || `/product/${item.handle}`} className="sr-only" prefetch={true} aria-hidden="true">{item.title}</Link>
                <GridTileImage
                    src={item.image}
                    alt={item.title}
                    label={{
                        title: item.title,
                        amount: item.price,
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
        { id: 'prod_1', handle: 'product-1', title: 'عقد الألماس النادر', price: `12,500 ${currency}`, image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80' },
        { id: 'prod_2', handle: 'product-2', title: 'خاتم ذهب عيار 21', price: `3,450 ${currency}`, image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80' },
        { id: 'prod_3', handle: 'product-3', title: 'أقراط اللؤلؤ الفاخرة', price: `1,200 ${currency}`, image: 'https://images.unsplash.com/photo-1535633302704-b02a41af7435?w=600&q=80' },
        { id: 'prod_4', handle: 'product-4', title: 'سوار ألماس كلاسيك', price: `8,900 ${currency}`, image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80' },
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
        <section className="bg-[#0a0a0a] py-32 border-b border-zinc-900">
            <div className="mx-auto w-full max-w-7xl px-4">
                {settings.heading && (
                    <div className="mb-20 text-center space-y-4">
                        <div className="flex items-center justify-center gap-4">
                            <div className="w-8 h-[1px] bg-amber-400/40"></div>
                            <span className="text-amber-400 tracking-[0.3em] text-[10px] uppercase font-bold">Selected Jewels</span>
                            <div className="w-8 h-[1px] bg-amber-400/40"></div>
                        </div>
                        <InlineEditableText
                            as="h2"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-4xl md:text-7xl font-serif text-white italic tracking-tight"
                        />
                        {settings.subheading && (
                            <div className="text-zinc-500 font-light text-lg max-w-2xl mx-auto tracking-wide">
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

                <div className="grid grid-cols-1 md:grid-cols-6 gap-8 md:h-[800px]">
                    {products[0] && <GridItem size="full" item={products[0]} onQuickView={() => setQuickViewProduct(products[0].id)} />}
                    <div className="md:col-span-3 grid grid-cols-1 gap-8 md:h-full">
                        {products[1] && <GridItem size="half" item={products[1]} onQuickView={() => setQuickViewProduct(products[1].id)} />}
                        {products[2] && <GridItem size="half" item={products[2]} onQuickView={() => setQuickViewProduct(products[2].id)} />}
                    </div>
                </div>
            </div>
        </section>
    );
}

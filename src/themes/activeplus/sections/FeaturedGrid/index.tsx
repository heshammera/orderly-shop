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
        <div className="relative h-full w-full bg-zinc-900 overflow-hidden group border border-zinc-800 transition-all duration-300">
            <img src={src} alt={alt} className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110 brightness-75 group-hover:brightness-100" />

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

function GridItem({ item, size, onQuickView }: { item: ProductSnippet, size: 'full' | 'half', onQuickView: () => void }) {
    const router = useRouter();
    return (
        <div
            className={`
            ${size === "full" ? "md:col-span-4 md:row-span-2" : "md:col-span-2 md:row-span-1"}
            w-full shadow-2xl transition-all duration-300 hover:z-10 hover:scale-[1.02]
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
    const baseUrl = storeIdentifier ? `/s/${storeIdentifier}/p` : '/product';
    const currency = storeContext?.store?.currency || storeContext?.storeData?.currency || storeContext?.currency || 'SAR';

    const mockProducts: ProductSnippet[] = [
        { id: 'prod_1', handle: 'product-1', title: 'حذاء الجري الاحترافي', price: `450 ${currency}`, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80' },
        { id: 'prod_2', handle: 'product-2', title: 'ساعة ذكية رياضية Pro', price: `899 ${currency}`, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80' },
        { id: 'prod_3', handle: 'product-3', title: 'حقيبة تدريب ليلية', price: `190 ${currency}`, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80' },
        { id: 'prod_4', handle: 'product-4', title: 'زجاجة مياه ذكية', price: `95 ${currency}`, image: 'https://images.unsplash.com/photo-1602143307185-838712502674?w=600&q=80' },
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
                    {products[0] && <GridItem size="full" item={products[0]} onQuickView={() => setQuickViewProduct(products[0].id)} />}
                    {products[1] && <GridItem size="half" item={products[1]} onQuickView={() => setQuickViewProduct(products[1].id)} />}
                    {products[2] && <GridItem size="half" item={products[2]} onQuickView={() => setQuickViewProduct(products[2].id)} />}
                </div>
            </div>
        </section>
    );
}

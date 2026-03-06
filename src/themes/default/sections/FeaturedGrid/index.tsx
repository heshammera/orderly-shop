import React, { useState } from 'react';
import Link from 'next/link';
import InlineEditableText from '@/components/ThemeEngine/InlineEditableText';
import { QuickViewModal } from '@/components/store/QuickViewModal';
import { Eye } from 'lucide-react';

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

function GridTileImage({ src, alt, label, onQuickView }: any) {
    return (
        <div className="relative h-full w-full bg-muted overflow-hidden group rounded-lg">
            <img src={src} alt={alt} className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />

            {/* Quick View Button Overlay */}
            <div className="absolute inset-x-0 bottom-24 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 pointer-events-none z-10">
                <button
                    onClick={onQuickView}
                    className="pointer-events-auto bg-white/90 backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center text-gray-800 shadow-md hover:bg-primary hover:text-white transition-colors"
                    title="Quick View"
                >
                    <Eye className="w-5 h-5" />
                </button>
            </div>

            {label && (
                <div className={`absolute ${label.position === 'center' ? 'inset-0 flex items-center justify-center pointer-events-none' : 'bottom-0 w-full pointer-events-none'} p-4`}>
                    <div className="bg-background/80 backdrop-blur-md text-foreground p-4 rounded-xl shadow-md flex items-center gap-4 pointer-events-auto">
                        <h3 className="font-semibold text-sm leading-none">{label.title}</h3>
                        <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-bold">{label.amount}</span>
                    </div>
                </div>
            )}
        </div>
    )
}

function GridItem({ item, size, onQuickView }: { item: ProductSnippet, size: 'full' | 'half' | 'single' | 'double', onQuickView: () => void }) {
    const sizeClasses: Record<string, string> = {
        'full': 'md:col-span-4 md:row-span-2',
        'half': 'md:col-span-2 md:row-span-1',
        'single': 'md:col-span-1 md:row-span-1',
        'double': 'md:col-span-1 md:row-span-1',
    };

    const labelPosition = (size === 'full' || size === 'single' || size === 'double') ? 'center' : 'bottom';

    return (
        <div
            className={`
            ${sizeClasses[size] || "md:col-span-2 md:row-span-1"}
            w-full transition-shadow hover:shadow-lg rounded-lg
          `}
        >
            <Link
                className="relative block aspect-square md:aspect-auto h-full w-full min-h-[300px]"
                href={item.href || `/product/${item.handle}`}
                prefetch={true}
            >
                <GridTileImage
                    src={item.image}
                    alt={item.title}
                    label={{
                        position: labelPosition,
                        title: item.title,
                        amount: item.price,
                    }}
                    onQuickView={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onQuickView();
                    }}
                />
            </Link>
        </div>
    );
}

export default function FeaturedGrid({ settings, blocks, storeContext, sectionId = 'featured_grid_1' }: FeaturedGridProps) {
    const [quickViewProduct, setQuickViewProduct] = useState<string | null>(null);
    const storeIdentifier = storeContext?.store?.slug || storeContext?.storeData?.slug || storeContext?.slug || storeContext?.id || '';
    const baseUrl = storeIdentifier ? `/s/${storeIdentifier}/p` : '/product';
    const currency = storeContext?.store?.currency || storeContext?.storeData?.currency || storeContext?.currency || 'SAR';

    // In a real scenario, the Data Resolver Layer would take `blocks` (which has product IDs) 
    // and fetch the actual Product items from the Store DB.
    // We now have storeContext.products injected by the page wrapper!

    const mockProducts: ProductSnippet[] = [
        { id: 'prod_1', handle: 'product-1', title: 'هاتف ذكي متطور', price: `2500 ${currency}`, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9' },
        { id: 'prod_2', handle: 'product-2', title: 'ساعة ذكية رياضية', price: `450 ${currency}`, image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12' },
        { id: 'prod_3', handle: 'product-3', title: 'سماعات رأس لاسلكية', price: `199 ${currency}`, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e' },
        { id: 'prod_4', handle: 'product-4', title: 'حقيبة ظهر عصرية', price: `120 ${currency}`, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62' },
    ];

    const realProducts = storeContext?.products || [];

    // Helper to format a real product into our ProductSnippet
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

        let image = 'https://via.placeholder.com/300';
        try {
            const parsedImages = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
            if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                image = parsedImages[0];
            }
        } catch (e) { }

        return {
            id: p.id,
            handle: p.id, // using ID as handle for now
            title,
            price: `${p.sale_price || p.price || 0} ${currency}`,
            image,
            href: `${baseUrl}/${p.id}`
        };
    };

    // If user hasn't selected at least 1 product in customizer, show placeholders
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

    let containerClasses = "grid gap-4 h-auto ";
    if (products.length === 1) {
        containerClasses += "grid-cols-1 md:grid-cols-1 md:grid-rows-1 min-h-[40vh] md:h-[min(50vh,500px)]";
    } else if (products.length === 2) {
        containerClasses += "grid-cols-1 md:grid-cols-2 md:grid-rows-1 min-h-[40vh] md:h-[min(50vh,500px)]";
    } else {
        containerClasses += "grid-cols-1 md:grid-cols-6 md:grid-rows-2 h-auto md:h-[min(60vh,600px)]";
    }

    return (
        <div className="mx-auto w-full max-w-(--breakpoint-2xl) py-12 px-4">
            {settings.heading && (
                <div className="mb-8 text-center md:text-start rtl:md:text-right">
                    <InlineEditableText
                        as="h2"
                        sectionId={sectionId}
                        settingId="heading"
                        value={settings.heading}
                        className="text-3xl font-bold tracking-tight text-foreground inline-block"
                    />
                    {settings.subheading && (
                        <div className="mt-2 text-muted-foreground">
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

            <div className={containerClasses}>
                {products.length === 1 && (
                    <GridItem size="single" item={products[0]} onQuickView={() => setQuickViewProduct(products[0].id)} />
                )}
                {products.length === 2 && (
                    <>
                        <GridItem size="double" item={products[0]} onQuickView={() => setQuickViewProduct(products[0].id)} />
                        <GridItem size="double" item={products[1]} onQuickView={() => setQuickViewProduct(products[1].id)} />
                    </>
                )}
                {products.length >= 3 && (
                    <>
                        {products[0] && <GridItem size="full" item={products[0]} onQuickView={() => setQuickViewProduct(products[0].id)} />}
                        {products[1] && <GridItem size="half" item={products[1]} onQuickView={() => setQuickViewProduct(products[1].id)} />}
                        {products[2] && <GridItem size="half" item={products[2]} onQuickView={() => setQuickViewProduct(products[2].id)} />}
                    </>
                )}
            </div>

            {quickViewProduct && (
                <QuickViewModal
                    isOpen={!!quickViewProduct}
                    onOpenChange={(open) => !open && setQuickViewProduct(null)}
                    productId={quickViewProduct}
                    storeId={storeIdentifier}
                />
            )}
        </div>
    );
}

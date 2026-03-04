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
        <div className="relative h-full w-full bg-muted overflow-hidden group rounded-lg">
            <img src={src} alt={alt} className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
            {label && (
                <div className={`absolute ${label.position === 'center' ? 'inset-0 flex items-center justify-center' : 'bottom-0 w-full'} p-4`}>
                    <div className="bg-background/80 backdrop-blur-md text-foreground p-4 rounded-xl shadow-md flex items-center gap-4">
                        <h3 className="font-semibold text-sm leading-none">{label.title}</h3>
                        <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-bold">{label.amount}</span>
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
            ${size === "full" ? "md:col-span-4 md:row-span-2" : "md:col-span-2 md:row-span-1"}
            w-full transition-shadow hover:shadow-lg rounded-lg
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
                        position: size === "full" ? "center" : "bottom",
                        title: item.title,
                        amount: item.price,
                    }}
                />
            </Link>
        </div>
    );
}

export default function FeaturedGrid({ settings, blocks, storeContext, sectionId = 'featured_grid_1' }: FeaturedGridProps) {

    // In a real scenario, the Data Resolver Layer would take `blocks` (which has product IDs) 
    // and fetch the actual Product items from the Store DB.
    // For now, we simulate this with placeholders if no blocks are provided.

    const mockProducts: ProductSnippet[] = [
        { id: 'prod_1', handle: 'product-1', title: 'هاتف ذكي متطور', price: '2500 SAR', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9' },
        { id: 'prod_2', handle: 'product-2', title: 'ساعة ذكية رياضية', price: '450 SAR', image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12' },
        { id: 'prod_3', handle: 'product-3', title: 'سماعات رأس لاسلكية', price: '199 SAR', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e' },
        { id: 'prod_4', handle: 'product-4', title: 'حقيبة ظهر عصرية', price: '120 SAR', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62' },
    ];

    // If user hasn't selected at least 1 product in customizer, show placeholders
    const products = blocks?.length > 0
        ? blocks.map((b, idx) => {
            const found = mockProducts.find(p => p.id === b.settings?.product_id);
            // Fallback to the mock product at the same index if no ID is provided or product not found
            return found || mockProducts[idx % mockProducts.length];
        })
        : mockProducts;

    if (!products || products.length < 3) return null;

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

            <div className={`grid gap-4 md:grid-rows-2 h-auto md:h-[min(60vh,600px)] ${products.length === 1 ? 'md:grid-cols-4' : products.length === 2 ? 'md:grid-cols-4' : 'md:grid-cols-6'}`}>
                {products[0] && <GridItem size={products.length === 1 ? 'half' : 'full'} item={products[0]} />}
                {products[1] && <GridItem size="half" item={products[1]} />}
                {products[2] && <GridItem size="half" item={products[2]} />}
            </div>
        </div>
    );
}

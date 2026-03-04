import React, { useState } from 'react';
import Link from 'next/link';
import { ProductDetail } from '@/components/store/ProductDetail';

function EleganceBreadcrumbs({ product }: { product: any }) {
    if (!product) return null;
    return (
        <section id="breadcrumbs" className="pt-6 bg-gray-50 border-b border-gray-100">
            <div className="container mx-auto px-4">
                <ol className="list-reset flex items-center text-sm pb-4">
                    <li><Link href="/" className="font-semibold text-gray-600 hover:text-primary transition-colors">Home</Link></li>
                    <li><span className="mx-2 text-gray-400">&gt;</span></li>
                    <li><Link href="/shop" className="font-semibold text-gray-600 hover:text-primary transition-colors">Shop</Link></li>
                    <li><span className="mx-2 text-gray-400">&gt;</span></li>
                    <li className="text-gray-900 font-bold truncate max-w-[200px] sm:max-w-none">{product.name?.en || product.name?.ar || 'Product'}</li>
                </ol>
            </div>
        </section>
    );
}

function EleganceProductTabs({ product }: { product: any }) {
    const [activeTab, setActiveTab] = useState('description');

    if (!product) return null;

    return (
        <section className="border-t border-gray-200 mt-16 bg-white">
            <div className="container mx-auto px-4">
                <div className="py-12">
                    <div>
                        <div className="flex space-x-2 md:space-x-8 overflow-x-auto border-b border-gray-200 hide-scrollbar pb-px">
                            <button
                                onClick={() => setActiveTab('description')}
                                className={`pb-4 text-base md:text-lg font-bold border-b-4 whitespace-nowrap transition-colors ${activeTab === 'description' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                            >
                                Description
                            </button>
                            <button
                                onClick={() => setActiveTab('additional')}
                                className={`pb-4 text-base md:text-lg font-bold border-b-4 whitespace-nowrap transition-colors ${activeTab === 'additional' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                            >
                                Additional information
                            </button>
                            <button
                                onClick={() => setActiveTab('reviews')}
                                className={`pb-4 text-base md:text-lg font-bold border-b-4 whitespace-nowrap transition-colors ${activeTab === 'reviews' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                            >
                                Reviews (0)
                            </button>
                        </div>
                        <div className="mt-8">
                            {activeTab === 'description' && (
                                <div className="prose max-w-none text-gray-600 animate-in fade-in duration-300" dangerouslySetInnerHTML={{ __html: product.description?.en || product.description?.ar || 'No description available.' }} />
                            )}
                            {activeTab === 'additional' && (
                                <div className="text-gray-600 animate-in fade-in duration-300">
                                    <p>More information will be added here soon.</p>
                                </div>
                            )}
                            {activeTab === 'reviews' && (
                                <div className="text-gray-600 animate-in fade-in duration-300">
                                    <p>There are no reviews yet. Be the first to review this product!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function MainProduct({ storeContext, settings, blocks }: { storeContext?: any, settings?: any, blocks?: any[] }) {
    if (!storeContext?.product) {
        return (
            <div className="p-16 text-center text-muted-foreground w-full">
                <p>عينة من صفحة المنتج الرئيسي تظهر هنا</p>
            </div>
        );
    }

    // Since we are moving Description to tabs, we optionally remove the description block from rendering in ProductDetail
    const filteredBlocks = blocks ? blocks.filter(b => b.type !== 'description') : [];

    return (
        <div className="elegance-product-page bg-white">
            <EleganceBreadcrumbs product={storeContext.product} />

            <div className="py-8">
                <ProductDetail
                    product={storeContext.product}
                    variants={storeContext.variants}
                    upsellOffers={storeContext.upsellOffers}
                    store={storeContext.store}
                    themeSettings={{ ...settings, blocks: filteredBlocks, container_class: '' }}
                />
            </div>

            <EleganceProductTabs product={storeContext.product} />
        </div>
    );
}

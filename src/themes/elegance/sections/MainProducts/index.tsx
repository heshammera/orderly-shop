import React from 'react';
import { StoreProducts } from '@/components/store/StoreProducts';

interface MainProductsProps {
    settings?: any;
    blocks?: any[];
    storeContext?: any;
}

export default function MainProducts({ settings, blocks, storeContext }: MainProductsProps) {
    if (!storeContext || !storeContext.productsContext) {
        return (
            <div className="p-16 text-center text-muted-foreground w-full">
                <p>عينة من صفحة المنتجات تظهر هنا</p>
            </div>
        );
    }

    const { store, initialCategories, initialProducts } = storeContext.productsContext;

    return (
        <section id="shop-page" className="elegance-shop-page pb-16 pt-8 bg-gray-50">
            <div className="container mx-auto px-4">
                {settings?.heading && (
                    <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b pb-4">{settings.heading}</h1>
                )}

                <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-8">
                    <StoreProducts
                        store={store}
                        initialCategories={initialCategories}
                        initialProducts={initialProducts}
                    />
                </div>

                {settings?.show_description !== false && (
                    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm mt-12 text-gray-600 prose max-w-none">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900">{settings?.description_title || 'About Our Collection'}</h2>
                        <p className="mb-4">
                            {settings?.description_text || 'Discover our wide range of products, perfect for any occasion. Whether you are looking for something casual or formal, we have the perfect item for you. Our collection includes a variety of styles to suit everyone\'s taste.'}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

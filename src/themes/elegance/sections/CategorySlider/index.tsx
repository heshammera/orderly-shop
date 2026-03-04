import React, { useRef } from 'react';
import Link from 'next/link';
import InlineEditableText from '@/components/ThemeEngine/InlineEditableText';

interface CategoryBlock {
    id?: string;
    type: string;
    settings: {
        title?: string;
        image_url?: string;
        link?: string;
    };
}

interface CategorySliderProps {
    settings: {
        heading?: string;
        subheading?: string;
    };
    blocks?: CategoryBlock[];
    sectionId?: string;
}

export default function CategorySlider({ settings, blocks = [], sectionId = 'category_slider_1' }: CategorySliderProps) {
    // Provide some default dummy blocks if none exist
    const displayBlocks = blocks.length > 0 ? blocks : [
        { id: '1', type: 'category', settings: { title: 'Men', image_url: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=600&q=80', link: '/category/men' } },
        { id: '2', type: 'category', settings: { title: 'Women', image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80', link: '/category/women' } },
        { id: '3', type: 'category', settings: { title: 'Accessories', image_url: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=80', link: '/category/accessories' } },
    ];

    return (
        <section id="product-banners" className="py-10 bg-white">
            <div className="container mx-auto px-4">

                {(settings.heading || settings.subheading) && (
                    <div className="text-center mb-10 w-full">
                        {settings.heading && (
                            <InlineEditableText
                                as="h2"
                                sectionId={sectionId}
                                settingId="heading"
                                value={settings.heading}
                                className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
                            />
                        )}
                        {settings.subheading && (
                            <InlineEditableText
                                as="p"
                                sectionId={sectionId}
                                settingId="subheading"
                                value={settings.subheading}
                                className="text-gray-500 text-lg"
                            />
                        )}
                    </div>
                )}

                <div className="flex flex-wrap -mx-4 justify-center">
                    {displayBlocks.map((block, index) => (
                        <div key={block.id || index} className="w-full sm:w-1/2 lg:w-1/3 px-4 mb-8">
                            <div className="category-banner relative overflow-hidden rounded-xl shadow-lg group aspect-[4/3] md:aspect-square lg:aspect-[4/5] bg-gray-100">
                                <img
                                    src={block.settings.image_url || 'https://via.placeholder.com/600'}
                                    alt={block.settings.title || 'Category'}
                                    className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300"></div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-6">
                                    <h2 className="text-3xl md:text-4xl font-bold mb-6 drop-shadow-md transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        {block.settings.title || 'Category Name'}
                                    </h2>
                                    <Link href={block.settings.link || '#'}
                                        className="bg-primary hover:bg-transparent border-2 border-primary hover:border-white text-white font-bold px-8 py-3 rounded-full inline-block transition-all transform opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 duration-300 delay-75 shadow-lg">
                                        Shop now
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

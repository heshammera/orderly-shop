import React from 'react';
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
    const displayBlocks = blocks.length > 0 ? blocks : [
        { id: '1', type: 'category', settings: { title: 'هواتف ذكية', image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80', link: '#' } },
        { id: '2', type: 'category', settings: { title: 'لابتوب', image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80', link: '#' } },
        { id: '3', type: 'category', settings: { title: 'سماعات', image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', link: '#' } },
        { id: '4', type: 'category', settings: { title: 'ساعات ذكية', image_url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&q=80', link: '#' } },
    ];

    return (
        <section className="py-20 px-4" style={{ background: '#0a0a1a' }}>
            <div className="container mx-auto">
                <div className="text-center mb-14">
                    {settings.heading && (
                        <InlineEditableText
                            as="h2"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-3xl md:text-4xl font-bold text-white mb-3"
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {displayBlocks.map((block, index) => (
                        <Link key={block.id || index} href={block.settings.link || '#'} className="group relative rounded-2xl overflow-hidden aspect-square">
                            {/* Image */}
                            <img
                                src={block.settings.image_url || 'https://via.placeholder.com/400'}
                                alt={block.settings.title || 'Category'}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            {/* Dark Overlay */}
                            <div className="absolute inset-0 transition-all duration-300" style={{ background: 'linear-gradient(0deg, rgba(10,10,26,0.95) 0%, rgba(10,10,26,0.3) 60%)' }}></div>
                            {/* Neon Border on Hover */}
                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: 'inset 0 0 0 2px rgba(0,212,255,0.5)', background: 'transparent' }}></div>
                            {/* Title */}
                            <div className="absolute bottom-0 left-0 right-0 p-5">
                                <h3 className="text-white text-lg font-bold mb-1 group-hover:translate-y-0 translate-y-1 transition-transform">{block.settings.title}</h3>
                                <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 inline-flex items-center gap-1" style={{ color: '#00d4ff' }}>
                                    تصفح الآن →
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

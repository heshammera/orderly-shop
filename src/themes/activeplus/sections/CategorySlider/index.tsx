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
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    // Provide some default dummy blocks if none exist
    const displayBlocks = blocks.length > 0 ? blocks : [
        { id: '1', type: 'category', settings: { title: 'ملابس رجالية', image_url: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=300&q=80' } },
        { id: '2', type: 'category', settings: { title: 'ملابس نسائية', image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80' } },
        { id: '3', type: 'category', settings: { title: 'إلكترونيات', image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&q=80' } },
        { id: '4', type: 'category', settings: { title: 'عطور', image_url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=300&q=80' } },
        { id: '5', type: 'category', settings: { title: 'اكسسوارات', image_url: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=300&q=80' } },
    ];

    return (
        <section className="py-24 bg-[#0a0a0a] overflow-hidden border-y border-zinc-900">
            <div className="container px-4 mx-auto">
                <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
                    <div className="space-y-4">
                        <div className="h-1 w-20 bg-blue-600"></div>
                        {settings.heading && (
                            <InlineEditableText
                                as="h2"
                                sectionId={sectionId}
                                settingId="heading"
                                value={settings.heading}
                                className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic"
                            />
                        )}
                        {settings.subheading && (
                            <InlineEditableText
                                as="p"
                                sectionId={sectionId}
                                settingId="subheading"
                                value={settings.subheading}
                                className="text-zinc-500 font-bold uppercase tracking-widest text-sm"
                            />
                        )}
                    </div>
                </div>

                <div className="relative group">
                    {/* Slider Container */}
                    <div
                        ref={scrollContainerRef}
                        className="flex overflow-x-auto gap-8 pb-8 snap-x snap-mandatory hide-scrollbar relative"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {displayBlocks.map((block, index) => (
                            <Link key={block.id || index} href={block.settings.link || '#'} className="snap-start shrink-0 flex flex-col items-start group/item w-[200px] md:w-[280px]">
                                <div className="relative w-full aspect-[4/5] overflow-hidden mb-6 bg-zinc-900 skew-x-[-3deg] group-hover/item:skew-x-0 transition-all duration-500">
                                    <img
                                        src={block.settings.image_url || 'https://via.placeholder.com/400'}
                                        alt={block.settings.title || 'Category'}
                                        className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700 brightness-75 group-hover:brightness-100"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="h-0.5 w-0 bg-blue-600 group-hover/item:w-full transition-all duration-500 mb-2"></div>
                                        <h3 className="font-black text-xl md:text-2xl text-white uppercase tracking-tighter italic group-hover/item:text-blue-500 transition-colors">
                                            {block.settings.title || 'اسم التصنيف'}
                                        </h3>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Hide Scrollbar Global Style Override */}
                <style dangerouslySetInnerHTML={{
                    __html: `
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}} />
            </div>
        </section>
    );
}

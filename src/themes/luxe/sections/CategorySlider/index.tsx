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
        <section className="py-24 bg-[#0a0a0a] border-y border-zinc-900 overflow-hidden">
            <div className="container px-4 mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div className="space-y-4">
                        {settings.heading && (
                            <InlineEditableText
                                as="h2"
                                sectionId={sectionId}
                                settingId="heading"
                                value={settings.heading}
                                className="text-3xl md:text-5xl font-serif text-white italic"
                            />
                        )}
                        {settings.subheading && (
                            <InlineEditableText
                                as="p"
                                sectionId={sectionId}
                                settingId="subheading"
                                value={settings.subheading}
                                className="text-zinc-500 font-light tracking-wide max-w-md"
                            />
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={scrollRight}
                            className="w-14 h-14 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:border-amber-400 transition-all duration-300 active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                        <button
                            onClick={scrollLeft}
                            className="w-14 h-14 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:border-amber-400 transition-all duration-300 active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                        </button>
                    </div>
                </div>

                <div className="relative">
                    {/* Slider Container */}
                    <div
                        ref={scrollContainerRef}
                        className="flex overflow-x-auto gap-12 pb-12 snap-x snap-mandatory hide-scrollbar relative"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {displayBlocks.map((block, index) => (
                            <Link key={block.id || index} href={block.settings.link || '#'} className="snap-start shrink-0 flex flex-col items-center group/item w-[180px] md:w-[240px]">
                                <div className="w-full aspect-square rounded-full overflow-hidden mb-8 border-[1px] border-zinc-800 p-2 group-hover/item:border-amber-400 transition-all duration-700">
                                    <div className="w-full h-full rounded-full overflow-hidden grayscale group-hover/item:grayscale-0 transition-all duration-700 relative">
                                        <img
                                            src={block.settings.image_url || 'https://via.placeholder.com/300'}
                                            alt={block.settings.title || 'Category'}
                                            className="w-full h-full object-cover scale-105 group-hover/item:scale-125 transition-transform duration-1000"
                                        />
                                        <div className="absolute inset-0 bg-black/20 group-hover/item:bg-transparent transition-colors duration-500"></div>
                                    </div>
                                </div>
                                <h3 className="font-serif text-xl md:text-2xl text-center text-zinc-400 group-hover/item:text-amber-400 transition-all duration-500 italic">
                                    {block.settings.title || 'اسم التصنيف'}
                                </h3>
                                <div className="w-0 group-hover/item:w-12 h-[1px] bg-amber-400 mt-2 transition-all duration-500"></div>
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

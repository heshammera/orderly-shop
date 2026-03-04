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
        <section className="py-16 bg-muted/10">
            <div className="container px-4 mx-auto">
                <div className="text-center mb-10">
                    {settings.heading && (
                        <InlineEditableText
                            as="h2"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-3xl font-bold text-foreground mb-3"
                        />
                    )}
                    {settings.subheading && (
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="subheading"
                            value={settings.subheading}
                            className="text-muted-foreground"
                        />
                    )}
                </div>

                <div className="relative group">
                    {/* Scroll Buttons */}
                    <button
                        onClick={scrollRight}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur shadow-xl rounded-full flex items-center justify-center text-stone-800 transition-all hover:bg-white hover:scale-110 active:scale-95"
                        aria-label="Previous"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>

                    <button
                        onClick={scrollLeft}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur shadow-xl rounded-full flex items-center justify-center text-stone-800 transition-all hover:bg-white hover:scale-110 active:scale-95"
                        aria-label="Next"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </button>

                    {/* Slider Container (Soft Rounded Squares) */}
                    <div
                        ref={scrollContainerRef}
                        className="flex overflow-x-auto gap-8 pb-8 snap-x snap-mandatory hide-scrollbar relative"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {displayBlocks.map((block, index) => (
                            <Link key={block.id || index} href={block.settings.link || '#'} className="snap-start shrink-0 flex flex-col items-center group/item w-[160px] md:w-[200px]">
                                <div className="w-full aspect-square rounded-[2rem] overflow-hidden mb-5 border-4 border-white shadow-soft group-hover/item:shadow-xl transition-all duration-500 overflow-hidden relative">
                                    <img
                                        src={block.settings.image_url || 'https://via.placeholder.com/300'}
                                        alt={block.settings.title || 'Category'}
                                        className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-stone-900/10 group-hover/item:bg-transparent transition-colors duration-500"></div>
                                </div>
                                <h3 className="font-bold text-base md:text-xl text-stone-800 text-center group-hover/item:text-orange-900 transition-colors">
                                    {block.settings.title || 'اسم التصنيف'}
                                </h3>
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

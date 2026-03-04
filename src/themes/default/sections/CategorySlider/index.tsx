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
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-background/80 backdrop-blur border border-border rounded-full flex items-center justify-center shadow-md text-foreground opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                        aria-label="Previous"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>

                    <button
                        onClick={scrollLeft}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-background/80 backdrop-blur border border-border rounded-full flex items-center justify-center shadow-md text-foreground opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                        aria-label="Next"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </button>

                    {/* Slider Container */}
                    <div
                        ref={scrollContainerRef}
                        className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory hide-scrollbar relative"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {displayBlocks.map((block, index) => (
                            <Link key={block.id || index} href={block.settings.link || '#'} className="snap-start shrink-0 flex flex-col items-center group/item w-[120px] md:w-[150px]">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden mb-4 border-2 border-transparent group-hover/item:border-primary transition-colors p-1">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-muted">
                                        <img
                                            src={block.settings.image_url || 'https://via.placeholder.com/150'}
                                            alt={block.settings.title || 'Category'}
                                            className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                </div>
                                <h3 className="font-medium text-sm md:text-base text-center group-hover/item:text-primary transition-colors line-clamp-2">
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

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
        <section className="py-24 bg-[#fffaf5] overflow-hidden">
            <div className="container px-4 mx-auto">
                <div className="text-center mb-16 space-y-4">
                    {settings.heading && (
                        <InlineEditableText
                            as="h2"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-3xl md:text-5xl font-light text-stone-800 tracking-tight italic"
                        />
                    )}
                    {settings.subheading && (
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="subheading"
                            value={settings.subheading}
                            className="text-stone-500 font-medium tracking-wide"
                        />
                    )}
                </div>

                <div className="relative">
                    {/* Slider Container */}
                    <div
                        ref={scrollContainerRef}
                        className="flex overflow-x-auto gap-8 pb-8 snap-x snap-mandatory hide-scrollbar relative justify-start md:justify-center"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {displayBlocks.map((block, index) => (
                            <Link key={block.id || index} href={block.settings.link || '#'} className="snap-start shrink-0 flex flex-col items-center group/item w-[150px] md:w-[180px]">
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-6 border-[3px] border-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] group-hover/item:border-[#e0afa0] transition-all duration-500 p-1 bg-white">
                                    <div className="w-full h-full rounded-full overflow-hidden grayscale-[50%] group-hover/item:grayscale-0 transition-all duration-700">
                                        <img
                                            src={block.settings.image_url || 'https://via.placeholder.com/150'}
                                            alt={block.settings.title || 'Category'}
                                            className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700"
                                        />
                                    </div>
                                </div>
                                <h3 className="font-bold text-sm md:text-base text-center text-stone-700 group-hover/item:text-[#d4a373] transition-colors tracking-wide">
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

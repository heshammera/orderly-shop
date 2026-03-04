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
        <section className="py-24 bg-white overflow-hidden border-y border-[#ecf3ec]">
            <div className="container px-4 mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
                    <div className="text-center md:text-left space-y-4">
                        {settings.heading && (
                            <InlineEditableText
                                as="h2"
                                sectionId={sectionId}
                                settingId="heading"
                                value={settings.heading}
                                className="text-4xl md:text-5xl font-black text-[#1b4332] tracking-tight"
                            />
                        )}
                        {settings.subheading && (
                            <InlineEditableText
                                as="p"
                                sectionId={sectionId}
                                settingId="subheading"
                                value={settings.subheading}
                                className="text-[#52b788] font-bold uppercase tracking-widest text-xs"
                            />
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={scrollRight} className="w-12 h-12 rounded-full border border-[#ecf3ec] flex items-center justify-center hover:bg-[#52b788] hover:text-white transition-all shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                        <button onClick={scrollLeft} className="w-12 h-12 rounded-full border border-[#ecf3ec] flex items-center justify-center hover:bg-[#52b788] hover:text-white transition-all shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                        </button>
                    </div>
                </div>

                <div className="relative group">
                    {/* Slider Container */}
                    <div
                        ref={scrollContainerRef}
                        className="flex overflow-x-auto gap-10 pb-10 snap-x snap-mandatory hide-scrollbar relative"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {displayBlocks.map((block, index) => (
                            <Link key={block.id || index} href={block.settings.link || '#'} className="snap-start shrink-0 flex flex-col items-center group/item w-[140px] md:w-[180px]">
                                <div className="relative w-full aspect-square rounded-full overflow-hidden mb-6 bg-[#f9fbf9] border border-[#ecf3ec] shadow-sm group-hover/item:shadow-[0_15px_30px_rgba(82,183,136,0.15)] group-hover/item:border-[#52b788] transition-all duration-500 p-2">
                                    <div className="w-full h-full rounded-full overflow-hidden">
                                        <img
                                            src={block.settings.image_url || 'https://via.placeholder.com/200'}
                                            alt={block.settings.title || 'Category'}
                                            className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                </div>
                                <h3 className="font-black text-sm md:text-lg text-center text-[#1b4332] group-hover/item:text-[#2d6a4f] transition-colors uppercase tracking-tight">
                                    {block.settings.title || 'اسم التصنيف'}
                                </h3>
                                <div className="h-1 w-0 bg-[#52b788] group-hover/item:w-8 transition-all duration-300 mt-2 rounded-full"></div>
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

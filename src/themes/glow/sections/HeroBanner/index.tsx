import React from 'react';
import Link from 'next/link';
import InlineEditableText from '@/components/ThemeEngine/InlineEditableText';

interface HeroBannerProps {
    settings: {
        heading?: string;
        subheading?: string;
        button_label?: string;
        button_link?: string;
        background_image?: string;
    };
    sectionId?: string;
}

export default function HeroBanner({ settings, sectionId = 'hero_banner_1' }: HeroBannerProps) {
    const bgImage = settings.background_image || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=2000';

    return (
        <section className="relative w-full h-[75vh] min-h-[500px] flex items-center justify-center overflow-hidden bg-[#fff5f5]">
            {/* Soft Beauty Background */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${bgImage})` }}
            >
                <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]"></div>
            </div>

            {/* Decorative soft gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>

            {/* Content Container */}
            <div className="relative z-10 container px-4 mx-auto flex flex-col items-center text-center">
                <div className="space-y-6 max-w-3xl">
                    <span className="text-[#d4a373] tracking-[0.3em] text-xs uppercase font-bold bg-white/80 px-4 py-2 rounded-full shadow-sm mb-4 inline-block">Natural Beauty</span>

                    {settings.heading && (
                        <InlineEditableText
                            as="h1"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-5xl md:text-7xl font-light text-stone-800 tracking-tight mb-4 leading-tight"
                        />
                    )}

                    {settings.subheading && (
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="subheading"
                            value={settings.subheading}
                            className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto mb-8 font-medium leading-relaxed"
                        />
                    )}

                    {settings.button_label && (
                        <Link
                            href={settings.button_link || '#'}
                            className="inline-flex items-center justify-center px-10 py-4 text-base font-bold text-white bg-[#e0afa0] rounded-full shadow-[0_10px_30px_rgba(224,175,160,0.3)] hover:bg-[#d4a373] transition-all transform hover:scale-105 active:scale-95"
                        >
                            <InlineEditableText
                                as="span"
                                sectionId={sectionId}
                                settingId="button_label"
                                value={settings.button_label}
                            />
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
}

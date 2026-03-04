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
    const bgImage = settings.background_image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=2000';

    return (
        <section className="relative w-full h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden bg-[#faf9f6]">
            {/* Background Image with Warm Overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${bgImage})` }}
            >
                <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-[1px]"></div>
            </div>

            {/* Content Container (Warm Minimalist) */}
            <div className="relative z-10 container px-4 mx-auto flex flex-col items-center text-center">
                <div className="bg-white/10 backdrop-blur-md p-8 md:p-12 rounded-[2.5rem] border border-white/20 shadow-2xl max-w-3xl transform transition-all duration-700 hover:scale-[1.02]">
                    {settings.heading && (
                        <InlineEditableText
                            as="h1"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6 drop-shadow-md leading-tight"
                        />
                    )}

                    {settings.subheading && (
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="subheading"
                            value={settings.subheading}
                            className="text-lg md:text-xl text-stone-100 max-w-xl mx-auto mb-10 drop-shadow-sm font-medium"
                        />
                    )}

                    {settings.button_label && (
                        <Link
                            href={settings.button_link || '#'}
                            className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-stone-900 bg-white rounded-full shadow-xl hover:bg-stone-100 transition-all active:scale-95 group overflow-hidden relative"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <InlineEditableText
                                    as="span"
                                    sectionId={sectionId}
                                    settingId="button_label"
                                    value={settings.button_label}
                                />
                            </span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Decorative bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#faf9f6] to-transparent z-10"></div>
        </section>
    );
}

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
    const bgImage = settings.background_image || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=2000';

    return (
        <section className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
            {/* High-Contrast Luxury Background */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10000ms] scale-110 animate-slow-zoom"
                style={{ backgroundImage: `url(${bgImage})` }}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
            </div>

            {/* Content Container (Elite Minimalist) */}
            <div className="relative z-10 container px-4 mx-auto flex flex-col items-center text-center">
                <div className="space-y-8 max-w-4xl">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-[1px] bg-amber-400 opacity-60"></div>
                        <span className="text-amber-400 tracking-[0.4em] text-xs uppercase font-medium">Limited Collection</span>
                        <div className="w-12 h-[1px] bg-amber-400 opacity-60"></div>
                    </div>

                    {settings.heading && (
                        <InlineEditableText
                            as="h1"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-5xl md:text-8xl font-serif text-white tracking-tight mb-6 drop-shadow-2xl leading-[1.1] italic"
                        />
                    )}

                    {settings.subheading && (
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="subheading"
                            value={settings.subheading}
                            className="text-lg md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-10 drop-shadow-sm font-light leading-relaxed"
                        />
                    )}

                    {settings.button_label && (
                        <Link
                            href={settings.button_link || '#'}
                            className="inline-flex items-center justify-center px-12 py-5 text-sm uppercase tracking-[0.2em] font-bold text-black bg-amber-400 border border-amber-500 shadow-[0_0_50px_rgba(251,191,36,0.2)] hover:bg-amber-300 hover:shadow-[0_0_70px_rgba(251,191,36,0.4)] transition-all duration-500 active:scale-95 group"
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

            {/* Decorative vignette */}
            <div className="absolute inset-0 pointer-events-none bg-radial-vignette opacity-50 z-5"></div>
        </section>
    );
}

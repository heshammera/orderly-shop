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
    const bgImage = settings.background_image || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=2000';

    return (
        <section className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-start overflow-hidden bg-black">
            {/* High-Energy Background */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${bgImage})` }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
            </div>

            {/* Slanted Accent Element */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/10 -skew-x-12 translate-x-1/2 pointer-events-none"></div>

            {/* Content Container */}
            <div className="relative z-10 container px-4 mx-auto">
                <div className="max-w-3xl space-y-8">
                    <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-1 skew-x-[-15deg] font-black uppercase text-xs tracking-widest shadow-[5px_5px_0_rgba(0,0,0,1)]">
                        <span className="skew-x-[15deg]">New Performance Line</span>
                    </div>

                    {settings.heading && (
                        <InlineEditableText
                            as="h1"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase leading-[0.9] drop-shadow-2xl"
                        />
                    )}

                    {settings.subheading && (
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="subheading"
                            value={settings.subheading}
                            className="text-xl md:text-2xl text-zinc-300 max-w-xl font-bold border-l-4 border-blue-600 pl-6 leading-relaxed"
                        />
                    )}

                    {settings.button_label && (
                        <Link
                            href={settings.button_link || '#'}
                            className="group relative inline-flex items-center justify-center px-10 py-5 text-lg font-black text-black bg-white uppercase tracking-tighter overflow-hidden rounded-none skew-x-[-15deg] hover:bg-blue-600 hover:text-white transition-all duration-300"
                        >
                            <div className="absolute inset-0 w-0 bg-blue-600 transition-all duration-300 group-hover:w-full"></div>
                            <span className="relative z-10 skew-x-[15deg]">
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

            {/* Bottom decoration */}
            <div className="absolute bottom-10 right-10 flex flex-col items-end gap-2 opacity-20 pointer-events-none">
                <span className="text-white text-8xl font-black italic select-none">LIMITLESS</span>
                <div className="h-1 w-64 bg-blue-600"></div>
            </div>
        </section>
    );
}

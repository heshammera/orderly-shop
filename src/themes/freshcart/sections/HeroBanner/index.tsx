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
    const bgImage = settings.background_image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=2000';

    return (
        <section className="relative w-full h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden bg-[#f9fbf9]">
            {/* Background with subtle pattern overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${bgImage})` }}
            >
                <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 container px-4 mx-auto">
                <div className="max-w-3xl mx-auto text-center space-y-8">
                    <div className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest shadow-xl">
                        <span>100% Organic & Fresh</span>
                    </div>

                    {settings.heading && (
                        <InlineEditableText
                            as="h1"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-5xl md:text-7xl font-black text-[#1b4332] tracking-tight leading-tight"
                        />
                    )}

                    {settings.subheading && (
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="subheading"
                            value={settings.subheading}
                            className="text-lg md:text-xl text-[#40916c] max-w-2xl mx-auto font-medium"
                        />
                    )}

                    {settings.button_label && (
                        <div className="pt-4">
                            <Link
                                href={settings.button_link || '#'}
                                className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-white bg-[#52b788] rounded-full shadow-[0_10px_20px_rgba(82,183,136,0.3)] hover:bg-[#40916c] hover:shadow-none transition-all transform hover:-translate-y-1"
                            >
                                <InlineEditableText
                                    as="span"
                                    sectionId={sectionId}
                                    settingId="button_label"
                                    value={settings.button_label}
                                />
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating leaf elements decoration (CSS only) */}
            <div className="absolute top-20 left-10 w-24 h-24 bg-[#9ef01a]/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-32 h-32 bg-[#2d6a4f]/10 rounded-full blur-3xl"></div>
        </section>
    );
}

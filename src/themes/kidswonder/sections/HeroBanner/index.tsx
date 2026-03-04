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
    const bgImage = settings.background_image || 'https://images.unsplash.com/photo-1532330393533-443990a51d10?auto=format&fit=crop&q=80&w=2000';

    return (
        <section className="relative w-full h-[75vh] min-h-[550px] flex items-center justify-center overflow-hidden bg-[#fff9ea]">
            {/* Background Pattern Overlay (Dots/Stars) */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ff6b6b 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

            {/* Background Image Container with "Wavy" mask simulation */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-90"
                style={{ backgroundImage: `url(${bgImage})` }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-[#ffecd2]/80 via-transparent to-[#fcb69f]/60 backdrop-blur-[1px]"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 container px-4 mx-auto">
                <div className="max-w-2xl bg-white/90 backdrop-blur-xl p-10 md:p-16 rounded-[3rem] shadow-[0_30px_60px_rgba(255,107,107,0.15)] border-4 border-[#ffbe0b]/20 relative">
                    {/* Decorative "Sticker" */}
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#ff6b6b] rounded-full flex items-center justify-center text-white font-black text-xl rotate-12 shadow-xl border-4 border-white">
                        NEW!
                    </div>

                    <div className="space-y-8">
                        <div className="inline-block bg-[#00b4d8] text-white px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-[0.2em] shadow-lg">
                            World of Wonders
                        </div>

                        {settings.heading && (
                            <InlineEditableText
                                as="h1"
                                sectionId={sectionId}
                                settingId="heading"
                                value={settings.heading}
                                className="text-5xl md:text-7xl font-black text-[#ff6b6b] tracking-tight leading-[0.9] drop-shadow-sm"
                            />
                        )}

                        {settings.subheading && (
                            <InlineEditableText
                                as="p"
                                sectionId={sectionId}
                                settingId="subheading"
                                value={settings.subheading}
                                className="text-xl text-[#ffbe0b] font-black max-w-sm"
                            />
                        )}

                        {settings.button_label && (
                            <div className="pt-4">
                                <Link
                                    href={settings.button_link || '#'}
                                    className="inline-flex items-center justify-center px-12 py-5 text-xl font-black text-white bg-[#ff6b6b] rounded-full shadow-[0_15px_30px_rgba(255,107,107,0.4)] hover:bg-[#ff4f4f] hover:shadow-none transition-all transform hover:-rotate-2 hover:scale-105"
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
            </div>

            {/* Floating colorful shapes decorations */}
            <div className="absolute top-20 right-20 w-16 h-16 bg-[#ffdb58] rounded-2xl rotate-45 opacity-40 blur-sm"></div>
            <div className="absolute bottom-10 left-20 w-24 h-24 bg-[#a2d2ff] rounded-full opacity-40 blur-sm"></div>
        </section>
    );
}

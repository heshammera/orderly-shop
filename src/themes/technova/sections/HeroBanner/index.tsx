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
    const bgImage = settings.background_image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80';

    return (
        <section className="relative w-full min-h-[600px] md:min-h-[80vh] flex items-center justify-center overflow-hidden" style={{ background: '#0a0a1a' }}>
            {/* Background Image with dark overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src={bgImage}
                    alt="Hero Banner"
                    className="w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,10,26,0.9) 0%, rgba(0,0,0,0.7) 50%, rgba(10,10,26,0.9) 100%)' }}></div>
            </div>

            {/* Decorative Grid Lines */}
            <div className="absolute inset-0 z-0 opacity-10" style={{
                backgroundImage: 'linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)',
                backgroundSize: '60px 60px'
            }}></div>

            {/* Floating Glow Orbs */}
            <div className="absolute top-20 right-20 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: '#00d4ff' }}></div>
            <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: '#7c3aed' }}></div>

            {/* Content Container */}
            <div className="relative z-10 container px-4 mx-auto flex flex-col items-center text-center">
                {/* Badge */}
                <div className="mb-6 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase" style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }}>
                    🚀 أحدث التقنيات
                </div>

                {settings.heading && (
                    <InlineEditableText
                        as="h1"
                        sectionId={sectionId}
                        settingId="heading"
                        value={settings.heading}
                        className="text-4xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight"
                    />
                )}

                {settings.subheading && (
                    <InlineEditableText
                        as="p"
                        sectionId={sectionId}
                        settingId="subheading"
                        value={settings.subheading}
                        className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10"
                    />
                )}

                {settings.button_label && (
                    <Link
                        href={settings.button_link || '#'}
                        className="inline-flex items-center gap-2 px-10 py-4 text-base font-bold text-white rounded-full shadow-lg transition-all transform hover:scale-105 hover:shadow-cyan-500/25"
                        style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', boxShadow: '0 0 30px rgba(0,212,255,0.3)' }}
                    >
                        <InlineEditableText
                            as="span"
                            sectionId={sectionId}
                            settingId="button_label"
                            value={settings.button_label}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </Link>
                )}
            </div>
        </section>
    );
}

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
    const bgImage = settings.background_image || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&q=80';

    return (
        <section id="product-slider" className="relative w-full h-[60vh] md:h-[80vh] min-h-[500px] flex items-center justify-start overflow-hidden bg-gray-900">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src={bgImage}
                    alt="Hero Banner"
                    className="w-full h-full object-cover opacity-80"
                />
            </div>

            {/* Content Container (Tailstore Style) */}
            <div className="relative z-10 w-full px-8 md:px-20 flex flex-col items-start text-left rtl:text-right">
                {settings.heading && (
                    <InlineEditableText
                        as="h2"
                        sectionId={sectionId}
                        settingId="heading"
                        value={settings.heading}
                        className="text-4xl md:text-7xl font-bold text-white mb-2 md:mb-4 drop-shadow-md"
                    />
                )}

                {settings.subheading && (
                    <InlineEditableText
                        as="p"
                        sectionId={sectionId}
                        settingId="subheading"
                        value={settings.subheading}
                        className="mb-6 text-white text-lg md:text-2xl max-w-2xl drop-shadow"
                    />
                )}

                {settings.button_label && (
                    <Link
                        href={settings.button_link || '#'}
                        className="bg-primary hover:bg-transparent text-white border border-primary hover:border-white transition-colors duration-300 font-semibold px-8 py-3 rounded-full inline-block text-lg"
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
        </section>
    );
}

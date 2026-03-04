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
    const bgImage = settings.background_image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000';

    return (
        <div className="relative w-full h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${bgImage})` }}
            >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 container px-4 mx-auto flex flex-col items-center text-center">

                {settings.heading && (
                    <InlineEditableText
                        as="h1"
                        sectionId={sectionId}
                        settingId="heading"
                        value={settings.heading}
                        className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-4 drop-shadow-lg"
                    />
                )}

                {settings.subheading && (
                    <InlineEditableText
                        as="p"
                        sectionId={sectionId}
                        settingId="subheading"
                        value={settings.subheading}
                        className="text-lg md:text-xl text-zinc-200 max-w-2xl mb-8 drop-shadow-md"
                    />
                )}

                {settings.button_label && (
                    <Link
                        href={settings.button_link || '#'}
                        className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-primary-foreground bg-primary border border-transparent rounded-full shadow-lg hover:bg-primary/90 transition-all transform hover:scale-105"
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
    );
}

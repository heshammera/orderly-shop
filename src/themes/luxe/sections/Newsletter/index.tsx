import React from 'react';
import InlineEditableText from '@/components/ThemeEngine/InlineEditableText';

interface NewsletterProps {
    settings: {
        heading?: string;
        subheading?: string;
        button_label?: string;
        placeholder?: string;
    };
    sectionId?: string;
}

export default function Newsletter({ settings, sectionId = 'newsletter_1' }: NewsletterProps) {
    return (
        <section className="py-32 bg-[#0d0d0d] text-center px-4 relative overflow-hidden flex items-center justify-center">
            {/* Subtle light pulse background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.05)_0%,transparent_70%)] animate-pulse"></div>

            <div className="max-w-4xl mx-auto space-y-12 relative z-10">
                <div className="space-y-6">
                    <div className="flex items-center justify-center gap-4">
                        <div className="w-12 h-[1px] bg-amber-400/30"></div>
                        <span className="text-amber-400 tracking-[0.5em] text-[10px] uppercase font-bold">The Elite Circle</span>
                        <div className="w-12 h-[1px] bg-amber-400/30"></div>
                    </div>

                    {settings.heading && (
                        <InlineEditableText
                            as="h2"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-4xl md:text-6xl font-serif text-white italic tracking-tight"
                        />
                    )}

                    {settings.subheading && (
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="subheading"
                            value={settings.subheading}
                            className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto font-light tracking-wide"
                        />
                    )}
                </div>

                <form className="mt-12 flex flex-col sm:flex-row max-w-2xl mx-auto gap-0 border-b border-amber-400/30" onSubmit={(e) => e.preventDefault()}>
                    <input
                        type="email"
                        placeholder={settings.placeholder || 'أدخل بريدك الإلكتروني'}
                        className="flex-1 bg-transparent px-8 py-5 text-white focus:outline-none placeholder:text-zinc-700 placeholder:italic transition-all text-lg font-serif"
                        required
                    />
                    <button
                        type="submit"
                        className="px-12 py-5 text-sm uppercase tracking-[0.3em] font-black text-amber-400 hover:text-white transition-all duration-500 whitespace-nowrap"
                    >
                        {settings.button_label || 'اشتراك'}
                    </button>
                </form>

                <p className="text-[10px] text-zinc-600 mt-8 uppercase tracking-[0.2em] font-medium">
                    By subscribing, you enter the world of exclusive high luxury.
                </p>
            </div>
        </section>
    );
}

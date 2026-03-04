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
        <section className="py-24 bg-[#ffbe0b]/10 text-center px-4 relative overflow-hidden">
            {/* Playful Floating Circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff6b6b]/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#00b4d8]/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>

            <div className="max-w-3xl mx-auto space-y-10 relative z-10">
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-[#ff6b6b] mb-4">
                        <div className="w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center rotate-6 border-2 border-[#ffbe0b]">
                            <span className="text-xl">🎁</span>
                        </div>
                    </div>
                    {settings.heading && (
                        <InlineEditableText
                            as="h2"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-4xl md:text-6xl font-black text-[#ff6b6b] tracking-tight"
                        />
                    )}

                    {settings.subheading && (
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="subheading"
                            value={settings.subheading}
                            className="text-xl text-[#2d2d2d] font-black max-w-xl mx-auto"
                        />
                    )}
                </div>

                <form className="mt-8 flex flex-col sm:flex-row max-w-xl mx-auto gap-4 p-3 bg-white rounded-[2.5rem] shadow-[0_25px_50px_rgba(255,107,107,0.15)] border-4 border-[#ff6b6b]/20" onSubmit={(e) => e.preventDefault()}>
                    <input
                        type="email"
                        placeholder={settings.placeholder || 'Your magic email address'}
                        className="flex-1 bg-transparent px-8 py-4 text-[#2d2d2d] focus:outline-none placeholder:text-[#2d2d2d]/30 font-black"
                        required
                    />
                    <button
                        type="submit"
                        className="bg-[#00b4d8] px-12 py-4 rounded-full text-xl font-black text-white shadow-xl hover:bg-[#0096b4] transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap"
                    >
                        {settings.button_label || 'Join the Fun'}
                    </button>
                </form>

                <p className="text-xs text-[#2d2d2d]/40 mt-8 font-black uppercase tracking-[0.2em]">
                    Fun surprises only. Unsubscribe any time!
                </p>
            </div>
        </section>
    );
}

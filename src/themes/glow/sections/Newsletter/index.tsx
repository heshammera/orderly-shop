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
        <section className="py-24 bg-[#fff5f5] text-center px-4 relative overflow-hidden">
            {/* Soft floating decorative circles */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/40 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#e0afa0]/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>

            <div className="max-w-3xl mx-auto space-y-10 relative z-10">
                <div className="space-y-4">
                    <span className="text-[#d4a373] tracking-[0.3em] text-[10px] uppercase font-black">Join Our Glow Club</span>
                    {settings.heading && (
                        <InlineEditableText
                            as="h2"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-4xl md:text-5xl font-light text-stone-800 tracking-tight italic"
                        />
                    )}

                    {settings.subheading && (
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="subheading"
                            value={settings.subheading}
                            className="text-lg text-stone-500 max-w-xl mx-auto font-medium"
                        />
                    )}
                </div>

                <form className="mt-10 flex flex-col sm:flex-row max-w-2xl mx-auto gap-4 p-2 bg-white rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.03)] border border-stone-100" onSubmit={(e) => e.preventDefault()}>
                    <input
                        type="email"
                        placeholder={settings.placeholder || 'أدخل بريدك الإلكتروني'}
                        className="flex-1 bg-transparent px-8 py-4 text-stone-800 focus:outline-none placeholder:text-stone-300 font-medium"
                        required
                    />
                    <button
                        type="submit"
                        className="rounded-full bg-[#e0afa0] px-10 py-4 text-sm font-black text-white shadow-lg hover:bg-[#d4a373] transition-all whitespace-nowrap active:scale-95"
                    >
                        {settings.button_label || 'اشتراك'}
                    </button>
                </form>

                <p className="text-[10px] text-stone-400 mt-6 uppercase tracking-[0.2em] font-bold">
                    Pure beauty, delivered straight to your inbox.
                </p>
            </div>
        </section>
    );
}

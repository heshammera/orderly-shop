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
        <section className="py-24 bg-[#0a0a0a] text-center px-4 relative overflow-hidden border-t border-zinc-900">
            {/* Background dynamic accents */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 -skew-x-12 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <div className="max-w-4xl mx-auto space-y-10 relative z-10">
                <div className="space-y-4">
                    <span className="text-blue-500 tracking-[0.4em] text-xs font-black uppercase italic">Elite Performance Club</span>
                    {settings.heading && (
                        <InlineEditableText
                            as="h2"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter"
                        />
                    )}

                    {settings.subheading && (
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="subheading"
                            value={settings.subheading}
                            className="text-xl text-zinc-400 max-w-2xl mx-auto font-bold"
                        />
                    )}
                </div>

                <form className="mt-10 flex flex-col sm:flex-row max-w-2xl mx-auto gap-0 bg-zinc-900 border border-zinc-800 skew-x-[-15deg]" onSubmit={(e) => e.preventDefault()}>
                    <input
                        type="email"
                        placeholder={settings.placeholder || 'ENTER YOUR EMAIL'}
                        className="flex-1 bg-transparent px-8 py-5 text-white focus:outline-none placeholder:text-zinc-600 font-black skew-x-[15deg] uppercase tracking-tighter"
                        required
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 px-12 py-5 text-lg font-black text-white shadow-lg hover:bg-white hover:text-black transition-all whitespace-nowrap"
                    >
                        <span className="skew-x-[15deg] block">
                            {settings.button_label || 'JOIN NOW'}
                        </span>
                    </button>
                </form>

                <p className="text-[10px] text-zinc-600 mt-6 uppercase tracking-[0.3em] font-black italic">
                    Push your limits. No spam, just performance.
                </p>
            </div>
        </section>
    );
}

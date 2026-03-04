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
        <section className="py-24 bg-[#f9fbf9] text-center px-4 relative overflow-hidden">
            {/* Soft decorative blur */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-[#52b788]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>

            <div className="max-w-3xl mx-auto space-y-10 relative z-10">
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-[#52b788] mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 10 2 2m0-2-2 2" /><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></svg>
                        <span className="font-black uppercase tracking-[0.2em] text-[10px]">Fresh Updates Only</span>
                    </div>
                    {settings.heading && (
                        <InlineEditableText
                            as="h2"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-4xl md:text-6xl font-black text-[#1b4332] tracking-tight"
                        />
                    )}

                    {settings.subheading && (
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="subheading"
                            value={settings.subheading}
                            className="text-lg text-[#40916c] max-w-xl mx-auto font-medium"
                        />
                    )}
                </div>

                <form className="mt-8 flex flex-col sm:flex-row max-w-xl mx-auto gap-4 p-2 bg-white rounded-[2rem] shadow-[0_20px_40px_rgba(82,183,136,0.1)] border border-[#ecf3ec]" onSubmit={(e) => e.preventDefault()}>
                    <input
                        type="email"
                        placeholder={settings.placeholder || 'Enter your email address'}
                        className="flex-1 bg-transparent px-8 py-4 text-[#1b4332] focus:outline-none placeholder:text-[#40916c]/40 font-bold"
                        required
                    />
                    <button
                        type="submit"
                        className="bg-[#2d6a4f] px-10 py-4 rounded-full text-lg font-black text-white shadow-lg hover:bg-[#1b4332] transition-all whitespace-nowrap"
                    >
                        {settings.button_label || 'Subscribe'}
                    </button>
                </form>

                <p className="text-[10px] text-[#40916c]/60 mt-6 font-bold uppercase tracking-widest">
                    No spam. Just fresh organic news & recipes.
                </p>
            </div>
        </section>
    );
}

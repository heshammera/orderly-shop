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
        <section className="py-24 bg-[#faf9f6] text-center px-4 relative overflow-hidden">
            {/* Soft decorative circles */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-stone-100 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-stone-100 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 opacity-50"></div>

            <div className="max-w-3xl mx-auto space-y-8 relative z-10">
                <div className="space-y-4">
                    {settings.heading && (
                        <InlineEditableText
                            as="h2"
                            sectionId={sectionId}
                            settingId="heading"
                            value={settings.heading}
                            className="text-3xl md:text-5xl font-bold text-stone-900 tracking-tight"
                        />
                    )}

                    {settings.subheading && (
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="subheading"
                            value={settings.subheading}
                            className="text-lg md:text-xl text-stone-500 max-w-xl mx-auto font-medium"
                        />
                    )}
                </div>

                <form className="mt-10 flex flex-col sm:flex-row max-w-xl mx-auto gap-4" onSubmit={(e) => e.preventDefault()}>
                    <input
                        type="email"
                        placeholder={settings.placeholder || 'أدخل بريدك الإلكتروني'}
                        className="flex-1 rounded-2xl border-2 border-white bg-white/50 backdrop-blur-md px-8 py-4 text-stone-800 focus:outline-none focus:ring-4 focus:ring-stone-200 focus:border-white transition-all shadow-soft"
                        required
                    />
                    <button
                        type="submit"
                        className="rounded-2xl bg-stone-900 px-10 py-4 text-lg font-bold text-white shadow-xl hover:bg-stone-800 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                    >
                        {settings.button_label || 'اشتراك'}
                    </button>
                </form>

                <p className="text-xs text-stone-400 mt-6 font-medium">
                    بالاشتراك، أنت توافق على شروط الخدمة وسياسة الخصوصية الخاصة بنا. نرسل الجمال فقط إلى بريدك.
                </p>
            </div>
        </section>
    );
}

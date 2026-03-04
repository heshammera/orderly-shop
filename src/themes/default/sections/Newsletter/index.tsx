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
        <section className="py-20 bg-primary/5 text-center px-4">
            <div className="max-w-2xl mx-auto space-y-6">

                {settings.heading && (
                    <InlineEditableText
                        as="h2"
                        sectionId={sectionId}
                        settingId="heading"
                        value={settings.heading}
                        className="text-3xl md:text-4xl font-bold text-foreground"
                    />
                )}

                {settings.subheading && (
                    <InlineEditableText
                        as="p"
                        sectionId={sectionId}
                        settingId="subheading"
                        value={settings.subheading}
                        className="text-lg text-muted-foreground"
                    />
                )}

                <form className="mt-8 flex flex-col sm:flex-row max-w-md mx-auto gap-3" onSubmit={(e) => e.preventDefault()}>
                    <input
                        type="email"
                        placeholder={settings.placeholder || 'أدخل بريدك الإلكتروني'}
                        className="flex-1 rounded-full border border-input bg-background px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        required
                    />
                    <button
                        type="submit"
                        className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all whitespace-nowrap"
                    >
                        {settings.button_label || 'اشتراك'}
                    </button>
                </form>

                <p className="text-xs text-muted-foreground mt-4">
                    بالاشتراك، أنت توافق على شروط الخدمة وسياسة الخصوصية الخاصة بنا.
                </p>
            </div>
        </section>
    );
}

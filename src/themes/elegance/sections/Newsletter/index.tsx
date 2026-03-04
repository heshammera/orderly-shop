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
        <section className="py-12 lg:py-24 bg-white border-t border-gray-200">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center rounded-lg p-4 sm:p-0">
                    <div className="mb-8 w-full max-w-2xl text-center">
                        {settings.heading && (
                            <InlineEditableText
                                as="h2"
                                sectionId={sectionId}
                                settingId="heading"
                                value={settings.heading}
                                className="text-xl font-bold sm:text-2xl lg:text-3xl text-gray-900 inline-block"
                            />
                        )}
                        {settings.subheading && (
                            <InlineEditableText
                                as="p"
                                sectionId={sectionId}
                                settingId="subheading"
                                value={settings.subheading}
                                className="mt-4 text-gray-600 text-lg"
                            />
                        )}
                    </div>

                    <div className="w-full max-w-md">
                        <form className="flex w-full gap-2 flex-col sm:flex-row" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder={settings.placeholder || 'Enter your email address'}
                                className="w-full flex-1 rounded-full px-4 py-3 border border-gray-300 text-gray-700 placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                required
                            />
                            <button
                                type="submit"
                                className="bg-primary border-2 border-primary hover:bg-transparent hover:text-primary text-white font-bold py-3 px-8 rounded-full transition-colors whitespace-nowrap"
                            >
                                {settings.button_label || 'Subscribe'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}

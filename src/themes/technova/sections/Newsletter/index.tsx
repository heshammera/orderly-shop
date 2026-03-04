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
        <section className="py-20 px-4 relative overflow-hidden" style={{ background: '#0a0a1a' }}>
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #00d4ff, transparent)' }}></div>

            <div className="max-w-2xl mx-auto relative z-10 text-center">
                {/* Icon */}
                <div className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                </div>

                {settings.heading && (
                    <InlineEditableText
                        as="h2"
                        sectionId={sectionId}
                        settingId="heading"
                        value={settings.heading}
                        className="text-3xl md:text-4xl font-bold text-white mb-4"
                    />
                )}

                {settings.subheading && (
                    <InlineEditableText
                        as="p"
                        sectionId={sectionId}
                        settingId="subheading"
                        value={settings.subheading}
                        className="text-lg text-gray-500 mb-8"
                    />
                )}

                <form className="flex flex-col sm:flex-row max-w-md mx-auto gap-3" onSubmit={(e) => e.preventDefault()}>
                    <input
                        type="email"
                        placeholder={settings.placeholder || 'أدخل بريدك الإلكتروني'}
                        className="flex-1 rounded-full px-6 py-3.5 text-sm outline-none text-white placeholder-gray-500 transition-all focus:ring-2 focus:ring-cyan-500/50"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        required
                    />
                    <button
                        type="submit"
                        className="rounded-full px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 whitespace-nowrap"
                        style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}
                    >
                        {settings.button_label || 'اشتراك'}
                    </button>
                </form>

                <p className="text-xs text-gray-600 mt-5">
                    بالاشتراك، أنت توافق على شروط الخدمة وسياسة الخصوصية الخاصة بنا.
                </p>
            </div>
        </section>
    );
}

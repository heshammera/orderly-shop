import React from 'react';
import Link from 'next/link';
import InlineEditableText from '@/components/ThemeEngine/InlineEditableText';

interface FooterProps {
    settings: {
        about_heading?: string;
        about_text?: string;
        links_heading?: string;
        contact_heading?: string;
        contact_email?: string;
        contact_phone?: string;
        copyright?: string;
    };
    sectionId?: string;
}

export default function Footer({ settings, sectionId = 'footer_1' }: FooterProps) {
    return (
        <footer className="bg-[#ffafcc] text-[#2d2d2d] pt-24 pb-12 relative overflow-hidden">
            {/* Colorful "Stickers" decorations */}
            <div className="absolute top-10 left-10 w-16 h-16 bg-[#00b4d8] rounded-xl rotate-12 opacity-20"></div>
            <div className="absolute top-40 right-10 w-12 h-12 bg-[#ffbe0b] rounded-full opacity-20"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                    {/* Brand */}
                    <div className="md:col-span-1 space-y-8">
                        <div className="text-3xl font-black tracking-tight text-[#ff6b6b] flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center -rotate-6 border-2 border-[#ffbe0b]">
                                <span className="text-white text-xl">🚀</span>
                            </div>
                            KidsWonder
                        </div>
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="about_text"
                            value={settings.about_text || 'متجر العجائب حيث تتحقق الأحلام. نحن نهتم بابتسامة طفلك.'}
                            className="text-[#2d2d2d] leading-relaxed font-black text-sm"
                        />
                    </div>

                    {/* Fun Stuff */}
                    <div className="space-y-6">
                        <InlineEditableText
                            as="h3"
                            sectionId={sectionId}
                            settingId="links_heading"
                            value={settings.links_heading || 'عالم المرح'}
                            className="text-[#ff6b6b] font-black uppercase tracking-widest text-xs"
                        />
                        <ul className="space-y-4 font-black text-sm">
                            <li><Link href="#" className="hover:text-white transition-colors">ألعاب ذكية</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">عالم المحاكاة</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">ألعاب الفيديو</Link></li>
                        </ul>
                    </div>

                    {/* Parents Corner */}
                    <div className="space-y-6">
                        <h3 className="text-[#ff6b6b] font-black uppercase tracking-widest text-xs">ركن الآباء</h3>
                        <ul className="space-y-4 font-black text-sm">
                            <li><Link href="#" className="hover:text-white transition-colors">الأمان جودة</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">سياسة التوصيل</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">الاسترجاع</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-6">
                        <InlineEditableText
                            as="h3"
                            sectionId={sectionId}
                            settingId="contact_heading"
                            value={settings.contact_heading || 'تواصل معنا'}
                            className="text-[#ff6b6b] font-black uppercase tracking-widest text-xs"
                        />
                        <ul className="space-y-6 font-black text-sm">
                            <li className="flex flex-col gap-1">
                                <span className="text-white/60 uppercase text-[10px] tracking-[0.2em]">Email Us</span>
                                <InlineEditableText as="span" sectionId={sectionId} settingId="contact_email" value={settings.contact_email || 'hello@kidswonder.com'} />
                            </li>
                            <li className="flex flex-col gap-1">
                                <span className="text-white/60 uppercase text-[10px] tracking-[0.2em]">Magic Line</span>
                                <InlineEditableText as="span" sectionId={sectionId} settingId="contact_phone" value={settings.contact_phone || '+966 800 WONDER'} />
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-12 border-t border-white/20 flex flex-col md:flex-row items-center justify-between gap-8 text-[#2d2d2d] text-[10px] font-black uppercase tracking-[0.3em]">
                    <InlineEditableText
                        as="p"
                        sectionId={sectionId}
                        settingId="copyright"
                        value={settings.copyright || 'All Rights Reserved © 2026 KIDS WONDERLAND'}
                    />
                </div>

                {/* ── Powered by ORDERLY ── */}
                <div className="mt-10 pt-8 border-t border-white/20">
                    <a
                        href="https://orderly.shop"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col items-center justify-center gap-3 py-6 rounded-2xl transition-all duration-500 hover:scale-105"
                    >
                        <span className="text-sm font-semibold text-white/50 tracking-widest uppercase">Powered by</span>
                        <span className="text-3xl md:text-4xl font-black tracking-[0.15em] bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent drop-shadow-lg group-hover:from-orange-400 group-hover:via-amber-400 group-hover:to-yellow-400 transition-all duration-700">
                            ORDERLY
                        </span>
                        <span className="flex items-center gap-2 text-xs text-white/40">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
                            </span>
                            E-Commerce Platform
                        </span>
                    </a>
                </div>
            </div>
        </footer>
    );
}

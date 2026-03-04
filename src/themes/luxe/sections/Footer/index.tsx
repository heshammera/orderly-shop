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
        <footer className="bg-[#050505] text-white border-t border-zinc-900 pt-24 pb-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
                    {/* Brand */}
                    <div className="md:col-span-1 space-y-8">
                        <div className="text-3xl font-serif italic tracking-tighter text-white">LUXE JEWELS</div>
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="about_text"
                            value={settings.about_text || 'نقدم لكم نتاج سنوات من الحرفية والإتقان في عالم المجوهرات الفاخرة.'}
                            className="text-zinc-500 leading-relaxed font-light italic"
                        />
                    </div>

                    {/* Navigation */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <InlineEditableText
                                as="h3"
                                sectionId={sectionId}
                                settingId="links_heading"
                                value={settings.links_heading || 'المجموعات'}
                                className="text-xs uppercase tracking-[0.4em] font-bold text-amber-400"
                            />
                        </div>
                        <ul className="space-y-4 font-serif text-lg italic text-zinc-400">
                            <li><Link href="#" className="hover:text-amber-400 transition-colors">عقود الألماس</Link></li>
                            <li><Link href="#" className="hover:text-amber-400 transition-colors">خواتم الزفاف</Link></li>
                            <li><Link href="#" className="hover:text-amber-400 transition-colors">أقراط فاخرة</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="space-y-8">
                        <h3 className="text-xs uppercase tracking-[0.4em] font-bold text-amber-400">الخدمات</h3>
                        <ul className="space-y-4 font-serif text-lg italic text-zinc-400">
                            <li><Link href="#" className="hover:text-amber-400 transition-colors">دليل المقاسات</Link></li>
                            <li><Link href="#" className="hover:text-amber-400 transition-colors">خدمة العملاء</Link></li>
                            <li><Link href="#" className="hover:text-amber-400 transition-colors">سياسة الخصوصية</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-8">
                        <InlineEditableText
                            as="h3"
                            sectionId={sectionId}
                            settingId="contact_heading"
                            value={settings.contact_heading || 'بيت المجوهرات'}
                            className="text-xs uppercase tracking-[0.4em] font-bold text-amber-400"
                        />
                        <ul className="space-y-6 text-zinc-400 font-light tracking-wide">
                            <li className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase text-zinc-600">Email</span>
                                <InlineEditableText as="span" sectionId={sectionId} settingId="contact_email" value={settings.contact_email || 'concierge@luxe.com'} />
                            </li>
                            <li className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase text-zinc-600">Phone</span>
                                <InlineEditableText as="span" sectionId={sectionId} settingId="contact_phone" value={settings.contact_phone || '+966 800 LUXE'} />
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-12 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-8 text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-bold">
                    <InlineEditableText
                        as="p"
                        sectionId={sectionId}
                        settingId="copyright"
                        value={settings.copyright || 'All Rights Reserved © 2026 LUXE JEWELS'}
                    />
                </div>

                {/* ── Powered by ORDERLY ── */}
                <div className="mt-10 pt-8 border-t border-zinc-900">
                    <a
                        href="https://orderly.shop"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col items-center justify-center gap-3 py-6 rounded-2xl transition-all duration-500 hover:scale-105"
                    >
                        <span className="text-sm font-semibold text-zinc-600 tracking-widest uppercase">Powered by</span>
                        <span className="text-3xl md:text-4xl font-black tracking-[0.15em] bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-lg group-hover:from-yellow-300 group-hover:via-amber-400 group-hover:to-yellow-500 transition-all duration-700">
                            ORDERLY
                        </span>
                        <span className="flex items-center gap-2 text-xs text-zinc-600">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                            </span>
                            E-Commerce Platform
                        </span>
                    </a>
                </div>
            </div>
        </footer>
    );
}

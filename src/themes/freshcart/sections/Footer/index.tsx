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
        <footer className="bg-[#1b4332] text-white pt-24 pb-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20 border-b border-[#2d6a4f] pb-20">
                    {/* Brand */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#52b788] rounded-lg rotate-3 flex items-center justify-center">
                                <span className="text-white text-xl">F</span>
                            </div>
                            FRESHCART
                        </div>
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="about_text"
                            value={settings.about_text || 'نحن نوفر لك أفضل المنتجات العضوية والطازجة يومياً من الحقول إليك مباشرة.'}
                            className="text-[#95d5b2] leading-relaxed font-medium"
                        />
                    </div>

                    {/* Shop */}
                    <div className="space-y-6">
                        <InlineEditableText
                            as="h3"
                            sectionId={sectionId}
                            settingId="links_heading"
                            value={settings.links_heading || 'تسوق الآن'}
                            className="text-white font-black uppercase tracking-widest text-sm"
                        />
                        <ul className="space-y-4 font-bold text-[#b7e4c7]">
                            <li><Link href="#" className="hover:text-white transition-colors">خضروات عضوية</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">فواكه طازجة</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">منتجات الألبان</Link></li>
                        </ul>
                    </div>

                    {/* Care */}
                    <div className="space-y-6">
                        <h3 className="text-white font-black uppercase tracking-widest text-sm">اهتماماتنا</h3>
                        <ul className="space-y-4 font-bold text-[#b7e4c7]">
                            <li><Link href="#" className="hover:text-white transition-colors">الجودة أولاً</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">مزارعنا</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">الاستدامة</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-6">
                        <InlineEditableText
                            as="h3"
                            sectionId={sectionId}
                            settingId="contact_heading"
                            value={settings.contact_heading || 'اتصل بنا'}
                            className="text-white font-black uppercase tracking-widest text-sm"
                        />
                        <ul className="space-y-6 font-bold text-[#b7e4c7]">
                            <li className="flex flex-col gap-1">
                                <span className="text-[#40916c] uppercase text-[10px] tracking-[0.2em]">Support</span>
                                <InlineEditableText as="span" sectionId={sectionId} settingId="contact_email" value={settings.contact_email || 'fresh@cart.com'} />
                            </li>
                            <li className="flex flex-col gap-1">
                                <span className="text-[#40916c] uppercase text-[10px] tracking-[0.2em]">Hotline</span>
                                <InlineEditableText as="span" sectionId={sectionId} settingId="contact_phone" value={settings.contact_phone || '+966 800 FRESH'} />
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-[#40916c] text-[10px] font-black uppercase tracking-[0.3em]">
                    <InlineEditableText
                        as="p"
                        sectionId={sectionId}
                        settingId="copyright"
                        value={settings.copyright || 'All Rights Reserved © 2026 FRESHCART ORGANIC'}
                    />
                    <a href="https://orderly.shop" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity text-[#40916c]">
                        <span>Powered by</span>
                        <span className="font-bold tracking-tighter text-[#2d6a4f]">ORDERLY</span>
                    </a>
                </div>
            </div>
        </footer>
    );
}

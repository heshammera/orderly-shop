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
        <footer className="bg-white text-stone-800 border-t border-stone-100 pt-24 pb-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                    {/* Brand */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="text-2xl font-light tracking-[0.2em] text-stone-900 uppercase">GLOW BEAUTY</div>
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="about_text"
                            value={settings.about_text || 'نؤمن في جلو بأن الجمال يبدأ من الطبيعة، نختار لك أفضل المكونات بعناية.'}
                            className="text-stone-500 leading-relaxed font-medium"
                        />
                    </div>

                    {/* Navigation */}
                    <div className="space-y-6">
                        <InlineEditableText
                            as="h3"
                            sectionId={sectionId}
                            settingId="links_heading"
                            value={settings.links_heading || 'تسوقي حسب الفئة'}
                            className="text-sm font-black uppercase tracking-widest text-[#e0afa0]"
                        />
                        <ul className="space-y-4 font-medium text-stone-500">
                            <li><Link href="#" className="hover:text-[#d4a373] transition-colors">منتجات الوجه</Link></li>
                            <li><Link href="#" className="hover:text-[#d4a373] transition-colors">عناية بالجسم</Link></li>
                            <li><Link href="#" className="hover:text-[#d4a373] transition-colors">المكياج</Link></li>
                        </ul>
                    </div>

                    {/* Links */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#e0afa0]">معلومات</h3>
                        <ul className="space-y-4 font-medium text-stone-500">
                            <li><Link href="#" className="hover:text-[#d4a373] transition-colors">من نحن</Link></li>
                            <li><Link href="#" className="hover:text-[#d4a373] transition-colors">قصتنا</Link></li>
                            <li><Link href="#" className="hover:text-[#d4a373] transition-colors">الأسئلة الشائعة</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-6">
                        <InlineEditableText
                            as="h3"
                            sectionId={sectionId}
                            settingId="contact_heading"
                            value={settings.contact_heading || 'تواصلي معنا'}
                            className="text-sm font-black uppercase tracking-widest text-[#e0afa0]"
                        />
                        <ul className="space-y-4 font-medium text-stone-500">
                            <li className="flex flex-col gap-1">
                                <span className="text-[10px] text-stone-300 font-bold uppercase">Email</span>
                                <InlineEditableText as="span" sectionId={sectionId} settingId="contact_email" value={settings.contact_email || 'hello@glow.com'} />
                            </li>
                            <li className="flex flex-col gap-1">
                                <span className="text-[10px] text-stone-300 font-bold uppercase">Phone</span>
                                <InlineEditableText as="span" sectionId={sectionId} settingId="contact_phone" value={settings.contact_phone || '+966 800 GLOW'} />
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-8 border-t border-stone-100 flex flex-col md:flex-row items-center justify-between gap-6 text-stone-400 text-xs font-bold uppercase tracking-widest">
                    <InlineEditableText
                        as="p"
                        sectionId={sectionId}
                        settingId="copyright"
                        value={settings.copyright || 'All Rights Reserved © 2026 GLOW BEAUTY'}
                    />
                    <div className="flex items-center gap-4 grayscale opacity-30">
                        <span className="bg-stone-800 text-white px-3 py-1 rounded italic low-caps text-[10px]">PREMIUM EXPERIENCE</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

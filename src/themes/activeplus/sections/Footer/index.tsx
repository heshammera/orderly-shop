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
        <footer className="bg-black text-white border-t border-zinc-900 pt-24 pb-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                    {/* Brand */}
                    <div className="md:col-span-1 space-y-8">
                        <div className="text-3xl font-black tracking-tighter text-white uppercase italic">ACTIVE<span className="text-blue-600">+</span></div>
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="about_text"
                            value={settings.about_text || 'معدات رياضية صالحة للأبطال. نحن هنا لرفع مستوى أدائك.'}
                            className="text-zinc-500 leading-relaxed font-bold uppercase text-xs tracking-widest"
                        />
                    </div>

                    {/* Navigation */}
                    <div className="space-y-6">
                        <InlineEditableText
                            as="h3"
                            sectionId={sectionId}
                            settingId="links_heading"
                            value={settings.links_heading || 'المعدات'}
                            className="text-sm font-black uppercase tracking-widest text-blue-600 italic"
                        />
                        <ul className="space-y-4 font-black uppercase text-xs tracking-tighter text-zinc-400">
                            <li><Link href="#" className="hover:text-blue-500 transition-colors">معدات القوة</Link></li>
                            <li><Link href="#" className="hover:text-blue-500 transition-colors">أجهزة الكارديو</Link></li>
                            <li><Link href="#" className="hover:text-blue-500 transition-colors">الاكسسوارات</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-blue-600 italic">الدعم</h3>
                        <ul className="space-y-4 font-black uppercase text-xs tracking-tighter text-zinc-400">
                            <li><Link href="#" className="hover:text-blue-500 transition-colors">مركز المساعدة</Link></li>
                            <li><Link href="#" className="hover:text-blue-500 transition-colors">تتبع الطلب</Link></li>
                            <li><Link href="#" className="hover:text-blue-500 transition-colors">سياسة الضمان</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-6">
                        <InlineEditableText
                            as="h3"
                            sectionId={sectionId}
                            settingId="contact_heading"
                            value={settings.contact_heading || 'اتصل بنا'}
                            className="text-sm font-black uppercase tracking-widest text-blue-600 italic"
                        />
                        <ul className="space-y-6 font-black uppercase text-xs text-zinc-400">
                            <li className="flex flex-col gap-1">
                                <span className="text-blue-500/50">Support Email</span>
                                <InlineEditableText as="span" sectionId={sectionId} settingId="contact_email" value={settings.contact_email || 'support@activeplus.com'} />
                            </li>
                            <li className="flex flex-col gap-1">
                                <span className="text-blue-500/50">Customer Care</span>
                                <InlineEditableText as="span" sectionId={sectionId} settingId="contact_phone" value={settings.contact_phone || '+966 800 ACTIVE'} />
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-12 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-8 text-zinc-700 text-[10px] font-black uppercase tracking-[0.3em]">
                    <InlineEditableText
                        as="p"
                        sectionId={sectionId}
                        settingId="copyright"
                        value={settings.copyright || 'All Rights Reserved © 2026 ACTIVE+ PERFORMANCE'}
                    />
                    <a href="https://orderly.shop" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity text-zinc-500">
                        <span>Powered by</span>
                        <span className="font-bold tracking-tighter" style={{ color: '#3b82f6' }}>ORDERLY</span>
                    </a>
                </div>
            </div>
        </footer>
    );
}

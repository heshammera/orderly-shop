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
        <footer className="bg-[#faf9f6] text-stone-900 border-t border-stone-200 pt-20 pb-10">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                    {/* Brand & About */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="text-2xl font-black tracking-tighter text-stone-900">COZY HOME</div>
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="about_text"
                            value={settings.about_text || 'نحن نقدم أفضل المنتجات جودة وأسعاراً تنافسية لعملائنا في جميع أنحاء العالم.'}
                            className="text-stone-500 leading-relaxed font-medium"
                        />
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        <InlineEditableText
                            as="h3"
                            sectionId={sectionId}
                            settingId="links_heading"
                            value={settings.links_heading || 'روابط سريعة'}
                            className="text-lg font-bold text-stone-900"
                        />
                        <ul className="space-y-4 font-medium text-stone-500">
                            <li><Link href="#" className="hover:text-stone-900 transition-colors">الرئيسية</Link></li>
                            <li><Link href="#" className="hover:text-stone-900 transition-colors">المنتجات</Link></li>
                            <li><Link href="#" className="hover:text-stone-900 transition-colors">من نحن</Link></li>
                            <li><Link href="#" className="hover:text-stone-900 transition-colors">تواصل معنا</Link></li>
                        </ul>
                    </div>

                    {/* Shop */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-stone-900">تسوق الآن</h3>
                        <ul className="space-y-4 font-medium text-stone-500">
                            <li><Link href="#" className="hover:text-stone-900 transition-colors">غرف المعيشة</Link></li>
                            <li><Link href="#" className="hover:text-stone-900 transition-colors">غرف النوم</Link></li>
                            <li><Link href="#" className="hover:text-stone-900 transition-colors">المطابخ</Link></li>
                            <li><Link href="#" className="hover:text-stone-900 transition-colors">إكسسوارات</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-6">
                        <InlineEditableText
                            as="h3"
                            sectionId={sectionId}
                            settingId="contact_heading"
                            value={settings.contact_heading || 'تواصل معنا'}
                            className="text-lg font-bold text-stone-900"
                        />
                        <ul className="space-y-4 font-medium text-stone-500">
                            <li className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                </div>
                                <InlineEditableText as="span" sectionId={sectionId} settingId="contact_email" value={settings.contact_email || 'support@example.com'} />
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                </div>
                                <InlineEditableText as="span" sectionId={sectionId} settingId="contact_phone" value={settings.contact_phone || '+966 000 000 000'} />
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-8 border-t border-stone-200 flex flex-col md:flex-row items-center justify-between gap-6 text-stone-400 text-sm font-medium">
                    <InlineEditableText
                        as="p"
                        sectionId={sectionId}
                        settingId="copyright"
                        value={settings.copyright || 'جميع الحقوق محفوظة © 2026 COZY HOME'}
                    />
                </div>


            </div>
        </footer>
    );
}

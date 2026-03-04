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
        <footer className="bg-card text-card-foreground border-t border-border mt-16 pb-6 pt-12 text-sm">
            <div className="container mx-auto px-4">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">

                    {/* About Section */}
                    <div className="flex flex-col gap-4">
                        <InlineEditableText
                            as="h3"
                            sectionId={sectionId}
                            settingId="about_heading"
                            value={settings.about_heading || 'عن متجرنا'}
                            className="text-lg font-bold"
                        />
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="about_text"
                            value={settings.about_text || 'نحن نقدم أفضل المنتجات جودة وأسعاراً تنافسية لعملائنا في جميع أنحاء العالم.'}
                            className="text-muted-foreground leading-relaxed max-w-sm"
                        />
                    </div>

                    {/* Quick Links Section */}
                    <div className="flex flex-col gap-4">
                        <InlineEditableText
                            as="h3"
                            sectionId={sectionId}
                            settingId="links_heading"
                            value={settings.links_heading || 'روابط سريعة'}
                            className="text-lg font-bold"
                        />
                        <ul className="flex flex-col gap-2 text-muted-foreground">
                            <li><Link href="#" className="hover:text-primary transition-colors">الرئيسية</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">المنتجات</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">من نحن</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">تواصل معنا</Link></li>
                        </ul>
                    </div>

                    {/* Contact Section */}
                    <div className="flex flex-col gap-4">
                        <InlineEditableText
                            as="h3"
                            sectionId={sectionId}
                            settingId="contact_heading"
                            value={settings.contact_heading || 'تواصل معنا'}
                            className="text-lg font-bold"
                        />
                        <ul className="flex flex-col gap-3 text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                <InlineEditableText as="span" sectionId={sectionId} settingId="contact_email" value={settings.contact_email || 'support@example.com'} />
                            </li>
                            <li className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                <InlineEditableText as="span" sectionId={sectionId} settingId="contact_phone" value={settings.contact_phone || '+966 000 000 000'} />
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer Bottom / Copyright */}
                <div className="pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-muted-foreground text-xs md:text-sm">
                    <InlineEditableText
                        as="p"
                        sectionId={sectionId}
                        settingId="copyright"
                        value={settings.copyright || 'جميع الحقوق محفوظة © 2026'}
                    />
                    <a href="https://orderly.shop" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
                        <span>Powered by</span>
                        <span className="font-bold tracking-tighter text-primary">ORDERLY</span>
                    </a>
                </div>
            </div>
        </footer>
    );
}

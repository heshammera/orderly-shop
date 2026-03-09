import React from 'react';
import Link from 'next/link';
import InlineEditableText from '@/components/ThemeEngine/InlineEditableText';

interface FooterBlock {
    type: string;
    settings: {
        label?: string;
        url?: string;
    };
}

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
    blocks?: FooterBlock[];
    sectionId?: string;
    storeContext?: any;
}

export default function Footer({ settings, blocks = [], sectionId = 'footer_1', storeContext }: FooterProps) {
    const storeName = storeContext?.store?.name?.ar || storeContext?.store?.name?.en || 'Store';
    const publicContact = storeContext?.store?.settings?.public_contact || {};

    const displayEmail = settings.contact_email || publicContact.email || 'support@example.com';
    const displayPhone = settings.contact_phone || publicContact.phone || '+966 000 000 000';
    const displayAbout = settings.about_text || storeContext?.store?.description?.ar || storeContext?.store?.description?.en || 'نحن نقدم أفضل المنتجات جودة وأسعاراً تنافسية لعملائنا في جميع أنحاء العالم.';

    const defaultLinks = [
        { settings: { label: 'الرئيسية', url: '/' } },
        { settings: { label: 'المنتجات', url: '/products' } },
        { settings: { label: 'من نحن', url: '#' } },
        { settings: { label: 'تواصل معنا', url: '#' } },
    ];

    const displayLinks = blocks.length > 0 ? blocks : defaultLinks;

    return (
        <footer className="bg-card text-card-foreground border-t border-border mt-8 md:mt-8 pb-4 md:pb-6 pt-8 md:pt-12 text-sm">
            <div className="container mx-auto px-4">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-y-8 gap-x-4 md:gap-8 mb-8 md:mb-6">

                    {/* About Section */}
                    <div className="flex flex-col gap-3 md:gap-4 col-span-2 lg:col-span-1">
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
                            value={displayAbout}
                            className="text-muted-foreground leading-relaxed max-w-sm"
                        />
                    </div>

                    {/* Quick Links Section */}
                    <div className="flex flex-col gap-3 md:gap-4">
                        <InlineEditableText
                            as="h3"
                            sectionId={sectionId}
                            settingId="links_heading"
                            value={settings.links_heading || 'روابط سريعة'}
                            className="text-lg font-bold"
                        />
                        <ul className="flex flex-col gap-2 text-muted-foreground">
                            {displayLinks.map((link, i) => (
                                <li key={i}>
                                    <Link href={link.settings.url || '#'} className="hover:text-primary transition-colors">
                                        {link.settings.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Section */}
                    <div className="flex flex-col gap-3 md:gap-4">
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
                                <InlineEditableText as="span" sectionId={sectionId} settingId="contact_email" value={displayEmail} />
                            </li>
                            <li className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                <InlineEditableText as="span" sectionId={sectionId} settingId="contact_phone" value={displayPhone} />
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer Bottom / Copyright */}
                <div className="pt-4 md:pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-muted-foreground text-xs md:text-sm">
                    <InlineEditableText
                        as="p"
                        sectionId={sectionId}
                        settingId="copyright"
                        value={settings.copyright || `جميع الحقوق محفوظة © ${new Date().getFullYear()} ${storeName}`}
                    />
                </div>


            </div>
        </footer>
    );
}

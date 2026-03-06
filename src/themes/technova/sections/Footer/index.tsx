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
    const storeName = storeContext?.store?.name?.ar || storeContext?.store?.name?.en || 'TechNova';
    const publicContact = storeContext?.store?.settings?.public_contact || {};

    const displayEmail = settings.contact_email || publicContact.email || 'support@technova.com';
    const displayPhone = settings.contact_phone || publicContact.phone || '+966 000 000 000';
    const displayAbout = settings.about_text || storeContext?.store?.description?.ar || storeContext?.store?.description?.en || 'وجهتك الأولى لأحدث التقنيات والأجهزة الإلكترونية بأفضل الأسعار.';

    const defaultLinks = [
        { settings: { label: 'الرئيسية', url: '/' } },
        { settings: { label: 'المنتجات', url: '/products' } },
        { settings: { label: 'من نحن', url: '#' } },
        { settings: { label: 'تواصل معنا', url: '#' } },
    ];

    const displayLinks = blocks.length > 0 ? blocks : defaultLinks;

    return (
        <footer className="pb-6 pt-16 text-sm" style={{ background: '#060610', borderTop: '1px solid rgba(0,212,255,0.1)' }}>
            <div className="container mx-auto px-4">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
                    {/* About */}
                    <div className="flex flex-col gap-4">
                        <span className="text-xl font-black text-white">
                            {storeName}
                        </span>
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="about_text"
                            value={displayAbout}
                            className="text-gray-500 leading-relaxed max-w-sm"
                        />
                        {/* Social Icons */}
                        <div className="flex gap-3 mt-2">
                            {['M22 4s-.7 2.1-2 3.4c1.6 10-9.6 17.3-19 12 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z', 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z'].map((path, i) => (
                                <a key={i} href="#" className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.15)' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="flex flex-col gap-4">
                        <InlineEditableText
                            as="h3"
                            sectionId={sectionId}
                            settingId="links_heading"
                            value={settings.links_heading || 'روابط سريعة'}
                            className="text-lg font-bold text-white"
                        />
                        <ul className="flex flex-col gap-3 text-gray-500">
                            {displayLinks.map((link, i) => (
                                <li key={i}>
                                    <Link href={link.settings.url || '#'} className="hover:text-cyan-400 transition-colors flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#00d4ff' }}></span>
                                        {link.settings.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="flex flex-col gap-4">
                        <InlineEditableText
                            as="h3"
                            sectionId={sectionId}
                            settingId="contact_heading"
                            value={settings.contact_heading || 'تواصل معنا'}
                            className="text-lg font-bold text-white"
                        />
                        <ul className="flex flex-col gap-3 text-gray-500">
                            <li className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                </div>
                                <InlineEditableText as="span" sectionId={sectionId} settingId="contact_email" value={displayEmail} />
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                </div>
                                <InlineEditableText as="span" sectionId={sectionId} settingId="contact_phone" value={displayPhone} />
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright Bar */}
                <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-600 text-xs md:text-sm" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
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

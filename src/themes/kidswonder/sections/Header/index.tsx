import React from 'react';
import Link from 'next/link';
import InlineEditableText from '@/components/ThemeEngine/InlineEditableText';
import { useLanguage } from '@/contexts/LanguageContext';

interface HeaderLink {
    type: string;
    settings: {
        label?: string;
        url?: string;
    };
}

interface HeaderProps {
    settings: {
        logo?: string;
        notice_text?: string;
        search_placeholder?: string;
    };
    blocks?: HeaderLink[];
    sectionId?: string;
    storeContext?: any;
}

export default function Header({ settings, blocks = [], sectionId = 'header_1', storeContext }: HeaderProps) {
    const { language } = useLanguage();
    const store = storeContext?.store || storeContext;
    const storeName = store?.name ? (typeof store.name === 'string' ? store.name : store.name[language] || store.name.ar || store.name.en) : 'Store';
    const storeSlug = store?.slug || '';

    const defaultLinks = [
        { settings: { label: 'الرئيسية', url: '/' } },
        { settings: { label: 'الألعاب', url: '/products' } },
        { settings: { label: 'جديدنا', url: '/new' } },
        { settings: { label: 'تخفيضات', url: '/sale' } },
    ];

    const displayLinks = blocks.length > 0 ? blocks : defaultLinks;

    return (
        <header className="w-full bg-white sticky top-0 z-50">
            {/* Playful Announcement Bar */}
            {settings.notice_text !== undefined && settings.notice_text !== '' && (
                <div className="w-full bg-[#FF6B6B] text-white py-2 px-4 text-center text-sm font-bold tracking-wide relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:10px_10px]"></div>
                    <InlineEditableText
                        as="span"
                        sectionId={sectionId}
                        settingId="notice_text"
                        value={settings.notice_text}
                    />
                </div>
            )}

            <div className="container mx-auto px-4 h-20 md:h-24 flex items-center justify-between gap-4">
                {/* Logo with playful font */}
                <Link href={storeSlug ? `/s/${storeSlug}` : '/'} className="shrink-0 flex items-center gap-2 group">
                    {settings.logo || store?.logo_url ? (
                        <div className="h-10 md:h-12 w-auto max-w-[150px]">
                            <img src={settings.logo || store?.logo_url} alt={storeName} className="h-full w-auto object-contain" />
                        </div>
                    ) : (
                        <>
                            <div className="h-12 w-12 bg-[#4ECDC4] rounded-2xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform shadow-lg border-2 border-white">
                                <span className="text-white text-2xl font-black">K</span>
                            </div>
                            <span className="text-2xl md:text-3xl font-black lowercase tracking-tighter text-[#2D3436]">
                                {storeName}
                            </span>
                        </>
                    )}
                </Link>

                {/* Desktop Navigation - Rounded and colorful hover */}
                <nav className="hidden md:flex flex-1 items-center justify-center gap-2">
                    {displayLinks.map((link, idx) => (
                        <Link
                            key={idx}
                            href={link.settings.url || '#'}
                            className="px-4 py-2 rounded-full text-sm font-black text-[#636E72] hover:text-white hover:bg-[#FFE66D] hover:shadow-md transition-all active:scale-95"
                        >
                            {link.settings.label}
                        </Link>
                    ))}
                </nav>

                {/* Search & Cart Actions - Bubbly style */}
                <div className="flex items-center gap-3 shrink-0">
                    <button className="p-3 text-[#2D3436] bg-[#F1F2F6] hover:bg-[#FFE66D] rounded-2xl transition-all shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </button>

                    <button className="p-3 text-[#2D3436] bg-[#F1F2F6] hover:bg-[#FF6B6B] hover:text-white rounded-2xl transition-all shadow-sm relative group">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h1.49a2 2 0 0 1 1.95 1.57l1.1 4.38m0 0 2.22 8.81a2 2 0 0 0 1.95 1.57h8.41a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                        <span className="absolute -top-1 -right-1 h-6 w-6 bg-[#4ECDC4] text-white text-[11px] font-black flex items-center justify-center rounded-full border-2 border-white group-hover:scale-110 transition-transform">
                            3
                        </span>
                    </button>
                </div>
            </div>
        </header>
    );
}

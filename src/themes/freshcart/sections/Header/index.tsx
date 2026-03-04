import React from 'react';
import Link from 'next/link';
import InlineEditableText from '@/components/ThemeEngine/InlineEditableText';

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
}

export default function Header({ settings, blocks = [], sectionId = 'header_1' }: HeaderProps) {
    const defaultLinks = [
        { settings: { label: 'الرئيسية', url: '/' } },
        { settings: { label: 'خضروات وفواكه', url: '/produce' } },
        { settings: { label: 'منتجات عضوية', url: '/organic' } },
        { settings: { label: 'عروض اليوم', url: '/deals' } },
    ];

    const displayLinks = blocks.length > 0 ? blocks : defaultLinks;

    return (
        <header className="w-full bg-white sticky top-0 z-50 border-b border-green-50 shadow-sm">
            {/* Organic Announcement Bar */}
            {settings.notice_text !== undefined && settings.notice_text !== '' && (
                <div className="w-full bg-[#10b981] text-white py-2 px-4 text-center text-xs md:text-sm font-bold bg-[url('https://www.transparenttextures.com/patterns/leaf.png')]">
                    <InlineEditableText
                        as="span"
                        sectionId={sectionId}
                        settingId="notice_text"
                        value={settings.notice_text}
                    />
                </div>
            )}

            <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
                {/* FreshCart Logo */}
                <Link href="/" className="shrink-0 flex items-center gap-2 group">
                    <div className="bg-[#10b981] w-10 h-10 rounded-full flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                    </div>
                    <span className="text-2xl font-black text-slate-800 tracking-tighter">
                        Fresh<span className="text-[#10b981]">Cart</span>
                    </span>
                </Link>

                {/* Desktop Navigation - Rounded hover */}
                <nav className="hidden lg:flex flex-1 items-center justify-center gap-2">
                    {displayLinks.map((link, idx) => (
                        <Link
                            key={idx}
                            href={link.settings.url || '#'}
                            className="px-5 py-2 rounded-full text-sm font-bold text-slate-600 hover:text-white hover:bg-[#10b981] transition-all"
                        >
                            {link.settings.label}
                        </Link>
                    ))}
                </nav>

                {/* Search & Cart Actions */}
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    <div className="hidden md:flex relative w-48 lg:w-64">
                        <input
                            type="search"
                            placeholder={settings.search_placeholder || 'ابحث عن طعام طازج...'}
                            className="w-full rounded-full border border-green-100 bg-green-50/30 px-5 py-2.5 text-xs outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all"
                        />
                    </div>

                    <button className="p-2.5 text-slate-600 bg-slate-50 hover:bg-green-50 hover:text-[#10b981] rounded-full transition-all relative group">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h1.49a2 2 0 0 1 1.95 1.57l1.1 4.38m0 0 2.22 8.81a2 2 0 0 0 1.95 1.57h8.41a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                        <span className="absolute top-0 right-0 h-5 w-5 bg-orange-400 text-white text-[10px] font-bold flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                            5
                        </span>
                    </button>

                    <button className="lg:hidden p-2 text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                    </button>
                </div>
            </div>
        </header>
    );
}

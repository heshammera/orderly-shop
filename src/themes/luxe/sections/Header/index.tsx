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
        { settings: { label: 'المجوهرات', url: '/jewelry' } },
        { settings: { label: 'الساعات', url: '/watches' } },
        { settings: { label: 'العطور', url: '/perfume' } },
    ];

    const displayLinks = blocks.length > 0 ? blocks : defaultLinks;

    return (
        <header className="w-full bg-[#0d0d0d] sticky top-0 z-50 border-b border-zinc-900">
            {/* Elegant Announcement Bar */}
            {settings.notice_text !== undefined && settings.notice_text !== '' && (
                <div className="w-full bg-[#000] text-amber-400 py-1.5 px-4 text-center text-[10px] tracking-[0.4em] font-bold uppercase border-b border-amber-400/20">
                    <InlineEditableText
                        as="span"
                        sectionId={sectionId}
                        settingId="notice_text"
                        value={settings.notice_text}
                    />
                </div>
            )}

            <div className="container mx-auto px-6 h-20 md:h-24 flex items-center justify-between gap-8">
                {/* Luxe Logo */}
                <Link href="/" className="shrink-0 flex flex-col items-center">
                    <span className="text-2xl md:text-3xl font-serif text-white tracking-[0.15em] italic">LUXE</span>
                    <div className="h-[1px] w-full bg-amber-400 mt-1 origin-center scale-x-50"></div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex flex-1 items-center justify-center gap-10">
                    {displayLinks.map((link, idx) => (
                        <Link
                            key={idx}
                            href={link.settings.url || '#'}
                            className="text-[11px] font-medium tracking-[0.2em] uppercase text-zinc-400 hover:text-amber-400 transition-all duration-500"
                        >
                            {link.settings.label}
                        </Link>
                    ))}
                </nav>

                {/* Search & Cart Actions */}
                <div className="flex items-center gap-6 shrink-0">
                    <button className="text-zinc-400 hover:text-amber-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </button>

                    <button className="p-2 text-zinc-400 hover:text-amber-400 transition-all relative">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                        <span className="absolute top-0 right-0 h-4 w-4 bg-amber-400 text-black text-[9px] font-black flex items-center justify-center rounded-full leading-none">
                            1
                        </span>
                    </button>

                    <button className="md:hidden text-zinc-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                    </button>
                </div>
            </div>
        </header>
    );
}

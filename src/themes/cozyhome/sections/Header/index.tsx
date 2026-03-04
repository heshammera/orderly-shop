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
        { settings: { label: 'كل المنتجات', url: '/products' } },
        { settings: { label: 'العروض', url: '/offers' } },
        { settings: { label: 'تواصل معنا', url: '/contact' } },
    ];

    const displayLinks = blocks.length > 0 ? blocks : defaultLinks;

    return (
        <header className="w-full bg-background border-b border-border sticky top-0 z-50 shadow-sm">
            {/* Announcement Bar */}
            {settings.notice_text !== undefined && settings.notice_text !== '' && (
                <div className="w-full bg-primary text-primary-foreground py-1.5 px-4 text-center text-xs sm:text-sm font-medium">
                    <InlineEditableText
                        as="span"
                        sectionId={sectionId}
                        settingId="notice_text"
                        value={settings.notice_text}
                    />
                </div>
            )}

            <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-4 md:gap-8">
                {/* Mobile Menu Toggle (Decorative for now) */}
                <button className="md:hidden p-2 text-foreground hover:bg-muted rounded-md transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                </button>

                {/* Logo */}
                <Link href="/" className="shrink-0 flex items-center gap-2">
                    {settings.logo ? (
                        <div className="h-10 md:h-12 w-auto max-w-[150px]">
                            <img src={settings.logo} alt="Store Logo" className="h-full w-auto object-contain" />
                        </div>
                    ) : (
                        <span className="text-xl md:text-2xl font-black tracking-tight text-foreground">
                            اسم <span className="text-primary">مَتجَرِك</span>
                        </span>
                    )}
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex flex-1 items-center justify-center gap-6 lg:gap-8">
                    {displayLinks.map((link, idx) => (
                        <Link
                            key={idx}
                            href={link.settings.url || '#'}
                            className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors hover:scale-105 active:scale-95"
                        >
                            {link.settings.label}
                        </Link>
                    ))}
                </nav>

                {/* Search & Cart Actions */}
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    <div className="hidden lg:flex relative right-0 w-64 mr-auto origin-left transition-all duration-300">
                        <input
                            type="search"
                            placeholder={settings.search_placeholder || 'ابحث هنا...'}
                            className="w-full rounded-full border border-border bg-muted/50 px-4 py-2 pr-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                        <div className="absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground w-4 h-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </div>
                    </div>

                    <button className="lg:hidden p-2 text-foreground hover:bg-muted rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </button>

                    <button className="p-2 text-foreground hover:bg-muted rounded-full transition-colors relative group">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                        <span className="absolute top-0 right-0 h-4 w-4 bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                            0
                        </span>
                    </button>
                </div>
            </div>
        </header>
    );
}

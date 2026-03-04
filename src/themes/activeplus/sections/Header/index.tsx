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
        { settings: { label: 'الملابس الرياضية', url: '/apparel' } },
        { settings: { label: 'المعدات', url: '/equipment' } },
        { settings: { label: 'عروض الجيم', url: '/gym-deals' } },
    ];

    const displayLinks = blocks.length > 0 ? blocks : defaultLinks;

    return (
        <header className="w-full bg-zinc-950 sticky top-0 z-50 border-b border-zinc-900">
            {/* High-Energy Announcement Bar */}
            {settings.notice_text !== undefined && settings.notice_text !== '' && (
                <div className="w-full bg-[#0066FF] text-white py-1 px-4 text-center text-[11px] font-black uppercase italic tracking-tighter shadow-inner">
                    <InlineEditableText
                        as="span"
                        sectionId={sectionId}
                        settingId="notice_text"
                        value={settings.notice_text}
                    />
                </div>
            )}

            <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-4">
                {/* ActivePlus Logo */}
                <Link href="/" className="shrink-0 flex items-center gap-2 group">
                    <div className="bg-[#0066FF] p-1 skew-x-[-15deg] group-hover:skew-x-0 transition-all duration-300">
                        <span className="text-white text-xl font-black italic tracking-tighter block px-1 skew-x-[15deg] group-hover:skew-x-0">PLUS</span>
                    </div>
                    <span className="text-xl md:text-2xl font-black italic tracking-tighter text-white uppercase group-hover:text-[#0066FF] transition-colors">
                        ACTIVE
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex flex-1 items-center justify-center gap-1">
                    {displayLinks.map((link, idx) => (
                        <Link
                            key={idx}
                            href={link.settings.url || '#'}
                            className="px-4 py-2 text-[13px] font-black uppercase italic tracking-tighter text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
                        >
                            {link.settings.label}
                        </Link>
                    ))}
                </nav>

                {/* Search & Cart Actions */}
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    <button className="p-2 text-zinc-400 hover:text-[#0066FF] transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </button>

                    <button className="p-2 bg-zinc-900 text-white hover:bg-[#0066FF] transition-all relative group shadow-[4px_4px_0_rgba(0,0,0,1)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-blue-600 text-white text-[10px] font-black flex items-center justify-center rounded-sm border border-black group-hover:scale-110 transition-transform">
                            2
                        </span>
                    </button>

                    <button className="lg:hidden p-2 text-zinc-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                    </button>
                </div>
            </div>
        </header>
    );
}

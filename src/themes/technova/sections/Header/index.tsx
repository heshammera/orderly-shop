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
        { settings: { label: 'الأجهزة الذكية', url: '/smart-devices' } },
        { settings: { label: 'الحواسب', url: '/computing' } },
        { settings: { label: 'ملحقات', url: '/accessories' } },
    ];

    const displayLinks = blocks.length > 0 ? blocks : defaultLinks;

    return (
        <header className="w-full bg-[#050b15] sticky top-0 z-50 border-b border-cyan-900/30">
            {/* Tech Announcement Bar */}
            {settings.notice_text !== undefined && settings.notice_text !== '' && (
                <div className="w-full bg-cyan-600 text-white py-1.5 px-4 text-center text-xs font-mono tracking-widest uppercase relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[shimmer_2s_infinite]"></div>
                    <InlineEditableText
                        as="span"
                        sectionId={sectionId}
                        settingId="notice_text"
                        value={settings.notice_text}
                    />
                </div>
            )}

            <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-4">
                {/* TechNova Logo */}
                <Link href="/" className="shrink-0 flex items-center gap-2 group">
                    <div className="relative">
                        <div className="absolute inset-0 bg-cyan-500 blur-sm opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <span className="relative text-2xl font-mono font-black tracking-tighter text-white">
                            TECH<span className="text-cyan-400">NOVA</span>
                        </span>
                    </div>
                </Link>

                {/* Desktop Navigation - Tech Links */}
                <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
                    {displayLinks.map((link, idx) => (
                        <Link
                            key={idx}
                            href={link.settings.url || '#'}
                            className="px-4 py-2 text-[11px] font-mono font-bold tracking-widest uppercase text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/20 transition-all rounded-sm relative group overflow-hidden"
                        >
                            <span className="relative z-10">{link.settings.label}</span>
                            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-cyan-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                        </Link>
                    ))}
                </nav>

                {/* Search & Actions - Futuristic style */}
                <div className="flex items-center gap-3 shrink-0">
                    <button className="p-2 text-slate-400 hover:text-cyan-400 transition-colors border border-slate-800 rounded-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </button>

                    <button className="p-2 bg-cyan-600/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600 hover:text-white transition-all relative group">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h1.49a2 2 0 0 1 1.95 1.57l1.1 4.38m0 0 2.22 8.81a2 2 0 0 0 1.95 1.57h8.41a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                        <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-cyan-500 text-white text-[9px] font-black flex items-center justify-center rounded-none shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                            2
                        </span>
                    </button>

                    <button className="md:hidden text-slate-400 border border-slate-800 p-2 rounded-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                    </button>
                </div>
            </div>
        </header>
    );
}

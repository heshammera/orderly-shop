import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { Search, ShoppingCart, Menu, X } from 'lucide-react';
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

    const router = useRouter();
    const { cartCount, openCart } = useCart();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim() && storeSlug) {
            router.push(`${storeContext?.store?.baseUrl ?? ''}/products?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsMobileMenuOpen(false);
        }
    };

    const defaultLinks = [
        { settings: { label: 'الرئيسية', url: '/' } },
    ];

    // If no blocks, try to use headerCategories from storeContext
    const categoriesAsLinks = storeContext?.headerCategories?.map((cat: any) => ({
        settings: {
            label: cat.name.ar || cat.name.en || cat.name,
            url: `/products?category=${cat.id}`
        }
    })) || [];

    const displayLinks = blocks.length > 0
        ? blocks
        : (categoriesAsLinks.length > 0 ? [...defaultLinks, ...categoriesAsLinks] : defaultLinks);

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
                <Link href={storeSlug ? '' : '/'} className="shrink-0 flex items-center gap-2 group">
                    <div className="relative">
                        {settings.logo || store?.logo_url ? (
                            <div className="h-10 md:h-12 w-auto max-w-[150px]">
                                <img src={settings.logo || store?.logo_url} alt={storeName} className="h-full w-auto object-contain" />
                            </div>
                        ) : (
                            <>
                                <div className="absolute inset-0 bg-cyan-500 blur-sm opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                <span className="relative text-2xl font-mono font-black tracking-tighter text-white">
                                    {storeName}
                                </span>
                            </>
                        )}
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
                    <form onSubmit={handleSearch} className="hidden md:flex relative items-center group/search">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-0 opacity-0 group-hover/search:w-48 group-hover/search:opacity-100 transition-all duration-300 bg-cyan-950/20 border-b border-cyan-500/50 text-sm outline-none px-2 mr-2 focus:w-48 focus:opacity-100 text-cyan-50"
                            placeholder={settings.search_placeholder || (language === 'ar' ? 'بحث...' : 'Search...')}
                        />
                        <button type="submit" className="p-2 text-slate-400 hover:text-cyan-400 transition-colors border border-slate-800 rounded-sm">
                            <Search className="w-4 h-4" />
                        </button>
                    </form>

                    <button onClick={openCart} className="p-2 bg-cyan-600/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600 hover:text-white transition-all relative group">
                        <ShoppingCart className="w-4 h-4" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-cyan-500 text-white text-[9px] font-black flex items-center justify-center rounded-none shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                                {cartCount}
                            </span>
                        )}
                    </button>

                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-slate-400 border border-slate-800 p-2 rounded-sm relative z-50">
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-[#050b15] border-t border-cyan-900/30 shadow-lg animate-in slide-in-from-top-2 absolute w-full left-0 z-40">
                    <div className="p-4 space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl"></div>
                        <form onSubmit={handleSearch} className="relative mb-4 z-10 hidden">
                            {/* Hidden on mobile for technova to maintain the strict layout, or implement a clean bar below */}
                        </form>
                        <form onSubmit={handleSearch} className="relative mb-4 z-10">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full p-2 border border-slate-800 bg-cyan-950/20 text-cyan-50 rounded-sm text-sm outline-none focus:border-cyan-500/50 px-4 pr-10 font-mono"
                                placeholder={settings.search_placeholder || (language === 'ar' ? 'بحث طاقة...' : 'Search system...')}
                            />
                            <button type="submit" className="absolute top-1/2 -translate-y-1/2 right-3 text-cyan-600 hover:text-cyan-400">
                                <Search className="w-4 h-4" />
                            </button>
                        </form>
                        <ul className="flex flex-col space-y-2 relative z-10">
                            {displayLinks.map((link, idx) => (
                                <li key={idx}>
                                    <Link
                                        href={link.settings.url || '#'}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="hover:text-cyan-400 hover:bg-cyan-950/20 font-mono tracking-widest uppercase block text-[11px] font-bold p-3 border-l-2 border-transparent hover:border-cyan-400 transition-all text-slate-300"
                                    >
                                        {link.settings.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </header>
    );
}

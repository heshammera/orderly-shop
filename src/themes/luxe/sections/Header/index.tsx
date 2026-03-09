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
            router.push(`${storeContext?.store?.baseUrl ?? `/s/${storeSlug}`}/products?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsMobileMenuOpen(false);
        }
    };

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
                <Link href={storeSlug ? `/s/${storeSlug}` : '/'} className="shrink-0 flex flex-col items-center">
                    {settings.logo || store?.logo_url ? (
                        <div className="h-10 md:h-12 w-auto max-w-[150px]">
                            <img src={settings.logo || store?.logo_url} alt={storeName} className="h-full w-auto object-contain" />
                        </div>
                    ) : (
                        <>
                            <span className="text-2xl md:text-3xl font-serif text-white tracking-[0.15em] italic">{storeName}</span>
                            <div className="h-[1px] w-full bg-amber-400 mt-1 origin-center scale-x-50"></div>
                        </>
                    )}
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
                    <form onSubmit={handleSearch} className="hidden md:flex relative items-center group/search">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-0 opacity-0 group-hover/search:w-48 group-hover/search:opacity-100 transition-all duration-300 bg-transparent border-b border-zinc-700 text-sm outline-none px-2 mr-2 focus:w-48 focus:opacity-100 text-zinc-300 placeholder:text-zinc-600"
                            placeholder={settings.search_placeholder || (language === 'ar' ? 'البحث...' : 'Search...')}
                        />
                        <button type="submit" className="text-zinc-400 hover:text-amber-400 transition-colors">
                            <Search className="w-5 h-5" />
                        </button>
                    </form>

                    <button onClick={openCart} className="p-2 text-zinc-400 hover:text-amber-400 transition-all relative">
                        <ShoppingCart className="w-5 h-5" />
                        {cartCount > 0 && (
                            <span className="absolute top-0 right-0 h-4 w-4 bg-amber-400 text-black text-[9px] font-black flex items-center justify-center rounded-full leading-none">
                                {cartCount}
                            </span>
                        )}
                    </button>

                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-zinc-400">
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-[#0d0d0d] border-t border-zinc-900 shadow-lg animate-in slide-in-from-top-2 absolute w-full left-0 z-40">
                    <div className="p-4 space-y-4">
                        <form onSubmit={handleSearch} className="relative mb-4 z-10">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full p-2 border border-zinc-800 bg-zinc-900 text-zinc-300 rounded-sm text-sm outline-none focus:border-amber-400/50 px-4 pr-10"
                                placeholder={settings.search_placeholder || (language === 'ar' ? 'البحث...' : 'Search...')}
                            />
                            <button type="submit" className="absolute top-1/2 -translate-y-1/2 right-3 text-zinc-500 hover:text-amber-400">
                                <Search className="w-4 h-4" />
                            </button>
                        </form>
                        <ul className="flex flex-col space-y-2 relative z-10">
                            {displayLinks.map((link, idx) => (
                                <li key={idx}>
                                    <Link
                                        href={link.settings.url || '#'}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="hover:text-amber-400 font-medium tracking-[0.2em] uppercase block text-[11px] p-3 text-zinc-400 transition-colors"
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

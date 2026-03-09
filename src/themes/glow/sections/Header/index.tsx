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
        { settings: { label: 'العناية بالبشرة', url: '/skincare' } },
        { settings: { label: 'المكياج', url: '/makeup' } },
        { settings: { label: 'عن المجموعة', url: '/about' } },
    ];

    const displayLinks = blocks.length > 0 ? blocks : defaultLinks;

    return (
        <header className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-100">
            {/* Soft Announcement Bar */}
            {settings.notice_text !== undefined && settings.notice_text !== '' && (
                <div className="w-full bg-[#fdf2f2] text-[#d4a373] py-2 px-4 text-center text-xs tracking-[0.2em] font-bold uppercase transition-all">
                    <InlineEditableText
                        as="span"
                        sectionId={sectionId}
                        settingId="notice_text"
                        value={settings.notice_text}
                    />
                </div>
            )}

            <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                {/* Minimalist Logo */}
                <Link href={storeSlug ? '' : '/'} className="shrink-0 flex items-center gap-1 group">
                    {settings.logo || store?.logo_url ? (
                        <div className="h-10 md:h-12 w-auto max-w-[150px]">
                            <img src={settings.logo || store?.logo_url} alt={storeName} className="h-full w-auto object-contain" />
                        </div>
                    ) : (
                        <span className="text-2xl font-light tracking-[0.2em] text-stone-800 uppercase">
                            {storeName}
                        </span>
                    )}
                </Link>

                {/* Desktop Navigation - Elegant & Spaced */}
                <nav className="hidden md:flex items-center gap-10">
                    {displayLinks.map((link, idx) => (
                        <Link
                            key={idx}
                            href={link.settings.url || '#'}
                            className="text-[11px] font-bold tracking-[0.2em] uppercase text-stone-400 hover:text-[#d4a373] transition-colors"
                        >
                            {link.settings.label}
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-6 shrink-0">
                    <form onSubmit={handleSearch} className="hidden md:flex relative items-center group/search">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-0 opacity-0 group-hover/search:w-48 group-hover/search:opacity-100 transition-all duration-300 bg-transparent border-b border-stone-200 text-sm outline-none px-2 mr-2 focus:w-48 focus:opacity-100 text-stone-800 placeholder:text-stone-400"
                            placeholder={settings.search_placeholder || (language === 'ar' ? 'البحث...' : 'Search...')}
                        />
                        <button type="submit" className="text-stone-400 hover:text-stone-800 transition-colors">
                            <Search className="w-5 h-5" />
                        </button>
                    </form>

                    <button onClick={openCart} className="text-stone-400 hover:text-stone-800 transition-colors relative">
                        <ShoppingCart className="w-5 h-5" />
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 h-4 w-4 bg-[#e0afa0] text-white text-[8px] font-bold flex items-center justify-center rounded-full">
                                {cartCount}
                            </span>
                        )}
                    </button>

                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-stone-400">
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-stone-100 shadow-lg animate-in slide-in-from-top-2 absolute w-full left-0 z-40">
                    <div className="p-6 space-y-6">
                        <form onSubmit={handleSearch} className="relative mb-4 z-10">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full p-2 border-b border-stone-200 bg-transparent text-stone-800 rounded-none text-sm outline-none focus:border-[#d4a373] px-2 pr-10"
                                placeholder={settings.search_placeholder || (language === 'ar' ? 'البحث عن منتج...' : 'Search...')}
                            />
                            <button type="submit" className="absolute top-1/2 -translate-y-1/2 right-2 text-stone-400 hover:text-[#d4a373]">
                                <Search className="w-4 h-4" />
                            </button>
                        </form>
                        <ul className="flex flex-col space-y-4 relative z-10">
                            {displayLinks.map((link, idx) => (
                                <li key={idx}>
                                    <Link
                                        href={link.settings.url || '#'}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="hover:text-[#d4a373] tracking-[0.2em] font-light uppercase block text-sm p-2 text-stone-600 transition-colors"
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

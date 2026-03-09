import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import InlineEditableText from '@/components/ThemeEngine/InlineEditableText';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Search, ShoppingCart, Menu, X } from 'lucide-react';

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
    const router = useRouter();
    const { cartCount, openCart } = useCart();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const store = storeContext?.store || storeContext; // Handle both direct DB record or context wrapper
    const storeName = store?.name ? (typeof store.name === 'string' ? store.name : store.name[language] || store.name.ar || store.name.en) : 'Store';
    const storeSlug = store?.slug || '';

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim() && storeSlug) {
            router.push(`/s/${storeSlug}/products?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };
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
                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 text-foreground hover:bg-muted rounded-md transition-colors"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>

                {/* Logo */}
                <Link href={storeSlug ? '' : '/'} className="shrink-0 flex items-center gap-2">
                    {settings.logo || store?.logo_url ? (
                        <div className="h-10 md:h-12 w-auto max-w-[150px]">
                            <img src={settings.logo || store?.logo_url} alt={storeName} className="h-full w-auto object-contain" />
                        </div>
                    ) : (
                        <span className="text-xl md:text-2xl font-black tracking-tight text-foreground">
                            {storeName}
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
                        <form onSubmit={handleSearch} className="w-full">
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={settings.search_placeholder || (language === 'ar' ? 'ابحث هنا...' : 'Search here...')}
                                className="w-full rounded-full border border-border bg-muted/50 px-4 py-2 pr-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            />
                            <button type="submit" className="absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground w-4 h-4 hover:text-primary">
                                <Search className="w-4 h-4" />
                            </button>
                        </form>
                    </div>

                    <button
                        onClick={openCart}
                        className="p-2 text-foreground hover:bg-muted rounded-full transition-colors relative group"
                    >
                        <ShoppingCart className="w-[22px] h-[22px]" />
                        {cartCount > 0 && (
                            <span className="absolute top-0 right-0 h-4 w-4 bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-background border-t border-border animate-in slide-in-from-top-2">
                    <div className="p-4 space-y-4">
                        <form onSubmit={handleSearch} className="relative mb-4">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full p-2 border border-border bg-muted/50 text-foreground rounded text-sm outline-none focus:border-primary px-4"
                                placeholder={settings.search_placeholder || (language === 'ar' ? 'ابحث هنا...' : 'Search here...')}
                            />
                            <button type="submit" className="absolute top-1/2 -translate-y-1/2 left-3 text-muted-foreground hover:text-primary">
                                <Search className="w-4 h-4" />
                            </button>
                        </form>
                        <ul className="flex flex-col space-y-4 text-foreground">
                            {displayLinks.map((link, idx) => (
                                <li key={idx}>
                                    <Link
                                        href={link.settings.url || '#'}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="hover:text-primary font-semibold block"
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

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
    storeContext?: any; // Pushed from SectionRenderer
}

export default function Header({ settings, blocks = [], sectionId = 'header_1', storeContext }: HeaderProps) {
    const { language } = useLanguage();
    const router = useRouter();
    const { cartCount, openCart } = useCart();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const store = storeContext?.store || storeContext; // Handle both direct DB record or context wrapper
    const storeName = store?.name ? (typeof store.name === 'string' ? store.name : store.name[language] || store.name.ar || store.name.en) : 'Store';
    const storeSlug = store?.slug || '';

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim() && storeSlug) {
            router.push(`/s/${storeSlug}/products?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsSearchOpen(false);
        }
    };
    const defaultLinks = [
        { settings: { label: 'Home', url: '/' } },
        { settings: { label: 'Shop', url: '/products' } },
        { settings: { label: 'Men', url: '/category/men' } },
        { settings: { label: 'Women', url: '/category/women' } },
    ];

    const displayLinks = blocks.length > 0 ? blocks : defaultLinks;

    return (
        <header className="bg-slate-900 sticky top-0 z-50">
            {/* Announcement Bar */}
            {settings.notice_text !== undefined && settings.notice_text !== '' && (
                <div className="w-full bg-primary text-white py-1.5 px-4 text-center text-xs sm:text-sm font-medium">
                    <InlineEditableText
                        as="span"
                        sectionId={sectionId}
                        settingId="notice_text"
                        value={settings.notice_text}
                    />
                </div>
            )}

            <div className="container mx-auto flex justify-between items-center py-4 px-4">
                {/* Left section: Logo */}
                <Link href={storeSlug ? `/s/${storeSlug}` : '/'} className="flex items-center shrink-0">
                    {settings.logo || store?.logo_url ? (
                        <img src={settings.logo || store?.logo_url} alt={storeName} className="h-10 md:h-14 w-auto mr-4 object-contain" />
                    ) : (
                        <span className="text-xl md:text-2xl font-black tracking-tight text-white">
                            {storeName}
                        </span>
                    )}
                </Link>

                {/* Hamburger menu (for mobile) */}
                <div className="flex lg:hidden items-center gap-4">
                    {/* Mobile Cart */}
                    <button onClick={openCart} className="text-white relative">
                        <ShoppingCart className="w-6 h-6" />
                        {cartCount > 0 && <span className="absolute -top-2 -right-2 h-4 w-4 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full">{cartCount}</span>}
                    </button>

                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="text-white focus:outline-none hover:text-primary transition-colors"
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Center section: Menu */}
                <nav className="hidden lg:flex md:flex-grow justify-center">
                    <ul className="flex justify-center space-x-6 text-white rtl:space-x-reverse">
                        {displayLinks.map((link, idx) => (
                            <li key={idx} className="relative group">
                                <Link
                                    href={link.settings.url || '#'}
                                    className="hover:text-primary font-semibold transition-colors flex items-center"
                                >
                                    {link.settings.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Right section: Actions (for desktop) */}
                <div className="hidden lg:flex items-center space-x-4 rtl:space-x-reverse relative shrink-0">
                    <Link href="/register"
                        className="bg-primary border border-primary hover:bg-transparent text-white hover:text-primary transition-all font-semibold px-5 py-2 rounded-full inline-block text-sm">
                        Login
                    </Link>

                    {/* Search Field */}
                    <div className="relative group">
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className="text-white hover:text-primary transition-transform transform hover:scale-110 p-2"
                        >
                            <Search className="w-5 h-5" />
                        </button>

                        {(isSearchOpen || true) && (
                            <div className="hidden group-hover:block absolute top-full right-0 mt-2 w-64 bg-white shadow-lg p-2 rounded-lg origin-top transition-all slide-in-from-top-2">
                                <form onSubmit={handleSearch}>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full xl:w-64 p-2 border border-black text-black rounded text-sm outline-none focus:border-primary"
                                        placeholder={settings.search_placeholder || 'Search for products...'}
                                    />
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Cart */}
                    <div className="relative group cart-wrapper">
                        <button onClick={openCart} className="text-white hover:text-primary transition-transform transform hover:scale-110 flex items-center p-2">
                            <ShoppingCart className="w-[22px] h-[22px]" />
                            {cartCount > 0 && <span className="absolute top-0 right-0 -mt-1 -mr-1 h-4 w-4 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full">{cartCount}</span>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="lg:hidden bg-slate-800 border-t border-slate-700 animate-in slide-in-from-top-2">
                    <div className="p-4 space-y-4">
                        <form onSubmit={handleSearch} className="mb-4">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full p-2 border border-slate-600 bg-slate-700 text-white rounded text-sm outline-none focus:border-primary"
                                placeholder={settings.search_placeholder || 'Search...'}
                            />
                        </form>
                        <ul className="flex flex-col space-y-4 text-white">
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

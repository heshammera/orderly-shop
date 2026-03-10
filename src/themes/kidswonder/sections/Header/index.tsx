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
        { settings: { label: 'الألعاب', url: '/products' } },
        { settings: { label: 'جديدنا', url: '/new' } },
        { settings: { label: 'تخفيضات', url: '/sale' } },
    ];

        // Add dynamic header categories
    const categoryLinks = (storeContext?.headerCategories || []).map((cat: any) => {
        const catName = cat.name ? (typeof cat.name === 'string' ? cat.name : cat.name[language] || cat.name.ar || cat.name.en) : 'Category';
        return {
            settings: {
                label: catName,
                url: `/products?category=${cat.id}`
            }
        };
    });

    const baseLinks = blocks.length > 0 ? blocks : defaultLinks;
    const displayLinks = [...baseLinks, ...categoryLinks];

    return (
        <header className="w-full bg-white sticky top-0 z-50">
            {/* Playful Announcement Bar */}
            {settings.notice_text !== undefined && settings.notice_text !== '' && (
                <div className="w-full bg-[#FF6B6B] text-white py-2 px-4 text-center text-sm font-bold tracking-wide relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:10px_10px]"></div>
                    <InlineEditableText
                        as="span"
                        sectionId={sectionId}
                        settingId="notice_text"
                        value={settings.notice_text}
                    />
                </div>
            )}

            <div className="container mx-auto px-4 h-20 md:h-24 flex items-center justify-between gap-4">
                {/* Logo with playful font */}
                <Link href={storeSlug ? '' : '/'} className="shrink-0 flex items-center gap-2 group">
                    {settings.logo || store?.logo_url ? (
                        <div className="h-10 md:h-12 w-auto max-w-[150px]">
                            <img src={settings.logo || store?.logo_url} alt={storeName} className="h-full w-auto object-contain" />
                        </div>
                    ) : (
                        <>
                            <div className="h-12 w-12 bg-[#4ECDC4] rounded-2xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform shadow-lg border-2 border-white">
                                <span className="text-white text-2xl font-black">K</span>
                            </div>
                            <span className="text-2xl md:text-3xl font-black lowercase tracking-tighter text-[#2D3436]">
                                {storeName}
                            </span>
                        </>
                    )}
                </Link>

                {/* Desktop Navigation - Rounded and colorful hover */}
                <nav className="hidden md:flex flex-1 items-center justify-center gap-2">
                    {displayLinks.map((link, idx) => (
                        <Link
                            key={idx}
                            href={link.settings.url || '#'}
                            className="px-4 py-2 rounded-full text-sm font-black text-[#636E72] hover:text-white hover:bg-[#FFE66D] hover:shadow-md transition-all active:scale-95"
                        >
                            {link.settings.label}
                        </Link>
                    ))}
                </nav>

                {/* Search & Cart Actions - Bubbly style */}
                <div className="flex items-center gap-3 shrink-0">
                    <form onSubmit={handleSearch} className="hidden md:flex relative items-center group/search">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-0 opacity-0 group-hover/search:w-48 group-hover/search:opacity-100 transition-all duration-300 bg-[#F1F2F6] border-2 border-transparent focus:border-[#4ECDC4] rounded-2xl text-sm outline-none px-4 py-2 mr-2 focus:w-48 focus:opacity-100 text-[#2D3436]"
                            placeholder={settings.search_placeholder || (language === 'ar' ? 'ابحث عن ألعاب...' : 'Search toys...')}
                        />
                        <button type="submit" className="p-3 text-[#2D3436] bg-[#F1F2F6] hover:bg-[#FFE66D] rounded-2xl transition-all shadow-sm">
                            <Search className="w-5 h-5" />
                        </button>
                    </form>

                    <button onClick={openCart} className="p-3 text-[#2D3436] bg-[#F1F2F6] hover:bg-[#FF6B6B] hover:text-white rounded-2xl transition-all shadow-sm relative group">
                        <ShoppingCart className="w-5 h-5" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-6 w-6 bg-[#4ECDC4] text-white text-[11px] font-black flex items-center justify-center rounded-full border-2 border-white group-hover:scale-110 transition-transform">
                                {cartCount}
                            </span>
                        )}
                    </button>

                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-3 text-[#2D3436] bg-[#F1F2F6] hover:bg-[#4ECDC4] hover:text-white rounded-2xl transition-all shadow-sm relative z-50">
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t-4 border-[#FF6B6B] shadow-lg animate-in slide-in-from-top-2 absolute w-full left-0 z-40 rounded-b-3xl">
                    <div className="p-4 space-y-4">
                        <form onSubmit={handleSearch} className="relative mb-4 z-10">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full p-4 border-2 border-[#F1F2F6] bg-[#F1F2F6] text-[#2D3436] font-bold rounded-2xl text-sm outline-none focus:border-[#4ECDC4] focus:bg-white transition-colors px-4 pr-12"
                                placeholder={settings.search_placeholder || (language === 'ar' ? 'إبحث هنا...' : 'Search...')}
                            />
                            <button type="submit" className="absolute top-1/2 -translate-y-1/2 right-4 text-[#2D3436] hover:text-[#FF6B6B]">
                                <Search className="w-5 h-5 font-bold" />
                            </button>
                        </form>
                        <ul className="flex flex-col space-y-2 relative z-10">
                            {displayLinks.map((link, idx) => (
                                <li key={idx}>
                                    <Link
                                        href={link.settings.url || '#'}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="hover:text-white hover:bg-[#4ECDC4] text-[#2D3436] font-black uppercase text-center block text-lg p-3 rounded-2xl transition-all"
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

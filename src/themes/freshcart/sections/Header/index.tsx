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
        { settings: { label: 'خضروات وفواكه', url: '/produce' } },
        { settings: { label: 'منتجات عضوية', url: '/organic' } },
        { settings: { label: 'عروض اليوم', url: '/deals' } },
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
        <header className="w-full bg-white sticky top-0 z-50 border-b border-green-50 shadow-sm">
            {/* Organic Announcement Bar */}
            {settings.notice_text !== undefined && settings.notice_text !== '' && (
                <div className="w-full bg-[#10b981] text-white py-2 px-4 text-center text-xs md:text-sm font-bold bg-[url('https://www.transparenttextures.com/patterns/leaf.png')]">
                    <InlineEditableText
                        as="span"
                        sectionId={sectionId}
                        settingId="notice_text"
                        value={settings.notice_text}
                    />
                </div>
            )}

            <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
                {/* FreshCart Logo */}
                <Link href={storeSlug ? '' : '/'} className="shrink-0 flex items-center gap-2 group">
                    {settings.logo || store?.logo_url ? (
                        <div className="h-10 md:h-12 w-auto max-w-[150px]">
                            <img src={settings.logo || store?.logo_url} alt={storeName} className="h-full w-auto object-contain" />
                        </div>
                    ) : (
                        <>
                            <div className="bg-[#10b981] w-10 h-10 rounded-full flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                            </div>
                            <span className="text-2xl font-black text-slate-800 tracking-tighter">
                                {storeName}
                            </span>
                        </>
                    )}
                </Link>

                {/* Desktop Navigation - Rounded hover */}
                <nav className="hidden lg:flex flex-1 items-center justify-center gap-2">
                    {displayLinks.map((link, idx) => (
                        <Link
                            key={idx}
                            href={link.settings.url || '#'}
                            className="px-5 py-2 rounded-full text-sm font-bold text-slate-600 hover:text-white hover:bg-[#10b981] transition-all"
                        >
                            {link.settings.label}
                        </Link>
                    ))}
                </nav>

                {/* Search & Cart Actions */}
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    <form onSubmit={handleSearch} className="hidden md:flex relative w-48 lg:w-64">
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={settings.search_placeholder || 'ابحث عن طعام طازج...'}
                            className="w-full rounded-full border border-green-100 bg-green-50/30 px-5 py-2.5 pr-10 text-xs outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all"
                        />
                        <button type="submit" className="absolute top-1/2 -translate-y-1/2 right-3 text-[#10b981] hover:text-green-700">
                            <Search className="w-4 h-4" />
                        </button>
                    </form>

                    <button className="md:hidden p-2.5 text-slate-600 bg-slate-50 hover:bg-green-50 hover:text-[#10b981] rounded-full transition-all" onClick={() => setIsMobileMenuOpen(true)}>
                        <Search className="w-5 h-5" />
                    </button>

                    <button onClick={openCart} className="p-2.5 text-slate-600 bg-slate-50 hover:bg-green-50 hover:text-[#10b981] rounded-full transition-all relative group">
                        <ShoppingCart className="w-5 h-5" />
                        {cartCount > 0 && (
                            <span className="absolute top-0 right-0 h-5 w-5 bg-orange-400 text-white text-[10px] font-bold flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                                {cartCount}
                            </span>
                        )}
                    </button>

                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 text-slate-600">
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="lg:hidden bg-white border-t border-green-50 shadow-lg animate-in slide-in-from-top-2 absolute w-full left-0 z-40">
                    <div className="p-4 space-y-4">
                        <form onSubmit={handleSearch} className="md:hidden relative mb-4 z-10">
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full p-3 rounded-full border border-green-100 bg-green-50/30 text-slate-800 text-sm outline-none focus:border-[#10b981] px-5 pr-10"
                                placeholder={settings.search_placeholder || (language === 'ar' ? 'بحث...' : 'Search...')}
                            />
                            <button type="submit" className="absolute top-1/2 -translate-y-1/2 right-4 text-[#10b981] hover:text-green-700">
                                <Search className="w-5 h-5" />
                            </button>
                        </form>
                        <ul className="flex flex-col space-y-2 relative z-10">
                            {displayLinks.map((link, idx) => (
                                <li key={idx}>
                                    <Link
                                        href={link.settings.url || '#'}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="hover:text-white hover:bg-[#10b981] font-bold block text-sm p-3 rounded-full text-slate-600 transition-colors"
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

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
                <Link href={storeSlug ? '' : '/'} className="shrink-0 flex items-center gap-2 group">
                    {settings.logo || store?.logo_url ? (
                        <div className="h-10 md:h-12 w-auto max-w-[150px]">
                            <img src={settings.logo || store?.logo_url} alt={storeName} className="h-full w-auto object-contain" />
                        </div>
                    ) : (
                        <span className="text-xl md:text-2xl font-black italic tracking-tighter text-white uppercase group-hover:text-[#0066FF] transition-colors">
                            {storeName}
                        </span>
                    )}
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
                    <form onSubmit={handleSearch} className="hidden md:flex relative items-center group/search">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-0 opacity-0 group-hover/search:w-48 group-hover/search:opacity-100 transition-all duration-300 bg-zinc-900 border border-zinc-800 text-sm outline-none px-4 py-2 mr-2 focus:w-48 focus:opacity-100 text-white placeholder:text-zinc-600 rounded-sm"
                            placeholder={settings.search_placeholder || (language === 'ar' ? 'بحث...' : 'Search...')}
                        />
                        <button type="submit" className="p-2 text-zinc-400 hover:text-[#0066FF] transition-colors">
                            <Search className="w-5 h-5" />
                        </button>
                    </form>

                    <button onClick={openCart} className="p-2 bg-zinc-900 text-white hover:bg-[#0066FF] transition-all relative group shadow-[4px_4px_0_rgba(0,0,0,1)]">
                        <ShoppingCart className="w-5 h-5" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 bg-blue-600 text-white text-[10px] font-black flex items-center justify-center rounded-sm border border-black group-hover:scale-110 transition-transform">
                                {cartCount}
                            </span>
                        )}
                    </button>

                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-zinc-400 hover:text-white">
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-zinc-950 border-t border-zinc-900 shadow-2xl animate-in slide-in-from-top-2 absolute w-full left-0 z-40">
                    <div className="p-6 space-y-6">
                        <form onSubmit={handleSearch} className="relative mb-4 z-10">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full p-3 border-2 border-zinc-800 bg-zinc-900 text-white rounded-none text-sm outline-none focus:border-[#0066FF] px-4 pr-10 font-bold uppercase italic"
                                placeholder={settings.search_placeholder || (language === 'ar' ? 'البحث عن منتج...' : 'Search...')}
                            />
                            <button type="submit" className="absolute top-1/2 -translate-y-1/2 right-3 text-zinc-400 hover:text-[#0066FF]">
                                <Search className="w-5 h-5" />
                            </button>
                        </form>
                        <ul className="flex flex-col space-y-4 relative z-10">
                            {displayLinks.map((link, idx) => (
                                <li key={idx}>
                                    <Link
                                        href={link.settings.url || '#'}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="hover:text-white hover:bg-[#0066FF] tracking-tighter uppercase italic font-black block text-base p-3 text-zinc-400 transition-all border-l-4 border-transparent hover:border-white shadow-sm"
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

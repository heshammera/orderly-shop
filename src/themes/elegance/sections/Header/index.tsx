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
                <Link href="/" className="flex items-center shrink-0">
                    {settings.logo ? (
                        <img src={settings.logo} alt="Logo" className="h-10 md:h-14 w-auto mr-4 object-contain" />
                    ) : (
                        <span className="text-xl md:text-2xl font-black tracking-tight text-white">
                            <span className="text-primary">ELEGANCE</span> STORE
                        </span>
                    )}
                </Link>

                {/* Hamburger menu (for mobile) */}
                <div className="flex lg:hidden">
                    <button className="text-white focus:outline-none hover:text-primary transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                        </svg>
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
                        <button className="text-white hover:text-primary transition-transform transform hover:scale-110 p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </button>
                        <div className="hidden group-hover:block absolute top-full right-0 mt-2 w-64 bg-white shadow-lg p-2 rounded-lg origin-top transition-all slide-in-from-top-2">
                            <input type="text" className="w-full p-2 border border-gray-200 rounded text-sm outline-none focus:border-primary"
                                placeholder={settings.search_placeholder || 'Search for products...'} />
                        </div>
                    </div>

                    {/* Cart */}
                    <div className="relative group cart-wrapper">
                        <Link href="/cart" className="text-white hover:text-primary transition-transform transform hover:scale-110 flex items-center p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                            <span className="absolute top-0 right-0 -mt-1 -mr-1 h-4 w-4 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full">0</span>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}

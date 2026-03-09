"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Loader2, Menu, ShoppingCart, Globe, Store as StoreIcon, Truck } from 'lucide-react';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { CartRecoveryHandler } from '@/components/store/CartRecoveryHandler';
import { CartDrawer } from '@/components/store/CartDrawer';
import { TrackingPixels } from '@/components/store/TrackingPixels';
import { StoreDashboardLink } from '@/components/store/StoreDashboardLink';
import { COMPONENT_DEFAULTS } from '@/lib/store-builder/types';

interface StoreData {
    id: string;
    name: { ar: string; en: string };
    description: { ar: string; en: string };
    logo_url: string | null;
    currency: string;
    settings: any;
    slug: string;
    has_removed_copyright?: boolean;
    baseUrl?: string;
}

interface Integration {
    provider: string;
    config: any;
    is_active: boolean;
}

interface StoreLayoutProps {
    children: React.ReactNode;
    store: StoreData;
    integrations?: {
        facebook_pixels?: string[];
        tiktok_pixels?: string[];
        snapchat_pixels?: string[];
        google_analytics_ids?: string[];
    };
    headerCategories?: { id: string; name: { ar: string; en: string } | any }[];
}

function StoreHeader({ store, headerCategories = [] }: { store: StoreData, headerCategories?: { id: string; name: any }[] }) {
    const { language, setLanguage } = useLanguage();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { cartCount, openCart } = useCart();

    const toggleLanguage = () => {
        setLanguage(language === 'ar' ? 'en' : 'ar');
    };

    const storeName = store.name[language] || store.name.ar || store.name.en;

    return (
        <header className="sticky top-0 z-50 bg-card border-b">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo / Store Name */}
                    <Link href={store.baseUrl || '/'} className="flex items-center gap-3">
                        {store.logo_url ? (
                            <img src={store.logo_url} alt={storeName} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                                <StoreIcon className="w-5 h-5 text-primary-foreground" />
                            </div>
                        )}
                        <span className="font-bold text-lg hidden sm:block">{storeName}</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link href={store.baseUrl || '/'} className="text-sm font-medium hover:text-primary transition-colors">
                            {language === 'ar' ? 'الرئيسية' : 'Home'}
                        </Link>
                        <Link href={`products`} className="text-sm font-medium hover:text-primary transition-colors">
                            {language === 'ar' ? 'المنتجات' : 'Products'}
                        </Link>
                        {headerCategories.map(category => (
                            <Link key={category.id} href={`products?category=${category.id}`} className="text-sm font-medium hover:text-primary transition-colors">
                                {category.name[language] || category.name.ar || category.name.en}
                            </Link>
                        ))}
                        <Link href={`track`} className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                            <Truck className="w-4 h-4" />
                            {language === 'ar' ? 'تتبع طلبك' : 'Track Order'}
                        </Link>
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={toggleLanguage}>
                            <Globe className="w-5 h-5" />
                        </Button>

                        {/* Dashboard Link for Store Owners/Admins */}
                        <StoreDashboardLink storeId={store.id} />

                        <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
                            <ShoppingCart className="w-5 h-5" />
                            {cartCount > 0 && (
                                <Badge className="absolute -top-1 -end-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                                    {cartCount}
                                </Badge>
                            )}
                        </Button>

                        {/* Mobile Menu */}
                        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                            <SheetTrigger asChild className="md:hidden">
                                <Button variant="ghost" size="icon">
                                    <Menu className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side={language === 'ar' ? 'right' : 'left'}>
                                <nav className="flex flex-col gap-4 mt-8">
                                    <Link
                                        href={store.baseUrl || '/'}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-lg font-medium hover:text-primary transition-colors"
                                    >
                                        {language === 'ar' ? 'الرئيسية' : 'Home'}
                                    </Link>
                                    <Link
                                        href={`products`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-lg font-medium hover:text-primary transition-colors"
                                    >
                                        {language === 'ar' ? 'المنتجات' : 'Products'}
                                    </Link>
                                    {headerCategories.map(category => (
                                        <Link
                                            key={category.id}
                                            href={`products?category=${category.id}`}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-lg font-medium hover:text-primary transition-colors"
                                        >
                                            {category.name[language] || category.name.ar || category.name.en}
                                        </Link>
                                    ))}
                                    <Link
                                        href={`track`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-lg font-medium hover:text-primary transition-colors flex items-center gap-2"
                                    >
                                        <Truck className="w-5 h-5" />
                                        {language === 'ar' ? 'تتبع طلبك' : 'Track Order'}
                                    </Link>
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
}



export function StoreClientLayout({ children, store, integrations = {}, headerCategories = [] }: StoreLayoutProps) {
    const { dir } = useLanguage();

    return (
        <div className="min-h-screen bg-background" dir={dir}>
            <CartProvider storeId={store.id}>
                <CartRecoveryHandler storeSlug={store.slug} />
                <TrackingPixels integrations={integrations} />
                <CartDrawer store={{ id: store.id, currency: store.currency, slug: store.slug }} />
                <main className="flex flex-col min-h-screen">
                    <div className="flex-1">
                        {children}
                    </div>

                    {/* Copyright Banner */}
                    {!store.has_removed_copyright && (
                        <div className="w-full py-10 mt-auto bg-gradient-to-r from-[#0f172a] via-[#3b0764] to-[#0f172a] flex justify-center items-center border-t-4 border-[#c084fc] relative overflow-hidden shadow-[0_-10px_40px_rgba(88,28,135,0.3)]">
                            {/* Animated background glow */}
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent opacity-50 blur-xl"></div>

                            <div className="text-center group relative z-10 px-4">
                                <p className="text-xl md:text-2xl font-black flex items-center gap-3 justify-center mb-4 transition-transform duration-500 group-hover:scale-105">
                                    <span className="text-slate-300 drop-shadow-sm">تم الإنشاء بواسطة</span>
                                    <a
                                        href="#"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center text-white bg-white/10 px-6 py-2 rounded-full border border-white/20 hover:bg-white/20 hover:border-white/40 hover:-translate-y-1 transition-all duration-300 shadow-[0_0_20px_rgba(192,132,252,0.6)] backdrop-blur-sm"
                                    >
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-purple-300 font-extrabold tracking-wider">
                                            مـنـصـة أوردلي
                                        </span>
                                    </a>
                                </p>
                                <p className="text-purple-200/70 text-sm md:text-base font-medium opacity-80 group-hover:opacity-100 transition-opacity tracking-wide">
                                    المنصة الأسرع والأذكى لإنشاء متجرك الإلكتروني في ثوانٍ 🚀
                                </p>
                            </div>
                        </div>
                    )}
                </main>
            </CartProvider>
        </div>
    );
}

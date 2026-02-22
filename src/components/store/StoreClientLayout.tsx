"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Loader2, Menu, ShoppingCart, Globe, Store as StoreIcon, Truck } from 'lucide-react';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { TrackingPixels } from '@/components/store/TrackingPixels';
import { StoreDashboardLink } from '@/components/store/StoreDashboardLink';
import { Footer } from '@/components/store/builder/Footer';
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
}

function StoreHeader({ store }: { store: StoreData }) {
    const { language, setLanguage } = useLanguage();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { cartCount } = useCart();

    const toggleLanguage = () => {
        setLanguage(language === 'ar' ? 'en' : 'ar');
    };

    const storeName = store.name[language] || store.name.ar || store.name.en;

    return (
        <header className="sticky top-0 z-50 bg-card border-b">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo / Store Name */}
                    <Link href={`/s/${store.slug}`} className="flex items-center gap-3">
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
                        <Link href={`/s/${store.slug}`} className="text-sm font-medium hover:text-primary transition-colors">
                            {language === 'ar' ? 'الرئيسية' : 'Home'}
                        </Link>
                        <Link href={`/s/${store.slug}/products`} className="text-sm font-medium hover:text-primary transition-colors">
                            {language === 'ar' ? 'المنتجات' : 'Products'}
                        </Link>
                        <Link href={`/s/${store.slug}/track`} className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
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

                        <Link href={`/s/${store.slug}/cart`}>
                            <Button variant="ghost" size="icon" className="relative">
                                <ShoppingCart className="w-5 h-5" />
                                {cartCount > 0 && (
                                    <Badge className="absolute -top-1 -end-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                                        {cartCount}
                                    </Badge>
                                )}
                            </Button>
                        </Link>

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
                                        href={`/s/${store.slug}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-lg font-medium hover:text-primary transition-colors"
                                    >
                                        {language === 'ar' ? 'الرئيسية' : 'Home'}
                                    </Link>
                                    <Link
                                        href={`/s/${store.slug}/products`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-lg font-medium hover:text-primary transition-colors"
                                    >
                                        {language === 'ar' ? 'المنتجات' : 'Products'}
                                    </Link>
                                    <Link
                                        href={`/s/${store.slug}/track`}
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



export function StoreClientLayout({ children, store, integrations = {} }: StoreLayoutProps) {
    const { dir } = useLanguage();

    return (
        <div className="min-h-screen bg-background" dir={dir}>
            <CartProvider storeId={store.id}>
                <TrackingPixels integrations={integrations} />
                <StoreHeader store={store} />
                <main>
                    {children}
                </main>
                <Footer
                    data={COMPONENT_DEFAULTS.Footer as any}
                    store={store}
                />
            </CartProvider>
        </div>
    );
}

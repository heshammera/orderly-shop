import { useState, useEffect } from 'react';
import { Outlet, useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Loader2, Menu, ShoppingCart, Globe, Store as StoreIcon, Truck } from 'lucide-react';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { PixelScripts } from '@/components/integrations/PixelScripts';
import { HelmetProvider } from 'react-helmet-async';
import { StoreDashboardLink } from '@/components/store/StoreDashboardLink';

interface StoreData {
  id: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  logo_url: string | null;
  currency: string;
  settings: any;
}

export default function StoreLayout() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const { language, setLanguage, dir } = useLanguage();
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (storeSlug) {
      fetchStore();
    }
  }, [storeSlug]);

  const fetchStore = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, description, logo_url, currency, settings')
        .eq('slug', storeSlug)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      if (!data) {
        setError('Store not found');
        return;
      }

      setStore({
        id: data.id,
        name: typeof data.name === 'string' ? JSON.parse(data.name) : data.name,
        description: typeof data.description === 'string' ? JSON.parse(data.description) : data.description || { ar: '', en: '' },
        logo_url: data.logo_url,
        currency: data.currency,
        settings: data.settings,
      });

      // Get cart count from localStorage
      const cart = JSON.parse(localStorage.getItem(`cart_${data.id}`) || '[]');
      setCartCount(cart.reduce((sum: number, item: any) => sum + item.quantity, 0));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4" dir={dir}>
        <StoreIcon className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">
          {language === 'ar' ? 'المتجر غير موجود' : 'Store Not Found'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar'
            ? 'عذراً، لم نتمكن من العثور على هذا المتجر'
            : 'Sorry, we could not find this store'}
        </p>
        <Link to="/">
          <Button>{language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</Button>
        </Link>
      </div>
    );
  }

  const storeName = store.name[language] || store.name.ar || store.name.en;

  return (
    <HelmetProvider>
      {store && <PixelScripts storeId={store.id} />}
      <div className="min-h-screen bg-background" dir={dir}>
        {/* Header */}
        <header className="sticky top-0 z-50 bg-card border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo / Store Name */}
              <Link to={`/s/${storeSlug}`} className="flex items-center gap-3">
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
                <Link to={`/s/${storeSlug}`} className="text-sm font-medium hover:text-primary transition-colors">
                  {language === 'ar' ? 'الرئيسية' : 'Home'}
                </Link>
                <Link to={`/s/${storeSlug}/products`} className="text-sm font-medium hover:text-primary transition-colors">
                  {language === 'ar' ? 'المنتجات' : 'Products'}
                </Link>
                <Link to={`/s/${storeSlug}/track`} className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
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

                <Link to={`/s/${storeSlug}/cart`}>
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
                        to={`/s/${storeSlug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-lg font-medium hover:text-primary transition-colors"
                      >
                        {language === 'ar' ? 'الرئيسية' : 'Home'}
                      </Link>
                      <Link
                        to={`/s/${storeSlug}/products`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-lg font-medium hover:text-primary transition-colors"
                      >
                        {language === 'ar' ? 'المنتجات' : 'Products'}
                      </Link>
                      <Link
                        to={`/s/${storeSlug}/track`}
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

        {/* Main Content */}
        <main>
          {store && (
            <CartProvider storeId={store.id}>
              <Outlet context={{ store, cartCount, setCartCount }} />
            </CartProvider>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-card border-t mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {store.logo_url ? (
                  <img src={store.logo_url} alt={storeName} className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <StoreIcon className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <span className="font-semibold">{storeName}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {language === 'ar'
                  ? `© ${new Date().getFullYear()} ${storeName}. جميع الحقوق محفوظة.`
                  : `© ${new Date().getFullYear()} ${storeName}. All rights reserved.`}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </HelmetProvider>
  );
}

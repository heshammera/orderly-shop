import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Store,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  ChevronLeft,
  Globe,
  ExternalLink,
  Ticket,
  Wallet,
  Plug,
  BarChart3,
} from 'lucide-react';
import { useStoreRole } from '@/hooks/useStoreRole';

interface DashboardLayoutProps {
  children: React.ReactNode;
  storeId: string;
  storeName: string;
  storeSlug?: string;
}

export function DashboardLayout({ children, storeId, storeName, storeSlug }: DashboardLayoutProps) {
  const { t, language, setLanguage, dir } = useLanguage();
  const { isAdmin, isEditor, isSupport, isOwner } = useStoreRole(storeId);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [slug, setSlug] = useState<string | undefined>(storeSlug);

  useEffect(() => {
    if (!slug && storeId) {
      const fetchSlug = async () => {
        try {
          const { data, error } = await supabase
            .from('stores')
            .select('slug')
            .eq('id', storeId)
            .single();
          if (error) throw error;
          if (data) setSlug(data.slug);
        } catch (error) {
          console.log("Error fetching slug:", error);
        }
      };
      fetchSlug();
    } else if (storeSlug && storeSlug !== slug) {
      setSlug(storeSlug);
    }
  }, [storeId, storeSlug, slug]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const navItems = [
    {
      icon: LayoutDashboard,
      label: language === 'ar' ? 'الرئيسية' : 'Dashboard',
      href: `/store/${storeId}`,
      show: true,
    },
    {
      icon: BarChart3,
      label: language === 'ar' ? 'التحليلات' : 'Analytics',
      href: `/store/${storeId}/analytics`,
      show: true,
    },
    {
      icon: Users,
      label: language === 'ar' ? 'فريق العمل' : 'Team Members',
      href: `/store/${storeId}/team`,
      show: isAdmin,
    },
    {
      icon: Package,
      label: language === 'ar' ? 'المنتجات' : 'Products',
      href: `/store/${storeId}/products`,
      show: isEditor,
    },
    {
      icon: FolderTree,
      label: language === 'ar' ? 'التصنيفات' : 'Categories',
      href: `/store/${storeId}/categories`,
      show: isEditor,
    },
    {
      icon: ShoppingCart,
      label: language === 'ar' ? 'الطلبات' : 'Orders',
      href: `/store/${storeId}/orders`,
      show: true, // Everyone sees orders
    },
    {
      icon: Users,
      label: language === 'ar' ? 'العملاء' : 'Customers',
      href: `/store/${storeId}/customers`,
      show: true, // Everyone sees customers
    },
    {
      icon: Ticket,
      label: language === 'ar' ? 'الكوبونات' : 'Coupons',
      href: `/store/${storeId}/coupons`,
      show: isEditor,
    },
    {
      icon: Settings,
      label: language === 'ar' ? 'الإعدادات' : 'Settings',
      href: `/store/${storeId}/settings`,
      show: isAdmin,
    },
    {
      icon: Plug,
      label: language === 'ar' ? 'الربط' : 'Integrations',
      href: `/store/${storeId}/integrations`,
      show: isAdmin,
    },
    {
      icon: Wallet,
      label: language === 'ar' ? 'المحفظة' : 'Wallet',
      href: `/store/${storeId}/wallet`,
      show: isOwner,
    },
  ].filter(item => item.show);

  const NavContent = () => (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = location.pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Icon className="w-5 h-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const BackArrow = language === 'ar' ? ChevronRight : ChevronLeft;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-e bg-card">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center gap-3 h-16 px-4 border-b">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Store className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold truncate">{storeName}</span>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <NavContent />
          </div>

          {/* Footer */}
          <div className="p-4 border-t space-y-2">
            {slug && isAdmin && (
              <a
                href={`/s/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <Button variant="outline" className="w-full justify-start gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary">
                  <ExternalLink className="w-4 h-4" />
                  {language === 'ar' ? 'عرض المتجر' : 'View Store'}
                </Button>
              </a>
            )}

            {isAdmin && (
              <Link to="/dashboard">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <BackArrow className="w-4 h-4" />
                  {language === 'ar' ? 'كل المتاجر' : 'All Stores'}
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              {t.nav.logout}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center gap-4 h-16 px-4 border-b bg-card">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side={language === 'ar' ? 'right' : 'left'} className="w-64 p-0">
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 h-16 px-4 border-b">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Store className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold truncate">{storeName}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <NavContent />
              </div>
              <div className="p-4 border-t space-y-2">
                {slug && isAdmin && (
                  <a
                    href={`/s/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button variant="outline" className="w-full justify-start gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary">
                      <ExternalLink className="w-4 h-4" />
                      {language === 'ar' ? 'عرض المتجر' : 'View Store'}
                    </Button>
                  </a>
                )}
                {isAdmin && (
                  <Link to="/dashboard" onClick={() => setSidebarOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <BackArrow className="w-4 h-4" />
                      {language === 'ar' ? 'كل المتاجر' : 'All Stores'}
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" />
                  {t.nav.logout}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <span className="font-semibold truncate flex-1">{storeName}</span>

        {slug && isAdmin && (
          <a href={`/s/${slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon">
              <ExternalLink className="w-5 h-5" />
            </Button>
          </a>
        )}

        <Button variant="ghost" size="icon" onClick={toggleLanguage}>
          <Globe className="w-5 h-5" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="lg:ps-64">
        <div className="hidden lg:flex items-center justify-end gap-2 h-16 px-6 border-b bg-card">
          {slug && isAdmin && (
            <a href={`/s/${slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className='gap-2 hidden md:flex'>
                <ExternalLink className="w-4 h-4" />
                {language === 'ar' ? 'زيارة المتجر' : 'Visit Store'}
              </Button>
            </a>
          )}
          <Button variant="ghost" size="icon" onClick={toggleLanguage}>
            <Globe className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

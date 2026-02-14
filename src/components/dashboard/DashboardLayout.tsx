"use client";

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
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
    Paintbrush,
    UserPlus,
    Award,
    ShoppingBag,
} from 'lucide-react';
import { useStoreRole } from '@/hooks/useStoreRole';
import { StoreSwitcher } from './StoreSwitcher';

interface DashboardLayoutProps {
    children: React.ReactNode;
    storeId: string;
    storeName: string | { en: string; ar: string };
    storeSlug?: string;
    isSubdomain?: boolean;
    hideSidebar?: boolean;
}

export function DashboardLayout({
    children,
    storeId,
    storeName,
    storeSlug,
    isSubdomain = false,
    hideSidebar = false
}: DashboardLayoutProps) {
    const supabase = createClient();
    const { t, language, setLanguage, dir } = useLanguage();
    const { isAdmin, isEditor, isOwner } = useStoreRole(storeId);
    const { signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [slug, setSlug] = useState<string | undefined>(storeSlug);

    useEffect(() => {
        // If slug is missing and we have storeId, try to fetch it
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
        router.push('/');
    };

    const toggleLanguage = () => {
        setLanguage(language === 'ar' ? 'en' : 'ar');
    };

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const navItems = [
        {
            icon: LayoutDashboard,
            label: t.nav.dashboard,
            href: `/dashboard/${storeId}`,
            show: true,
        },
        {
            icon: BarChart3,
            label: language === 'ar' ? 'التحليلات' : 'Analytics',
            href: `/dashboard/${storeId}/analytics`,
            show: isAdmin, // Enabled Advanced Analytics
        },
        {
            icon: Users,
            label: language === 'ar' ? 'فريق العمل' : 'Team Members',
            href: `/dashboard/${storeId}/team`,
            show: isAdmin,
        },
        {
            icon: Package,
            label: t.dashboard.products,
            href: `/dashboard/${storeId}/products`,
            show: isEditor,
        },
        {
            icon: FolderTree,
            label: t.dashboard.createCategories,
            href: `/dashboard/${storeId}/categories`,
            show: isEditor,
        },
        {
            icon: ShoppingCart,
            label: t.dashboard.orders,
            href: `/dashboard/${storeId}/orders`,
            show: true,
        },
        {
            icon: Users,
            label: t.dashboard.customers,
            href: `/dashboard/${storeId}/customers`,
            show: true,
        },
        {
            icon: ShoppingBag,
            label: language === 'ar' ? 'السلات المتروكة' : 'Abandoned Carts',
            href: `/dashboard/${storeId}/carts`,
            show: isEditor,
        },
        {
            icon: Ticket,
            label: language === 'ar' ? 'الكوبونات' : 'Coupons',
            href: `/dashboard/${storeId}/coupons`,
            show: isEditor,
        },
        {
            icon: Award,
            label: language === 'ar' ? 'نقاط الولاء' : 'Loyalty Program',
            href: `/dashboard/${storeId}/marketing/loyalty`,
            show: isEditor,
        },
        {
            icon: UserPlus,
            label: language === 'ar' ? 'التسويق بالعمولة' : 'Affiliates',
            href: `/dashboard/${storeId}/marketing/affiliates`,
            show: isEditor,
        },
        {
            icon: Paintbrush,
            label: language === 'ar' ? 'محرر المتجر' : 'Store Editor',
            href: `/dashboard/${storeId}/editor`,
            show: isEditor,
        },
        {
            icon: Settings,
            label: language === 'ar' ? 'الإعدادات' : 'Settings',
            href: `/dashboard/${storeId}/settings`,
            show: isAdmin,
        },
        {
            icon: Wallet,
            label: language === 'ar' ? 'المحفظة' : 'Wallet',
            href: `/dashboard/${storeId}/wallet`,
            show: isOwner,
        },
    ].filter(item => item.show).map(item => {
        // If we are on a subdomain (passed from server), clean the URLs
        if (isSubdomain) {
            if (item.href.startsWith(`/dashboard/${storeId}`)) {
                return { ...item, href: item.href.replace(`/dashboard/${storeId}`, '/dashboard') };
            }
        }
        return item;
    });

    const NavContent = () => (
        <nav className="space-y-1">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative',
                            isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                            isCollapsed ? 'justify-center px-2' : ''
                        )}
                        title={isCollapsed ? item.label : undefined}
                    >
                        <Icon className={cn("transition-all", isCollapsed ? "w-6 h-6" : "w-5 h-5")} />
                        {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                );
            })}
        </nav>
    );

    const BackArrow = language === 'ar' ? ChevronRight : ChevronLeft;
    const CollapseIcon = language === 'ar' ? (isCollapsed ? ChevronLeft : ChevronRight) : (isCollapsed ? ChevronRight : ChevronLeft);


    return (
        <div className="min-h-screen bg-background" dir={dir}>
            {/* Desktop Sidebar */}
            {!hideSidebar && (
                <aside
                    className={cn(
                        "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col border-e bg-card transition-all duration-300 ease-in-out z-50",
                        isCollapsed ? "lg:w-20" : "lg:w-64"
                    )}
                >
                    <div className="flex flex-col flex-1 min-h-0">
                        {/* Logo & Switcher */}
                        <div className={cn("flex items-center h-16 px-4 border-b transition-all", isCollapsed ? "justify-center" : "gap-3")}>
                            <StoreSwitcher currentStoreId={storeId} isCollapsed={isCollapsed} />
                        </div>

                        {/* Navigation */}
                        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                            <NavContent />
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t space-y-2">
                            {slug && isAdmin && (
                                <a
                                    href={`/s/${slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn("block w-full", isCollapsed ? "flex justify-center" : "")}
                                    title={isCollapsed ? (language === 'ar' ? 'عرض المتجر' : 'View Store') : undefined}
                                >
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full border-primary/20 hover:bg-primary/10 hover:text-primary",
                                            isCollapsed ? "px-0 justify-center" : "justify-start gap-2"
                                        )}
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        {!isCollapsed && (language === 'ar' ? 'عرض المتجر' : 'View Store')}
                                    </Button>
                                </a>
                            )}

                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start text-muted-foreground hover:text-foreground",
                                    isCollapsed ? "px-0 justify-center" : "gap-2"
                                )}
                                onClick={toggleSidebar}
                                title={language === 'ar' ? (isCollapsed ? 'توسيع القائمة' : 'تصغير القائمة') : (isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar')}
                            >
                                <CollapseIcon className="w-4 h-4" />
                                {!isCollapsed && (language === 'ar' ? 'تصغير القائمة' : 'Collapse Sidebar')}
                            </Button>

                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full text-destructive hover:text-destructive",
                                    isCollapsed ? "px-0 justify-center" : "justify-start gap-2"
                                )}
                                onClick={handleSignOut}
                                title={isCollapsed ? t.nav.logout : undefined}
                            >
                                <LogOut className="w-4 h-4" />
                                {!isCollapsed && t.nav.logout}
                            </Button>
                        </div>
                    </div>
                </aside>
            )}

            {/* Mobile Header */}
            <header className="lg:hidden sticky top-0 z-40 flex items-center gap-4 h-16 px-4 border-b bg-card">
                {!hideSidebar && (
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side={language === 'ar' ? 'right' : 'left'} className="w-64 p-0">
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-3 h-16 px-4 border-b">
                                    <StoreSwitcher currentStoreId={storeId} />
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
                )}

                <div className="flex-1 px-2">
                    <StoreSwitcher currentStoreId={storeId} />
                </div>

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
            <main
                className={cn(
                    "transition-all duration-300 ease-in-out",
                    !hideSidebar ? (isCollapsed ? "lg:ps-20" : "lg:ps-64") : "ps-0"
                )}
            >
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

                    {/* Logout button in header when sidebar is hidden */}
                    {hideSidebar && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive gap-2"
                            onClick={handleSignOut}
                        >
                            <LogOut className="w-4 h-4" />
                            {t.nav.logout}
                        </Button>
                    )}
                </div>
                <div className="p-6">{children}</div>
            </main>
        </div>
    );
}

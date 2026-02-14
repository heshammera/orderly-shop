"use client";

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    CreditCard,
    Users,
    Store,
    Settings,
    LogOut,
    Menu,
    X,
    Wallet,
    DollarSign,
    FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { language, t } = useLanguage();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await fetch('/api/admin/logout', { method: 'POST' });
            router.push('/admin/login');
            router.refresh();
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const navItems = [
        {
            icon: LayoutDashboard,
            label: language === 'ar' ? 'الرئيسية' : 'Dashboard',
            href: '/admin',
        },
        {
            icon: Store,
            label: language === 'ar' ? 'المتاجر' : 'Stores',
            href: '/admin/stores',
        },
        {
            icon: Users,
            label: language === 'ar' ? 'المستخدمين' : 'Users',
            href: '/admin/users',
        },
        {
            icon: DollarSign,
            label: language === 'ar' ? 'طلبات الشحن' : 'Recharge Requests',
            href: '/admin/recharge-requests',
        },
        {
            icon: Wallet,
            label: language === 'ar' ? 'إعدادات المحافظ' : 'Wallet Settings',
            href: '/admin/wallet-settings',
        },
        {
            icon: CreditCard,
            label: language === 'ar' ? 'الباقات' : 'Plans',
            href: '/admin/plans',
        },
        {
            icon: FileText,
            label: language === 'ar' ? 'طلبات الاشتراك' : 'Subscription Requests',
            href: '/admin/subscription-requests',
        },
        {
            icon: Users,
            label: language === 'ar' ? 'الاشتراكات' : 'Subscriptions',
            href: '/admin/subscriptions',
        },
    ];

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

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-e bg-card">
                <div className="flex flex-col flex-1 min-h-0">
                    <div className="flex items-center gap-3 h-16 px-4 border-b">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <Settings className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-semibold truncate">Platform Admin</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <NavContent />
                    </div>

                    <div className="p-4 border-t">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4" />
                            {language === 'ar' ? 'تسجيل خروج' : 'Logout'}
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header Trigger */}
            <div className="lg:hidden sticky top-0 z-40 flex items-center gap-4 h-16 px-4 border-b bg-card">
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="w-5 h-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side={language === 'ar' ? 'right' : 'left'} className="w-64 p-0">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center gap-3 h-16 px-4 border-b">
                                <span className="font-semibold">Platform Admin</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                <NavContent />
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
                <span className="font-semibold">Admin Panel</span>
            </div>
        </>
    );
}

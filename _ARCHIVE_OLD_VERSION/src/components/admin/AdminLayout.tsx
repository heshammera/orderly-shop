import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
    LayoutDashboard,
    Store,
    Users,
    Settings,
    LogOut,
    Wallet,
    Menu,
    ShieldAlert
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminLayout() {
    const { language } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        checkAdminRole();
    }, []);

    const checkAdminRole = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            // Check if user has 'admin' role
            const { data, error } = await supabase.rpc('has_role', {
                _user_id: user.id,
                _role: 'admin'
            });

            if (error || !data) {
                toast({
                    title: "Access Denied",
                    description: "You do not have permission to access the admin panel.",
                    variant: "destructive"
                });
                navigate('/');
                return;
            }

            setLoading(false);
        } catch (error) {
            console.error('Error checking admin role:', error);
            navigate('/');
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const menuItems = [
        {
            title: { ar: 'لوحة التحكم', en: 'Dashboard' },
            icon: LayoutDashboard,
            path: '/admin'
        },
        {
            title: { ar: 'المتاجر', en: 'Stores' },
            icon: Store,
            path: '/admin/stores'
        },
        {
            title: { ar: 'طلبات الشحن', en: 'Recharge Requests' },
            icon: Wallet,
            path: '/admin/recharge-requests'
        },
        {
            title: { ar: 'المستخدمون', en: 'Users' },
            icon: Users,
            path: '/admin/users'
        },
        // {
        //   title: { ar: 'الإعدادات', en: 'Settings' },
        //   icon: Settings,
        //   path: '/admin/settings'
        // }
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 z-50 bg-white border-r shadow-sm transition-all duration-300 ease-in-out 
          ${isSidebarOpen ? 'w-64' : 'w-20'} 
          ${language === 'ar' ? 'right-0 border-l border-r-0' : 'left-0'}`}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="h-16 flex items-center justify-center border-b px-4">
                        {isSidebarOpen ? (
                            <div className="flex items-center gap-2 font-bold text-xl text-primary">
                                <ShieldAlert className="w-6 h-6" />
                                <span>Admin Panel</span>
                            </div>
                        ) : (
                            <ShieldAlert className="w-6 h-6 text-primary" />
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 py-6 px-3 space-y-1">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                    ${isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-gray-600 hover:bg-gray-100'
                                        }
                    ${!isSidebarOpen && 'justify-center'}
                  `}
                                >
                                    <Icon className="w-5 h-5" />
                                    {isSidebarOpen && (
                                        <span>{item.title[language as 'ar' | 'en']}</span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t">
                        <Button
                            variant="ghost"
                            className={`w-full flex items-center gap-2 ${!isSidebarOpen && 'justify-center px-0'}`}
                            onClick={handleLogout}
                        >
                            <LogOut className="w-5 h-5" />
                            {isSidebarOpen && (
                                <span>{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                            )}
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main
                className={`flex-1 transition-all duration-300 
          ${isSidebarOpen ? (language === 'ar' ? 'mr-64' : 'ml-64') : (language === 'ar' ? 'mr-20' : 'ml-20')}
        `}
            >
                <div className="h-16 bg-white border-b flex items-center px-6 sticky top-0 z-40">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        <Menu className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

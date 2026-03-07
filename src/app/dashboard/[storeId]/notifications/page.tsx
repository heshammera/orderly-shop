"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Bell, ShoppingBag, AlertTriangle, Info, MessageSquare, User, Loader2, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'order' | 'stock' | 'system' | 'review' | 'customer';
    is_read: boolean;
    link?: string;
    created_at: string;
}

export default function NotificationsPage({ params }: { params: { storeId: string } }) {
    const { language, dir } = useLanguage();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    const fetchNotifications = async () => {
        try {
            const res = await fetch(`/api/dashboard/${params.storeId}/notifications`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: language === 'ar' ? 'حدث خطأ أثناء جلب الإشعارات' : 'Error fetching notifications',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        const supabase = createClient();

        const subscription = supabase
            .channel('dashboard-page-notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `store_id=eq.${params.storeId}` },
                (payload) => {
                    const newNotif = payload.new as Notification;
                    setNotifications(prev => [newNotif, ...prev]);
                }
            )
            .subscribe();

        const interval = setInterval(fetchNotifications, 180000);

        return () => {
            clearInterval(interval);
            supabase.removeChannel(subscription);
        };
    }, [params.storeId]);

    useEffect(() => {
        if (!loading) {
            const hasUnread = notifications.some(n => !n.is_read);
            if (hasUnread) {
                markAllAsRead(true);
            }
        }
    }, [notifications, loading]);

    const markAsRead = async (id: string) => {
        try {
            setUpdating(id);
            const res = await fetch(`/api/dashboard/${params.storeId}/notifications`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'mark_read', notificationId: id })
            });

            if (res.ok) {
                setNotifications(prev => prev.map(n =>
                    n.id === id ? { ...n, is_read: true } : n
                ));
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        } finally {
            setUpdating(null);
        }
    };

    const markAllAsRead = async (silent = false) => {
        try {
            setUpdating('all');
            const res = await fetch(`/api/dashboard/${params.storeId}/notifications`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'mark_all_read' })
            });

            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                if (!silent) {
                    toast({
                        title: language === 'ar' ? 'نجاح' : 'Success',
                        description: language === 'ar' ? 'تم تحديد كل الإشعارات كمقروءة' : 'All notifications marked as read',
                    });
                }
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        } finally {
            setUpdating(null);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            setUpdating(id);
            const supabase = createClient();
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id)
                .eq('store_id', params.storeId);

            if (error) throw error;

            setNotifications(prev => prev.filter(n => n.id !== id));
            toast({
                title: language === 'ar' ? 'نجاح' : 'Success',
                description: language === 'ar' ? 'تم حذف الإشعار' : 'Notification deleted',
            });

        } catch (error) {
            console.error('Error deleting notification:', error);
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: language === 'ar' ? 'حدث خطأ أثناء حذف الإشعار' : 'Error deleting notification',
                variant: 'destructive',
            });
        } finally {
            setUpdating(null);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'order': return <ShoppingBag className="w-5 h-5 text-blue-500" />;
            case 'stock': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'review': return <MessageSquare className="w-5 h-5 text-green-500" />;
            case 'customer': return <User className="w-5 h-5 text-purple-500" />;
            default: return <Info className="w-5 h-5 text-gray-500" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="max-w-4xl mx-auto space-y-6" dir={dir}>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {language === 'ar'
                            ? `لديك ${unreadCount} إشعارات غير مقروءة`
                            : `You have ${unreadCount} unread notifications`
                        }
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        onClick={() => markAllAsRead()}
                        disabled={updating === 'all'}
                        variant="outline"
                        className="gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                    </Button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="bg-card border rounded-lg p-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">
                        {language === 'ar' ? 'لا توجد إشعارات بعد' : 'No notifications yet'}
                    </h3>
                    <p className="text-muted-foreground">
                        {language === 'ar'
                            ? 'ستظهر هنا جميع الإشعارات الخاصة بالطلبات والتنبيهات.'
                            : 'All your order and system notifications will appear here.'
                        }
                    </p>
                </div>
            ) : (
                <div className="bg-card border rounded-lg overflow-hidden divide-y">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={cn(
                                "p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-start transition-colors",
                                !notification.is_read ? "bg-primary/5" : "hover:bg-muted/50"
                            )}
                        >
                            <div className={cn(
                                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-background border",
                                !notification.is_read && "border-primary/20 bg-primary/10"
                            )}>
                                {getIcon(notification.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h4 className={cn("font-semibold text-base", !notification.is_read && "text-primary")}>
                                            {notification.title}
                                            {!notification.is_read && (
                                                <span className="inline-block w-2 h-2 rounded-full bg-primary mx-2" />
                                            )}
                                        </h4>
                                        <p className="text-muted-foreground mt-1">
                                            {notification.message}
                                        </p>
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDistanceToNow(new Date(notification.created_at), {
                                            addSuffix: true,
                                            locale: language === 'ar' ? ar : enUS
                                        })}
                                    </span>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    {notification.link && (
                                        <Link href={notification.link}>
                                            <Button variant="default" size="sm">
                                                {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                                            </Button>
                                        </Link>
                                    )}

                                    {!notification.is_read && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => markAsRead(notification.id)}
                                            disabled={updating === notification.id}
                                        >
                                            {language === 'ar' ? 'تحديد كمقروء' : 'Mark as read'}
                                        </Button>
                                    )}

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => deleteNotification(notification.id)}
                                        disabled={updating === notification.id}
                                    >
                                        {language === 'ar' ? 'حذف' : 'Delete'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

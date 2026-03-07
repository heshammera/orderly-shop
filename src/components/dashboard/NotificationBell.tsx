"use client";

import { useState, useEffect } from 'react';
import { Bell, ShoppingBag, AlertTriangle, Info, MessageSquare, User, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import Link from 'next/link';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'order' | 'stock' | 'system' | 'review' | 'customer';
    is_read: boolean;
    link?: string;
    created_at: string;
}

export function NotificationBell({ storeId }: { storeId: string }) {
    const { language } = useLanguage();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await fetch(`/api/dashboard/${storeId}/notifications`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        const supabase = createClient();

        // Listen for new notifications in real-time
        const subscription = supabase
            .channel('store-notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `store_id=eq.${storeId}` },
                (payload) => {
                    // Prepend new notification
                    const newNotif = payload.new as Notification;
                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe();

        // Fallback polling every 3 minutes just in case
        const interval = setInterval(fetchNotifications, 180000);

        return () => {
            clearInterval(interval);
            supabase.removeChannel(subscription);
        };
    }, [storeId]);

    // Auto-mark as read when opened
    useEffect(() => {
        if (open && unreadCount > 0 && notifications.length > 0) {
            markAllAsRead();
        }
    }, [open]);

    const markAsRead = async (id: string, link?: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));

            await fetch(`/api/dashboard/${storeId}/notifications`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'mark_read', notificationId: id })
            });

            if (link) {
                setOpen(false);
                router.push(link);
            }
        } catch (error) {
            console.error('Error marking as read:', error);
            // Revert on error
            fetchNotifications();
        }
    };

    const markAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);

            await fetch(`/api/dashboard/${storeId}/notifications`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'mark_all_read' })
            });
        } catch (error) {
            console.error('Error marking all as read:', error);
            fetchNotifications();
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'order': return <ShoppingBag className="w-4 h-4 text-blue-500" />;
            case 'stock': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case 'review': return <MessageSquare className="w-4 h-4 text-green-500" />;
            case 'customer': return <User className="w-4 h-4 text-purple-500" />;
            default: return <Info className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center rounded-full text-[10px]"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 md:w-96 p-0" align={language === 'ar' ? 'start' : 'end'}>
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">{language === 'ar' ? 'الإشعارات' : 'Notifications'}</h3>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto p-0 text-xs text-primary">
                            {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                        </Button>
                    )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                            <Bell className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm">{language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => markAsRead(notification.id, notification.link)}
                                    className={cn(
                                        "p-4 flex gap-3 cursor-pointer transition-colors hover:bg-muted/50",
                                        !notification.is_read && "bg-primary/5"
                                    )}
                                >
                                    <div className={cn(
                                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-background border",
                                        !notification.is_read && "border-primary/20 bg-primary/10"
                                    )}>
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-sm font-medium mb-1", !notification.is_read && "text-primary")}>
                                            {notification.title}
                                        </p>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.created_at), {
                                                addSuffix: true,
                                                locale: language === 'ar' ? ar : enUS
                                            })}
                                        </p>
                                    </div>
                                    {!notification.is_read && (
                                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-2 border-t text-center">
                    <Link href={`/dashboard/${storeId}/notifications`} onClick={() => setOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground">
                            {language === 'ar' ? 'عرض كل الإشعارات' : 'View all notifications'}
                        </Button>
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}

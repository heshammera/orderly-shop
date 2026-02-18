"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Store, Plus, ArrowRight, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function DeleteStoreDialog({ storeId, storeName, onDeleted }: { storeId: string, storeName: string, onDeleted: () => void }) {
    const { language } = useLanguage();
    const supabase = createClient();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('stores')
                .delete()
                .eq('id', storeId);

            if (error) throw error;
            onDeleted();
        } catch (error) {
            console.error('Error deleting store:', error);
            toast({
                title: language === 'ar' ? 'خطأ في الحذف' : 'Deletion Error',
                description: language === 'ar' ? 'حدث خطأ أثناء محاولة حذف المتجر' : 'An error occurred while trying to delete the store.',
                variant: 'destructive'
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-5 h-5" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rtl:text-right">
                <AlertDialogHeader>
                    <div className="flex items-center gap-2 text-destructive mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <AlertDialogTitle>
                            {language === 'ar' ? 'تأكيد حذف المتجر' : 'Confirm Store Deletion'}
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription>
                        {language === 'ar'
                            ? `هل أنت متأكد من حذف المتجر "${storeName}"؟ سيتم حذف جميع المنتجات والطلبات والبيانات المرتبطة به نهائياً ولا يمكن التراجع عن هذا الإجراء.`
                            : `Are you sure you want to delete "${storeName}"? All products, orders, and associated data will be permanently removed. This action cannot be undone.`}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                    <AlertDialogCancel disabled={isDeleting}>
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'ar' ? 'حذف المتجر نهائياً' : 'Permanently Delete Store')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default function DashboardPage() {
    const { language } = useLanguage();
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [stores, setStores] = useState<any[]>([]);
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            // Get current session and user
            const { data: { session } } = await supabase.auth.getSession();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/auth/login');
                return;
            }


            setSession(session);

            // Get stores where user is owner or member
            const { data: storeMembers } = await supabase
                .from('store_members')
                .select('store_id, role, stores(id, name, slug, logo_url, status)')
                .eq('user_id', user.id);

            if (storeMembers) {
                const storeList = storeMembers
                    .map(sm => ({
                        ...sm.stores,
                        role: sm.role
                    }))
                    .filter(s => s.id); // Filter out null stores

                setStores(storeList);

                // If user has only one store, redirect directly to it
                if (storeList.length === 1 && session) {
                    const store = storeList[0];
                    const protocol = window.location.protocol;
                    const host = window.location.host;
                    let rootDomain = host;

                    let targetUrl = '';
                    // Robust Vercel detection
                    if (host.includes('.vercel.app')) {
                        targetUrl = `${protocol}//${host}/s/${store.slug}/dashboard`;
                    } else if (host.includes('localhost')) {
                        if (host.includes('.localhost')) {
                            rootDomain = host.substring(host.indexOf('.') + 1);
                        }
                        targetUrl = `${protocol}//${store.slug}.${rootDomain}/dashboard`;
                    } else {
                        const parts = host.split('.');
                        if (parts.length > 2) {
                            rootDomain = parts.slice(1).join('.');
                        }
                        targetUrl = `${protocol}//${store.slug}.${rootDomain}/dashboard`;
                    }

                    window.location.href = targetUrl;
                    return;
                }
            }

            setLoading(false);
        };

        fetchData();
    }, [router, supabase]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    const getSSOUrl = (slug: string) => {
        if (!session) return '#';

        const protocol = window.location.protocol;
        const host = window.location.host;
        let rootDomain = host;

        // Robust Vercel detection - simply check if we are on a vercel.app domain
        if (host.includes('.vercel.app')) {
            return `${protocol}//${host}/s/${slug}/dashboard`;
        }

        if (host.includes('.localhost')) {
            rootDomain = host.substring(host.indexOf('.') + 1);
        } else {
            const parts = host.split('.');
            if (parts.length > 2) {
                rootDomain = parts.slice(1).join('.');
            }
        }

        return `${protocol}//${slug}.${rootDomain}/dashboard`;
    };

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold">Welcome to Social Commerce Hub</h1>
                    <p className="text-muted-foreground text-lg">
                        Select a store to manage, or create a new one
                    </p>
                </div>

                {stores.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>No Stores Yet</CardTitle>
                            <CardDescription>
                                Get started by creating your first store
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button size="lg" asChild>
                                <Link href="/dashboard/new-store">
                                    <Plus className="w-5 h-5 mr-2" />
                                    Create Your First Store
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {stores.map((store) => {
                            const storeName = typeof store.name === 'string' ?
                                JSON.parse(store.name) : store.name;
                            const displayName = storeName?.en || storeName?.ar || 'Unnamed Store';

                            return (
                                <Card key={store.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                {store.logo_url ? (
                                                    <img
                                                        src={store.logo_url}
                                                        alt={displayName}
                                                        className="w-12 h-12 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Store className="w-6 h-6 text-primary" />
                                                    </div>
                                                )}
                                                <div>
                                                    <CardTitle>{displayName}</CardTitle>
                                                    <CardDescription className="text-xs">
                                                        {store.role === 'owner' ? 'Owner' : 'Team Member'}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${store.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {store.status}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2">
                                            <Button asChild className="flex-1">
                                                <a href={getSSOUrl(store.slug)}>
                                                    {language === 'ar' ? 'افتح لوحة التحكم' : 'Open Dashboard'}
                                                    <ArrowRight className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0" />
                                                </a>
                                            </Button>
                                            <Button variant="outline" asChild>
                                                <Link href={`/s/${store.slug}`} target="_blank">
                                                    {language === 'ar' ? 'عرض المتجر' : 'View Store'}
                                                </Link>
                                            </Button>
                                            {store.role === 'owner' && (
                                                <DeleteStoreDialog
                                                    storeId={store.id}
                                                    storeName={displayName}
                                                    onDeleted={() => {
                                                        setStores(prev => prev.filter(s => s.id !== store.id));
                                                        toast({
                                                            title: language === 'ar' ? 'تم حذف المتجر' : 'Store Deleted',
                                                            description: language === 'ar' ? 'تم حذف المتجر وجميع بياناته بنجاح' : 'The store and all its data have been deleted successfully.',
                                                        });
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {stores.length > 0 && (
                    <div className="text-center">
                        <Button variant="outline" size="lg" asChild>
                            <Link href="/dashboard/new-store">
                                <Plus className="w-5 h-5 mr-2" />
                                {language === 'ar' ? 'إنشاء متجر آخر' : 'Create Another Store'}
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

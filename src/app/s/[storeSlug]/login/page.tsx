"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, Store, ArrowRight, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function StoreLoginPage() {
    const { t, language } = useLanguage();
    const { signIn } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams(); // Use hook for params
    const storeSlug = params.storeSlug as string;

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [store, setStore] = useState<any>(null);
    const [initializing, setInitializing] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const form = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    useEffect(() => {
        if (!storeSlug) return;

        async function fetchStore() {
            try {
                const supabase = createClient();
                console.log('[StoreLogin] Fetching public info for:', storeSlug);

                // Use RPC to fetch store info (bypassing RLS for pending stores)
                const { data, error } = await supabase
                    .rpc('get_store_public_info', { p_slug: storeSlug })
                    .maybeSingle();

                console.log('[StoreLogin] RPC Result:', { data, error });

                if (error) throw error;
                if (!data) throw new Error('Store not found');

                setStore(data);
            } catch (err: any) {
                console.error('[StoreLogin] Error:', err);
                setFetchError(err.message || 'Failed to load store');
            } finally {
                setInitializing(false);
            }
        }

        fetchStore();
    }, [storeSlug, router]);

    if (fetchError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <Card className="w-full max-w-md border-red-200 bg-red-50">
                    <CardContent className="pt-6 text-center text-red-800">
                        <h2 className="text-lg font-bold mb-2">
                            {language === 'ar' ? 'خطأ في تحميل المتجر' : 'Error Loading Store'}
                        </h2>
                        <p>{fetchError}</p>
                        <p className="text-xs mt-4 text-gray-500 font-mono">Slug: {storeSlug}</p>
                        <Button
                            onClick={() => window.location.reload()}
                            variant="outline"
                            className="mt-4 border-red-200 hover:bg-red-100 text-red-800"
                        >
                            {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                        </Button>
                        <div className="mt-4 pt-4 border-t border-red-200/50">
                            <Link href="/" className="text-sm underline hover:text-red-900">
                                {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const onSubmit = async (data: LoginForm) => {
        setLoading(true);
        try {
            // 1. Sign in globally
            const { data: authData, error } = await signIn(data.email, data.password);

            if (error) {
                toast({
                    title: t.auth.login.error,
                    description: error.message,
                    variant: 'destructive',
                });
                return;
            }

            // 2. Verify Store Membership
            if (authData.user && store) {
                const supabase = createClient();

                // Check if owner
                const { data: storeOwner } = await supabase
                    .from('stores')
                    .select('id')
                    .eq('id', store.id)
                    .eq('owner_id', authData.user.id)
                    .single();

                // Check if team member
                const { data: teamMember } = await supabase
                    .from('team_members')
                    .select('id')
                    .eq('store_id', store.id)
                    .eq('user_id', authData.user.id)
                    .single();

                if (!storeOwner && !teamMember) {
                    // Valid user but not for this store
                    toast({
                        title: language === 'ar' ? 'غير مصرح' : 'Unauthorized',
                        description: language === 'ar'
                            ? 'ليس لديك صلاحية الوصول لهذا المتجر'
                            : 'You do not have access to this store.',
                        variant: 'destructive',
                    });

                    // Sign out because they shouldn't be here
                    await supabase.auth.signOut();
                    return;
                }

                // Success - Redirect to Store Dashboard on Main Domain
                toast({ title: t.auth.login.success });

                // Calculate main domain (remove subdomain)
                const hostname = window.location.hostname;
                const port = window.location.port;
                let mainDomain = hostname;

                if (hostname.endsWith('.localhost')) {
                    mainDomain = 'localhost';
                } else {
                    const parts = hostname.split('.');
                    if (parts.length > 2) {
                        mainDomain = parts.slice(1).join('.');
                    }
                }

                const protocol = window.location.protocol;
                const targetPath = store.status === 'pending_plan' ? '/select-plan' : '/dashboard';

                let targetUrl = '';

                if (mainDomain === 'localhost') {
                    // On localhost, we assume subdomains are same-app but different origin in browser eyes
                    // However, if we are ALREADY on ziad.localhost and want to go to /select-plan on ziad.localhost
                    // We should use router.push to avoid reload and cookie issues

                    if (window.location.hostname === `${store.slug}.localhost`) {
                        // Same subdomain - use client navigation
                        router.push(targetPath);
                        return;
                    }

                    targetUrl = `${protocol}//${store.slug}.localhost${port ? ':' + port : ''}${targetPath}`;
                } else if (hostname.endsWith('.vercel.app')) {
                    // Vercel Free Tier: Use path-based routing
                    // Navigate to /s/[slug]/dashboard
                    router.push(`/s/${store.slug}${targetPath}`);
                    return;
                } else {
                    if (hostname.startsWith(store.slug + '.')) {
                        // Already on the correct subdomain
                        router.push(targetPath);
                        return;
                    } else {
                        targetUrl = `${protocol}//${store.slug}.${mainDomain}${port ? ':' + port : ''}${targetPath}`;
                    }
                }

                // Force full navigation for cross-domain/subdomain changes
                window.location.href = targetUrl;
            }

        } catch (err) {
            console.error(err);
            toast({
                title: t.auth.login.error,
                description: language === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (initializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const storeName = store?.name?.[language] || store?.name?.ar || store?.name?.en || 'Store';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="w-full max-w-md space-y-8">
                {/* Store Branding */}
                <div className="text-center space-y-2">
                    {store?.logo_url ? (
                        <img
                            src={store.logo_url}
                            alt={storeName}
                            className="w-20 h-20 mx-auto rounded-xl object-cover shadow-sm"
                        />
                    ) : (
                        <div className="w-20 h-20 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                            <Store className="w-10 h-10 text-primary" />
                        </div>
                    )}
                    <h1 className="text-2xl font-bold text-gray-900">
                        {language === 'ar' ? `تسجيل الدخول لـ ${storeName}` : `Login to ${storeName}`}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {language === 'ar' ? 'أدخل بياناتك للمتابعة' : 'Enter your credentials to continue'}
                    </p>
                </div>

                <Card className="border-0 shadow-xl">
                    <CardContent className="pt-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t.auth.login.email}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder={t.auth.login.emailPlaceholder}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel>{t.auth.login.password}</FormLabel>
                                            </div>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? 'text' : 'password'}
                                                        placeholder={t.auth.login.passwordPlaceholder}
                                                        {...field}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t.auth.login.loading}
                                        </>
                                    ) : (
                                        t.auth.login.submit
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <div className="text-center">
                    <Link
                        href={`/s/${params.storeSlug}`}
                        className="text-sm text-gray-500 hover:text-primary flex items-center justify-center gap-1"
                    >
                        {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        {language === 'ar' ? 'العودة للمتجر' : 'Back to Store'}
                    </Link>
                </div>
            </div>
        </div>
    );
}

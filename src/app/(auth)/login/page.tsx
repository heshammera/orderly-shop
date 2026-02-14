"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginFormContent() {
    const { t, language } = useLanguage();
    // Using supabase independently to fetch store data, but signIn still comes from useAuth
    const supabase = createClient();
    const { signIn } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: LoginForm) => {
        setLoading(true);
        try {
            const { error, data: authData } = await signIn(data.email, data.password);
            if (error) {
                if (error.message.includes('Email not confirmed')) {
                    toast({
                        title: t.auth.login.error,
                        description: 'Please verify your email address.',
                        variant: 'destructive',
                    });
                    router.push(`/email-verify?email=${encodeURIComponent(data.email)}`);
                    return;
                }

                toast({
                    title: t.auth.login.error,
                    description: error.message,
                    variant: 'destructive',
                });
            } else {

                // --- EMAIL VERIFICATION CHECK ---
                if (authData.user && !authData.user.email_confirmed_at) {
                    await supabase.auth.signOut();
                    toast({
                        title: t.auth.login.error,
                        description: 'Please verify your email address before logging in.',
                        variant: 'destructive',
                    });
                    router.push(`/email-verify?email=${encodeURIComponent(data.email)}`);
                    return;
                }
                // -------------------------------

                // --- SUBDOMAIN ACCESS VALIDATION ---
                // If logging in from a subdomain, verify the user belongs to this store
                const hostname = window.location.hostname;
                let currentSubdomain = '';

                // Extract subdomain (same logic as elsewhere)
                if (hostname.includes('localhost')) {
                    if (hostname.includes('.localhost')) {
                        currentSubdomain = hostname.substring(0, hostname.indexOf('.'));
                    }
                } else {
                    const parts = hostname.split('.');
                    if (parts.length > 2) {
                        currentSubdomain = parts[0];
                    }
                }

                // Reserved subdomains to ignore
                const reservedSubdomains = ['www', 'app', 'api', 'admin', 'dashboard', 'assets'];

                if (currentSubdomain && !reservedSubdomains.includes(currentSubdomain)) {
                    // Check if store exists and user has access
                    try {
                        // 1. Get Store ID from slug
                        const { data: targetStore } = await supabase
                            .from('stores')
                            .select('id, owner_id')
                            .eq('slug', currentSubdomain)
                            .single();

                        if (targetStore) {
                            // 2. Check if user is owner
                            const isOwner = targetStore.owner_id === authData.user?.id;
                            let isMember = false;

                            // 3. If not owner, check membership
                            if (!isOwner && authData.user) {
                                const { data: member } = await supabase
                                    .from('store_members')
                                    .select('id')
                                    .eq('store_id', targetStore.id)
                                    .eq('user_id', authData.user.id)
                                    .maybeSingle(); // Use maybeSingle to avoid 406 error if not found

                                if (member) isMember = true;
                            }

                            if (!isOwner && !isMember) {
                                console.warn('User attempted to login to a store they do not access.');
                                await supabase.auth.signOut();
                                toast({
                                    title: t.auth.login.error,
                                    description: language === 'ar' ? 'ليس لديك صلاحية الوصول لهذا المتجر' : 'You do not have access to this store.',
                                    variant: 'destructive',
                                });
                                return; // Stop execution
                            }
                        }
                    } catch (err) {
                        console.error('Error validating store access:', err);
                        // Start safe: if we can't validate, maybe better to fail? 
                        // Or allow proceed if it was just a network glitch?
                        // For security, strict is better, but for UX, maybe loose.
                        // Let's assume if query failed (e.g. store doesn't exist), we let it proceed to dashboard 
                        // where it might redirect or show 404 naturally. 
                    }
                }
                // -----------------------------------

                toast({
                    title: t.auth.login.success,
                });

                // Fetch user's store to redirect to subdomain
                try {
                    const { data: store } = await supabase
                        .from('stores')
                        .select('slug')
                        .eq('owner_id', authData.user?.id) // Use authData from signIn
                        .single();

                    if (store && store.slug) {
                        // Determine root domain
                        // This logic assumes we are running on standard ports or domains setup
                        const protocol = window.location.protocol;
                        const host = window.location.host; // includes port if present

                        let rootDomain = host;

                        // Robust root domain detection:
                        // If we are on store.example.com, we want example.com
                        if (host.includes('localhost')) {
                            // Localhost logic: localhost:3000 or store.localhost:3000
                            if (host.includes('.localhost')) {
                                rootDomain = host.substring(host.indexOf('.') + 1);
                            } else {
                                rootDomain = host;
                            }
                        } else {
                            const parts = host.split('.');
                            // If more than 2 parts (e.g. store.domain.com), take everything after the first part
                            // unless it's an IP address (not perfectly handled here but unlikely for stores)
                            if (parts.length > 2) {
                                rootDomain = parts.slice(1).join('.');
                            }
                        }

                        // Construct Tenant URL
                        // Use /sso path to handle session setting
                        let tenantUrl = `${protocol}//${store.slug}.${rootDomain}/dashboard`;

                        // If we have session data, pass it via hash to the subdomain
                        // This allows the subdomain to set its own cookies (since we are now using strict host-only cookies)
                        if (authData.session) {
                            const { access_token, refresh_token } = authData.session;
                            tenantUrl = `${protocol}//${store.slug}.${rootDomain}/sso#access_token=${access_token}&refresh_token=${refresh_token}&type=recovery`;
                        }

                        console.log('Redirecting to tenant URL:', tenantUrl);
                        window.location.href = tenantUrl;
                        return; // Stop execution to prevent router.push below
                    }
                } catch (err) {
                    console.error('Error resolving store for redirect:', err);
                    // Fallback to default behavior if store lookup fails
                }

                const redirect = searchParams.get('redirect') || '/';
                router.push(redirect);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">{t.auth.login.title}</CardTitle>
                <CardDescription>{t.auth.login.subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
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
                                        <Link
                                            href="/forgot-password"
                                            className="text-sm font-medium text-primary hover:underline"
                                        >
                                            {t.auth.login.forgotPassword}
                                        </Link>
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
                <div className="mt-6 text-center text-sm">
                    <span className="text-muted-foreground">{t.auth.login.noAccount}</span>{' '}
                    <Link href="/signup" className="text-primary font-medium hover:underline">
                        {t.auth.login.signup}
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

export default function Login() {
    return (
        <AuthLayout>
            <Suspense fallback={<div>Loading...</div>}>
                <LoginFormContent />
            </Suspense>
        </AuthLayout>
    );
}

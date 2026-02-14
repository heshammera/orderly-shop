"use client";

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw, LogOut, Loader2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

function VerifyEmailContent() {
    const { t, language } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { signOut } = useAuth();
    const supabase = createClient();

    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const queryEmail = searchParams.get('email');

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                setUserEmail(user.email);
            } else if (queryEmail) {
                setUserEmail(queryEmail);
            }
        };
        checkUser();
    }, [queryEmail]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendCooldown > 0) {
            interval = setInterval(() => {
                setResendCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendCooldown]);

    const handleResend = async () => {
        if (loading || resendCooldown > 0) return;
        setLoading(true);

        try {
            // Check if we have a session to run the RPC limit check
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                // 1. Authenticated: Check Security Limit (RPC)
                const { data: limitCheck, error: limitError } = await supabase.rpc('check_resend_eligibility');

                if (limitError) throw limitError;

                if (!limitCheck.success) {
                    toast({
                        title: language === 'ar' ? 'تجاوزت الحد المسموح' : 'Limit Exceeded',
                        description: language === 'ar'
                            ? 'لقد استنفدت عدد محاولات إعادة الإرسال المسموحة لهذا اليوم (3 مرات). يرجى المحاولة غداً.'
                            : 'You have reached the max resend attempts for today (3 times). Please try again tomorrow.',
                        variant: 'destructive',
                    });
                    return;
                }
            } else {
                // Unauthenticated: We rely on Supabase internal rate limits here
                // Optionally show a different message or implicit strict limit
                console.log('Unauthenticated resend - bypassing RPC DB check');
            }

            // 2. Resend Email (Supabase Auth)
            if (userEmail) {
                const { error: resendError } = await supabase.auth.resend({
                    type: 'signup',
                    email: userEmail,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`
                    }
                });

                if (resendError) throw resendError;

                toast({
                    title: language === 'ar' ? 'تم الإرسال' : 'Email Sent',
                    description: language === 'ar'
                        ? `تم إرسال رابط التفعيل إلى ${userEmail}.`
                        : `Verification link sent to ${userEmail}.`,
                    className: 'bg-green-50 border-green-200 text-green-800'
                });

                setResendCooldown(60); // 60s cooldown between clicks
            }

        } catch (err: any) {
            console.error(err);
            toast({
                title: 'Error',
                description: err.message || 'Failed to resend email.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <Card className="w-full max-w-md shadow-lg border-0">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="w-8 h-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {language === 'ar' ? 'تفعيل البريد الإلكتروني' : 'Verify Your Email'}
                    </CardTitle>
                    <CardDescription className="text-base text-gray-600">
                        {language === 'ar'
                            ? 'لإكمال تسجيل حسابك والوصول إلى لوحة التحكم، يرجى تفعيل بريدك الإلكتروني.'
                            : 'To complete your registration and access the dashboard, please verify your email address.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3 rtl:space-x-reverse">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                            <p className="font-medium mb-1">
                                {language === 'ar' ? 'تنبيه هام' : 'Important'}
                            </p>
                            <p>
                                {language === 'ar'
                                    ? `لقد أرسلنا رابط التفعيل إلى ${userEmail}. إذا لم تجده في البريد الوارد، تحقق من مجلد الرسائل المزعجة (Spam).`
                                    : `We verify link sent to ${userEmail}. Check your spam folder if you don't see it.`}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button
                            className="w-full"
                            variant="default"
                            onClick={handleResend}
                            disabled={loading || resendCooldown > 0}
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <RefreshCw className={`w-4 h-4 mr-2 ${resendCooldown > 0 ? '' : ''}`} />
                            )}
                            {resendCooldown > 0
                                ? (language === 'ar' ? `انتظر ${resendCooldown} ثانية` : `Wait ${resendCooldown}s`)
                                : (language === 'ar' ? 'إعادة إرسال رابط التفعيل' : 'Resend Verification Link')}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground px-4">
                            {language === 'ar'
                                ? 'ملاحظة: يمكنك إعادة الإرسال بحد أقصى 3 مرات يومياً لأسباب أمنية.'
                                : 'Note: You can resend the link a maximum of 3 times per day for security reasons.'}
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center border-t p-4 bg-gray-50/50 rounded-b-xl">
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                        <LogOut className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}

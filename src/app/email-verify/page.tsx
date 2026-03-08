"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, RefreshCw, LogOut, Loader2, MessageSquare, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

type VerifyStep = 'choose' | 'otp' | 'success';
type VerifyMethod = 'whatsapp' | 'email';

function VerifyContent() {
    const { t, language } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { signOut } = useAuth();
    const supabase = createClient();

    const [step, setStep] = useState<VerifyStep>('choose');
    const [method, setMethod] = useState<VerifyMethod | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>('');
    const [userPhone, setUserPhone] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [expiresIn, setExpiresIn] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const queryPhone = searchParams.get('phone');
    const queryUid = searchParams.get('uid');
    const queryEmail = searchParams.get('email');

    // Get user info — read from URL params first (no session after signup), then fall back to session
    useEffect(() => {
        const checkUser = async () => {
            // Try URL params first (passed from signup page before session exists)
            if (queryUid) {
                setUserId(queryUid);
                if (queryEmail) setUserEmail(queryEmail);
            }

            // Also check session (for returning users / logged-in users)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                setUserEmail(user.email || null);
                setUserName(user.user_metadata?.full_name || '');
            } else if (!queryUid && queryEmail) {
                // If we don't have a session AND no queryUid, but we DO have an email in the URL 
                // This happens when login fails with "Email not confirmed" and redirects here.
                try {
                    const res = await fetch(`/api/auth/unverified-user?email=${encodeURIComponent(queryEmail)}`);
                    if (res.ok) {
                        const data = await res.json();
                        setUserId(data.userId);
                        setUserEmail(queryEmail);
                        if (data.phone) setUserPhone(data.phone);
                    }
                } catch (err) {
                    console.error("Failed to fetch unverified user details:", err);
                }
            }
        };
        checkUser();
    }, [queryUid, queryEmail]);

    useEffect(() => {
        if (queryPhone) setUserPhone(queryPhone);
    }, [queryPhone]);

    // Countdown timers
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendCooldown > 0) {
            interval = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [resendCooldown]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (expiresIn > 0) {
            interval = setInterval(() => setExpiresIn(prev => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [expiresIn]);

    const sendOtp = useCallback(async (selectedMethod: VerifyMethod) => {
        if (!userId) return;
        setLoading(true);

        const destination = selectedMethod === 'whatsapp' ? userPhone : userEmail;
        if (!destination) {
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: language === 'ar'
                    ? (selectedMethod === 'whatsapp' ? 'رقم الهاتف غير متوفر' : 'البريد الإلكتروني غير متوفر')
                    : (selectedMethod === 'whatsapp' ? 'Phone number not available' : 'Email not available'),
                variant: 'destructive',
            });
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    method: selectedMethod,
                    destination,
                    userName,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || data.error || 'Failed to send code');
            }

            setMethod(selectedMethod);
            setStep('otp');
            setOtp(['', '', '', '', '', '']);
            setExpiresIn(data.expiresIn || 300);
            setResendCooldown(60);

            toast({
                title: language === 'ar' ? 'تم الإرسال' : 'Code Sent',
                description: language === 'ar'
                    ? `تم إرسال كود التفعيل إلى ${selectedMethod === 'whatsapp' ? 'واتساب' : 'بريدك الإلكتروني'}`
                    : `Verification code sent to your ${selectedMethod === 'whatsapp' ? 'WhatsApp' : 'email'}`,
                className: 'bg-green-50 border-green-200 text-green-800'
            });

            // Focus first input
            setTimeout(() => inputRefs.current[0]?.focus(), 100);

        } catch (err: any) {
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [userId, userPhone, userEmail, userName, language, toast]);

    const verifyOtp = useCallback(async (code: string) => {
        if (!userId || code.length !== 6) return;
        setLoading(true);

        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, code }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || data.error || 'Verification failed');
            }

            setStep('success');

            // Redirect to login after successful verification
            setTimeout(() => {
                const redirect = searchParams.get('redirect');
                const verifyUrl = new URLSearchParams();
                verifyUrl.set('verified', 'true');
                if (userEmail) verifyUrl.set('email', userEmail);
                if (redirect) verifyUrl.set('redirect', redirect);

                router.push(`/login?${verifyUrl.toString()}`);
            }, 2500);

        } catch (err: any) {
            toast({
                title: language === 'ar' ? 'كود خاطئ' : 'Invalid Code',
                description: err.message,
                variant: 'destructive',
            });
            // Clear OTP inputs
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    }, [userId, searchParams, router, language, toast]);

    // OTP Input Handlers
    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        // Auto-advance
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits filled
        const fullCode = newOtp.join('');
        if (fullCode.length === 6 && newOtp.every(d => d !== '')) {
            verifyOtp(fullCode);
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            const newOtp = pasted.split('');
            setOtp(newOtp);
            inputRefs.current[5]?.focus();
            verifyOtp(pasted);
        }
    };

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden">

                {/* ===== STEP: CHOOSE METHOD ===== */}
                {step === 'choose' && (
                    <>
                        <CardHeader className="text-center space-y-4 bg-gradient-to-b from-primary/5 to-transparent pb-6">
                            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                                <ShieldCheck className="w-8 h-8 text-primary" />
                            </div>
                            <CardTitle className="text-2xl font-bold">
                                {language === 'ar' ? 'تفعيل الحساب' : 'Verify Your Account'}
                            </CardTitle>
                            <CardDescription className="text-base">
                                {language === 'ar'
                                    ? 'اختر طريقة التفعيل المفضلة لديك'
                                    : 'Choose your preferred verification method'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 px-6 pb-6">
                            {/* WhatsApp Option */}
                            {userPhone && (
                                <button
                                    onClick={() => sendOtp('whatsapp')}
                                    disabled={loading}
                                    className="w-full group relative overflow-hidden rounded-xl border-2 border-green-200 hover:border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 p-5 transition-all duration-300 text-start"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <MessageSquare className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-green-900 text-lg">
                                                {language === 'ar' ? 'واتساب' : 'WhatsApp'}
                                            </h3>
                                            <p className="text-sm text-green-700 truncate" dir="ltr">
                                                {userPhone}
                                            </p>
                                        </div>
                                        {loading && method === 'whatsapp' && (
                                            <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                                        )}
                                    </div>
                                </button>
                            )}

                            {/* Email Option */}
                            <button
                                onClick={() => sendOtp('email')}
                                disabled={loading}
                                className="w-full group relative overflow-hidden rounded-xl border-2 border-blue-200 hover:border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 p-5 transition-all duration-300 text-start"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <Mail className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-blue-900 text-lg">
                                            {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                                        </h3>
                                        <p className="text-sm text-blue-700 truncate">
                                            {userEmail || '...'}
                                        </p>
                                    </div>
                                    {loading && method === 'email' && (
                                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                    )}
                                </div>
                            </button>

                            {!userPhone && (
                                <p className="text-xs text-center text-muted-foreground bg-muted/50 rounded-lg p-3">
                                    {language === 'ar'
                                        ? '💡 لم يتم إدخال رقم هاتف أثناء التسجيل. يمكنك التفعيل عبر البريد الإلكتروني فقط.'
                                        : '💡 No phone number was provided during signup. You can verify via email only.'}
                                </p>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-center border-t p-4 bg-gray-50/50">
                            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                                <LogOut className="w-4 h-4 me-2" />
                                {language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                            </Button>
                        </CardFooter>
                    </>
                )}

                {/* ===== STEP: OTP INPUT ===== */}
                {step === 'otp' && (
                    <>
                        <CardHeader className="text-center space-y-4 pb-2">
                            <button
                                onClick={() => { setStep('choose'); setOtp(['', '', '', '', '', '']); }}
                                className="absolute top-4 start-4 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                            </button>
                            <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center ${method === 'whatsapp' ? 'bg-green-100' : 'bg-blue-100'
                                }`}>
                                {method === 'whatsapp'
                                    ? <MessageSquare className="w-7 h-7 text-green-600" />
                                    : <Mail className="w-7 h-7 text-blue-600" />
                                }
                            </div>
                            <CardTitle className="text-xl font-bold">
                                {language === 'ar' ? 'أدخل كود التفعيل' : 'Enter Verification Code'}
                            </CardTitle>
                            <CardDescription className="text-sm">
                                {language === 'ar'
                                    ? `تم إرسال كود مكون من 6 أرقام إلى ${method === 'whatsapp' ? 'واتساب' : 'بريدك الإلكتروني'}`
                                    : `A 6-digit code was sent to your ${method === 'whatsapp' ? 'WhatsApp' : 'email'}`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 px-6">
                            {/* OTP Input Grid */}
                            <div className="flex justify-center gap-2" dir="ltr">
                                {otp.map((digit, index) => (
                                    <Input
                                        key={index}
                                        ref={el => { inputRefs.current[index] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={e => handleOtpChange(index, e.target.value)}
                                        onKeyDown={e => handleOtpKeyDown(index, e)}
                                        onPaste={index === 0 ? handleOtpPaste : undefined}
                                        className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                        disabled={loading}
                                    />
                                ))}
                            </div>

                            {/* Timer */}
                            {expiresIn > 0 && (
                                <p className="text-center text-sm text-muted-foreground">
                                    {language === 'ar' ? `ينتهي الكود خلال` : `Code expires in`}{' '}
                                    <span className={`font-mono font-bold ${expiresIn <= 60 ? 'text-red-500' : 'text-foreground'}`}>
                                        {formatTime(expiresIn)}
                                    </span>
                                </p>
                            )}

                            {/* Verify Button */}
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={() => verifyOtp(otp.join(''))}
                                disabled={loading || otp.join('').length < 6}
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin me-2" />
                                ) : (
                                    <ShieldCheck className="w-5 h-5 me-2" />
                                )}
                                {language === 'ar' ? 'تفعيل الحساب' : 'Verify Account'}
                            </Button>

                            {/* Resend */}
                            <div className="text-center space-y-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => method && sendOtp(method)}
                                    disabled={loading || resendCooldown > 0}
                                    className="text-muted-foreground"
                                >
                                    <RefreshCw className={`w-4 h-4 me-2 ${loading ? 'animate-spin' : ''}`} />
                                    {resendCooldown > 0
                                        ? (language === 'ar' ? `إعادة الإرسال بعد ${resendCooldown}ث` : `Resend in ${resendCooldown}s`)
                                        : (language === 'ar' ? 'إعادة إرسال الكود' : 'Resend Code')}
                                </Button>
                            </div>
                        </CardContent>
                    </>
                )}

                {/* ===== STEP: SUCCESS ===== */}
                {step === 'success' && (
                    <CardContent className="py-16 px-6 text-center space-y-6">
                        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-green-800 mb-2">
                                {language === 'ar' ? 'تم تفعيل حسابك بنجاح! 🎉' : 'Account Verified! 🎉'}
                            </h2>
                            <p className="text-muted-foreground">
                                {language === 'ar'
                                    ? 'جاري تحويلك لصفحة تسجيل الدخول...'
                                    : 'Redirecting to login page...'}
                            </p>
                        </div>
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    </CardContent>
                )}
            </Card>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}

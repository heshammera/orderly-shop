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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, Store, User, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Schema for Step 1: User Details
const step1Schema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

// Schema for Step 2: Store Details
const step2Schema = z.object({
    storeName: z.string().min(3, "Store name must be at least 3 characters"),
    storeSlug: z.string()
        .min(3, "Store URL must be at least 3 characters")
        .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens are allowed"),
});

// Combined Schema
const signupSchema = step1Schema.and(step2Schema);

type SignupFormValues = z.infer<typeof signupSchema>;

function SignupFormContent() {
    const { t, language } = useLanguage();
    const { signUp } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    // eslint-disable-next-line
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Initialize form with combined schema, but we'll validate per step
    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        mode: "onChange",
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
            storeName: '',
            storeSlug: '',
        },
    });

    const { trigger, watch, setValue } = form;

    // Auto-generate slug from store name
    // eslint-disable-next-line
    const storeName = watch("storeName");
    const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setValue("storeName", name);
        if (step === 2) {
            // Simple slugify: lowercase, replace spaces/symbols with hyphens
            const slug = name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            setValue("storeSlug", slug, { shouldValidate: true });
        }
    };

    const handleNextStep = async () => {
        const fieldsToValidate = step === 1
            ? ['fullName', 'email', 'password', 'confirmPassword'] as const
            : ['storeName', 'storeSlug'] as const;

        // @ts-ignore
        const isStepValid = await trigger(fieldsToValidate); // Validate only current step fields

        if (isStepValid) {
            setStep(s => s + 1);
        }
    };

    const handlePrevStep = () => {
        setStep(s => s - 1);
    };

    const onSubmit = async (data: SignupFormValues) => {
        setLoading(true);
        try {
            const redirect = searchParams.get('redirect');

            // Pass store metadata to signUp
            const { error } = await signUp(
                data.email,
                data.password,
                data.fullName,
                redirect ? `${window.location.origin}${redirect}` : undefined,
                {
                    store_name: data.storeName,
                    store_slug: data.storeSlug
                }
            );

            if (error) {
                toast({
                    title: t.auth.signup.error,
                    description: error.message,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: t.auth.signup.success,
                    description: language === 'ar' ? 'تم إنشاء الحساب بنجاح. يرجى تفعيل البريد الإلكتروني.' : 'Account created. Please verify your email.',
                    className: 'bg-green-50 border-green-200 text-green-800'
                });

                // Redirect to Verify Email Page instead of login
                const redirectParam = searchParams.get('redirect');
                router.push(redirectParam ? `/email-verify?redirect=${encodeURIComponent(redirectParam)}` : '/email-verify');
            }
        } finally {
            setLoading(false);
        }
    };

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0
        })
    };

    return (
        <Card className="border-0 shadow-2xl w-full max-w-md mx-auto overflow-hidden">
            <CardHeader className="space-y-1 text-center pb-2">
                <div className="flex justify-center items-center gap-2 mb-4">
                    <div className={`h-2.5 flex-1 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                    <div className={`h-2.5 flex-1 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                </div>
                <CardTitle className="text-2xl font-bold">
                    {step === 1 ? t.auth.signup.title : (language === 'ar' ? 'بيانات المتجر' : 'Store Details')}
                </CardTitle>
                <CardDescription>
                    {step === 1 ? t.auth.signup.subtitle : (language === 'ar' ? 'قم بإعداد متجرك الجديد في ثوانٍ' : 'Setup your new store in seconds')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <AnimatePresence mode='wait' custom={step}>
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    custom={1}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                    className="space-y-4"
                                >
                                    <FormField
                                        control={form.control}
                                        name="fullName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t.auth.signup.fullName}</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
                                                        <Input className="pl-9 rtl:pr-9 rtl:pl-3" placeholder={t.auth.signup.fullNamePlaceholder} {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t.auth.signup.email}</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input className="pl-3 rtl:pr-3" type="email" placeholder={t.auth.signup.emailPlaceholder} {...field} />
                                                    </div>
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
                                                <FormLabel>{t.auth.signup.password}</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type={showPassword ? 'text' : 'password'}
                                                            placeholder={t.auth.signup.passwordPlaceholder}
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
                                    <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t.auth.signup.confirmPassword}</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type={showConfirmPassword ? 'text' : 'password'}
                                                            placeholder={t.auth.signup.confirmPasswordPlaceholder}
                                                            {...field}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                        >
                                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    custom={-1}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                    className="space-y-4"
                                >
                                    <FormField
                                        control={form.control}
                                        name="storeName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{language === 'ar' ? 'اسم المتجر' : 'Store Name'}</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Store className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
                                                        <Input
                                                            className="pl-9 rtl:pr-9 rtl:pl-3"
                                                            placeholder={language === 'ar' ? 'مثال: متجر الأناقة' : 'Ex: Elegance Store'}
                                                            {...field}
                                                            onChange={handleStoreNameChange}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormDescription>{language === 'ar' ? 'اسم متجرك الذي سيظهر للعملاء' : 'Your store name visible to customers'}</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="storeSlug"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{language === 'ar' ? 'رابط المتجر' : 'Store URL'}</FormLabel>
                                                <FormControl>
                                                    <div className="flex items-center">
                                                        <span className="text-sm text-muted-foreground bg-muted p-2.5 rounded-s-md border border-e-0">
                                                            /
                                                        </span>
                                                        <Input
                                                            className="rounded-s-none"
                                                            placeholder="my-store"
                                                            {...field}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormDescription>
                                                    {language === 'ar' ? 'يجب أن يكون بالإنجليزية، بدون مسافات (استخدم -)' : 'Must be in English, no spaces (use -)'}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex gap-3 pt-4">
                            {step > 1 && (
                                <Button type="button" variant="outline" onClick={handlePrevStep} disabled={loading} className="flex-1">
                                    <ArrowLeft className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                                    {language === 'ar' ? 'السابق' : 'Back'}
                                </Button>
                            )}

                            {step < 2 ? (
                                <Button type="button" onClick={handleNextStep} className="flex-1">
                                    {language === 'ar' ? 'التالي' : 'Next'}
                                    <ArrowRight className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0" />
                                </Button>
                            ) : (
                                <Button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2 rtl:ml-2 rtl:mr-0" />
                                            {t.auth.signup.loading}
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                                            {t.auth.signup.submit}
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>
                <div className="mt-6 text-center text-sm">
                    <span className="text-muted-foreground">{t.auth.signup.hasAccount}</span>{' '}
                    <Link href="/login" className="text-primary font-medium hover:underline">
                        {t.auth.signup.login}
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

export default function Signup() {
    return (
        <AuthLayout>
            <Suspense fallback={<div>Loading...</div>}>
                <SignupFormContent />
            </Suspense>
        </AuthLayout>
    );
}

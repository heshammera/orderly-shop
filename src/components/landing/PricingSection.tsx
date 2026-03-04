"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Check, Loader2, Sparkles, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/lib/motion';

export function PricingSection() {
    const { t, language, dir } = useLanguage() as any;
    const [plans, setPlans] = useState<any[]>([]);
    const [featuresDict, setFeaturesDict] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showJoinDialog, setShowJoinDialog] = useState(false);
    const [isYearly, setIsYearly] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const handleConfirmSignup = () => {
        router.push('/signup');
    };

    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
    const rtl = dir === 'rtl';

    useEffect(() => {
        async function fetchPlans() {
            try {
                const { data: plansData, error: plansError } = await supabase
                    .from('plans')
                    .select('*')
                    .eq('is_active', true)
                    .order('price_monthly', { ascending: true });

                if (plansError) throw plansError;

                const { data: dictData } = await supabase.from('plan_features').select('*').order('group').order('id');
                setFeaturesDict(dictData || []);

                const { data: valuesData } = await supabase.from('plan_feature_values').select('*');

                const formattedPlans = plansData?.map(plan => {
                    const planValues = valuesData?.filter(v => v.plan_id === plan.id) || [];
                    const feature_values = planValues.reduce((acc, curr) => {
                        acc[curr.feature_id] = curr.value;
                        return acc;
                    }, {} as Record<string, string>);
                    return { ...plan, feature_values };
                }) || [];

                setPlans(formattedPlans);
            } catch (e) {
                console.error('Error fetching plans:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchPlans();
    }, [supabase]);

    if (loading) {
        return (
            <div className="py-32 flex justify-center items-center mix-blend-multiply opacity-50">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <section id="pricing" className="py-24 relative overflow-hidden bg-muted/10">

            {/* Background elements */}
            <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent -z-10 pointer-events-none"></div>

            <div className="container mx-auto px-4 max-w-7xl">

                {/* Header */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeInUp}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-foreground">
                        {t.pricing.title}
                    </h2>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        {t.pricing.subtitle}
                    </p>

                    {/* Toggle Monthly/Yearly (Visual Only if API doesn't have yearly pricing yet) */}
                    <div className="mt-10 inline-flex items-center gap-4 bg-card border border-border/50 p-2 rounded-full shadow-sm">
                        <button
                            onClick={() => setIsYearly(false)}
                            className={cn("px-6 py-2 rounded-full font-medium transition-colors", !isYearly ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground")}
                        >
                            {t.pricing.monthly}
                        </button>
                        <button
                            onClick={() => setIsYearly(true)}
                            className={cn("px-6 py-2 rounded-full font-medium transition-colors", isYearly ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground")}
                        >
                            <div className="flex items-center gap-2">
                                <span>{t.pricing.yearly}</span>
                                <span className="bg-success text-success-foreground text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap hidden sm:inline-block">
                                    {language === 'ar' ? 'وفر 20%' : 'Save 20%'}
                                </span>
                            </div>
                        </button>
                    </div>
                </motion.div>

                {/* Pricing Cards */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-center items-end"
                >
                    {plans.map((plan, index) => {
                        const isPopular = plan.slug === 'pro' || plan.slug === 'starter';

                        // Calculate yearly price if toggled (fallback to 20% off monthly if no API field)
                        let displayPrice = plan.price_monthly;
                        let originalPrice: number | null = null;
                        if (isYearly && plan.price_monthly > 0) {
                            const yearlyMonthly = Math.floor(plan.price_monthly * 0.8 * 12);
                            displayPrice = yearlyMonthly;
                            originalPrice = plan.price_monthly * 12;
                        }

                        return (
                            <motion.div
                                key={plan.id}
                                variants={fadeInUp}
                                className={cn(
                                    'relative bg-card rounded-3xl p-8 border transition-all duration-300 flex flex-col h-full',
                                    isPopular
                                        ? 'border-primary shadow-glow md:-translate-y-4 z-10'
                                        : 'border-border/50 hover:border-primary/30 shadow-soft'
                                )}
                            >
                                {/* Popular badge */}
                                {isPopular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <span className="bg-gradient-to-r from-primary to-accent text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 uppercase tracking-wider shadow-md">
                                            <Sparkles className="h-3.5 w-3.5" />
                                            {t.pricing.popular}
                                        </span>
                                    </div>
                                )}

                                {/* Plan header */}
                                <div className="mb-8">
                                    <h3 className={cn("text-2xl font-bold mb-3", isPopular ? "text-primary" : "text-foreground")}>
                                        {language === 'ar' ? plan.name_ar : plan.name_en}
                                    </h3>
                                    <p className="text-muted-foreground text-sm min-h-[40px] leading-relaxed">
                                        {language === 'ar' ? plan.description_ar : plan.description_en}
                                    </p>

                                    <div className="mt-6">
                                        {plan.price_monthly === 0 ? (
                                            <span className="text-5xl font-extrabold text-foreground">{t.pricing.free}</span>
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                {isYearly && (
                                                    <span className="text-muted-foreground line-through text-sm decoration-destructive/50">
                                                        ${originalPrice}/{t.pricing.yearly}
                                                    </span>
                                                )}
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-5xl font-extrabold text-foreground">${displayPrice}</span>
                                                    <span className="text-muted-foreground font-medium">/{isYearly ? t.pricing.yearly : t.pricing.monthly}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Features */}
                                <ul className="space-y-4 mb-8 flex-1">
                                    {featuresDict.map((feature: any) => {
                                        const value = plan.feature_values?.[feature.id];
                                        let isAvailable = false;
                                        let displayValue = '';

                                        if (feature.type === 'boolean') {
                                            isAvailable = value === 'true';
                                        } else if (feature.type === 'integer') {
                                            isAvailable = value && parseInt(value) > 0 || value === '-1';
                                            if (value === '-1') displayValue = language === 'ar' ? 'غير محدود' : 'Unlimited';
                                            else displayValue = value || '0';
                                        } else {
                                            isAvailable = !!value && value !== 'none' && value !== '';
                                            displayValue = value;
                                        }

                                        return (
                                            <li key={feature.id} className="flex items-start gap-3">
                                                <div className={cn("mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0", isAvailable ? 'bg-primary/10' : 'bg-muted/50')}>
                                                    {isAvailable ? <Check className="h-3.5 w-3.5 text-primary" /> : <X className="h-3.5 w-3.5 text-muted-foreground" />}
                                                </div>
                                                <span className={cn("text-sm leading-relaxed", isAvailable ? 'text-foreground font-medium' : 'text-muted-foreground line-through opacity-70')}>
                                                    {language === 'ar' ? feature.name_ar : feature.name_en} {displayValue && isAvailable && <span className="font-bold text-primary ml-1">({displayValue})</span>}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>

                                {/* CTA */}
                                <Button
                                    onClick={() => setShowJoinDialog(true)}
                                    size="lg"
                                    className={cn(
                                        'w-full py-6 text-lg font-bold transition-all shadow-none group',
                                        isPopular
                                            ? 'gradient-primary text-white hover:scale-[1.02] shadow-primary/25 shadow-xl'
                                            : 'bg-muted text-foreground hover:bg-primary hover:text-primary-foreground'
                                    )}
                                >
                                    {t.pricing.cta}
                                    <ArrowIcon className={cn("inline-block w-5 h-5 ml-2 transition-transform", rtl ? "mr-2 ml-0 group-hover:-translate-x-1" : "group-hover:translate-x-1")} />
                                </Button>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>

            {/* Enrollment Join Dialog (Kept same logic and expanded design) */}
            <AlertDialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
                <AlertDialogContent dir={dir} className="max-w-md rounded-2xl">
                    <AlertDialogHeader>
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto sm:mx-0">
                            <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black">
                            {language === 'ar' ? 'ابدأ رحلتك معنا اليوم!' : 'Start Your Journey with Us Today!'}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base space-y-4 text-foreground/90 py-2">
                            <p className="leading-relaxed">
                                {language === 'ar'
                                    ? 'يسعدنا اختيارك لنا. يمكنك اختيار باقتك المفضلة وتفعيلها فور إتمام عملية التسجيل في لوحة التحكم.'
                                    : 'We are glad you chose us. You can select and activate your preferred plan immediately after completing the registration.'}
                            </p>
                            <div className="p-4 bg-muted/50 rounded-xl border border-border mt-4 relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                                <p className="font-bold text-foreground mb-1">
                                    {language === 'ar' ? '💡 الدفع بالعملة المحلية' : '💡 Local Currency Payment'}
                                </p>
                                <p className="text-sm">
                                    {language === 'ar'
                                        ? 'الدفع يتم بسهولة عبر المحافظ الإلكترونية والمحلية وسنقوم بالتحويل بناءً على سعر الصرف الحالي.'
                                        : 'Payment is easily done via local electronic wallets and we will handle the conversion based on current rates.'}
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-6">
                        <AlertDialogCancel className="w-full sm:w-auto rounded-xl">
                            {language === 'ar' ? 'ربما لاحقاً' : 'Maybe Later'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmSignup}
                            className="w-full sm:w-auto gradient-primary rounded-xl"
                        >
                            {language === 'ar' ? 'سجل الآن مجاناً' : 'Sign Up Free'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
}

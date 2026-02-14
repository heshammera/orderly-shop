"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Check, Loader2, Sparkles } from 'lucide-react';
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

export function Pricing() {
  const { t, language } = useLanguage() as any;
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchPlans() {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('price_monthly', { ascending: true });

        if (error) throw error;
        setPlans(data || []);
      } catch (e) {
        console.error('Error fetching plans:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, [supabase]);

  const handleEnrollClick = () => {
    setShowJoinDialog(true);
  };

  const handleConfirmSignup = () => {
    router.push('/auth?signup=true');
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.pricing.title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto italic">
            {t.pricing.subtitle}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            // Logic for popular badge (usually the second or third plan)
            const isPopular = plan.slug === 'pro' || plan.slug === 'starter';
            const displayFeatures = plan.display_features?.[language] || [];

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative bg-card rounded-2xl p-8 border transition-all duration-300 animate-fade-in-up flex flex-col',
                  isPopular
                    ? 'border-primary shadow-2xl scale-105 z-10'
                    : 'border-border hover:border-primary/30'
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-4 start-1/2 -translate-x-1/2 rtl:translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider">
                      <Sparkles className="h-3 w-3" />
                      {t.pricing.popular}
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{language === 'ar' ? plan.name_ar : plan.name_en}</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2 min-h-[40px]">
                    {language === 'ar' ? plan.description_ar : plan.description_en}
                  </p>
                  <div className="flex items-baseline justify-center gap-1">
                    {plan.price_monthly === 0 ? (
                      <span className="text-4xl font-extrabold">{t.pricing.free}</span>
                    ) : (
                      <>
                        <span className="text-4xl font-extrabold">${plan.price_monthly}</span>
                        <span className="text-muted-foreground">/{t.pricing.monthly}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8 flex-1">
                  {displayFeatures.map((feature: string, featureIndex: number) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm leading-tight text-foreground/80">{feature}</span>
                    </li>
                  ))}
                  {/* Basic Limits (if not explicitly in display features) */}
                  {!displayFeatures.length && (
                    <>
                      <li className="flex items-start gap-3">
                        <div className="mt-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm leading-tight text-foreground/80">
                          {plan.limits?.products === -1 ? t.pricing.unlimitedProducts : `${plan.limits?.products} ${t.pricing.products}`}
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm leading-tight text-foreground/80">
                          {plan.limits?.stores_limit || 1} {t.pricing.stores}
                        </span>
                      </li>
                    </>
                  )}
                </ul>

                {/* CTA */}
                <Button
                  onClick={handleEnrollClick}
                  className={cn(
                    'w-full py-6 text-base font-bold transition-all',
                    isPopular
                      ? 'gradient-primary hover:opacity-90 shadow-lg'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                >
                  {t.pricing.cta}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enrollment Join Dialog */}
      <AlertDialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <AlertDialogContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold">
              {language === 'ar' ? 'ابدأ رحلتك معنا اليوم!' : 'Start Your Journey with Us Today!'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base space-y-4 text-foreground/90 py-2">
              <p>
                {language === 'ar'
                  ? 'يسعدنا اختيارك لنا. يرجى العلم أنه يمكنك اختيار باقتك المفضلة وتفعيلها فور إتمام عملية التسجيل في لوحة التحكم.'
                  : 'We are glad you chose us. Please note that you can select and activate your preferred plan immediately after completing the registration in the dashboard.'}
              </p>
              <div className="p-4 bg-muted/50 rounded-lg border border-primary/20">
                <p className="font-semibold text-primary mb-1">
                  {language === 'ar' ? '💡 معلومة هامة:' : '💡 Important Note:'}
                </p>
                <p>
                  {language === 'ar'
                    ? 'الدفع يتم بسهولة عبر المحافظ الإلكترونية (فودافون كاش، إلخ). يمكنك الدفع بالعملة المحلية وسنقوم بالتحويل بناءً على سعر الصرف الحالي.'
                    : 'Payment is easily done via electronic wallets (Vodafone Cash, etc.). You can pay in EGP, and we will handle the conversion based on the current exchange rate.'}
                </p>
              </div>
              <p className="font-medium text-center pt-2">
                {language === 'ar' ? 'هل تود البدء في إنشاء حسابك الآن؟' : 'Would you like to start creating your account now?'}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              {language === 'ar' ? 'ربما لاحقاً' : 'Maybe Later'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSignup}
              className="w-full sm:w-auto gradient-primary"
            >
              {language === 'ar' ? 'سجل الآن' : 'Sign Up Now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

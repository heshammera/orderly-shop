"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DowngradeConflictModal from '@/components/subscription/DowngradeConflictModal';

export default function SelectPlanPage() {
    const { t, language } = useLanguage();
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<any | null>(null); // For modal
    const [activeWallets, setActiveWallets] = useState<any[]>([]);

    // Payment Form State
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [transactionId, setTransactionId] = useState('');
    const [openPaymentModal, setOpenPaymentModal] = useState(false);

    const [exchangeRate, setExchangeRate] = useState(50);

    const [conflictData, setConflictData] = useState<any | null>(null);
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [pendingPlan, setPendingPlan] = useState<any | null>(null);
    const [keepStoreIds, setKeepStoreIds] = useState<string[] | null>(null);

    useEffect(() => {
        const fetchPlansAndStore = async () => {
            try {
                // Get Current User
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                // Get Pending/Unpaid Store
                const { data: store } = await supabase
                    .from('stores')
                    .select('id, status')
                    .eq('owner_id', user.id)
                    .single();

                if (store) {
                    setStoreId(store.id);
                    // Only redirect if the store is already active
                    if (store.status === 'active') {
                        router.push('/dashboard');
                        return;
                    }

                    // Fetch Effective Plan (Account Level)
                    const { data: subData } = await supabase.rpc('get_store_effective_plan', { p_store_id: store.id });

                    if (subData && subData.has_plan) {
                        setCurrentPlanId(subData.plan.id);
                    }
                }

                // Fetch Plans
                const { data: plansData } = await supabase
                    .from('plans')
                    .select('*')
                    .eq('is_active', true)
                    .order('price_monthly', { ascending: true });

                setPlans(plansData || []);

                // Fetch Exchange Rate
                const { data: rateData } = await supabase.rpc('get_setting', { setting_key: 'exchange_rate_usd_egp' });
                if (rateData && rateData.rate) {
                    setExchangeRate(rateData.rate);
                }

                // Fetch Wallet Settings
                const { data: settingsData } = await supabase.rpc('get_setting', { setting_key: 'payment_wallets' });
                if (settingsData && settingsData.wallets) {
                    const active = settingsData.wallets.filter((w: any) => w.active);
                    if (active.length > 0) setActiveWallets(active);
                }

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlansAndStore();
    }, [router, supabase]);



    const checkDowngradeAndProceed = async (plan: any) => {
        if (!storeId) return;
        setSubmitting(true);
        try {
            const { data: impact, error } = await supabase.rpc('check_plan_downgrade_impact', {
                p_store_id: storeId,
                p_new_plan_id: plan.id
            });

            if (error) throw error;

            if (impact?.status === 'conflict') {
                setConflictData(impact.conflicts);
                setPendingPlan(plan);
                setShowConflictModal(true);
                setSubmitting(false); // Stop loader, wait for modal
                return;
            }

            // No conflict
            proceedWithPlan(plan, null);
        } catch (err: any) {
            console.error(err);
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
            setSubmitting(false);
        }
    };

    const handleConflictConfirm = (ids: string[]) => {
        setKeepStoreIds(ids);
        setShowConflictModal(false);
        if (pendingPlan) {
            proceedWithPlan(pendingPlan, ids);
        }
    };

    const proceedWithPlan = (plan: any, keepIds: string[] | null) => {
        if (plan.price_monthly === 0) {
            submitFreePlan(plan, keepIds);
        } else {
            setSelectedPlan(plan);
            setKeepStoreIds(keepIds); // Store for payment submission
            setOpenPaymentModal(true);
            setSubmitting(false);
        }
    };

    const submitFreePlan = async (plan: any, keepIds: string[] | null) => {
        setSubmitting(true);
        try {
            const { error } = await supabase.rpc('submit_subscription_request', {
                p_store_id: storeId,
                p_plan_id: plan.id,
                p_payment_method: 'free',
                p_amount: 0,
                p_receipt_url: null,
                p_transaction_id: null,
                p_keep_store_ids: keepIds
            });

            if (error) throw error;

            toast({
                title: language === 'ar' ? 'تم الاشتراك بنجاح' : 'Subscribed Successfully',
                description: language === 'ar' ? 'تم تفعيل باقتك المجانية. يرجى تسجيل الدخول الآن للبدء.' : 'Your free plan is now active. Please log in to start.',
                className: 'bg-green-50 border-green-200 text-green-800'
            });

            // Sign out the pseudo-session used for setup and force a fresh login
            await supabase.auth.signOut();
            router.push('/login');
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSelectPlan = (plan: any) => {
        checkDowngradeAndProceed(plan);
    };

    const handleSubmitPayment = async () => {
        if (!storeId || !selectedPlan || !receiptFile) return;

        setSubmitting(true);
        try {
            // 1. Upload Receipt
            const fileExt = receiptFile.name.split('.').pop();
            const fileName = `${storeId}/${Date.now()}.${fileExt}`;
            const { error: uploadError, data: uploadData } = await supabase.storage
                .from('payment_receipts')
                .upload(fileName, receiptFile);

            if (uploadError) throw uploadError;

            // Calculate amount in EGP for the record (though table usually tracks original USD or converted amount)
            // Based on earlier submit_subscription_request analysis, it takes p_amount.
            const totalEgp = selectedPlan.price_monthly * exchangeRate;

            // 2. Submit Request
            const { error: rpcError } = await supabase.rpc('submit_subscription_request', {
                p_store_id: storeId,
                p_plan_id: selectedPlan.id,
                p_payment_method: 'wallet',
                p_amount: totalEgp, // We submit the EGP amount as requester pays in EGP
                p_receipt_url: uploadData.path,
                p_transaction_id: transactionId
            });

            if (rpcError) throw rpcError;

            // Success
            setOpenPaymentModal(false);
            router.push('/subscription-success');

            toast({
                title: language === 'ar' ? 'تم إرسال الطلب' : 'Request Submitted',
                description: language === 'ar' ? 'سيتم مراجعة طلبك وتفعيله قريباً.' : 'Your request is under review.',
                className: 'bg-blue-50 border-blue-200 text-blue-800'
            });

        } catch (err: any) {
            console.error(err);
            toast({
                title: 'Error',
                description: err.message,
                variant: 'destructive'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                        {language === 'ar' ? 'اختر باقتك المناسبة' : 'Choose Your Plan'}
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        {language === 'ar'
                            ? 'سواء كنت تبدأ صغيراً أو تنمو بسرعة، لدينا خطة تناسب احتياجاتك.'
                            : 'Whether you are just starting out or scaling fast, we have a plan for you.'}
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {plans.map((plan) => {
                        const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
                        const isFree = plan.price === 0;
                        const isCurrent = currentPlanId === plan.id;

                        return (
                            <Card key={plan.id} className={`flex flex-col relative transition-all duration-300 ${isCurrent ? 'ring-2 ring-primary border-primary' : (selectedPlan?.id === plan.id ? 'ring-2 ring-blue-400' : '')}`}>
                                {isCurrent && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-md z-10">
                                        {language === 'ar' ? 'باقتك الحالية' : 'Current Plan'}
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle className="text-2xl">{language === 'ar' ? plan.name_ar : plan.name_en}</CardTitle>
                                    <CardDescription>
                                        {language === 'ar' ? plan.description_ar : plan.description_en}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-6">
                                    <div className="flex items-baseline">
                                        <span className="text-4xl font-extrabold tracking-tight">
                                            {plan.price}
                                        </span>
                                        <span className="text-muted-foreground ml-1 mr-1">
                                            {language === 'ar' ? 'ج.م' : 'EGP'} / {language === 'ar' ? (plan.interval === 'monthly' ? 'شهر' : 'سنة') : plan.interval}
                                        </span>
                                    </div>

                                    <ul className="space-y-3">
                                        <li className="flex items-center text-sm">
                                            <Check className="h-4 w-4 text-green-500 mr-2 ml-2" />
                                            <span>
                                                {features.products_limit === -1
                                                    ? (language === 'ar' ? 'منتجات غير محدودة' : 'Unlimited Products')
                                                    : (language === 'ar' ? `${features.products_limit} منتج` : `${features.products_limit} Products`)}
                                            </span>
                                        </li>
                                        <li className="flex items-center text-sm">
                                            <Check className="h-4 w-4 text-green-500 mr-2 ml-2" />
                                            <span>
                                                {features.stores_limit} {language === 'ar' ? 'متجر' : 'Store(s)'}
                                            </span>
                                        </li>
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className="w-full"
                                        variant={isCurrent ? "default" : (isFree ? "outline" : "default")}
                                        onClick={() => handleSelectPlan(plan)}
                                        disabled={submitting}
                                    >
                                        {submitting && (selectedPlan?.id === plan.id || (isFree && !selectedPlan))
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : (isCurrent
                                                ? (language === 'ar' ? 'تجديد الباقة الحالية' : 'Renew Current Plan')
                                                : (language === 'ar' ? (isFree ? 'ابدأ مجاناً' : 'اشترك الآن') : (isFree ? 'Start Free' : 'Subscribe Now'))
                                            )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Payment Modal */}
            <Dialog open={openPaymentModal} onOpenChange={setOpenPaymentModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{language === 'ar' ? 'تأكيد الاشتراك والدفع' : 'Confirm Subscription & Payment'}</DialogTitle>
                        <DialogDescription>
                            {language === 'ar'
                                ? `أنت على وشك الاشتراك في باقة ${selectedPlan?.name_ar}. يرجى تحويل مبلغ ${selectedPlan?.price} ج.م وإرفاق الإيصال.`
                                : `You are subscribing to ${selectedPlan?.name_en}. Please transfer ${selectedPlan?.price} EGP and upload the receipt.`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
                            <p className="font-semibold">{language === 'ar' ? 'بيانات المحفظة الإلكترونية:' : 'Electronic Wallet Details:'}</p>
                            {activeWallets.length > 0 ? (
                                <>
                                    <div className="space-y-2 py-2">
                                        {activeWallets.map((wallet: any, index: number) => (
                                            <p key={index} className="text-xl font-bold font-mono text-primary" dir="ltr">{wallet.number}</p>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {language === 'ar'
                                            ? 'يرجى تحويل المبلغ الموضح أعلاه إلى أحد هذه الأرقام'
                                            : 'Please transfer the amount above to one of these numbers'}
                                    </p>
                                </>
                            ) : (
                                <p className="text-red-500">
                                    {language === 'ar' ? 'لا يوجد محفظة نشطة حالياً' : 'No active wallet configured'}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>{language === 'ar' ? 'رقم الهاتف المحول منه (أو رقم العملية)' : 'Sender Phone / Transaction ID'}</Label>
                            <Input
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                placeholder={language === 'ar' ? 'مثال: 010xxxxxxx' : 'e.g. 010xxxxxxx'}
                                dir="ltr"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{language === 'ar' ? 'صورة الإيصال (مطلوب)' : 'Receipt Image (Required)'}</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenPaymentModal(false)}>
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button onClick={handleSubmitPayment} disabled={submitting || !receiptFile}>
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'ar' ? 'إرسال الطلب' : 'Submit Request')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DowngradeConflictModal
                isOpen={showConflictModal}
                onClose={() => setShowConflictModal(false)}
                onConfirm={handleConflictConfirm}
                conflict={conflictData}
            />
        </div>
    );
}

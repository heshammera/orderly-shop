'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    CheckCircle2, 
    CreditCard, 
    Loader2, 
    AlertCircle, 
    ArrowUpCircle, 
    Clock, 
    X,
    Upload,
    ImageIcon,
    Sparkles
} from 'lucide-react';
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface BillingTabProps {
    storeId: string;
}

interface Plan {
    id: string;
    name_ar: string;
    name_en: string;
    price_monthly: number;
    slug: string;
    features: any;
}

interface AddOn {
    id: string;
    feature_id: string;
    name_ar: string;
    name_en: string;
    price: number;
    description_ar: string;
    description_en: string;
}

interface UpgradeRequest {
    id: string;
    plan_id: string | null;
    add_on_id: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    plan?: {
        name_ar: string;
        name_en: string;
    } | null;
    add_on?: {
        name_ar: string;
        name_en: string;
    } | null;
}

export function BillingTab({ storeId }: BillingTabProps) {
    const { language } = useLanguage();
    const supabase = createClient();
    const { subscription, planName, isLoading: subLoading } = useSubscription(storeId);
    
    const [plans, setPlans] = useState<Plan[]>([]);
    const [pendingRequest, setPendingRequest] = useState<UpgradeRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
    const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
    const [ownedAddOns, setOwnedAddOns] = useState<string[]>([]); // Array of add_on_ids
    const [exchangeRate, setExchangeRate] = useState<number>(50); // Default fallback
    const [storeCurrency, setStoreCurrency] = useState<string>('EGP');
    
    // Form State
    const [paymentMethod, setPaymentMethod] = useState('instapay');
    const [transactionId, setTransactionId] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchBillingData();
    }, [storeId]);

    const fetchBillingData = async () => {
        setLoading(true);
        try {
            // 1. Fetch available plans
            const { data: plansData } = await supabase
                .from('plans')
                .select('*')
                .order('price_monthly', { ascending: true });
            
            if (plansData) setPlans(plansData);

            // 2. Check for pending requests
            const { data: requestsData } = await supabase
                .from('subscription_requests')
                .select('*, plan:plans(name_ar, name_en), add_on:add_ons(name_ar, name_en)')
                .eq('store_id', storeId)
                .eq('status', 'pending')
                .maybeSingle();
            
            if (requestsData) setPendingRequest(requestsData as any);

            // 3. Fetch available add-ons
            const { data: addOnsData } = await supabase
                .from('add_ons')
                .select('*')
                .eq('is_active', true);
            if (addOnsData) setAvailableAddOns(addOnsData);

            // 4. Fetch owned add-ons
            const { data: ownedData } = await supabase
                .from('store_add_ons')
                .select('add_on_id')
                .eq('store_id', storeId)
                .eq('status', 'active');
            if (ownedData) setOwnedAddOns(ownedData.map(o => o.add_on_id));

            // 5. Fetch Store Currency & Dynamic Exchange Rate
            const { data: storeData } = await supabase
                .from('stores')
                .select('currency')
                .eq('id', storeId)
                .maybeSingle();
            
            const currency = storeData?.currency || 'EGP';
            setStoreCurrency(currency);

            // Fetch dynamic exchange rate for this specific currency
            // Key format: exchange_rate_usd_sar, exchange_rate_usd_egp, etc.
            const rateKey = `exchange_rate_usd_${currency.toLowerCase()}`;
            const { data: rateData } = await supabase.rpc('get_setting', { setting_key: rateKey });
            
            if (rateData && rateData.rate) {
                setExchangeRate(rateData.rate);
            } else {
                // Fallback to EGP rate if specific currency rate is missing
                const { data: fallbackData } = await supabase.rpc('get_setting', { setting_key: 'exchange_rate_usd_egp' });
                if (fallbackData && fallbackData.rate) {
                    setExchangeRate(fallbackData.rate);
                }
            }
        } catch (error) {
            console.error('Error fetching billing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgradeClick = (plan: Plan) => {
        setSelectedPlan(plan);
        setSelectedAddOn(null);
        setShowUpgradeDialog(true);
    };

    const handleAddOnClick = (addon: AddOn) => {
        setSelectedAddOn(addon);
        setSelectedPlan(null);
        setShowUpgradeDialog(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${storeId}-${Date.now()}.${fileExt}`;
            const filePath = `receipts/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('payment_receipts')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            setReceiptUrl(filePath);
            toast.success(language === 'ar' ? 'تم رفع الإيصال بنجاح' : 'Receipt uploaded successfully');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmitRequest = async () => {
        if (!(selectedPlan || selectedAddOn) || !receiptUrl) return;

        setIsSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            const { error } = await supabase
                .from('subscription_requests')
                .insert({
                    store_id: storeId,
                    plan_id: selectedPlan?.id || null,
                    add_on_id: selectedAddOn?.id || null,
                    user_id: session?.user?.id,
                    amount: selectedPlan?.price_monthly || selectedAddOn?.price || 0,
                    payment_method: paymentMethod,
                    transaction_id: transactionId,
                    receipt_url: receiptUrl,
                    status: 'pending'
                });

            if (error) throw error;

            toast.success(language === 'ar' ? 'تم إرسال طلب الترقية بنجاح. سيتم المراجعة من قبل الإدارة.' : 'Upgrade request sent successfully. Admin will review it.');
            setShowUpgradeDialog(false);
            fetchBillingData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || subLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Pending Request Alert */}
            {pendingRequest && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="flex flex-row items-center gap-4 py-4">
                        <Clock className="w-6 h-6 text-blue-600" />
                        <div>
                            <CardTitle className="text-blue-800 text-lg">
                                {language === 'ar' ? 'طلب ترقية قيد المراجعة' : 'Upgrade Request Pending'}
                            </CardTitle>
                            <CardDescription className="text-blue-700">
                                {language === 'ar' 
                                    ? (pendingRequest.plan 
                                        ? `لقد طلبت الترقية إلى خطة ${pendingRequest.plan.name_ar}. طلبك قيد التنفيذ وسوف يظهر التغيير فور الموافقة عليه.`
                                        : `لقد طلبت شراء خدمة ${pendingRequest.add_on?.name_ar}. طلبك قيد التنفيذ.`)
                                    : (pendingRequest.plan
                                        ? `You requested an upgrade to ${pendingRequest.plan.name_en}. Your request is being processed.`
                                        : `You requested to purchase ${pendingRequest.add_on?.name_en}. Your request is being processed.`)}
                            </CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            )}

            {/* Current Plan Card */}
            <Card className="border-primary/20 shadow-sm overflow-hidden">
                <div className="bg-primary/5 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-primary/10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                {language === 'ar' ? 'الخطة الحالية' : 'Current Plan'}
                            </Badge>
                        </div>
                        <h3 className="text-2xl font-bold">{language === 'ar' ? planName.ar : planName.en}</h3>
                    </div>
                    {subscription?.status === 'active' && (
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">{language === 'ar' ? 'ينتهي في' : 'Expires at'}</p>
                            <p className="font-medium">{new Date(subscription.current_period_end).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Plans Grid */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <ArrowUpCircle className="w-5 h-5 text-primary" />
                    {language === 'ar' ? 'الخطط المتاحة للترقية' : 'Available Plans for Upgrade'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {plans.map((plan) => {
                        const isCurrent = subscription?.plan?.id === plan.id;
                        const isPending = pendingRequest?.plan_id === plan.id;
                        const canUpgrade = !isCurrent && !pendingRequest;

                        return (
                            <Card key={plan.id} className={cn(
                                "flex flex-col relative transition-all duration-300",
                                isCurrent ? "border-primary shadow-md" : "border-border hover:border-primary/50",
                                isPending ? "opacity-75" : ""
                            )}>
                                {isCurrent && (
                                    <div className="absolute top-0 right-0 p-2">
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                    </div>
                                )}
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-lg">{language === 'ar' ? plan.name_ar : plan.name_en}</CardTitle>
                                    <div className="mt-1 flex flex-col">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold">${plan.price_monthly}</span>
                                            <span className="text-xs text-muted-foreground">/ {language === 'ar' ? 'شهرياً' : 'month'}</span>
                                        </div>
                                        {plan.price_monthly > 0 && (
                                            <div className="text-[10px] text-muted-foreground font-medium">
                                                ≈ {(plan.price_monthly * exchangeRate).toFixed(2)} {storeCurrency}
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 flex-1">
                                    <ul className="space-y-2 text-xs">
                                        {Object.entries(plan.features || {}).map(([key, val]: [string, any]) => {
                                            if (val === false || val === 'false') return null;
                                            return (
                                                <li key={key} className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                    <span>{formatFeature(key, val, language)}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </CardContent>
                                <CardFooter className="p-4 pt-0">
                                    <Button 
                                        className="w-full" 
                                        variant={isCurrent ? "outline" : "default"}
                                        disabled={isCurrent || !!pendingRequest || isPending}
                                        onClick={() => handleUpgradeClick(plan)}
                                    >
                                        {isCurrent ? (language === 'ar' ? 'خطتك الحالية' : 'Current Plan') : (language === 'ar' ? 'اختيار هذه الخطة' : 'Select Plan')}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Add-ons Section */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    {language === 'ar' ? 'خدمات إضافية (مدى الحياة)' : 'Add-on Services (Lifetime)'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableAddOns.map((addon) => {
                        const isOwned = ownedAddOns.includes(addon.id);
                        const isPending = pendingRequest?.add_on_id === addon.id;
                        
                        return (
                            <Card key={addon.id} className={cn(
                                "flex flex-col border-dashed hover:border-solid transition-all",
                                isOwned ? "bg-green-50/50 border-green-200" : ""
                            )}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">
                                            {language === 'ar' ? addon.name_ar : addon.name_en}
                                        </CardTitle>
                                        {isOwned && <Badge className="bg-green-100 text-green-700">{language === 'ar' ? 'مفعلة' : 'Active'}</Badge>}
                                    </div>
                                    <CardDescription>
                                        {language === 'ar' ? addon.description_ar : addon.description_en}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 flex-1">
                                    <div className="flex flex-col mb-4">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold">${addon.price}</span>
                                            <span className="text-xs text-muted-foreground">/ {language === 'ar' ? 'مدى الحياة' : 'Lifetime'}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1 bg-muted/50 p-1 px-2 rounded-md w-fit">
                                            <Clock className="w-3 h-3" />
                                            {language === 'ar' ? 'يعادل تقريباً:' : 'Approx. equivalent:'} 
                                            <span className="font-bold text-primary">{(addon.price * exchangeRate).toFixed(2)} {storeCurrency}</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button 
                                        variant={isOwned ? "outline" : "default"} 
                                        className="w-full"
                                        disabled={isOwned || !!pendingRequest || isPending}
                                        onClick={() => handleAddOnClick(addon)}
                                    >
                                        {isOwned ? (language === 'ar' ? 'تم الشراء' : 'Already Purchased') : (language === 'ar' ? 'شراء الخدمة' : 'Buy Service')}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Upgrade Dialog */}
            <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        {language === 'ar' ? 'تأكيد طلب الشراء' : 'Confirm Purchase Request'}
                    </DialogTitle>
                    <DialogDescription>
                        {selectedPlan ? (
                            language === 'ar' 
                                ? `أنت بصدد طلب الترقية إلى خطة ${selectedPlan?.name_ar}. يرجى إتمام عملية الدفع ورفع صورة الإيصال.`
                                : `You are requesting an upgrade to ${selectedPlan?.name_en}. Please complete payment and upload receipt.`
                        ) : (
                            language === 'ar'
                                ? `أنت بصدد طلب شراء خدمة "${selectedAddOn?.name_ar}". يرجى إتمام عملية الدفع ورفع صورة الإيصال.`
                                : `You are requesting to purchase "${selectedAddOn?.name_en}". Please complete payment and upload receipt.`
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Payment Info */}
                    <div className="bg-muted p-4 rounded-lg space-y-2 border">
                        <div className="flex justify-between font-bold">
                            <span>{language === 'ar' ? 'المبلغ المطلوب (بالدولار):' : 'Amount Due (USD):'}</span>
                            <span className="text-primary">${selectedPlan?.price_monthly || selectedAddOn?.price}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{language === 'ar' ? 'المبلغ المعادل:' : 'Equivalent:'} ({storeCurrency})</span>
                            <span>{((selectedPlan?.price_monthly || selectedAddOn?.price || 0) * exchangeRate).toFixed(2)} {storeCurrency}</span>
                        </div>
                        <Separator />
                        <div className="text-xs space-y-1">
                            <p className="font-semibold">{language === 'ar' ? 'سعر الصرف المعتمد:' : 'Applied Exchange Rate:'} 1 USD = {exchangeRate} {storeCurrency}</p>
                            <Separator className="my-1" />
                            <p className="font-semibold">{language === 'ar' ? 'طرق الدفع المتاحة:' : 'Available Payment Methods:'}</p>
                            <p>• InstaPay: <span className="font-mono">orderly@instapay</span></p>
                            <p>• Vodafone Cash: <span className="font-mono">01000000000</span></p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{language === 'ar' ? 'وسيلة الدفع' : 'Payment Method'}</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="instapay">InstaPay</SelectItem>
                                    <SelectItem value="vodafone_cash">Vodafone Cash</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>{language === 'ar' ? 'رقم العملية (اختياري)' : 'Transaction ID (Optional)'}</Label>
                            <Input 
                                value={transactionId} 
                                onChange={(e) => setTransactionId(e.target.value)} 
                                placeholder={language === 'ar' ? 'رقم المرجع...' : "Reference number..."}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{language === 'ar' ? 'إيصال الدفع (صورة)' : 'Payment Receipt (Image)'}</Label>
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1">
                                    <Input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        id="receipt-upload"
                                        onChange={handleFileUpload}
                                    />
                                    <Label 
                                        htmlFor="receipt-upload" 
                                        className={cn(
                                            "flex items-center justify-center gap-2 h-20 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                                            receiptUrl ? "border-green-500 bg-green-50" : "border-border"
                                        )}
                                    >
                                        {isUploading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : receiptUrl ? (
                                            <div className="flex items-center gap-2 text-green-600">
                                                <CheckCircle2 className="w-5 h-5" />
                                                <span>{language === 'ar' ? 'تم اختيار الصورة' : 'Image selected'}</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                                <Upload className="w-5 h-5" />
                                                <span className="text-xs">{language === 'ar' ? 'اضغط لرفع الإيصال' : 'Click to upload receipt'}</span>
                                            </div>
                                        )}
                                    </Label>
                                </div>
                                    {receiptUrl && (
                                        <Button variant="ghost" size="icon" onClick={() => setReceiptUrl('')}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowUpgradeDialog(false)} disabled={isSubmitting}>
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button onClick={handleSubmitRequest} disabled={!receiptUrl || isSubmitting}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {language === 'ar' ? 'إرسال الطلب' : 'Submit Request'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function formatFeature(key: string, val: any, lang: string) {
    const translations: Record<string, any> = {
        products_limit: { ar: `حد المنتجات: ${val === -1 ? 'غير محدود' : val}`, en: `Products Limit: ${val === -1 ? 'Unlimited' : val}` },
        landing_pages: { ar: 'صفحات الهبوط الاحترافية', en: 'Landing Pages' },
        ai_features: { ar: 'مميزات الذكاء الاصطناعي 🤖', en: 'AI Features 🤖' },
        staff_limit: { ar: `عدد الموظفين: ${val}`, en: `Staff Limit: ${val}` },
        custom_domain: { ar: 'ربط دومين مخصص', en: 'Custom Domain' },
        remove_branding: { ar: 'إزالة حقوق المنصة', en: 'Remove Branding' },
        analytics: { ar: 'تحليلات متقدمة', en: 'Advanced Analytics' },
    };

    if (translations[key]) {
        return translations[key][lang];
    }
    return key.replace(/_/g, ' ');
}

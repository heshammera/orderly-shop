"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Upload, Plus, Smartphone, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useExchangeRate, convertUsdToTarget } from '@/hooks/useExchangeRate';

interface WalletRechargeDialogProps {
    storeId: string;
    storeCurrency: string;
    presetUsdAmount?: number;
    onSuccess?: () => void;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    showTrigger?: boolean;
}

export function WalletRechargeDialog({
    storeId,
    storeCurrency,
    presetUsdAmount,
    onSuccess,
    isOpen,
    onOpenChange,
    showTrigger = true
}: WalletRechargeDialogProps) {
    const { language } = useLanguage();
    const { toast } = useToast();
    const supabase = createClient();
    const { rate, loading: rateLoading } = useExchangeRate(storeCurrency);

    const [internalOpen, setInternalOpen] = useState(false);
    const open = isOpen !== undefined ? isOpen : internalOpen;
    const setOpen = onOpenChange || setInternalOpen;
    const [usdAmount, setUsdAmount] = useState(presetUsdAmount || 5);
    const [senderPhone, setSenderPhone] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [walletNumber, setWalletNumber] = useState<string>('');
    const [walletLoading, setWalletLoading] = useState(true);

    // Fetch active wallet number from settings
    useEffect(() => {
        const fetchWalletNumber = async () => {
            try {
                const { data, error } = await supabase
                    .rpc('get_setting', { setting_key: 'payment_wallets' });

                if (error) throw error;

                const wallets = data?.wallets || [];
                const activeWallet = wallets.find((w: any) => w.active);

                if (activeWallet) {
                    setWalletNumber(activeWallet.number);
                }
            } catch (error) {
                console.error('Error fetching wallet:', error);
            } finally {
                setWalletLoading(false);
            }
        };

        if (open) {
            fetchWalletNumber();
        }
    }, [open]);

    // Update usdAmount if preset changes
    useEffect(() => {
        if (presetUsdAmount) {
            setUsdAmount(presetUsdAmount);
        }
    }, [presetUsdAmount]);

    const localAmount = convertUsdToTarget(usdAmount, rate);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProofFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (usdAmount < 5) {
            toast({
                title: language === 'ar' ? 'مبلغ غير صالح' : 'Invalid amount',
                description: language === 'ar' ? 'الحد الأدنى للشحن هو 5 دولار' : 'Minimum recharge amount is $5 USD',
                variant: "destructive"
            });
            return;
        }

        if (!senderPhone || senderPhone.length < 10) {
            toast({
                title: language === 'ar' ? 'رقم الهاتف مطلوب' : 'Phone number required',
                description: language === 'ar' ? 'الرجاء إدخال رقم هاتفك الذي أرسلت منه المال' : 'Please enter the phone number you sent money from',
                variant: "destructive"
            });
            return;
        }

        if (!proofFile) {
            toast({
                title: language === 'ar' ? 'إثبات الدفع مطلوب' : 'Payment proof required',
                description: language === 'ar' ? 'الرجاء رفع صورة إثبات التحويل' : 'Please upload proof of transfer screenshot',
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            // 1. Upload proof image
            const fileExt = proofFile.name.split('.').pop();
            const fileName = `${storeId}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('recharge-proofs')
                .upload(fileName, proofFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('recharge-proofs')
                .getPublicUrl(fileName);

            // 2. Create recharge request
            const { error: insertError } = await supabase
                .from('wallet_recharge_requests')
                .insert({
                    store_id: storeId,
                    amount_usd: usdAmount,
                    amount_local: localAmount,
                    exchange_rate: rate,
                    sender_phone: senderPhone,
                    proof_image: publicUrl,
                    status: 'pending'
                });

            if (insertError) throw insertError;

            toast({
                title: language === 'ar' ? '✅ تم تقديم الطلب بنجاح' : '✅ Request Submitted Successfully',
                description: language === 'ar'
                    ? 'سيتم مراجعة طلبك وإضافة الرصيد خلال 24 ساعة'
                    : 'Your request will be reviewed and balance added within 24 hours',
                className: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900"
            });

            // Reset form
            setOpen(false);
            setSenderPhone('');
            setProofFile(null);
            setUsdAmount(presetUsdAmount || 5);

            if (onSuccess) onSuccess();

        } catch (error: any) {
            console.error('Recharge error:', error);
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: error.message || (language === 'ar' ? 'حدث خطأ أثناء تقديم الطلب' : 'An error occurred while submitting request'),
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {showTrigger && (
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'شحن الرصيد' : 'Add Funds'}
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden" aria-describedby="recharge-dialog-description">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {language === 'ar' ? 'شحن المحفظة' : 'Recharge Wallet'}
                    </DialogTitle>
                    <DialogDescription id="recharge-dialog-description">
                        {language === 'ar'
                            ? 'حول المبلغ المطلوب واتبع التعليمات لإضافة الرصيد'
                            : 'Transfer the amount and follow instructions to add balance'}
                    </DialogDescription>
                </DialogHeader>

                {walletLoading || rateLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : !walletNumber ? (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            {language === 'ar'
                                ? 'لا يوجد رقم محفظة مُعد. يرجى الاتصال بالدعم.'
                                : 'No wallet number configured. Please contact support.'}
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-5 py-4 overflow-y-auto flex-1 px-1">
                        {/* Amount Input (if not preset) */}
                        {!presetUsdAmount && (
                            <div className="space-y-2">
                                <Label htmlFor="amount">
                                    {language === 'ar' ? 'المبلغ بالدولار (حد أدنى $5)' : 'Amount in USD (min $5)'}
                                </Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    min="5"
                                    step="1"
                                    value={usdAmount}
                                    onChange={(e) => setUsdAmount(parseFloat(e.target.value) || 5)}
                                    placeholder="5.00"
                                />
                            </div>
                        )}

                        {/* Payment Instructions */}
                        <Alert className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-900">
                            <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <AlertDescription className="mt-2 space-y-3">
                                <div className="space-y-1">
                                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                                        {language === 'ar' ? '📱 رقم المحفظة:' : '📱 Wallet Number:'}
                                    </p>
                                    <p className="text-lg font-bold font-mono text-blue-700 dark:text-blue-300" dir="ltr">
                                        {walletNumber}
                                    </p>
                                </div>

                                <div className="pt-2 border-t border-blue-200 dark:border-blue-800 space-y-1">
                                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                                        {language === 'ar' ? '💰 المبلغ المطلوب تحويله:' : '💰 Amount to Transfer:'}
                                    </p>
                                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                        {localAmount.toFixed(2)} {storeCurrency}
                                    </p>
                                    <p className="text-sm text-blue-600 dark:text-blue-400">
                                        {language === 'ar' ? '(يعادل:' : '(Equivalent to:'} ${usdAmount} USD)
                                    </p>
                                </div>

                                <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                                    <p className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                                        {language === 'ar' ? '📋 التعليمات:' : '📋 Instructions:'}
                                    </p>
                                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                                        <li>{language === 'ar' ? 'حول المبلغ الموضح أعلاه بالضبط' : 'Transfer the exact amount shown above'}</li>
                                        <li>{language === 'ar' ? 'التقط صورة لإثبات التحويل' : 'Take a screenshot of the confirmation'}</li>
                                        <li>{language === 'ar' ? 'أدخل رقم هاتفك أدناه' : 'Enter your phone number below'}</li>
                                        <li>{language === 'ar' ? 'ارفع الصورة' : 'Upload the screenshot'}</li>
                                        <li>{language === 'ar' ? 'اضغط إرسال' : 'Click Submit'}</li>
                                    </ol>
                                </div>
                            </AlertDescription>
                        </Alert>

                        {/* Sender Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">
                                {language === 'ar' ? 'رقم هاتفك (الذي أرسلت منه المال)' : 'Your Phone Number (that sent the money)'}
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={senderPhone}
                                onChange={(e) => setSenderPhone(e.target.value)}
                                placeholder={language === 'ar' ? '+201234567890' : '+201234567890'}
                                className="font-mono"
                                dir="ltr"
                            />
                        </div>

                        {/* Proof Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="proof">
                                {language === 'ar' ? 'صورة إثبات التحويل' : 'Transfer Proof Screenshot'}
                            </Label>
                            <Input
                                id="proof"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            {proofFile && (
                                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {proofFile.name}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                {language === 'ar'
                                    ? 'يرجى التأكد من وضوح الصورة وظهور المبلغ والتاريخ'
                                    : 'Please ensure the image is clear and shows amount and date'}
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || walletLoading || rateLoading || !walletNumber}
                        className="w-full sm:w-auto"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin me-2" />}
                        {language === 'ar' ? 'إرسال الطلب' : 'Submit Request'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ShieldCheck, Info, UploadCloud, Copy, Clock, CheckCircle2, Hourglass } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

export function CopyrightRemovalTab({ store }: { store: any }) {
    const { language } = useLanguage();
    const { toast } = useToast();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [price, setPrice] = useState('50');
    const [wallets, setWallets] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [existingRequest, setExistingRequest] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, [store.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Price
            const { data: priceData } = await supabase.rpc('get_setting_value_only', { setting_key: 'remove_copyright_price' });
            if (priceData) setPrice(priceData);

            // Fetch Wallets
            const { data: walletsData } = await supabase.rpc('get_setting', { setting_key: 'payment_wallets' });
            if (walletsData?.wallets) {
                setWallets(walletsData.wallets.filter((w: any) => w.active));
            }

            // Check if there is already a pending or approved request
            const { data: requestData } = await supabase
                .from('copyright_removal_requests')
                .select('*')
                .eq('store_id', store.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (requestData) {
                setExistingRequest(requestData);
            }
        } catch (error) {
            console.error("Error fetching copyright removal data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: language === 'ar' ? 'تم النسخ' : 'Copied',
            description: language === 'ar' ? 'تم نسخ الرقم للحافظة' : 'Number copied to clipboard',
            duration: 2000,
        });
    };

    const handleSubmit = async () => {
        if (!file) {
            toast({
                title: language === 'ar' ? 'مطلوب إيصال الدفع' : 'Receipt Required',
                description: language === 'ar' ? 'الرجاء إرفاق صورة حوالة الدفع' : 'Please upload payment receipt image',
                variant: 'destructive',
            });
            return;
        }

        setSubmitting(true);
        try {
            // 1. Upload receipt
            const fileExt = file.name.split('.').pop();
            const fileName = `${store.id}-${Date.now()}.${fileExt}`;
            const filePath = `receipts/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('copyright-receipts')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('copyright-receipts')
                .getPublicUrl(filePath);

            const receiptUrl = urlData.publicUrl;

            // 2. Insert request record
            const { error: insertError } = await supabase
                .from('copyright_removal_requests')
                .insert({
                    store_id: store.id,
                    amount: parseFloat(price),
                    currency: 'USD',
                    receipt_url: receiptUrl,
                    status: 'pending'
                });

            if (insertError) throw insertError;

            // Instantly update the UI local state for immediate feedback
            setExistingRequest({
                store_id: store.id,
                amount: parseFloat(price),
                currency: 'USD',
                receipt_url: receiptUrl,
                status: 'pending',
                created_at: new Date().toISOString()
            });

            // Refresh data from server to ensure sync
            await fetchData();
        } catch (error: any) {
            toast({
                title: language === 'ar' ? 'حدث خطأ' : 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    // ✅ STATE: Copyright already removed (approved)
    if (store.has_removed_copyright || existingRequest?.status === 'approved') {
        return (
            <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-8 text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-9 h-9 text-green-600" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-green-800">
                        {language === 'ar' ? '✅ تم الاشتراك في ميزة إزالة الحقوق' : '✅ Copyright Removal Active'}
                    </h3>
                    <p className="text-green-700 max-w-md mx-auto">
                        {language === 'ar'
                            ? 'تم تفعيل ميزة إزالة الحقوق بنجاح. متجرك الآن يظهر بعلامتك التجارية الخاصة فقط ولم يعد نص "Powered by Orderly" يظهر أسفل المتجر.'
                            : 'Copyright removal has been activated. Your store is now fully white-labeled. The "Powered by Orderly" text no longer appears on your storefront.'}
                    </p>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 px-4 py-1 text-sm">
                        <ShieldCheck className="w-4 h-4 inline rtl:ml-1 ltr:mr-1" />
                        {language === 'ar' ? 'الميزة مفعلة' : 'Feature Active'}
                    </Badge>
                </div>
            </div>
        );
    }

    // ⏳ STATE: Pending approval
    if (existingRequest?.status === 'pending') {
        return (
            <div className="space-y-4">
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center space-y-5">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center animate-pulse">
                            <Hourglass className="w-9 h-9 text-yellow-600" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-yellow-800">
                        {language === 'ar' ? '⏳ طلبك قيد المراجعة' : '⏳ Your Request is Being Reviewed'}
                    </h3>
                    <p className="text-yellow-700 max-w-md mx-auto">
                        {language === 'ar'
                            ? 'لقد تم استلام طلبك لإزالة حقوق المنصة وهو قيد المراجعة الآن من قبل الإدارة.'
                            : 'We have received your copyright removal request and it is currently being reviewed by administration.'}
                    </p>
                    <div className="bg-white/70 border border-yellow-200 rounded-lg p-4 max-w-sm mx-auto space-y-3">
                        <div className="flex items-center justify-center gap-2 text-yellow-800">
                            <Clock className="w-5 h-5" />
                            <span className="font-semibold text-sm">
                                {language === 'ar' ? 'الوقت المتوقع للموافقة:' : 'Expected Approval Time:'}
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-700">
                            {language === 'ar' ? 'خلال ساعتين' : 'Within 2 Hours'}
                        </p>
                        <p className="text-xs text-yellow-600">
                            {language === 'ar'
                                ? 'سيتم إشعارك عند الموافقة على طلبك. يمكنك العودة لهذه الصفحة للتحقق من الحالة.'
                                : 'You will be notified when your request is approved. You can return to this page to check status.'}
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-yellow-600">
                        <Info className="w-4 h-4" />
                        <span>
                            {language === 'ar' ? 'تاريخ الطلب: ' : 'Request Date: '}
                            {new Date(existingRequest.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // 📝 STATE: Purchase form (no pending request or rejected)
    return (
        <div className="space-y-6">
            <Alert>
                <ShieldCheck className="w-5 h-5" />
                <AlertTitle>{language === 'ar' ? 'إزالة حقوق المنصة (Powered by Orderly)' : 'Remove Platform Copyright'}</AlertTitle>
                <AlertDescription className="mt-2 space-y-2 text-muted-foreground">
                    <p>
                        {language === 'ar'
                            ? 'بشكل افتراضي، يظهر في أسفل متجرك عبارة تدل على استخدامك لمنصتنا. يمكنك إزالة هذا النص نهائياً وجعل المتجر بعلامتك التجارية الخالصة 100% مقابل رسوم لمرة واحدة فقط.'
                            : 'By default, your store displays a "Powered by Orderly" badge in the footer. You can remove this text permanently for a one-time fee to make your store 100% white-labeled.'}
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                        <Badge variant="secondary" className="text-lg px-4 py-1">
                            {language === 'ar' ? 'تكلفة الإزالة: ' : 'Removal Fee: '} ${price}
                        </Badge>
                    </div>
                </AlertDescription>
            </Alert>

            <div className="border rounded-lg p-6 space-y-6 bg-card">
                <h3 className="text-lg font-semibold border-b pb-2">
                    {language === 'ar' ? 'خطوات الدفع' : 'Payment Steps'}
                </h3>

                <div className="space-y-4 text-sm">
                    <p>
                        <span className="font-bold flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">1</span>
                            {language === 'ar' ? 'قم بتحويل المبلغ المذكور أعلاه إلى إحدى المحافظ التالية:' : 'Transfer the specified amount to one of the following wallets:'}
                        </span>
                    </p>

                    {wallets.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                            {wallets.map((wallet: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                    <div>
                                        <p className="font-medium text-xs text-muted-foreground">{language === 'ar' ? wallet.name_ar : wallet.name}</p>
                                        <p className="font-mono text-sm mt-1" dir="ltr">{wallet.number}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleCopy(wallet.number)}>
                                        <Copy className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-destructive font-medium">{language === 'ar' ? 'لا توجد محافظ دقع متاحة حالياً.' : 'No payment wallets available currently.'}</p>
                    )}

                    <p className="pt-4">
                        <span className="font-bold flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">2</span>
                            {language === 'ar' ? 'ارفع صورة وصل التحويل واسحب الطلب للإدارة:' : 'Upload transfer receipt and submit the request:'}
                        </span>
                    </p>

                    <div className="space-y-3 p-4 border rounded-lg bg-background">
                        <div>
                            <Label htmlFor="receipt">{language === 'ar' ? 'صورة إيصال التحويل' : 'Transfer Receipt Image'}</Label>
                            <Input
                                id="receipt"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="mt-1"
                            />
                        </div>

                        {existingRequest?.status === 'rejected' && (
                            <Alert variant="destructive" className="mt-2 text-xs py-2">
                                <AlertTitle>{language === 'ar' ? 'تم رفض طلبك السابق' : 'Previous request rejected'}</AlertTitle>
                                {existingRequest.admin_notes && <AlertDescription>{existingRequest.admin_notes}</AlertDescription>}
                            </Alert>
                        )}

                        <Button
                            className="w-full sm:w-auto mt-4"
                            disabled={submitting || !file}
                            onClick={handleSubmit}
                        >
                            {submitting ? (
                                <Loader2 className="w-4 h-4 animate-spin rtl:ml-2 ltr:mr-2" />
                            ) : (
                                <UploadCloud className="w-4 h-4 rtl:ml-2 ltr:mr-2" />
                            )}
                            {language === 'ar' ? 'إرسال طلب الإزالة' : 'Submit Removal Request'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

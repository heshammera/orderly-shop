'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Eye, EyeOff, Loader2, CheckCircle2, XCircle, AlertCircle, ExternalLink, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface AITabProps {
    storeId: string;
    canUseAI: boolean;
    initialApiKey?: string;
}

export function AITab({ storeId, canUseAI, initialApiKey }: AITabProps) {
    const { language } = useLanguage();
    const [apiKey, setApiKey] = useState(initialApiKey || '');
    const [showKey, setShowKey] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>(
        initialApiKey ? 'success' : 'idle'
    );
    const [pendingRequest, setPendingRequest] = useState<any | null>(null);
    const [loadingRequest, setLoadingRequest] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (!canUseAI) {
            checkPendingRequest();
        }
    }, [canUseAI, storeId]);

    const checkPendingRequest = async () => {
        setLoadingRequest(true);
        try {
            const { data } = await supabase
                .from('subscription_requests')
                .select('*, plan:plans(name_ar, name_en)')
                .eq('store_id', storeId)
                .eq('status', 'pending')
                .maybeSingle();
            
            if (data) setPendingRequest(data);
        } catch (error) {
            console.error('Error checking pending request:', error);
        } finally {
            setLoadingRequest(false);
        }
    };

    const handleTestKey = async () => {
        if (!apiKey) {
            toast.error(language === 'ar' ? 'الرجاء إدخال المفتاح أولاً' : 'Please enter the key first');
            return;
        }

        setIsTesting(true);
        setStatus('idle');
        try {
            const res = await fetch('/api/ai/test-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setStatus('success');
                toast.success(language === 'ar' ? 'تم الاتصال بنجاح!' : 'Connection successful!');
            } else {
                setStatus('error');
                toast.error(data.error || 'Failed to connect');
            }
        } catch (error) {
            setStatus('error');
            toast.error(language === 'ar' ? 'فشل الاتصال بالخادم' : 'Server connection failed');
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = async () => {
        if (!apiKey && status !== 'idle') {
             // Saving empty key is allowed to remove it
        } else if (status !== 'success' && apiKey) {
            toast.error(language === 'ar' ? 'الرجاء اختبار المفتاح أولاً والتأكد من صحته' : 'Please test the key first');
            return;
        }

        setIsSaving(true);
        try {
            // First fetch existing settings to preserve other keys
            const { data: storeData } = await supabase
                .from('stores')
                .select('settings')
                .eq('id', storeId)
                .single();

            const currentSettings = storeData?.settings || {};
            const updatedSettings = {
                ...currentSettings,
                ai: {
                    ...(currentSettings.ai || {}),
                    gemini_api_key: apiKey
                }
            };

            const { error } = await supabase
                .from('stores')
                .update({ settings: updatedSettings })
                .eq('id', storeId);

            if (error) throw error;

            toast.success(language === 'ar' ? 'تم الحفظ بنجاح!' : 'Saved successfully!');
            if (!apiKey) setStatus('idle');
        } catch (error: any) {
            toast.error(error.message || 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    if (!canUseAI) {
        if (loadingRequest) {
            return (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            );
        }

        if (pendingRequest) {
            return (
                <Card className="border-blue-200 bg-blue-50 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-blue-800 mb-2">
                            <Clock className="w-5 h-5" />
                            <CardTitle className="text-lg">
                                {language === 'ar' ? 'طلب الترقية قيد التنفيذ' : 'Upgrade Request Pending'}
                            </CardTitle>
                        </div>
                        <CardDescription className="text-blue-700">
                            {language === 'ar'
                                ? `لقد أرسلت طلباً للترقية إلى خطة ${pendingRequest.plan.name_ar}. طلبك قيد المراجعة حالياً من قبل الإدارة.`
                                : `You have submitted an upgrade request for the ${pendingRequest.plan.name_en} plan. It is currently under review.`}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button variant="outline" onClick={() => window.location.href = `/dashboard/${storeId}/settings?tab=billing`} className="border-blue-300 text-blue-700 hover:bg-blue-100">
                            {language === 'ar' ? 'عرض تفاصيل الطلب' : 'View Request Details'}
                        </Button>
                    </CardFooter>
                </Card>
            );
        }

        return (
            <Card className="border-amber-200 bg-amber-50 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2 text-amber-800 mb-2">
                        <AlertCircle className="w-5 h-5" />
                        <CardTitle className="text-lg">
                            {language === 'ar' ? 'ترقية خطتك مطلوبة' : 'Plan Upgrade Required'}
                        </CardTitle>
                    </div>
                    <CardDescription className="text-amber-700">
                        {language === 'ar'
                            ? 'خطتك الحالية لا تتضمن مميزات الذكاء الاصطناعي المتقدمة. قم بالترقية الآن لفتح قدرات خرافية لمتجرك.'
                            : 'Your current plan does not include advanced AI features. Upgrade now to unlock incredible capabilities for your store.'}
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button onClick={() => window.location.href = `/dashboard/${storeId}/settings?tab=billing`} className="bg-amber-600 hover:bg-amber-700 text-white">
                        <Sparkles className="w-4 h-4 mr-2 rtl:ml-2" />
                        {language === 'ar' ? 'ترقية الخطة الآن' : 'Upgrade Plan Now'}
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="border-primary/20 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <Sparkles className="w-5 h-5" />
                        <CardTitle className="text-lg">
                            {language === 'ar' ? 'مميزات الذكاء الاصطناعي مفعّلة' : 'AI Features Enabled'}
                        </CardTitle>
                    </div>
                    <CardDescription>
                        {language === 'ar'
                            ? 'خطتك تشمل مميزات الذكاء الاصطناعي. اربط مفتاح Gemini الخاص بك لتفعيلها بالكامل.'
                            : 'Your plan includes AI features. Link your Gemini key to fully activate them.'}
                    </CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{language === 'ar' ? 'دليل الحصول على المفتاح (مجاني)' : 'How to get your key (Free)'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <ol className="list-decimal list-inside space-y-3">
                        <li>
                            {language === 'ar' ? 'افتح موقع Google AI Studio: ' : 'Open Google AI Studio: '}
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                                aistudio.google.com/app/apikey <ExternalLink className="w-3 h-3" />
                            </a>
                        </li>
                        <li>{language === 'ar' ? 'قم بتسجيل الدخول بأي حساب Gmail تمتلكه.' : 'Sign in with any Gmail account you own.'}</li>
                        <li>{language === 'ar' ? 'اضغط على زر "Create API Key" واختر مشروعاً جديداً.' : 'Click "Create API Key" and select a new project.'}</li>
                        <li>{language === 'ar' ? 'انسخ المفتاح الذي يبدأ بـ "AIzaSy..."' : 'Copy the key starting with "AIzaSy..."'}</li>
                        <li>{language === 'ar' ? 'الصق المفتاح في الحقل أدناه واضغط "اختبار الاتصال".' : 'Paste the key in the field below and click "Test Connection".'}</li>
                    </ol>
                    <div className="bg-muted p-3 rounded-md mt-4 flex gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p>
                            {language === 'ar' 
                                ? 'ملاحظة: المفتاح مجاني يمنحك 15 طلب في الدقيقة. الرجاء عدم مشاركة المفتاح مع أي شخص آخر للحفاظ على باقتك.' 
                                : 'Note: The key is free and grants 15 requests per minute. Do not share it to protect your quota.'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{language === 'ar' ? 'إعداد مفتاح Gemini' : 'Gemini Key Setup'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="apiKey">{language === 'ar' ? 'مفتاح API' : 'API Key'}</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    id="apiKey"
                                    type={showKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={(e) => {
                                        setApiKey(e.target.value);
                                        setStatus('idle');
                                    }}
                                    placeholder="AIzaSy..."
                                    className="pr-10 text-left"
                                    dir="ltr"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                >
                                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <Button variant="secondary" onClick={handleTestKey} disabled={isTesting || !apiKey}>
                                {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'ar' ? 'اختبار' : 'Test')}
                            </Button>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2 text-sm">
                            <span className="text-muted-foreground">{language === 'ar' ? 'الحالة:' : 'Status:'}</span>
                            {status === 'success' && (
                                <span className="flex items-center text-green-600 font-medium">
                                    <CheckCircle2 className="w-4 h-4 mr-1 rtl:ml-1" />
                                    {language === 'ar' ? 'متصل ويعمل' : 'Connected & Working'}
                                </span>
                            )}
                            {status === 'error' && (
                                <span className="flex items-center text-red-600 font-medium">
                                    <XCircle className="w-4 h-4 mr-1 rtl:ml-1" />
                                    {language === 'ar' ? 'مفتاح خاطئ' : 'Invalid Key'}
                                </span>
                            )}
                            {status === 'idle' && (
                                <span className="text-gray-500">
                                    {language === 'ar' ? 'في انتظار الاختبار' : 'Waiting for test'}
                                </span>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSave} disabled={isSaving || (apiKey !== '' && status !== 'success')}>
                        {isSaving && <Loader2 className="w-4 h-4 mr-2 rtl:ml-2 animate-spin" />}
                        {language === 'ar' ? 'حفظ المفتاح' : 'Save Key'}
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{language === 'ar' ? 'المميزات التي سيتم تفعيلها' : 'Features to be unlocked'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> AI Magic Writer (محتوى المنتجات)</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> AI SEO Optimizer (تحسين محركات البحث)</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> AI Translator (الترجمة التلقائية)</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> مساعد الحملات التسويقية</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> محلل المراجعات الذكي</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> مولّد الردود على العملاء</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> كاتب البريد الإلكتروني</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> مساعد التسوق الذكي (Chatbot)</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> البحث الذكي بالوصف</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}

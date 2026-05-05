import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Sparkles, Megaphone, BarChart, MessageSquare, Mail, AlertCircle, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import { AIMarketingAssistant } from '@/components/dashboard/AIMarketingAssistant';
import { AIReviewsAnalyzer } from '@/components/dashboard/AIReviewsAnalyzer';
import { AIResponseGenerator } from '@/components/dashboard/AIResponseGenerator';
import { AIEmailWriter } from '@/components/dashboard/AIEmailWriter';
import { AIKeyBanner } from '@/components/dashboard/AIKeyBanner';

export default async function AIHubPage({ params }: { params: { storeId: string } }) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) redirect('/login');

    const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('id', params.storeId)
        .single();

    if (!store) redirect('/dashboard');

    // Get effective plan using the standard RPC
    const { data: planData } = await supabase
        .rpc('get_store_effective_plan', { p_store_id: params.storeId });

    const features = planData?.plan?.features || planData?.features || {};
    const subStatus = planData?.subscription?.status || planData?.status;
    const isSubActive = subStatus === 'active' || subStatus === 'trialing';
    
    // Check for the AI flag in multiple possible locations
    const aiFlag = features.ai_features ?? planData?.plan?.ai_features ?? planData?.ai_features;
    
    const canUseAI = planData?.has_plan && isSubActive && (aiFlag === true || aiFlag === 'true');

    // Check for pending requests
    const { data: pendingRequest } = await supabase
        .from('subscription_requests')
        .select('*, plan:plans(name_ar, name_en)')
        .eq('store_id', params.storeId)
        .eq('status', 'pending')
        .maybeSingle();

    if (!canUseAI) {
        return (
            <div className="container mx-auto py-12 max-w-4xl space-y-8 animate-in fade-in duration-500">
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <Sparkles className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">مركز الذكاء الاصطناعي (AI Hub)</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        فتح آفاق جديدة لمتجرك باستخدام أدوات الذكاء الاصطناعي المتقدمة. يرجى الترقية لتفعيل هذه المميزات.
                    </p>
                </div>

                {pendingRequest ? (
                    <Card className="border-blue-200 bg-blue-50/50">
                        <CardHeader className="text-center">
                            <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                            <CardTitle className="text-blue-800">طلب الترقية قيد المراجعة</CardTitle>
                            <CardDescription className="text-blue-700 text-base">
                                لقد طلبت الترقية إلى خطة <strong>{pendingRequest.plan.name_ar}</strong>. 
                                يتم الآن مراجعة طلبك من قبل فريقنا، وسوف تظهر المميزات هنا فور الموافقة.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    <Card className="border-primary/20 shadow-xl overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2">
                            <div className="p-8 space-y-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-primary" />
                                    لماذا تختار مركز الذكاء الاصطناعي؟
                                </h3>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-sm">توليد محتوى ذكي</p>
                                            <p className="text-xs text-muted-foreground">كتابة أوصاف المنتجات والمقالات التسويقية بذكاء.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-sm">تحليل مراجعات العملاء</p>
                                            <p className="text-xs text-muted-foreground">فهم انطباعات العملاء وتحسين خدماتك بناءً عليها.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-sm">مساعد تسوق ذكي (Chatbot)</p>
                                            <p className="text-xs text-muted-foreground">الرد التلقائي على استفسارات العملاء بناءً على مخزونك.</p>
                                        </div>
                                    </li>
                                </ul>
                                <div className="pt-4">
                                    <Link href={`/dashboard/${params.storeId}/settings?tab=billing`}>
                                        <Button className="w-full bg-primary hover:bg-primary/90 h-12 text-lg">
                                            ترقية الخطة الآن
                                            <ArrowRight className="w-5 h-5 ml-2 mr-0" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                            <div className="bg-primary/5 p-8 flex items-center justify-center border-r">
                                <div className="space-y-4 text-center">
                                    <div className="relative">
                                        <Sparkles className="w-24 h-24 text-primary/20 absolute -top-4 -right-4 animate-pulse" />
                                        <Megaphone className="w-20 h-20 text-primary mx-auto" />
                                    </div>
                                    <p className="text-sm font-medium text-primary">وفّر الوقت وزد مبيعاتك بنسبة تصل إلى 40%</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                <div className="text-center">
                    <Link href={`/dashboard/${params.storeId}`}>
                        <Button variant="ghost" className="text-muted-foreground">
                            إلغاء والعودة للوحة التحكم
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const hasApiKey = !!store.settings?.ai?.gemini_api_key;
    const storeName = typeof store.name === 'string' ? JSON.parse(store.name).ar : store.name?.ar || 'المتجر';

    return (
        <div className="container mx-auto py-8 max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3 tracking-tight">
                    <Sparkles className="w-8 h-8 text-primary" />
                    مركز الذكاء الاصطناعي (AI Hub)
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    مجموعة أدوات متقدمة مدعومة بالذكاء الاصطناعي لتنمية متجرك وإدارته بذكاء.
                </p>
            </div>

            {!hasApiKey && <AIKeyBanner storeId={params.storeId} />}

            <Tabs defaultValue="marketing" className="w-full" dir="rtl">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-muted/50">
                    <TabsTrigger value="marketing" className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Megaphone className="w-4 h-4 mr-2" />
                        الحملات التسويقية
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <BarChart className="w-4 h-4 mr-2" />
                        تحليل المراجعات
                    </TabsTrigger>
                    <TabsTrigger value="responses" className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        ردود العملاء
                    </TabsTrigger>
                    <TabsTrigger value="email" className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Mail className="w-4 h-4 mr-2" />
                        كاتب البريد
                    </TabsTrigger>
                </TabsList>
                
                <div className="mt-6">
                    <TabsContent value="marketing" className="m-0 focus-visible:outline-none">
                        <AIMarketingAssistant storeId={params.storeId} />
                    </TabsContent>
                    
                    <TabsContent value="reviews" className="m-0 focus-visible:outline-none">
                        <AIReviewsAnalyzer storeId={params.storeId} />
                    </TabsContent>
                    
                    <TabsContent value="responses" className="m-0 focus-visible:outline-none">
                        <AIResponseGenerator storeId={params.storeId} storeName={storeName} />
                    </TabsContent>
                    
                    <TabsContent value="email" className="m-0 focus-visible:outline-none">
                        <AIEmailWriter storeId={params.storeId} storeName={storeName} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GeneralTab } from './GeneralTab';
import { ShippingTab } from './ShippingTab';
import { DomainsTab } from './DomainsTab';
import { SeoTab } from './SeoTab';
import { CopyrightRemovalTab } from './CopyrightRemovalTab';
import { PagesTab } from './PagesTab';
import { SecurityTab } from './SecurityTab';
import { IntegrationsManager } from '@/components/dashboard/IntegrationsManager';
import { Store, Phone, Globe, Search, Truck, Link, Plug, ShieldCheck, FileText, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface StoreData {
    id: string;
    name: { ar: string; en: string };
    description: { ar: string; en: string };
    slug: string;
    custom_domain: string | null;
    domain_verified: boolean;
    logo_url: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    contact_email_verified?: boolean;
    contact_phone_verified?: boolean;
    currency: string;
    timezone: string;
    settings: any;
}

interface StoreSettingsFormProps {
    store: StoreData;
}

export function StoreSettingsForm({ store: initialStore }: StoreSettingsFormProps) {
    const { language } = useLanguage();
    const { toast } = useToast();
    const router = useRouter();
    const supabase = createClient();

    const handleSave = async (data: Partial<StoreData>) => {
        try {
            const { error } = await supabase
                .from('stores')
                .update(data)
                .eq('id', initialStore.id);

            if (error) throw error;

            toast({
                title: language === 'ar' ? 'تم الحفظ' : 'Saved',
                description: language === 'ar' ? 'تم تحديث إعدادات المتجر بنجاح' : 'Store settings updated successfully',
                className: "bg-green-50 border-green-200"
            });

            // Refresh server data and hard reload to ensure layout and sidebar update
            window.location.reload();
        } catch (error: any) {
            console.error('Error updating store:', error);
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: error.message,
                variant: 'destructive'
            });
            throw error; // Re-throw for child components to handle if needed (e.g. stop loading state)
        }
    };

    const tabs = [
        {
            value: 'general',
            label: language === 'ar' ? 'الأساسيات' : 'General',
            icon: Store,
        },
        {
            value: 'operations',
            label: language === 'ar' ? 'التشغيل' : 'Operations',
            icon: Truck,
        },
        {
            value: 'tech',
            label: language === 'ar' ? 'التقنية والتسويق' : 'Tech & Marketing',
            icon: Link,
        },
        {
            value: 'integrations',
            label: language === 'ar' ? 'التكاملات' : 'Integrations',
            icon: Plug,
        },
        {
            value: 'pages',
            label: language === 'ar' ? 'الصفحات' : 'Pages',
            icon: FileText,
        },
        {
            value: 'copyright',
            label: language === 'ar' ? 'إزالة الحقوق' : 'Remove Copyright',
            icon: ShieldCheck,
        },
        {
            value: 'security',
            label: language === 'ar' ? 'الأمان' : 'Security',
            icon: Shield,
        },
    ];

    return (
        <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="flex flex-wrap h-auto p-2 gap-2 w-full lg:w-auto bg-muted/50">
                {tabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                        <tab.icon className="w-4 h-4 hidden sm:block" />
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>

            <TabsContent value="general">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {language === 'ar' ? 'إعدادات المتجر الأساسية' : 'General Store Settings'}
                        </CardTitle>
                        <CardDescription>
                            {language === 'ar'
                                ? 'البيانات الشخصية، معلومات التواصل، والإعدادات الإقليمية'
                                : 'Profile data, contact information, and regional settings'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <GeneralTab store={initialStore} onSave={handleSave} />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="operations">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {language === 'ar' ? 'إعدادات الشحن' : 'Shipping Settings'}
                            </CardTitle>
                            <CardDescription>
                                {language === 'ar'
                                    ? 'تخصيص تكاليف الشحن (ثابت أو حسب المنطقة)'
                                    : 'Customize shipping costs (Fixed or Per Region)'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ShippingTab store={initialStore} onSave={handleSave} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {language === 'ar' ? 'الصفحات التعريفية' : 'Informational Pages'}
                            </CardTitle>
                            <CardDescription>
                                {language === 'ar'
                                    ? 'إضافة وتعديل صفحات مثل "من نحن" و"سياسة الخصوصية"'
                                    : 'Add and edit pages like "About Us" and "Privacy Policy"'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PagesTab store={initialStore} onSave={handleSave} />
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="tech">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {language === 'ar' ? 'تهيئة محركات البحث (SEO)' : 'SEO Settings'}
                            </CardTitle>
                            <CardDescription>
                                {language === 'ar'
                                    ? 'تحسين ظهور متجرك في منصات البحث'
                                    : 'Optimize your store visibility on search engines'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SeoTab store={initialStore} onSave={handleSave} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {language === 'ar' ? 'ربط النطاق (Domain)' : 'Domain Binding'}
                            </CardTitle>
                            <CardDescription>
                                {language === 'ar'
                                    ? 'إدارة النطاق الخاص بمتجرك'
                                    : 'Manage your custom domain'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DomainsTab store={initialStore} onSave={handleSave} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {language === 'ar' ? 'التكاملات والربط' : 'Integrations'}
                            </CardTitle>
                            <CardDescription>
                                {language === 'ar'
                                    ? 'ربط المتجر بالخدمات الخارجية (مثل Google Sheets)'
                                    : 'Connect store with external services (e.g., Google Sheets)'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <IntegrationsManager
                                storeId={initialStore.id}
                            />
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="security">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {language === 'ar' ? 'الأمان وحماية الحساب' : 'Security & Account Protection'}
                            </CardTitle>
                            <CardDescription>
                                {language === 'ar'
                                    ? 'إدارة كلمات المرور وتوثيق معلومات التواصل'
                                    : 'Manage passwords and verify contact information'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SecurityTab store={initialStore} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5" />
                                {language === 'ar' ? 'العلامة التجارية الكاملة (إزالة الحقوق)' : 'Full White-labeling (Remove Copyright)'}
                            </CardTitle>
                            <CardDescription>
                                {language === 'ar'
                                    ? 'اجعل المتجر خاصاً بك بنسبة 100٪ بدون ذكر منصة Orderly'
                                    : 'Make your store 100% yours without mentioning the Orderly platform'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CopyrightRemovalTab store={initialStore} />
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
        </Tabs>
    );
}

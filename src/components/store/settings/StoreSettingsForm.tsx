"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StoreProfileTab } from './StoreProfileTab';
import { ContactTab } from './ContactTab';
import { RegionalTab } from './RegionalTab';
import { SeoTab } from './SeoTab';
import { ShippingTab } from './ShippingTab';
import { DomainsTab } from './DomainsTab';
import { CopyrightRemovalTab } from './CopyrightRemovalTab';
import { PagesTab } from './PagesTab';
import { IntegrationsManager } from '@/components/dashboard/IntegrationsManager';
import { Store, Phone, Globe, Search, Truck, Link, Plug, ShieldCheck, FileText } from 'lucide-react';
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

            router.refresh(); // Refresh server data
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
            value: 'profile',
            label: language === 'ar' ? 'الملف الشخصي' : 'Profile',
            icon: Store,
        },
        {
            value: 'contact',
            label: language === 'ar' ? 'التواصل' : 'Contact',
            icon: Phone,
        },
        {
            value: 'regional',
            label: language === 'ar' ? 'الإعدادات الإقليمية' : 'Regional',
            icon: Globe,
        },
        {
            value: 'shipping',
            label: language === 'ar' ? 'الشحن' : 'Shipping',
            icon: Truck,
        },
        {
            value: 'seo',
            label: language === 'ar' ? 'SEO' : 'SEO',
            icon: Search,
        },
        {
            value: 'domains',
            label: language === 'ar' ? 'النطاقات' : 'Domains',
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
    ];

    return (
        <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="flex flex-wrap h-auto p-2 gap-2 w-full lg:w-auto bg-muted/50">
                {tabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                        <tab.icon className="w-4 h-4 hidden sm:block" />
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>

            <TabsContent value="profile">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {language === 'ar' ? 'الملف الشخصي للمتجر' : 'Store Profile'}
                        </CardTitle>
                        <CardDescription>
                            {language === 'ar'
                                ? 'اسم المتجر والوصف والشعار'
                                : 'Store name, description, and logo'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <StoreProfileTab store={initialStore} onSave={handleSave} />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="contact">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {language === 'ar' ? 'معلومات التواصل' : 'Contact Information'}
                        </CardTitle>
                        <CardDescription>
                            {language === 'ar'
                                ? 'البريد الإلكتروني ورقم الهاتف وروابط التواصل الاجتماعي'
                                : 'Email, phone, and social media links'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ContactTab store={initialStore} onSave={handleSave} />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="regional">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {language === 'ar' ? 'الإعدادات الإقليمية' : 'Regional Settings'}
                        </CardTitle>
                        <CardDescription>
                            {language === 'ar'
                                ? 'العملة والمنطقة الزمنية'
                                : 'Currency and timezone'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RegionalTab store={initialStore} onSave={handleSave} />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="shipping">
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
            </TabsContent>

            <TabsContent value="seo">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {language === 'ar' ? 'تحسين محركات البحث' : 'Search Engine Optimization'}
                        </CardTitle>
                        <CardDescription>
                            {language === 'ar'
                                ? 'عنوان ووصف المتجر لمحركات البحث'
                                : 'Store title and description for search engines'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SeoTab store={initialStore} onSave={handleSave} />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="domains">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {language === 'ar' ? 'إعدادات النطاق' : 'Domain Settings'}
                        </CardTitle>
                        <CardDescription>
                            {language === 'ar'
                                ? 'إدارة النطاق الفرعي والنطاق المخصص'
                                : 'Manage your subdomain and custom domain'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DomainsTab store={initialStore} onSave={handleSave} />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="integrations">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {language === 'ar' ? 'التكاملات والبيكسلات' : 'Integrations & Pixels'}
                        </CardTitle>
                        <CardDescription>
                            {language === 'ar'
                                ? 'إدارة Facebook Pixel، TikTok، Google Analytics، وGoogle Sheets'
                                : 'Manage Facebook Pixel, TikTok, Google Analytics, and Google Sheets'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <IntegrationsManager storeId={initialStore.id} />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="pages">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {language === 'ar' ? 'الصفحات القانونية' : 'Legal Pages'}
                        </CardTitle>
                        <CardDescription>
                            {language === 'ar'
                                ? 'إدارة صفحات من نحن، سياسة الخصوصية، وشروط الخدمة.'
                                : 'Manage About Us, Privacy Policy, and Terms of Service pages.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PagesTab store={initialStore} onSave={handleSave} />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="copyright">
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
            </TabsContent>
        </Tabs>
    );
}

"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StoreProfileTab } from './StoreProfileTab';
import { ContactTab } from './ContactTab';
import { RegionalTab } from './RegionalTab';
import { ShippingTab } from './ShippingTab';
import { DomainsTab } from './DomainsTab';
import { SeoTab } from './SeoTab';
import { CopyrightRemovalTab } from './CopyrightRemovalTab';
import { PagesTab } from './PagesTab';
import { SecurityTab } from './SecurityTab';
import { IntegrationsManager } from '@/components/dashboard/IntegrationsManager';
import { Store, Phone, Truck, Settings, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

export interface StoreData {
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

            window.location.reload();
        } catch (error: any) {
            console.error('Error updating store:', error);
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: error.message,
                variant: 'destructive'
            });
            throw error;
        }
    };

    const tabs = [
        {
            value: 'store',
            label: language === 'ar' ? 'المتجر' : 'Store',
            icon: Store,
        },
        {
            value: 'contact',
            label: language === 'ar' ? 'التواصل' : 'Contact',
            icon: Phone,
        },
        {
            value: 'shipping',
            label: language === 'ar' ? 'الشحن' : 'Shipping',
            icon: Truck,
        },
        {
            value: 'advanced',
            label: language === 'ar' ? 'متقدم' : 'Advanced',
            icon: Settings,
        },
        {
            value: 'security',
            label: language === 'ar' ? 'الأمان' : 'Security',
            icon: Shield,
        },
    ];

    return (
        <Tabs defaultValue="store" className="space-y-6">
            <TabsList className="flex flex-wrap h-auto p-2 gap-2 w-full lg:w-auto bg-muted/50">
                {tabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                        <tab.icon className="w-4 h-4 hidden sm:block" />
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>

            {/* ── Tab 1: المتجر ── */}
            <TabsContent value="store">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {language === 'ar' ? 'بيانات المتجر' : 'Store Information'}
                        </CardTitle>
                        <CardDescription>
                            {language === 'ar'
                                ? 'الاسم، الوصف، اللوجو، العملة والمنطقة الزمنية'
                                : 'Name, description, logo, currency and timezone'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <StoreProfileTab store={initialStore} onSave={handleSave} hideHeader />
                        <Separator />
                        <RegionalTab store={initialStore} onSave={handleSave} hideHeader />
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ── Tab 2: التواصل ── */}
            <TabsContent value="contact">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {language === 'ar' ? 'بيانات التواصل' : 'Contact Information'}
                        </CardTitle>
                        <CardDescription>
                            {language === 'ar'
                                ? 'بيانات التواصل العامة وروابط السوشال ميديا'
                                : 'Public contact information and social media links'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ContactTab store={initialStore} onSave={handleSave} hideHeader />
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ── Tab 3: الشحن ── */}
            <TabsContent value="shipping">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {language === 'ar' ? 'إعدادات الشحن' : 'Shipping Settings'}
                        </CardTitle>
                        <CardDescription>
                            {language === 'ar'
                                ? 'تحديد تكاليف الشحن (سعر ثابت أو حسب المنطقة)'
                                : 'Configure shipping costs (fixed price or per region)'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ShippingTab store={initialStore} onSave={handleSave} />
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ── Tab 4: متقدم ── */}
            <TabsContent value="advanced">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {language === 'ar' ? 'تهيئة محركات البحث (SEO)' : 'SEO Settings'}
                            </CardTitle>
                            <CardDescription>
                                {language === 'ar'
                                    ? 'تحسين ظهور متجرك في نتائج البحث'
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
                                {language === 'ar' ? 'ربط النطاق (Domain)' : 'Custom Domain'}
                            </CardTitle>
                            <CardDescription>
                                {language === 'ar'
                                    ? 'ربط نطاق خاص بمتجرك'
                                    : 'Connect a custom domain to your store'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DomainsTab store={initialStore} onSave={handleSave} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {language === 'ar' ? 'التكاملات' : 'Integrations'}
                            </CardTitle>
                            <CardDescription>
                                {language === 'ar'
                                    ? 'ربط المتجر بخدمات خارجية مثل Google Sheets و Facebook Pixel'
                                    : 'Connect your store with external services like Google Sheets & Facebook Pixel'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <IntegrationsManager storeId={initialStore.id} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {language === 'ar' ? 'الصفحات التعريفية' : 'Info Pages'}
                            </CardTitle>
                            <CardDescription>
                                {language === 'ar'
                                    ? 'صفحات مثل "من نحن" و"سياسة الخصوصية"'
                                    : 'Pages like "About Us" and "Privacy Policy"'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PagesTab store={initialStore} onSave={handleSave} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {language === 'ar' ? 'إزالة حقوق المنصة' : 'Remove Platform Copyright'}
                            </CardTitle>
                            <CardDescription>
                                {language === 'ar'
                                    ? 'إخفاء شعار المنصة من أسفل متجرك'
                                    : 'Hide the platform branding from your store footer'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CopyrightRemovalTab store={initialStore} />
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            {/* ── Tab 5: الأمان ── */}
            <TabsContent value="security">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {language === 'ar' ? 'الأمان والحساب' : 'Security & Account'}
                        </CardTitle>
                        <CardDescription>
                            {language === 'ar'
                                ? 'تغيير كلمة المرور وتوثيق بيانات التواصل'
                                : 'Change password and verify contact information'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SecurityTab store={initialStore} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}

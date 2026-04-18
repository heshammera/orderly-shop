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
import { Store, Phone, Truck, Shield, Globe, Link, Search, FileText, Stamp } from 'lucide-react';
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
            label: language === 'ar' ? 'عام' : 'General',
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
            value: 'domain',
            label: language === 'ar' ? 'الدومين' : 'Domain',
            icon: Globe,
        },
        {
            value: 'seo',
            label: language === 'ar' ? 'محركات البحث' : 'SEO',
            icon: Search,
        },
        {
            value: 'integrations',
            label: language === 'ar' ? 'التطبيقات والربط' : 'Integrations',
            icon: Link,
        },
        {
            value: 'pages',
            label: language === 'ar' ? 'الصفحات' : 'Pages',
            icon: FileText,
        },
        {
            value: 'branding',
            label: language === 'ar' ? 'حقوق المنصة' : 'Branding',
            icon: Stamp,
        },
        {
            value: 'security',
            label: language === 'ar' ? 'الأمان' : 'Security',
            icon: Shield,
        },
    ];

    return (
        <Tabs defaultValue="store" className="flex flex-col md:flex-row gap-8 lg:gap-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* Sidebar Navigation */}
            <TabsList className="flex flex-col w-full md:w-64 h-auto bg-transparent p-0 gap-2 items-stretch shrink-0 md:sticky md:top-24 self-start">
                {tabs.map((tab) => (
                    <TabsTrigger 
                        key={tab.value} 
                        value={tab.value} 
                        className="justify-start gap-3 px-4 py-3 text-sm md:text-base font-medium h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 rounded-xl transition-all border border-transparent data-[state=active]:border-primary/10"
                    >
                        <tab.icon className="w-5 h-5" />
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>

            {/* Main Content Area */}
            <div className="flex-1 w-full min-w-0">
                
                {/* ── Tab 1: Store ── */}
                <TabsContent value="store" className="m-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight">{language === 'ar' ? 'الإعدادات العامة' : 'General Settings'}</h2>
                            <p className="text-muted-foreground">{language === 'ar' ? 'إدارة بيانات المتجر الأساسية والمنطقة الجغرافية.' : 'Manage basic store information and regional settings.'}</p>
                        </div>
                        <Separator />
                        <Card className="shadow-sm border-muted/60">
                            <CardContent className="p-6 md:p-8 space-y-8">
                                <StoreProfileTab store={initialStore} onSave={handleSave} hideHeader />
                                <Separator />
                                <RegionalTab store={initialStore} onSave={handleSave} hideHeader />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ── Tab 2: Contact ── */}
                <TabsContent value="contact" className="m-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                     <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight">{language === 'ar' ? 'بيانات التواصل' : 'Contact Information'}</h2>
                            <p className="text-muted-foreground">{language === 'ar' ? 'البيانات التي تظهر للعملاء وروابط منصات التواصل الاجتماعي.' : 'Public contact information and social media links.'}</p>
                        </div>
                        <Separator />
                        <Card className="shadow-sm border-muted/60">
                            <CardContent className="p-6 md:p-8">
                                <ContactTab store={initialStore} onSave={handleSave} hideHeader />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ── Tab 3: Shipping ── */}
                <TabsContent value="shipping" className="m-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight">{language === 'ar' ? 'إعدادات الشحن' : 'Shipping Settings'}</h2>
                            <p className="text-muted-foreground">{language === 'ar' ? 'تحديد وتخصيص تكاليف الشحن حسب المناطق.' : 'Configure shipping costs and regions.'}</p>
                        </div>
                        <Separator />
                        <Card className="shadow-sm border-muted/60">
                            <CardContent className="p-6 md:p-8">
                                <ShippingTab store={initialStore} onSave={handleSave} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ── Tab 4: Domain ── */}
                <TabsContent value="domain" className="m-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight">{language === 'ar' ? 'ربط النطاق' : 'Custom Domain'}</h2>
                            <p className="text-muted-foreground">{language === 'ar' ? 'اربط متجرك بنطاقك المخصص لتعزيز علامتك التجارية.' : 'Connect your store with your custom branded domain.'}</p>
                        </div>
                        <Separator />
                        <Card className="shadow-sm border-muted/60">
                            <CardContent className="p-6 md:p-8">
                                <DomainsTab store={initialStore} onSave={handleSave} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ── Tab 5: SEO ── */}
                <TabsContent value="seo" className="m-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight">{language === 'ar' ? 'محركات البحث' : 'SEO'}</h2>
                            <p className="text-muted-foreground">{language === 'ar' ? 'تحسين ظهور متجرك في نتائج بحث جوجل وغيرها.' : 'Optimize your store visibility on search engines.'}</p>
                        </div>
                        <Separator />
                        <Card className="shadow-sm border-muted/60">
                            <CardContent className="p-6 md:p-8">
                                <SeoTab store={initialStore} onSave={handleSave} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ── Tab 6: Integrations ── */}
                <TabsContent value="integrations" className="m-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight">{language === 'ar' ? 'التطبيقات والربط' : 'Integrations'}</h2>
                            <p className="text-muted-foreground">{language === 'ar' ? 'ربط المتجر بخدمات خارجية مثل Google Sheets وغيرها.' : 'Connect your store with external services and apps.'}</p>
                        </div>
                        <Separator />
                        <Card className="shadow-sm border-muted/60">
                            <CardContent className="p-6 md:p-8 flex flex-col pt-0">
                                <IntegrationsManager storeId={initialStore.id} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ── Tab 7: Pages ── */}
                <TabsContent value="pages" className="m-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight">{language === 'ar' ? 'الصفحات الإضافية' : 'Pages'}</h2>
                            <p className="text-muted-foreground">{language === 'ar' ? 'إدارة صفحات النظام مثل "عن المتجر" و"سياسات الخصوصية".' : 'Manage system pages like About Us and Privacy Policies.'}</p>
                        </div>
                        <Separator />
                        <Card className="shadow-sm border-muted/60">
                            <CardContent className="p-6 md:p-8">
                                <PagesTab store={initialStore} onSave={handleSave} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ── Tab 8: Branding ── */}
                <TabsContent value="branding" className="m-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight">{language === 'ar' ? 'حقوق المنصة' : 'Branding'}</h2>
                            <p className="text-muted-foreground">{language === 'ar' ? 'التحكم في ظهور واجهة وشعارات المنصة لدى عملائك.' : 'Control the visibility of platform branding.'}</p>
                        </div>
                        <Separator />
                        <Card className="shadow-sm border-amber-600/20">
                            <CardContent className="p-6 md:p-8">
                                <CopyrightRemovalTab store={initialStore} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ── Tab 9: Security ── */}
                <TabsContent value="security" className="m-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight text-destructive">{language === 'ar' ? 'الأمان والحساب' : 'Security & Account'}</h2>
                            <p className="text-muted-foreground">{language === 'ar' ? 'إدارة كلمة المرور، والإعدادات المتعلقة بأمان المتجر.' : 'Manage security, passwords, and dangerous actions.'}</p>
                        </div>
                        <Separator />
                        <Card className="shadow-sm border-destructive/20 overflow-hidden">
                            <CardContent className="p-0">
                                <div className="p-6 md:p-8">
                                    <SecurityTab store={initialStore} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </div>
        </Tabs>
    );
}

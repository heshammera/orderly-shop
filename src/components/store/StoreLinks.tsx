"use client";

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Store, LayoutDashboard, Copy, ExternalLink, CheckCircle, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface StoreLinksProps {
    storeSlug: string;
    storeId: string;
    storeName: string;
}

export function StoreLinks({ storeSlug, storeId, storeName }: StoreLinksProps) {
    const { language } = useLanguage();
    const [links, setLinks] = useState({
        pathStore: '',
        subdomainStore: '',
        dashboard: '',
    });

    useEffect(() => {
        const origin = window.location.origin;
        const hostname = window.location.hostname;

        // Extract main domain (remove www if exists)
        const hostParts = hostname.split('.');
        const mainDomain = hostParts.length > 2 && hostParts[0] === 'www'
            ? hostParts.slice(1).join('.')
            : hostname;

        setLinks({
            pathStore: `${origin}/s/${storeSlug}`,
            subdomainStore: `https://${storeSlug}.${mainDomain}`,
            dashboard: `${origin}/dashboard/${storeId}`,
        });
    }, [storeSlug, storeId]);

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(
            language === 'ar' ? `تم نسخ ${label}` : `${label} copied`,
            { duration: 2000 }
        );
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                </div>
                <h2 className="text-3xl font-bold">
                    {language === 'ar' ? `🎉 مبروك!` : '🎉 Congratulations!'}
                </h2>
                <p className="text-xl text-muted-foreground">
                    {language === 'ar'
                        ? `متجر "${storeName}" جاهز الآن!`
                        : `Store "${storeName}" is ready!`}
                </p>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-900">
                    {language === 'ar'
                        ? '✨ متجرك متاح عبر رابطين مختلفين. احفظ هذه الروابط!'
                        : '✨ Your store is available via two different URLs. Save these links!'}
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Store Link (Subdomain ONLY) */}
                <Card className="border-2 border-blue-200 md:col-span-2">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Store className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">
                                    {language === 'ar' ? '🎯 رابط متجرك' : '🎯 Your Store Link'}
                                </CardTitle>
                                <CardDescription>
                                    {language === 'ar' ? 'شارك هذا الرابط مع عملائك' : 'Share this link with your customers'}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                            <code className="text-base md:text-lg font-semibold break-all text-blue-700" dir="ltr">{links.subdomainStore}</code>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="default"
                                onClick={() => handleCopy(links.subdomainStore, language === 'ar' ? 'رابط المتجر' : 'Store Link')}
                                className="flex-1"
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                {language === 'ar' ? 'نسخ الرابط' : 'Copy Link'}
                            </Button>
                            <Button
                                variant="default"
                                size="default"
                                asChild
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                                <a href={links.subdomainStore} target="_blank" rel="noreferrer">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    {language === 'ar' ? 'افتح المتجر' : 'Open Store'}
                                </a>
                            </Button>
                        </div>
                        <Alert className="bg-yellow-50 border-yellow-200">
                            <AlertDescription className="text-yellow-800 text-sm">
                                {language === 'ar' ? (
                                    <>💡 <strong>للتطوير:</strong> استخدم <code className="bg-yellow-100 px-1.5 py-0.5 rounded">{storeSlug}.localhost:3000</code></>
                                ) : (
                                    <>💡 <strong>For development:</strong> Use <code className="bg-yellow-100 px-1.5 py-0.5 rounded">{storeSlug}.localhost:3000</code></>
                                )}
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                {/* Dashboard Link */}
                <Card className="border-2 md:col-span-2">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <LayoutDashboard className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base">
                                    {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {language === 'ar' ? 'إدارة المنتجات والطلبات' : 'Manage products and orders'}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <code className="text-sm break-all text-purple-700" dir="ltr">{links.dashboard}</code>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopy(links.dashboard, language === 'ar' ? 'رابط لوحة التحكم' : 'Dashboard Link')}
                                className="flex-1"
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                {language === 'ar' ? 'نسخ' : 'Copy'}
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                asChild
                                className="flex-1 bg-purple-600 hover:bg-purple-700"
                            >
                                <a href={links.dashboard}>
                                    <LayoutDashboard className="w-4 h-4 mr-2" />
                                    {language === 'ar' ? 'اذهب للوحة التحكم' : 'Go to Dashboard'}
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Alert>
                <AlertDescription>
                    {language === 'ar'
                        ? '💡 تلميح: احفظ هذه الروابط في مكان آمن. يمكنك دائماً الوصول إليها من الإعدادات → النطاقات'
                        : '💡 Tip: Save these links somewhere safe. You can always access them from Settings → Domains'}
                </AlertDescription>
            </Alert>
        </div>
    );
}

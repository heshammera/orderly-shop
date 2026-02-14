"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, AlertCircle, Globe, Copy, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

interface StoreData {
    id: string;
    slug: string;
    custom_domain: string | null;
    domain_verified: boolean;
}

interface DomainsTabProps {
    store: any;
    onSave: (data: Partial<StoreData>) => Promise<void>;
}

export function DomainsTab({ store, onSave }: DomainsTabProps) {
    const { language } = useLanguage();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [customDomain, setCustomDomain] = useState(store.custom_domain || '');
    const [origin, setOrigin] = useState('');
    const [currentDomain, setCurrentDomain] = useState('');

    useEffect(() => {
        const fullOrigin = window.location.origin;
        const hostname = window.location.hostname;

        setOrigin(fullOrigin);

        // Extract main domain (remove www if exists)
        const hostParts = hostname.split('.');
        const mainDomain = hostParts.length > 2 && hostParts[0] === 'www'
            ? hostParts.slice(1).join('.')
            : hostname;

        setCurrentDomain(mainDomain);
    }, []);

    const storePathUrl = `${origin}/s/${store.slug}`;
    const subdomainUrl = currentDomain ? `${store.slug}.${currentDomain}` : `${store.slug}.yourdomain.com`;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: language === 'ar' ? 'تم النسخ' : 'Copied',
            description: language === 'ar' ? 'تم نسخ الرابط للحافظة' : 'Link copied to clipboard',
        });
    };

    const handleSaveDomain = async () => {
        setLoading(true);
        try {
            const domain = customDomain.trim().toLowerCase().replace(/^https?:\/\//, '');
            await onSave({
                custom_domain: domain || null,
                domain_verified: false
            });
            setCustomDomain(domain);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Primary Subdomain Link */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                        {language === 'ar' ? 'رابط متجرك' : 'Your Store Link'}
                    </h3>
                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                        {language === 'ar' ? 'نشط' : 'Active'}
                    </span>
                </div>
                <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-900">
                        {language === 'ar'
                            ? 'هذا هو الرابط الرئيسي لمتجرك. شاركه مع عملائك!'
                            : 'This is your main store link. Share it with your customers!'}
                    </AlertDescription>
                </Alert>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 p-5 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <Globe className="w-6 h-6 text-blue-600 flex-shrink-0" />
                        <a
                            href={`https://${subdomainUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-lg md:text-xl truncate hover:underline hover:text-blue-700 transition-colors text-blue-600 font-semibold"
                        >
                            {subdomainUrl}
                        </a>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(`https://${subdomainUrl}`)}
                            className="gap-2 flex-1"
                        >
                            <Copy className="w-4 h-4" />
                            {language === 'ar' ? 'نسخ الرابط' : 'Copy Link'}
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            asChild
                            className="gap-2 flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            <a href={`https://${subdomainUrl}`} target="_blank" rel="noreferrer">
                                <ExternalLink className="w-4 h-4" />
                                {language === 'ar' ? 'افتح المتجر' : 'Open Store'}
                            </a>
                        </Button>
                    </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                        {language === 'ar' ? (
                            <>
                                <strong>للتطوير المحلي:</strong> استخدم <code className="bg-yellow-100 px-2 py-1 rounded text-xs">{store.slug}.localhost:3000</code>
                            </>
                        ) : (
                            <>
                                <strong>For local development:</strong> Use <code className="bg-yellow-100 px-2 py-1 rounded text-xs">{store.slug}.localhost:3000</code>
                            </>
                        )}
                    </p>
                </div>
            </div>

            <hr className="border-border" />

            {/* Custom Domain Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">
                    {language === 'ar' ? 'النطاق المخصص (Custom Domain)' : 'Custom Domain'}
                </h3>

                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{language === 'ar' ? 'ملاحظة' : 'Note'}</AlertTitle>
                    <AlertDescription>
                        {language === 'ar'
                            ? 'لربط نطاقك الخاص، يجب عليك إضافة سجل CNAME في مزود النطاق الخاص بك.'
                            : 'To connect your custom domain, you must add a CNAME record at your domain provider.'}
                    </AlertDescription>
                </Alert>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="custom-domain">
                            {language === 'ar' ? 'رابط النطاق' : 'Domain URL'}
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="custom-domain"
                                placeholder="store.com"
                                value={customDomain}
                                onChange={(e) => setCustomDomain(e.target.value)}
                                className="font-mono"
                            />
                            <Button onClick={handleSaveDomain} disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />}
                                {language === 'ar' ? 'حفظ' : 'Save'}
                            </Button>
                        </div>
                    </div>

                    {store.custom_domain && (
                        <div className="bg-card border p-4 rounded-lg space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">{store.custom_domain}</span>
                                <div className="flex items-center gap-2">
                                    {store.domain_verified ? (
                                        <span className="text-green-600 flex items-center gap-1 text-sm">
                                            <Check className="w-4 h-4" /> {language === 'ar' ? 'تم التحقق' : 'Verified'}
                                        </span>
                                    ) : (
                                        <span className="text-yellow-600 flex items-center gap-1 text-sm bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
                                            <Loader2 className="w-3 h-3 animate-spin" /> {language === 'ar' ? 'جاري التحقق...' : 'Verifying...'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {!store.domain_verified && (
                                <div className="text-sm bg-muted p-3 rounded space-y-2">
                                    <p className="font-semibold">{language === 'ar' ? 'إعدادات CNAME المطلوبة:' : 'Required CNAME Record:'}</p>
                                    <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                                        <span className="text-muted-foreground">Type:</span>
                                        <code className="bg-background px-2 py-1 rounded">CNAME</code>

                                        <span className="text-muted-foreground">Value:</span>
                                        <code className="bg-background px-2 py-1 rounded">domains.matjari.com</code>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

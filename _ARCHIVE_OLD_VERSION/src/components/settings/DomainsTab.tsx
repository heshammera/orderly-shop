import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, AlertCircle, Globe, Copy, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

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
    const { language, t } = useLanguage();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [customDomain, setCustomDomain] = useState(store.custom_domain || '');
    const [origin, setOrigin] = useState('');

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    const storePathUrl = `${origin}/s/${store.slug}`;
    // For display purposes, we can also show what the subdomain WOULD be if configured
    const subdomainUrl = `${store.slug}.matjari.com`;

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
            {/* Primary Store Link (Working Path-based URL) */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">
                    {language === 'ar' ? 'رابط المتجر الأساسي' : 'Primary Store Link'}
                </h3>
                <div className="bg-muted p-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden w-full">
                        <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                        <a
                            href={storePathUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-sm md:text-lg truncate hover:underline hover:text-primary transition-colors"
                        >
                            {storePathUrl}
                        </a>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex-shrink-0">
                            {language === 'ar' ? 'نشط' : 'Active'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={() => window.open(storePathUrl, '_blank')}>
                            <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(storePathUrl)}>
                            <Copy className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">
                    {language === 'ar'
                        ? 'هذا هو الرابط المباشر لمتجرك والذي يعمل حالياً.'
                        : 'This is the direct link to your store that is currently active.'}
                </p>
            </div>

            <hr className="border-border" />

            {/* Default Subdomain Display (Informational) */}
            <div className="space-y-4 opacity-75">
                <h3 className="text-lg font-medium">
                    {language === 'ar' ? 'النطاق الفرعي (Subdomain)' : 'Default Subdomain'}
                </h3>
                <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="font-mono">{subdomainUrl}</span>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                            {language === 'ar' ? 'يتطلب تفعيل' : 'Requires Setup'}
                        </span>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    {language === 'ar'
                        ? 'ملاحظة: تفعيل النطاقات الفرعية يتطلب إعدادات DNS خاصة.'
                        : 'Note: Subdomains require specific DNS configuration to work.'}
                </p>
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

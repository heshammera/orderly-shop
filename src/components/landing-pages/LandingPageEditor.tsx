"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
    ExternalLink, Lock, Loader2, Plus, Trash2, Save, Eye, Zap, 
    Image as ImageIcon, Star, ShieldCheck, Palette, Layout, Settings2, Check 
} from 'lucide-react';
import { LandingPageRenderer } from './LandingPageRenderer';
import type { LandingTemplate } from './LandingPageRenderer';
import { ImageUpload } from '@/components/dashboard/ImageUpload';

interface LandingPageEditorProps {
    productId: string;
    storeId: string;
    storeSlug: string;
    productName: { ar: string; en: string };
    productPrice: number;
    productSalePrice?: number;
    productImages: string[];
    productCurrency: string;
    canUseLandingPages: boolean;
}

const DEFAULT_CONTENT = {
    headline: { ar: '', en: '' },
    subheadline: { ar: '', en: '' },
    cta_text: { ar: 'اطلب الآن', en: 'Order Now' },
    benefits: [
        { ar: 'خامات عالية الجودة وضمان طويل الأمد', en: 'High quality materials with long warranty' },
        { ar: 'تصميم عصري يناسب كافة الاحتياجات', en: 'Modern design suitable for all needs' }
    ],
    guarantee_text: { 
        ar: 'معاينة قبل الاستلام وضمان ارجاع المنتج في حالة عدم الرضا', 
        en: 'Inspection before receipt and return guarantee if not satisfied' 
    },
    testimonials: [
        { name: 'أحمد محمد', text: { ar: 'منتج رائع جداً وتوصيل سريع!', en: 'Great product and fast delivery!' }, rating: 5 },
    ],
    hero_image: '',
    accent_color: '#2563EB'
};

export function LandingPageEditor({
    productId, storeId, storeSlug,
    productName, productPrice, productSalePrice,
    productImages, productCurrency,
    canUseLandingPages
}: LandingPageEditorProps) {
    const supabase = createClient();
    const { language } = useLanguage();
    
    const [template, setTemplate] = useState<LandingTemplate>('hype');
    const [isEnabled, setIsEnabled] = useState(false);
    const [isStandalone, setIsStandalone] = useState(true);
    const [content, setContent] = useState(DEFAULT_CONTENT);
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [showPreview, setShowPreview] = useState(false);
    const [landingPageId, setLandingPageId] = useState<string | null>(null);

    // Initial Load
    useEffect(() => {
        if (!productId || !canUseLandingPages) { setLoading(false); return; }
        let isMounted = true;
        const load = async () => {
            try {
                const { data } = await supabase
                    .from('product_landing_pages')
                    .select('*')
                    .eq('product_id', productId)
                    .maybeSingle();
                
                if (data && isMounted) {
                    setLandingPageId(data.id);
                    setTemplate(data.template || 'hype');
                    setIsEnabled(data.is_enabled || false);
                    setIsStandalone(data.is_standalone ?? true);
                    const loadedContent = data.content || {};
                    setContent(prev => ({ ...prev, ...loadedContent }));
                }
            } catch (e) { console.error(e); } finally { if (isMounted) setLoading(false); }
        };
        load();
        return () => { isMounted = false; };
    }, [productId, canUseLandingPages]);

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const payload = { product_id: productId, store_id: storeId, template, is_enabled: isEnabled, is_standalone: isStandalone, content };
            if (landingPageId) {
                await supabase.from('product_landing_pages').update(payload).eq('id', landingPageId);
            } else {
                const { data } = await supabase.from('product_landing_pages').insert(payload).select().single();
                if (data) setLandingPageId(data.id);
            }
            toast.success(language === 'ar' ? '✅ تم الحفظ' : '✅ Saved');
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e: any) {
            toast.error(e.message);
            setSaveStatus('error');
        } finally { setSaving(false); }
    };

    // Calculate URLs on the fly to break re-render loops
    let subdomainUrl = '';
    let previewUrl = '';
    if (typeof window !== 'undefined') {
        const host = window.location.host;
        const baseDomain = host.includes('.') ? host.split('.').slice(-2).join('.') : host;
        subdomainUrl = `${window.location.protocol}//${storeSlug.toLowerCase()}.${baseDomain}/lp/${productId}`;
        previewUrl = `${subdomainUrl}?preview=true`;
    }

    if (!canUseLandingPages) return <div className="py-10 text-center"><Lock className="mx-auto mb-2 opacity-20" /> {language === 'ar' ? 'ميزة مدفوعة' : 'Paid Feature'}</div>;
    if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>;

    if (showPreview) {
        return (
            <div className="space-y-4">
                <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                    {language === 'ar' ? '← رجوع' : '← Back'}
                </Button>
                <div className="border rounded-xl overflow-hidden bg-white shadow-2xl" style={{ height: '70vh' }}>
                    <LandingPageRenderer
                        template={template}
                        content={content}
                        product={{ name: productName, price: productPrice, sale_price: productSalePrice, currency: productCurrency, images: productImages }}
                        language={language as 'ar' | 'en'}
                        storeSlug={storeSlug}
                        productId={productId}
                        isPreview={true}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-h-[80vh] overflow-y-auto px-1">
            <div className="flex items-center justify-between bg-primary/5 p-4 rounded-xl border border-primary/10">
                <div className="flex items-center gap-3">
                    <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
                    <Label className="font-bold">{language === 'ar' ? 'تفعيل صفحة الهبوط' : 'Enable Landing Page'}</Label>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}><Eye className="w-4 h-4 me-1" /> {language === 'ar' ? 'معاينة' : 'Preview'}</Button>
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4 me-1" />}
                        {saveStatus === 'success' ? (language === 'ar' ? 'تم!' : 'Done!') : (language === 'ar' ? 'حفظ' : 'Save')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-sm">{language === 'ar' ? 'النصوص' : 'Texts'}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs">{language === 'ar' ? 'العنوان (AR)' : 'Headline (AR)'}</Label>
                                    <Input value={content.headline.ar} onChange={e => setContent(c => ({ ...c, headline: { ...c.headline, ar: e.target.value } }))} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">{language === 'ar' ? 'العنوان (EN)' : 'Headline (EN)'}</Label>
                                    <Input value={content.headline.en} onChange={e => setContent(c => ({ ...c, headline: { ...c.headline, en: e.target.value } }))} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">{language === 'ar' ? 'الصورة الأساسية' : 'Hero Image'}</Label>
                                <ImageUpload value={content.hero_image ? [content.hero_image] : []} onChange={urls => setContent(c => ({ ...c, hero_image: urls[0] || '' }))} onRemove={() => setContent(c => ({ ...c, hero_image: '' }))} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center"><CardTitle className="text-sm">{language === 'ar' ? 'المميزات' : 'Features'}</CardTitle> <Button variant="ghost" size="sm" onClick={() => setContent(c => ({ ...c, benefits: [...c.benefits, { ar: '', en: '' }] }))}><Plus className="w-3 h-3" /></Button></CardHeader>
                        <CardContent className="space-y-3">
                            {content.benefits.map((b, i) => (
                                <div key={i} className="flex gap-2">
                                    <Input value={b.ar} onChange={e => { const nb = [...content.benefits]; nb[i].ar = e.target.value; setContent(c => ({ ...c, benefits: nb })); }} placeholder="AR" />
                                    <Input value={b.en} onChange={e => { const nb = [...content.benefits]; nb[i].en = e.target.value; setContent(c => ({ ...c, benefits: nb })); }} placeholder="EN" />
                                    <Button variant="ghost" size="icon" onClick={() => setContent(c => ({ ...c, benefits: c.benefits.filter((_, idx) => idx !== i) }))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-sm">{language === 'ar' ? 'التصميم' : 'Design'}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-2">
                                {(['trust', 'hype', 'elegant'] as LandingTemplate[]).map(t => (
                                    <Button key={t} variant={template === t ? 'default' : 'outline'} size="sm" onClick={() => setTemplate(t)} className="capitalize">{t}</Button>
                                ))}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">{language === 'ar' ? 'اللون' : 'Color'}</Label>
                                <Input type="color" value={content.accent_color} onChange={e => setContent(c => ({ ...c, accent_color: e.target.value }))} className="h-8" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-sm">{language === 'ar' ? 'الروابط' : 'Links'}</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <div className="p-2 bg-muted rounded text-[10px] break-all font-mono">
                                {subdomainUrl}
                            </div>
                            <Button variant="secondary" size="sm" className="w-full" onClick={() => window.open(subdomainUrl, '_blank')}><ExternalLink className="w-3 h-3 me-1" /> {language === 'ar' ? 'فتح الصفحة' : 'Open Page'}</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

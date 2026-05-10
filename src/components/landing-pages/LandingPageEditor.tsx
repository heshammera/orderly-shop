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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ExternalLink, Lock, Loader2, Plus, Trash2, Save, Eye, Zap, Crown, Shield, Check } from 'lucide-react';
import { LandingPageRenderer } from './LandingPageRenderer';
import type { LandingTemplate } from './LandingPageRenderer';

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
                    setContent(prev => ({ ...prev, ...(data.content || {}) }));
                }
            } catch (e) {
                console.error("Error loading LP:", e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        load();
        return () => { isMounted = false; };
    }, [productId, canUseLandingPages]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { product_id: productId, store_id: storeId, template, is_enabled: isEnabled, is_standalone: isStandalone, content };
            if (landingPageId) {
                const { error } = await supabase.from('product_landing_pages').update(payload).eq('id', landingPageId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('product_landing_pages').insert(payload).select().single();
                if (error) throw error;
                setLandingPageId(data.id);
            }
            toast.success(language === 'ar' ? '✅ تم حفظ صفحة الهبوط!' : '✅ Landing page saved!');
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (e: any) {
            console.error('Error saving landing page:', e);
            toast.error(e.message);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } finally {
            setSaving(false);
        }
    };

    const updateBenefit = (i: number, lang: 'ar' | 'en', val: string) => {
        const b = [...content.benefits];
        b[i] = { ...b[i], [lang]: val };
        setContent(c => ({ ...c, benefits: b }));
    };
    const addBenefit = () => setContent(c => ({ ...c, benefits: [...c.benefits, { ar: '', en: '' }] }));
    const removeBenefit = (i: number) => setContent(c => ({ ...c, benefits: c.benefits.filter((_, idx) => idx !== i) }));

    const updateTestimonial = (i: number, field: string, val: any) => {
        const t = [...content.testimonials];
        if (field === 'text_ar') t[i] = { ...t[i], text: { ...t[i].text, ar: val } };
        else if (field === 'text_en') t[i] = { ...t[i], text: { ...t[i].text, en: val } };
        else t[i] = { ...t[i], [field]: val };
        setContent(c => ({ ...c, testimonials: t }));
    };
    const addTestimonial = () => setContent(c => ({ ...c, testimonials: [...c.testimonials, { name: '', text: { ar: '', en: '' }, rating: 5 }] }));
    const removeTestimonial = (i: number) => setContent(c => ({ ...c, testimonials: c.testimonials.filter((_, idx) => idx !== i) }));

    const productData = { name: productName, price: productPrice, sale_price: productSalePrice, currency: productCurrency, images: productImages };

    // URLs
    const [subdomainUrl, setSubdomainUrl] = useState('');
    const [fallbackUrl, setFallbackUrl] = useState('');

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const host = window.location.host;
        let cleanHost = host;
        if (host.includes('admin.')) cleanHost = host.replace('admin.', '');
        
        const base = `${window.location.protocol}//${storeSlug}.${cleanHost}/lp/${productId}`;
        setSubdomainUrl(base);
        setFallbackUrl(`${window.location.protocol}//${host}/s/${storeSlug}/lp/${productId}?preview=true`);
    }, [storeSlug, productId]);

    const previewUrl = `${subdomainUrl}${subdomainUrl.includes('?') ? '&' : '?'}preview=true`;

    if (!canUseLandingPages) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Lock className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">{language === 'ar' ? 'صفحات الهبوط — ميزة مدفوعة' : 'Landing Pages — Paid Feature'}</h3>
                <p className="text-muted-foreground max-w-md text-sm">
                    {language === 'ar' ? 'قم بترقية باقتك للوصول لميزة صفحات الهبوط المخصصة وزيادة مبيعاتك بشكل كبير' : 'Upgrade your plan to access custom landing pages and significantly boost your sales'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                    {['🎨 3 قوالب احترافية', '✏️ تخصيص كامل', '🔗 رابط مستقل', '📊 تحسين التحويل'].map(f => (
                        <Badge key={f} variant="secondary">{f}</Badge>
                    ))}
                </div>
            </div>
        );
    }

    if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;

    if (showPreview) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                        {language === 'ar' ? '← رجوع للمحرر' : '← Back to Editor'}
                    </Button>
                    <Badge variant="secondary">{language === 'ar' ? 'معاينة' : 'Preview'}</Badge>
                </div>
                <div className="border rounded-lg overflow-hidden" style={{ height: '70vh', overflow: 'auto' }}>
                    <LandingPageRenderer
                        template={template}
                        content={content}
                        product={productData}
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
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-muted/50 p-4 rounded-xl border border-border/50">
                <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg", isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                        <ExternalLink className="w-5 h-5" />
                    </div>
                    <div>
                        <Label htmlFor="lp-enabled" className="font-bold block mb-1">
                            {language === 'ar' ? 'تفعيل صفحة الهبوط للمنتج' : 'Enable Product Landing Page'}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            {language === 'ar' ? 'عند التفعيل، سيتم توجيه العملاء لصفحة مخصصة بدلاً من صفحة المتجر التقليدية' : 'When enabled, customers will be routed to a custom page instead of the standard store page.'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <Switch checked={isEnabled} onCheckedChange={setIsEnabled} id="lp-enabled" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{language === 'ar' ? 'المحتوى والنصوص' : 'Content & Texts'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{language === 'ar' ? 'العنوان الرئيسي (عربي)' : 'Headline (AR)'}</Label>
                                    <Input value={content.headline.ar} onChange={e => setContent(c => ({ ...c, headline: { ...c.headline, ar: e.target.value } }))} placeholder={productName.ar} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{language === 'ar' ? 'العنوان الرئيسي (انجليزي)' : 'Headline (EN)'}</Label>
                                    <Input value={content.headline.en} onChange={e => setContent(c => ({ ...c, headline: { ...c.headline, en: e.target.value } }))} placeholder={productName.en} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{language === 'ar' ? 'العنوان الفرعي (عربي)' : 'Subheadline (AR)'}</Label>
                                    <Textarea value={content.subheadline.ar} onChange={e => setContent(c => ({ ...c, subheadline: { ...c.subheadline, ar: e.target.value } }))} rows={2} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{language === 'ar' ? 'العنوان الفرعي (انجليزي)' : 'Subheadline (EN)'}</Label>
                                    <Textarea value={content.subheadline.en} onChange={e => setContent(c => ({ ...c, subheadline: { ...c.subheadline, en: e.target.value } }))} rows={2} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{language === 'ar' ? 'نص زر الطلب (عربي)' : 'CTA Button Text (AR)'}</Label>
                                    <Input value={content.cta_text.ar} onChange={e => setContent(c => ({ ...c, cta_text: { ...c.cta_text, ar: e.target.value } }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{language === 'ar' ? 'نص زر الطلب (انجليزي)' : 'CTA Button Text (EN)'}</Label>
                                    <Input value={content.cta_text.en} onChange={e => setContent(c => ({ ...c, cta_text: { ...c.cta_text, en: e.target.value } }))} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg">{language === 'ar' ? 'المميزات والفوائد' : 'Benefits & Features'}</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addBenefit}><Plus className="w-4 h-4 me-1" /> {language === 'ar' ? 'إضافة' : 'Add'}</Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {content.benefits.map((b, i) => (
                                <div key={i} className="flex gap-2 items-start bg-muted/30 p-3 rounded-lg border border-border/50">
                                    <div className="flex-1 space-y-2">
                                        <Input value={b.ar} onChange={e => updateBenefit(i, 'ar', e.target.value)} placeholder="ميزة بالعربي" />
                                        <Input value={b.en} onChange={e => updateBenefit(i, 'en', e.target.value)} placeholder="Feature in English" />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeBenefit(i)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{language === 'ar' ? 'القالب والتصميم' : 'Template & Style'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>{language === 'ar' ? 'اختر القالب' : 'Choose Template'}</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['trust', 'hype', 'elegant'] as LandingTemplate[]).map(t => (
                                        <button key={t} type="button" onClick={() => setTemplate(t)} className={cn("p-2 text-xs rounded-lg border-2 transition-all", template === t ? "border-primary bg-primary/5 font-bold" : "border-transparent bg-muted hover:bg-muted/80")}>
                                            {t.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{language === 'ar' ? 'اللون الأساسي' : 'Accent Color'}</Label>
                                <div className="flex gap-2">
                                    <Input type="color" value={content.accent_color} onChange={e => setContent(c => ({ ...c, accent_color: e.target.value }))} className="w-12 h-10 p-1" />
                                    <Input value={content.accent_color} onChange={e => setContent(c => ({ ...c, accent_color: e.target.value }))} className="font-mono" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{language === 'ar' ? 'روابط الوصول' : 'Links'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="p-3 bg-muted rounded-lg break-all">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{language === 'ar' ? 'الرابط المباشر' : 'Direct Link'}</p>
                                <a href={subdomainUrl} target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1">
                                    {subdomainUrl} <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                            <Button type="button" variant="outline" className="w-full" onClick={() => setShowPreview(true)}>
                                <Eye className="w-4 h-4 me-2" /> {language === 'ar' ? 'معاينة سريعة' : 'Quick Preview'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t sticky bottom-0 bg-background py-4">
                <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'تذكر حفظ التعديلات لاعتمادها في الرابط المباشر' : 'Remember to save changes to apply them to the live link.'}
                </p>
                <div className="flex gap-2">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="text-[10px] text-muted-foreground opacity-30 hover:opacity-100"
                        onClick={(e) => { e.preventDefault(); window.open(fallbackUrl, '_blank'); }}
                    >
                        {language === 'ar' ? 'رابط داخلي (للتجربة)' : 'Internal Link (Debug)'}
                    </Button>

                    <Button 
                        type="button" 
                        size="sm" 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSave(); }} 
                        disabled={saving}
                    >
                        {saving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : 
                         saveStatus === 'success' ? (language === 'ar' ? 'تم الحفظ!' : 'Saved!') : 
                         (language === 'ar' ? 'حفظ' : 'Save')}
                    </Button>
                </div>
            </div>
        </div>
    );
}

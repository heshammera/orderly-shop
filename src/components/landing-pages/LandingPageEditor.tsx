"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ExternalLink, Lock, Loader2, Plus, Trash2, Save, Eye, Zap, Crown, Shield } from 'lucide-react';
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

const TEMPLATES: { id: LandingTemplate; labelAr: string; labelEn: string; descAr: string; descEn: string; icon: React.ReactNode; color: string }[] = [
    {
        id: 'hype',
        labelAr: 'هايب (ديناميكي)',
        labelEn: 'Hype (Dynamic)',
        descAr: 'أسود مع ألوان نيون — مثالي للتقنية والرياضة والألعاب',
        descEn: 'Dark neon — ideal for tech, sports & gaming',
        icon: <Zap className="w-5 h-5" />,
        color: '#8B5CF6',
    },
    {
        id: 'elegant',
        labelAr: 'إليغانت (فاخر)',
        labelEn: 'Elegant (Luxury)',
        descAr: 'أبيض وذهبي — مثالي للعطور والموضة والفاخر',
        descEn: 'White & gold — ideal for perfumes, fashion & luxury',
        icon: <Crown className="w-5 h-5" />,
        color: '#B8860B',
    },
    {
        id: 'trust',
        labelAr: 'تراست (ثقة)',
        labelEn: 'Trust (Confidence)',
        descAr: 'أزرق هادئ مع social proof — مثالي للمنتجات العامة',
        descEn: 'Blue with social proof — ideal for general products',
        icon: <Shield className="w-5 h-5" />,
        color: '#2563EB',
    },
];

const DEFAULT_CONTENT = {
    headline: { ar: '', en: '' },
    subheadline: { ar: '', en: '' },
    cta_text: { ar: 'اطلب الآن 🚀', en: 'Order Now 🚀' },
    benefits: [
        { ar: 'جودة عالية مضمونة', en: 'Guaranteed high quality' },
        { ar: 'شحن سريع لباب منزلك', en: 'Fast delivery to your door' },
        { ar: 'ضمان استرداد المال', en: 'Money-back guarantee' },
    ],
    guarantee_text: { ar: 'نضمن رضاك التام أو نسترد أموالك كاملة خلال 14 يوم', en: 'We guarantee your full satisfaction or a complete refund within 14 days' },
    testimonials: [
        { name: 'محمد أحمد', text: { ar: 'منتج رائع، استلمته سريعاً وكان بالضبط كما هو موضح', en: 'Great product, received it quickly, exactly as described' }, rating: 5 },
        { name: 'سارة علي', text: { ar: 'جودة ممتازة وخدمة رائعة، سأشتري مرة أخرى بالتأكيد', en: 'Excellent quality and great service, will definitely buy again' }, rating: 5 },
    ],
    hero_image: '',
    accent_color: '#8B5CF6',
};

export function LandingPageEditor({
    productId, storeId, storeSlug,
    productName, productPrice, productSalePrice, productImages, productCurrency,
    canUseLandingPages,
}: LandingPageEditorProps) {
    const { language } = useLanguage();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [landingPageId, setLandingPageId] = useState<string | null>(null);

    const [template, setTemplate] = useState<LandingTemplate>('hype');
    const [isEnabled, setIsEnabled] = useState(false);
    const [isStandalone, setIsStandalone] = useState(true);
    const [content, setContent] = useState(DEFAULT_CONTENT);

    // Load existing landing page data
    useEffect(() => {
        if (!productId || !canUseLandingPages) { setLoading(false); return; }
        const load = async () => {
            const { data } = await supabase
                .from('product_landing_pages')
                .select('*')
                .eq('product_id', productId)
                .maybeSingle();
            if (data) {
                setLandingPageId(data.id);
                setTemplate(data.template || 'hype');
                setIsEnabled(data.is_enabled || false);
                setIsStandalone(data.is_standalone ?? true);
                setContent({ ...DEFAULT_CONTENT, ...(data.content || {}) });
            }
            setLoading(false);
        };
        load();
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
        } catch (e: any) {
            toast.error(e.message);
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

    // The public URL shown to the merchant uses the subdomain format.
    // The middleware rewrites: tenant.orderlyshops.com/lp/{id} → /s/tenant/lp/{id} internally.
    const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://orderlyshops.com';
    const siteHost = typeof window !== 'undefined' ? (() => { try { return new URL(SITE_BASE).hostname; } catch { return 'orderlyshops.com'; } })() : 'orderlyshops.com';
    const subdomainUrl = `https://${storeSlug}.${siteHost}/lp/${productId}`;
    // Internal fallback path (for localhost / main domain access)
    const internalUrl = `/s/${storeSlug}/lp/${productId}`;

    // Locked state for non-paying plans
    if (!canUseLandingPages) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Lock className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">{language === 'ar' ? 'صفحات الهبوط — ميزة مدفوعة' : 'Landing Pages — Paid Feature'}</h3>
                <p className="text-muted-foreground max-w-md text-sm">
                    {language === 'ar'
                        ? 'قم بترقية باقتك للوصول لميزة صفحات الهبوط المخصصة وزيادة مبيعاتك بشكل كبير'
                        : 'Upgrade your plan to access custom landing pages and significantly boost your sales'}
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

    // Preview mode
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
            {/* Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Switch checked={isEnabled} onCheckedChange={setIsEnabled} id="lp-enabled" />
                    <Label htmlFor="lp-enabled" className="font-medium cursor-pointer">
                        {isEnabled
                            ? (language === 'ar' ? '✅ صفحة الهبوط مفعّلة' : '✅ Landing Page Active')
                            : (language === 'ar' ? '⭕ صفحة الهبوط معطّلة' : '⭕ Landing Page Disabled')}
                    </Label>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                        <Eye className="w-4 h-4 me-1" />
                        {language === 'ar' ? 'معاينة' : 'Preview'}
                    </Button>
                    {landingPageId && isEnabled && (
                        <a href={subdomainUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                                <ExternalLink className="w-4 h-4 me-1" />
                                {language === 'ar' ? 'فتح الرابط' : 'Open Link'}
                            </Button>
                        </a>
                    )}
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 me-1 animate-spin" /> : <Save className="w-4 h-4 me-1" />}
                        {language === 'ar' ? 'حفظ' : 'Save'}
                    </Button>
                </div>
            </div>

            {/* Link display — shows subdomain URL */}
            {landingPageId && isEnabled && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg space-y-1">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                        {language === 'ar' ? '🔗 رابط صفحة الهبوط' : '🔗 Landing Page URL'}
                    </p>
                    <div className="flex items-center gap-2">
                        <code className="text-green-700 dark:text-green-400 flex-1 break-all text-xs font-mono">{subdomainUrl}</code>
                        <button
                            type="button"
                            onClick={() => { navigator.clipboard.writeText(subdomainUrl); toast.success(language === 'ar' ? 'تم نسخ الرابط!' : 'Link copied!'); }}
                            className="flex-shrink-0 text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 transition-colors"
                        >
                            {language === 'ar' ? 'نسخ' : 'Copy'}
                        </button>
                    </div>
                </div>
            )}

            {/* Template Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{language === 'ar' ? '🎨 اختر القالب' : '🎨 Choose Template'}</CardTitle>
                    <CardDescription>{language === 'ar' ? 'اختر التصميم المناسب لمنتجك' : 'Choose the design that fits your product'}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {TEMPLATES.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => { setTemplate(t.id); setContent(c => ({ ...c, accent_color: t.color })); }}
                                className={`p-4 rounded-xl border-2 text-start transition-all hover:shadow-md ${template === t.id ? 'border-primary shadow-sm' : 'border-border hover:border-primary/50'}`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 rounded-lg text-white" style={{ background: t.color }}>{t.icon}</div>
                                    <span className="font-bold text-sm">{language === 'ar' ? t.labelAr : t.labelEn}</span>
                                    {template === t.id && <Badge className="ms-auto text-xs px-1.5">✓</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground">{language === 'ar' ? t.descAr : t.descEn}</p>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Standalone switch */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-sm">{language === 'ar' ? 'صفحة مستقلة (بدون header/footer المتجر)' : 'Standalone Page (no store header/footer)'}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{language === 'ar' ? 'تفعّل هذا لصفحات الحملات الإعلانية المنفصلة' : 'Enable for standalone ad campaign pages'}</p>
                        </div>
                        <Switch checked={isStandalone} onCheckedChange={setIsStandalone} />
                    </div>
                </CardContent>
            </Card>

            {/* Accent Color */}
            <Card>
                <CardHeader><CardTitle className="text-base">{language === 'ar' ? '🎨 لون القالب' : '🎨 Template Color'}</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <input type="color" value={content.accent_color || '#8B5CF6'} onChange={e => setContent(c => ({ ...c, accent_color: e.target.value }))} className="h-10 w-20 rounded cursor-pointer border" />
                        <p className="text-xs text-muted-foreground">{language === 'ar' ? 'اختر اللون الأساسي للقالب' : 'Pick the primary template color'}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Hero Content */}
            <Card>
                <CardHeader><CardTitle className="text-base">{language === 'ar' ? '✍️ المحتوى الرئيسي' : '✍️ Main Content'}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs">{language === 'ar' ? 'العنوان الرئيسي (عربي)' : 'Headline (Arabic)'}</Label>
                            <Input value={content.headline.ar} onChange={e => setContent(c => ({ ...c, headline: { ...c.headline, ar: e.target.value } }))} placeholder={productName.ar} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">{language === 'ar' ? 'العنوان الرئيسي (إنجليزي)' : 'Headline (English)'}</Label>
                            <Input value={content.headline.en} onChange={e => setContent(c => ({ ...c, headline: { ...c.headline, en: e.target.value } }))} placeholder={productName.en} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">{language === 'ar' ? 'العنوان الفرعي (عربي)' : 'Subheadline (Arabic)'}</Label>
                            <Textarea rows={2} value={content.subheadline.ar} onChange={e => setContent(c => ({ ...c, subheadline: { ...c.subheadline, ar: e.target.value } }))} placeholder={language === 'ar' ? 'جملة تسويقية جذابة...' : 'Catchy marketing phrase...'} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">{language === 'ar' ? 'العنوان الفرعي (إنجليزي)' : 'Subheadline (English)'}</Label>
                            <Textarea rows={2} value={content.subheadline.en} onChange={e => setContent(c => ({ ...c, subheadline: { ...c.subheadline, en: e.target.value } }))} placeholder="Catchy marketing phrase..." />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">{language === 'ar' ? 'نص زر الشراء (عربي)' : 'CTA Button (Arabic)'}</Label>
                            <Input value={content.cta_text.ar} onChange={e => setContent(c => ({ ...c, cta_text: { ...c.cta_text, ar: e.target.value } }))} placeholder="اطلب الآن 🚀" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">{language === 'ar' ? 'نص زر الشراء (إنجليزي)' : 'CTA Button (English)'}</Label>
                            <Input value={content.cta_text.en} onChange={e => setContent(c => ({ ...c, cta_text: { ...c.cta_text, en: e.target.value } }))} placeholder="Order Now 🚀" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">{language === 'ar' ? 'رابط صورة مخصصة (Hero Image) — اتركه فارغاً لاستخدام صورة المنتج' : 'Custom hero image URL — leave empty to use product image'}</Label>
                        <Input value={content.hero_image} onChange={e => setContent(c => ({ ...c, hero_image: e.target.value }))} placeholder="https://..." />
                    </div>
                </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{language === 'ar' ? '✅ المميزات والفوائد' : '✅ Benefits'}</CardTitle>
                        <Button variant="outline" size="sm" onClick={addBenefit}><Plus className="w-3 h-3 me-1" />{language === 'ar' ? 'إضافة' : 'Add'}</Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {content.benefits.map((b, i) => (
                        <div key={i} className="flex gap-2 items-start">
                            <div className="flex-1 grid grid-cols-2 gap-2">
                                <Input placeholder={language === 'ar' ? 'ميزة (عربي)' : 'Benefit (Arabic)'} value={b.ar} onChange={e => updateBenefit(i, 'ar', e.target.value)} className="text-xs h-8" />
                                <Input placeholder="Benefit (English)" value={b.en} onChange={e => updateBenefit(i, 'en', e.target.value)} className="text-xs h-8" />
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive flex-shrink-0" onClick={() => removeBenefit(i)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Guarantee */}
            <Card>
                <CardHeader><CardTitle className="text-base">{language === 'ar' ? '🛡️ نص الضمان' : '🛡️ Guarantee Text'}</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Textarea rows={3} placeholder={language === 'ar' ? 'نص الضمان بالعربية...' : 'Guarantee in Arabic...'} value={content.guarantee_text.ar} onChange={e => setContent(c => ({ ...c, guarantee_text: { ...c.guarantee_text, ar: e.target.value } }))} />
                    <Textarea rows={3} placeholder="Guarantee in English..." value={content.guarantee_text.en} onChange={e => setContent(c => ({ ...c, guarantee_text: { ...c.guarantee_text, en: e.target.value } }))} />
                </CardContent>
            </Card>

            {/* Testimonials */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{language === 'ar' ? '⭐ تقييمات العملاء' : '⭐ Testimonials'}</CardTitle>
                        <Button variant="outline" size="sm" onClick={addTestimonial}><Plus className="w-3 h-3 me-1" />{language === 'ar' ? 'إضافة' : 'Add'}</Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {content.testimonials.map((t, i) => (
                        <div key={i} className="p-3 border rounded-lg space-y-2">
                            <div className="flex gap-2 items-center">
                                <Input placeholder={language === 'ar' ? 'اسم العميل' : 'Customer name'} value={t.name} onChange={e => updateTestimonial(i, 'name', e.target.value)} className="text-xs h-8 flex-1" />
                                <select value={t.rating} onChange={e => updateTestimonial(i, 'rating', Number(e.target.value))} className="h-8 px-2 rounded border text-xs bg-background">
                                    {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} ★</option>)}
                                </select>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive flex-shrink-0" onClick={() => removeTestimonial(i)}><Trash2 className="w-3 h-3" /></Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Input placeholder={language === 'ar' ? 'التقييم (عربي)' : 'Review (Arabic)'} value={t.text.ar} onChange={e => updateTestimonial(i, 'text_ar', e.target.value)} className="text-xs h-8" />
                                <Input placeholder="Review (English)" value={t.text.en} onChange={e => updateTestimonial(i, 'text_en', e.target.value)} className="text-xs h-8" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end pb-4">
                <Button onClick={handleSave} disabled={saving} size="lg">
                    {saving ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Save className="w-4 h-4 me-2" />}
                    {language === 'ar' ? 'حفظ صفحة الهبوط' : 'Save Landing Page'}
                </Button>
            </div>
        </div>
    );
}

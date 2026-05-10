"use client";

import { useState, useEffect, useMemo } from 'react';
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

    // Stable Load Logic
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
                    // Merge content carefully
                    setContent(prev => ({ 
                        ...DEFAULT_CONTENT, 
                        ...(data.content || {}),
                        headline: { ...DEFAULT_CONTENT.headline, ...(data.content?.headline || {}) },
                        subheadline: { ...DEFAULT_CONTENT.subheadline, ...(data.content?.subheadline || {}) },
                        cta_text: { ...DEFAULT_CONTENT.cta_text, ...(data.content?.cta_text || {}) },
                        guarantee_text: { ...DEFAULT_CONTENT.guarantee_text, ...(data.content?.guarantee_text || {}) }
                    }));
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
        setSaveStatus('idle');
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
        } finally {
            setSaving(false);
        }
    };

    // Helper functions
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

    // URLs (Stable calculation)
    const [subdomainUrl, setSubdomainUrl] = useState('');
    const [fallbackUrl, setFallbackUrl] = useState('');

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const host = window.location.host; // e.g. "mais.orderlyshops.com" or "admin.orderlyshops.com"
        const parts = host.split('.');
        
        let baseDomain = host;
        // If we have at least 3 parts (sub.domain.tld), the last two are the base domain
        if (parts.length >= 3) {
            baseDomain = parts.slice(-2).join('.');
        }

        const base = `${window.location.protocol}//${storeSlug.toLowerCase()}.${baseDomain}/lp/${productId}`;
        setSubdomainUrl(base);
        setFallbackUrl(`${window.location.protocol}//${host}/s/${storeSlug}/lp/${productId}?preview=true`);
    }, [storeSlug, productId]);

    if (!canUseLandingPages) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{language === 'ar' ? 'صفحات الهبوط — ميزة مدفوعة' : 'Landing Pages — Paid Feature'}</h3>
                <p className="text-muted-foreground max-w-md text-sm">
                    {language === 'ar' ? 'قم بترقية باقتك للوصول لميزة صفحات الهبوط المخصصة وزيادة مبيعاتك بشكل كبير' : 'Upgrade your plan to access custom landing pages and significantly boost your sales'}
                </p>
            </div>
        );
    }

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-primary" /></div>;

    if (showPreview) {
        return (
            <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg">
                    <Button variant="outline" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPreview(false); }}>
                        {language === 'ar' ? '← رجوع للمحرر' : '← Back to Editor'}
                    </Button>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">{language === 'ar' ? 'وضع المعاينة' : 'Preview Mode'}</Badge>
                </div>
                <div className="border rounded-2xl shadow-2xl overflow-hidden bg-white" style={{ height: '75vh' }}>
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
        <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Enable Toggle */}
            <div className="flex items-center justify-between bg-primary/5 p-6 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl transition-colors shadow-sm", isEnabled ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500")}>
                        <ExternalLink className="w-6 h-6" />
                    </div>
                    <div>
                        <Label htmlFor="lp-enabled" className="text-lg font-black block mb-1">
                            {language === 'ar' ? 'تفعيل صفحة الهبوط للمنتج' : 'Enable Product Landing Page'}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            {language === 'ar' ? 'سيتم توجيه العملاء لصفحة مبيعات احترافية تزيد من معدل التحويل' : 'Customers will be routed to a high-converting professional sales page.'}
                        </p>
                    </div>
                </div>
                <Switch checked={isEnabled} onCheckedChange={setIsEnabled} id="lp-enabled" className="scale-125" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form Sections */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Basic Content */}
                    <Card className="border-none shadow-sm bg-muted/20">
                        <CardHeader className="border-b bg-white/50 rounded-t-xl">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Layout className="w-5 h-5 text-primary" />
                                {language === 'ar' ? 'المحتوى والنصوص الأساسية' : 'Main Content & Texts'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6 bg-white/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="font-bold">{language === 'ar' ? 'العنوان الرئيسي (عربي)' : 'Headline (AR)'}</Label>
                                    <Input value={content.headline.ar} onChange={e => setContent(c => ({ ...c, headline: { ...c.headline, ar: e.target.value } }))} placeholder={productName.ar} className="bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold">{language === 'ar' ? 'العنوان الرئيسي (انجليزي)' : 'Headline (EN)'}</Label>
                                    <Input value={content.headline.en} onChange={e => setContent(c => ({ ...c, headline: { ...c.headline, en: e.target.value } }))} placeholder={productName.en} className="bg-white" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="font-bold">{language === 'ar' ? 'العنوان الفرعي (عربي)' : 'Subheadline (AR)'}</Label>
                                    <Textarea value={content.subheadline.ar} onChange={e => setContent(c => ({ ...c, subheadline: { ...c.subheadline, ar: e.target.value } }))} rows={3} className="bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold">{language === 'ar' ? 'العنوان الفرعي (انجليزي)' : 'Subheadline (EN)'}</Label>
                                    <Textarea value={content.subheadline.en} onChange={e => setContent(c => ({ ...c, subheadline: { ...c.subheadline, en: e.target.value } }))} rows={3} className="bg-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hero Image Section */}
                    <Card className="border-none shadow-sm bg-muted/20">
                        <CardHeader className="border-b bg-white/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-primary" />
                                {language === 'ar' ? 'الصورة المميزة' : 'Hero Image'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ImageUpload 
                                storeId={storeId}
                                value={content.hero_image ? [content.hero_image] : []}
                                onChange={(urls) => setContent(c => ({ ...c, hero_image: urls[0] || '' }))}
                                maxImages={1}
                            />
                            <p className="text-[10px] text-muted-foreground mt-2">{language === 'ar' ? 'اتركها فارغة لاستخدام صورة المنتج الأساسية' : 'Leave empty to use the main product image.'}</p>
                        </CardContent>
                    </Card>

                    {/* Benefits & Features */}
                    <Card className="border-none shadow-sm bg-muted/20">
                        <CardHeader className="flex flex-row items-center justify-between border-b bg-white/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Zap className="w-5 h-5 text-primary" />
                                {language === 'ar' ? 'المميزات والفوائد' : 'Benefits & Features'}
                            </CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={(e) => { e.preventDefault(); addBenefit(); }} className="bg-white">
                                <Plus className="w-4 h-4 me-1" /> {language === 'ar' ? 'إضافة ميزة' : 'Add Feature'}
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            {content.benefits.map((b, i) => (
                                <div key={i} className="flex gap-3 items-start bg-white p-4 rounded-xl border border-border shadow-sm group">
                                    <div className="flex-1 space-y-3">
                                        <Input value={b.ar} onChange={e => updateBenefit(i, 'ar', e.target.value)} placeholder="الميزة بالعربي" className="border-none bg-muted/30 focus-visible:ring-1" />
                                        <Input value={b.en} onChange={e => updateBenefit(i, 'en', e.target.value)} placeholder="Feature in English" className="border-none bg-muted/30 focus-visible:ring-1" />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeBenefit(i)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Testimonials */}
                    <Card className="border-none shadow-sm bg-muted/20">
                        <CardHeader className="flex flex-row items-center justify-between border-b bg-white/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                {language === 'ar' ? 'آراء العملاء' : 'Testimonials'}
                            </CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={(e) => { e.preventDefault(); addTestimonial(); }} className="bg-white">
                                <Plus className="w-4 h-4 me-1" /> {language === 'ar' ? 'إضافة رأي' : 'Add Review'}
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            {content.testimonials.map((t, i) => (
                                <div key={i} className="bg-white p-5 rounded-xl border border-border shadow-sm space-y-4 relative group">
                                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 left-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeTestimonial(i)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs">{language === 'ar' ? 'اسم العميل' : 'Customer Name'}</Label>
                                            <Input value={t.name} onChange={e => updateTestimonial(i, 'name', e.target.value)} className="bg-muted/20" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">{language === 'ar' ? 'التقييم' : 'Rating'}</Label>
                                            <div className="flex gap-1 mt-2">
                                                {[1,2,3,4,5].map(s => (
                                                    <Star key={s} className={cn("w-5 h-5 cursor-pointer transition-all", s <= t.rating ? "fill-yellow-500 text-yellow-500 scale-110" : "text-gray-300")} onClick={() => updateTestimonial(i, 'rating', s)} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">{language === 'ar' ? 'التعليق (عربي)' : 'Review (AR)'}</Label>
                                        <Input value={t.text.ar} onChange={e => updateTestimonial(i, 'text_ar', e.target.value)} className="bg-muted/20" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">{language === 'ar' ? 'التعليق (انجليزي)' : 'Review (EN)'}</Label>
                                        <Input value={t.text.en} onChange={e => updateTestimonial(i, 'text_en', e.target.value)} className="bg-muted/20" />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Guarantee / Policy */}
                    <Card className="border-none shadow-sm bg-muted/20">
                        <CardHeader className="border-b bg-white/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-green-600" />
                                {language === 'ar' ? 'سياسة الضمان والاسترجاع' : 'Guarantee & Return Policy'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="font-bold">{language === 'ar' ? 'نص الضمان (عربي)' : 'Guarantee Text (AR)'}</Label>
                                    <Textarea value={content.guarantee_text.ar} onChange={e => setContent(c => ({ ...c, guarantee_text: { ...c.guarantee_text, ar: e.target.value } }))} rows={2} className="bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold">{language === 'ar' ? 'نص الضمان (انجليزي)' : 'Guarantee Text (EN)'}</Label>
                                    <Textarea value={content.guarantee_text.en} onChange={e => setContent(c => ({ ...c, guarantee_text: { ...c.guarantee_text, en: e.target.value } }))} rows={2} className="bg-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Settings & Links */}
                <div className="space-y-8">
                    <Card className="border-none shadow-lg bg-white overflow-hidden">
                        <CardHeader className="bg-primary text-white">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Palette className="w-5 h-5" />
                                {language === 'ar' ? 'التنسيق' : 'Style Settings'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-3">
                                <Label className="font-bold">{language === 'ar' ? 'اختر قالب التصميم' : 'Select Template'}</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {(['trust', 'hype', 'elegant'] as LandingTemplate[]).map(t => (
                                        <button 
                                            key={t} 
                                            type="button" 
                                            onClick={() => setTemplate(t)} 
                                            className={cn(
                                                "p-4 text-sm rounded-xl border-2 transition-all flex items-center justify-between", 
                                                template === t ? "border-primary bg-primary/5 font-black ring-2 ring-primary/20 scale-[1.02]" : "border-muted bg-white hover:border-primary/30"
                                            )}
                                        >
                                            <span className="capitalize">{t}</span>
                                            {template === t && <Check className="w-4 h-4 text-primary" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <Label className="font-bold">{language === 'ar' ? 'لون التفاعل الأساسي' : 'Accent Color'}</Label>
                                <div className="flex gap-3">
                                    <Input type="color" value={content.accent_color} onChange={e => setContent(c => ({ ...c, accent_color: e.target.value }))} className="w-16 h-12 p-1 rounded-lg cursor-pointer" />
                                    <Input value={content.accent_color} onChange={e => setContent(c => ({ ...c, accent_color: e.target.value }))} className="font-mono h-12" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-white">
                        <CardHeader className="border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Settings2 className="w-5 h-5 text-primary" />
                                {language === 'ar' ? 'روابط الوصول' : 'Access Links'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="p-4 bg-muted/50 rounded-xl border border-dashed border-primary/30 break-all space-y-2">
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{language === 'ar' ? 'رابط الصفحة المباشر' : 'Live Landing Page'}</p>
                                <a href={subdomainUrl} target="_blank" className="text-sm text-primary font-bold hover:underline flex items-center gap-2 group">
                                    {subdomainUrl} 
                                    <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                </a>
                            </div>
                            
                            <div className="space-y-2">
                                <Button type="button" variant="outline" className="w-full h-12 text-md font-bold shadow-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPreview(true); }}>
                                    <Eye className="w-5 h-5 me-2 text-primary" /> {language === 'ar' ? 'معاينة القالب' : 'Live Preview'}
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="w-full text-[10px] text-muted-foreground opacity-40 hover:opacity-100"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(fallbackUrl, '_blank'); }}
                                >
                                    {language === 'ar' ? 'فتح الرابط البديل (للتجربة)' : 'Open Alternative Link (Debug)'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Sticky Footer Actions */}
            <div className="flex items-center justify-between pt-6 border-t sticky bottom-0 bg-white/95 backdrop-blur-md py-6 px-4 -mx-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-20 rounded-b-2xl">
                <p className="text-sm text-muted-foreground font-medium hidden md:block">
                    {language === 'ar' ? '✨ سيتم تحديث الصفحة فور الضغط على زر الحفظ' : '✨ Page updates instantly after clicking save.'}
                </p>
                <div className="flex gap-4 w-full md:w-auto">
                    <Button 
                        type="button" 
                        size="lg"
                        className={cn(
                            "flex-1 md:w-48 h-12 text-md font-black shadow-lg transition-all",
                            saveStatus === 'success' ? "bg-green-600 hover:bg-green-700 scale-105" : "bg-primary hover:bg-primary/90"
                        )}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSave(); }} 
                        disabled={saving}
                    >
                        {saving ? (
                            <><Loader2 className="w-5 h-5 me-2 animate-spin" /> {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</>
                        ) : saveStatus === 'success' ? (
                            <><Check className="w-5 h-5 me-2" /> {language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved Successfully!'}</>
                        ) : (
                            <><Save className="w-5 h-5 me-2" /> {language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

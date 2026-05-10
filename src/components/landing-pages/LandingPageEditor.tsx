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

    useEffect(() => {
        if (!productId || !canUseLandingPages) { setLoading(false); return; }
        let isMounted = true;
        const load = async () => {
            try {
                const { data } = await supabase.from('product_landing_pages').select('*').eq('product_id', productId).maybeSingle();
                if (data && isMounted) {
                    setLandingPageId(data.id);
                    setTemplate(data.template || 'hype');
                    setIsEnabled(data.is_enabled || false);
                    setIsStandalone(data.is_standalone ?? true);
                    const mergedContent = { 
                        ...DEFAULT_CONTENT, 
                        ...(data.content || {}),
                        headline: { ...DEFAULT_CONTENT.headline, ...(data.content?.headline || {}) },
                        subheadline: { ...DEFAULT_CONTENT.subheadline, ...(data.content?.subheadline || {}) },
                        cta_text: { ...DEFAULT_CONTENT.cta_text, ...(data.content?.cta_text || {}) },
                        guarantee_text: { ...DEFAULT_CONTENT.guarantee_text, ...(data.content?.guarantee_text || {}) }
                    };
                    setContent(mergedContent);
                }
            } catch (e) { console.error(e); } finally { if (isMounted) setLoading(false); }
        };
        load();
        return () => { isMounted = false; };
    }, [productId, canUseLandingPages]);

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        setSaveStatus('idle');
        try {
            const payload = { product_id: productId, store_id: storeId, template, is_enabled: isEnabled, is_standalone: isStandalone, content };
            if (landingPageId) {
                await supabase.from('product_landing_pages').update(payload).eq('id', landingPageId);
            } else {
                const { data } = await supabase.from('product_landing_pages').insert(payload).select().single();
                if (data) setLandingPageId(data.id);
            }
            toast.success(language === 'ar' ? '✅ تم حفظ التعديلات' : '✅ Changes saved');
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (e: any) {
            toast.error(e.message);
            setSaveStatus('error');
        } finally { setSaving(false); }
    };

    // Stabilize product data to prevent re-render loops
    const stableProduct = useMemo(() => ({
        name: productName,
        price: productPrice,
        sale_price: productSalePrice,
        currency: productCurrency,
        images: productImages
    }), [productName, productPrice, productSalePrice, productCurrency, productImages]);

    // Stabilize content data
    const stableContent = useMemo(() => content, [content]);

    let subdomainUrl = '';
    if (typeof window !== 'undefined') {
        const host = window.location.host;
        const baseDomain = host.includes('.') ? host.split('.').slice(-2).join('.') : host;
        subdomainUrl = `${window.location.protocol}//${storeSlug.toLowerCase()}.${baseDomain}/lp/${productId}`;
    }

    if (!canUseLandingPages) return <div className="py-20 text-center space-y-4"><Lock className="mx-auto w-12 h-12 opacity-20" /><h3 className="text-xl font-bold">{language === 'ar' ? 'ميزة مدفوعة' : 'Paid Feature'}</h3></div>;
    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-primary" /></div>;

    if (showPreview) {
        return (
            <div className="space-y-4 animate-in fade-in duration-300">
                <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>{language === 'ar' ? '← رجوع للمحرر' : '← Back to Editor'}</Button>
                <div className="border rounded-2xl shadow-2xl overflow-hidden bg-white" style={{ height: '75vh' }}>
                    <LandingPageRenderer 
                        template={template} 
                        content={stableContent} 
                        product={stableProduct} 
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
        <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[85vh] overflow-y-auto px-1">
            <div className="flex items-center justify-between bg-primary/5 p-6 rounded-2xl border border-primary/10 sticky top-0 z-30 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl shadow-sm transition-colors", isEnabled ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400")}><ExternalLink className="w-6 h-6" /></div>
                    <div>
                        <Label className="text-lg font-black block mb-1">{language === 'ar' ? 'تفعيل صفحة الهبوط' : 'Enable Landing Page'}</Label>
                        <p className="text-xs text-muted-foreground">{language === 'ar' ? 'حول منتجك لصفحة بيع احترافية' : 'Transform your product into a professional sales page'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Switch checked={isEnabled} onCheckedChange={setIsEnabled} className="scale-125" />
                    <Button size="lg" onClick={handleSave} disabled={saving} className={cn("font-black shadow-lg", saveStatus === 'success' ? "bg-green-600 hover:bg-green-700" : "")}>
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saveStatus === 'success' ? <Check className="w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                        {saveStatus === 'success' ? (language === 'ar' ? 'تم الحفظ' : 'Saved') : (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-none shadow-sm bg-muted/20">
                        <CardHeader className="border-b bg-white/50"><CardTitle className="text-lg flex items-center gap-2"><Layout className="w-5 h-5 text-primary" /> {language === 'ar' ? 'المحتوى والنصوص' : 'Content & Texts'}</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="font-bold">{language === 'ar' ? 'العنوان الرئيسي (AR)' : 'Headline (AR)'}</Label>
                                    <Input value={content.headline.ar} onChange={e => setContent(c => ({ ...c, headline: { ...c.headline, ar: e.target.value } }))} placeholder={productName.ar} className="bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold">{language === 'ar' ? 'العنوان الرئيسي (EN)' : 'Headline (EN)'}</Label>
                                    <Input value={content.headline.en} onChange={e => setContent(c => ({ ...c, headline: { ...c.headline, en: e.target.value } }))} placeholder={productName.en} className="bg-white" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="font-bold">{language === 'ar' ? 'العنوان الفرعي (AR)' : 'Subheadline (AR)'}</Label>
                                    <Textarea value={content.subheadline.ar} onChange={e => setContent(c => ({ ...c, subheadline: { ...c.subheadline, ar: e.target.value } }))} rows={2} className="bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold">{language === 'ar' ? 'العنوان الفرعي (EN)' : 'Subheadline (EN)'}</Label>
                                    <Textarea value={content.subheadline.en} onChange={e => setContent(c => ({ ...c, subheadline: { ...c.subheadline, en: e.target.value } }))} rows={2} className="bg-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-muted/20">
                        <CardHeader className="border-b bg-white/50"><CardTitle className="text-lg flex items-center gap-2"><ImageIcon className="w-5 h-5 text-primary" /> {language === 'ar' ? 'الصورة المميزة' : 'Hero Image'}</CardTitle></CardHeader>
                        <CardContent className="pt-6">
                            <ImageUpload value={content.hero_image ? [content.hero_image] : []} onChange={urls => setContent(c => ({ ...c, hero_image: urls[urls.length-1] || '' }))} onRemove={() => setContent(c => ({ ...c, hero_image: '' }))} />
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-muted/20">
                        <CardHeader className="flex flex-row justify-between items-center border-b bg-white/50"><CardTitle className="text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> {language === 'ar' ? 'المميزات' : 'Features'}</CardTitle><Button type="button" variant="outline" size="sm" onClick={() => setContent(c => ({ ...c, benefits: [...c.benefits, { ar: '', en: '' }] }))} className="bg-white"><Plus className="w-4 h-4" /></Button></CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            {content.benefits.map((b, i) => (
                                <div key={i} className="flex gap-3 bg-white p-4 rounded-xl border group">
                                    <div className="flex-1 space-y-3"><Input value={b.ar} onChange={e => { const nb = [...content.benefits]; nb[i].ar = e.target.value; setContent(c => ({ ...c, benefits: nb })); }} placeholder="AR" className="bg-muted/10 border-none" /><Input value={b.en} onChange={e => { const nb = [...content.benefits]; nb[i].en = e.target.value; setContent(c => ({ ...c, benefits: nb })); }} placeholder="EN" className="bg-muted/10 border-none" /></div>
                                    <Button variant="ghost" size="icon" onClick={() => setContent(c => ({ ...c, benefits: c.benefits.filter((_, idx) => idx !== i) }))} className="text-destructive opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-muted/20">
                        <CardHeader className="flex flex-row justify-between items-center border-b bg-white/50"><CardTitle className="text-lg flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> {language === 'ar' ? 'آراء العملاء' : 'Testimonials'}</CardTitle><Button type="button" variant="outline" size="sm" onClick={() => setContent(c => ({ ...c, testimonials: [...c.testimonials, { name: '', text: { ar: '', en: '' }, rating: 5 }] }))} className="bg-white"><Plus className="w-4 h-4" /></Button></CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            {content.testimonials.map((t, i) => (
                                <div key={i} className="bg-white p-5 rounded-xl border relative group space-y-4">
                                    <Button variant="ghost" size="icon" onClick={() => setContent(c => ({ ...c, testimonials: c.testimonials.filter((_, idx) => idx !== i) }))} className="absolute top-2 left-2 text-destructive opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></Button>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1"><Label className="text-[10px]">{language === 'ar' ? 'اسم العميل' : 'Name'}</Label><Input value={t.name} onChange={e => { const nt = [...content.testimonials]; nt[i].name = e.target.value; setContent(c => ({ ...c, testimonials: nt })); }} className="h-8" /></div>
                                        <div className="space-y-1"><Label className="text-[10px]">{language === 'ar' ? 'التقييم' : 'Rating'}</Label><div className="flex gap-1">{[1,2,3,4,5].map(s => <Star key={s} className={cn("w-4 h-4 cursor-pointer", s <= t.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-200")} onClick={() => { const nt = [...content.testimonials]; nt[i].rating = s; setContent(c => ({ ...c, testimonials: nt })); }} />)}</div></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1"><Label className="text-[10px]">{language === 'ar' ? 'التعليق (AR)' : 'Review (AR)'}</Label><Input value={t.text.ar} onChange={e => { const nt = [...content.testimonials]; nt[i].text.ar = e.target.value; setContent(c => ({ ...c, testimonials: nt })); }} className="h-8" /></div>
                                        <div className="space-y-1"><Label className="text-[10px]">{language === 'ar' ? 'التعليق (EN)' : 'Review (EN)'}</Label><Input value={t.text.en} onChange={e => { const nt = [...content.testimonials]; nt[i].text.en = e.target.value; setContent(c => ({ ...c, testimonials: nt })); }} className="h-8" /></div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-muted/20">
                        <CardHeader className="border-b bg-white/50"><CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-green-600" /> {language === 'ar' ? 'الضمان' : 'Guarantee'}</CardTitle></CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2"><Label className="font-bold">AR</Label><Textarea value={content.guarantee_text.ar} onChange={e => setContent(c => ({ ...c, guarantee_text: { ...c.guarantee_text, ar: e.target.value } }))} rows={2} className="bg-white" /></div>
                                <div className="space-y-2"><Label className="font-bold">EN</Label><Textarea value={content.guarantee_text.en} onChange={e => setContent(c => ({ ...c, guarantee_text: { ...c.guarantee_text, en: e.target.value } }))} rows={2} className="bg-white" /></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card className="border-none shadow-lg bg-white overflow-hidden">
                        <CardHeader className="bg-primary text-white"><CardTitle className="text-lg flex items-center gap-2"><Palette className="w-5 h-5" /> {language === 'ar' ? 'التنسيق' : 'Style'}</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-2">
                                <Label className="font-bold">{language === 'ar' ? 'القالب' : 'Template'}</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {(['trust', 'hype', 'elegant'] as LandingTemplate[]).map(t => (
                                        <Button key={t} variant={template === t ? 'default' : 'outline'} className={cn("justify-between h-12", template === t ? "ring-2 ring-primary/20" : "")} onClick={() => setTemplate(t)}><span className="capitalize">{t}</span>{template === t && <Check className="w-4 h-4" />}</Button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">{language === 'ar' ? 'اللون الأساسي' : 'Accent Color'}</Label>
                                <div className="flex gap-2">
                                    <input 
                                        type="color" 
                                        value={content.accent_color || '#2563EB'} 
                                        onChange={e => setContent(c => ({ ...c, accent_color: e.target.value }))} 
                                        className="w-16 h-12 p-1 rounded border cursor-pointer" 
                                    />
                                    <Input 
                                        value={content.accent_color || '#2563EB'} 
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (val.startsWith('#')) {
                                                setContent(c => ({ ...c, accent_color: val }));
                                            }
                                        }} 
                                        className="font-mono" 
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-white">
                        <CardHeader className="border-b"><CardTitle className="text-lg flex items-center gap-2"><Settings2 className="w-5 h-5 text-primary" /> {language === 'ar' ? 'الروابط' : 'Links'}</CardTitle></CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="p-4 bg-muted/50 rounded-xl border border-dashed border-primary/30 break-all space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{language === 'ar' ? 'رابط الصفحة' : 'Live Link'}</p>
                                <a href={subdomainUrl} target="_blank" className="text-sm text-primary font-bold hover:underline flex items-center gap-2 group">{subdomainUrl} <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" /></a>
                            </div>
                            <Button variant="outline" className="w-full h-12 font-bold" onClick={() => setShowPreview(true)}><Eye className="w-5 h-5 mr-2 text-primary" /> {language === 'ar' ? 'معاينة القالب' : 'Live Preview'}</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

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
import { CartProvider } from '@/contexts/CartContext';
import { revalidateLandingPage } from '@/app/actions/landing-page';

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
    const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('desktop');
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
        
        console.log('Saving landing page with payload:', { 
            productId, storeId, template, isEnabled, isStandalone, content 
        });

        try {
            const payload = { 
                product_id: productId, 
                store_id: storeId, 
                template, 
                is_enabled: isEnabled, 
                is_standalone: isStandalone, 
                content 
            };

            if (landingPageId) {
                console.log('Updating existing LP:', landingPageId);
                const { error } = await supabase
                    .from('product_landing_pages')
                    .update(payload)
                    .eq('id', landingPageId);
                
                if (error) {
                    console.error('Update error:', error);
                    throw error;
                }
            } else {
                console.log('Inserting new LP');
                const { data, error } = await supabase
                    .from('product_landing_pages')
                    .insert(payload)
                    .select()
                    .single();
                
                if (error) {
                    console.error('Insert error:', error);
                    throw error;
                }
                if (data) {
                    setLandingPageId(data.id);
                    console.log('New LP ID:', data.id);
                }
            }

            // Trigger cache revalidation so the live page updates immediately
            try {
                await revalidateLandingPage(storeSlug, productId);
                console.log('Cache revalidated for:', storeSlug, productId);
            } catch (revalError) {
                console.warn('Revalidation failed, but save succeeded:', revalError);
            }

            toast.success(language === 'ar' ? '✅ تم حفظ التعديلات بنجاح' : '✅ Changes saved successfully');
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (e: any) {
            console.error('Final Save Error Catch:', e);
            toast.error(e.message || (language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error occurred while saving'));
            setSaveStatus('error');
        } finally { 
            setSaving(false); 
            console.log('Save process finished');
        }
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
        const protocol = window.location.protocol;
        
        // Handle localhost and production domains correctly
        // If host is "mais.localhost:3000", we want "localhost:3000" as base
        // If host is "mais.orderlyshops.com", we want "orderlyshops.com" as base
        
        let baseDomain = host;
        const slug = storeSlug.toLowerCase();
        
        if (host.startsWith(`${slug}.`)) {
            baseDomain = host.substring(slug.length + 1);
        } else {
            // Standard logic for when not on the subdomain already
            const parts = host.split('.');
            if (parts.length > 2) {
                baseDomain = parts.slice(-2).join('.');
            }
        }
        
        subdomainUrl = `${protocol}//${slug}.${baseDomain}/lp/${productId}`;
    }

    if (!canUseLandingPages) return <div className="py-20 text-center space-y-4"><Lock className="mx-auto w-12 h-12 opacity-20" /><h3 className="text-xl font-bold">{language === 'ar' ? 'ميزة مدفوعة' : 'Paid Feature'}</h3></div>;
    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-primary" /></div>;

    if (showPreview) {
        return (
            <div className="space-y-4 animate-in fade-in duration-500 h-full flex flex-col">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border shadow-sm">
                    <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)} className="rounded-xl">
                        {language === 'ar' ? '← رجوع للمحرر' : '← Back to Editor'}
                    </Button>
                    
                    <div className="flex bg-muted p-1 rounded-xl">
                        <Button 
                            type="button"
                            variant={previewMode === 'mobile' ? 'default' : 'ghost'} 
                            size="sm" 
                            onClick={() => setPreviewMode('mobile')}
                            className={cn("rounded-lg h-8 px-4", previewMode === 'mobile' && "shadow-sm")}
                        >
                            <span className="text-xs font-bold">{language === 'ar' ? 'جوال' : 'Mobile'}</span>
                        </Button>
                        <Button 
                            type="button"
                            variant={previewMode === 'desktop' ? 'default' : 'ghost'} 
                            size="sm" 
                            onClick={() => setPreviewMode('desktop')}
                            className={cn("rounded-lg h-8 px-4", previewMode === 'desktop' && "shadow-sm")}
                        >
                            <span className="text-xs font-bold">{language === 'ar' ? 'كمبيوتر' : 'Desktop'}</span>
                        </Button>
                    </div>
                    
                    <div className="w-20" /> {/* Spacer */}
                </div>

                <div className="flex-1 bg-slate-100 rounded-[2.5rem] border-8 border-slate-900 shadow-2xl overflow-hidden relative">
                    {/* Notch */}
                    <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 z-50 flex justify-center items-center">
                        <div className="w-20 h-1.5 bg-slate-800 rounded-full" />
                    </div>

                    <div className="h-full pt-6 overflow-y-auto overflow-x-hidden no-scrollbar flex justify-center">
                        <div className={cn(
                            "bg-white transition-all duration-500 shadow-xl min-h-full",
                            previewMode === 'mobile' ? "w-[375px]" : "w-full"
                        )}>
                            <CartProvider storeId={storeId}>
                                <LandingPageRenderer 
                                    template={template} 
                                    content={stableContent} 
                                    product={stableProduct} 
                                    language={language as 'ar' | 'en'} 
                                    storeSlug={storeSlug} 
                                    productId={productId} 
                                    isPreview={true} 
                                />
                            </CartProvider>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[85vh] overflow-y-auto px-1 no-scrollbar">
            {/* Header Control Panel */}
            <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl border shadow-sm sticky top-0 z-40 backdrop-blur-md gap-4">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "p-3 rounded-2xl shadow-sm transition-all duration-500", 
                        isEnabled ? "bg-primary text-white scale-110 shadow-primary/20" : "bg-muted text-muted-foreground"
                    )}>
                        <Layout className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black flex items-center gap-2">
                            {language === 'ar' ? 'إعدادات صفحة الهبوط' : 'Landing Page Settings'}
                            {!isEnabled && <Badge variant="outline" className="text-[10px] uppercase tracking-tighter opacity-50">{language === 'ar' ? 'متوقفة' : 'Disabled'}</Badge>}
                        </h3>
                        <p className="text-xs text-muted-foreground">{language === 'ar' ? 'خصص صفحة البيع المباشر لزيادة مبيعاتك' : 'Customize your direct sales page to boost conversions'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-2xl border">
                        <Label htmlFor="page-toggle" className="text-sm font-bold cursor-pointer">{isEnabled ? (language === 'ar' ? 'منشورة' : 'Live') : (language === 'ar' ? 'مسودة' : 'Draft')}</Label>
                        <Switch id="page-toggle" checked={isEnabled} onCheckedChange={setIsEnabled} />
                    </div>
                    <Button 
                        type="button"
                        size="lg" 
                        onClick={handleSave} 
                        disabled={saving} 
                        className={cn(
                            "font-black shadow-xl px-8 rounded-2xl transition-all active:scale-95", 
                            saveStatus === 'success' ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"
                        )}
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saveStatus === 'success' ? <Check className="w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                        {saveStatus === 'success' ? (language === 'ar' ? 'تم الحفظ' : 'Saved') : (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Editor Sections */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* Template Selection - Modern Grid */}
                    <Card className="border-none shadow-sm bg-muted/30 overflow-hidden rounded-3xl">
                        <CardHeader className="bg-white/50 border-b">
                            <CardTitle className="text-sm font-black flex items-center gap-2">
                                <Palette className="w-4 h-4 text-primary" /> 
                                {language === 'ar' ? 'اختر تصميم الصفحة' : 'Choose Page Design'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { id: 'hype', name: 'Hype', icon: Zap, color: 'bg-purple-500', desc: 'Modern & High Energy' },
                                    { id: 'elegant', name: 'Elegant', icon: Star, color: 'bg-amber-500', desc: 'Luxury & Clean' },
                                    { id: 'trust', name: 'Trust', icon: ShieldCheck, color: 'bg-blue-500', desc: 'Professional & Solid' }
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setTemplate(t.id as any)}
                                        className={cn(
                                            "relative flex flex-col items-center p-5 rounded-2xl border-2 transition-all duration-300 group",
                                            template === t.id 
                                                ? "bg-white border-primary shadow-lg shadow-primary/5 scale-[1.02]" 
                                                : "bg-white/50 border-transparent hover:border-primary/30 hover:bg-white"
                                        )}
                                    >
                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg transition-transform group-hover:scale-110", t.color)}>
                                            <t.icon className="w-6 h-6" />
                                        </div>
                                        <span className="font-bold text-sm mb-1">{t.name}</span>
                                        <span className="text-[10px] opacity-50">{t.desc}</span>
                                        {template === t.id && (
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center animate-in zoom-in">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content Section */}
                    <Card className="border-none shadow-sm bg-muted/30 overflow-hidden rounded-3xl">
                        <CardHeader className="bg-white/50 border-b">
                            <CardTitle className="text-sm font-black flex items-center gap-2">
                                <Layout className="w-4 h-4 text-primary" /> 
                                {language === 'ar' ? 'النصوص والعناوين' : 'Texts & Headlines'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold opacity-60 uppercase tracking-widest">{language === 'ar' ? 'العنوان الرئيسي (العربية)' : 'Main Headline (Arabic)'}</Label>
                                    <Input value={content.headline.ar} onChange={e => setContent(c => ({ ...c, headline: { ...c.headline, ar: e.target.value } }))} placeholder={productName.ar} className="h-12 rounded-xl border-none bg-white shadow-sm font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold opacity-60 uppercase tracking-widest">{language === 'ar' ? 'العنوان الرئيسي (الإنجليزية)' : 'Main Headline (English)'}</Label>
                                    <Input value={content.headline.en} onChange={e => setContent(c => ({ ...c, headline: { ...c.headline, en: e.target.value } }))} placeholder={productName.en} className="h-12 rounded-xl border-none bg-white shadow-sm font-bold" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold opacity-60 uppercase tracking-widest">{language === 'ar' ? 'العنوان الفرعي (العربية)' : 'Sub-headline (Arabic)'}</Label>
                                    <Textarea value={content.subheadline.ar} onChange={e => setContent(c => ({ ...c, subheadline: { ...c.subheadline, ar: e.target.value } }))} rows={3} className="rounded-xl border-none bg-white shadow-sm resize-none" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold opacity-60 uppercase tracking-widest">{language === 'ar' ? 'العنوان الفرعي (الإنجليزية)' : 'Sub-headline (English)'}</Label>
                                    <Textarea value={content.subheadline.en} onChange={e => setContent(c => ({ ...c, subheadline: { ...c.subheadline, en: e.target.value } }))} rows={3} className="rounded-xl border-none bg-white shadow-sm resize-none" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Features/Benefits */}
                    <Card className="border-none shadow-sm bg-muted/30 overflow-hidden rounded-3xl">
                        <CardHeader className="flex flex-row justify-between items-center bg-white/50 border-b">
                            <CardTitle className="text-sm font-black flex items-center gap-2">
                                <Zap className="w-4 h-4 text-primary" /> 
                                {language === 'ar' ? 'مميزات المنتج' : 'Product Features'}
                            </CardTitle>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setContent(c => ({ ...c, benefits: [...c.benefits, { ar: '', en: '' }] }))} className="rounded-xl hover:bg-primary hover:text-white transition-colors">
                                <Plus className="w-4 h-4 mr-1" /> {language === 'ar' ? 'إضافة ميزة' : 'Add Feature'}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {content.benefits.map((b, i) => (
                                <div key={i} className="flex gap-4 items-start bg-white p-4 rounded-2xl shadow-sm border border-transparent hover:border-primary/10 transition-all group">
                                    <div className="pt-3 opacity-20 group-hover:opacity-100 transition-opacity">
                                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">{i + 1}</div>
                                    </div>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Input value={b.ar} onChange={e => { const nb = [...content.benefits]; nb[i].ar = e.target.value; setContent(c => ({ ...c, benefits: nb })); }} placeholder="الميزة بالعربية" className="border-none bg-muted/30 h-10 rounded-xl" />
                                        <Input value={b.en} onChange={e => { const nb = [...content.benefits]; nb[i].en = e.target.value; setContent(c => ({ ...c, benefits: nb })); }} placeholder="Feature in English" className="border-none bg-muted/30 h-10 rounded-xl" />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => setContent(c => ({ ...c, benefits: c.benefits.filter((_, idx) => idx !== i) }))} className="text-destructive opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Visuals & Links */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* Visual Media */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl">
                        <CardHeader className="border-b bg-muted/10">
                            <CardTitle className="text-sm font-black flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-primary" /> 
                                {language === 'ar' ? 'الوسائط المرئية' : 'Media & Colors'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-3">
                                <Label className="text-xs font-bold">{language === 'ar' ? 'الصورة الرئيسية' : 'Hero Image'}</Label>
                                <ImageUpload 
                                    value={content.hero_image ? [content.hero_image] : []} 
                                    onChange={urls => setContent(c => ({ ...c, hero_image: urls[urls.length-1] || '' }))} 
                                    onRemove={() => setContent(c => ({ ...c, hero_image: '' }))} 
                                />
                                <p className="text-[10px] text-muted-foreground">{language === 'ar' ? 'تظهر في واجهة الصفحة بشكل مميز' : 'Appears prominently at the top'}</p>
                            </div>
                            
                            <div className="pt-6 border-t space-y-4">
                                <Label className="text-xs font-bold">{language === 'ar' ? 'هوية الصفحة (اللون)' : 'Brand Color'}</Label>
                                <div className="flex gap-3 items-center">
                                    <div className="relative group">
                                        <input 
                                            type="color" 
                                            value={content.accent_color || '#2563EB'} 
                                            onChange={e => setContent(c => ({ ...c, accent_color: e.target.value }))} 
                                            className="w-14 h-14 p-1 rounded-2xl border-4 border-white shadow-md cursor-pointer" 
                                        />
                                        <div className="absolute inset-0 rounded-2xl pointer-events-none ring-1 ring-black/5" />
                                    </div>
                                    <div className="flex-1">
                                        <Input 
                                            value={content.accent_color || '#2563EB'} 
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (val.startsWith('#')) setContent(c => ({ ...c, accent_color: val }));
                                            }} 
                                            className="font-mono text-xs h-10 rounded-xl" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Access / Links */}
                    <Card className="border-none shadow-lg bg-primary text-white overflow-hidden rounded-3xl">
                        <CardHeader className="bg-primary/90 border-b border-white/10">
                            <CardTitle className="text-sm font-black flex items-center gap-2">
                                <ExternalLink className="w-4 h-4" /> 
                                {language === 'ar' ? 'روابط الوصول' : 'Access Links'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm break-all">
                                <p className="text-[9px] uppercase font-black tracking-widest opacity-60 mb-2">{language === 'ar' ? 'رابط الصفحة المباشر' : 'Live URL'}</p>
                                <a href={subdomainUrl} target="_blank" className="text-sm font-bold hover:underline flex items-center gap-2">
                                    {subdomainUrl} <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button 
                                    type="button"
                                    variant="secondary" 
                                    className="w-full h-12 rounded-2xl font-black text-xs" 
                                    onClick={() => setShowPreview(true)}
                                >
                                    <Eye className="w-4 h-4 mr-2" /> {language === 'ar' ? 'معاينة' : 'Preview'}
                                </Button>
                                <Button 
                                    type="button"
                                    variant="outline" 
                                    className="w-full h-12 rounded-2xl font-black text-xs bg-transparent border-white/20 text-white hover:bg-white/10"
                                    onClick={() => {
                                        navigator.clipboard.writeText(subdomainUrl);
                                        toast.success(language === 'ar' ? 'تم نسخ الرابط' : 'Link copied');
                                    }}
                                >
                                    {language === 'ar' ? 'نسخ الرابط' : 'Copy Link'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Settings */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl">
                        <CardHeader className="border-b bg-muted/10">
                            <CardTitle className="text-sm font-black flex items-center gap-2">
                                <Settings2 className="w-4 h-4 text-primary" /> 
                                {language === 'ar' ? 'إعدادات متقدمة' : 'Advanced'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold">{language === 'ar' ? 'صفحة مستقلة' : 'Standalone'}</Label>
                                    <p className="text-[9px] text-muted-foreground leading-tight">{language === 'ar' ? 'إخفاء رأس وتذييل الموقع الرسمي' : 'Hide main store header/footer'}</p>
                                </div>
                                <Switch checked={isStandalone} onCheckedChange={setIsStandalone} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            {/* Testimonials Section - Full Width */}
            <Card className="border-none shadow-sm bg-muted/30 overflow-hidden rounded-3xl">
                <CardHeader className="flex flex-row justify-between items-center bg-white/50 border-b">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> 
                        {language === 'ar' ? 'آراء العملاء والتقييمات' : 'Customer Reviews'}
                    </CardTitle>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setContent(c => ({ ...c, testimonials: [...c.testimonials, { name: '', text: { ar: '', en: '' }, rating: 5 }] }))} className="rounded-xl hover:bg-yellow-500 hover:text-white transition-colors">
                        <Plus className="w-4 h-4 mr-1" /> {language === 'ar' ? 'إضافة رأي' : 'Add Review'}
                    </Button>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {content.testimonials.map((t, i) => (
                            <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-transparent hover:border-yellow-200 transition-all group relative">
                                <Button type="button" variant="ghost" size="icon" onClick={() => setContent(c => ({ ...c, testimonials: c.testimonials.filter((_, idx) => idx !== i) }))} className="absolute top-2 left-2 text-destructive opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg">👤</div>
                                        <div className="flex-1 space-y-2">
                                            <Input value={t.name} onChange={e => { const nt = [...content.testimonials]; nt[i].name = e.target.value; setContent(c => ({ ...c, testimonials: nt })); }} placeholder={language === 'ar' ? 'اسم العميل' : 'Customer Name'} className="border-none bg-muted/30 h-9 rounded-lg font-bold" />
                                            <div className="flex gap-1">
                                                {[1,2,3,4,5].map(s => <Star key={s} className={cn("w-4 h-4 cursor-pointer transition-all hover:scale-120", s <= t.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-200")} onClick={() => { const nt = [...content.testimonials]; nt[i].rating = s; setContent(c => ({ ...c, testimonials: nt })); }} />)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <Textarea value={t.text.ar} onChange={e => { const nt = [...content.testimonials]; nt[i].text.ar = e.target.value; setContent(c => ({ ...c, testimonials: nt })); }} placeholder="التعليق بالعربية..." className="border-none bg-muted/30 rounded-xl text-xs resize-none" rows={2} />
                                        <Textarea value={t.text.en} onChange={e => { const nt = [...content.testimonials]; nt[i].text.en = e.target.value; setContent(c => ({ ...c, testimonials: nt })); }} placeholder="Review in English..." className="border-none bg-muted/30 rounded-xl text-xs resize-none" rows={2} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Guarantee Section */}
            <Card className="border-none shadow-sm bg-muted/30 overflow-hidden rounded-3xl">
                <CardHeader className="bg-white/50 border-b">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-green-600" /> 
                        {language === 'ar' ? 'سياسة الضمان والاسترجاع' : 'Warranty & Return Policy'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase opacity-40">{language === 'ar' ? 'نص الضمان (بالعربية)' : 'Guarantee Text (Arabic)'}</Label>
                            <Textarea value={content.guarantee_text.ar} onChange={e => setContent(c => ({ ...c, guarantee_text: { ...c.guarantee_text, ar: e.target.value } }))} rows={2} className="rounded-xl border-none bg-white shadow-sm resize-none" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase opacity-40">{language === 'ar' ? 'نص الضمان (بالإنجليزية)' : 'Guarantee Text (English)'}</Label>
                            <Textarea value={content.guarantee_text.en} onChange={e => setContent(c => ({ ...c, guarantee_text: { ...c.guarantee_text, en: e.target.value } }))} rows={2} className="rounded-xl border-none bg-white shadow-sm resize-none" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

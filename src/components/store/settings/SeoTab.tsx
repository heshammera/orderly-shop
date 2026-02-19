"use client";

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface StoreData {
    id: string;
    name: { ar: string; en: string };
    description: { ar: string; en: string };
    slug: string;
    logo_url: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    currency: string;
    timezone: string;
    settings: {
        seo_title?: { ar: string; en: string };
        seo_description?: { ar: string; en: string };
        social_links?: {
            instagram?: string;
            twitter?: string;
            facebook?: string;
        };
    } | null;
}

interface SeoTabProps {
    store: StoreData;
    onSave: (data: Partial<StoreData>) => Promise<void>;
}

export function SeoTab({ store, onSave }: SeoTabProps) {
    const { language } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        seoTitleAr: store.settings?.seo_title?.ar || '',
        seoTitleEn: store.settings?.seo_title?.en || '',
        seoDescriptionAr: store.settings?.seo_description?.ar || '',
        seoDescriptionEn: store.settings?.seo_description?.en || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                settings: {
                    ...store.settings,
                    seo_title: {
                        ar: formData.seoTitleAr,
                        en: formData.seoTitleEn,
                    },
                    seo_description: {
                        ar: formData.seoDescriptionAr,
                        en: formData.seoDescriptionEn,
                    },
                },
            });
        } finally {
            setLoading(false);
        }
    };

    const titleCharCount = (lang: 'ar' | 'en') => {
        const value = lang === 'ar' ? formData.seoTitleAr : formData.seoTitleEn;
        return value.length;
    };

    const descCharCount = (lang: 'ar' | 'en') => {
        const value = lang === 'ar' ? formData.seoDescriptionAr : formData.seoDescriptionEn;
        return value.length;
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* SEO Preview */}
            <div className="p-4 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-2">
                    {language === 'ar' ? 'معاينة في محركات البحث' : 'Search Engine Preview'}
                </p>
                <div className="space-y-1">
                    <p className="text-primary text-lg font-medium truncate">
                        {formData.seoTitleAr || store.name?.ar || 'Store Title'}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate">
                        {store.slug}.orderly.com
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {formData.seoDescriptionAr || store.description?.ar || 'Store description will appear here...'}
                    </p>
                </div>
            </div>

            {/* SEO Title */}
            <div className="space-y-4">
                <h3 className="font-medium">
                    {language === 'ar' ? 'عنوان الصفحة (Title Tag)' : 'Page Title (Title Tag)'}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="seoTitleAr">
                            {language === 'ar' ? 'العنوان بالعربية' : 'Title (Arabic)'}
                        </Label>
                        <Input
                            id="seoTitleAr"
                            value={formData.seoTitleAr}
                            onChange={(e) => setFormData((prev) => ({ ...prev, seoTitleAr: e.target.value }))}
                            placeholder={store.name?.ar || 'Store name'}
                            maxLength={60}
                            dir="rtl"
                        />
                        <p className={`text-xs ${titleCharCount('ar') > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {titleCharCount('ar')}/60 {language === 'ar' ? 'حرف' : 'characters'}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="seoTitleEn">
                            {language === 'ar' ? 'العنوان بالإنجليزية' : 'Title (English)'}
                        </Label>
                        <Input
                            id="seoTitleEn"
                            value={formData.seoTitleEn}
                            onChange={(e) => setFormData((prev) => ({ ...prev, seoTitleEn: e.target.value }))}
                            placeholder={store.name?.en || 'Store name'}
                            maxLength={60}
                            dir="ltr"
                        />
                        <p className={`text-xs ${titleCharCount('en') > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {titleCharCount('en')}/60 {language === 'ar' ? 'حرف' : 'characters'}
                        </p>
                    </div>
                </div>
            </div>

            {/* SEO Description */}
            <div className="space-y-4">
                <h3 className="font-medium">
                    {language === 'ar' ? 'وصف الصفحة (Meta Description)' : 'Page Description (Meta Description)'}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="seoDescriptionAr">
                            {language === 'ar' ? 'الوصف بالعربية' : 'Description (Arabic)'}
                        </Label>
                        <Textarea
                            id="seoDescriptionAr"
                            value={formData.seoDescriptionAr}
                            onChange={(e) => setFormData((prev) => ({ ...prev, seoDescriptionAr: e.target.value }))}
                            placeholder={language === 'ar' ? 'وصف موجز يظهر في نتائج البحث' : 'Brief description for search results'}
                            maxLength={160}
                            rows={3}
                            dir="rtl"
                        />
                        <p className={`text-xs ${descCharCount('ar') > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {descCharCount('ar')}/160 {language === 'ar' ? 'حرف' : 'characters'}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="seoDescriptionEn">
                            {language === 'ar' ? 'الوصف بالإنجليزية' : 'Description (English)'}
                        </Label>
                        <Textarea
                            id="seoDescriptionEn"
                            value={formData.seoDescriptionEn}
                            onChange={(e) => setFormData((prev) => ({ ...prev, seoDescriptionEn: e.target.value }))}
                            placeholder={language === 'ar' ? 'وصف موجز بالإنجليزية' : 'Brief description in English'}
                            maxLength={160}
                            rows={3}
                            dir="ltr"
                        />
                        <p className={`text-xs ${descCharCount('en') > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {descCharCount('en')}/160 {language === 'ar' ? 'حرف' : 'characters'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 animate-spin me-2" />}
                    {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </Button>
            </div>
        </form>
    );
}

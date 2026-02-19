"use client";

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';

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
    settings: any;
}

interface StoreProfileTabProps {
    store: StoreData;
    onSave: (data: Partial<StoreData>) => Promise<void>;
}

export function StoreProfileTab({ store, onSave }: StoreProfileTabProps) {
    const { language } = useLanguage();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [formData, setFormData] = useState({
        nameAr: store.name?.ar || '',
        nameEn: store.name?.en || '',
        descriptionAr: store.description?.ar || '',
        descriptionEn: store.description?.en || '',
        logo_url: store.logo_url || '',
    });

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${store.id}/logo.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('store-logos')
                .upload(fileName, file, { upsert: true });

            if (uploadError) {
                // If bucket doesn't exist, try product-images bucket as fallback
                const { error: fallbackError } = await supabase.storage
                    .from('product-images')
                    .upload(`logos/${fileName}`, file, { upsert: true });

                if (fallbackError) throw fallbackError;

                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(`logos/${fileName}`);

                setFormData((prev) => ({ ...prev, logo_url: publicUrl }));
            } else {
                const { data: { publicUrl } } = supabase.storage
                    .from('store-logos')
                    .getPublicUrl(fileName);

                setFormData((prev) => ({ ...prev, logo_url: publicUrl }));
            }
        } catch (error) {
            console.error('Error uploading logo:', error);
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                name: { ar: formData.nameAr, en: formData.nameEn },
                description: { ar: formData.descriptionAr, en: formData.descriptionEn },
                logo_url: formData.logo_url || null,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
                <Label>{language === 'ar' ? 'شعار المتجر' : 'Store Logo'}</Label>
                <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted">
                        {formData.logo_url ? (
                            <>
                                <img
                                    src={formData.logo_url}
                                    alt="Store logo"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData((prev) => ({ ...prev, logo_url: '' }))}
                                    className="absolute top-1 end-1 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </>
                        ) : (
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex-1">
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            disabled={uploadingLogo}
                            className="hidden"
                            id="logo-upload"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('logo-upload')?.click()}
                            disabled={uploadingLogo}
                        >
                            {uploadingLogo ? (
                                <Loader2 className="w-4 h-4 animate-spin me-2" />
                            ) : (
                                <Upload className="w-4 h-4 me-2" />
                            )}
                            {language === 'ar' ? 'رفع شعار' : 'Upload Logo'}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                            {language === 'ar'
                                ? 'يُنصح بصورة مربعة بحجم 512×512 بكسل'
                                : 'Recommended: Square image, 512×512 pixels'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Store Name */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="nameAr">
                        {language === 'ar' ? 'اسم المتجر (بالعربية)' : 'Store Name (Arabic)'}
                    </Label>
                    <Input
                        id="nameAr"
                        value={formData.nameAr}
                        onChange={(e) => setFormData((prev) => ({ ...prev, nameAr: e.target.value }))}
                        placeholder={language === 'ar' ? 'أدخل اسم المتجر' : 'Enter store name'}
                        dir="rtl"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="nameEn">
                        {language === 'ar' ? 'اسم المتجر (بالإنجليزية)' : 'Store Name (English)'}
                    </Label>
                    <Input
                        id="nameEn"
                        value={formData.nameEn}
                        onChange={(e) => setFormData((prev) => ({ ...prev, nameEn: e.target.value }))}
                        placeholder={language === 'ar' ? 'أدخل اسم المتجر بالإنجليزية' : 'Enter store name in English'}
                        dir="ltr"
                    />
                </div>
            </div>

            {/* Description */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="descriptionAr">
                        {language === 'ar' ? 'الوصف (بالعربية)' : 'Description (Arabic)'}
                    </Label>
                    <Textarea
                        id="descriptionAr"
                        value={formData.descriptionAr}
                        onChange={(e) => setFormData((prev) => ({ ...prev, descriptionAr: e.target.value }))}
                        placeholder={language === 'ar' ? 'وصف قصير للمتجر' : 'Short store description'}
                        rows={3}
                        dir="rtl"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="descriptionEn">
                        {language === 'ar' ? 'الوصف (بالإنجليزية)' : 'Description (English)'}
                    </Label>
                    <Textarea
                        id="descriptionEn"
                        value={formData.descriptionEn}
                        onChange={(e) => setFormData((prev) => ({ ...prev, descriptionEn: e.target.value }))}
                        placeholder={language === 'ar' ? 'وصف قصير للمتجر بالإنجليزية' : 'Short store description in English'}
                        rows={3}
                        dir="ltr"
                    />
                </div>
            </div>

            {/* Store URL (read-only) */}
            <div className="space-y-2">
                <Label>{language === 'ar' ? 'رابط المتجر' : 'Store URL'}</Label>
                <div className="flex items-center gap-2 p-3 rounded-md bg-muted text-muted-foreground">
                    <span className="font-mono text-sm">{store.slug}.orderly.com</span>
                </div>
                <p className="text-xs text-muted-foreground">
                    {language === 'ar'
                        ? 'لتغيير الرابط، تواصل مع الدعم الفني'
                        : 'Contact support to change the store URL'}
                </p>
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

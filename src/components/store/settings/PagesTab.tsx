"use client";

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Info, ShieldCheck, FileKey } from 'lucide-react';

interface StoreData {
    id: string;
    settings: {
        about_us?: { ar: string; en: string };
        privacy_policy?: { ar: string; en: string };
        terms_of_service?: { ar: string; en: string };
        [key: string]: any;
    } | null;
}

interface PagesTabProps {
    store: StoreData;
    onSave: (data: Partial<StoreData>) => Promise<void>;
}

export function PagesTab({ store, onSave }: PagesTabProps) {
    const { language } = useLanguage();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        about_us_ar: store.settings?.about_us?.ar || '',
        about_us_en: store.settings?.about_us?.en || '',
        privacy_policy_ar: store.settings?.privacy_policy?.ar || '',
        privacy_policy_en: store.settings?.privacy_policy?.en || '',
        terms_of_service_ar: store.settings?.terms_of_service?.ar || '',
        terms_of_service_en: store.settings?.terms_of_service?.en || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                settings: {
                    ...store.settings,
                    about_us: {
                        ar: formData.about_us_ar,
                        en: formData.about_us_en,
                    },
                    privacy_policy: {
                        ar: formData.privacy_policy_ar,
                        en: formData.privacy_policy_en,
                    },
                    terms_of_service: {
                        ar: formData.terms_of_service_ar,
                        en: formData.terms_of_service_en,
                    },
                },
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* About Us */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                    <Info className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-lg">
                        {language === 'ar' ? 'من نحن (تظهر في تذييل الموقع)' : 'About Us (Shows in Footer)'}
                    </h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="about_us_ar">{language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
                        <Textarea
                            id="about_us_ar"
                            value={formData.about_us_ar}
                            onChange={(e) => setFormData((prev) => ({ ...prev, about_us_ar: e.target.value }))}
                            placeholder={language === 'ar' ? 'اكتب نبذة عن متجرك...' : 'Write about your store...'}
                            dir="rtl"
                            rows={3}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="about_us_en">{language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
                        <Textarea
                            id="about_us_en"
                            value={formData.about_us_en}
                            onChange={(e) => setFormData((prev) => ({ ...prev, about_us_en: e.target.value }))}
                            placeholder="Write about your store..."
                            dir="ltr"
                            rows={3}
                        />
                    </div>
                </div>
            </div>

            {/* Privacy Policy */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-lg">
                        {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
                    </h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="privacy_policy_ar">{language === 'ar' ? 'السياسة (عربي)' : 'Policy (Arabic)'}</Label>
                        <Textarea
                            id="privacy_policy_ar"
                            value={formData.privacy_policy_ar}
                            onChange={(e) => setFormData((prev) => ({ ...prev, privacy_policy_ar: e.target.value }))}
                            placeholder={language === 'ar' ? 'اكتب سياسة الخصوصية هنا...' : 'Write privacy policy here...'}
                            dir="rtl"
                            rows={6}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="privacy_policy_en">{language === 'ar' ? 'السياسة (إنجليزي)' : 'Policy (English)'}</Label>
                        <Textarea
                            id="privacy_policy_en"
                            value={formData.privacy_policy_en}
                            onChange={(e) => setFormData((prev) => ({ ...prev, privacy_policy_en: e.target.value }))}
                            placeholder="Write privacy policy here..."
                            dir="ltr"
                            rows={6}
                        />
                    </div>
                </div>
            </div>

            {/* Terms of Service */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                    <FileKey className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-lg">
                        {language === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
                    </h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="terms_of_service_ar">{language === 'ar' ? 'الشروط (عربي)' : 'Terms (Arabic)'}</Label>
                        <Textarea
                            id="terms_of_service_ar"
                            value={formData.terms_of_service_ar}
                            onChange={(e) => setFormData((prev) => ({ ...prev, terms_of_service_ar: e.target.value }))}
                            placeholder={language === 'ar' ? 'اكتب شروط الخدمة هنا...' : 'Write terms of service here...'}
                            dir="rtl"
                            rows={6}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="terms_of_service_en">{language === 'ar' ? 'الشروط (إنجليزي)' : 'Terms (English)'}</Label>
                        <Textarea
                            id="terms_of_service_en"
                            value={formData.terms_of_service_en}
                            onChange={(e) => setFormData((prev) => ({ ...prev, terms_of_service_en: e.target.value }))}
                            placeholder="Write terms of service here..."
                            dir="ltr"
                            rows={6}
                        />
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

"use client";

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Phone, Instagram, Twitter, Facebook } from 'lucide-react';

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
            tiktok?: string;
            snapchat?: string;
        };
    } | null;
}

interface ContactTabProps {
    store: StoreData;
    onSave: (data: Partial<StoreData>) => Promise<void>;
}

export function ContactTab({ store, onSave }: ContactTabProps) {
    const { language } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        contact_email: store.contact_email || '',
        contact_phone: store.contact_phone || '',
        instagram: store.settings?.social_links?.instagram || '',
        twitter: store.settings?.social_links?.twitter || '',
        facebook: store.settings?.social_links?.facebook || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                contact_email: formData.contact_email || null,
                contact_phone: formData.contact_phone || null,
                settings: {
                    ...store.settings,
                    social_links: {
                        ...store.settings?.social_links,
                        instagram: formData.instagram || undefined,
                        twitter: formData.twitter || undefined,
                        facebook: formData.facebook || undefined,
                    },
                },
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email & Phone */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="contact_email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </Label>
                    <Input
                        id="contact_email"
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, contact_email: e.target.value }))}
                        placeholder="contact@store.com"
                        dir="ltr"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contact_phone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                    </Label>
                    <Input
                        id="contact_phone"
                        type="tel"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, contact_phone: e.target.value }))}
                        placeholder="+966 5X XXX XXXX"
                        dir="ltr"
                    />
                </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
                <h3 className="font-medium">
                    {language === 'ar' ? 'روابط التواصل الاجتماعي' : 'Social Media Links'}
                </h3>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="instagram" className="flex items-center gap-2">
                            <Instagram className="w-4 h-4" />
                            Instagram
                        </Label>
                        <Input
                            id="instagram"
                            value={formData.instagram}
                            onChange={(e) => setFormData((prev) => ({ ...prev, instagram: e.target.value }))}
                            placeholder="https://instagram.com/yourstore"
                            dir="ltr"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="twitter" className="flex items-center gap-2">
                            <Twitter className="w-4 h-4" />
                            Twitter / X
                        </Label>
                        <Input
                            id="twitter"
                            value={formData.twitter}
                            onChange={(e) => setFormData((prev) => ({ ...prev, twitter: e.target.value }))}
                            placeholder="https://twitter.com/yourstore"
                            dir="ltr"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="facebook" className="flex items-center gap-2">
                            <Facebook className="w-4 h-4" />
                            Facebook
                        </Label>
                        <Input
                            id="facebook"
                            value={formData.facebook}
                            onChange={(e) => setFormData((prev) => ({ ...prev, facebook: e.target.value }))}
                            placeholder="https://facebook.com/yourstore"
                            dir="ltr"
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

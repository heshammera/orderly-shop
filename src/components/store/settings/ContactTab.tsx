"use client";

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Phone, Instagram, Twitter, Facebook, Contact, MessageSquare } from 'lucide-react';

interface StoreData {
    id: string;
    name: { ar: string; en: string };
    description: { ar: string; en: string };
    slug: string;
    logo_url: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    contact_email_verified?: boolean;
    contact_phone_verified?: boolean;
    currency: string;
    timezone: string;
    settings: {
        public_contact?: {
            email?: string;
            phone?: string;
        };
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
    hideHeader?: boolean;
}

export function ContactTab({ store, onSave, hideHeader }: ContactTabProps) {
    const { language } = useLanguage();
    const { toast } = useToast();

    // Loading States
    const [contactLoading, setContactLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState(false);

    // Contact Data (Public Storefront)
    const [contactData, setContactData] = useState({
        email: store.settings?.public_contact?.email || '',
        phone: store.settings?.public_contact?.phone || '',
    });

    // Social Links Data
    const [socialData, setSocialData] = useState({
        instagram: store.settings?.social_links?.instagram || '',
        twitter: store.settings?.social_links?.twitter || '',
        facebook: store.settings?.social_links?.facebook || '',
    });

    // Contact Save
    const handleContactSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setContactLoading(true);
        try {
            await onSave({
                settings: {
                    ...store.settings,
                    public_contact: {
                        email: contactData.email || undefined,
                        phone: contactData.phone || undefined,
                    },
                },
            });
        } finally {
            setContactLoading(false);
        }
    };

    // Social links save
    const handleSocialSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSocialLoading(true);
        try {
            await onSave({
                settings: {
                    ...store.settings,
                    social_links: {
                        ...store.settings?.social_links,
                        instagram: socialData.instagram || undefined,
                        twitter: socialData.twitter || undefined,
                        facebook: socialData.facebook || undefined,
                    },
                },
            });
        } finally {
            setSocialLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Public Store Contact Info */}
            <form onSubmit={handleContactSave} className="space-y-6">
                <div className="space-y-4">
                    {!hideHeader && (
                        <div className="flex items-center gap-2 mb-4">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">
                                {language === 'ar' ? 'التواصل العام (يظهر للعملاء)' : 'Public Contact (Visible to Customers)'}
                            </h3>
                        </div>
                    )}
                    <p className="text-sm text-muted-foreground mb-4">
                        {language === 'ar'
                            ? 'هذه البيانات ستظهر للعملاء في تذييل وأعلى المتجر (الفوتر والهيدر)'
                            : 'This info will be visible to your customers in the store header and footer'}
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="publicEmail" className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {language === 'ar' ? 'البريد الإلكتروني العام للمتجر' : 'Store Public Email'}
                            </Label>
                            <Input
                                id="publicEmail"
                                type="email"
                                value={contactData.email}
                                onChange={(e) => setContactData((prev) => ({ ...prev, email: e.target.value }))}
                                placeholder="info@mystore.com"
                                dir="ltr"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="publicPhone" className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                {language === 'ar' ? 'رقم الهاتف العام للمتجر' : 'Store Public Phone'}
                            </Label>
                            <Input
                                id="publicPhone"
                                type="tel"
                                value={contactData.phone}
                                onChange={(e) => setContactData((prev) => ({ ...prev, phone: e.target.value }))}
                                placeholder="+966 5XXXXXXXX"
                                dir="ltr"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={contactLoading}>
                        {contactLoading && <Loader2 className="w-4 h-4 animate-spin me-2" />}
                        {language === 'ar' ? 'حفظ معلومات التواصل' : 'Save Contact Info'}
                    </Button>
                </div>
            </form>

            <hr className="border-border" />
            <form onSubmit={handleSocialSave} className="space-y-6">
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
                                value={socialData.instagram}
                                onChange={(e) => setSocialData((prev) => ({ ...prev, instagram: e.target.value }))}
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
                                value={socialData.twitter}
                                onChange={(e) => setSocialData((prev) => ({ ...prev, twitter: e.target.value }))}
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
                                value={socialData.facebook}
                                onChange={(e) => setSocialData((prev) => ({ ...prev, facebook: e.target.value }))}
                                placeholder="https://facebook.com/yourstore"
                                dir="ltr"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={socialLoading}>
                        {socialLoading && <Loader2 className="w-4 h-4 animate-spin me-2" />}
                        {language === 'ar' ? 'حفظ الروابط' : 'Save Links'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

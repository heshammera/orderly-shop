import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StoreProfileTab } from './StoreProfileTab';
import { ContactTab } from './ContactTab';
import { RegionalTab } from './RegionalTab';
import { SeoTab } from './SeoTab';
import { ShippingTab } from './ShippingTab';
import { Store, Phone, Globe, Search, Truck, Link } from 'lucide-react';
import { DomainsTab } from './DomainsTab';

interface StoreData {
  id: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  slug: string;
  custom_domain: string | null;
  domain_verified: boolean;
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

interface SettingsFormProps {
  store: StoreData;
  onSave: (data: Partial<StoreData>) => Promise<void>;
}

export function SettingsForm({ store, onSave }: SettingsFormProps) {
  const { language } = useLanguage();

  const tabs = [
    {
      value: 'profile',
      label: language === 'ar' ? 'الملف الشخصي' : 'Profile',
      icon: Store,
    },
    {
      value: 'contact',
      label: language === 'ar' ? 'التواصل' : 'Contact',
      icon: Phone,
    },
    {
      value: 'regional',
      label: language === 'ar' ? 'الإعدادات الإقليمية' : 'Regional',
      icon: Globe,
    },
    {
      value: 'shipping',
      label: language === 'ar' ? 'الشحن' : 'Shipping',
      icon: Truck,
    },
    {
      value: 'seo',
      label: language === 'ar' ? 'SEO' : 'SEO',
      icon: Search,
    },
    {
      value: 'domains',
      label: language === 'ar' ? 'النطاقات' : 'Domains',
      icon: Link,
    },
  ];

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="flex flex-wrap h-auto p-2 gap-2 w-full lg:w-auto bg-muted/50">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
            <tab.icon className="w-4 h-4 hidden sm:block" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'ar' ? 'الملف الشخصي للمتجر' : 'Store Profile'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'اسم المتجر والوصف والشعار'
                : 'Store name, description, and logo'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StoreProfileTab store={store} onSave={onSave} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="contact">
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'ar' ? 'معلومات التواصل' : 'Contact Information'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'البريد الإلكتروني ورقم الهاتف وروابط التواصل الاجتماعي'
                : 'Email, phone, and social media links'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContactTab store={store} onSave={onSave} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="regional">
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'ar' ? 'الإعدادات الإقليمية' : 'Regional Settings'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'العملة والمنطقة الزمنية'
                : 'Currency and timezone'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegionalTab store={store} onSave={onSave} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="shipping">
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'ar' ? 'إعدادات الشحن' : 'Shipping Settings'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'تخصيص تكاليف الشحن (ثابت أو حسب المنطقة)'
                : 'Customize shipping costs (Fixed or Per Region)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ShippingTab store={store} onSave={onSave} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="seo">
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'ar' ? 'تحسين محركات البحث' : 'Search Engine Optimization'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'عنوان ووصف المتجر لمحركات البحث'
                : 'Store title and description for search engines'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SeoTab store={store} onSave={onSave} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="domains">
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'ar' ? 'إعدادات النطاق' : 'Domain Settings'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'إدارة النطاق الفرعي والنطاق المخصص'
                : 'Manage your subdomain and custom domain'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DomainsTab store={store} onSave={onSave} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

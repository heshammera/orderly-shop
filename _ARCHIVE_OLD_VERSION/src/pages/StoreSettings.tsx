import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SettingsForm } from '@/components/settings/SettingsForm';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    shipping?: {
      type: 'fixed' | 'dynamic';
      fixed_price: number;
      governorate_prices: Record<string, number>;
    };
  } | null;
}

export default function StoreSettings() {
  const { storeId } = useParams<{ storeId: string }>();
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user && storeId) {
      fetchStore();
    }
  }, [authLoading, user, storeId]);

  const fetchStore = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (error) throw error;

      // Parse JSONB fields
      const storeData: StoreData = {
        id: data.id,
        name: typeof data.name === 'string' ? JSON.parse(data.name) : data.name,
        description: typeof data.description === 'string'
          ? JSON.parse(data.description)
          : data.description || { ar: '', en: '' },
        slug: data.slug,
        custom_domain: data.custom_domain,
        domain_verified: data.domain_verified,
        logo_url: data.logo_url,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        currency: data.currency,
        timezone: data.timezone,
        settings: typeof data.settings === 'string'
          ? JSON.parse(data.settings)
          : data.settings,
      };

      setStore(storeData);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ في تحميل البيانات' : 'Error loading data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedStore: Partial<StoreData>) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          name: updatedStore.name,
          description: updatedStore.description,
          logo_url: updatedStore.logo_url,
          contact_email: updatedStore.contact_email,
          contact_phone: updatedStore.contact_phone,
          currency: updatedStore.currency,
          timezone: updatedStore.timezone,
          settings: updatedStore.settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', storeId);

      if (error) throw error;

      setStore((prev) => prev ? { ...prev, ...updatedStore } : null);
      toast({
        title: language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully',
      });
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ في الحفظ' : 'Error saving',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{language === 'ar' ? 'المتجر غير موجود' : 'Store not found'}</p>
      </div>
    );
  }

  const storeName = store.name[language] || store.name.ar || store.name.en;

  return (
    <DashboardLayout storeId={store.id} storeName={storeName}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'إعدادات المتجر' : 'Store Settings'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar'
              ? 'إدارة معلومات متجرك وإعداداته'
              : 'Manage your store information and settings'}
          </p>
        </div>

        <SettingsForm store={store} onSave={handleSave} />
      </div>
    </DashboardLayout>
  );
}

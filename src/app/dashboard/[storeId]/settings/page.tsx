"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { StoreSettingsForm } from '@/components/store/settings/StoreSettingsForm';
import { Loader2 } from 'lucide-react';

export default function StoreSettingsPage({ params }: { params: { storeId: string } }) {
    const { language } = useLanguage();
    const [store, setStore] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchStore() {
            try {
                const { data, error } = await supabase
                    .from('stores')
                    .select('*')
                    .eq('id', params.storeId)
                    .single();

                if (error) throw error;
                setStore(data);
            } catch (error) {
                console.error('Error fetching store settings:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchStore();
    }, [params.storeId]);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    if (!store) {
        return <div>{language === 'ar' ? 'لم يتم العثور على المتجر' : 'Store not found'}</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">
                    {language === 'ar' ? 'إعدادات المتجر' : 'Store Settings'}
                </h1>
                <p className="text-muted-foreground">
                    {language === 'ar' ? 'إدارة ملف المتجر، الشحن، والنطاقات.' : 'Manage store profile, shipping, and domains.'}
                </p>
            </div>

            <StoreSettingsForm store={store} />
        </div>
    );
}

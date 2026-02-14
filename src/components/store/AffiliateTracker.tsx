"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function AffiliateTracker({ storeId }: { storeId: string }) {
    const searchParams = useSearchParams();
    const supabase = createClient();

    useEffect(() => {
        const refCode = searchParams.get('ref');

        if (refCode) {
            const trackVisit = async () => {
                // 1. Store in localStorage/Cookie for future purchases (persistent attribution)
                // We'll use localStorage for simplicity, but cookie is better for server-side access if needed.
                // Actually, let's use a cookie for better reliability across subdomains if implemented later, 
                // but localStorage is fine for Client Component checkout logic.
                localStorage.setItem('affiliate_ref', refCode);
                localStorage.setItem('affiliate_store_id', storeId);

                // 2. Log Visit to Database
                try {
                    // First find the affiliate ID
                    const { data: affiliate } = await supabase
                        .from('affiliates')
                        .select('id')
                        .eq('code', refCode.toUpperCase())
                        .eq('store_id', storeId)
                        .single();

                    if (affiliate) {
                        await supabase.from('affiliate_visits').insert({
                            affiliate_id: affiliate.id,
                            visitor_ip: 'anon', // We can't easily get IP in client component without a proxy/API
                            user_agent: navigator.userAgent,
                            referrer_url: document.referrer,
                            converted: false
                        });
                    }
                } catch (error) {
                    console.error('Error tracking affiliate visit:', error);
                }
            };

            trackVisit();
        }
    }, [searchParams, storeId, supabase]);

    return null; // This component renders nothing
}

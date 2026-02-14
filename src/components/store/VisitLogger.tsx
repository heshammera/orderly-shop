
"use client";

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface VisitLoggerProps {
    storeId: string;
}

export function VisitLogger({ storeId }: VisitLoggerProps) {
    const loggedRef = useRef(false);

    useEffect(() => {
        if (loggedRef.current) return;
        loggedRef.current = true;

        const logVisit = async () => {
            try {
                const supabase = createClient();
                const visitorId = localStorage.getItem('visitor_id') || crypto.randomUUID();

                if (!localStorage.getItem('visitor_id')) {
                    localStorage.setItem('visitor_id', visitorId);
                }

                await supabase.from('store_visits').insert({
                    store_id: storeId,
                    visitor_id: visitorId,
                    page_path: window.location.pathname,
                    referrer: document.referrer,
                    user_agent: window.navigator.userAgent
                });
            } catch (error) {
                // Fail silently to not impact user experience
                console.error("Visit logging failed", error);
            }
        };

        // Delay slightly to prioritize critical loading
        const timer = setTimeout(logVisit, 2000);
        return () => clearTimeout(timer);
    }, [storeId]);

    return null;
}

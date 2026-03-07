"use client";

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const VISIT_DEBOUNCE = 2000; // 2 seconds

export function PlatformTracker() {
    const pathname = usePathname();
    const lastPathRef = useRef<string>('');
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
    const visitorIdRef = useRef<string>('');

    // Initialize visitor ID
    useEffect(() => {
        const visitorId = localStorage.getItem('visitor_id') || crypto.randomUUID();
        if (!localStorage.getItem('visitor_id')) {
            localStorage.setItem('visitor_id', visitorId);
        }
        visitorIdRef.current = visitorId;
    }, []);

    // Send heartbeat
    const sendHeartbeat = useCallback(async () => {
        if (!visitorIdRef.current) return;
        try {
            await fetch('/api/heartbeat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visitor_id: visitorIdRef.current,
                    current_page: window.location.pathname,
                    hostname: window.location.hostname,
                }),
            });
        } catch {
            // Fail silently
        }
    }, []);

    // Log page visit
    const logVisit = useCallback(async (pagePath: string) => {
        if (!visitorIdRef.current) return;
        try {
            await fetch('/api/visits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visitor_id: visitorIdRef.current,
                    page_path: pagePath,
                    referrer: document.referrer,
                    user_agent: navigator.userAgent,
                    hostname: window.location.hostname,
                }),
            });
        } catch {
            // Fail silently
        }
    }, []);

    // Track page changes
    useEffect(() => {
        if (pathname && pathname !== lastPathRef.current) {
            lastPathRef.current = pathname;
            const timer = setTimeout(() => logVisit(pathname), VISIT_DEBOUNCE);
            return () => clearTimeout(timer);
        }
    }, [pathname, logVisit]);

    // Heartbeat interval
    useEffect(() => {
        // Send initial heartbeat after a short delay
        const initialTimer = setTimeout(sendHeartbeat, 3000);

        heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

        // Cleanup on unload
        const handleUnload = () => {
            if (visitorIdRef.current) {
                navigator.sendBeacon('/api/heartbeat', JSON.stringify({
                    visitor_id: visitorIdRef.current,
                    current_page: 'offline',
                }));
            }
        };

        window.addEventListener('beforeunload', handleUnload);

        return () => {
            clearTimeout(initialTimer);
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [sendHeartbeat]);

    return null;
}

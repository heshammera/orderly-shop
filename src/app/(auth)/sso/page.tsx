"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function SSOPage() {
    const router = useRouter();
    const supabase = createClient();
    const [status, setStatus] = useState('Initializing SSO...');

    useEffect(() => {
        const handleSSO = async () => {
            // 1. Parse hash from URL (contains access/refresh tokens)
            const hash = window.location.hash.substring(1);
            const hashParams = new URLSearchParams(hash);

            // 2. Parse search params (contains optional return path)
            const searchParams = new URLSearchParams(window.location.search);
            const returnTo = searchParams.get('return') || '/dashboard';

            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');

            if (!accessToken || !refreshToken) {
                console.error('SSO: Missing tokens');
                setStatus('Invalid SSO link. Redirecting to login...');
                setTimeout(() => window.location.replace('/login'), 2000);
                return;
            }

            setStatus('Authenticating...');

            try {
                // 3. Set session in this domain's context
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (error) {
                    throw error;
                }

                setStatus('Success! Redirecting...');

                // 4. Redirect to the target path 
                // IMPORTANT: We use a longer delay (2000ms) before navigating.
                // Mobile WebViews (especially on Android) have a known race condition where 
                // client-side document.cookie writes might take over a second to sync to the 
                // WebView's internal HTTP cookie jar. If we redirect too fast, the Next.js 
                // middleware running on the server won't see the cookies and will bounce 
                // the user back to /login.

                // Clear the Next.js client-side router cache so the next navigation forces a fresh server request
                router.refresh();

                setTimeout(() => {
                    // Use href instead of replace to ensure the WebView treats it as a standard navigation
                    window.location.href = returnTo;
                }, 2000);

            } catch (err) {
                console.error('SSO Error:', err);
                setStatus('Authentication failed. Please login manually.');
                setTimeout(() => window.location.href = '/login', 2500);
            }
        };

        handleSSO();
    }, [supabase]);


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <div className="flex flex-col items-center p-8 space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <h1 className="text-xl font-semibold">{status}</h1>
                <p className="text-muted-foreground text-sm">Please wait while we log you in...</p>
            </div>
        </div>
    );
}

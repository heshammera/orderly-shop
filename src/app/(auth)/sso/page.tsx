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
            // 1. Parse hash from URL
            const hash = window.location.hash.substring(1); // remove #
            const params = new URLSearchParams(hash);

            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (!accessToken || !refreshToken) {
                console.error('SSO: Missing tokens');
                setStatus('Invalid SSO link. Redirecting to login...');
                setTimeout(() => router.push('/login'), 2000);
                return;
            }

            setStatus('Authenticating...');

            try {
                // 2. Set session in this domain's context
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (error) {
                    throw error;
                }

                setStatus('Success! Redirecting...');

                // 3. Clear hash and redirect to dashboard
                // Use replace to avoid back-button loops
                router.replace('/dashboard');

            } catch (err) {
                console.error('SSO Error:', err);
                setStatus('Authentication failed. Please login manually.');
                setTimeout(() => router.push('/login'), 2000);
            }
        };

        handleSSO();
    }, [router, supabase]);

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

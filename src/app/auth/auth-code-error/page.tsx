'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCodeError() {
    const router = useRouter();
    const [message, setMessage] = useState('جاري التحقق من حالة الدخول...');

    useEffect(() => {
        const processHash = async () => {
            const hash = window.location.hash;

            // If there's an access token in the hash (Magic Link implicit flow)
            if (hash && hash.includes('access_token=')) {
                try {
                    setMessage('جاري تسجيل الدخول...');
                    const supabase = createClient();

                    // Parse the hash parameters manually
                    const params = new URLSearchParams(hash.substring(1)); // Remove the '#'
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    if (accessToken && refreshToken) {
                        const { data, error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken
                        });

                        if (error) throw error;

                        if (data.session) {
                            setMessage('تم تسجيل الدخول بنجاح! جاري التوجيه...');
                            setTimeout(() => {
                                window.location.href = '/dashboard';
                            }, 1000);
                            return;
                        }
                    }
                } catch (err) {
                    console.error('Error processing magic link hash:', err);
                }
            }

            setMessage('حدث خطأ في رابط الدخول. الرجاء المحاولة مرة أخرى.');
        };

        processHash();
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            {message.includes('جاري') ? (
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            ) : (
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
            )}
            <h1 className="text-2xl font-bold mb-2">{message}</h1>

            {!message.includes('جاري') && (
                <button
                    onClick={() => router.push('/admin/stores')}
                    className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    العودة للوحة التحكم
                </button>
            )}
        </div>
    );
}

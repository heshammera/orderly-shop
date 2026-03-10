'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    useEffect(() => {
        // Check if already installed as PWA
        if (window.matchMedia('(display-mode: standalone)').matches) return;

        // Check if dismissed recently
        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (dismissed && Date.now() - parseInt(dismissed) < DISMISS_DURATION) return;

        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        if (isIOSDevice) {
            // iOS doesn't support beforeinstallprompt, show custom guide after delay
            const timer = setTimeout(() => setShowBanner(true), 3000);
            return () => clearTimeout(timer);
        }

        // Android / Desktop Chrome
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show banner after a short delay
            setTimeout(() => setShowBanner(true), 2000);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = useCallback(async () => {
        if (isIOS) {
            setShowIOSGuide(true);
            return;
        }

        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowBanner(false);
        }
        setDeferredPrompt(null);
    }, [deferredPrompt, isIOS]);

    const handleDismiss = useCallback(() => {
        setShowBanner(false);
        setShowIOSGuide(false);
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }, []);

    if (!showBanner) return null;

    return (
        <>
            {/* Backdrop for iOS Guide */}
            {showIOSGuide && (
                <div className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm" onClick={() => setShowIOSGuide(false)} />
            )}

            {/* iOS Guide Modal */}
            {showIOSGuide && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] bg-white rounded-2xl shadow-2xl p-6 w-[90vw] max-w-sm" dir="rtl">
                    <button onClick={() => setShowIOSGuide(false)} className="absolute top-3 left-3 p-1 text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">كيفية التثبيت على iOS</h3>
                    <div className="space-y-4 text-sm text-gray-600">
                        <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-xs font-bold">1</div>
                            <p>اضغط على زر <strong>المشاركة</strong> <span className="inline-block w-5 h-5 align-middle">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 inline text-blue-500"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                            </span> في أسفل الشاشة</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-xs font-bold">2</div>
                            <p>مرر للأسفل واختر <strong>"إضافة إلى الشاشة الرئيسية"</strong></p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-xs font-bold">3</div>
                            <p>اضغط <strong>"إضافة"</strong> في الزاوية العلوية</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Install Banner */}
            <div
                className="fixed bottom-0 left-0 right-0 z-[9997] animate-in slide-in-from-bottom duration-500"
                dir="rtl"
            >
                <div className="mx-auto max-w-lg p-3">
                    <div className="bg-white rounded-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.12)] border border-gray-100 p-4 flex items-center gap-4">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md">
                            <Smartphone className="w-6 h-6 text-white" />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900">ثبّت تطبيق أوردرلي</p>
                            <p className="text-xs text-gray-500 mt-0.5">وصول أسرع وتجربة أفضل على جهازك</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={handleDismiss}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="إغلاق"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleInstall}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                                تثبيت
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

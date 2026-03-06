
import { Lock } from 'lucide-react';
import { ComponentSchema } from '@/lib/store-builder/types';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

interface CheckoutHeaderProps extends ComponentSchema { }

export function CheckoutHeader({ data }: { data: ComponentSchema }) {
    const { settings, content } = data;
    const { language } = useLanguage();

    // Default content handling
    const logo = content.logo || '/placeholder-logo.png';
    const storeName = typeof content.storeName === 'string'
        ? content.storeName
        : (content.storeName?.[language] || 'My Store');

    return (
        <header
            className="w-full border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm"
            style={{ backgroundColor: settings.backgroundColor ? `${settings.backgroundColor}cc` : undefined }}
        >
            <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-center justify-between py-2 sm:py-0 sm:h-16 gap-y-2">
                    {/* Progress Indicator */}
                    <nav className="flex flex-1 items-center justify-center sm:justify-start gap-2 sm:gap-8 text-[10px] sm:text-sm font-medium w-full sm:w-auto order-last sm:order-first">
                        <div className="flex items-center gap-1 sm:gap-2 text-slate-400">
                            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-slate-200 flex items-center justify-center text-[10px] sm:text-xs">1</span>
                            <span className="hidden sm:inline-block">{language === 'ar' ? 'السلة' : 'Cart'}</span>
                        </div>
                        <div className="w-4 sm:w-8 h-px bg-slate-200" />
                        <div className="flex items-center gap-1 sm:gap-2 text-primary">
                            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] sm:text-xs">2</span>
                            <span>{language === 'ar' ? 'بيانات الشحن' : 'Shipping'}</span>
                        </div>
                        <div className="w-4 sm:w-8 h-px bg-slate-200" />
                        <div className="flex items-center gap-1 sm:gap-2 text-slate-400">
                            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-slate-200 flex items-center justify-center text-[10px] sm:text-xs">3</span>
                            <span className="hidden sm:inline-block">{language === 'ar' ? 'اتمام الطلب' : 'Complete'}</span>
                        </div>
                    </nav>

                    {/* Security Badge */}
                    <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 bg-slate-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-slate-100 mx-auto sm:mx-0">
                        <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                        <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">
                            {language === 'ar' ? 'دفع آمن 100%' : 'Secure Checkout'}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}

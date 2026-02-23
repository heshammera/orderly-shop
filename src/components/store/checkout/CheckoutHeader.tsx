
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 sm:h-20">
                    {/* Logo/Store Name */}
                    <div className="flex items-center">
                        {logo ? (
                            <div className="relative h-8 w-24 sm:h-10 sm:w-32">
                                <Image
                                    src={logo}
                                    alt={storeName}
                                    fill
                                    className="object-contain object-left"
                                />
                            </div>
                        ) : (
                            <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                                {storeName}
                            </h1>
                        )}
                    </div>

                    {/* Progress Indicator (Hidden on very small screens) */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-xs">1</span>
                            <span>{language === 'ar' ? 'السلة' : 'Cart'}</span>
                        </div>
                        <div className="w-8 h-px bg-slate-200" />
                        <div className="flex items-center gap-2 text-primary">
                            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">2</span>
                            <span>{language === 'ar' ? 'بيانات الشحن' : 'Shipping'}</span>
                        </div>
                        <div className="w-8 h-px bg-slate-200" />
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-xs">3</span>
                            <span>{language === 'ar' ? 'اتمام الطلب' : 'Complete'}</span>
                        </div>
                    </nav>

                    {/* Security Badge */}
                    <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                        <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                        <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">
                            {language === 'ar' ? 'دفع آمن 100%' : 'Secure Checkout'}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}

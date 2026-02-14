
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
        <div
            className="w-full py-4 px-6 border-b flex items-center justify-between"
            style={{ backgroundColor: settings.backgroundColor || 'white' }}
        >
            <div className="flex items-center gap-3">
                {/* Logo or Store Name */}
                {logo ? (
                    <div className="relative h-10 w-32">
                        <Image
                            src={logo}
                            alt={storeName}
                            fill
                            className="object-contain object-left"
                        />
                    </div>
                ) : (
                    <h1 className="text-xl font-bold">{storeName}</h1>
                )}
            </div>

            {settings.showLockIcon && (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Lock className="w-4 h-4" />
                    <span className="hidden sm:inline">
                        {language === 'ar' ? 'دفع آمن 100%' : '100% Secure Payment'}
                    </span>
                </div>
            )}
        </div>
    );
}

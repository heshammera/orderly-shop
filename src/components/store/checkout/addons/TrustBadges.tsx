
import { ComponentSchema } from '@/lib/store-builder/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShieldCheck, Lock, Truck, CreditCard, RotateCcw, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustBadgesProps extends ComponentSchema { }

const ICON_MAP: Record<string, any> = {
    ShieldCheck, Lock, Truck, CreditCard, RotateCcw, BadgeCheck
};

export function TrustBadges({ data }: { data: ComponentSchema }) {
    const { settings, content } = data;
    const { language } = useLanguage();
    const badges = content.badges || [];

    return (
        <div className={cn("grid gap-4 py-8 px-4 bg-white/50 rounded-2xl border border-slate-100 shadow-sm",
            settings.align === 'center' ? 'justify-content-center text-center' : 'text-left',
            badges.length === 2 ? 'grid-cols-2' : badges.length === 3 ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'
        )}>
            {badges.map((badge: any, idx: number) => {
                const Icon = ICON_MAP[badge.icon] || ShieldCheck;
                const label = typeof badge.label === 'string' ? badge.label : (badge.label?.[language] || '');
                const sublabel = typeof badge.sublabel === 'string' ? badge.sublabel : (badge.sublabel?.[language] || '');

                return (
                    <div key={idx} className="flex flex-col items-center p-4 rounded-xl hover:bg-white hover:shadow-md transition-all group border border-transparent hover:border-slate-100">
                        <div className={cn("mb-3 p-3 rounded-full bg-slate-50 group-hover:bg-primary/5 transition-colors", settings.style === 'grayscale' && 'grayscale')}>
                            <Icon className="w-6 h-6 text-slate-700 group-hover:text-primary transition-colors" />
                        </div>
                        <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 group-hover:text-primary transition-colors uppercase tracking-tight">
                            {label}
                        </h4>
                        {sublabel && (
                            <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                                {sublabel}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

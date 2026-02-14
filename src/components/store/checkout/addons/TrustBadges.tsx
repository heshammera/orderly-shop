
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
        <div className={cn("grid gap-4 py-4",
            settings.align === 'center' ? 'justify-center' : 'justify-start',
            badges.length === 2 ? 'grid-cols-2' : badges.length === 3 ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'
        )}>
            {badges.map((badge: any, idx: number) => {
                const Icon = ICON_MAP[badge.icon] || ShieldCheck;
                const label = typeof badge.label === 'string' ? badge.label : (badge.label?.[language] || '');

                return (
                    <div key={idx} className="flex flex-col items-center gap-2 text-center">
                        <div className={cn("p-2 rounded-full bg-slate-100", settings.style === 'grayscale' && 'grayscale')}>
                            <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    </div>
                );
            })}
        </div>
    );
}

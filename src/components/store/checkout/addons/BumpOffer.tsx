
import { useEffect } from 'react';
import { ComponentSchema } from '@/lib/store-builder/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCheckout } from '@/contexts/CheckoutContext';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface BumpOfferProps extends ComponentSchema { }

export function BumpOffer({ data }: { data: ComponentSchema }) {
    const { settings, content } = data;
    const { language } = useLanguage();
    const { setBumpOffer, formatPrice } = useCheckout();

    const price = Number(settings.price) || 0;
    const title = typeof content.title === 'string' ? content.title : (content.title?.[language] || 'One-Time Offer');
    const productName = typeof content.productName === 'string' ? content.productName : (content.productName?.[language] || 'Special Item');
    const rawDescription = typeof content.description === 'string' ? content.description : (content.description?.[language] || '');
    const description = rawDescription.replace('{{price}}', formatPrice(price));

    const handleCheckedChange = (checked: boolean) => {
        if (checked) {
            setBumpOffer({
                price,
                selected: true,
                label: productName
            });
        } else {
            setBumpOffer(null);
        }
    };

    return (
        <div
            className="border-2 border-dashed rounded-lg p-4 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4"
            style={{
                backgroundColor: settings.backgroundColor || '#fefce8',
                borderColor: settings.borderColor || '#facc15'
            }}
        >
            <Checkbox
                id="bump-offer"
                onCheckedChange={handleCheckedChange}
                className="mt-1"
            />
            <div className="space-y-1">
                <label
                    htmlFor="bump-offer"
                    className="font-bold cursor-pointer flex items-center gap-2"
                >
                    <Sparkles className="w-4 h-4 text-yellow-600" />
                    {title}
                    <span className="text-red-500 ml-1">({formatPrice(price)})</span>
                </label>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
}

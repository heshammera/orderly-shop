import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function StockIndicator({ stock, threshold = 5 }: { stock?: number, threshold?: number }) {
    const { language } = useLanguage();

    // If stock is undefined, null, infinite, or greater than threshold, don't show urgency.
    if (!stock || stock > threshold || stock <= 0) return null;

    return (
        <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-1 rounded w-fit mt-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">
                {language === 'ar' ? `باقي ${stock} قطع فقط!` : `Only ${stock} left in stock!`}
            </span>
        </div>
    );
}

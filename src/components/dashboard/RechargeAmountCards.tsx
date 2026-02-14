"use client";

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExchangeRate, convertUsdToTarget } from '@/hooks/useExchangeRate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RechargeAmountCardsProps {
    storeId: string;
    currency: string;
    onRecharge: (usdAmount: number, convertedAmount: number) => void;
}

const PRESET_AMOUNTS_USD = [5, 10, 20, 40, 80, 100];

export function RechargeAmountCards({ storeId, currency, onRecharge }: RechargeAmountCardsProps) {
    const { language } = useLanguage();
    const { rate, loading: rateLoading } = useExchangeRate(currency);
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

    const handleRechargeClick = (usdAmount: number) => {
        const convertedAmount = convertUsdToTarget(usdAmount, rate);
        setSelectedAmount(usdAmount);
        onRecharge(usdAmount, convertedAmount);
    };

    const formatCurrency = (amount: number, curr: string) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
            style: 'currency',
            currency: curr,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    if (rateLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                    {language === 'ar' ? 'أرصدة الشحن السريع' : 'Quick Recharge Amounts'}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="w-4 h-4" />
                    <span>
                        {language === 'ar'
                            ? `1 USD = ${rate.toFixed(2)} ${currency}`
                            : `1 USD = ${rate.toFixed(2)} ${currency}`}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PRESET_AMOUNTS_USD.map((usdAmount, index) => {
                    const convertedAmount = convertUsdToTarget(usdAmount, rate);
                    const isSelected = selectedAmount === usdAmount;

                    return (
                        <Card
                            key={index}
                            className={cn(
                                "group relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer border-2",
                                isSelected
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                            )}
                            onClick={() => handleRechargeClick(usdAmount)}
                        >
                            {/* Decorative gradient */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-500" />

                            <CardContent className="p-6 relative">
                                {/* USD Amount Badge */}
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-4">
                                    <DollarSign className="w-4 h-4" />
                                    <span>{usdAmount} USD</span>
                                </div>

                                {/* Converted Amount */}
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                        {language === 'ar' ? 'ستحصل على' : 'You will receive'}
                                    </p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {formatCurrency(convertedAmount, currency)}
                                    </p>
                                </div>

                                {/* Action Button */}
                                <Button
                                    className="w-full mt-4"
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRechargeClick(usdAmount);
                                    }}
                                >
                                    {language === 'ar' ? 'شحن الآن' : 'Recharge Now'}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <p className="text-xs text-muted-foreground text-center">
                {language === 'ar'
                    ? 'سعر الصرف يتم تحديثه تلقائياً كل 30 دقيقة'
                    : 'Exchange rate updates automatically every 30 minutes'}
            </p>
        </div>
    );
}

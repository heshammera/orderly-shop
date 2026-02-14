"use client";

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { WalletBalance } from '@/components/dashboard/WalletBalance';
import { TransactionHistory } from '@/components/dashboard/TransactionHistory';
import { RechargeHistoryTable } from '@/components/dashboard/RechargeHistoryTable';
import { RechargeAmountCards } from '@/components/dashboard/RechargeAmountCards';
import { WalletRechargeDialog } from '@/components/dashboard/WalletRechargeDialog';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function WalletPage({ params }: { params: { storeId: string } }) {
    const { language } = useLanguage();
    const [currency, setCurrency] = useState('SAR');
    const [loading, setLoading] = useState(true);
    const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState<{ usd: number; converted: number } | null>(null);

    useEffect(() => {
        const fetchStoreCurrency = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('stores')
                .select('currency')
                .eq('id', params.storeId)
                .single();

            if (data?.currency) {
                setCurrency(data.currency);
            }
            setLoading(false);
        };
        fetchStoreCurrency();
    }, [params.storeId]);

    const handleRechargeClick = (usdAmount: number, convertedAmount: number) => {
        setSelectedAmount({ usd: usdAmount, converted: convertedAmount });
        setRechargeDialogOpen(true);
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold">
                    {language === 'ar' ? 'المحفظة' : 'Wallet'}
                </h1>
                <p className="text-muted-foreground">
                    {language === 'ar' ? 'إدارة رصيد المتجر والمعاملات' : 'Manage store balance and transactions'}
                </p>
            </div>

            {/* Balance Cards */}
            <WalletBalance storeId={params.storeId} currency={currency} />

            {/* Recharge Amount Cards */}
            <RechargeAmountCards
                storeId={params.storeId}
                currency={currency}
                onRecharge={handleRechargeClick}
            />

            {/* Recharge History Table */}
            <RechargeHistoryTable storeId={params.storeId} currency={currency} />

            {/* Transaction History Table */}
            <TransactionHistory storeId={params.storeId} currency={currency} />

            {/* Recharge Dialog (controlled) */}
            <WalletRechargeDialog
                storeId={params.storeId}
                storeCurrency={currency}
                presetUsdAmount={selectedAmount?.usd}
                isOpen={rechargeDialogOpen}
                onOpenChange={(open) => {
                    setRechargeDialogOpen(open);
                    if (!open) setSelectedAmount(null);
                }}
                onSuccess={() => {
                    setRechargeDialogOpen(false);
                    setSelectedAmount(null);
                    window.location.reload();
                }}
                showTrigger={false}
            />
        </div>
    );
}

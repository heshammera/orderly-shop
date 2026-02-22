"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, DollarSign, ArrowUpRight, Loader2, AlertTriangle } from 'lucide-react';
import { WalletRechargeDialog } from './WalletRechargeDialog';

interface WalletBalanceProps {
    storeId: string;
    currency: string;
}

export function WalletBalance({ storeId, currency }: WalletBalanceProps) {
    const supabase = createClient();
    const { language } = useLanguage();
    const [balance, setBalance] = useState(0); // Stores USD balance
    const [hasUnlimitedBalance, setHasUnlimitedBalance] = useState(false);
    const [pendingBalance, setPendingBalance] = useState(0);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [loading, setLoading] = useState(true);

    // Fetch exchange rate for the store's currency
    const { rate, loading: rateLoading } = useExchangeRate(currency);

    useEffect(() => {
        fetchWalletData();
    }, [storeId]);

    const fetchWalletData = async () => {
        setLoading(true);
        try {
            // 1. Get main balance from stores table (source of truth) - NOW IN USD
            const { data: storeData } = await supabase
                .from('stores')
                .select('balance, currency, has_unlimited_balance')
                .eq('id', storeId)
                .single();

            // 2. Get pending recharges
            const { data: pendingRecharges } = await supabase
                .from('wallet_recharge_requests')
                .select('amount_local')
                .eq('store_id', storeId)
                .eq('status', 'pending');

            const pendingRechargeAmount = pendingRecharges?.reduce((sum, req) => sum + (req.amount_local || 0), 0) || 0;

            // 3. Get other wallet stats (earnings, etc) - optional if store_wallets view exists
            const { data: walletStats } = await supabase
                .from('store_wallets')
                .select('pending_balance, total_earnings')
                .eq('store_id', storeId)
                .single();

            // Store balance is the main available balance (in USD)
            if (storeData) {
                // We don't set balance directly, we wait for exchange rate
                const usdBalance = storeData.balance || 0;
                setBalance(usdBalance);
                setHasUnlimitedBalance(storeData.has_unlimited_balance || false);
            }

            // Pending balance = Pending Orders (from view) + Pending Recharges
            const pendingOrders = walletStats?.pending_balance || 0;
            // Note: Pending recharges are already in local currency in the DB (amount_local)
            // Pending orders should also be in local currency? 
            // Assuming pending_balance from store_wallets view is in local currency.
            setPendingBalance(pendingOrders + pendingRechargeAmount);

            setTotalEarnings(walletStats?.total_earnings || 0);

        } catch (error) {
            console.error('Error fetching wallet:', error);
        } finally {
            setLoading(false);
        }
    };

    const isLowBalance = balance < 5;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* Available Balance Card - Dynamic Color */}
            {hasUnlimitedBalance ? (
                <Card className="relative overflow-hidden shadow-lg transition-all duration-300 bg-gradient-to-br from-amber-50 via-amber-50/50 to-background dark:from-amber-950/20 dark:via-amber-950/10 border-amber-200 dark:border-amber-900/50">
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-16 translate-x-16 bg-amber-400/20" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">
                            {language === 'ar' ? 'باقة غير محدودة (VIP)' : 'Unlimited VIP Balance'}
                        </CardTitle>
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                            <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold text-amber-600 dark:text-amber-400 drop-shadow-sm">
                            ∞ <span className="text-lg font-medium text-amber-700 dark:text-amber-500">{language === 'ar' ? 'غير محدود' : 'Unlimited'}</span>
                        </div>
                        <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-2 font-medium">
                            {language === 'ar' ? 'متجرك مميز ولا يتم سحب عمولات من المحفظة ✨' : 'Your store is premium. No commissions are deducted ✨'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card className={`relative overflow-hidden shadow-lg transition-all duration-300 ${isLowBalance
                    ? 'bg-gradient-to-br from-red-50 via-red-50/50 to-background dark:from-red-950/20 dark:via-red-950/10 border-red-200 dark:border-red-900/50'
                    : 'bg-gradient-to-br from-green-50 via-green-50/50 to-background dark:from-green-950/20 dark:via-green-950/10 border-green-200 dark:border-green-900/50'
                    }`}>
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-16 translate-x-16 ${isLowBalance ? 'bg-red-400/20' : 'bg-green-400/20'
                        }`} />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className={`text-sm font-medium ${isLowBalance ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'
                            }`}>
                            {language === 'ar' ? 'الرصيد المتاح' : 'Available Balance'}
                        </CardTitle>
                        <div className={`p-2 rounded-lg ${isLowBalance
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : 'bg-green-100 dark:bg-green-900/30'
                            }`}>
                            <Wallet className={`h-4 w-4 ${isLowBalance ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                                }`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                            {(balance * rate).toFixed(2)} <span className="text-sm font-normal text-muted-foreground">{currency}</span>
                        </div>
                        {isLowBalance && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {language === 'ar' ? 'رصيد منخفض! يرجى الشحن' : 'Low balance! Please recharge'}
                            </p>
                        )}
                        {!isLowBalance && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                                {language === 'ar' ? 'الرصيد جيد ✓' : 'Balance is healthy ✓'}
                            </p>
                        )}
                        <div className="flex gap-2 mt-4">
                            <WalletRechargeDialog storeId={storeId} storeCurrency={currency} onSuccess={fetchWalletData} />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pending Balance Card */}
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                        {language === 'ar' ? 'رصيد قيد المعالجة' : 'Pending Balance'}
                    </CardTitle>
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                        <DollarSign className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{pendingBalance.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">{currency}</span></div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {language === 'ar' ? 'من الطلبات قيد التنفيذ' : 'From processing orders'}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

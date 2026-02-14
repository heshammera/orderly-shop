"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Loader2, ChevronDown } from 'lucide-react';

interface RechargeHistoryTableProps {
    storeId: string;
    currency: string;
}

interface RechargeRequest {
    id: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    payment_method: string;
    created_at: string;
}

const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
    approved: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_LABELS = {
    pending: { ar: 'قيد الانتظار', en: 'Pending' },
    approved: { ar: 'معتمد', en: 'Approved' },
    rejected: { ar: 'مرفوض', en: 'Rejected' },
};

export function RechargeHistoryTable({ storeId, currency }: RechargeHistoryTableProps) {
    const supabase = createClient();
    const { language } = useLanguage();
    const [recharges, setRecharges] = useState<RechargeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchRecharges();
    }, [storeId]);

    const fetchRecharges = async () => {
        try {
            setLoading(true);
            const limit = showAll ? 100 : 5;

            const { data, error, count } = await supabase
                .from('recharge_requests')
                .select('*', { count: 'exact' })
                .eq('store_id', storeId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            setRecharges(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error('Error fetching recharge history:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(dateStr));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const handleLoadMore = () => {
        setShowAll(true);
        fetchRecharges();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    {language === 'ar' ? 'سجل الشحن' : 'Recharge History'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : recharges.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>{language === 'ar' ? 'لا توجد عمليات شحن بعد' : 'No recharge history yet'}</p>
                    </div>
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                                        <TableHead>{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                                        <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                                        <TableHead>{language === 'ar' ? 'طريقة الدفع' : 'Method'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recharges.map((recharge) => (
                                        <TableRow key={recharge.id}>
                                            <TableCell className="font-medium">
                                                {formatDate(recharge.created_at)}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold">
                                                    {formatCurrency(recharge.amount)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={STATUS_COLORS[recharge.status]}>
                                                    {STATUS_LABELS[recharge.status][language]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="capitalize">
                                                {recharge.payment_method || (language === 'ar' ? 'غير محدد' : 'N/A')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {!showAll && totalCount > 5 && (
                            <div className="flex justify-center mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLoadMore}
                                    className="gap-2"
                                >
                                    {language === 'ar' ? 'تحميل المزيد' : 'Load More'}
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

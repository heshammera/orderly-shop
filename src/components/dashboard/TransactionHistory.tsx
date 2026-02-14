"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowDownLeft, ArrowUpRight, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
    id: string;
    type: string;
    amount: number;
    description: string;
    status: string;
    created_at: string;
}

interface TransactionHistoryProps {
    storeId: string;
    currency: string;
}

export function TransactionHistory({ storeId, currency }: TransactionHistoryProps) {
    const supabase = createClient();
    const { language } = useLanguage();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchTransactions();
    }, [storeId, showAll]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const limit = showAll ? 100 : 5;

            const { data, error, count } = await supabase
                .from('wallet_transactions')
                .select('*', { count: 'exact' })
                .eq('store_id', storeId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            setTransactions(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        setShowAll(true);
    };

    const getTypeIcon = (type: string) => {
        return type === 'credit' ? (
            <ArrowDownLeft className="w-4 h-4 text-green-600" />
        ) : (
            <ArrowUpRight className="w-4 h-4 text-red-600" />
        );
    };

    const getTypeColor = (type: string) => {
        return type === 'credit' ? 'text-green-600' : 'text-red-600';
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex justify-center items-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <ArrowDownLeft className="w-5 h-5 text-primary" />
                    {language === 'ar' ? 'سجل المعاملات' : 'Transaction History'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {transactions.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
                        <p className="text-muted-foreground text-sm">
                            {language === 'ar' ? 'لا توجد معاملات حتى الآن' : 'No transactions recorded yet'}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                                    <TableHead>{language === 'ar' ? 'الوصف' : 'Description'}</TableHead>
                                    <TableHead className="text-right">{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {format(new Date(transaction.created_at), 'yyyy/MM/dd HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium text-sm">{transaction.description}</span>
                                                <div className="flex items-center gap-1.5">
                                                    {getTypeIcon(transaction.type)}
                                                    <Badge variant="outline" className="text-xs py-0 h-5 font-normal">
                                                        {transaction.type === 'credit'
                                                            ? (language === 'ar' ? 'إيداع' : 'Credit')
                                                            : (language === 'ar' ? 'خصم' : 'Debit')
                                                        }
                                                    </Badge>
                                                    <Badge variant={transaction.status === 'completed' ? 'secondary' : 'outline'} className="text-xs py-0 h-5 font-normal">
                                                        {transaction.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className={`text-right font-bold ${getTypeColor(transaction.type)}`}>
                                            <div dir="ltr">
                                                {transaction.type === 'credit' ? '+' : '-'}{transaction.amount.toFixed(2)} {currency}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

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
            </CardContent>
        </Card>
    );
}

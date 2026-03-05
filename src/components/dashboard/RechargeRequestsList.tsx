"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, ExternalLink, ArrowUpRight, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RechargeRequest {
    id: string;
    amount_local: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    rejection_reason?: string;
    proof_image?: string;
}

export function RechargeRequestsList({ storeId, currency }: { storeId: string, currency: string }) {
    const { language } = useLanguage();
    const supabase = createClient();
    const [requests, setRequests] = useState<RechargeRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();

        // Subscribe to changes
        const channel = supabase
            .channel('recharge_requests_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'wallet_recharge_requests',
                    filter: `store_id=eq.${storeId}`
                },
                () => {
                    fetchRequests();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [storeId]);

    const fetchRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('wallet_recharge_requests')
                .select('*')
                .eq('store_id', storeId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-500 hover:bg-green-600">{language === 'ar' ? 'مقبول' : 'Approved'}</Badge>;
            case 'rejected':
                return <Badge variant="destructive">{language === 'ar' ? 'مرفوض' : 'Rejected'}</Badge>;
            default:
                return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">{language === 'ar' ? 'قيد المراجعة' : 'Pending'}</Badge>;
        }
    };

    if (loading) return (
        <Card className="h-full">
            <CardContent className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </CardContent>
        </Card>
    );

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5 text-primary" />
                    {language === 'ar' ? 'سجل شحن الرصيد' : 'Recharge Requests'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {requests.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
                        <p className="text-muted-foreground text-sm">
                            {language === 'ar' ? 'لا توجد طلبات شحن' : 'No recharge requests found'}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                                    <TableHead>{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                                    <TableHead className="w-[100px]">{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                                    <TableHead className="text-end">{language === 'ar' ? 'الإيصال' : 'Receipt'}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {format(new Date(request.created_at), 'yyyy/MM/dd HH:mm')}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {request.amount_local} {currency}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2">
                                                <div>{getStatusBadge(request.status)}</div>
                                                {request.status === 'rejected' && request.rejection_reason && (
                                                    <Alert variant="destructive" className="py-2 px-3 mt-1 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50">
                                                        <AlertCircle className="h-3.5 w-3.5" />
                                                        <AlertDescription className="text-[11px] leading-tight opacity-90">
                                                            <span className="font-semibold block mb-0.5">
                                                                {language === 'ar' ? 'سبب الرفض:' : 'Rejection Reason:'}
                                                            </span>
                                                            {request.rejection_reason}
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-end">
                                            {request.proof_image ? (
                                                <a
                                                    href={request.proof_image}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-sm font-medium transition-colors"
                                                >
                                                    {language === 'ar' ? 'عرض' : 'View'}
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">-</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

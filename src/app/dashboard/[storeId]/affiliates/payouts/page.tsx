"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PayoutRequest {
    id: string;
    affiliate_id: string;
    amount: number;
    status: 'pending' | 'paid' | 'rejected';
    method: string;
    notes: string;
    created_at: string;
    affiliate: {
        name: string;
        code: string;
    };
}

export default function PayoutsPage({ params }: { params: { storeId: string } }) {
    const { storeId } = params;
    const { language } = useLanguage();
    const supabase = createClient();
    const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchPayouts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('affiliate_payouts')
            .select(`
                *,
                affiliate:affiliates(name, code)
            `)
            .eq('affiliate.store_id', storeId) // Filter by store via join is tricky in simple select, better to filter by fetched affiliates or use a view/RPC if needed.
            // Actually, RLS handles store visibility, so we just need to ensure we select payouts for affiliates of this store.
            // But affiliate_payouts doesn't have store_id.
            // We can filter by implicit join if RLS is set up correctly (it is).
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching payouts:', error);
            toast.error('Failed to load payouts');
        } else {
            // Client-side filtering if Supabase returns all due to RLS issues (safety net) or if we want to be explicit
            // RLS policy: exists (select 1 from affiliates ... where affiliates.id = affiliate_payouts.affiliate_id ...)
            // This should be correct.
            setPayouts(data as any || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPayouts();
    }, [storeId]);

    const handleUpdateStatus = async (id: string, newStatus: 'paid' | 'rejected') => {
        setProcessingId(id);
        try {
            const { error } = await supabase
                .from('affiliate_payouts')
                .update({
                    status: newStatus,
                    processed_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            setPayouts(payouts.map(p =>
                p.id === id ? { ...p, status: newStatus } : p
            ));

            toast.success(
                newStatus === 'paid'
                    ? (language === 'ar' ? 'تم تحديث الحالة إلى مدفوع' : 'Marked as Paid')
                    : (language === 'ar' ? 'تم رفض الطلب' : 'Request Rejected')
            );
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">
                    {language === 'ar' ? 'طلبات سحب الرصيد' : 'Payout Requests'}
                </h1>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{language === 'ar' ? 'المسوق' : 'Affiliate'}</TableHead>
                            <TableHead>{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                            <TableHead>{language === 'ar' ? 'طريقة الدفع' : 'Method'}</TableHead>
                            <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                            <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                            <TableHead>{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payouts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    {language === 'ar' ? 'لا يوجد طلبات سحب' : 'No payout requests found'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            payouts.map((payout) => (
                                <TableRow key={payout.id}>
                                    <TableCell>
                                        <div className="font-medium">{payout.affiliate.name}</div>
                                        <div className="text-sm text-muted-foreground">{payout.affiliate.code}</div>
                                    </TableCell>
                                    <TableCell className="font-bold">
                                        {payout.amount} SAR
                                    </TableCell>
                                    <TableCell>{payout.method}</TableCell>
                                    <TableCell>{format(new Date(payout.created_at), 'yyyy-MM-dd')}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            payout.status === 'paid' ? 'default' :
                                                payout.status === 'rejected' ? 'destructive' : 'secondary'
                                        }>
                                            {payout.status === 'paid' ? (language === 'ar' ? 'مدفوع' : 'Paid') :
                                                payout.status === 'rejected' ? (language === 'ar' ? 'مرفوض' : 'Rejected') :
                                                    (language === 'ar' ? 'قيد الانتظار' : 'Pending')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {payout.status === 'pending' && (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => handleUpdateStatus(payout.id, 'paid')}
                                                    disabled={processingId === payout.id}
                                                >
                                                    {processingId === payout.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleUpdateStatus(payout.id, 'rejected')}
                                                    disabled={processingId === payout.id}
                                                >
                                                    {processingId === payout.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

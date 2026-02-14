"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, CheckCircle, XCircle, Eye, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface RechargeRequest {
    id: string;
    store_id: string;
    stores: { name: any };
    amount_usd: number;
    amount_local: number;
    exchange_rate: number;
    status: 'pending' | 'approved' | 'rejected';
    proof_image: string | null;
    created_at: string;
}

export function RechargeRequests() {
    const { language } = useLanguage();
    const supabase = createClient();
    const [requests, setRequests] = useState<RechargeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<RechargeRequest | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [proofUrl, setProofUrl] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('wallet_recharge_requests')
                .select('*, stores(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error(language === 'ar' ? 'فشل تحميل الطلبات' : 'Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const handleViewRequest = async (request: RechargeRequest) => {
        setSelectedRequest(request);
        if (request.proof_image) {
            const { data } = await supabase.storage.from('recharge-proofs').createSignedUrl(request.proof_image, 3600);
            if (data?.signedUrl) {
                setProofUrl(data.signedUrl);
            }
        } else {
            setProofUrl(null);
        }
    };

    const handleAction = async (action: 'approve' | 'reject') => {
        if (!selectedRequest) return;
        setIsProcessing(true);

        try {
            if (action === 'approve') {
                // 1. Update Request Status
                const { error: updateError } = await supabase
                    .from('wallet_recharge_requests')
                    .update({ status: 'approved' })
                    .eq('id', selectedRequest.id);

                if (updateError) throw updateError;

                // 2. Add Balance to Store (RPC)
                const { error: storeError } = await supabase.rpc('increment_store_balance', {
                    store_id_input: selectedRequest.store_id,
                    amount_input: selectedRequest.amount_local
                });

                if (storeError) {
                    console.error("RPC Error, falling back to manual update", storeError);
                    // Fallback manual update if RPC fails/missing
                    const { data: store } = await supabase.from('stores').select('balance').eq('id', selectedRequest.store_id).single();
                    const newBalance = (store?.balance || 0) + selectedRequest.amount_local;
                    await supabase.from('stores').update({ balance: newBalance }).eq('id', selectedRequest.store_id);
                }

                // 3. Create Transaction Record
                await supabase.from('wallet_transactions').insert({
                    store_id: selectedRequest.store_id,
                    amount: selectedRequest.amount_local,
                    type: 'deposit',
                    description: `Recharge Approved (Req: ${selectedRequest.id.split('-')[0]}) - $${selectedRequest.amount_usd}`,
                    reference_id: selectedRequest.id
                });

                toast.success(language === 'ar' ? 'تم الموافقة على الطلب وتحديث الرصيد' : 'Request approved and balance updated');

            } else {
                // Reject
                const { error } = await supabase
                    .from('wallet_recharge_requests')
                    .update({ status: 'rejected' })
                    .eq('id', selectedRequest.id);

                if (error) throw error;
                toast.success(language === 'ar' ? 'تم رفض الطلب' : 'Request rejected');
            }

            fetchRequests();
            setSelectedRequest(null);

        } catch (error: any) {
            console.error('Action error:', error);
            toast.error((language === 'ar' ? 'حدث خطأ: ' : 'Action failed: ') + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const getStoreName = (name: any) => {
        if (!name) return 'Unknown';
        return typeof name === 'string'
            ? JSON.parse(name)[language] || JSON.parse(name).en
            : name[language] || name.en || name.ar;
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{language === 'ar' ? 'جميع الطلبات' : 'All Requests'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                                <TableHead>{language === 'ar' ? 'المتجر' : 'Store'}</TableHead>
                                <TableHead>{language === 'ar' ? 'المبلغ (USD)' : 'Amount (USD)'}</TableHead>
                                <TableHead>{language === 'ar' ? 'المبلغ المحلي' : 'Local Amount'}</TableHead>
                                <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                                <TableHead>{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-medium">{getStoreName(req.stores?.name)}</TableCell>
                                    <TableCell>${req.amount_usd}</TableCell>
                                    <TableCell>{req.amount_local.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}>
                                            {req.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" onClick={() => handleViewRequest(req)}>
                                            <Eye className="w-4 h-4 mr-1" /> {language === 'ar' ? 'عرض' : 'View'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {requests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                        {language === 'ar' ? 'لا توجد طلبات.' : 'No requests found.'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Approval Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{language === 'ar' ? 'مراجعة طلب الشحن' : 'Review Recharge Request'}</DialogTitle>
                        <DialogDescription>
                            {language === 'ar' ? 'مراجعة إيصال الدفع والموافقة أو الرفض.' : 'Review the payment proof and approve or reject the request.'}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="font-medium text-muted-foreground">{language === 'ar' ? 'المتجر:' : 'Store:'}</span>
                                    <span>{getStoreName(selectedRequest.stores?.name)}</span>

                                    <span className="font-medium text-muted-foreground">{language === 'ar' ? 'المبلغ (USD):' : 'Amount (USD):'}</span>
                                    <span className="font-bold text-green-600">${selectedRequest.amount_usd}</span>

                                    <span className="font-medium text-muted-foreground">{language === 'ar' ? 'المبلغ المحلي:' : 'Local Amount:'}</span>
                                    <span>{selectedRequest.amount_local.toFixed(2)}</span>

                                    <span className="font-medium text-muted-foreground">{language === 'ar' ? 'سعر الصرف:' : 'Exchange Rate:'}</span>
                                    <span>{selectedRequest.exchange_rate}</span>

                                    <span className="font-medium text-muted-foreground">{language === 'ar' ? 'التاريخ:' : 'Date:'}</span>
                                    <span>{new Date(selectedRequest.created_at).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="border rounded-lg p-2 bg-muted/10 flex items-center justify-center min-h-[200px]">
                                {proofUrl ? (
                                    <a href={proofUrl} target="_blank" rel="noreferrer" className="relative group">
                                        <img src={proofUrl} alt="Proof" className="max-h-[300px] object-contain rounded" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                                            <ExternalLink className="text-white" />
                                        </div>
                                    </a>
                                ) : (
                                    <span className="text-muted-foreground">{language === 'ar' ? 'لا توجد صورة' : 'No proof image uploaded'}</span>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        {selectedRequest?.status === 'pending' && (
                            <>
                                <Button variant="destructive" onClick={() => handleAction('reject')} disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                    {language === 'ar' ? 'رفض' : 'Reject'}
                                </Button>
                                <Button onClick={() => handleAction('approve')} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    {language === 'ar' ? 'موافقة وإضافة الرصيد' : 'Approve & Add Balance'}
                                </Button>
                            </>
                        )}
                        {selectedRequest?.status !== 'pending' && (
                            <Button variant="secondary" onClick={() => setSelectedRequest(null)}>{language === 'ar' ? 'إغلاق' : 'Close'}</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

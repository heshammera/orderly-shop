import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

export default function AdminRechargeRequests() {
    const { language } = useLanguage();
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
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const handleViewRequest = async (request: RechargeRequest) => {
        setSelectedRequest(request);
        if (request.proof_image) {
            const { data } = await supabase.storage.from('recharge-proofs').createSignedUrl(request.proof_image, 3600); // 1 hour expiry
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

                // 2. Add Balance to Store (RPC or manual update - creating transaction is safer)
                // We will manually update store balance + create transaction for now

                // Get current balance first (optional check) or just increment
                // For atomicity, an RPC is better, but here we do 2 steps for simplicity in MVP
                // Note: In production, wrap in RPC function `approve_wallet_recharge`

                // Increment Store Balance with LOCAL AMOUNT
                // The balance is stored in store's local currency
                const { error: storeError } = await supabase.rpc('increment_store_balance', {
                    store_id_input: selectedRequest.store_id,
                    amount_input: selectedRequest.amount_local
                });

                // Fallback if RPC doesn't exist
                if (storeError) {
                    const { data: store } = await supabase.from('stores').select('balance').eq('id', selectedRequest.store_id).single();
                    const newBalance = (store?.balance || 0) + selectedRequest.amount_local;

                    await supabase.from('stores').update({ balance: newBalance }).eq('id', selectedRequest.store_id);
                }

                // Create Transaction Record
                await supabase.from('wallet_transactions').insert({
                    store_id: selectedRequest.store_id,
                    amount: selectedRequest.amount_local,
                    type: 'deposit',
                    description: `Recharge Approved (Req: ${selectedRequest.id.split('-')[0]}) - $${selectedRequest.amount_usd}`,
                    reference_id: selectedRequest.id
                });

                toast.success('Request approved and balance updated');

            } else {
                // Reject
                const { error } = await supabase
                    .from('wallet_recharge_requests')
                    .update({ status: 'rejected' })
                    .eq('id', selectedRequest.id);

                if (error) throw error;
                toast.success('Request rejected');
            }

            // Refresh
            fetchRequests();
            setSelectedRequest(null);

        } catch (error: any) {
            console.error('Action error:', error);
            toast.error('Action failed: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const getStoreName = (name: any) => {
        if (!name) return 'Unknown';
        return typeof name === 'string' ? JSON.parse(name)[language] || JSON.parse(name).en : name[language] || name.en || name.ar;
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Recharge Requests</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Store</TableHead>
                                <TableHead>Amount (USD)</TableHead>
                                <TableHead>Local Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
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
                                            <Eye className="w-4 h-4 mr-1" /> View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {requests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                        No requests found.
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
                        <DialogTitle>Review Recharge Request</DialogTitle>
                        <DialogDescription>
                            Review the payment proof and approve or reject the request.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="font-medium text-muted-foreground">Store:</span>
                                    <span>{getStoreName(selectedRequest.stores?.name)}</span>

                                    <span className="font-medium text-muted-foreground">Amount (USD):</span>
                                    <span className="font-bold text-green-600">${selectedRequest.amount_usd}</span>

                                    <span className="font-medium text-muted-foreground">Local Amount:</span>
                                    <span>{selectedRequest.amount_local.toFixed(2)}</span>

                                    <span className="font-medium text-muted-foreground">Exchange Rate:</span>
                                    <span>{selectedRequest.exchange_rate}</span>

                                    <span className="font-medium text-muted-foreground">Date:</span>
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
                                    <span className="text-muted-foreground">No proof image uploaded</span>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        {selectedRequest?.status === 'pending' && (
                            <>
                                <Button variant="destructive" onClick={() => handleAction('reject')} disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                    Reject
                                </Button>
                                <Button onClick={() => handleAction('approve')} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    Approve & Add Balance
                                </Button>
                            </>
                        )}
                        {selectedRequest?.status !== 'pending' && (
                            <Button variant="secondary" onClick={() => setSelectedRequest(null)}>Close</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

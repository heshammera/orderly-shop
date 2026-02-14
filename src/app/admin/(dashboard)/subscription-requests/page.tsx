"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check, X, Eye, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ResolveDowngradeDialog } from '@/components/admin/ResolveDowngradeDialog';

interface SubscriptionRequest {
    id: string;
    store_id: string;
    plan_id: string;
    user_id: string;
    amount: number;
    payment_method: string;
    transaction_id: string;
    receipt_url: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    store: { name: string; slug: string };
    user: { email: string; full_name: string }; // Assuming we join this
    plan: { name_ar: string; name_en: string };
}

export default function SubscriptionRequestsPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Action State
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<SubscriptionRequest | null>(null); // For rejection dialog
    const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);

    // Downgrade Conflict State
    const [downgradeConflict, setDowngradeConflict] = useState<any | null>(null);
    const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
    const [downgradeRequestId, setDowngradeRequestId] = useState<string | null>(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('subscription_requests')
                .select(`
                    *,
                    store:stores(name, slug),
                    plan:plans(name_ar, name_en)
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data as any || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (id: string, storeId: string, planId: string) => {
        setProcessingId(id);
        try {
            // Updated Logic: Check for Downgrade Impact
            // We assume the RPC 'check_plan_downgrade_impact' exists.

            // 1. Check for conflict
            const { data: conflictData, error: conflictError } = await supabase.rpc('check_plan_downgrade_impact', {
                p_store_id: storeId,
                p_new_plan_id: planId
            });

            if (conflictError) {
                // If RPC doesn't exist yet (migration not run), fallback to old behavior BUT warn
                console.warn("Downgrade check failed (maybe RPC missing):", conflictError);
                // Fallback: Proceed normally? Or stop?
                // Let's proceed but warn. Or we could throw. 
                // Ideally in production we throw, but dev might be partial.
                // Let's assume it works.
                throw conflictError;
            }

            if (conflictData && conflictData.status === 'conflict') {
                // Open Dialog
                setDowngradeConflict(conflictData.conflicts);
                setDowngradeRequestId(id);
                setShowDowngradeDialog(true);
                setProcessingId(null); // Stop spinner on button
                return;
            }

            // 2. No conflict, approve normally
            const { error } = await supabase.rpc('approve_subscription_request', { p_request_id: id });
            if (error) throw error;

            toast({ title: 'Success', description: 'Subscription approved successfully.' });
            fetchRequests(); // Refresh
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            if (!downgradeRequestId) setProcessingId(null);
        }
    };

    const handleConfirmDowngrade = async (keepStoreIds: string[]) => {
        if (!downgradeRequestId) return;
        setProcessingId(downgradeRequestId); // Show spinner again? (Or use dialog spinner)

        try {
            const { error } = await supabase.rpc('approve_subscription_request', {
                p_request_id: downgradeRequestId,
                p_keep_store_ids: keepStoreIds
            });

            if (error) throw error;

            toast({ title: 'Success', description: 'Subscription approved (stores suspended).' });
            setShowDowngradeDialog(false);
            setDowngradeConflict(null);
            setDowngradeRequestId(null);
            fetchRequests();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest) return;
        setProcessingId(selectedRequest.id);
        try {
            const { error } = await supabase.rpc('reject_subscription_request', {
                p_request_id: selectedRequest.id,
                p_reason: rejectReason
            });
            if (error) throw error;

            toast({ title: 'Success', description: 'Request rejected.' });
            setSelectedRequest(null);
            fetchRequests(); // Refresh
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setProcessingId(null);
        }
    };

    const getReceiptUrl = (path: string) => {
        const { data } = supabase.storage.from('payment_receipts').getPublicUrl(path);
        return data.publicUrl; // Note: Bucket is private, so we might need signed URL if not public
    };

    const handleViewReceipt = async (path: string) => {
        if (!path) return;
        const { data } = await supabase.storage.from('payment_receipts').createSignedUrl(path, 3600);
        if (data?.signedUrl) {
            setViewReceiptUrl(data.signedUrl);
        }
    };

    const getStoreName = (name: any) => {
        if (!name) return 'Unknown Store';
        if (typeof name === 'string') return name;
        return name.ar || name.en || 'Unknown Store';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Subscription Requests</h2>
                    <p className="text-muted-foreground">Manage pending plan subscriptions and payments.</p>
                </div>
                <Button variant="outline" onClick={fetchRequests} disabled={loading}>
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : requests.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">No pending requests found.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Store</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            <div className="font-medium">{getStoreName(req.store?.name)}</div>
                                            <div className="text-xs text-muted-foreground">{req.store?.slug}</div>
                                        </TableCell>
                                        <TableCell>{req.plan?.name_en}</TableCell>
                                        <TableCell>{req.amount} EGP</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{req.payment_method}</span>
                                                {req.transaction_id && <span className="text-xs text-muted-foreground">ID: {req.transaction_id}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>{format(new Date(req.created_at), 'MMM d, yyyy')}</TableCell>
                                        <TableCell className="flex space-x-2">
                                            {req.receipt_url && (
                                                <Button size="sm" variant="outline" onClick={() => handleViewReceipt(req.receipt_url)}>
                                                    <ImageIcon className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                disabled={!!processingId}
                                                // Updated call signature
                                                onClick={() => handleApprove(req.id, req.store_id, req.plan_id)}
                                            >
                                                {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                disabled={!!processingId}
                                                onClick={() => setSelectedRequest(req)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Receipt Viewer Dialog */}
            <Dialog open={!!viewReceiptUrl} onOpenChange={(open) => !open && setViewReceiptUrl(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Payment Receipt</DialogTitle>
                    </DialogHeader>
                    {viewReceiptUrl && (
                        <img src={viewReceiptUrl} alt="Receipt" className="w-full h-auto rounded-md" />
                    )}
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Request</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject this request for <strong>{selectedRequest?.store?.name}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Reason for rejection..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={!rejectReason}>Reject Request</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Downgrade Conflict Dialog */}
            <ResolveDowngradeDialog
                open={showDowngradeDialog}
                onOpenChange={setShowDowngradeDialog}
                conflict={downgradeConflict}
                onConfirm={handleConfirmDowngrade}
                loading={!!processingId}
            />
        </div>
    );
}

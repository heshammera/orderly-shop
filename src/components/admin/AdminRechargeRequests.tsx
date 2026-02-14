"use client";

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle2, XCircle, Image as ImageIcon, Phone, DollarSign, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface RechargeRequest {
    id: string;
    store_id: string;
    amount_usd: number;
    amount_local: number;
    exchange_rate: number;
    sender_phone: string;
    proof_image: string;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string;
    created_at: string;
    store?: {
        name: string | { ar: string; en: string };
        currency: string;
    };
}

export function AdminRechargeRequests() {
    const { language } = useLanguage();
    const { toast } = useToast();
    const supabase = createClient();

    // Helper to safely get store name
    const getStoreName = (store: RechargeRequest['store']) => {
        if (!store) return '';
        if (typeof store.name === 'string') return store.name;
        // Handle object case safely
        const nameObj = store.name as { ar: string; en: string };
        return nameObj[language as 'ar' | 'en'] || nameObj.en || nameObj.ar || 'Unknown';
    };

    const [requests, setRequests] = useState<RechargeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [selectedRequest, setSelectedRequest] = useState<RechargeRequest | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [signedUrl, setSignedUrl] = useState<string>('');

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    useEffect(() => {
        const generateSignedUrl = async () => {
            if (!selectedRequest?.proof_image) {
                setSignedUrl('');
                return;
            }

            try {
                // Check if it's already a full URL that works (e.g. external link)
                // If it's a supabase storage URL, we try to extract the path
                const url = new URL(selectedRequest.proof_image);
                if (url.pathname.includes('/storage/v1/object/public/recharge-proofs/')) {
                    const path = url.pathname.split('/recharge-proofs/')[1];
                    if (path) {
                        const { data, error } = await supabase.storage
                            .from('recharge-proofs')
                            .createSignedUrl(decodeURIComponent(path), 60 * 60); // 1 hour

                        if (data?.signedUrl) {
                            setSignedUrl(data.signedUrl);
                            return;
                        }
                    }
                }
                // Fallback: use original URL
                setSignedUrl(selectedRequest.proof_image);
            } catch (e) {
                // If parsing fails, use original string
                setSignedUrl(selectedRequest.proof_image);
            }
        };

        if (dialogOpen && selectedRequest) {
            generateSignedUrl();
        }
    }, [selectedRequest, dialogOpen]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('wallet_recharge_requests')
                .select('*, store:stores(name, currency)')
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;
            if (error) throw error;

            setRequests(data || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (request: RechargeRequest) => {
        try {
            setProcessing(true);
            const { error } = await supabase.rpc('approve_recharge_request', {
                request_id: request.id
            });

            if (error) throw error;

            toast({
                title: language === 'ar' ? '✅ تم القبول' : '✅ Approved',
                description: language === 'ar'
                    ? `تم إضافة ${request.amount_local} ${request.store?.currency} لمتجر ${getStoreName(request.store)}`
                    : `Added ${request.amount_local} ${request.store?.currency} to ${getStoreName(request.store)}`,
                className: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900"
            });

            setDialogOpen(false);
            fetchRequests();
        } catch (error: any) {
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async (request: RechargeRequest) => {
        try {
            setProcessing(true);
            const { error } = await supabase.rpc('reject_recharge_request', {
                request_id: request.id,
                reason: rejectionReason || 'No reason provided'
            });

            if (error) throw error;

            toast({
                title: language === 'ar' ? '✅ تم الرفض' : '✅ Rejected',
                description: language === 'ar' ? 'تم رفض الطلب' : 'Request rejected',
            });

            setDialogOpen(false);
            setRejectionReason('');
            fetchRequests();
        } catch (error: any) {
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setProcessing(false);
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

    const getStatusBadge = (status: string) => {
        const variants = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
            approved: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400',
            rejected: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400',
        };

        const getLabel = (s: string) => {
            if (s === 'pending') return language === 'ar' ? 'قيد الانتظار' : 'Pending';
            if (s === 'approved') return language === 'ar' ? 'مقبول' : 'Approved';
            if (s === 'rejected') return language === 'ar' ? 'مرفوض' : 'Rejected';
            return s;
        };

        return (
            <Badge variant="outline" className={variants[status as keyof typeof variants]}>
                {getLabel(status)}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            {language === 'ar' ? 'طلبات شحن المحافظ' : 'Wallet Recharge Requests'}
                        </CardTitle>
                        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
                                <SelectItem value="pending">{language === 'ar' ? 'معلق' : 'Pending'}</SelectItem>
                                <SelectItem value="approved">{language === 'ar' ? 'مقبول' : 'Approved'}</SelectItem>
                                <SelectItem value="rejected">{language === 'ar' ? 'مرفوض' : 'Rejected'}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {language === 'ar' ? 'لا توجد طلبات' : 'No requests found'}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{language === 'ar' ? 'المتجر' : 'Store'}</TableHead>
                                    <TableHead>{language === 'ar' ? 'المبلغ (USD)' : 'Amount (USD)'}</TableHead>
                                    <TableHead>{language === 'ar' ? 'المبلغ المحلي' : 'Local Amount'}</TableHead>
                                    <TableHead>{language === 'ar' ? 'الهاتف' : 'Phone'}</TableHead>
                                    <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                                    <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                                    <TableHead className="text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell className="font-medium">{getStoreName(request.store)}</TableCell>
                                        <TableCell className="font-semibold">${request.amount_usd}</TableCell>
                                        <TableCell>
                                            {request.amount_local.toFixed(2)} {request.store?.currency}
                                        </TableCell>
                                        <TableCell className="font-mono" dir="ltr">{request.sender_phone}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{formatDate(request.created_at)}</TableCell>
                                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedRequest(request);
                                                    setDialogOpen(true);
                                                }}
                                            >
                                                {language === 'ar' ? 'التفاصيل' : 'Details'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Details Dialog */}
            {selectedRequest && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle>
                                {language === 'ar' ? 'تفاصيل طلب الشحن' : 'Recharge Request Details'}
                            </DialogTitle>
                            <DialogDescription>
                                {language === 'ar' ? `طلب من: ${getStoreName(selectedRequest.store)}` : `Request from: ${getStoreName(selectedRequest.store)}`}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4">
                            {/* Amount Info */}
                            <Alert>
                                <DollarSign className="h-4 w-4" />
                                <AlertDescription className="grid grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">{language === 'ar' ? 'المبلغ بالدولار' : 'USD Amount'}</p>
                                        <p className="text-xl font-bold text-primary">${selectedRequest.amount_usd}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{language === 'ar' ? 'المبلغ المحلي' : 'Local Amount'}</p>
                                        <p className="text-xl font-bold">{selectedRequest.amount_local.toFixed(2)} {selectedRequest.store?.currency}</p>
                                    </div>
                                    <div className="col-span-2 pt-2 border-t">
                                        <p className="text-xs text-muted-foreground mb-1">{language === 'ar' ? 'سعر الصرف' : 'Exchange Rate'}</p>
                                        <Badge variant="outline" className="font-mono">
                                            1 USD = {selectedRequest.exchange_rate.toFixed(4)} {selectedRequest.store?.currency}
                                        </Badge>
                                    </div>
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Contact Info */}
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                                    <Phone className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</p>
                                        <p className="font-mono font-medium" dir="ltr">{selectedRequest.sender_phone}</p>
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">{language === 'ar' ? 'تاريخ الطلب' : 'Request Date'}</p>
                                        <p className="text-sm font-medium">{formatDate(selectedRequest.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Proof Image */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" />
                                    {language === 'ar' ? 'إثبات التحويل' : 'Transfer Proof'}
                                </Label>
                                <div className="border rounded-lg p-2 bg-muted/20 text-center">
                                    <img
                                        src={signedUrl || selectedRequest.proof_image}
                                        alt="Transfer proof"
                                        className="max-h-48 mx-auto object-contain rounded shadow-sm"
                                        onClick={() => window.open(signedUrl || selectedRequest.proof_image, '_blank')}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        {language === 'ar' ? 'اضغط على الصورة لتكبيرها' : 'Click image to expand'}
                                    </p>
                                </div>
                            </div>

                            {/* Date */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                {formatDate(selectedRequest.created_at)}
                            </div>

                            {/* Rejection Reason (if rejected) */}
                            {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        <p className="font-semibold mb-1">{language === 'ar' ? 'سبب الرفض:' : 'Rejection Reason:'}</p>
                                        <p>{selectedRequest.rejection_reason}</p>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Rejection Reason Input (for pending requests) */}
                            {selectedRequest.status === 'pending' && (
                                <div className="space-y-2">
                                    <Label>{language === 'ar' ? 'سبب الرفض (اختياري)' : 'Rejection Reason (optional)'}</Label>
                                    <Textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder={language === 'ar' ? 'اكتب سبب الرفض...' : 'Enter rejection reason...'}
                                        rows={3}
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            {selectedRequest.status === 'pending' && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleReject(selectedRequest)}
                                        disabled={processing}
                                    >
                                        {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                        <XCircle className="w-4 h-4 mr-2" />
                                        {language === 'ar' ? 'رفض' : 'Reject'}
                                    </Button>
                                    <Button
                                        onClick={() => handleApprove(selectedRequest)}
                                        disabled={processing}
                                    >
                                        {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        {language === 'ar' ? 'قبول وإضافة الرصيد' : 'Approve & Add Balance'}
                                    </Button>
                                </div>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

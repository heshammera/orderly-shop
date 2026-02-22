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
import { Loader2, CheckCircle2, XCircle, Image as ImageIcon, Store, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface CopyrightRequest {
    id: string;
    store_id: string;
    amount: number;
    currency: string;
    receipt_url: string;
    status: 'pending' | 'approved' | 'rejected';
    admin_notes?: string;
    created_at: string;
    store?: {
        name: string | { ar: string; en: string };
    };
}

export function CopyrightRequests() {
    const { language } = useLanguage();
    const { toast } = useToast();
    const supabase = createClient();

    const getStoreName = (store: CopyrightRequest['store']) => {
        if (!store) return '';
        if (typeof store.name === 'string') return store.name;
        const nameObj = store.name as { ar: string; en: string };
        return nameObj[language as 'ar' | 'en'] || nameObj.en || nameObj.ar || 'Unknown';
    };

    const [requests, setRequests] = useState<CopyrightRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [selectedRequest, setSelectedRequest] = useState<CopyrightRequest | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [signedUrl, setSignedUrl] = useState<string>('');

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    useEffect(() => {
        const generateSignedUrl = async () => {
            if (!selectedRequest?.receipt_url) {
                setSignedUrl('');
                return;
            }
            try {
                const url = new URL(selectedRequest.receipt_url);
                if (url.pathname.includes('/storage/v1/object/public/copyright-receipts/')) {
                    const path = url.pathname.split('/copyright-receipts/')[1];
                    if (path) {
                        const { data } = await supabase.storage
                            .from('copyright-receipts')
                            .createSignedUrl(decodeURIComponent(path), 60 * 60);
                        if (data?.signedUrl) {
                            setSignedUrl(data.signedUrl);
                            return;
                        }
                    }
                }
                setSignedUrl(selectedRequest.receipt_url);
            } catch (e) {
                setSignedUrl(selectedRequest.receipt_url);
            }
        };

        if (dialogOpen && selectedRequest) {
            generateSignedUrl();
        }
    }, [selectedRequest, dialogOpen]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/copyright-requests?status=${filter}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const result = await response.json();
            setRequests(result.data || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (request: CopyrightRequest) => {
        try {
            setProcessing(true);
            const response = await fetch('/api/admin/copyright-requests', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: request.id,
                    status: 'approved',
                    admin_notes: adminNotes,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to approve');
            }

            toast({
                title: language === 'ar' ? '✅ تم القبول' : '✅ Approved',
                description: language === 'ar'
                    ? 'تم الموافقة على الإزالة بنجاح'
                    : 'Copyright removal approved successfully',
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

    const handleReject = async (request: CopyrightRequest) => {
        try {
            setProcessing(true);
            const response = await fetch('/api/admin/copyright-requests', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: request.id,
                    status: 'rejected',
                    admin_notes: adminNotes,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to reject');
            }

            toast({
                title: language === 'ar' ? '✅ تم الرفض' : '✅ Rejected',
                description: language === 'ar' ? 'تم رفض الطلب' : 'Request rejected',
            });
            setDialogOpen(false);
            setAdminNotes('');
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
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        }).format(new Date(dateStr));
    };

    const getStatusBadge = (status: string) => {
        const variants = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            approved: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200',
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
                            <Store className="w-5 h-5" />
                            {language === 'ar' ? 'طلبات إزالة الحقوق' : 'Copyright Removal Requests'}
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
                                    <TableHead>{language === 'ar' ? 'المبلغ المطلوب' : 'Amount'}</TableHead>
                                    <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                                    <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                                    <TableHead className="text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell className="font-medium">{getStoreName(request.store)}</TableCell>
                                        <TableCell>
                                            {request.amount.toFixed(2)} {request.currency}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{formatDate(request.created_at)}</TableCell>
                                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline" size="sm"
                                                onClick={() => { setSelectedRequest(request); setDialogOpen(true); setAdminNotes(request.admin_notes || ''); }}
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

            {selectedRequest && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle>{language === 'ar' ? 'تفاصيل الطلب' : 'Request Details'}</DialogTitle>
                            <DialogDescription>
                                {language === 'ar' ? `متجر: ${getStoreName(selectedRequest.store)}` : `Store: ${getStoreName(selectedRequest.store)}`}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4">
                            <Alert>
                                <AlertDescription className="grid grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">{language === 'ar' ? 'المبلغ' : 'Amount'}</p>
                                        <p className="text-xl font-bold text-primary">{selectedRequest.amount.toFixed(2)} {selectedRequest.currency}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(selectedRequest.created_at)}
                                    </div>
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" />
                                    {language === 'ar' ? 'إيصال الدفع' : 'Payment Receipt'}
                                </Label>
                                <div className="border rounded-lg p-2 bg-muted/20 text-center">
                                    <img
                                        src={signedUrl || selectedRequest.receipt_url}
                                        alt="Receipt"
                                        className="max-h-48 mx-auto object-contain rounded shadow-sm"
                                        onClick={() => window.open(signedUrl || selectedRequest.receipt_url, '_blank')}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        {language === 'ar' ? 'اضغط لتكبير الصورة' : 'Click to expand'}
                                    </p>
                                </div>
                            </div>

                            {selectedRequest.status !== 'pending' && selectedRequest.admin_notes && (
                                <Alert variant={selectedRequest.status === 'rejected' ? 'destructive' : 'default'}>
                                    <AlertDescription>
                                        <p className="font-semibold mb-1">{language === 'ar' ? 'ملاحظات الإدارة:' : 'Admin Notes:'}</p>
                                        <p>{selectedRequest.admin_notes}</p>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {selectedRequest.status === 'pending' && (
                                <div className="space-y-2">
                                    <Label>{language === 'ar' ? 'ملاحظات للإدارة (أو سبب الرفض)' : 'Admin Notes (or rejection reason)'}</Label>
                                    <Textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="..."
                                        rows={3}
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter className="p-6">
                            {selectedRequest.status === 'pending' && (
                                <div className="flex gap-2">
                                    <Button variant="destructive" onClick={() => handleReject(selectedRequest)} disabled={processing}>
                                        {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                        <XCircle className="w-4 h-4 mr-2" />
                                        {language === 'ar' ? 'رفض الطلب' : 'Reject'}
                                    </Button>
                                    <Button onClick={() => handleApprove(selectedRequest)} disabled={processing}>
                                        {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        {language === 'ar' ? 'موافقة وإزالة الحقوق' : 'Approve & Remove'}
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

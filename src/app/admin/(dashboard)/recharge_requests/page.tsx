'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Eye, FileText } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RechargeRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [page, setPage] = useState(1);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const supabase = createClient();

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_admin_recharge_requests', {
                p_status: statusFilter,
                p_page: page,
                p_limit: 10
            });

            if (error) throw error;
            if (data) setRequests(data.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('فشل في جلب الطلبات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [statusFilter, page]);

    const handleApprove = async (id: string) => {
        if (!confirm('هل أنت متأكد من قبول هذا الطلب وإضافة الرصيد للمتجر؟')) return;

        try {
            const { error } = await supabase.rpc('approve_wallet_recharge', { p_request_id: id });
            if (error) throw error;
            toast.success('تم قبول الطلب وإضافة الرصيد');
            fetchRequests();
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ أثناء المعالجة');
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('هل أنت متأكد من رفض هذا الطلب؟')) return;

        try {
            const { error } = await supabase.rpc('reject_wallet_recharge', { p_request_id: id });
            if (error) throw error;
            toast.success('تم رفض الطلب');
            fetchRequests();
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ أثناء المعالجة');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge className="bg-green-100 text-green-800">مقبول</Badge>;
            case 'rejected': return <Badge className="bg-red-100 text-red-800">مرفوض</Badge>;
            default: return <Badge className="bg-yellow-100 text-yellow-800">معلق</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">طلبات شحن الرصيد</h2>

            <Tabs defaultValue="pending" className="w-full" onValueChange={setStatusFilter}>
                <TabsList>
                    <TabsTrigger value="pending">انتظار المراجعة</TabsTrigger>
                    <TabsTrigger value="approved">المقبولة</TabsTrigger>
                    <TabsTrigger value="rejected">المرفوضة</TabsTrigger>
                    <TabsTrigger value="all">الكل</TabsTrigger>
                </TabsList>
            </Tabs>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">المتجر</TableHead>
                                <TableHead className="text-right">المبلغ</TableHead>
                                <TableHead className="text-right">تاريخ الطلب</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                                <TableHead className="text-right">الإيصال</TableHead>
                                <TableHead className="text-right">إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">جاري التحميل...</TableCell>
                                </TableRow>
                            ) : requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد طلبات</TableCell>
                                </TableRow>
                            ) : (
                                requests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            <div className="font-medium">{(typeof req.store_name === 'string' ? req.store_name : req.store_name?.ar) || 'متجر غير معروف'}</div>
                                            <div className="text-xs text-muted-foreground">{req.owner_email}</div>
                                        </TableCell>
                                        <TableCell className="font-bold">{req.amount} ج.م</TableCell>
                                        <TableCell>{format(new Date(req.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                                        <TableCell>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="gap-2">
                                                        <FileText className="h-4 w-4" /> عرض
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-3xl">
                                                    <DialogHeader>
                                                        <DialogTitle>صورة الإيصال</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="flex justify-center bg-gray-100 p-4 rounded-lg">
                                                        <img src={req.payment_proof_url} alt="Payment Proof" className="max-h-[80vh] object-contain" />
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                        <TableCell>
                                            {req.status === 'pending' && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleApprove(req.id)}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleReject(req.id)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

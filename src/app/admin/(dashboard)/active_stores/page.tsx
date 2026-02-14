'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Edit, MoreHorizontal, ShieldAlert, CheckCircle, Lock } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function ActiveStoresPage() {
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const supabase = createClient();

    // Edit Dialog State
    const [selectedStore, setSelectedStore] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        status: '',
        status_reason: '',
        plan_id: ''
    });

    const fetchStores = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_all_stores_paginated', {
                p_page: page,
                p_limit: 10,
                p_search: search || null
            });

            if (error) throw error;

            if (data) {
                setStores(data.data);
                setTotalPages(Math.ceil(data.total / 10));
            }
        } catch (error: any) {
            console.error('Error fetching stores:', JSON.stringify(error, null, 2));
            toast.error('فشل في جلب المتاجر: ' + (error?.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const [plans, setPlans] = useState<any[]>([]);

    useEffect(() => {
        fetchStores();
        fetchPlans();
    }, [page, search]);

    const fetchPlans = async () => {
        const { data } = await supabase.from('plans').select('*').eq('is_active', true);
        if (data) setPlans(data);
    };

    const handleEditClick = (store: any) => {
        setSelectedStore(store);
        // Find current plan ID if possible, or leave empty
        // In real scenario, we might need to pass plan_id from the view or fetch it
        setEditForm({
            status: store.status,
            status_reason: store.status_reason || '',
            plan_id: ''
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdateStore = async () => {
        if (!selectedStore) return;

        try {
            // Update Status
            const { error: statusError } = await supabase.rpc('admin_update_store_status', {
                p_store_id: selectedStore.id,
                p_status: editForm.status,
                p_reason: editForm.status_reason
            });

            if (statusError) throw statusError;

            // Update Plan if selected
            if (editForm.plan_id) {
                const { error: planError } = await supabase.rpc('admin_assign_store_plan', {
                    p_store_id: selectedStore.id,
                    p_plan_id: editForm.plan_id,
                    p_period_days: 30 // Default to monthly
                });
                if (planError) throw planError;
            }

            toast.success('تم تحديث بيانات المتجر بنجاح');
            setIsEditDialogOpen(false);
            fetchStores();
        } catch (error) {
            console.error('Update error:', error);
            toast.error('حدث خطأ أثناء التحديث');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">نشط</Badge>;
            case 'banned': return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">محظور</Badge>;
            case 'maintenance': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">صيانة</Badge>;
            case 'unpaid': return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">منتهي</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">إدارة المتاجر</h2>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="بحث باسم المتجر أو المالك..."
                                className="pr-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">المتجر</TableHead>
                                <TableHead className="text-right">المالك</TableHead>
                                <TableHead className="text-right">الباقة</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                                <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                                <TableHead className="text-right">إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">جاري التحميل...</TableCell>
                                </TableRow>
                            ) : stores.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد متاجر مطابقة</TableCell>
                                </TableRow>
                            ) : (
                                stores.map((store) => (
                                    <TableRow key={store.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {store.logo_url && <img src={store.logo_url} alt="" className="w-8 h-8 rounded-full object-cover" />}
                                                <div>
                                                    <div>{typeof store.name === 'string' ? store.name : store.name?.ar || 'بدون اسم'}</div>
                                                    <div className="text-xs text-muted-foreground">{store.slug}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>{store.owner_name}</div>
                                            <div className="text-xs text-muted-foreground">{store.owner_email}</div>
                                        </TableCell>
                                        <TableCell><Badge variant="outline">{store.plan_name || 'Free'}</Badge></TableCell>
                                        <TableCell>{getStatusBadge(store.status)}</TableCell>
                                        <TableCell>{format(new Date(store.created_at), 'yyyy-MM-dd')}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleEditClick(store)}>
                                                        <Edit className="ml-2 h-4 w-4" /> تعديل الحالة
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600" onClick={() => {
                                                        setSelectedStore(store);
                                                        setEditForm({ status: 'banned', status_reason: '', plan_id: '' });
                                                        setIsEditDialogOpen(true);
                                                    }}>
                                                        <ShieldAlert className="ml-2 h-4 w-4" /> حظر المتجر
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex justify-center mt-4 gap-2">
                        <Button
                            variant="outline"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            السابق
                        </Button>
                        <span className="flex items-center px-4 text-sm text-gray-600">
                            صفحة {page} من {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            التالي
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>تعديل حالة المتجر</DialogTitle>
                        <DialogDescription>
                            تغيير حالة المتجر سيؤثر فوراً على قدرة المالك على الدخول.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>حالة المتجر</Label>
                            <Select
                                value={editForm.status}
                                onValueChange={(val) => setEditForm({ ...editForm, status: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الحالة" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">نشط (Active)</SelectItem>
                                    <SelectItem value="banned">محظور (Banned)</SelectItem>
                                    <SelectItem value="maintenance">تحت الصيانة (Maintenance)</SelectItem>
                                    <SelectItem value="unpaid">اشتراك منتهي (Unpaid)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(editForm.status === 'banned' || editForm.status === 'maintenance') && (
                            <div className="space-y-2">
                                <Label>سبب الإيقاف (سيظهر للمالك)</Label>
                                <Textarea
                                    placeholder="اكتب سبب الحظر أو الإيقاف هنا..."
                                    value={editForm.status_reason}
                                    onChange={(e) => setEditForm({ ...editForm, status_reason: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="space-y-2 pt-4 border-t">
                            <Label>تغيير الباقة (اختياري)</Label>
                            <Select
                                value={editForm.plan_id}
                                onValueChange={(val) => setEditForm({ ...editForm, plan_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="ابقاء الباقة الحالية" />
                                </SelectTrigger>
                                <SelectContent>
                                    {plans.map(plan => (
                                        <SelectItem key={plan.id} value={plan.id}>
                                            {plan.name_ar || plan.name_en} ({plan.price} ج.م)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">اختيار باقة جديدة سيلغي الاشتراك الحالي ويبدأ اشتراكاً جديداً فوراً.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>إلغاء</Button>
                        <Button onClick={handleUpdateStore}>حفظ التغييرات</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

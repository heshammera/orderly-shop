import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Search, Ban, CheckCircle, Edit, CreditCard, DollarSign, MoreHorizontal, ShieldAlert, Lock, Trash2, AlertTriangle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function StoreManagement() {
    const { language } = useLanguage();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const supabase = createClient();

    const safeRender = (value: any) => {
        if (typeof value === 'object' && value !== null) {
            try {
                return JSON.stringify(value);
            } catch (e) {
                return String(value);
            }
        }
        return value;
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // State for modals
    const [editingStore, setEditingStore] = useState<any>(null); // For Commission/Settings
    const [statusEditStore, setStatusEditStore] = useState<any>(null); // For Status/Plan
    const [deleteStore, setDeleteStore] = useState<any>(null); // For Deletion
    const [rechargeStore, setRechargeStore] = useState<any>(null);
    const [rechargeAmount, setRechargeAmount] = useState('');
    const [rechargeType, setRechargeType] = useState<'add' | 'deduct'>('add');

    // Commission Form
    const [commissionData, setCommissionData] = useState({
        type: 'percentage',
        value: 5,
        unlimited: false
    });

    // Status Form
    const [statusForm, setStatusForm] = useState({
        status: '',
        status_reason: '',
        plan_id: ''
    });

    const { data: storesData, isLoading } = useQuery({
        queryKey: ['admin-stores', page, searchTerm],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_all_stores_paginated', {
                p_page: page,
                p_limit: 10,
                p_search: searchTerm || null
            });

            if (error) throw error;
            return data;
        }
    });

    const stores = storesData?.data || [];
    const total = storesData?.total || 0;

    useEffect(() => {
        if (total) setTotalPages(Math.ceil(total / 10));
    }, [total]);

    // Fetch Plans for Dropdown
    const { data: plans = [] } = useQuery({
        queryKey: ['admin-plans'],
        queryFn: async () => {
            const { data } = await supabase.from('plans').select('*').eq('is_active', true);
            return data || [];
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
            const { error } = await supabase.rpc('admin_update_store_status', {
                p_store_id: id,
                p_status: status,
                p_reason: reason
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
            setStatusEditStore(null);
            toast({ title: language === 'ar' ? 'تم تحديث الحالة' : 'Store status updated' });
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const updatePlanMutation = useMutation({
        mutationFn: async ({ id, planId }: { id: string; planId: string }) => {
            const { error } = await supabase.rpc('admin_assign_store_plan', {
                p_store_id: id,
                p_plan_id: planId,
                p_period_days: 30
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
            toast({ title: language === 'ar' ? 'تم تحديث الباقة' : 'Plan updated' });
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const updateCommissionMutation = useMutation({
        mutationFn: async (data: any) => {
            const { error } = await supabase.from('stores').update({
                commission_type: data.type,
                commission_value: data.value,
                has_unlimited_balance: data.unlimited
            }).eq('id', data.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
            setEditingStore(null);
            toast({ title: language === 'ar' ? 'تم تحديث الإعدادات' : 'Commission settings updated' });
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const deleteStoreMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('stores').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
            setDeleteStore(null);
            toast({ title: language === 'ar' ? 'تم حذف المتجر بنجاح' : 'Store deleted successfully' });
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const getExchangeRate = (currency: string) => {
        if (currency === 'EGP') return 50.0;
        if (currency === 'SAR') return 3.75;
        return 1.0;
    };

    const manualRechargeMutation = useMutation({
        mutationFn: async (data: { id: string, amount: number, type: 'add' | 'deduct' }) => {
            // 1. Fetch store info (currency only needed if not passed in store object, but we have it now)
            const exchangeRate = getExchangeRate(rechargeStore?.currency || 'USD');

            // Calculate local amount (Negative if deducting)
            const rawAmount = data.type === 'deduct' ? -Math.abs(data.amount) : Math.abs(data.amount);
            const amountLocal = rawAmount * exchangeRate;

            // 2. Update balance via RPC
            const { error: rpcError } = await supabase.rpc('increment_store_balance', {
                store_id_input: data.id,
                amount_input: amountLocal
            });

            if (rpcError) throw rpcError;

            // 3. Log transaction
            const { error: txError } = await supabase.from('wallet_transactions').insert({
                store_id: data.id,
                amount: amountLocal,
                type: data.type === 'deduct' ? 'withdrawal' : 'deposit',
                description: `Manual ${data.type === 'add' ? 'Deposit' : 'Deduction'} by Admin ($${Math.abs(data.amount)})`,
            });

            if (txError) throw txError;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
            setRechargeStore(null);
            setRechargeAmount('');
            setRechargeType('add');
            toast({
                title: variables.type === 'add' ? (language === 'ar' ? 'تم إضافة الرصيد' : 'Funds Added') : (language === 'ar' ? 'تم خصم الرصيد' : 'Funds Deducted'),
                description: `Successfully ${variables.type === 'add' ? 'added' : 'deducted'} $${variables.amount}`,
                className: variables.type === 'add' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            });
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const handleEditClick = (store: any) => {
        setEditingStore(store);
        setCommissionData({
            type: store.commission_type || 'percentage',
            value: store.commission_value || 0,
            unlimited: store.has_unlimited_balance || false
        });
    };

    const handleStatusEditClick = (store: any) => {
        setStatusEditStore(store);
        setStatusForm({
            status: store.status,
            status_reason: store.status_reason || '',
            plan_id: ''
        });
    };

    const handleSaveStatus = async () => {
        if (!statusEditStore) return;

        // Update Status
        if (statusForm.status !== statusEditStore.status || statusForm.status_reason !== statusEditStore.status_reason) {
            updateStatusMutation.mutate({
                id: statusEditStore.id,
                status: statusForm.status,
                reason: statusForm.status_reason
            });
        }

        // Update Plan
        if (statusForm.plan_id) {
            updatePlanMutation.mutate({
                id: statusEditStore.id,
                planId: statusForm.plan_id
            });
        }
    };

    const handleRechargeClick = (store: any) => {
        setRechargeStore(store);
        setRechargeAmount('');
        setRechargeType('add');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
            case 'banned': return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Banned</Badge>;
            case 'maintenance': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Maintenance</Badge>;
            case 'unpaid': return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Unpaid</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 bg-background p-4 rounded-lg border shadow-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={language === 'ar' ? 'بحث عن متجر...' : 'Search stores...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="bg-background rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{language === 'ar' ? 'المتجر' : 'Store'}</TableHead>
                            <TableHead>{language === 'ar' ? 'المالك' : 'Owner'}</TableHead>
                            <TableHead>{language === 'ar' ? 'الباقة' : 'Plan'}</TableHead>
                            <TableHead>{language === 'ar' ? 'الرصيد' : 'Balance'}</TableHead>
                            <TableHead>{language === 'ar' ? 'العمولة' : 'Commission'}</TableHead>
                            <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                            <TableHead className="text-end">{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stores.map((store: any) => {
                            // Safe name access
                            const nameData = store.name || {};
                            const name = typeof nameData === 'string'
                                ? nameData
                                : (language === 'ar' ? nameData.ar || nameData.en : nameData.en || nameData.ar);

                            const exchangeRate = getExchangeRate(store.currency || 'USD');
                            const balanceInUSD = (store.balance || 0) / exchangeRate;
                            const ownerName = store.owner_name || 'N/A';
                            const ownerEmail = store.owner_email || 'N/A';

                            return (
                                <TableRow key={store.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {store.logo_url && <img src={store.logo_url} alt="" className="w-8 h-8 rounded-full object-cover" />}
                                            <div>
                                                <div className="font-medium">{safeRender(name)}</div>
                                                <div className="text-xs text-muted-foreground">{safeRender(store.slug)}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{ownerName}</div>
                                        <div className="text-xs text-muted-foreground">{ownerEmail}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{store.plan_name || 'Free'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            {store.has_unlimited_balance ? (
                                                <Badge variant="outline" className="w-fit bg-purple-50 text-purple-600 border-purple-200">
                                                    {language === 'ar' ? 'غير محدود (VIP)' : 'Unlimited VIP'}
                                                </Badge>
                                            ) : (
                                                <>
                                                    <span className={(store.balance || 0) <= 0 ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>
                                                        {(store.balance || 0).toFixed(2)} {store.currency || 'USD'}
                                                    </span>
                                                    {store.currency !== 'USD' && (
                                                        <span className="text-xs text-muted-foreground">
                                                            ≈ ${balanceInUSD.toFixed(2)} USD
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {(store.commission_type || 'percentage') === 'percentage'
                                                ? `${safeRender(store.commission_value || 0)}%`
                                                : `$${safeRender(store.commission_value || 0)}`}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(store.status)}
                                    </TableCell>
                                    <TableCell className="text-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>{language === 'ar' ? 'الإجراءات' : 'Actions'}</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEditClick(store)}>
                                                    <Edit className="ml-2 h-4 w-4" /> {language === 'ar' ? 'تعديل العمولة' : 'Edit Commission'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleRechargeClick(store)}>
                                                    <CreditCard className="ml-2 h-4 w-4" /> {language === 'ar' ? 'شحن رصيد/خصم' : 'Recharge/Deduct'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleStatusEditClick(store)}>
                                                    <ShieldAlert className="ml-2 h-4 w-4" /> {language === 'ar' ? 'تعديل الحالة/الباقة' : 'Edit Status/Plan'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => setDeleteStore(store)} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                                                    <Trash2 className="ml-2 h-4 w-4" /> {language === 'ar' ? 'حذف المتجر نهائياً' : 'Delete Store Permanently'}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex justify-center mt-4 gap-2 pb-4">
                    <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        {language === 'ar' ? 'السابق' : 'Previous'}
                    </Button>
                    <span className="flex items-center px-4 text-sm text-gray-600">
                        {language === 'ar' ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
                    </span>
                    <Button
                        variant="outline"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        {language === 'ar' ? 'التالي' : 'Next'}
                    </Button>
                </div>
            </div>

            {/* Edit Commission Dialog */}
            <Dialog open={!!editingStore} onOpenChange={(open) => !open && setEditingStore(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{language === 'ar' ? 'تعديل إعدادات المتجر' : 'Edit Store Settings'}</DialogTitle>
                        <DialogDescription>{language === 'ar' ? 'تخصيص العمولة وإعدادات الرصيد لهذا المتجر.' : 'Configure commission and balance settings for this store.'}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between">
                            <Label>{language === 'ar' ? 'رصيد غير محدود (VIP)' : 'Unlimited Balance (VIP)'}</Label>
                            <Switch
                                checked={commissionData.unlimited}
                                onCheckedChange={(checked) => setCommissionData({ ...commissionData, unlimited: checked })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{language === 'ar' ? 'نوع العمولة' : 'Commission Type'}</Label>
                            <Select
                                value={commissionData.type}
                                onValueChange={(val) => setCommissionData({ ...commissionData, type: val })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">{language === 'ar' ? 'نسبة مئوية (%)' : 'Percentage (%)'}</SelectItem>
                                    <SelectItem value="fixed">{language === 'ar' ? 'مبلغ ثابت ($)' : 'Fixed Amount ($)'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{language === 'ar' ? 'قيمة العمولة' : 'Commission Value'}</Label>
                            <Input
                                type="number"
                                value={commissionData.value}
                                onChange={(e) => setCommissionData({ ...commissionData, value: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingStore(null)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                        <Button onClick={() => updateCommissionMutation.mutate({ ...commissionData, id: editingStore.id })}>{language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Status/Plan Edit Dialog (New) */}
            <Dialog open={!!statusEditStore} onOpenChange={(open) => !open && setStatusEditStore(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{language === 'ar' ? 'تعديل حالة وباقة المتجر' : 'Edit Store Status & Plan'}</DialogTitle>
                        <DialogDescription>
                            {language === 'ar' ? 'تغيير الحالة أو الباقة سيؤثر فوراً على المتجر.' : 'Changing status or plan will affect the store immediately.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{language === 'ar' ? 'حالة المتجر' : 'Store Status'}</Label>
                            <Select
                                value={statusForm.status}
                                onValueChange={(val) => setStatusForm({ ...statusForm, status: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">{language === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                                    <SelectItem value="banned">{language === 'ar' ? 'محظور' : 'Banned'}</SelectItem>
                                    <SelectItem value="maintenance">{language === 'ar' ? 'تحت الصيانة' : 'Maintenance'}</SelectItem>
                                    <SelectItem value="unpaid">{language === 'ar' ? 'اشتراك منتهي' : 'Unpaid'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(statusForm.status === 'banned' || statusForm.status === 'maintenance') && (
                            <div className="space-y-2">
                                <Label>{language === 'ar' ? 'السبب' : 'Reason'}</Label>
                                <Textarea
                                    value={statusForm.status_reason}
                                    onChange={(e) => setStatusForm({ ...statusForm, status_reason: e.target.value })}
                                    placeholder={language === 'ar' ? 'اكتب السبب هنا...' : 'Enter reason here...'}
                                />
                            </div>
                        )}

                        <div className="space-y-2 pt-4 border-t">
                            <Label>{language === 'ar' ? 'تغيير الباقة (اختياري)' : 'Change Plan (Optional)'}</Label>
                            <Select
                                value={statusForm.plan_id}
                                onValueChange={(val) => setStatusForm({ ...statusForm, plan_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={language === 'ar' ? '----- ابقاء الباقة الحالية -----' : '----- Keep Current Plan -----'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {plans.map((plan: any) => (
                                        <SelectItem key={plan.id} value={plan.id}>
                                            {language === 'ar' ? plan.name_ar : plan.name_en} ({plan.price} {language === 'ar' ? 'ج.م' : 'EGP'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStatusEditStore(null)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                        <Button onClick={handleSaveStatus}>{language === 'ar' ? 'حفظ' : 'Save'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manual Recharge Dialog */}
            <Dialog open={!!rechargeStore} onOpenChange={(open) => !open && setRechargeStore(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{language === 'ar' ? 'شحن يدوي' : 'Manual Recharge'}</DialogTitle>
                        <DialogDescription>{language === 'ar' ? 'إضافة أو خصم رصيد من محفظة المتجر مباشرة.' : 'Add funds directly to this store\'s wallet.'}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{language === 'ar' ? 'نوع العملية' : 'Operation Type'}</Label>
                            <Select
                                value={rechargeType}
                                onValueChange={(val: 'add' | 'deduct') => setRechargeType(val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="add" className="text-green-600">{language === 'ar' ? 'إيداع (إضافة رصيد)' : 'Add Funds (Deposit)'}</SelectItem>
                                    <SelectItem value="deduct" className="text-red-600">{language === 'ar' ? 'سحب (خصم رصيد)' : 'Deduct Funds (Withdrawal)'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{language === 'ar' ? 'المبلغ (USD)' : 'Amount (USD)'}</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-8"
                                    type="number"
                                    placeholder="0.00"
                                    value={rechargeAmount}
                                    onChange={(e) => setRechargeAmount(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {rechargeType === 'add'
                                    ? (language === 'ar' ? 'سيتم إضافة هذا المبلغ إلى رصيد المتجر.' : 'This amount will be ADDED to the store balance.')
                                    : (language === 'ar' ? 'سيتم خصم هذا المبلغ من رصيد المتجر.' : 'This amount will be DEDUCTED from the store balance.')}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRechargeStore(null)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                        <Button
                            variant={rechargeType === 'deduct' ? 'destructive' : 'default'}
                            onClick={() => manualRechargeMutation.mutate({
                                id: rechargeStore.id,
                                amount: parseFloat(rechargeAmount),
                                type: rechargeType
                            })}
                            disabled={!rechargeAmount || parseFloat(rechargeAmount) <= 0 || manualRechargeMutation.isPending}
                        >
                            {manualRechargeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {rechargeType === 'add' ? (language === 'ar' ? 'إضافة الرصيد' : 'Add Funds') : (language === 'ar' ? 'خصم الرصيد' : 'Deduct Funds')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Store Confirmation Dialog */}
            <Dialog open={!!deleteStore} onOpenChange={(open) => !open && setDeleteStore(null)}>
                <DialogContent>
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-destructive mb-2">
                            <AlertTriangle className="w-5 h-5" />
                            <DialogTitle>
                                {language === 'ar' ? 'تأكيد حذف المتجر' : 'Confirm Store Deletion'}
                            </DialogTitle>
                        </div>
                        <DialogDescription>
                            {language === 'ar'
                                ? `هل أنت متأكد من حذف هذا المتجر نهائياً؟ التحذير: سيتم حذف جميع المنتجات والطلبات والبيانا المرتبطة به ولا يمكن استعادتها.`
                                : `Are you sure you want to permanently delete this store? Warning: All products, orders, and associated data will be removed and cannot be recovered.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
                        <Button variant="outline" disabled={deleteStoreMutation.isPending} onClick={() => setDeleteStore(null)}>
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={deleteStoreMutation.isPending}
                            onClick={() => deleteStoreMutation.mutate(deleteStore.id)}
                        >
                            {deleteStoreMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2" /> : <Trash2 className="mr-2 h-4 w-4 rtl:ml-2" />}
                            {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

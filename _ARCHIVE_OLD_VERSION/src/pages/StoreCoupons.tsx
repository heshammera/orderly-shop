import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Ticket, Plus, Loader2, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function StoreCoupons() {
    const { storeId } = useParams<{ storeId: string }>();
    const { language } = useLanguage();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage', // percentage | fixed
        discount_value: '',
        min_order_amount: '',
        usage_limit: '',
        expires_at: '',
        is_active: true
    });

    // UUID Validation
    const isValidUUID = (id: string | undefined) => {
        if (!id) return false;
        const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return regex.test(id);
    };

    const isStoreIdValid = isValidUUID(storeId);

    const { data: store, isLoading: isStoreLoading } = useQuery({
        queryKey: ['store', storeId],
        queryFn: async () => {
            if (!isStoreIdValid) throw new Error('Invalid Store ID');
            const { data, error } = await supabase
                .from('stores')
                .select('id, name, slug')
                .eq('id', storeId!)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: isStoreIdValid,
    });

    const { data: coupons = [], isLoading: isCouponsLoading } = useQuery({
        queryKey: ['coupons', storeId],
        queryFn: async () => {
            if (!isStoreIdValid) return [];
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('store_id', storeId!)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: isStoreIdValid,
    });

    const createCouponMutation = useMutation({
        mutationFn: async (newCoupon: any) => {
            const { error } = await supabase
                .from('coupons')
                .insert([{
                    ...newCoupon,
                    store_id: storeId,
                    discount_value: newCoupon.discount_value ? parseFloat(newCoupon.discount_value.toString()) : 0,
                    min_order_amount: newCoupon.min_order_amount ? parseFloat(newCoupon.min_order_amount.toString()) : 0,
                    usage_limit: newCoupon.usage_limit ? parseInt(newCoupon.usage_limit.toString()) : null,
                    expires_at: newCoupon.expires_at || null
                }]);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coupons', storeId] });
            setIsCreateOpen(false);
            setFormData({
                code: '',
                discount_type: 'percentage',
                discount_value: '',
                min_order_amount: '',
                usage_limit: '',
                expires_at: '',
                is_active: true
            });
            toast({
                title: language === 'ar' ? 'تم إنشاء الكوبون' : 'Coupon Created',
                description: language === 'ar' ? 'تمت إضافة الكوبون بنجاح' : 'Coupon has been added successfully',
            });
        },
        onError: (error: any) => {
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: error.message,
                variant: 'destructive',
            });
        }
    });

    const deleteCouponMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('coupons')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coupons', storeId] });
            toast({
                title: language === 'ar' ? 'تم الحذف' : 'Deleted',
                description: language === 'ar' ? 'تم حذف الكوبون بنجاح' : 'Coupon deleted successfully',
            });
        }
    });

    const generateCouponCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const codeToSubmit = formData.code.trim() ? formData.code : generateCouponCode();
        createCouponMutation.mutate({ ...formData, code: codeToSubmit });
    };

    const isLoading = isStoreLoading || isCouponsLoading;

    if (!isStoreIdValid) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <div className="text-red-500 font-bold text-lg">
                    {language === 'ar' ? 'رجل المتجر غير صالح' : 'Invalid Store ID'}
                </div>
                <Button onClick={() => window.location.href = '/dashboard'}>
                    {language === 'ar' ? 'العودة إلى لوحة التحكم' : 'Return to Dashboard'}
                </Button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const storeName = store?.name
        ? (store.name as any)[language] || (store.name as any).ar || (store.name as any).en
        : '';

    return (
        <DashboardLayout storeId={storeId!} storeName={storeName}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Ticket className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl font-bold tracking-tight">
                            {language === 'ar' ? 'القسائم والخصومات' : 'Coupons & Discounts'}
                        </h1>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 me-2" />
                                {language === 'ar' ? 'كوبون جديد' : 'New Coupon'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{language === 'ar' ? 'إنشاء كوبون جديد' : 'Create New Coupon'}</DialogTitle>
                                <DialogDescription>
                                    {language === 'ar'
                                        ? 'أدخل تفاصيل الكوبون أدناه. انقر على حفظ عند الانتهاء.'
                                        : 'Enter coupon details below. Click save when done.'}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="code" className="text-right">
                                        {language === 'ar' ? 'الرمز' : 'Code'}
                                    </Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="col-span-3 uppercase"
                                        placeholder={language === 'ar' ? 'اتركه فارغاً للتوليد التلقائي' : 'Leave empty to auto-generate'}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="type" className="text-right">
                                        {language === 'ar' ? 'النوع' : 'Type'}
                                    </Label>
                                    <Select
                                        value={formData.discount_type}
                                        onValueChange={(val) => setFormData({ ...formData, discount_type: val })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">{language === 'ar' ? 'نسبة مئوية (%)' : 'Percentage (%)'}</SelectItem>
                                            <SelectItem value="fixed">{language === 'ar' ? 'مبلغ ثابت' : 'Fixed Amount'}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="value" className="text-right">
                                        {language === 'ar' ? 'القيمة' : 'Value'}
                                    </Label>
                                    <Input
                                        id="value"
                                        type="number"
                                        value={formData.discount_value}
                                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                        className="col-span-3"
                                        placeholder="10"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="min_order" className="text-right">
                                        {language === 'ar' ? 'أقل طلب' : 'Min Order'}
                                    </Label>
                                    <Input
                                        id="min_order"
                                        type="number"
                                        value={formData.min_order_amount}
                                        onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                                        className="col-span-3"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="expires" className="text-right">
                                        {language === 'ar' ? 'الانتهاء' : 'Expires'}
                                    </Label>
                                    <Input
                                        id="expires"
                                        type="date"
                                        value={formData.expires_at}
                                        onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={createCouponMutation.isPending}>
                                        {createCouponMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {language === 'ar' ? 'حفظ الكوبون' : 'Save Coupon'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="border rounded-lg bg-card text-card-foreground shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{language === 'ar' ? 'الرمز' : 'Code'}</TableHead>
                                <TableHead>{language === 'ar' ? 'الخصم' : 'Discount'}</TableHead>
                                <TableHead>{language === 'ar' ? 'الاستخدام' : 'Usage'}</TableHead>
                                <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                                <TableHead className="text-end">{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {coupons.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        {language === 'ar' ? 'لا توجد كوبونات' : 'No coupons found'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                coupons.map((coupon: any) => (
                                    <TableRow key={coupon.id}>
                                        <TableCell className="font-medium">{coupon.code}</TableCell>
                                        <TableCell>
                                            {coupon.discount_value}
                                            {coupon.discount_type === 'percentage' ? '%' : ''}
                                        </TableCell>
                                        <TableCell>{coupon.used_count} / {coupon.usage_limit || '∞'}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${coupon.is_active && (!coupon.expires_at || new Date(coupon.expires_at) > new Date())
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {coupon.is_active ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => deleteCouponMutation.mutate(coupon.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </DashboardLayout>
    );
}

"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditCouponPage({ params }: { params: { storeId: string, couponId: string } }) {
    const { storeId, couponId } = params;
    const router = useRouter();
    const supabase = createClient();
    const { language } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order_amount: '',
        usage_limit: '',
        max_per_customer: '',
        expires_at: '',
        is_active: true
        // target_products and target_categories will be added in a more advanced selector later
    });

    useEffect(() => {
        fetchCoupon();
    }, [couponId]);

    const fetchCoupon = async () => {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('id', couponId)
                .eq('store_id', storeId)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    code: data.code || '',
                    discount_type: data.discount_type || 'percentage',
                    discount_value: data.discount_value?.toString() || '',
                    min_order_amount: data.min_order_amount?.toString() || '',
                    usage_limit: data.usage_limit?.toString() || '',
                    max_per_customer: data.max_per_customer?.toString() || '',
                    expires_at: data.expires_at ? new Date(data.expires_at).toISOString().slice(0, 16) : '',
                    is_active: data.is_active ?? true
                });
            }
        } catch (error) {
            console.error('Error fetching coupon:', error);
            toast.error(language === 'ar' ? 'فشل تحميل السجل' : 'Failed to load coupon');
            router.push(`/dashboard/${storeId}/coupons`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (!formData.code || !formData.discount_value) {
                toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in required fields');
                setSaving(false);
                return;
            }

            const { error } = await supabase
                .from('coupons')
                .update({
                    code: formData.code.toUpperCase(),
                    discount_type: formData.discount_type,
                    discount_value: Number(formData.discount_value),
                    min_order_amount: formData.min_order_amount ? Number(formData.min_order_amount) : 0,
                    usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
                    max_per_customer: formData.max_per_customer ? Number(formData.max_per_customer) : null,
                    expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
                    is_active: formData.is_active
                })
                .eq('id', couponId)
                .eq('store_id', storeId);

            if (error) {
                if (error.code === '23505') {
                    toast.error(language === 'ar' ? 'رمز الكوبون مستخدم بالفعل' : 'Coupon code already exists');
                } else {
                    throw error;
                }
            } else {
                toast.success(language === 'ar' ? 'تم التحديث بنجاح' : 'Coupon updated successfully');
                router.push(`/dashboard/${storeId}/coupons`);
            }
        } catch (error) {
            console.error('Error updating:', error);
            toast.error(language === 'ar' ? 'حدث خطأ غير متوقع' : 'Something went wrong');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/${storeId}/coupons`}>
                        <ArrowLeft className="w-4 h-4 ml-2" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {language === 'ar' ? 'تعديل الكوبون' : 'Edit Coupon'}
                    </h2>
                    <p className="text-muted-foreground">
                        {language === 'ar' ? 'تعديل بيانات وخصائص الكوبون' : 'Modify coupon details and limits.'}
                    </p>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>{language === 'ar' ? 'بيانات الكوبون' : 'Coupon Details'}</CardTitle>
                        <CardDescription>{language === 'ar' ? 'اعدادات الخصم والحدود' : 'Configure the discount and limitations.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div className="space-y-2">
                            <Label htmlFor="code">{language === 'ar' ? 'رمز الكوبون' : 'Coupon Code'}</Label>
                            <Input
                                id="code"
                                placeholder="SUMMER2024"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                className="font-mono uppercase placeholder:normal-case"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">{language === 'ar' ? 'نوع الخصم' : 'Discount Type'}</Label>
                                <Select
                                    value={formData.discount_type}
                                    onValueChange={(val) => setFormData({ ...formData, discount_type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">{language === 'ar' ? 'نسبة مئوية (%)' : 'Percentage (%)'}</SelectItem>
                                        <SelectItem value="fixed">{language === 'ar' ? 'مبلغ ثابت' : 'Fixed Amount'}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="value">{language === 'ar' ? 'قيمة الخصم' : 'Discount Value'}</Label>
                                <div className="relative">
                                    <Input
                                        id="value"
                                        type="number"
                                        placeholder="0"
                                        min="0"
                                        value={formData.discount_value}
                                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                        className="pr-8"
                                        required
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                                        {formData.discount_type === 'percentage' ? '%' : '$'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="usage_limit">{language === 'ar' ? 'حد الاستخدام الإجمالي' : 'Total Usage Limit'}</Label>
                                <Input
                                    id="usage_limit"
                                    type="number"
                                    min="1"
                                    placeholder={language === 'ar' ? 'اختياري: إجمالي عدد مرات الاستخدام' : 'Total times usable (Optional)'}
                                    value={formData.usage_limit}
                                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max_per_customer">{language === 'ar' ? 'حد الاستخدام لكل عميل' : 'Max uses per customer'}</Label>
                                <Input
                                    id="max_per_customer"
                                    type="number"
                                    min="1"
                                    placeholder={language === 'ar' ? 'اختياري: عدد المرات لكل شخص' : 'Per customer (Optional)'}
                                    value={formData.max_per_customer}
                                    onChange={(e) => setFormData({ ...formData, max_per_customer: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="min_order">{language === 'ar' ? 'الحد الأدنى للطلب (اختياري)' : 'Min. Order (Optional)'}</Label>
                                <Input
                                    id="min_order"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={formData.min_order_amount}
                                    onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expiry">{language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</Label>
                                <Input
                                    id="expiry"
                                    type="datetime-local"
                                    value={formData.expires_at}
                                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 rounded-lg border p-4">
                            <Switch
                                id="active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                            <Label htmlFor="active" className="flex-1 cursor-pointer">
                                {language === 'ar' ? 'حالة التفعيل' : 'Active Status'}
                                <p className="font-normal text-xs text-muted-foreground">
                                    {language === 'ar' ? 'عند التعطيل لن يتمكن أحد من استخدام هذا الكوبون.' : 'Enable or disable this coupon immediately.'}
                                </p>
                            </Label>
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="ml-auto" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

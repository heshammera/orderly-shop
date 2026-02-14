"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import {
    Loader2,
    Plus,
    Trash2,
    MoreHorizontal,
    Tag,
    Calendar,
    Percent,
    DollarSign
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CouponsPage({ params }: { params: { storeId: string } }) {
    const { storeId } = params;
    const { language } = useLanguage();
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchCoupons();
    }, [storeId]);

    const fetchCoupons = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching coupons:', error);
            toast.error('Failed to load coupons');
        } else {
            setCoupons(data || []);
        }
        setLoading(false);
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('coupons')
            .update({ is_active: !currentStatus })
            .eq('id', id);

        if (error) {
            toast.error('Failed to update status');
        } else {
            setCoupons(coupons.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
            toast.success('Status updated');
        }
    };

    const deleteCoupon = async (id: string) => {
        if (!confirm('Are you sure you want to delete this coupon?')) return;

        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Failed to delete coupon');
        } else {
            setCoupons(coupons.filter(c => c.id !== id));
            toast.success('Coupon deleted');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {language === 'ar' ? 'الكوبونات' : 'Coupons'}
                    </h2>
                    <p className="text-muted-foreground">
                        {language === 'ar' ? 'إدارة الخصومات والعروض لمتجرك' : 'Manage discounts and promotions for your store.'}
                    </p>
                </div>
                <Button asChild>
                    <Link href={`/dashboard/${storeId}/coupons/new`}>
                        <Plus className="mr-2 h-4 w-4" />
                        {language === 'ar' ? 'إنشاء كوبون' : 'Create Coupon'}
                    </Link>
                </Button>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Expiry</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {coupons.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No coupons found. Create one to get started!
                                </TableCell>
                            </TableRow>
                        ) : (
                            coupons.map((coupon) => (
                                <TableRow key={coupon.id}>
                                    <TableCell className="font-medium font-mono">
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-muted-foreground" />
                                            {coupon.code}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            {coupon.discount_type === 'percentage' ? (
                                                <Percent className="w-3 h-3 text-muted-foreground" />
                                            ) : (
                                                <DollarSign className="w-3 h-3 text-muted-foreground" />
                                            )}
                                            {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : coupon.discount_value}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {coupon.used_count} / {coupon.usage_limit || '∞'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                                            {coupon.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            {coupon.expires_at ? (
                                                <>
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(coupon.expires_at), 'MMM d, yyyy')}
                                                </>
                                            ) : (
                                                'No Expiry'
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => toggleStatus(coupon.id, coupon.is_active)}>
                                                    {coupon.is_active ? 'Deactivate' : 'Activate'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive" onClick={() => deleteCoupon(coupon.id)}>
                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { ShoppingBag, Award, Mail, Phone, MapPin, Loader2 } from 'lucide-react';

interface CustomerDetailsDialogProps {
    customer: any;
    storeId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CustomerDetailsDialog({
    customer,
    storeId,
    open,
    onOpenChange,
}: CustomerDetailsDialogProps) {
    const supabase = createClient();
    const { language } = useLanguage();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && customer) {
            fetchCustomerOrders();
        }
    }, [open, customer]);

    const fetchCustomerOrders = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('orders')
                .select('*')
                .eq('store_id', storeId)
                .eq('customer_snapshot->>phone', customer.phone)
                .order('created_at', { ascending: false })
                .limit(10);

            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{language === 'ar' ? 'تفاصيل العميل' : 'Customer Details'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Customer Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{language === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-xl font-bold text-primary">
                                        {customer.name?.charAt(0)?.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">{customer.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {language === 'ar' ? 'عميل منذ' : 'Customer since'} {format(new Date(customer.created_at), 'MMM yyyy')}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {customer.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        <span>{customer.phone}</span>
                                    </div>
                                )}
                                {customer.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        <span>{customer.email}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4" />
                                    {language === 'ar' ? 'الطلبات' : 'Orders'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{customer.total_orders}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">
                                    {language === 'ar' ? 'الإنفاق الكلي' : 'Total Spent'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{customer.total_spent?.toFixed(2)} SAR</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Award className="w-4 h-4" />
                                    {language === 'ar' ? 'النقاط' : 'Points'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{customer.loyalty_points || 0}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Orders */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{language === 'ar' ? 'الطلبات الأخيرة' : 'Recent Orders'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                            ) : orders.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    {language === 'ar' ? 'لا توجد طلبات' : 'No orders yet'}
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {orders.map((order) => (
                                        <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <p className="font-medium">#{order.order_number}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(new Date(order.created_at), 'MMM dd, yyyy')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">{order.total} {order.currency}</p>
                                                <Badge variant="secondary" className="mt-1">{order.status}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}

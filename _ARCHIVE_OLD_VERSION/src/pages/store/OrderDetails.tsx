import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useOutletContext, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, Truck, CheckCircle2, Clock, MapPin, Phone, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface StoreContext {
    store: {
        id: string;
        currency: string;
    };
}

interface OrderItem {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_snapshot: {
        name: { ar: string; en: string } | string;
        variants?: any[];
    };
}

interface Order {
    id: string;
    order_number: string;
    status: string;
    total: number;
    subtotal: number;
    shipping_cost: number;
    created_at: string;
    shipping_address: any;
    customer_snapshot: any;
}

export default function OrderDetails() {
    const { storeSlug, orderNumber } = useParams();
    const [searchParams] = useSearchParams();
    const phoneParam = searchParams.get('phone');

    const { store } = useOutletContext<StoreContext>();
    const { language } = useLanguage();
    const { toast } = useToast();

    const [order, setOrder] = useState<Order | null>(null);
    const [items, setItems] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (orderNumber && phoneParam) {
            fetchOrderDetails();
        } else {
            setError(language === 'ar' ? 'بيانات غير كافية' : 'Insufficient data');
            setLoading(false);
        }
    }, [orderNumber, phoneParam]);

    const fetchOrderDetails = async () => {
        try {
            // 1. Fetch Order and Verify
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('store_id', store.id)
                .eq('order_number', orderNumber)
                .single();

            if (orderError || !orderData) throw new Error(language === 'ar' ? 'الطلب غير موجود' : 'Order not found');

            // Verify Phone Again (Security)
            const snapshot = typeof orderData.customer_snapshot === 'string'
                ? JSON.parse(orderData.customer_snapshot)
                : orderData.customer_snapshot;

            const verifyPhone = (p1: string, p2: string) => {
                const n1 = (p1 || '').replace(/\D/g, '').slice(-9);
                const n2 = (p2 || '').replace(/\D/g, '').slice(-9);
                return n1 === n2 && n1.length > 0;
            };

            if (!verifyPhone(snapshot.phone, phoneParam || '') && !verifyPhone(snapshot.alt_phone, phoneParam || '')) {
                throw new Error(language === 'ar' ? 'غير مصرح لك بعرض هذا الطلب' : 'Unauthorized to view this order');
            }

            setOrder(orderData);

            // 2. Fetch Items
            const { data: itemsData, error: itemsError } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', orderData.id);

            if (itemsError) throw itemsError;

            setItems(itemsData || []);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
            style: 'currency',
            currency: store.currency,
        }).format(price);
    };

    const getStatusInfo = (status: string) => {
        const statusMap: Record<string, { label: { ar: string, en: string }, icon: any, color: string }> = {
            pending: { label: { ar: 'قيد الانتظار', en: 'Pending' }, icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
            processing: { label: { ar: 'جاري التجهيز', en: 'Processing' }, icon: Package, color: 'text-blue-600 bg-blue-100' },
            shipped: { label: { ar: 'تم الشحن', en: 'Shipped' }, icon: Truck, color: 'text-purple-600 bg-purple-100' },
            delivered: { label: { ar: 'تم التوصيل', en: 'Delivered' }, icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
            cancelled: { label: { ar: 'ملغي', en: 'Cancelled' }, icon: AlertCircle, color: 'text-red-600 bg-red-100' },
        };
        return statusMap[status] || statusMap['pending'];
    };

    // Dummy Icon for cancelled if missing import (I'll add it)
    const AlertCircle = ({ className }: { className?: string }) => <div className={className}>⚠️</div>;

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold">{error}</h2>
                <Link to={`/s/${storeSlug}/track`}>
                    <Button variant="outline">{language === 'ar' ? 'حاول مرة أخرى' : 'Try Again'}</Button>
                </Link>
            </div>
        );
    }

    const statusInfo = getStatusInfo(order.status);
    const StatusIcon = statusInfo.icon;
    const customer = typeof order.customer_snapshot === 'string' ? JSON.parse(order.customer_snapshot) : order.customer_snapshot;
    const shipping = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
                        <span className="text-muted-foreground text-lg">#{order.order_number}</span>
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'PPP p', { locale: language === 'ar' ? ar : enUS })}
                    </p>
                </div>
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 font-medium ${statusInfo.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span>{statusInfo.label[language] || statusInfo.label.en}</span>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Details (Items) */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{language === 'ar' ? 'المنتجات' : 'Items'}</CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y">
                            {items.map((item) => {
                                const productSnapshot = typeof item.product_snapshot === 'string'
                                    ? JSON.parse(item.product_snapshot)
                                    : item.product_snapshot;
                                const productName = productSnapshot.name?.[language] || productSnapshot.name?.ar || productSnapshot.name || 'Product';

                                return (
                                    <div key={item.id} className="py-4 flex gap-4">
                                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-lg font-bold text-muted-foreground">
                                            {productName.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium">{productName}</h4>
                                            {productSnapshot.variants && Array.isArray(productSnapshot.variants) && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {productSnapshot.variants.map((v: any, idx: number) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs font-normal">
                                                            {v.variantName?.[language] || v.variantName?.ar}: {v.optionLabel?.[language] || v.optionLabel?.ar}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex justify-between mt-2 text-sm">
                                                <span className="text-muted-foreground">{item.quantity} x {formatPrice(item.unit_price)}</span>
                                                <span className="font-medium">{formatPrice(item.total_price)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* Payment Summary */}
                    <Card>
                        <CardContent className="p-6 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                                <span>{formatPrice(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
                                <span>{formatPrice(order.shipping_cost)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                                <span className="text-primary">{formatPrice(order.total)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar (Customer & Address) */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{language === 'ar' ? 'معلومات العميل' : 'Customer Info'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-start gap-3">
                                <User className="w-4 h-4 mt-1 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">{customer.name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="w-4 h-4 mt-1 text-muted-foreground" />
                                <div>
                                    <p dir="ltr">{customer.phone}</p>
                                    {customer.alt_phone && <p dir="ltr" className="text-muted-foreground">{customer.alt_phone}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{language === 'ar' ? 'عنوان التوصيل' : 'Delivery Address'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">{shipping.city}</p>
                                    <p className="text-muted-foreground">{shipping.address}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Link to={`/s/${storeSlug}/track`}>
                        <Button variant="outline" className="w-full">
                            <ArrowRight className="w-4 h-4 me-2 rotate-180" />
                            {language === 'ar' ? 'تتبع طلب آخر' : 'Track Another Order'}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackOrder } from "./actions";
import { Search, Package, Clock, Truck, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ORDER_STATUSES = {
    pending: { label: { ar: 'قيد المراجعة', en: 'Pending' }, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', icon: Clock },
    confirmed: { label: { ar: 'مؤكد', en: 'Confirmed' }, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', icon: CheckCircle },
    processing: { label: { ar: 'جاري التجهيز', en: 'Processing' }, color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300', icon: Package },
    shipped: { label: { ar: 'تم الشحن', en: 'Shipped' }, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300', icon: Truck },
    delivered: { label: { ar: 'تم الاستلام', en: 'Delivered' }, color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', icon: CheckCircle },
    cancelled: { label: { ar: 'ملغي', en: 'Cancelled' }, color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', icon: AlertCircle },
    returned: { label: { ar: 'مرتجع', en: 'Returned' }, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300', icon: AlertCircle },
};

export default function TrackOrderPage({ params }: { params: { storeSlug: string } }) {
    const { language, dir } = useLanguage();
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<any[] | null>(null);
    const [currency, setCurrency] = useState('EGP');

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
            style: 'currency',
            currency: currency
        }).format(price);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setLoading(true);
        setError(null);
        setResults(null);

        try {
            const res = await trackOrder(params.storeSlug, searchQuery);
            if (res.error) {
                setError(language === 'ar' ? "لم يتم العثور على طلبات مطابقة أو أرقام الهواتف" : res.error);
            } else if (res.orders) {
                setResults(res.orders);
                setCurrency(res.currency || 'EGP');
            }
        } catch (err) {
            setError(language === 'ar' ? 'حدث خطأ أثناء البحث' : 'An error occurred while searching');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[70vh] py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Truck className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {language === 'ar' ? 'تتبع طلبك' : 'Track Your Order'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                        {language === 'ar'
                            ? 'أدخل رقم الطلب الخاص بك (مثال: ORD-123456) أو رقم الهاتف المستخدم أثناء الطلب لمعرفة حالة طلبك الحالية.'
                            : 'Enter your order number (e.g. ORD-123456) or phone number to see the current status.'}
                    </p>
                </div>

                <Card className="shadow-lg border-0 ring-1 ring-slate-200 dark:ring-slate-800">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className={cn("absolute top-3 w-5 h-5 text-slate-400", language === 'ar' ? 'right-3' : 'left-3')} />
                                <Input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={language === 'ar' ? 'رقم الطلب أو رقم الموبايل...' : 'Order number or phone...'}
                                    className={cn("h-12 text-lg shadow-sm bg-white dark:bg-slate-900", language === 'ar' ? 'pr-10' : 'pl-10')}
                                />
                            </div>
                            <Button type="submit" size="lg" disabled={loading} className="h-12 px-8 font-semibold">
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    language === 'ar' ? 'تتبع الآن' : 'Track Now'
                                )}
                            </Button>
                        </form>

                        {error && (
                            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-center font-medium flex items-center justify-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                {error}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {results && results.length > 0 && (
                    <div className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {results.map((order) => {
                            const statusInfo = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES] || ORDER_STATUSES.pending;
                            const StatusIcon = statusInfo.icon;

                            return (
                                <Card key={order.id} className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-md">
                                    <div className="bg-slate-100 dark:bg-slate-800/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800">
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                                                {language === 'ar' ? 'رقم الطلب' : 'Order Number'}
                                            </p>
                                            <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                                                {order.order_number}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-start sm:items-end gap-2">
                                            <Badge className={cn("px-3 py-1 font-semibold flex items-center gap-1.5 text-sm", statusInfo.color)} variant="outline">
                                                <StatusIcon className="w-4 h-4" />
                                                {statusInfo.label[language as 'ar' | 'en']}
                                            </Badge>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {format(new Date(order.created_at), 'PPPp', language === 'ar' ? { locale: ar } : undefined)}
                                            </p>
                                        </div>
                                    </div>

                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                                    <Package className="w-5 h-5 text-slate-400" />
                                                    {language === 'ar' ? 'المنتجات' : 'Products'}
                                                </h3>
                                                <div className="space-y-3">
                                                    {order.order_items?.map((item: any, idx: number) => {
                                                        const name = typeof item.product_snapshot?.name === 'string'
                                                            ? item.product_snapshot.name
                                                            : (item.product_snapshot?.name?.[language] || item.product_snapshot?.name?.ar || 'Product');

                                                        return (
                                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-slate-900 dark:text-white">{item.quantity}x</span>
                                                                    <span className="text-slate-600 dark:text-slate-300 line-clamp-1">{name}</span>
                                                                </div>
                                                                <span className="font-mono">{formatPrice(item.unit_price)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm uppercase tracking-wider">
                                                        {language === 'ar' ? 'بيانات التوصيل' : 'Delivery Details'}
                                                    </h3>
                                                    <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                                        <p className="font-medium text-slate-900 dark:text-white">{order.customer_snapshot?.name}</p>
                                                        <p dir="ltr" className={cn("text-slate-500", language === 'ar' ? 'text-right' : 'text-left')}>{order.customer_snapshot?.phone}</p>
                                                        <p className="mt-2">{order.shipping_address?.address}</p>
                                                        <p>{order.shipping_address?.city}</p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {language === 'ar' ? 'الإجمالي' : 'Total'}
                                                    </span>
                                                    <span className="text-xl font-black text-primary">
                                                        {formatPrice(order.total)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft,
    ExternalLink,
    Store,
    Package,
    ShoppingCart,
    Eye,
    DollarSign,
    TrendingUp,
    Users,
    Tag,
    Ticket,
    RefreshCcw,
    CheckCircle,
    XCircle,
    Clock,
    Wallet,
    Trophy,
    BarChart3,
    Loader2,
    MousePointerClick
} from 'lucide-react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

export default function AdminStoreDetailsPage({ params }: { params: { storeId: string } }) {
    const { storeId } = params;
    const { language } = useLanguage();
    const supabase = createClient();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStoreDetails();
    }, [storeId]);

    const fetchStoreDetails = async () => {
        try {
            setLoading(true);
            const { data: result, error: rpcError } = await supabase.rpc('get_admin_store_details', {
                p_store_id: storeId
            });

            if (rpcError) throw rpcError;
            if (result?.error) throw new Error(result.error);

            setData(result);
        } catch (e: any) {
            console.error('Error fetching store details:', e);
            setError(e.message || 'Failed to load store details');
        } finally {
            setLoading(false);
        }
    };

    const getLocalizedName = (nameObj: any) => {
        if (!nameObj) return 'بدون اسم';
        if (typeof nameObj === 'string') {
            try {
                const parsed = JSON.parse(nameObj);
                return parsed.ar || parsed.en || nameObj;
            } catch {
                return nameObj;
            }
        }
        return nameObj.ar || nameObj.en || 'بدون اسم';
    };

    const formatCurrency = (amount: number, currency?: string) => {
        const cur = currency || data?.store?.currency || 'EGP';
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: cur,
            maximumFractionDigits: 2,
        }).format(amount || 0);
    };

    const parseImages = (imagesData: any) => {
        if (!imagesData) return [];
        if (typeof imagesData === 'string') {
            try { return JSON.parse(imagesData); } catch { return []; }
        }
        return Array.isArray(imagesData) ? imagesData : [];
    };

    const getStatusBadge = (status: string) => {
        const map: any = {
            active: { label: 'نشط', className: 'bg-green-100 text-green-800' },
            banned: { label: 'محظور', className: 'bg-red-100 text-red-800' },
            maintenance: { label: 'صيانة', className: 'bg-orange-100 text-orange-800' },
            unpaid: { label: 'منتهي', className: 'bg-gray-100 text-gray-800' },
        };
        const item = map[status] || { label: status, className: '' };
        return <Badge className={item.className}>{item.label}</Badge>;
    };

    const getOrderStatusBadge = (status: string) => {
        const map: any = {
            pending: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-800' },
            processing: { label: 'قيد التجهيز', className: 'bg-blue-100 text-blue-800' },
            shipped: { label: 'تم الشحن', className: 'bg-purple-100 text-purple-800' },
            delivered: { label: 'تم التسليم', className: 'bg-green-100 text-green-800' },
            completed: { label: 'مكتمل', className: 'bg-green-100 text-green-800' },
            cancelled: { label: 'ملغي', className: 'bg-red-100 text-red-800' },
        };
        const item = map[status] || { label: status, className: '' };
        return <Badge className={item.className}>{item.label}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">جاري تحميل تفاصيل المتجر...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                    <XCircle className="w-12 h-12 text-red-400 mx-auto" />
                    <p className="text-red-600 font-medium">{error || 'حدث خطأ في تحميل البيانات'}</p>
                    <Button variant="outline" onClick={() => window.history.back()}>رجوع</Button>
                </div>
            </div>
        );
    }

    const { store, stats, subscription, wallet_transactions, recent_orders, products, top_products, revenue_data } = data;

    const kpiCards = [
        { title: 'إجمالي المنتجات', value: stats.products_count, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'إجمالي الطلبات', value: stats.orders_count, icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-100' },
        { title: 'إجمالي المبيعات', value: formatCurrency(stats.total_sales), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100', raw: true },
        { title: 'صافي الربح', value: formatCurrency(stats.total_sales), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100', raw: true },
        { title: 'متوسط سعر الطلب', value: formatCurrency(stats.aov), icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-100', raw: true },
        { title: 'الزيارات', value: stats.visits_count, icon: Eye, color: 'text-cyan-600', bg: 'bg-cyan-100' },
        { title: 'معدل التحويل', value: `${(stats.conversion_rate || 0).toFixed(2)}%`, icon: RefreshCcw, color: 'text-teal-600', bg: 'bg-teal-100', raw: true },
        { title: 'مرات إضافة للسلة', value: stats.carts_count, icon: MousePointerClick, color: 'text-orange-600', bg: 'bg-orange-100' },
        { title: 'طلبات جديدة', value: stats.pending_orders, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        { title: 'طلبات مكتملة', value: stats.completed_orders, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'طلبات ملغاة', value: stats.cancelled_orders, icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
        { title: 'الإيرادات المفقودة', value: formatCurrency(stats.active_carts_value), icon: RefreshCcw, color: 'text-slate-600', bg: 'bg-slate-100', raw: true },
        { title: 'التصنيفات', value: stats.categories_count, icon: Tag, color: 'text-pink-600', bg: 'bg-pink-100' },
        { title: 'العملاء', value: stats.customers_count, icon: Users, color: 'text-violet-600', bg: 'bg-violet-100' },
        { title: 'الكوبونات', value: stats.coupons_count, icon: Ticket, color: 'text-amber-600', bg: 'bg-amber-100' },
    ];

    const chartData = (revenue_data || []).map((d: any) => ({
        name: d.day_label,
        total: d.daily_total || 0,
    }));

    return (
        <div className="space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/stores"><ArrowLeft className="w-5 h-5" /></Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        {store.logo_url && <img src={store.logo_url} alt="" className="w-10 h-10 rounded-full object-cover" />}
                        {getLocalizedName(store.name)}
                        {getStatusBadge(store.status)}
                        {store.has_unlimited_balance && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                                غير محدود (VIP)
                            </Badge>
                        )}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {store.slug} • {store.owner_name} ({store.owner_email})
                    </p>
                </div>
                <Button asChild variant="outline" className="gap-2">
                    <a href={`/api/admin/impersonate?storeId=${storeId}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        الدخول للمتجر
                    </a>
                </Button>
            </div>

            {/* Store Info Card */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground block">المالك</span>
                            <span className="font-medium">{store.owner_name || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block">البريد</span>
                            <span className="font-medium text-xs">{store.owner_email || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block">العملة</span>
                            <span className="font-medium">{store.currency || 'EGP'}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block">الرصيد</span>
                            {store.has_unlimited_balance ? (
                                <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">غير محدود (VIP)</Badge>
                            ) : (
                                <span className={`font-bold ${(store.balance || 0) <= 0 ? 'text-red-500' : 'text-green-600'}`}>
                                    {formatCurrency(store.balance)}
                                </span>
                            )}
                        </div>
                        <div>
                            <span className="text-muted-foreground block">العمولة</span>
                            <span className="font-medium">
                                {store.commission_type === 'percentage'
                                    ? `${store.commission_value || 0}%`
                                    : formatCurrency(store.commission_value || 0)}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block">تاريخ الإنشاء</span>
                            <span className="font-medium">{format(new Date(store.created_at), 'yyyy-MM-dd')}</span>
                        </div>
                        {subscription && (
                            <>
                                <div>
                                    <span className="text-muted-foreground block">الباقة</span>
                                    <Badge variant="outline">{subscription.plan_name_ar || subscription.plan_name_en}</Badge>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">انتهاء الاشتراك</span>
                                    <span className="font-medium">{format(new Date(subscription.current_period_end), 'yyyy-MM-dd')}</span>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {kpiCards.map((card, idx) => (
                    <Card key={idx} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
                                <div className={`p-1.5 rounded-full ${card.bg}`}>
                                    <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
                                </div>
                            </div>
                            <div className="text-xl font-bold" dir="ltr">
                                {card.raw ? card.value : Number(card.value).toLocaleString('ar-EG')}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Revenue Chart */}
            {chartData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            نمو المبيعات (آخر 30 يوم)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="adminColorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" vertical={false} />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                                        formatter={(value: any) => [formatCurrency(value), 'المبيعات']}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#adminColorTotal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs Section */}
            <Tabs defaultValue="products" dir="rtl">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="products" className="gap-1.5">
                        <Package className="w-4 h-4" />
                        المنتجات
                    </TabsTrigger>
                    <TabsTrigger value="top-products" className="gap-1.5">
                        <Trophy className="w-4 h-4" />
                        الأكثر مبيعاً
                    </TabsTrigger>
                    <TabsTrigger value="orders" className="gap-1.5">
                        <ShoppingCart className="w-4 h-4" />
                        الطلبات
                    </TabsTrigger>
                    <TabsTrigger value="wallet" className="gap-1.5">
                        <Wallet className="w-4 h-4" />
                        المحفظة
                    </TabsTrigger>
                    <TabsTrigger value="subscription" className="gap-1.5">
                        <Store className="w-4 h-4" />
                        الاشتراك
                    </TabsTrigger>
                </TabsList>

                {/* Products Tab */}
                <TabsContent value="products">
                    <Card>
                        <CardHeader>
                            <CardTitle>جميع المنتجات ({products?.length || 0})</CardTitle>
                            <CardDescription>قائمة كاملة بمنتجات المتجر مع الأسعار والمبيعات والترافيك</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right">المنتج</TableHead>
                                            <TableHead className="text-right">السعر</TableHead>
                                            <TableHead className="text-right">سعر التكلفة</TableHead>
                                            <TableHead className="text-right">المخزون</TableHead>
                                            <TableHead className="text-right">الزيارات</TableHead>
                                            <TableHead className="text-right">المبيعات</TableHead>
                                            <TableHead className="text-right">الإيرادات</TableHead>
                                            <TableHead className="text-right">الحالة</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(!products || products.length === 0) ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                                    لا توجد منتجات
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            products.map((product: any) => (
                                                <TableRow key={product.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {parseImages(product.images)?.[0] && (
                                                                <img src={parseImages(product.images)[0]} alt="" className="w-10 h-10 rounded object-cover" />
                                                            )}
                                                            <span className="font-medium max-w-[200px] truncate">
                                                                {getLocalizedName(product.name)}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{formatCurrency(product.price)}</TableCell>
                                                    <TableCell>{product.cost_price ? formatCurrency(product.cost_price) : '-'}</TableCell>
                                                    <TableCell>
                                                        <span className={product.stock <= 0 ? 'text-red-500 font-bold' : ''}>
                                                            {product.stock ?? '∞'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <Eye className="w-3 h-3 text-muted-foreground" />
                                                            {product.visit_count || 0}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-medium">{product.total_sold || 0}</span>
                                                    </TableCell>
                                                    <TableCell>{formatCurrency(product.total_revenue)}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                                                            {product.status === 'active' ? 'نشط' : product.status === 'draft' ? 'مسودة' : product.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Top Products Tab */}
                <TabsContent value="top-products">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                المنتجات الأكثر مبيعاً (أعلى 10)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(!top_products || top_products.length === 0) ? (
                                <p className="text-center text-muted-foreground py-8">لا توجد بيانات مبيعات</p>
                            ) : (
                                <div className="space-y-3">
                                    {top_products.map((item: any, index: number) => (
                                        <div key={index} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-primary/20 text-primary'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            {parseImages(item.product_images)?.[0] && (
                                                <img src={parseImages(item.product_images)[0]} alt="" className="w-14 h-14 object-cover rounded-lg" />
                                            )}
                                            <div className="flex-1">
                                                <p className="font-medium">{getLocalizedName(item.product_name)}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {item.total_sold} وحدة مباعة
                                                </p>
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-lg">{formatCurrency(item.total_revenue)}</p>
                                                <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders">
                    <Card>
                        <CardHeader>
                            <CardTitle>آخر الطلبات</CardTitle>
                            <CardDescription>آخر 20 طلب في المتجر</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right">رقم الطلب</TableHead>
                                            <TableHead className="text-right">العميل</TableHead>
                                            <TableHead className="text-right">الهاتف</TableHead>
                                            <TableHead className="text-right">المبلغ</TableHead>
                                            <TableHead className="text-right">الحالة</TableHead>
                                            <TableHead className="text-right">التاريخ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(!recent_orders || recent_orders.length === 0) ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                    لا توجد طلبات
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            recent_orders.map((order: any) => (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-mono font-medium">{order.order_number}</TableCell>
                                                    <TableCell>{order.customer_snapshot?.name || 'غير محدد'}</TableCell>
                                                    <TableCell dir="ltr" className="text-right">{order.customer_snapshot?.phone || '-'}</TableCell>
                                                    <TableCell className="font-bold">{formatCurrency(order.total, order.currency)}</TableCell>
                                                    <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                                                    <TableCell>{format(new Date(order.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Wallet Tab */}
                <TabsContent value="wallet">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="w-5 h-5" />
                                سجل معاملات المحفظة
                            </CardTitle>
                            <CardDescription>
                                الرصيد الحالي: {store.has_unlimited_balance ? 'غير محدود (VIP)' : formatCurrency(store.balance)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right">النوع</TableHead>
                                            <TableHead className="text-right">المبلغ</TableHead>
                                            <TableHead className="text-right">الوصف</TableHead>
                                            <TableHead className="text-right">التاريخ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(!wallet_transactions || wallet_transactions.length === 0) ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                    لا توجد معاملات
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            wallet_transactions.map((tx: any) => (
                                                <TableRow key={tx.id}>
                                                    <TableCell>
                                                        <Badge variant={tx.type === 'deposit' ? 'default' : 'destructive'}>
                                                            {tx.type === 'deposit' ? 'إيداع' : tx.type === 'withdrawal' ? 'سحب' : tx.type === 'commission' ? 'عمولة' : tx.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className={`font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                        {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                                    </TableCell>
                                                    <TableCell className="text-sm max-w-[300px] truncate">{tx.description || '-'}</TableCell>
                                                    <TableCell>{format(new Date(tx.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Subscription Tab */}
                <TabsContent value="subscription">
                    <Card>
                        <CardHeader>
                            <CardTitle>معلومات الاشتراك</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {subscription ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="p-4 border rounded-lg">
                                        <span className="text-muted-foreground text-sm block mb-1">الباقة</span>
                                        <span className="font-bold text-lg">{subscription.plan_name_ar || subscription.plan_name_en}</span>
                                    </div>
                                    <div className="p-4 border rounded-lg">
                                        <span className="text-muted-foreground text-sm block mb-1">السعر</span>
                                        <span className="font-bold text-lg">{formatCurrency(subscription.plan_price)}</span>
                                        <span className="text-xs text-muted-foreground block">
                                            {subscription.plan_interval === 'monthly' ? 'شهرياً' : subscription.plan_interval === 'yearly' ? 'سنوياً' : 'مدى الحياة'}
                                        </span>
                                    </div>
                                    <div className="p-4 border rounded-lg">
                                        <span className="text-muted-foreground text-sm block mb-1">تاريخ البدء</span>
                                        <span className="font-bold">{format(new Date(subscription.starts_at), 'yyyy-MM-dd')}</span>
                                    </div>
                                    <div className="p-4 border rounded-lg">
                                        <span className="text-muted-foreground text-sm block mb-1">تاريخ الانتهاء</span>
                                        <span className="font-bold">{format(new Date(subscription.current_period_end), 'yyyy-MM-dd')}</span>
                                    </div>
                                    {subscription.features && (
                                        <div className="col-span-full p-4 border rounded-lg">
                                            <span className="text-muted-foreground text-sm block mb-2">مميزات الباقة</span>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(subscription.features).map(([key, val]: any) => (
                                                    <Badge key={key} variant="outline">
                                                        {key === 'products_limit' ? `حد المنتجات: ${val === -1 ? 'لا محدود' : val}` :
                                                            key === 'stores_limit' ? `حد المتاجر: ${val}` : `${key}: ${val}`}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">لا يوجد اشتراك نشط حالياً</p>
                                    <Badge variant="outline" className="mt-2">باقة مجانية</Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

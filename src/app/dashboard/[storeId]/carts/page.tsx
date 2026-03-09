"use client";

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingBag, MessageCircle, Clock, CheckCircle2, XCircle, TrendingUp, DollarSign, ShoppingCart, Link2, Copy, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from '@/lib/supabase/client';

interface CartItem {
    productId: string;
    productName: any;
    quantity: number;
    unitPrice: number;
    productImage: string;
    variants: any[];
}

interface AbandonedCart {
    id: string;
    store_id: string;
    customer_name: string;
    customer_phone: string;
    cart_items: CartItem[];
    total_price: number;
    recovery_status: 'pending' | 'recovered' | 'lost';
    created_at: string;
    updated_at: string;
}

interface CartStats {
    pending: number;
    recovered: number;
    lost: number;
    totalValue: number;
    recoveredValue: number;
    recoveryRate: number;
}

export default function AbandonedCartsPage({ params }: { params: { storeId: string } }) {
    const { language, dir } = useLanguage();
    const { toast } = useToast();
    const supabase = createClient();

    const [carts, setCarts] = useState<AbandonedCart[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'pending' | 'recovered' | 'lost'>('pending');
    const [stats, setStats] = useState<CartStats>({ pending: 0, recovered: 0, lost: 0, totalValue: 0, recoveredValue: 0, recoveryRate: 0 });
    const [storeSlug, setStoreSlug] = useState('');
    const [storeCurrency, setStoreCurrency] = useState('SAR');

    // Fetch store info
    useEffect(() => {
        const fetchStoreInfo = async () => {
            const { data } = await supabase
                .from('stores')
                .select('slug, currency')
                .eq('id', params.storeId)
                .single();
            if (data) {
                setStoreSlug(data.slug || '');
                setStoreCurrency(data.currency || 'SAR');
            }
        };
        fetchStoreInfo();
    }, [params.storeId]);

    // Fetch stats across all statuses
    const fetchStats = useCallback(async () => {
        try {
            const [pendingRes, recoveredRes, lostRes] = await Promise.all([
                supabase.from('abandoned_carts').select('total_price').eq('store_id', params.storeId).eq('recovery_status', 'pending'),
                supabase.from('abandoned_carts').select('total_price').eq('store_id', params.storeId).eq('recovery_status', 'recovered'),
                supabase.from('abandoned_carts').select('total_price').eq('store_id', params.storeId).eq('recovery_status', 'lost'),
            ]);

            const pendingData = pendingRes.data || [];
            const recoveredData = recoveredRes.data || [];
            const lostData = lostRes.data || [];

            const pendingValue = pendingData.reduce((sum, c) => sum + (c.total_price || 0), 0);
            const recoveredValue = recoveredData.reduce((sum, c) => sum + (c.total_price || 0), 0);
            const lostValue = lostData.reduce((sum, c) => sum + (c.total_price || 0), 0);
            const total = pendingData.length + recoveredData.length + lostData.length;
            const rate = total > 0 ? Math.round((recoveredData.length / total) * 100) : 0;

            setStats({
                pending: pendingData.length,
                recovered: recoveredData.length,
                lost: lostData.length,
                totalValue: pendingValue + recoveredValue + lostValue,
                recoveredValue,
                recoveryRate: rate,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, [params.storeId]);

    const fetchCarts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dashboard/${params.storeId}/abandoned-carts?status=${statusFilter}`);
            if (res.ok) {
                const data = await res.json();
                setCarts(data.carts || []);
            }
        } catch (error) {
            console.error('Error fetching carts:', error);
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: language === 'ar' ? 'فشل في جلب السلات' : 'Failed to fetch carts',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCarts();
        fetchStats();
    }, [params.storeId, statusFilter]);

    const updateStatus = async (id: string, newStatus: 'recovered' | 'lost') => {
        try {
            const res = await fetch(`/api/dashboard/${params.storeId}/abandoned-carts`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, recovery_status: newStatus })
            });

            if (res.ok) {
                setCarts(carts.filter(cart => cart.id !== id));
                fetchStats();
                toast({
                    title: language === 'ar' ? 'تم التحديث' : 'Updated',
                    description: language === 'ar' ? 'تم تحديث حالة السلة بنجاح' : 'Cart status updated successfully',
                });
            } else {
                throw new Error('Failed to update status');
            }
        } catch (error) {
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: language === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred',
                variant: 'destructive',
            });
        }
    };

    const formatPhoneNumber = (phone: string) => {
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('0')) {
            if (cleaned.startsWith('05') && cleaned.length === 10) {
                cleaned = '966' + cleaned.substring(1);
            }
        }
        return cleaned;
    };

    // Recovery link generator
    const getRecoveryLink = (cart: AbandonedCart) => {
        if (!storeSlug) return '';
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return `${baseUrl}/s/${storeSlug}?recover=${cart.id}`;
    };

    const copyRecoveryLink = (cart: AbandonedCart) => {
        const link = getRecoveryLink(cart);
        navigator.clipboard.writeText(link);
        toast({
            title: language === 'ar' ? 'تم النسخ' : 'Copied',
            description: language === 'ar' ? 'تم نسخ رابط الاسترداد' : 'Recovery link copied',
        });
    };

    // WhatsApp message templates
    const getWhatsAppTemplates = (cart: AbandonedCart) => {
        const phone = formatPhoneNumber(cart.customer_phone);
        const name = cart.customer_name || (language === 'ar' ? 'عميلنا العزيز' : 'Customer');
        const recoveryLink = getRecoveryLink(cart);
        const itemCount = cart.cart_items?.length || 0;
        const totalFormatted = formatPrice(cart.total_price, storeCurrency);

        const templates = [
            {
                id: 'friendly',
                label: language === 'ar' ? '💬 تذكير ودي' : '💬 Friendly Reminder',
                message: language === 'ar'
                    ? `مرحباً ${name} 👋\n\nلاحظنا إنك تركت ${itemCount} منتج في سلتك بقيمة ${totalFormatted}.\n\nهل تحتاج مساعدة في إتمام طلبك؟ يمكنك العودة مباشرة من هنا:\n${recoveryLink}\n\nنحن هنا لمساعدتك! 😊`
                    : `Hi ${name} 👋\n\nWe noticed you left ${itemCount} item(s) in your cart worth ${totalFormatted}.\n\nNeed help completing your order? You can go back directly:\n${recoveryLink}\n\nWe're here to help! 😊`,
            },
            {
                id: 'discount',
                label: language === 'ar' ? '🎁 عرض خصم' : '🎁 Discount Offer',
                message: language === 'ar'
                    ? `مرحباً ${name} 🎉\n\nمنتجاتك لا تزال في انتظارك! (${itemCount} منتج بقيمة ${totalFormatted})\n\n🎁 خصيصاً لك: استخدم كود خصم خاص عند إتمام طلبك!\n\nأكمل طلبك الآن:\n${recoveryLink}\n\nالعرض لفترة محدودة ⏰`
                    : `Hi ${name} 🎉\n\nYour items are still waiting! (${itemCount} item(s) worth ${totalFormatted})\n\n🎁 Just for you: Use a special discount code when completing your order!\n\nComplete your order now:\n${recoveryLink}\n\nLimited time offer ⏰`,
            },
            {
                id: 'urgency',
                label: language === 'ar' ? '⚡ فرصة أخيرة' : '⚡ Last Chance',
                message: language === 'ar'
                    ? `${name}، لا تفوّت الفرصة! ⚡\n\nمنتجاتك في السلة (${totalFormatted}) قد تنفد قريباً.\n\nأكمل طلبك قبل فوات الأوان:\n${recoveryLink}\n\n⚠️ الكميات محدودة!`
                    : `${name}, don't miss out! ⚡\n\nYour cart items (${totalFormatted}) may go out of stock soon.\n\nComplete your order before it's too late:\n${recoveryLink}\n\n⚠️ Limited stock!`,
            },
        ];

        return templates.map(t => ({
            ...t,
            link: `https://wa.me/${phone}?text=${encodeURIComponent(t.message)}`,
        }));
    };

    const getProductName = (nameObj: any) => {
        if (!nameObj) return 'Product';
        if (typeof nameObj === 'string') {
            try { return JSON.parse(nameObj)[language] || nameObj; } catch { return nameObj; }
        }
        return nameObj[language] || nameObj.ar || nameObj.en || 'Product';
    };

    return (
        <div className="space-y-6" dir={dir}>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {language === 'ar' ? 'السلات المتروكة' : 'Abandoned Carts'}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {language === 'ar'
                        ? 'استرجع المبيعات المحتملة بالتواصل المباشر مع العملاء الذين لم يكملوا عملية الدفع.'
                        : 'Recover potential sales by directly contacting customers who did not complete their checkout.'}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/10">
                                <ShoppingCart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'سلات معلّقة' : 'Pending Carts'}</p>
                                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.pending}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10">
                                <DollarSign className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'القيمة الإجمالية' : 'Total Value'}</p>
                                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatPrice(stats.totalValue, storeCurrency)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'تم استردادها' : 'Recovered'}</p>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.recovered}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'نسبة الاسترداد' : 'Recovery Rate'}</p>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.recoveryRate}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="pending" onValueChange={(v) => setStatusFilter(v as any)}>
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="pending">
                        {language === 'ar' ? 'بانتظار الاسترجاع' : 'Pending'}
                        {stats.pending > 0 && <Badge variant="secondary" className="ms-2 text-xs">{stats.pending}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="recovered">
                        {language === 'ar' ? 'تم الاسترجاع' : 'Recovered'}
                        {stats.recovered > 0 && <Badge variant="secondary" className="ms-2 text-xs">{stats.recovered}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="lost">
                        {language === 'ar' ? 'مفقودة' : 'Lost'}
                        {stats.lost > 0 && <Badge variant="secondary" className="ms-2 text-xs">{stats.lost}</Badge>}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={statusFilter} className="mt-6">
                    {loading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : carts.length === 0 ? (
                        <Card className="border-dashed bg-muted/20">
                            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                                <ShoppingBag className="h-12 w-12 text-muted-foreground/30 border-2 rounded-full p-2 mb-4" />
                                <CardTitle className="mb-2">
                                    {language === 'ar' ? 'لا توجد سلات' : 'No carts found'}
                                </CardTitle>
                                <CardDescription>
                                    {language === 'ar'
                                        ? 'لا توجد سلات متروكة في هذه القائمة حالياً.'
                                        : 'There are no abandoned carts in this list right now.'}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6">
                            {carts.map((cart) => (
                                <Card key={cart.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="p-6 md:flex gap-6 items-start justify-between">
                                        <div className="space-y-4 flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-lg">{cart.customer_name || (language === 'ar' ? 'بدون اسم' : 'Unnamed')}</h3>
                                                    <p className="text-muted-foreground font-mono mt-1" dir="ltr">{cart.customer_phone}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-black text-xl text-primary">{formatPrice(cart.total_price, storeCurrency)}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {formatDistanceToNow(new Date(cart.updated_at), { addSuffix: true, locale: language === 'ar' ? ar : enUS })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Cart items with images */}
                                            <div className="bg-muted/40 rounded-lg p-4">
                                                <h4 className="text-sm font-semibold mb-3">
                                                    {language === 'ar' ? 'محتويات السلة' : 'Cart Contents'} ({cart.cart_items?.length || 0})
                                                </h4>
                                                <div className="space-y-3">
                                                    {cart.cart_items?.map((item, i) => (
                                                        <div key={i} className="flex gap-3 items-center">
                                                            <div className="w-12 h-12 rounded-lg bg-background border flex-shrink-0 overflow-hidden">
                                                                {item.productImage ? (
                                                                    <img src={item.productImage} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <ShoppingBag className="w-5 h-5 m-auto text-muted-foreground opacity-50 mt-3" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate">{getProductName(item.productName)}</p>
                                                                {item.variants?.length > 0 && (
                                                                    <p className="text-xs text-muted-foreground truncate">
                                                                        {item.variants.map(v => v.optionLabel?.[language] || v.optionLabel?.ar || v.optionLabel || '').join(' - ')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="text-end text-sm whitespace-nowrap">
                                                                <span className="text-muted-foreground mr-2">{item.quantity}x</span>
                                                                <span className="font-semibold">{formatPrice(item.unitPrice, storeCurrency)}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="mt-6 md:mt-0 flex flex-col gap-3 min-w-[220px]">
                                            {statusFilter === 'pending' && (
                                                <>
                                                    {/* WhatsApp Templates Dropdown */}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 font-bold"
                                                            >
                                                                <MessageCircle className="w-5 h-5" />
                                                                {language === 'ar' ? 'تواصل عبر واتساب' : 'Contact WhatsApp'}
                                                                <ChevronDown className="w-4 h-4 ms-auto" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-56">
                                                            {getWhatsAppTemplates(cart).map((template) => (
                                                                <DropdownMenuItem
                                                                    key={template.id}
                                                                    onClick={() => window.open(template.link, '_blank')}
                                                                    className="cursor-pointer py-3"
                                                                >
                                                                    <span className="font-medium">{template.label}</span>
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>

                                                    {/* Recovery Link */}
                                                    <Button
                                                        variant="outline"
                                                        className="w-full gap-2"
                                                        onClick={() => copyRecoveryLink(cart)}
                                                    >
                                                        <Link2 className="w-4 h-4" />
                                                        {language === 'ar' ? 'نسخ رابط الاسترداد' : 'Copy Recovery Link'}
                                                        <Copy className="w-3 h-3 ms-auto opacity-50" />
                                                    </Button>

                                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                                        <Button
                                                            variant="outline"
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                                            onClick={() => updateStatus(cart.id, 'recovered')}
                                                        >
                                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                                            {language === 'ar' ? 'استُرجِعت' : 'Recovered'}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                            onClick={() => updateStatus(cart.id, 'lost')}
                                                        >
                                                            <XCircle className="w-4 h-4 mr-2" />
                                                            {language === 'ar' ? 'مفقودة' : 'Lost'}
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                            {statusFilter !== 'pending' && (
                                                <Badge variant={statusFilter === 'recovered' ? 'default' : 'destructive'} className="w-full py-2 justify-center text-sm">
                                                    {statusFilter === 'recovered'
                                                        ? (language === 'ar' ? 'تم استرجاع المبيعة بنجاح' : 'Successfully Recovered')
                                                        : (language === 'ar' ? 'العميل لم يكمل الطلب' : 'Customer lost')
                                                    }
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

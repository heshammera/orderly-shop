"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingBag, MessageCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function AbandonedCartsPage({ params }: { params: { storeId: string } }) {
    const { language, dir } = useLanguage();
    const { toast } = useToast();

    const [carts, setCarts] = useState<AbandonedCart[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'pending' | 'recovered' | 'lost'>('pending');

    // Using a fake store name since we might not have it in state here without fetching, 
    // but the URL will suffice for WhatsApp context
    const storeName = language === 'ar' ? 'متجرنا' : 'our store';

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // Simple formatter: remove leading zeors and non-digits for wa.me link
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('0')) {
            // Assume saudi or local code if no country code provided, but this is basic
            // Ideally, the user enters the full number or we know the country. 
            // We can just rely on standard formats. To be safe, keep it as is if we don't know the exact country code.
            // But WhatsApp requires country code. If starts with 05, it's likely SA (966).
            if (cleaned.startsWith('05') && cleaned.length === 10) {
                cleaned = '966' + cleaned.substring(1);
            }
        }
        return cleaned;
    };

    const getWhatsAppLink = (cart: AbandonedCart) => {
        const phone = formatPhoneNumber(cart.customer_phone);
        const name = cart.customer_name || (language === 'ar' ? 'عميلنا العزيز' : 'Customer');

        const textAr = `مرحباً ${name}، لاحظنا أنك تركت بعض المنتجات في السلة التابعة لمرتجرنا. هل يمكننا مساعدتك في إتمام الطلب؟`;
        const textEn = `Hello ${name}, we noticed you left some items in your cart at ${storeName}. Can we help you complete your order?`;

        const message = encodeURIComponent(language === 'ar' ? textAr : textEn);
        return `https://wa.me/${phone}?text=${message}`;
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

            <Tabs defaultValue="pending" onValueChange={(v) => setStatusFilter(v as any)}>
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="pending">{language === 'ar' ? 'بانتظار الاسترجاع' : 'Pending'}</TabsTrigger>
                    <TabsTrigger value="recovered">{language === 'ar' ? 'تم الاسترجاع' : 'Recovered'}</TabsTrigger>
                    <TabsTrigger value="lost">{language === 'ar' ? 'مفقودة' : 'Lost'}</TabsTrigger>
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
                                                    <div className="font-black text-xl text-primary">{formatPrice(cart.total_price)}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {formatDistanceToNow(new Date(cart.updated_at), { addSuffix: true, locale: language === 'ar' ? ar : enUS })}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-muted/40 rounded-lg p-4">
                                                <h4 className="text-sm font-semibold mb-3">
                                                    {language === 'ar' ? 'محتويات السلة' : 'Cart Contents'} ({cart.cart_items?.length || 0})
                                                </h4>
                                                <div className="space-y-3">
                                                    {cart.cart_items?.map((item, i) => (
                                                        <div key={i} className="flex gap-3 items-center">
                                                            <div className="w-10 h-10 rounded bg-background border flex-shrink-0 overflow-hidden">
                                                                {item.productImage ? (
                                                                    <img src={item.productImage} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <ShoppingBag className="w-5 h-5 m-auto text-muted-foreground opacity-50 mt-2" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate">{getProductName(item.productName)}</p>
                                                                {item.variants?.length > 0 && (
                                                                    <p className="text-xs text-muted-foreground truncate">
                                                                        {item.variants.map(v => v.optionLabel?.[language] || v.optionLabel?.ar || '').join(' - ')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="text-end text-sm whitespace-nowrap">
                                                                <span className="text-muted-foreground mr-2">{item.quantity}x</span>
                                                                <span className="font-semibold">{formatPrice(item.unitPrice)}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 md:mt-0 flex flex-col gap-3 min-w-[200px]">
                                            {statusFilter === 'pending' && (
                                                <>
                                                    <Button
                                                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 font-bold"
                                                        onClick={() => window.open(getWhatsAppLink(cart), '_blank')}
                                                    >
                                                        <MessageCircle className="w-5 h-5" />
                                                        {language === 'ar' ? 'تواصل عبر واتساب' : 'Contact WhatsApp'}
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

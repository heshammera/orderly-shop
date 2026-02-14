import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';

interface StoreContext {
    store: {
        id: string;
        currency: string;
    };
}

export default function TrackOrder() {
    const { store } = useOutletContext<StoreContext>();
    const { language } = useLanguage();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [orderNumber, setOrderNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderNumber || !phoneNumber) return;

        setLoading(true);

        try {
            // 1. Verify existence of order with matching phone within this store
            // We search by order_number and verify phone in customer_snapshot or shipping_address
            // Since phone structure in JSONB can vary, we might need a precise query or just fetch by order_number and filter in JS if RLS allows.
            // RLS might block access to orders table for anon users unless we have a specific policy or use a function.
            // Assuming naive RLS where anon can select matching criteria OR we rely on a server function. 
            // For MVP without backend functions: valid if we find a match.

            const { data: order, error } = await supabase
                .from('orders')
                .select('order_number, customer_snapshot')
                .eq('store_id', store.id)
                .eq('order_number', orderNumber)
                .single();

            if (error || !order) {
                throw new Error(language === 'ar' ? 'الطلب غير موجود' : 'Order not found');
            }

            const snapshot = typeof order.customer_snapshot === 'string'
                ? JSON.parse(order.customer_snapshot)
                : order.customer_snapshot;

            // Verify phone number (simple check)
            // Normalize: remove spaces, dashes
            const verifyPhone = (p1: string, p2: string) => {
                const n1 = p1.replace(/\D/g, '').slice(-9); // Compare last 9 digits to be safe
                const n2 = p2.replace(/\D/g, '').slice(-9);
                return n1 === n2;
            };

            if (!verifyPhone(snapshot.phone || '', phoneNumber) && !verifyPhone(snapshot.alt_phone || '', phoneNumber)) {
                throw new Error(language === 'ar' ? 'رقم الهاتف غير مطابق لهذا الطلب' : 'Phone number does not match this order');
            }

            // If success, navigate to details with phone as auth token mechanism (query param)
            // In a real app we'd set a secure cookie or token.
            navigate(`../orders/${orderNumber}?phone=${encodeURIComponent(phoneNumber)}`);

        } catch (error: any) {
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">
                        {language === 'ar' ? 'تتبع طلبك' : 'Track Your Order'}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {language === 'ar'
                            ? 'أدخل رقم الطلب ورقم الهاتف لعرض حالة طلبك'
                            : 'Enter your order number and phone number to view status'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleTrack} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="orderNumber">{language === 'ar' ? 'رقم الطلب' : 'Order Number'}</Label>
                            <Input
                                id="orderNumber"
                                placeholder="ORD-XXXXXX"
                                value={orderNumber}
                                onChange={(e) => setOrderNumber(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="05xxxxxxxx"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 me-2" />}
                            {language === 'ar' ? 'بحث عن الطلب' : 'Track Order'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

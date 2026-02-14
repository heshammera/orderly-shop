import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useStoreBilling } from '@/hooks/useStoreBilling';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, Search, User, Phone, MapPin, ShoppingBag, DollarSign, Lock } from 'lucide-react';

interface Customer {
    id: string;
    name: string;
    phone: string;
    address: any;
    total_orders: number;
    total_spent: number;
    created_at: string;
}

export default function StoreCustomers() {
    const { storeId } = useParams<{ storeId: string }>();
    const { language } = useLanguage();
    const { isLocked, isLoading: billingLoading } = useStoreBilling(storeId);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: store, isLoading: storeLoading } = useQuery({
        queryKey: ['store', storeId],
        queryFn: async () => {
            if (!storeId) throw new Error("Store ID is required");
            const { data, error } = await supabase
                .from('stores')
                .select('id, name, slug, currency')
                .eq('id', storeId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!storeId,
    });

    const { data: customers = [], isLoading: customersLoading } = useQuery({
        queryKey: ['customers', storeId],
        queryFn: async () => {
            if (!storeId) return [];
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('store_id', storeId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Customer[];
        },
        enabled: !!storeId,
    });

    const maskedCustomers = customers.map(customer => {
        if (!isLocked) return customer;
        return {
            ...customer,
            name: '******',
            phone: '******',
            address: { city: '******' } // Simple mask for now
        };
    });

    const filteredCustomers = maskedCustomers.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
    );

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
            style: 'currency',
            currency: store?.currency || 'SAR',
        }).format(price);
    };

    const storeName = store?.name
        ? (typeof store.name === 'string' ? JSON.parse(store.name) : store.name)[language] || (typeof store.name === 'string' ? JSON.parse(store.name) : store.name).ar
        : '';

    if (storeLoading || billingLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <DashboardLayout storeId={storeId!} storeName={storeName}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{language === 'ar' ? 'العملاء' : 'Customers'}</h2>
                        <p className="text-muted-foreground">
                            {language === 'ar' ? 'إدارة عملاء متجرك وسجل طلباتهم' : 'Manage your store customers and their order history'}
                        </p>
                    </div>
                </div>

                {isLocked && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200">
                        <Lock className="h-4 w-4" />
                        <AlertTitle>{language === 'ar' ? 'تم تقييد الوصول للبيانات!' : 'Data Access Restricted!'}</AlertTitle>
                        <AlertDescription className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
                            <p>
                                {language === 'ar'
                                    ? 'لقد نفذ رصيد محفظتك. تم حجب بيانات العملاء. يرجى شحن الرصيد لاستعادة الصلاحيات كاملة.'
                                    : 'Your wallet balance is empty. Customer data is masked. Please recharge to restore full access.'}
                            </p>
                            <Button variant="destructive" size="sm" asChild>
                                <Link to={`/store/${storeId}/wallet`}>
                                    {language === 'ar' ? 'شحن الرصيد الآن' : 'Recharge Now'}
                                </Link>
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                            <CardTitle className="whitespace-nowrap">{language === 'ar' ? 'قائمة العملاء' : 'Customers List'}</CardTitle>
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground rtl:right-2 rtl:left-auto" />
                                <Input
                                    placeholder={language === 'ar' ? 'بحث بالاسم أو الهاتف...' : 'Search by name or phone...'}
                                    className="pl-8 rtl:pr-8 rtl:pl-3"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {customersLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : filteredCustomers.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                {language === 'ar' ? 'لا يوجد عملاء حتى الآن' : 'No customers found yet'}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{language === 'ar' ? 'العميل' : 'Customer'}</TableHead>
                                        <TableHead>{language === 'ar' ? 'العنوان' : 'Address'}</TableHead>
                                        <TableHead>{language === 'ar' ? 'عدد الطلبات' : 'Orders'}</TableHead>
                                        <TableHead>{language === 'ar' ? 'إجمالي الإنفاق' : 'Total Spent'}</TableHead>
                                        <TableHead>{language === 'ar' ? 'تاريخ التسجيل' : 'Joined Date'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCustomers.map((customer) => {
                                        const address = typeof customer.address === 'string'
                                            ? JSON.parse(customer.address)
                                            : customer.address || {};
                                        const city = address.city || '-';

                                        return (
                                            <TableRow key={customer.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium flex items-center gap-2">
                                                            <User className="w-4 h-4 text-muted-foreground" />
                                                            {customer.name}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                                            <Phone className="w-3 h-3" />
                                                            <span dir="ltr">{customer.phone}</span>
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                                        {city}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                                                        {customer.total_orders || 0}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 font-medium text-green-600">
                                                        <DollarSign className="w-4 h-4" />
                                                        {formatPrice(customer.total_spent || 0)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(customer.created_at).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

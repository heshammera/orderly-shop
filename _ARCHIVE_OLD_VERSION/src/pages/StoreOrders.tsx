import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStoreBilling } from '@/hooks/useStoreBilling';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { OrderDialog } from '@/components/orders/OrderDialog';
import { ExportOrdersDialog } from '@/components/orders/ExportOrdersDialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Search, Lock, AlertTriangle } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'>;

export default function StoreOrders() {
  const { storeId } = useParams<{ storeId: string }>();
  const { language } = useLanguage();
  const { isLocked, isLoading: billingLoading } = useStoreBilling(storeId);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: store } = useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, slug, currency, logo_url')
        .eq('id', storeId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['orders', storeId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId!)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!storeId,
  });

  // Masking Logic
  const maskedOrders = orders.map(order => {
    if (!isLocked) return order;

    // Mask Customer Info
    const originalCustomer = order.customer_snapshot as any;
    const maskedCustomer = originalCustomer ? {
      ...originalCustomer,
      name: '******',
      phone: '******',
      email: '******'
    } : null;

    // Mask Address
    const maskedAddress = order.shipping_address ? {
      street: '******',
      city: '******',
      state: '******',
      country: '******',
      postal_code: '******'
    } : null;

    return {
      ...order,
      customer_snapshot: maskedCustomer,
      shipping_address: maskedAddress
    };
  });

  const filteredOrders = maskedOrders.filter(order => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const customerName = (order.customer_snapshot as any)?.name?.toLowerCase() || '';
    return (
      order.order_number.toLowerCase().includes(searchLower) ||
      customerName.includes(searchLower)
    );
  });

  const storeName = store?.name
    ? (store.name as { ar: string; en: string })[language] || (store.name as { ar: string; en: string }).ar
    : '';

  const statusOptions = [
    { value: 'all', label: language === 'ar' ? 'الكل' : 'All' },
    { value: 'pending', label: language === 'ar' ? 'قيد الانتظار' : 'Pending' },
    { value: 'confirmed', label: language === 'ar' ? 'مؤكد' : 'Confirmed' },
    { value: 'processing', label: language === 'ar' ? 'قيد المعالجة' : 'Processing' },
    { value: 'shipped', label: language === 'ar' ? 'تم الشحن' : 'Shipped' },
    { value: 'delivered', label: language === 'ar' ? 'تم التوصيل' : 'Delivered' },
    { value: 'cancelled', label: language === 'ar' ? 'ملغي' : 'Cancelled' },
  ];

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };



  return (
    <DashboardLayout storeId={storeId!} storeName={storeName}>
      <div className="space-y-6">

        {/* Locked Alert */}
        {isLocked && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <Lock className="h-4 w-4" />
            <AlertTitle>{language === 'ar' ? 'تم تقييد الوصول للبيانات!' : 'Data Access Restricted!'}</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
              <p>
                {language === 'ar'
                  ? 'لقد نفذ رصيد محفظتك. تم حجب بيانات العملاء (الأسماء، الهواتف، العناوين). يرجى شحن الرصيد لاستعادة الصلاحيات كاملة.'
                  : 'Your wallet balance is empty. Customer data (names, phones, addresses) is masked. Please recharge to restore full access.'}
              </p>
              <Button variant="destructive" size="sm" asChild>
                <Link to={`/store/${storeId}/wallet`}>
                  {language === 'ar' ? 'شحن الرصيد الآن' : 'Recharge Now'}
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {language === 'ar' ? 'الطلبات' : 'Orders'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {language === 'ar'
                  ? `${filteredOrders.length} طلب`
                  : `${filteredOrders.length} orders`}
              </p>
            </div>
          </div>

          <ExportOrdersDialog storeId={storeId!} isLocked={isLocked} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={language === 'ar' ? 'بحث برقم الطلب أو اسم العميل...' : 'Search by order number or customer...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <OrdersTable
          orders={filteredOrders}
          currency={store?.currency || 'SAR'}
          isLoading={isLoading}
          onViewOrder={handleViewOrder}
        />

        {/* Order Dialog */}
        <OrderDialog
          order={selectedOrder}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          currency={store?.currency || 'SAR'}
          onStatusChange={refetch}
        />
      </div>
    </DashboardLayout>
  );
}
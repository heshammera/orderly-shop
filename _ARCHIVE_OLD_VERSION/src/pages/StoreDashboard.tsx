import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useStoreBilling } from '@/hooks/useStoreBilling';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardStatsGrid } from '@/components/dashboard/DashboardStatsGrid';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { GettingStarted } from '@/components/dashboard/GettingStarted';
import { Loader2, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface StoreData {
  id: string;
  name: { ar: string; en: string };
  slug: string;
  currency: string;
  logo_url: string | null;
}

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  currency: string;
  customer_snapshot: { name?: string; phone?: string };
  created_at: string;
}

export default function StoreDashboard() {
  const { storeId } = useParams<{ storeId: string }>();
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isLocked, isLoading: billingLoading } = useStoreBilling(storeId);

  // Analytics State
  const [revenueData, setRevenueData] = useState<Array<{ name: string; total: number }>>([]);
  const [topProducts, setTopProducts] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [averageOrderValue, setAverageOrderValue] = useState(0);

  const [store, setStore] = useState<StoreData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCategories, setHasCategories] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user && storeId) {
      fetchStoreData();
    }
  }, [user, authLoading, storeId, navigate]);

  const fetchStoreData = async () => {
    if (!storeId) return;

    try {
      // Fetch store details
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id, name, slug, currency, logo_url')
        .eq('id', storeId)
        .single();

      if (storeError) throw storeError;
      setStore(storeData as StoreData);

      // Fetch stats in parallel
      const [productsRes, ordersRes, customersRes, categoriesRes, recentOrdersRes, analyticsOrdersRes, topSellingRes] =
        await Promise.all([
          supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('store_id', storeId),
          supabase
            .from('orders')
            .select('id, total', { count: 'exact' })
            .eq('store_id', storeId),
          supabase
            .from('customers')
            .select('id', { count: 'exact', head: true })
            .eq('store_id', storeId),
          supabase
            .from('categories')
            .select('id', { count: 'exact', head: true })
            .eq('store_id', storeId),
          supabase
            .from('orders')
            .select('id, order_number, status, total, currency, customer_snapshot, created_at')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false })
            .limit(5),
          // Fetch orders for chart (Last 30 days)
          supabase.from('orders')
            .select('created_at, total')
            .eq('store_id', storeId)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: true }),
          // Fetch order items for Top Products
          supabase.from('order_items')
            .select('quantity, products(name), orders!inner(store_id)')
            .eq('orders.store_id', storeId)
        ]);

      // Calculate total revenue
      const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

      // Calculate Average Order Value
      const avgOrderValue = ordersRes.count ? totalRevenue / ordersRes.count : 0;
      setAverageOrderValue(avgOrderValue);

      setStats({
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalRevenue,
        totalCustomers: customersRes.count || 0,
      });

      setHasCategories((categoriesRes.count || 0) > 0);
      setRecentOrders((recentOrdersRes.data as Order[]) || []);



      // Process Revenue Chart Data
      const revenueMap = new Map<string, number>();
      analyticsOrdersRes.data?.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' });
        revenueMap.set(date, (revenueMap.get(date) || 0) + (order.total || 0));
      });
      const revenueChartData = Array.from(revenueMap.entries()).map(([name, total]) => ({ name, total }));
      setRevenueData(revenueChartData);

      // Process Top Products Data
      const productMap = new Map<string, number>();
      topSellingRes.data?.forEach((item: any) => {
        // Check if product exists (it might be null if product was deleted)
        let productName = 'Unknown';

        if (item.products?.name) {
          const nameData = item.products.name;
          if (typeof nameData === 'string') {
            try {
              const parsed = JSON.parse(nameData);
              productName = parsed[language] || parsed.en || parsed.ar || nameData;
            } catch {
              productName = nameData;
            }
          } else {
            // It's already an object (JSONB from Supabase)
            productName = nameData[language] || nameData.en || nameData.ar || 'Unknown';
          }
        }

        productMap.set(productName, (productMap.get(productName) || 0) + item.quantity);
      });

      const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899"];
      const topProductsData = Array.from(productMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value], index) => ({
          name,
          value,
          color: colors[index % colors.length]
        }));
      setTopProducts(topProductsData);

    } catch (error) {
      console.error('Error fetching store data:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const maskedRecentOrders = recentOrders.map(order => {
    if (!isLocked) return order;

    const originalCustomer = order.customer_snapshot as any;
    const maskedCustomer = originalCustomer ? {
      ...originalCustomer,
      name: '******',
      phone: '******'
    } : null;

    return {
      ...order,
      customer_snapshot: maskedCustomer
    };
  });

  if (authLoading || loading || billingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store) {
    return null;
  }

  const storeName = language === 'ar' ? store.name.ar || store.name.en : store.name.en || store.name.ar;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: store.currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout storeId={store.id} storeName={storeName}>
      <div className="space-y-6">

        {/* Locked Alert */}
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

        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar'
              ? 'نظرة عامة على أداء متجرك'
              : 'Overview of your store performance'}
          </p>
        </div>

        {/* Premium Analytics Section */}
        <div className="space-y-6">
          <DashboardStatsGrid
            stats={{
              revenue: stats.totalRevenue,
              orders: stats.totalOrders,
              visits: averageOrderValue, // Using AOV instead of Visits
              conversionRate: 0 // Still 0 as we don't have visits
            }}
            language={language as 'ar' | 'en'}
            currency={store.currency}
          />

          <AnalyticsCharts revenueData={revenueData} topProductsData={topProducts} currency={store.currency} />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Orders - Takes 2 columns */}
          <div className="lg:col-span-2">
            <RecentOrders orders={maskedRecentOrders} storeId={store.id} />
          </div>

          {/* Getting Started Checklist */}
          <div>
            <GettingStarted
              storeId={store.id}
              hasProducts={stats.totalProducts > 0}
              hasCategories={hasCategories}
              storeConfigured={!!store.logo_url}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

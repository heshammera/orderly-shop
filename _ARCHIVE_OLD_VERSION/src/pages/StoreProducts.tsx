import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProductsTable } from '@/components/products/ProductsTable';
import { ProductDialog } from '@/components/products/ProductDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Product, parseProduct } from '@/types/product';

interface StoreData {
  id: string;
  name: { ar: string; en: string };
  slug: string;
  currency: string;
}

export default function StoreProducts() {
  const { storeId } = useParams<{ storeId: string }>();
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user && storeId) {
      fetchData();
    }
  }, [user, authLoading, storeId, navigate]);

  const fetchData = async () => {
    if (!storeId) return;

    try {
      const [storeRes, productsRes] = await Promise.all([
        supabase
          .from('stores')
          .select('id, name, slug, currency')
          .eq('id', storeId)
          .single(),
        supabase
          .from('products')
          .select('*')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false }),
      ]);

      if (storeRes.error) throw storeRes.error;
      setStore(storeRes.data as StoreData);
      setProducts((productsRes.data || []).map(parseProduct));
    } catch (error) {
      console.error('Error fetching data:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter((p) => p.id !== productId));
      toast({
        title: language === 'ar' ? 'تم حذف المنتج' : 'Product deleted',
        description: language === 'ar' ? 'تم حذف المنتج بنجاح' : 'Product has been deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل حذف المنتج' : 'Failed to delete product',
        variant: 'destructive',
      });
    }
  };

  const handleProductSaved = (product: Product, isNew: boolean) => {
    if (isNew) {
      setProducts([product, ...products]);
    } else {
      setProducts(products.map((p) => (p.id === product.id ? product : p)));
    }
    setDialogOpen(false);
  };

  const filteredProducts = products.filter((product) => {
    const name = language === 'ar' ? product.name.ar : product.name.en;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (authLoading || loading) {
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

  return (
    <DashboardLayout storeId={store.id} storeName={storeName}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'ar' ? 'المنتجات' : 'Products'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar'
                ? `${products.length} منتج في متجرك`
                : `${products.length} products in your store`}
            </p>
          </div>
          <Button onClick={handleAddProduct} className="gap-2">
            <Plus className="w-4 h-4" />
            {language === 'ar' ? 'إضافة منتج' : 'Add Product'}
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={language === 'ar' ? 'بحث في المنتجات...' : 'Search products...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>

        {/* Products Table */}
        <ProductsTable
          products={filteredProducts}
          currency={store.currency}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />

        {/* Product Dialog */}
        <ProductDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          product={editingProduct}
          storeId={store.id}
          currency={store.currency}
          onSave={handleProductSaved}
        />
      </div>
    </DashboardLayout>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Store, Plus, Package, ShoppingCart, Settings, LogOut } from 'lucide-react';

interface StoreData {
  id: string;
  name: { ar: string; en: string };
  slug: string;
  status: string;
  role: string; // Added role
}

export default function Dashboard() {
  const { t, language, dir } = useLanguage();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchStores();
    }
  }, [user, authLoading, navigate]);

  const fetchStores = async () => {
    try {
      // Fetch from store_members to get the role and store details
      const { data, error } = await supabase
        .from('store_members')
        .select(`
          role,
          store:stores (
            id,
            name,
            slug,
            status,
            created_at
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data
      const formattedStores = data.map((item: any) => ({
        id: item.store.id,
        name: typeof item.store.name === 'string' ? JSON.parse(item.store.name) : item.store.name,
        slug: item.store.slug,
        status: item.store.status,
        role: item.role,
      }));

      setStores(formattedStores || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={dir}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStoreName = (store: StoreData) => {
    const name = store.name as { ar: string; en: string };
    return language === 'ar' ? name.ar || name.en : name.en || name.ar;
  };

  // Check if user has permission to create new stores
  // Logic: Allow if user has NO stores (new user) OR if user is Owner/Admin in at least one store
  // Disallow if user is ONLY editor/support in all their stores
  const canCreateStore = stores.length === 0 || stores.some(store => ['owner', 'admin'].includes(store.role));

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Store className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">
              {language === 'ar' ? 'متجري' : 'Matjari'}
            </span>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />
            {t.nav.logout}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t.nav.dashboard}</h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'مرحباً بك في لوحة التحكم' : 'Welcome to your dashboard'}
          </p>
        </div>

        {stores.length === 0 ? (
          /* No Stores - Show Create Store CTA (Always visible for new users) */
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>
                {language === 'ar' ? 'لا يوجد لديك متاجر بعد' : 'No stores yet'}
              </CardTitle>
              <CardDescription>
                {language === 'ar'
                  ? 'أنشئ متجرك الأول وابدأ البيع اليوم'
                  : 'Create your first store and start selling today'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/create-store">
                <Button className="w-full">
                  <Plus className="w-4 h-4" />
                  {t.storeWizard.create}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          /* Stores List */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <Link key={store.id} to={`/store/${store.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Store className="w-5 h-5 text-primary" />
                      </div>
                      {getStoreName(store)}
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {store.slug}.matjari.com
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/50">
                        <Package className="w-4 h-4 mb-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {language === 'ar' ? 'المنتجات' : 'Products'}
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/50">
                        <ShoppingCart className="w-4 h-4 mb-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {language === 'ar' ? 'الطلبات' : 'Orders'}
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/50">
                        <Settings className="w-4 h-4 mb-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {language === 'ar' ? 'الإعدادات' : 'Settings'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}

            {/* Add New Store Card - Only for Owners/Admins or New Users */}
            {canCreateStore && (
              <Link to="/create-store">
                <Card className="h-full border-dashed hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-center min-h-[200px]">
                  <CardContent className="text-center py-8">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <Plus className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-muted-foreground">
                      {language === 'ar' ? 'إضافة متجر جديد' : 'Add new store'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

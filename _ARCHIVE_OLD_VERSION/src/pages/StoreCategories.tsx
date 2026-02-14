 import { useEffect, useState } from 'react';
 import { useParams, useNavigate } from 'react-router-dom';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useAuth } from '@/hooks/useAuth';
 import { supabase } from '@/integrations/supabase/client';
 import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
 import { CategoriesTree } from '@/components/categories/CategoriesTree';
 import { CategoryDialog } from '@/components/categories/CategoryDialog';
 import { Button } from '@/components/ui/button';
 import { Loader2, Plus, FolderTree } from 'lucide-react';
 import { useToast } from '@/hooks/use-toast';
 
 export interface Category {
   id: string;
   store_id: string;
   name: { ar: string; en: string };
   description: { ar: string; en: string } | null;
   parent_id: string | null;
   image_url: string | null;
   status: string;
   sort_order: number;
   created_at: string;
   updated_at: string;
   children?: Category[];
 }
 
 interface StoreData {
   id: string;
   name: { ar: string; en: string };
 }
 
 export default function StoreCategories() {
   const { storeId } = useParams<{ storeId: string }>();
   const { language } = useLanguage();
   const { user, loading: authLoading } = useAuth();
   const navigate = useNavigate();
   const { toast } = useToast();
 
   const [store, setStore] = useState<StoreData | null>(null);
   const [categories, setCategories] = useState<Category[]>([]);
   const [loading, setLoading] = useState(true);
   const [dialogOpen, setDialogOpen] = useState(false);
   const [editingCategory, setEditingCategory] = useState<Category | null>(null);
   const [parentCategory, setParentCategory] = useState<Category | null>(null);
 
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
       const [storeRes, categoriesRes] = await Promise.all([
         supabase.from('stores').select('id, name').eq('id', storeId).single(),
         supabase
           .from('categories')
           .select('*')
           .eq('store_id', storeId)
           .order('sort_order', { ascending: true }),
       ]);
 
       if (storeRes.error) throw storeRes.error;
       setStore(storeRes.data as StoreData);
 
       const rawCategories = (categoriesRes.data || []).map((cat: any) => ({
         ...cat,
         name: typeof cat.name === 'string' ? JSON.parse(cat.name) : cat.name,
         description: cat.description
           ? typeof cat.description === 'string'
             ? JSON.parse(cat.description)
             : cat.description
           : null,
       })) as Category[];
 
       setCategories(rawCategories);
     } catch (error) {
       console.error('Error fetching data:', error);
       navigate('/dashboard');
     } finally {
       setLoading(false);
     }
   };
 
   const handleAddCategory = (parent?: Category) => {
     setEditingCategory(null);
     setParentCategory(parent || null);
     setDialogOpen(true);
   };
 
   const handleEditCategory = (category: Category) => {
     setEditingCategory(category);
     setParentCategory(null);
     setDialogOpen(true);
   };
 
   const handleDeleteCategory = async (category: Category) => {
     const hasChildren = categories.some((c) => c.parent_id === category.id);
     if (hasChildren) {
       toast({
         title: language === 'ar' ? 'خطأ' : 'Error',
         description:
           language === 'ar'
             ? 'لا يمكن حذف تصنيف يحتوي على تصنيفات فرعية'
             : 'Cannot delete a category with subcategories',
         variant: 'destructive',
       });
       return;
     }
 
     try {
       const { error } = await supabase.from('categories').delete().eq('id', category.id);
       if (error) throw error;
 
       toast({
         title: language === 'ar' ? 'تم الحذف' : 'Deleted',
         description: language === 'ar' ? 'تم حذف التصنيف بنجاح' : 'Category deleted successfully',
       });
       fetchData();
     } catch (error: any) {
       toast({
         title: language === 'ar' ? 'خطأ' : 'Error',
         description: error.message,
         variant: 'destructive',
       });
     }
   };
 
   const handleSaveCategory = async (data: Partial<Category>) => {
     try {
       if (editingCategory) {
         const { error } = await supabase
           .from('categories')
           .update({
             name: data.name,
             description: data.description,
             parent_id: data.parent_id,
             status: data.status,
             image_url: data.image_url,
           })
           .eq('id', editingCategory.id);
 
         if (error) throw error;
 
         toast({
           title: language === 'ar' ? 'تم التحديث' : 'Updated',
           description: language === 'ar' ? 'تم تحديث التصنيف بنجاح' : 'Category updated successfully',
         });
       } else {
         const maxOrder = Math.max(0, ...categories.map((c) => c.sort_order));
         const { error } = await supabase.from('categories').insert({
           store_id: storeId,
           name: data.name,
           description: data.description,
           parent_id: parentCategory?.id || data.parent_id || null,
           status: data.status || 'active',
           image_url: data.image_url,
           sort_order: maxOrder + 1,
         });
 
         if (error) throw error;
 
         toast({
           title: language === 'ar' ? 'تم الإنشاء' : 'Created',
           description: language === 'ar' ? 'تم إنشاء التصنيف بنجاح' : 'Category created successfully',
         });
       }
 
       setDialogOpen(false);
       fetchData();
     } catch (error: any) {
       toast({
         title: language === 'ar' ? 'خطأ' : 'Error',
         description: error.message,
         variant: 'destructive',
       });
     }
   };
 
   if (authLoading || loading) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
       </div>
     );
   }
 
   if (!store) return null;
 
   const storeName =
     language === 'ar' ? store.name.ar || store.name.en : store.name.en || store.name.ar;
 
   return (
     <DashboardLayout storeId={store.id} storeName={storeName}>
       <div className="space-y-6">
         {/* Header */}
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
           <div>
             <h1 className="text-2xl font-bold">
               {language === 'ar' ? 'التصنيفات' : 'Categories'}
             </h1>
             <p className="text-muted-foreground">
               {language === 'ar'
                 ? 'إدارة تصنيفات المنتجات بهيكل شجري'
                 : 'Manage product categories with tree structure'}
             </p>
           </div>
           <Button onClick={() => handleAddCategory()}>
             <Plus className="w-4 h-4 me-2" />
             {language === 'ar' ? 'إضافة تصنيف' : 'Add Category'}
           </Button>
         </div>
 
         {/* Categories Tree */}
         {categories.length === 0 ? (
           <div className="text-center py-16 bg-card rounded-lg border">
             <FolderTree className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
             <h3 className="text-lg font-medium mb-2">
               {language === 'ar' ? 'لا توجد تصنيفات' : 'No categories yet'}
             </h3>
             <p className="text-muted-foreground mb-4">
               {language === 'ar'
                 ? 'ابدأ بإضافة التصنيف الأول لتنظيم منتجاتك'
                 : 'Start by adding your first category to organize products'}
             </p>
             <Button onClick={() => handleAddCategory()}>
               <Plus className="w-4 h-4 me-2" />
               {language === 'ar' ? 'إضافة تصنيف' : 'Add Category'}
             </Button>
           </div>
         ) : (
           <CategoriesTree
             categories={categories}
             onEdit={handleEditCategory}
             onDelete={handleDeleteCategory}
             onAddChild={handleAddCategory}
           />
         )}
       </div>
 
       <CategoryDialog
         open={dialogOpen}
         onOpenChange={setDialogOpen}
         category={editingCategory}
         parentCategory={parentCategory}
         allCategories={categories}
         onSave={handleSaveCategory}
         storeId={storeId!}
       />
     </DashboardLayout>
   );
 }
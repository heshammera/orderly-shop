 import { useEffect, useState } from 'react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { Category } from '@/pages/StoreCategories';
 import { supabase } from '@/integrations/supabase/client';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { Loader2, Upload, X } from 'lucide-react';
 
 interface CategoryDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   category: Category | null;
   parentCategory: Category | null;
   allCategories: Category[];
   onSave: (data: Partial<Category>) => Promise<void>;
   storeId: string;
 }
 
 export function CategoryDialog({
   open,
   onOpenChange,
   category,
   parentCategory,
   allCategories,
   onSave,
   storeId,
 }: CategoryDialogProps) {
   const { language } = useLanguage();
   const isEditing = !!category;
 
   const [nameAr, setNameAr] = useState('');
   const [nameEn, setNameEn] = useState('');
   const [descAr, setDescAr] = useState('');
   const [descEn, setDescEn] = useState('');
   const [parentId, setParentId] = useState<string | null>(null);
   const [status, setStatus] = useState('active');
   const [imageUrl, setImageUrl] = useState<string | null>(null);
   const [uploading, setUploading] = useState(false);
   const [saving, setSaving] = useState(false);
 
   useEffect(() => {
     if (open) {
       if (category) {
         setNameAr(category.name.ar || '');
         setNameEn(category.name.en || '');
         setDescAr(category.description?.ar || '');
         setDescEn(category.description?.en || '');
         setParentId(category.parent_id);
         setStatus(category.status);
         setImageUrl(category.image_url);
       } else {
         setNameAr('');
         setNameEn('');
         setDescAr('');
         setDescEn('');
         setParentId(parentCategory?.id || null);
         setStatus('active');
         setImageUrl(null);
       }
     }
   }, [open, category, parentCategory]);
 
   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
 
     setUploading(true);
     try {
       const fileExt = file.name.split('.').pop();
       const fileName = `${storeId}/categories/${Date.now()}.${fileExt}`;
 
       const { error: uploadError } = await supabase.storage
         .from('product-images')
         .upload(fileName, file);
 
       if (uploadError) throw uploadError;
 
       const { data: urlData } = supabase.storage
         .from('product-images')
         .getPublicUrl(fileName);
 
       setImageUrl(urlData.publicUrl);
     } catch (error) {
       console.error('Upload error:', error);
     } finally {
       setUploading(false);
     }
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setSaving(true);
 
     try {
       await onSave({
         name: { ar: nameAr, en: nameEn },
         description: descAr || descEn ? { ar: descAr, en: descEn } : null,
         parent_id: parentId,
         status,
         image_url: imageUrl,
       });
     } finally {
       setSaving(false);
     }
   };
 
   // Get available parent categories (exclude self and descendants)
   const getAvailableParents = () => {
     if (!category) return allCategories;
 
     const getDescendantIds = (id: string): string[] => {
       const children = allCategories.filter((c) => c.parent_id === id);
       return [id, ...children.flatMap((c) => getDescendantIds(c.id))];
     };
 
     const excludeIds = getDescendantIds(category.id);
     return allCategories.filter((c) => !excludeIds.includes(c.id));
   };
 
   const availableParents = getAvailableParents();
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-lg">
         <DialogHeader>
           <DialogTitle>
             {isEditing
               ? language === 'ar'
                 ? 'تعديل التصنيف'
                 : 'Edit Category'
               : parentCategory
               ? language === 'ar'
                 ? 'إضافة تصنيف فرعي'
                 : 'Add Subcategory'
               : language === 'ar'
               ? 'إضافة تصنيف'
               : 'Add Category'}
           </DialogTitle>
         </DialogHeader>
 
         <form onSubmit={handleSubmit} className="space-y-4">
           {/* Image Upload */}
           <div>
             <Label>{language === 'ar' ? 'صورة التصنيف' : 'Category Image'}</Label>
             <div className="mt-2">
               {imageUrl ? (
                 <div className="relative w-24 h-24">
                   <img
                     src={imageUrl}
                     alt="Category"
                     className="w-full h-full object-cover rounded-lg"
                   />
                   <Button
                     type="button"
                     variant="destructive"
                     size="icon"
                     className="absolute -top-2 -end-2 h-6 w-6"
                     onClick={() => setImageUrl(null)}
                   >
                     <X className="h-3 w-3" />
                   </Button>
                 </div>
               ) : (
                 <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                   <input
                     type="file"
                     accept="image/*"
                     className="hidden"
                     onChange={handleImageUpload}
                     disabled={uploading}
                   />
                   {uploading ? (
                     <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                   ) : (
                     <Upload className="h-6 w-6 text-muted-foreground" />
                   )}
                 </label>
               )}
             </div>
           </div>
 
           {/* Name AR */}
           <div>
             <Label>{language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
             <Input
               value={nameAr}
               onChange={(e) => setNameAr(e.target.value)}
               dir="rtl"
               className="mt-1"
             />
           </div>
 
           {/* Name EN */}
           <div>
             <Label>{language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}</Label>
             <Input
               value={nameEn}
               onChange={(e) => setNameEn(e.target.value)}
               dir="ltr"
               className="mt-1"
             />
           </div>
 
           {/* Description AR */}
           <div>
             <Label>{language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
             <Textarea
               value={descAr}
               onChange={(e) => setDescAr(e.target.value)}
               dir="rtl"
               className="mt-1"
               rows={2}
             />
           </div>
 
           {/* Description EN */}
           <div>
             <Label>{language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
             <Textarea
               value={descEn}
               onChange={(e) => setDescEn(e.target.value)}
               dir="ltr"
               className="mt-1"
               rows={2}
             />
           </div>
 
           {/* Parent Category */}
           <div>
             <Label>{language === 'ar' ? 'التصنيف الأب' : 'Parent Category'}</Label>
             <Select
               value={parentId || 'none'}
               onValueChange={(v) => setParentId(v === 'none' ? null : v)}
             >
               <SelectTrigger className="mt-1">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="none">
                   {language === 'ar' ? 'بدون (تصنيف رئيسي)' : 'None (Root Category)'}
                 </SelectItem>
                 {availableParents.map((cat) => (
                   <SelectItem key={cat.id} value={cat.id}>
                     {language === 'ar' ? cat.name.ar || cat.name.en : cat.name.en || cat.name.ar}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           {/* Status */}
           <div>
             <Label>{language === 'ar' ? 'الحالة' : 'Status'}</Label>
             <Select value={status} onValueChange={setStatus}>
               <SelectTrigger className="mt-1">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="active">
                   {language === 'ar' ? 'نشط' : 'Active'}
                 </SelectItem>
                 <SelectItem value="hidden">
                   {language === 'ar' ? 'مخفي' : 'Hidden'}
                 </SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           {/* Actions */}
           <div className="flex justify-end gap-2 pt-4">
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
               {language === 'ar' ? 'إلغاء' : 'Cancel'}
             </Button>
             <Button type="submit" disabled={saving || (!nameAr && !nameEn)}>
               {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
               {isEditing
                 ? language === 'ar'
                   ? 'تحديث'
                   : 'Update'
                 : language === 'ar'
                 ? 'إنشاء'
                 : 'Create'}
             </Button>
           </div>
         </form>
       </DialogContent>
     </Dialog>
   );
 }
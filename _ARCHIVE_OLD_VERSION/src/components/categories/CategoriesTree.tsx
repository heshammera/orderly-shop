 import { useState } from 'react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { Category } from '@/pages/StoreCategories';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
 } from '@/components/ui/collapsible';
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from '@/components/ui/alert-dialog';
 import {
   ChevronDown,
   ChevronLeft,
   ChevronRight,
   MoreHorizontal,
   Pencil,
   Trash2,
   Plus,
   Folder,
   FolderOpen,
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface CategoriesTreeProps {
   categories: Category[];
   onEdit: (category: Category) => void;
   onDelete: (category: Category) => void;
   onAddChild: (parent: Category) => void;
 }
 
 export function CategoriesTree({ categories, onEdit, onDelete, onAddChild }: CategoriesTreeProps) {
   const { language, dir } = useLanguage();
   const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
 
   // Build tree structure
   const buildTree = (items: Category[], parentId: string | null = null): Category[] => {
     return items
       .filter((item) => item.parent_id === parentId)
       .map((item) => ({
         ...item,
         children: buildTree(items, item.id),
       }))
       .sort((a, b) => a.sort_order - b.sort_order);
   };
 
   const tree = buildTree(categories);
 
   const handleDelete = () => {
     if (deleteCategory) {
       onDelete(deleteCategory);
       setDeleteCategory(null);
     }
   };
 
   return (
     <div className="bg-card rounded-lg border">
       <div className="divide-y">
         {tree.map((category) => (
           <CategoryNode
             key={category.id}
             category={category}
             level={0}
             onEdit={onEdit}
             onDelete={setDeleteCategory}
             onAddChild={onAddChild}
           />
         ))}
       </div>
 
       <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>
               {language === 'ar' ? 'حذف التصنيف' : 'Delete Category'}
             </AlertDialogTitle>
             <AlertDialogDescription>
               {language === 'ar'
                 ? 'هل أنت متأكد من حذف هذا التصنيف؟ لا يمكن التراجع عن هذا الإجراء.'
                 : 'Are you sure you want to delete this category? This action cannot be undone.'}
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>{language === 'ar' ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
             <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
               {language === 'ar' ? 'حذف' : 'Delete'}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </div>
   );
 }
 
 interface CategoryNodeProps {
   category: Category;
   level: number;
   onEdit: (category: Category) => void;
   onDelete: (category: Category) => void;
   onAddChild: (parent: Category) => void;
 }
 
 function CategoryNode({ category, level, onEdit, onDelete, onAddChild }: CategoryNodeProps) {
   const { language, dir } = useLanguage();
   const [isOpen, setIsOpen] = useState(true);
   const hasChildren = category.children && category.children.length > 0;
 
   const categoryName =
     language === 'ar'
       ? category.name.ar || category.name.en
       : category.name.en || category.name.ar;
 
   const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;
 
   return (
     <Collapsible open={isOpen} onOpenChange={setIsOpen}>
       <div
         className={cn(
           'flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors',
           level > 0 && 'border-s-2 border-muted'
         )}
         style={{ paddingInlineStart: `${level * 24 + 16}px` }}
       >
         {/* Expand/Collapse */}
         {hasChildren ? (
           <CollapsibleTrigger asChild>
             <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
               {isOpen ? (
                 <ChevronDown className="h-4 w-4" />
               ) : (
                 <ChevronIcon className="h-4 w-4" />
               )}
             </Button>
           </CollapsibleTrigger>
         ) : (
           <div className="h-6 w-6 shrink-0" />
         )}
 
         {/* Icon */}
         {hasChildren && isOpen ? (
           <FolderOpen className="h-5 w-5 text-primary shrink-0" />
         ) : (
           <Folder className="h-5 w-5 text-muted-foreground shrink-0" />
         )}
 
         {/* Image */}
         {category.image_url && (
           <img
             src={category.image_url}
             alt={categoryName}
             className="h-8 w-8 rounded object-cover shrink-0"
           />
         )}
 
         {/* Name */}
         <span className="font-medium flex-1 truncate">{categoryName}</span>
 
         {/* Status Badge */}
         <Badge variant={category.status === 'active' ? 'default' : 'secondary'}>
           {category.status === 'active'
             ? language === 'ar'
               ? 'نشط'
               : 'Active'
             : language === 'ar'
             ? 'مخفي'
             : 'Hidden'}
         </Badge>
 
         {/* Children count */}
         {hasChildren && (
           <span className="text-xs text-muted-foreground">
             {category.children!.length} {language === 'ar' ? 'فرعي' : 'sub'}
           </span>
         )}
 
         {/* Actions */}
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button variant="ghost" size="icon" className="h-8 w-8">
               <MoreHorizontal className="h-4 w-4" />
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'}>
             <DropdownMenuItem onClick={() => onAddChild(category)}>
               <Plus className="h-4 w-4 me-2" />
               {language === 'ar' ? 'إضافة فرعي' : 'Add Subcategory'}
             </DropdownMenuItem>
             <DropdownMenuItem onClick={() => onEdit(category)}>
               <Pencil className="h-4 w-4 me-2" />
               {language === 'ar' ? 'تعديل' : 'Edit'}
             </DropdownMenuItem>
             <DropdownMenuItem
               onClick={() => onDelete(category)}
               className="text-destructive focus:text-destructive"
             >
               <Trash2 className="h-4 w-4 me-2" />
               {language === 'ar' ? 'حذف' : 'Delete'}
             </DropdownMenuItem>
           </DropdownMenuContent>
         </DropdownMenu>
       </div>
 
       {hasChildren && (
         <CollapsibleContent>
           {category.children!.map((child) => (
             <CategoryNode
               key={child.id}
               category={child}
               level={level + 1}
               onEdit={onEdit}
               onDelete={onDelete}
               onAddChild={onAddChild}
             />
           ))}
         </CollapsibleContent>
       )}
     </Collapsible>
   );
 }
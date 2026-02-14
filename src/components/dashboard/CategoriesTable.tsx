"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CategoriesTableProps {
    storeId: string;
}

export function CategoriesTable({ storeId }: CategoriesTableProps) {
    const supabase = createClient();
    const { language } = useLanguage();
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [formData, setFormData] = useState({
        name_ar: '',
        name_en: '',
        slug: '',
    });

    useEffect(() => {
        fetchCategories();
    }, [storeId]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('store_id', storeId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const categoryData = {
                store_id: storeId,
                name: JSON.stringify({ ar: formData.name_ar, en: formData.name_en }),
                slug: formData.slug,
            };

            if (editingCategory) {
                const { error } = await supabase
                    .from('categories')
                    .update(categoryData)
                    .eq('id', editingCategory.id);

                if (error) throw error;
                toast.success(language === 'ar' ? 'تم التحديث بنجاح' : 'Category updated');
            } else {
                const { error } = await supabase
                    .from('categories')
                    .insert(categoryData);

                if (error) throw error;
                toast.success(language === 'ar' ? 'تمت الإضافة بنجاح' : 'Category added');
            }

            setDialogOpen(false);
            setFormData({ name_ar: '', name_en: '', slug: '' });
            setEditingCategory(null);
            fetchCategories();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleEdit = (category: any) => {
        const name = typeof category.name === 'string' ? JSON.parse(category.name) : category.name;
        setFormData({
            name_ar: name.ar || '',
            name_en: name.en || '',
            slug: category.slug || '',
        });
        setEditingCategory(category);
        setDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm(language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return;

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success(language === 'ar' ? 'تم الحذف' : 'Deleted');
            fetchCategories();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{language === 'ar' ? 'التصنيفات' : 'Categories'}</CardTitle>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" onClick={() => {
                                setFormData({ name_ar: '', name_en: '', slug: '' });
                                setEditingCategory(null);
                            }}>
                                <Plus className="w-4 h-4 mr-2" />
                                {language === 'ar' ? 'إضافة تصنيف' : 'Add Category'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingCategory
                                        ? (language === 'ar' ? 'تعديل التصنيف' : 'Edit Category')
                                        : (language === 'ar' ? 'إضافة تصنيف جديد' : 'Add New Category')
                                    }
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label>{language === 'ar' ? 'الاسم بالعربية' : 'Name (Arabic)'}</Label>
                                    <Input
                                        value={formData.name_ar}
                                        onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>{language === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'}</Label>
                                    <Input
                                        value={formData.name_en}
                                        onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>{language === 'ar' ? 'الرابط (Slug)' : 'Slug'}</Label>
                                    <Input
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                        placeholder="electronics"
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    {editingCategory
                                        ? (language === 'ar' ? 'تحديث' : 'Update')
                                        : (language === 'ar' ? 'إضافة' : 'Add')
                                    }
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                            <TableHead>{language === 'ar' ? 'الرابط' : 'Slug'}</TableHead>
                            <TableHead className="text-right">{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                    {language === 'ar' ? 'لا توجد تصنيفات' : 'No categories yet'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories.map((category) => {
                                const name = typeof category.name === 'string' ? JSON.parse(category.name) : category.name;
                                return (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">
                                            {language === 'ar' ? name.ar : name.en}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(category.id)}>
                                                <Trash className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

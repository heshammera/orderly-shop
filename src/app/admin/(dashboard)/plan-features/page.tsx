"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface PlanFeature {
    id: string;
    name_ar: string;
    name_en: string;
    description_ar: string | null;
    description_en: string | null;
    type: 'boolean' | 'integer' | 'string';
    group: string;
}

export default function PlanFeaturesPage() {
    const { language, dir } = useLanguage();
    const [features, setFeatures] = useState<PlanFeature[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFeature, setEditingFeature] = useState<PlanFeature | null>(null);
    const [formData, setFormData] = useState<Partial<PlanFeature>>({ type: 'boolean' });
    const [formLoading, setFormLoading] = useState(false);
    const supabase = createClient();

    const fetchFeatures = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('plan_features')
            .select('*')
            .order('group', { ascending: true })
            .order('id', { ascending: true });

        if (error) {
            toast.error(error.message);
        } else {
            setFeatures(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFeatures();
    }, []);

    const openCreate = () => {
        setEditingFeature(null);
        setFormData({ type: 'boolean', group: 'general' });
        setIsDialogOpen(true);
    };

    const openEdit = (feature: PlanFeature) => {
        setEditingFeature(feature);
        setFormData({ ...feature });
        setIsDialogOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            if (!formData.id || !formData.name_ar || !formData.name_en || !formData.type || !formData.group) {
                throw new Error(language === 'ar' ? 'يرجى تعبئة جميع الحقول المطلوبة' : 'Please fill all required fields');
            }

            if (editingFeature) {
                const { error } = await supabase
                    .from('plan_features')
                    .update({
                        name_ar: formData.name_ar,
                        name_en: formData.name_en,
                        description_ar: formData.description_ar,
                        description_en: formData.description_en,
                        type: formData.type as 'boolean' | 'integer' | 'string',
                        group: formData.group
                    })
                    .eq('id', editingFeature.id);

                if (error) throw error;
                toast.success(language === 'ar' ? 'تم تحديث الميزة بنجاح' : 'Feature updated successfully');
            } else {
                const { error } = await supabase
                    .from('plan_features')
                    .insert([formData as PlanFeature]);

                if (error) throw error;
                toast.success(language === 'ar' ? 'تمت إضافة الميزة بنجاح' : 'Feature added successfully');
            }

            setIsDialogOpen(false);
            fetchFeatures();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه الميزة؟' : 'Are you sure you want to delete this feature?')) return;

        const { error } = await supabase.from('plan_features').delete().eq('id', id);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success(language === 'ar' ? 'تم حذف الميزة' : 'Feature deleted');
            fetchFeatures();
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">
                    {language === 'ar' ? 'قاموس مميزات الباقات' : 'Plan Features Dictionary'}
                </h1>
                <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'إضافة ميزة' : 'Add Feature'}
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingFeature
                            ? (language === 'ar' ? 'تعديل الميزة' : 'Edit Feature')
                            : (language === 'ar' ? 'إضافة ميزة جديدة' : 'Add New Feature')}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSave} className="space-y-4" dir={dir}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label>{language === 'ar' ? 'المعرف الفريد (ID بالانجليزية بدون مسافات)' : 'Unique ID (e.g., max_products)'}</Label>
                                <Input
                                    value={formData.id || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                                    disabled={!!editingFeature}
                                    placeholder="e.g. custom_domain"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                                <Input value={formData.name_ar || ''} onChange={(e) => setFormData(p => ({ ...p, name_ar: e.target.value }))} required />
                            </div>
                            <div className="space-y-2">
                                <Label>{language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}</Label>
                                <Input value={formData.name_en || ''} onChange={(e) => setFormData(p => ({ ...p, name_en: e.target.value }))} required />
                            </div>

                            <div className="space-y-2 col-span-2 sm:col-span-1">
                                <Label>{language === 'ar' ? 'نوع القيمة' : 'Value Type'}</Label>
                                <Select value={formData.type} onValueChange={(v) => setFormData(p => ({ ...p, type: v as any }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="boolean">{language === 'ar' ? 'نعم/لا (Boolean)' : 'Yes/No (Boolean)'}</SelectItem>
                                        <SelectItem value="integer">{language === 'ar' ? 'رقم صحيح (Integer)' : 'Number (Integer)'}</SelectItem>
                                        <SelectItem value="string">{language === 'ar' ? 'نص (String)' : 'Text (String)'}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 col-span-2 sm:col-span-1">
                                <Label>{language === 'ar' ? 'المجموعة / التصنيف' : 'Group'}</Label>
                                <Input
                                    value={formData.group || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, group: e.target.value }))}
                                    placeholder={language === 'ar' ? 'مثال: المنتجات، التسويق' : 'e.g. products, marketing'}
                                    required
                                />
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label>{language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
                                <Textarea value={formData.description_ar || ''} onChange={(e) => setFormData(p => ({ ...p, description_ar: e.target.value }))} rows={2} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>{language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
                                <Textarea value={formData.description_en || ''} onChange={(e) => setFormData(p => ({ ...p, description_en: e.target.value }))} rows={2} />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={formLoading}>
                                {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </Button>
                            <Button type="submit" disabled={formLoading}>
                                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {language === 'ar' ? 'حفظ' : 'Save'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                            <TableHead>{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                            <TableHead>{language === 'ar' ? 'المجموعة' : 'Group'}</TableHead>
                            <TableHead className="text-right">{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {features.map((feature) => (
                            <TableRow key={feature.id}>
                                <TableCell className="font-mono text-sm">{feature.id}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{language === 'ar' ? feature.name_ar : feature.name_en}</div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">{language === 'ar' ? feature.description_ar : feature.description_en}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{feature.type}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{feature.group}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(feature)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(feature.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {features.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    {language === 'ar' ? 'لم يتم إضافة مميزات بعد' : 'No features found'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

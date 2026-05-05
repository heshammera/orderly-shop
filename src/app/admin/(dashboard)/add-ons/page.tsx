"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface AddOn {
    id: string;
    feature_id: string;
    name_ar: string;
    name_en: string;
    description_ar: string;
    description_en: string;
    price: number;
    is_active: boolean;
}

interface FeatureDict {
    id: string;
    name_ar: string;
    name_en: string;
}

export default function AddOnsPage() {
    const { language } = useLanguage();
    const [addOns, setAddOns] = useState<AddOn[]>([]);
    const [features, setFeatures] = useState<FeatureDict[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);
    const [saving, setSaving] = useState(false);

    const supabase = createClient();

    const fetchData = async () => {
        setLoading(true);
        // Fetch Add-ons
        const res = await fetch('/api/admin/add-ons');
        const data = await res.json();
        if (res.ok) setAddOns(data);
        else toast.error(data.error);

        // Fetch Feature Dictionary
        const { data: featData } = await supabase.from('plan_features').select('id, name_ar, name_en');
        setFeatures(featData || []);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        const formData = new FormData(e.currentTarget);
        const payload = {
            id: editingAddOn?.id,
            feature_id: formData.get('feature_id'),
            name_ar: formData.get('name_ar'),
            name_en: formData.get('name_en'),
            description_ar: formData.get('description_ar'),
            description_en: formData.get('description_en'),
            price: Number(formData.get('price')),
            is_active: true,
        };

        const res = await fetch('/api/admin/add-ons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            toast.success(language === 'ar' ? 'تم حفظ الخدمة' : (editingAddOn ? 'Service updated' : 'Service created'));
            setIsDialogOpen(false);
            fetchData();
        } else {
            const err = await res.json();
            toast.error(err.error);
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm(language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return;
        const res = await fetch(`/api/admin/add-ons?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
            toast.success(language === 'ar' ? 'تم حذف الخدمة' : 'Service deleted');
            fetchData();
        } else {
            const err = await res.json();
            toast.error(err.error);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold">
                        {language === 'ar' ? 'إدارة الخدمات الإضافية' : 'Add-on Services'}
                    </h1>
                </div>
                <Button onClick={() => { setEditingAddOn(null); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'خدمة جديدة' : 'New Service'}
                </Button>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{language === 'ar' ? 'اسم الخدمة' : 'Service Name'}</TableHead>
                            <TableHead>{language === 'ar' ? 'مفتاح الميزة' : 'Feature Key'}</TableHead>
                            <TableHead>{language === 'ar' ? 'السعر' : 'Price'}</TableHead>
                            <TableHead className="text-right">{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {addOns.map((ao) => (
                            <TableRow key={ao.id}>
                                <TableCell className="font-medium">
                                    {language === 'ar' ? ao.name_ar : ao.name_en}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{ao.feature_id}</Badge>
                                </TableCell>
                                <TableCell>${ao.price}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => { setEditingAddOn(ao); setIsDialogOpen(true); }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(ao.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingAddOn ? (language === 'ar' ? 'تعديل الخدمة' : 'Edit Service') : (language === 'ar' ? 'إنشاء خدمة جديدة' : 'Create New Service')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>{language === 'ar' ? 'ربط بالميزة' : 'Feature Mapping'}</Label>
                            <Select name="feature_id" defaultValue={editingAddOn?.feature_id}>
                                <SelectTrigger>
                                    <SelectValue placeholder={language === 'ar' ? 'اختر الميزة' : "Select Feature"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {features.map(f => (
                                        <SelectItem key={f.id} value={f.id}>
                                            {f.name_en} ({f.id})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{language === 'ar' ? 'الاسم بالعربية' : 'Arabic Name'}</Label>
                                <Input name="name_ar" defaultValue={editingAddOn?.name_ar} required dir="rtl" />
                            </div>
                            <div className="space-y-2">
                                <Label>{language === 'ar' ? 'الاسم بالإنجليزية' : 'English Name'}</Label>
                                <Input name="name_en" defaultValue={editingAddOn?.name_en} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{language === 'ar' ? 'السعر ($)' : 'Price ($)'}</Label>
                            <Input type="number" name="price" defaultValue={editingAddOn?.price} required />
                        </div>
                        <div className="space-y-2">
                            <Label>{language === 'ar' ? 'الوصف بالعربية' : 'Arabic Description'}</Label>
                            <Textarea name="description_ar" defaultValue={editingAddOn?.description_ar} dir="rtl" />
                        </div>
                        <div className="space-y-2">
                            <Label>{language === 'ar' ? 'الوصف بالإنجليزية' : 'English Description'}</Label>
                            <Textarea name="description_en" defaultValue={editingAddOn?.description_en} />
                        </div>
                        <Button type="submit" className="w-full" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {language === 'ar' ? 'حفظ الخدمة' : 'Save Service'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

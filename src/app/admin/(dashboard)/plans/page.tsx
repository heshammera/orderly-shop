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
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { PlanForm } from '@/components/admin/PlanForm';
import { toast } from 'sonner';

interface Plan {
    id: string;
    slug: string;
    name: { ar: string; en: string };
    name_ar?: string;
    name_en?: string;
    description: { ar: string; en: string };
    description_ar?: string;
    description_en?: string;
    price_monthly: number;
    price_yearly: number;
    price?: number;
    limits: {
        products: number;
        orders_monthly: number;
        stores_limit?: number;
    };
    is_active: boolean;
    display_features?: {
        ar: string[];
        en: string[];
    };
}

export default function PlansPage() {
    const { language } = useLanguage();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const supabase = createClient();

    const fetchPlans = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .order('price_monthly', { ascending: true });

        if (error) {
            toast.error(error.message);
        } else {
            setPlans(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleSave = async (values: any) => {
        const payload: any = {
            slug: values.slug,
            name: { ar: values.name_ar, en: values.name_en },
            name_ar: values.name_ar, // Redundancy for old code compat
            name_en: values.name_en,
            description: { ar: values.description_ar, en: values.description_en },
            description_ar: values.description_ar,
            description_en: values.description_en,
            price_monthly: values.price_monthly,
            price_yearly: values.price_yearly,
            price: values.price_monthly, // Compatibility with some pages using 'price'
            limits: { products: values.products_limit, orders_monthly: values.orders_limit, stores_limit: values.stores_limit },
            is_active: values.is_active,
            display_features: {
                ar: values.display_features_ar?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
                en: values.display_features_en?.split(',').map((s: string) => s.trim()).filter(Boolean) || []
            }
        };

        if (editingPlan) {
            const { error } = await supabase
                .from('plans')
                .update(payload)
                .eq('id', editingPlan.id);

            if (error) throw error;
            toast.success('Plan updated successfully');
        } else {
            const { error } = await supabase
                .from('plans')
                .insert([payload]);

            if (error) throw error;
            toast.success('Plan created successfully');
        }

        setIsDialogOpen(false);
        setEditingPlan(null);
        fetchPlans();
    };

    const handleDelete = async (plan: Plan) => {
        if (!confirm('Are you sure you want to delete this plan?')) return;

        const { error } = await supabase.from('plans').delete().eq('id', plan.id);

        if (error) {
            // Check for foreign key constraint violation (code 23503)
            if (error.code === '23503') {
                const deactivate = confirm('This plan cannot be deleted because it has active subscriptions. Do you want to deactivate it instead? (It will no longer be available for new stores)');
                if (deactivate) {
                    const { error: updateError } = await supabase
                        .from('plans')
                        .update({ is_active: false })
                        .eq('id', plan.id);

                    if (updateError) {
                        toast.error(updateError.message);
                    } else {
                        toast.success('Plan deactivated successfully');
                        fetchPlans();
                    }
                }
            } else {
                toast.error(error.message);
            }
        } else {
            toast.success('Plan deleted');
            fetchPlans();
        }
    };

    const openEdit = (plan: any) => {
        setEditingPlan(plan);
        setIsDialogOpen(true);
    };

    const openCreate = () => {
        setEditingPlan(null);
        setIsDialogOpen(true);
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">
                    {language === 'ar' ? 'إدارة الباقات' : 'Plans Management'}
                </h1>
                <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'باقة جديدة' : 'New Plan'}
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
                        <DialogDescription>
                            Configure plan details, pricing, and limits.
                        </DialogDescription>
                    </DialogHeader>

                    <PlanForm
                        onSubmit={async (val) => {
                            try {
                                await handleSave(val);
                            } catch (e: any) {
                                toast.error(e.message);
                            }
                        }}
                        defaultValues={editingPlan ? {
                            slug: editingPlan.slug,
                            name_ar: editingPlan.name_ar || editingPlan.name?.ar,
                            name_en: editingPlan.name_en || editingPlan.name?.en,
                            description_ar: editingPlan.description_ar || editingPlan.description?.ar,
                            description_en: editingPlan.description_en || editingPlan.description?.en,
                            price_monthly: editingPlan.price_monthly,
                            price_yearly: editingPlan.price_yearly,
                            products_limit: editingPlan.limits?.products,
                            orders_limit: editingPlan.limits?.orders_monthly,
                            stores_limit: editingPlan.limits?.stores_limit || 1,
                            is_active: editingPlan.is_active,
                            display_features_ar: editingPlan.display_features?.ar?.join(', ') || '',
                            display_features_en: editingPlan.display_features?.en?.join(', ') || ''
                        } : undefined}
                    />
                </DialogContent>
            </Dialog>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Price (Mo/Yr)</TableHead>
                            <TableHead>Limits</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plans.map((plan) => (
                            <TableRow key={plan.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{plan.name[language as 'ar' | 'en']}</span>
                                        <span className="text-xs text-muted-foreground">{plan.slug}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    ${plan.price_monthly} / ${plan.price_yearly}
                                </TableCell>
                                <TableCell>
                                    <div className="text-xs space-y-1">
                                        <div>Prod: {plan.limits.products === -1 ? '∞' : plan.limits.products}</div>
                                        <div>Orders: {plan.limits.orders_monthly === -1 ? '∞' : plan.limits.orders_monthly}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {plan.is_active ? (
                                        <Badge variant="default" className="bg-green-500">Active</Badge>
                                    ) : (
                                        <Badge variant="secondary">Inactive</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(plan)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(plan)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

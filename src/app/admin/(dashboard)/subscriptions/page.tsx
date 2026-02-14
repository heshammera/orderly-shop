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
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from '@/components/ui/badge';
import { Loader2, Pencil, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Subscription {
    id: string;
    store_id: string;
    plan_id: string;
    status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete';
    current_period_end: string | null;
    store: { name: { ar: string; en: string }; slug: string } | null;
    plan: { name: { ar: string; en: string }; name_ar?: string; name_en?: string; } | null;
}

interface Plan {
    id: string;
    name: { ar: string; en: string };
    price_monthly: number;
}

export default function SubscriptionsPage() {
    const { language } = useLanguage();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSub, setEditingSub] = useState<Subscription | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [saving, setSaving] = useState(false);

    const supabase = createClient();

    const fetchData = async () => {
        setLoading(true);
        // Fetch Subscriptions
        const { data: subs, error: subsError } = await supabase
            .from('store_subscriptions')
            .select(`
                *,
                store:stores(name, slug),
                plan:plans(id, name, name_ar, name_en)
            `)
            .order('created_at', { ascending: false });

        if (subsError) toast.error(subsError.message);
        else setSubscriptions(subs as any[] || []);

        // Fetch Plans for dropdown
        const { data: plansData, error: plansError } = await supabase
            .from('plans')
            .select('id, name, price_monthly')
            .eq('is_active', true);

        if (plansError) toast.error(plansError.message);
        else setPlans(plansData || []);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (sub: Subscription) => {
        setEditingSub(sub);
        setSelectedPlanId(sub.plan_id);
        setSelectedStatus(sub.status);
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!editingSub) return;
        setSaving(true);

        // Calculate new period end if activating (add 30 days) - naive implementation
        // For accurate billing we would need a proper billing engine logic
        let updates: any = {
            plan_id: selectedPlanId,
            status: selectedStatus,
        };

        if (selectedStatus === 'active' && editingSub.status !== 'active') {
            // If activating, extend by 30 days from now
            const nextMonth = new Date();
            nextMonth.setDate(nextMonth.getDate() + 30);
            updates.current_period_end = nextMonth.toISOString();
            updates.current_period_start = new Date().toISOString();
        }

        const { error } = await supabase
            .from('store_subscriptions')
            .update(updates)
            .eq('id', editingSub.id);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Subscription updated');
            setIsDialogOpen(false);
            fetchData();
        }
        setSaving(false);
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            active: 'bg-green-500',
            past_due: 'bg-yellow-500',
            canceled: 'bg-red-500',
            trialing: 'bg-blue-500',
            incomplete: 'bg-gray-500'
        };
        return <Badge className={`${variants[status] || 'bg-gray-500'}`}>{status}</Badge>;
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">
                {language === 'ar' ? 'إدارة الاشتراكات' : 'Subscriptions Management'}
            </h1>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{language === 'ar' ? 'المتجر' : 'Store'}</TableHead>
                            <TableHead>{language === 'ar' ? 'الباقة' : 'Plan'}</TableHead>
                            <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                            <TableHead>{language === 'ar' ? 'نهاية الفترة' : 'Period End'}</TableHead>
                            <TableHead className="text-right">{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subscriptions.map((sub) => (
                            <TableRow key={sub.id}>
                                <TableCell>
                                    <div className="font-medium">{sub.store?.name[language as 'ar' | 'en'] || 'Unknown Store'}</div>
                                    <div className="text-xs text-muted-foreground">@{sub.store?.slug}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {sub.plan?.name_ar || sub.plan?.name_en || (typeof sub.plan?.name === 'object' ? sub.plan?.name[language as 'ar' | 'en'] : sub.plan?.name) || 'Unknown Plan'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(sub.status)}
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm font-medium">
                                        {sub.plan?.price_monthly}
                                        {language === 'ar' ? ' ر.س' : ' USD'}/
                                        {language === 'ar' ? 'ش' : 'mo'}
                                    </p>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CalendarIcon className="w-3 h-3" />
                                        {sub.current_period_end
                                            ? format(new Date(sub.current_period_end), 'MMM d, yyyy')
                                            : '-'}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(sub)}>
                                        <Pencil className="w-4 h-4 mr-2" />
                                        {language === 'ar' ? 'تعديل' : 'Edit'}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {subscriptions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No subscriptions found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Subscription</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Plan</Label>
                            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {plans.map(plan => (
                                        <SelectItem key={plan.id} value={plan.id}>
                                            {plan.name[language as 'ar' | 'en']} (${plan.price_monthly}/mo)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="past_due">Past Due</SelectItem>
                                    <SelectItem value="canceled">Canceled</SelectItem>
                                    <SelectItem value="trialing">Trialing</SelectItem>
                                    <SelectItem value="incomplete">Incomplete</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

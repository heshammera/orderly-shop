"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, UserPlus, Copy, Link as LinkIcon, DollarSign } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AffiliatesPage({ params }: { params: { storeId: string } }) {
    const { storeId } = params;
    const { language } = useLanguage();
    const supabase = createClient();
    const [totalPaidOut, setTotalPaidOut] = useState(0);
    const [affiliates, setAffiliates] = useState<any[]>([]);
    const [storeSlug, setStoreSlug] = useState('');
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        email: '',
        code: '',
        commission_rate: 10
    });


    useEffect(() => {
        const fetchData = async () => {
            // Get Store Slug
            const { data: store } = await supabase.from('stores').select('slug').eq('id', storeId).single();
            if (store) setStoreSlug(store.slug);

            // Get Affiliates
            const { data: affiliatesData } = await supabase
                .from('affiliates')
                .select('*')
                .eq('store_id', storeId)
                .order('created_at', { ascending: false });

            setAffiliates(affiliatesData || []);

            // Get Total Paid Out
            // We need to join with affiliates to filter by store_id, or use the affiliates list we just got
            if (affiliatesData && affiliatesData.length > 0) {
                const affiliateIds = affiliatesData.map(a => a.id);
                const { data: payoutsData } = await supabase
                    .from('affiliate_payouts')
                    .select('amount')
                    .in('affiliate_id', affiliateIds)
                    .eq('status', 'paid');

                const paidTotal = payoutsData?.reduce((sum, p) => sum + p.amount, 0) || 0;
                setTotalPaidOut(paidTotal);
            }

            setLoading(false);
        };
        fetchData();
    }, [storeId, supabase]);

    const handleCreate = async () => {
        if (!newItem.name || !newItem.code) {
            toast.error(language === 'ar' ? 'الرجاء ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
            return;
        }

        setCreating(true);
        try {
            const { error } = await supabase.from('affiliates').insert({
                store_id: storeId,
                name: newItem.name,
                email: newItem.email,
                code: newItem.code,
                commission_rate: newItem.commission_rate,
                status: 'active'
            });

            if (error) throw error;

            toast.success(language === 'ar' ? 'تم إضافة المسوق بنجاح' : 'Affiliate added successfully');
            setIsCreateOpen(false);
            setNewItem({ name: '', email: '', code: '', commission_rate: 10 });

            // Refresh list
            const { data: affiliatesData } = await supabase
                .from('affiliates')
                .select('*')
                .eq('store_id', storeId)
                .order('created_at', { ascending: false });
            setAffiliates(affiliatesData || []);
        } catch (error: any) {
            toast.error(error.message || 'Error creating affiliate');
        } finally {
            setCreating(false);
        }
    };

    const copyLink = (code: string) => {
        const url = `${window.location.origin}/s/${storeSlug}?ref=${code}`;
        navigator.clipboard.writeText(url);
        toast.success(language === 'ar' ? 'تم نسخ الرابط' : 'Link copied to clipboard');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {language === 'ar' ? 'نظام التسويق بالعمولة' : 'Affiliate Program'}
                    </h1>
                    <p className="text-muted-foreground">
                        {language === 'ar' ? 'إدارة الشركاء وتتبع أداؤهم' : 'Manage your partners and track their performance.'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <a href={`/dashboard/${storeId}/marketing/affiliates/payouts`}>
                            {language === 'ar' ? 'طلبات السحب' : 'Payout Requests'}
                        </a>
                    </Button>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <UserPlus className="mr-2 h-4 w-4" />
                                {language === 'ar' ? 'إضافة مسوق' : 'Add Affiliate'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Affiliate</DialogTitle>
                                <DialogDescription>Create a tracking code for a partner.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Partner Name</Label>
                                    <Input
                                        value={newItem.name}
                                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                        placeholder="e.g. John Doe / Instagram Influencer"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Email (Optional)</Label>
                                    <Input
                                        value={newItem.email}
                                        onChange={(e) => setNewItem({ ...newItem, email: e.target.value })}
                                        placeholder="partner@example.com"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Tracking Code</Label>
                                    <Input
                                        value={newItem.code}
                                        onChange={(e) => setNewItem({ ...newItem, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g. SALE50, JOHN20"
                                    />
                                    <p className="text-xs text-muted-foreground">This will be used in the URL: ?ref=CODE</p>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Commission Rate (%)</Label>
                                    <Input
                                        type="number"
                                        value={newItem.commission_rate}
                                        onChange={(e) => setNewItem({ ...newItem, commission_rate: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreate} disabled={creating}>
                                    {creating && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                    Create Partner
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{affiliates.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalPaidOut)}</div>
                        <p className="text-xs text-muted-foreground">To date</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Commissions</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(affiliates.reduce((acc, curr) => acc + (curr.total_earnings || 0), 0))}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Partners List</CardTitle>
                    <CardDescription>All active tracking codes and their performance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Commission</TableHead>
                                <TableHead>Earnings</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {affiliates.length > 0 ? affiliates.map((affiliate) => (
                                <TableRow key={affiliate.id}>
                                    <TableCell className="font-medium">
                                        {affiliate.name}
                                        <div className="text-xs text-muted-foreground">{affiliate.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-mono bg-muted px-2 py-1 rounded text-xs">{affiliate.code}</span>
                                    </TableCell>
                                    <TableCell>{affiliate.commission_rate}%</TableCell>
                                    <TableCell className="font-bold text-green-600">{formatCurrency(affiliate.total_earnings || 0)}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${affiliate.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {affiliate.status.toUpperCase()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => copyLink(affiliate.code)}>
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copy Link
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No affiliates found. Click "Add Affiliate" to create one.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LoyaltyPage({ params }: { params: { storeId: string } }) {
    const { storeId } = params;
    const { language } = useLanguage();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Settings
    const [enabled, setEnabled] = useState(false);
    const [earningRate, setEarningRate] = useState(1);
    const [redemptionRate, setRedemptionRate] = useState(100);

    // Logs
    const [transactions, setTransactions] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch Store Settings
            const { data: store } = await supabase
                .from('stores')
                .select('loyalty_program_enabled, loyalty_earning_rate, loyalty_redemption_rate')
                .eq('id', storeId)
                .single();

            if (store) {
                setEnabled(store.loyalty_program_enabled || false);
                setEarningRate(store.loyalty_earning_rate || 1);
                setRedemptionRate(store.loyalty_redemption_rate || 100);
            }

            // Fetch Transactions
            // Fetch Transactions
            const { data: logs } = await supabase
                .from('loyalty_transactions')
                .select('*, customers(name, email)')
                .eq('store_id', storeId)
                .order('created_at', { ascending: false })
                .limit(20);

            setTransactions(logs || []);
            setLoading(false);
        };
        fetchData();
    }, [storeId, supabase]);

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('stores')
            .update({
                loyalty_program_enabled: enabled,
                loyalty_earning_rate: earningRate,
                loyalty_redemption_rate: redemptionRate
            })
            .eq('id', storeId);

        if (error) {
            toast.error('Failed to update loyalty settings');
            console.error(error);
        } else {
            toast.success('Loyalty settings updated');
        }
        setSaving(false);
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {language === 'ar' ? 'برنامج الولاء' : 'Loyalty Program'}
                    </h1>
                    <p className="text-muted-foreground">
                        {language === 'ar' ? 'كافئ عملاءك بنقاط لكل عملية شراء' : 'Reward your customers with points for every purchase.'}
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Program Status</CardTitle>
                        <CardDescription>Enable or disable the loyalty program for your store.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Enable Loyalty Program</Label>
                            <p className="text-sm text-muted-foreground">Customers will start earning points on new orders.</p>
                        </div>
                        <Switch checked={enabled} onCheckedChange={setEnabled} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Earning & Redemption</CardTitle>
                        <CardDescription>Configure how points are earned and spent.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Earning Rate (Points per Currency Unit)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min="1"
                                    value={earningRate}
                                    onChange={(e) => setEarningRate(parseInt(e.target.value) || 0)}
                                />
                                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                                    Points / 1 { /* currency could be dynamic */} Unit
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">Example: If set to 1, a 100 AED order earns 100 points.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label>Redemption Rate (Points Value)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min="1"
                                    value={redemptionRate}
                                    onChange={(e) => setRedemptionRate(parseInt(e.target.value) || 0)}
                                />
                                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                                    Points = 1 { /* currency */} Unit Discount
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">Example: If set to 100, redeeming 500 points gives a 5 AED discount.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest point transactions from your customers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Points</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length > 0 ? transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="font-medium">
                                        {tx.customers?.name}
                                        <div className="text-xs text-muted-foreground">{tx.customers?.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tx.type === 'earn' ? 'bg-green-100 text-green-800' :
                                            tx.type === 'redeem' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {tx.type.toUpperCase()}
                                        </span>
                                    </TableCell>
                                    <TableCell className={tx.points > 0 ? 'text-green-600 font-bold' : 'text-amber-600 font-bold'}>
                                        {tx.points > 0 ? '+' : ''}{tx.points}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{tx.description || '-'}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {new Date(tx.created_at).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No recent loyalty transactions found.
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

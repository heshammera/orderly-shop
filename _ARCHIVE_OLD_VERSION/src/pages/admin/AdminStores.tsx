import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, ExternalLink, Ban, CheckCircle, Trash2, Edit, CreditCard, DollarSign } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function AdminStores() {
    const { language } = useLanguage();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    // State for modals
    const [editingStore, setEditingStore] = useState<any>(null);
    const [rechargeStore, setRechargeStore] = useState<any>(null);
    const [rechargeAmount, setRechargeAmount] = useState('');
    const [commissionData, setCommissionData] = useState({
        type: 'percentage',
        value: 5,
        unlimited: false
    });

    const { data: stores = [], isLoading } = useQuery({
        queryKey: ['admin-stores'],
        queryFn: async () => {
            const { data: storesData, error: storesError } = await supabase
                .from('stores')
                .select('*')
                .order('created_at', { ascending: false });

            if (storesError) throw storesError;
            if (!storesData.length) return [];

            const ownerIds = Array.from(new Set(storesData.map(s => s.owner_id)));
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('user_id, full_name, phone')
                .in('user_id', ownerIds);

            if (profilesError) throw profilesError;

            const profilesMap = (profilesData || []).reduce((acc: any, profile: any) => {
                acc[profile.user_id] = profile;
                return acc;
            }, {});

            return storesData.map(store => ({
                ...store,
                owner_profile: profilesMap[store.owner_id] || null
            }));
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const { error } = await supabase.from('stores').update({ status }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
            toast({ title: 'Success', description: 'Store status updated' });
        }
    });

    const updateCommissionMutation = useMutation({
        mutationFn: async (data: any) => {
            const { error } = await supabase.from('stores').update({
                commission_type: data.type,
                commission_value: data.value,
                has_unlimited_balance: data.unlimited
            }).eq('id', data.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
            setEditingStore(null);
            toast({ title: 'Success', description: 'Commission settings updated' });
        }
    });

    const [rechargeType, setRechargeType] = useState<'add' | 'deduct'>('add');

    // ... (existing code)

    const manualRechargeMutation = useMutation({
        mutationFn: async (data: { id: string, amount: number, type: 'add' | 'deduct' }) => {
            // 1. Fetch store info
            const { data: store, error: storeInfoError } = await supabase
                .from('stores')
                .select('currency, name')
                .eq('id', data.id)
                .single();

            if (storeInfoError) throw storeInfoError;

            // Mock Exchange Rate Logic
            let exchangeRate = 1.0;
            if (store.currency === 'EGP') exchangeRate = 50.0;
            else if (store.currency === 'SAR') exchangeRate = 3.75;

            // Calculate local amount (Negative if deducting)
            const rawAmount = data.type === 'deduct' ? -Math.abs(data.amount) : Math.abs(data.amount);
            const amountLocal = rawAmount * exchangeRate;

            // 2. Update balance via RPC
            const { error: rpcError } = await supabase.rpc('increment_store_balance', {
                store_id_input: data.id,
                amount_input: amountLocal
            });

            if (rpcError) throw rpcError;

            // 3. Log transaction
            const { error: txError } = await supabase.from('wallet_transactions').insert({
                store_id: data.id,
                amount: amountLocal,
                type: data.type === 'deduct' ? 'withdrawal' : 'deposit', // or 'adjustment'
                description: `Manual ${data.type === 'add' ? 'Deposit' : 'Deduction'} by Admin ($${Math.abs(data.amount)})`,
            });

            if (txError) throw txError;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
            setRechargeStore(null);
            setRechargeAmount('');
            setRechargeType('add'); // Reset to default
            toast({
                title: variables.type === 'add' ? 'Funds Added' : 'Funds Deducted',
                description: `Successfully ${variables.type === 'add' ? 'added' : 'deducted'} $${variables.amount} from store wallet.`,
                className: variables.type === 'add' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive'
            });
        }
    });

    const handleEditClick = (store: any) => {
        setEditingStore(store);
        setCommissionData({
            type: store.commission_type || 'percentage',
            value: store.commission_value || 0,
            unlimited: store.has_unlimited_balance || false
        });
    };

    const handleRechargeClick = (store: any) => {
        setRechargeStore(store);
        setRechargeAmount('');
    };

    const filteredStores = stores.filter(store => {
        const searchLower = searchTerm.toLowerCase();
        const nameAr = (store.name as any)?.ar?.toLowerCase() || '';
        const nameEn = (store.name as any)?.en?.toLowerCase() || '';
        const slug = store.slug?.toLowerCase() || '';
        return nameAr.includes(searchLower) || nameEn.includes(searchLower) || slug.includes(searchLower);
    });

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Stores Management</h2>

            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search stores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Store</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead>Commission</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-end">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStores.map((store: any) => {
                            const name = (store.name as any)[language] || (store.name as any).en;
                            return (
                                <TableRow key={store.id}>
                                    <TableCell>
                                        <div className="font-medium">{name}</div>
                                        <div className="text-xs text-muted-foreground">{store.slug}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            {store.has_unlimited_balance ? (
                                                <Badge variant="outline" className="w-fit bg-purple-50 text-purple-600 border-purple-200">Unlimited VIP</Badge>
                                            ) : (
                                                <span className={store.balance <= 0 ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>
                                                    ${store.balance?.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {store.commission_type === 'percentage' ? `${store.commission_value}%` : `$${store.commission_value}`}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={store.status === 'active' ? 'default' : 'destructive'}>
                                            {store.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-end">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(store)} title="Edit Commission">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleRechargeClick(store)} title="Manual Recharge">
                                                <CreditCard className="w-4 h-4" />
                                            </Button>
                                            {store.status === 'active' ? (
                                                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => updateStatusMutation.mutate({ id: store.id, status: 'suspended' })}>
                                                    <Ban className="w-4 h-4" />
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="icon" className="text-green-500" onClick={() => updateStatusMutation.mutate({ id: store.id, status: 'active' })}>
                                                    <CheckCircle className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Commission Dialog */}
            <Dialog open={!!editingStore} onOpenChange={(open) => !open && setEditingStore(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Store Settings</DialogTitle>
                        <DialogDescription>Configure commission and balance settings for this store.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between">
                            <Label>Unlimited Balance (VIP)</Label>
                            <Switch
                                checked={commissionData.unlimited}
                                onCheckedChange={(checked) => setCommissionData({ ...commissionData, unlimited: checked })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Commission Type</Label>
                            <Select
                                value={commissionData.type}
                                onValueChange={(val) => setCommissionData({ ...commissionData, type: val })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Commission Value</Label>
                            <Input
                                type="number"
                                value={commissionData.value}
                                onChange={(e) => setCommissionData({ ...commissionData, value: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingStore(null)}>Cancel</Button>
                        <Button onClick={() => updateCommissionMutation.mutate({ ...commissionData, id: editingStore.id })}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manual Recharge Dialog */}
            <Dialog open={!!rechargeStore} onOpenChange={(open) => !open && setRechargeStore(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manual Recharge</DialogTitle>
                        <DialogDescription>Add funds directly to this store's wallet.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Operation Type</Label>
                            <Select
                                value={rechargeType}
                                onValueChange={(val: 'add' | 'deduct') => setRechargeType(val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="add" className="text-green-600">Add Funds (Deposit)</SelectItem>
                                    <SelectItem value="deduct" className="text-red-600">Deduct Funds (Withdrawal)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Amount (USD)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-8"
                                    type="number"
                                    placeholder="0.00"
                                    value={rechargeAmount}
                                    onChange={(e) => setRechargeAmount(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {rechargeType === 'add' ? 'This amount will be ADDED to the store balance.' : 'This amount will be DEDUCTED from the store balance.'}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRechargeStore(null)}>Cancel</Button>
                        <Button
                            variant={rechargeType === 'deduct' ? 'destructive' : 'default'}
                            onClick={() => manualRechargeMutation.mutate({
                                id: rechargeStore.id,
                                amount: parseFloat(rechargeAmount),
                                type: rechargeType
                            })}
                            disabled={!rechargeAmount || parseFloat(rechargeAmount) <= 0 || manualRechargeMutation.isPending}
                        >
                            {manualRechargeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {rechargeType === 'add' ? 'Add Funds' : 'Deduct Funds'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

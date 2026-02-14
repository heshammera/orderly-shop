import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, Upload, CheckCircle2, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

interface Transaction {
    id: string;
    amount: number;
    type: 'deposit' | 'commission' | 'withdrawal' | 'adjustment' | 'recharge';
    description: string | null;
    created_at: string;
    reference_id?: string | null;
}

interface RechargeRequest {
    id: string;
    amount_usd: number;
    amount_local: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export default function StoreWallet() {
    const { storeId } = useParams<{ storeId: string }>();
    const { language } = useLanguage();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);
    const [currency, setCurrency] = useState('SAR');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [rechargeRequests, setRechargeRequests] = useState<RechargeRequest[]>([]);

    // Recharge State
    const [isRechargeOpen, setIsRechargeOpen] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [exchangeRate, setExchangeRate] = useState(3.75); // Mock rate (USD to Local) - In real app fetch from API
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Recharge Packages (USD)
    const packages = [5, 10, 20, 40, 80, 100];

    const fetchData = useCallback(async () => {
        if (!storeId) return;
        try {
            // Fetch Store Balance & Currency
            const { data: store, error: storeError } = await supabase
                .from('stores')
                .select('balance, currency, name')
                .eq('id', storeId)
                .single();

            if (storeError) throw storeError;
            setBalance(store.balance || 0);
            setCurrency(store.currency || 'USD');

            // Adjust exchange rate based on currency (Mock logic)
            if (store.currency === 'EGP') setExchangeRate(50.0); // Example rate
            else if (store.currency === 'SAR') setExchangeRate(3.75);
            else setExchangeRate(1.0);

            // Fetch Transactions
            const { data: txs, error: txError } = await supabase
                .from('wallet_transactions')
                .select('*')
                .eq('store_id', storeId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (txError) {
                console.warn("Transactions table error (possibly undefined):", txError);
            } else {
                setTransactions((txs as unknown as Transaction[]) || []);
            }

            // Fetch Active Recharge Requests
            const { data: reqs, error: reqError } = await supabase
                .from('wallet_recharge_requests')
                .select('*')
                .eq('store_id', storeId)
                .order('created_at', { ascending: false })
                .limit(5);

            if (reqError) {
                console.warn("Recharge requests table error:", reqError);
            } else {
                setRechargeRequests((reqs as unknown as RechargeRequest[]) || []);
            }

        } catch (error: any) {
            // Ignore AbortError which happens on component unmount/strict mode
            if (error.message && (error.message.includes('AbortError') || error.message.includes('signal is aborted'))) {
                return;
            }
            console.error('Error details:', error);
        } finally {
            setLoading(false);
        }
    }, [storeId]);

    useEffect(() => {
        let mounted = true;

        if (!authLoading && !user) {
            navigate('/login');
            return;
        }

        if (user && storeId) {
            fetchData();
        }

        // Cleanup runs on unmount
        return () => {
            mounted = false;
        };
    }, [user, authLoading, storeId, navigate, fetchData]);

    const handleRechargeSelect = (amount: number) => {
        setSelectedAmount(amount);
        setProofFile(null);
        setIsRechargeOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProofFile(e.target.files[0]);
        }
    };

    const handleSubmitRecharge = async () => {
        if (!selectedAmount || !proofFile || !storeId) return;
        setIsSubmitting(true);

        try {
            const amountLocal = selectedAmount * exchangeRate;
            const fileExt = proofFile.name.split('.').pop();
            const fileName = `${storeId}/${Date.now()}.${fileExt}`;

            // 1. Upload Proof
            const { error: uploadError } = await supabase.storage
                .from('recharge-proofs')
                .upload(fileName, proofFile);

            if (uploadError) throw uploadError;

            // 2. Create Request
            const { error: dbError } = await supabase
                .from('wallet_recharge_requests')
                .insert({
                    store_id: storeId,
                    amount_usd: selectedAmount,
                    amount_local: amountLocal,
                    exchange_rate: exchangeRate,
                    proof_image: fileName,
                    status: 'pending'
                });

            if (dbError) throw dbError;

            toast.success(language === 'ar' ? 'تم إرسال طلب الشحن بنجاح' : 'Recharge request sent successfully');
            setIsRechargeOpen(false);
            fetchData(); // Refresh list

        } catch (error: any) {
            console.error('Recharge error:', error);
            toast.error(error.message || 'Failed to submit request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount: number, curr = currency) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
            style: 'currency',
            currency: curr
        }).format(amount);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <DashboardLayout storeId={storeId!} storeName="Wallet">
            <div className="space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{language === 'ar' ? 'المحفظة' : 'Wallet'}</h1>
                        <p className="text-muted-foreground">{language === 'ar' ? 'إدارة رصيد متجرك وتاريخ العمليات' : 'Manage your store balance and transactions'}</p>
                    </div>
                </div>

                {/* Balance & Status */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{language === 'ar' ? 'الرصيد الحالي' : 'Current Balance'}</CardTitle>
                            <Wallet className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold mb-1">{formatCurrency(balance)}</div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                {balance <= 0 && <span className="text-red-500 font-medium">{language === 'ar' ? 'الرصيد منخفض، يرجى الشحن!' : 'Low balance, please recharge!'}</span>}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Pending Requests */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{language === 'ar' ? 'طلبات قيد الانتظار' : 'Pending Requests'}</CardTitle>
                            <History className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 mt-2">
                                {rechargeRequests.filter(r => r.status === 'pending').length > 0 ? (
                                    rechargeRequests.filter(r => r.status === 'pending').map(req => (
                                        <div key={req.id} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded">
                                            <span>{formatCurrency(req.amount_local)}</span>
                                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">{language === 'ar' ? 'قيد المراجعة' : 'Pending'}</Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'لا توجد طلبات معلقة' : 'No pending requests'}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col gap-8">

                    {/* Recharge Packages */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">{language === 'ar' ? 'شحن الرصيد' : 'Recharge Balance'}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {packages.map((amount) => (
                                <Card
                                    key={amount}
                                    className="cursor-pointer hover:border-primary transition-all hover:shadow-md relative overflow-hidden group"
                                    onClick={() => handleRechargeSelect(amount)}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <CardContent className="flex flex-col items-center justify-center p-8 gap-4 text-center">
                                        <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                                            <CreditCard className="w-8 h-8 text-primary" />
                                        </div>
                                        <div>
                                            <div className="text-3xl font-bold">${amount}</div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                {`≈ ${formatCurrency(amount * exchangeRate)}`}
                                            </div>
                                        </div>
                                        <Button
                                            className="w-full mt-2"
                                            variant="outline"
                                        >
                                            {language === 'ar' ? 'شحن الآن' : 'Recharge Now'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">{language === 'ar' ? 'سجل العمليات' : 'Transaction History'}</h2>
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{language === 'ar' ? 'الوصف' : 'Description'}</TableHead>
                                            <TableHead>{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                                            <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.length > 0 ? (
                                            transactions.map((tx) => (
                                                <TableRow key={tx.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {tx.type === 'commission' ? <ArrowDownLeft className="h-4 w-4 text-red-500" /> : <ArrowUpRight className="h-4 w-4 text-green-500" />}
                                                            <span className="capitalize">{tx.description || tx.type}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className={tx.amount >= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                                                        {formatCurrency(tx.amount)}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-xs">
                                                        {new Date(tx.created_at).toLocaleDateString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                                                    {language === 'ar' ? 'لا توجد عمليات سابقة' : 'No transactions found'}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Recharge Modal */}
                <Dialog open={isRechargeOpen} onOpenChange={setIsRechargeOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{language === 'ar' ? 'إتمام عملية الشحن' : 'Complete Recharge'}</DialogTitle>
                            <DialogDescription>
                                {language === 'ar'
                                    ? 'يرجى تحويل المبلغ المطلوب إلى المحفظة الإلكترونية ثم رفع صورة الإيصال.'
                                    : 'Please transfer the required amount to the E-Wallet and upload the proof.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {/* Payment Instructions */}
                            <Alert className="bg-primary/5 border-primary/20">
                                <Wallet className="h-4 w-4" />
                                <AlertTitle>{language === 'ar' ? 'معلومات الدفع' : 'Payment Info'}</AlertTitle>
                                <AlertDescription className="font-mono text-lg font-bold mt-1 select-all">
                                    +201004705046
                                </AlertDescription>
                                <div className="text-xs text-muted-foreground mt-1">
                                    (Vodafone Cash / E-Wallet)
                                </div>
                            </Alert>

                            {/* Amount Display */}
                            <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
                                <span className="text-sm font-medium">{language === 'ar' ? 'المبلغ المطلوب:' : 'Amount Required:'}</span>
                                <span className="text-xl font-bold text-primary">
                                    {selectedAmount && formatCurrency(selectedAmount * exchangeRate)}
                                </span>
                            </div>

                            {/* File Upload */}
                            <div className="grid w-full gap-2">
                                <Label htmlFor="proof">{language === 'ar' ? 'صورة الإيصال' : 'Payment Proof (Screenshot)'}</Label>
                                <Input id="proof" type="file" accept="image/*" onChange={handleFileChange} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsRechargeOpen(false)} disabled={isSubmitting}>
                                {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </Button>
                            <Button onClick={handleSubmitRecharge} disabled={!proofFile || isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {language === 'ar' ? 'تأكيد الطلب' : 'Confirm Request'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}

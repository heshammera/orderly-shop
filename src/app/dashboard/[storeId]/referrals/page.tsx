"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Copy, DollarSign, Users, Gift, CheckCircle2, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ReferralsPage({ params }: { params: { storeId: string } }) {
    const { storeId } = params;
    const { language } = useLanguage();
    const supabase = createClient();

    const [referralCode, setReferralCode] = useState<string>('');
    const [invitedStores, setInvitedStores] = useState<any[]>([]);
    const [totalEarnings, setTotalEarnings] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReferralData = async () => {
            try {
                // 1. Get Store Referral Code
                const { data: storeData } = await supabase
                    .from('stores')
                    .select('referral_code')
                    .eq('id', storeId)
                    .single();

                if (storeData && storeData.referral_code) {
                    setReferralCode(storeData.referral_code);
                }

                // 2. Get Invited Stores List
                const { data: storesList } = await supabase
                    .from('stores')
                    .select('id, name, created_at, status, referral_reward_paid')
                    .eq('referred_by_store_id', storeId)
                    .order('created_at', { ascending: false });

                if (storesList) {
                    setInvitedStores(storesList);
                }

                // 3. Get Total Referral Earnings from Wallet
                const { data: txsData } = await supabase
                    .from('wallet_transactions')
                    .select('amount')
                    .eq('store_id', storeId)
                    .eq('type', 'deposit')
                    .like('description', '%Referral Reward%');

                if (txsData) {
                    const total = txsData.reduce((acc, curr) => acc + Number(curr.amount), 0);
                    setTotalEarnings(total);
                }

            } catch (error) {
                console.error("Error fetching referral data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReferralData();
    }, [storeId, supabase]);

    const copyLink = () => {
        if (!referralCode) return;
        // In a real scenario, this links to the platform registration page
        const url = `${window.location.origin}/signup?ref=${referralCode}`;
        navigator.clipboard.writeText(url);
        toast.success(language === 'ar' ? 'تم نسخ رابط الدعوة الخاص بك! شاركه مع التجار.' : 'Referral link copied to clipboard!');
    };

    const getStoreName = (nameObj: any) => {
        if (typeof nameObj === 'string') {
            try {
                const parsed = JSON.parse(nameObj);
                return parsed[language] || parsed.en || parsed.ar || 'Store';
            } catch {
                return nameObj;
            }
        }
        return nameObj?.[language] || nameObj?.en || nameObj?.ar || 'Store';
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {language === 'ar' ? 'دعوة التجار (اربح معنا)' : 'Referral Program'}
                    </h1>
                    <p className="text-muted-foreground">
                        {language === 'ar'
                            ? 'شارك رابطك مع تجار آخرين، احصل على 5$، وهم سيحصلون على 2$ كرصيد ترحيبي!'
                            : 'Invite other merchants to get $5, and they get $2!'}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Referral Link Card */}
                <Card className="md:col-span-2 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gift className="w-5 h-5 text-primary" />
                            {language === 'ar' ? 'رابط الدعوة الخاص بك' : 'Your Referral Link'}
                        </CardTitle>
                        <CardDescription>
                            {language === 'ar' ? 'انسخ الرابط وأرسله لأصدقائك عبر واتساب أو الشبكات الاجتماعية.' : 'Copy the link and send it to your friends.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 overflow-hidden rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono text-muted-foreground whitespace-nowrap">
                                {referralCode ? `${window.location.origin}/signup?ref=${referralCode}` : 'جاري التحميل...'}
                            </div>
                            <Button onClick={copyLink} disabled={!referralCode} className="shrink-0 gap-2">
                                <Copy className="w-4 h-4" />
                                {language === 'ar' ? 'نسخ الرابط' : 'Copy'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Earnings Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {language === 'ar' ? 'إجمالي أرباح الدعوات' : 'Total Referral Earnings'}
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">${totalEarnings.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {language === 'ar' ? 'تم إيداعها في محفظتك' : 'Deposited to your wallet'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Invited Stores Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                {language === 'ar' ? 'المتاجر المدعوة' : 'Invited Stores'}
                            </CardTitle>
                            <CardDescription>
                                {language === 'ar'
                                    ? 'تتبع حالة المتاجر التي سجلت عبرك. ستحصل على الـ 5$ بمجرد أن يقوموا بالاشتراك، وستجدها في المحفظة.'
                                    : 'Track stores you invited. You earn $5 once they subscribe or recharge.'}
                            </CardDescription>
                        </div>
                        <div className="text-sm font-medium bg-muted px-3 py-1 rounded-full">
                            {invitedStores.length} {language === 'ar' ? 'متاجر' : 'Stores'}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{language === 'ar' ? 'اسم المتجر' : 'Store Name'}</TableHead>
                                    <TableHead>{language === 'ar' ? 'تاريخ الانضمام' : 'Joined Date'}</TableHead>
                                    <TableHead>{language === 'ar' ? 'حالة المتجر' : 'Status'}</TableHead>
                                    <TableHead className="text-right">{language === 'ar' ? 'حالة المكافأة' : 'Reward Status'}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                                        </TableCell>
                                    </TableRow>
                                ) : invitedStores.length > 0 ? (
                                    invitedStores.map((store) => (
                                        <TableRow key={store.id}>
                                            <TableCell className="font-medium">
                                                {getStoreName(store.name)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(store.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${store.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {store.status === 'active'
                                                        ? (language === 'ar' ? 'نشط' : 'Active')
                                                        : (language === 'ar' ? 'بانتظار الاشتراك' : 'Pending Plan')}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {store.referral_reward_paid ? (
                                                    <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        {language === 'ar' ? 'تم الدفع (5$)' : 'Paid ($5)'}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-muted-foreground text-sm">
                                                        <Clock className="w-4 h-4" />
                                                        {language === 'ar' ? 'في الانتظار' : 'Pending'}
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground bg-muted/20">
                                            {language === 'ar' ? 'لم تقم بدعوة أي متجر حتى الآن.' : 'You haven\'t invited any stores yet.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

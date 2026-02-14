"use client";

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Plus, Pencil, Trash2, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface PaymentWallet {
    id: string;
    number: string;
    name: string;
    name_ar: string;
    active: boolean;
}

export function AdminWalletSettings() {
    const { language } = useLanguage();
    const { toast } = useToast();
    const supabase = createClient();

    const [wallets, setWallets] = useState<PaymentWallet[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingWallet, setEditingWallet] = useState<PaymentWallet | null>(null);
    const [formData, setFormData] = useState({
        number: '',
        name: '',
        name_ar: '',
        active: true
    });

    useEffect(() => {
        fetchWallets();
    }, []);

    const fetchWallets = async () => {
        try {
            const { data, error } = await supabase.rpc('get_setting', { setting_key: 'payment_wallets' });
            if (error) throw error;
            setWallets(data?.wallets || []);
        } catch (error) {
            console.error('Error fetching wallets:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveWallets = async (updatedWallets: PaymentWallet[]) => {
        try {
            await supabase.rpc('set_setting', {
                setting_key: 'payment_wallets',
                setting_value: { wallets: updatedWallets },
                setting_description: 'Payment wallet numbers for manual recharge'
            });

            toast({
                title: language === 'ar' ? '✅ تم الحفظ' : '✅ Saved Successfully',
                description: language === 'ar' ? 'تم تحديث إعدادات المحفظة' : 'Wallet settings updated',
            });

            fetchWallets();
        } catch (error: any) {
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: error.message,
                variant: 'destructive'
            });
        }
    };

    const handleAdd = () => {
        if (!formData.number || !formData.name) {
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: language === 'ar' ? 'الرجاء ملء جميع الحقول' : 'Please fill all fields',
                variant: 'destructive'
            });
            return;
        }

        const newWallet: PaymentWallet = {
            id: Date.now().toString(),
            ...formData
        };

        saveWallets([...wallets, newWallet]);
        setDialogOpen(false);
        setFormData({ number: '', name: '', name_ar: '', active: true });
    };

    const handleEdit = (wallet: PaymentWallet) => {
        setEditingWallet(wallet);
        setFormData({
            number: wallet.number,
            name: wallet.name,
            name_ar: wallet.name_ar,
            active: wallet.active
        });
        setDialogOpen(true);
    };

    const handleUpdate = () => {
        if (!editingWallet) return;

        const updatedWallets = wallets.map(w =>
            w.id === editingWallet.id ? { ...editingWallet, ...formData } : w
        );

        saveWallets(updatedWallets);
        setDialogOpen(false);
        setEditingWallet(null);
        setFormData({ number: '', name: '', name_ar: '', active: true });
    };

    const handleDelete = (id: string) => {
        const updatedWallets = wallets.filter(w => w.id !== id);
        saveWallets(updatedWallets);
    };

    const toggleActive = (id: string) => {
        const updatedWallets = wallets.map(w =>
            w.id === id ? { ...w, active: !w.active } : w
        );
        saveWallets(updatedWallets);
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="w-5 h-5" />
                                {language === 'ar' ? 'إعدادات محافظ الدفع' : 'Payment Wallet Settings'}
                            </CardTitle>
                            <CardDescription>
                                {language === 'ar'
                                    ? 'إدارة أرقام المحافظ المستخدمة في طلبات الشحن'
                                    : 'Manage wallet numbers used for recharge requests'}
                            </CardDescription>
                        </div>
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => { setEditingWallet(null); setFormData({ number: '', name: '', name_ar: '', active: true }); }}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    {language === 'ar' ? 'إضافة محفظة' : 'Add Wallet'}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingWallet
                                            ? (language === 'ar' ? 'تعديل المحفظة' : 'Edit Wallet')
                                            : (language === 'ar' ? 'إضافة محفظة جديدة' : 'Add New Wallet')}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {language === 'ar' ? 'أدخل معلومات المحفظة' : 'Enter wallet information'}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label>{language === 'ar' ? 'رقم المحفظة' : 'Wallet Number'}</Label>
                                        <Input
                                            value={formData.number}
                                            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                            placeholder="+201003705046"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div>
                                        <Label>{language === 'ar' ? 'الاسم (English)' : 'Name (English)'}</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Primary Wallet"
                                        />
                                    </div>
                                    <div>
                                        <Label>{language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                                        <Input
                                            value={formData.name_ar}
                                            onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                                            placeholder="المحفظة الأساسية"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>{language === 'ar' ? 'مفعّلة' : 'Active'}</Label>
                                        <Switch
                                            checked={formData.active}
                                            onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={editingWallet ? handleUpdate : handleAdd}>
                                        {editingWallet
                                            ? (language === 'ar' ? 'تحديث' : 'Update')
                                            : (language === 'ar' ? 'إضافة' : 'Add')}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {wallets.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {language === 'ar' ? 'لا توجد محافظ مُعدة' : 'No wallets configured'}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                                    <TableHead>{language === 'ar' ? 'الرقم' : 'Number'}</TableHead>
                                    <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                                    <TableHead className="text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {wallets.map((wallet) => (
                                    <TableRow key={wallet.id}>
                                        <TableCell className="font-medium">
                                            {language === 'ar' ? wallet.name_ar : wallet.name}
                                        </TableCell>
                                        <TableCell className="font-mono" dir="ltr">{wallet.number}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={wallet.active}
                                                    onCheckedChange={() => toggleActive(wallet.id)}
                                                />
                                                <Badge variant={wallet.active ? 'default' : 'secondary'}>
                                                    {wallet.active
                                                        ? (language === 'ar' ? 'مفعّلة' : 'Active')
                                                        : (language === 'ar' ? 'معطّلة' : 'Inactive')}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="icon" onClick={() => handleEdit(wallet)}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button variant="destructive" size="icon" onClick={() => handleDelete(wallet.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

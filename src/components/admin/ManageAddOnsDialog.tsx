"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ManageAddOnsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    storeId: string;
    storeName: string;
}

export function ManageAddOnsDialog({ open, onOpenChange, storeId, storeName }: ManageAddOnsDialogProps) {
    const { language } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [storeAddOns, setStoreAddOns] = useState<any[]>([]);
    const [availableAddOns, setAvailableAddOns] = useState<any[]>([]);
    const [selectedAddOnId, setSelectedAddOnId] = useState<string>('');
    const [processing, setProcessing] = useState(false);
    
    const supabase = createClient();

    const fetchData = async () => {
        if (!storeId) return;
        setLoading(true);
        
        // 1. Fetch current store add-ons
        const { data: current, error: curError } = await supabase
            .from('store_add_ons')
            .select('*, add_on:add_ons(*)')
            .eq('store_id', storeId);
            
        if (curError) toast.error(curError.message);
        else setStoreAddOns(current || []);

        // 2. Fetch all available add-ons
        const { data: available, error: availError } = await supabase
            .from('add_ons')
            .select('*')
            .eq('is_active', true);

        if (availError) toast.error(availError.message);
        else setAvailableAddOns(available || []);

        setLoading(false);
    };

    useEffect(() => {
        if (open) fetchData();
    }, [open, storeId]);

    const handleAdd = async () => {
        if (!selectedAddOnId) return;
        setProcessing(true);
        
        const { error } = await supabase
            .from('store_add_ons')
            .insert([{ store_id: storeId, add_on_id: selectedAddOnId, status: 'active' }]);

        if (error) {
            if (error.code === '23505') toast.error(language === 'ar' ? 'هذا المتجر يمتلك هذه الخدمة بالفعل' : 'Store already has this add-on');
            else toast.error(error.message);
        } else {
            toast.success(language === 'ar' ? 'تم تفعيل الخدمة بنجاح' : 'Add-on activated');
            fetchData();
        }
        setProcessing(false);
    };

    const handleRemove = async (id: string) => {
        if (!confirm(language === 'ar' ? 'هل أنت متأكد من إزالة هذه الخدمة؟' : 'Are you sure you want to remove this add-on?')) return;
        setProcessing(true);
        
        const { error } = await supabase
            .from('store_add_ons')
            .delete()
            .eq('id', id);

        if (error) toast.error(error.message);
        else {
            toast.success(language === 'ar' ? 'تمت إزالة الخدمة' : 'Add-on removed');
            fetchData();
        }
        setProcessing(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <DialogTitle>{language === 'ar' ? 'إدارة الخدمات الإضافية' : 'Manage Add-ons'}</DialogTitle>
                    </div>
                    <DialogDescription>
                        {language === 'ar' ? `تفعيل أو إزالة خدمات لمتجر: ${storeName}` : `Activate or remove services for: ${storeName}`}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Current Add-ons List */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">{language === 'ar' ? 'الخدمات الحالية' : 'Current Services'}</h4>
                        {loading ? (
                            <div className="flex justify-center py-4"><Loader2 className="animate-spin h-5 w-5" /></div>
                        ) : storeAddOns.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic text-center py-4">
                                {language === 'ar' ? 'لا يوجد خدمات مفعلة حالياً' : 'No active services'}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {storeAddOns.map(sao => (
                                    <div key={sao.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                                        <div>
                                            <div className="text-sm font-medium">
                                                {language === 'ar' ? sao.add_on?.name_ar : sao.add_on?.name_en}
                                            </div>
                                            <div className="text-xs text-muted-foreground">{sao.add_on?.feature_id}</div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-destructive h-8 w-8" 
                                            onClick={() => handleRemove(sao.id)}
                                            disabled={processing}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <hr />

                    {/* Add New Add-on */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">{language === 'ar' ? 'تفعيل خدمة جديدة (هدية)' : 'Activate New Service (Gift)'}</h4>
                        <div className="flex gap-2">
                            <Select value={selectedAddOnId} onValueChange={setSelectedAddOnId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={language === 'ar' ? 'اختر الخدمة' : 'Select Service'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableAddOns.map(ao => (
                                        <SelectItem key={ao.id} value={ao.id}>
                                            {language === 'ar' ? ao.name_ar : ao.name_en} (${ao.price})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleAdd} disabled={!selectedAddOnId || processing}>
                                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{language === 'ar' ? 'إغلاق' : 'Close'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

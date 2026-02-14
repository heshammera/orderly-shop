"use client";

import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertTriangle } from 'lucide-react';

interface Store {
    id: string;
    name: string;
    status: string;
}

interface ConflictData {
    type: string;
    current_count: number;
    new_limit: number;
    stores: Store[];
}

interface DowngradeConflictModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (keepStoreIds: string[]) => void;
    conflict: ConflictData | null;
}

export default function DowngradeConflictModal({ isOpen, onClose, onConfirm, conflict }: DowngradeConflictModalProps) {
    const { language } = useLanguage();
    const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

    // Reset selection when conflict data changes
    useEffect(() => {
        if (conflict && isOpen) {
            // Pre-select up to the limit?
            // Better to select the first N active stores + current store if possible.
            // But simplify: let user choose.
            // Or select none? Let's select the first N to be helpful.
            if (conflict.stores && conflict.new_limit > 0) {
                const activeStores = conflict.stores.filter(s => s.status === 'active');
                const initialSelection = activeStores.slice(0, conflict.new_limit).map(s => s.id);
                setSelectedStoreIds(initialSelection);
            } else {
                setSelectedStoreIds([]);
            }
        }
    }, [conflict, isOpen]);

    const handleToggle = (storeId: string) => {
        if (selectedStoreIds.includes(storeId)) {
            setSelectedStoreIds(prev => prev.filter(id => id !== storeId));
        } else {
            if (conflict && selectedStoreIds.length >= conflict.new_limit) {
                // Don't allow adding more than limit
                return;
            }
            setSelectedStoreIds(prev => [...prev, storeId]);
        }
    };

    if (!conflict) return null;

    const limit = conflict.new_limit;
    const remaining = limit - selectedStoreIds.length;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-5 w-5" />
                        {language === 'ar' ? 'تجاوز حد المتاجر' : 'Store Limit Exceeded'}
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        {language === 'ar'
                            ? `الباقة الجديدة تدعم ${limit} متجر فقط، بينما لديك ${conflict.current_count} متجر نشط. يرجى اختيار المتاجر التي تريد الاحتفاظ بها، وسيتم تعليق الباقي مؤقتاً.`
                            : `The new plan supports only ${limit} store(s), but you have ${conflict.current_count} active stores. Please select which stores to keep active. The rest will be suspended.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                        {language === 'ar'
                            ? `يمكنك اختيار ${remaining} متجر إضافي.`
                            : `You can select ${remaining} more store(s).`}
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {conflict.stores.map((store) => (
                            <div key={store.id} className="flex items-start space-x-3 space-x-reverse rounded-md border p-3 hover:bg-accent/50 cursor-pointer" onClick={() => handleToggle(store.id)}>
                                <Checkbox
                                    id={`store-${store.id}`}
                                    checked={selectedStoreIds.includes(store.id)}
                                    // Make checkbox visual only since parent div handles click for better UX
                                    className="mt-1"
                                />
                                <div className="grid gap-1.5 leading-none w-full">
                                    <Label htmlFor={`store-${store.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                        {store.name}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {language === 'ar' ? 'الحالة الحالية: ' : 'Current Status: '}
                                        <span className={store.status === 'active' ? 'text-green-600' : 'text-gray-500'}>
                                            {store.status}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="sm:justify-start">
                    <Button
                        type="button"
                        variant="default"
                        className="w-full"
                        disabled={selectedStoreIds.length === 0} // Must select at least one if limit > 0? Maybe they want 0? Usually 1.
                        onClick={() => onConfirm(selectedStoreIds)}
                    >
                        {language === 'ar' ? 'تأكيد وحفظ التغييرات' : 'Confirm & Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

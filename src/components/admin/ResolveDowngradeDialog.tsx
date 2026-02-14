"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface Store {
    id: string;
    name: string;
    status: string;
}

interface ResolveDowngradeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    conflict: {
        stores: Store[];
        new_limit: number;
        current_count: number;
    } | null;
    onConfirm: (keepStoreIds: string[]) => void;
    loading?: boolean;
}

export function ResolveDowngradeDialog({
    open,
    onOpenChange,
    conflict,
    onConfirm,
    loading = false
}: ResolveDowngradeDialogProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Reset selection when conflict changes or opens
    useEffect(() => {
        if (open && conflict) {
            // Auto-select up to limit? Or let user choose entirely?
            // Let's auto-select the first N active stores to be helpful
            const limit = Math.max(0, conflict.new_limit);
            const initialSelection = conflict.stores
                .filter(s => s.status === 'active')
                .slice(0, limit)
                .map(s => s.id);

            // If we still have room, add others
            if (initialSelection.length < limit) {
                const remaining = conflict.stores
                    .filter(s => !initialSelection.includes(s.id))
                    .slice(0, limit - initialSelection.length)
                    .map(s => s.id);
                initialSelection.push(...remaining);
            }

            setSelectedIds(initialSelection);
        }
    }, [open, conflict]);

    if (!conflict) return null;

    const limit = Math.max(0, conflict.new_limit);
    const selectedCount = selectedIds.length;
    const isOverLimit = selectedCount > limit;

    const handleToggle = (storeId: string) => {
        if (selectedIds.includes(storeId)) {
            setSelectedIds(prev => prev.filter(id => id !== storeId));
        } else {
            if (selectedCount >= limit && limit !== -1) {
                // Should we prevent selection? Or just show error?
                // Let's prevent for better UX usually, unless it's clearer to show error.
                // Let's prevent for now.
                return;
            }
            setSelectedIds(prev => [...prev, storeId]);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="w-5 h-5" />
                        Plan Limit Conflict
                    </DialogTitle>
                    <DialogDescription>
                        The new plan only allows <strong>{limit}</strong> store(s), but this user currently has <strong>{conflict.current_count}</strong> active store(s).
                    </DialogDescription>
                </DialogHeader>

                <Alert variant="destructive" className="my-2">
                    <AlertTitle>Action Required</AlertTitle>
                    <AlertDescription>
                        Please select which stores to keep <strong>Active</strong>. All unselected stores will be <strong>Suspended</strong>.
                    </AlertDescription>
                </Alert>

                <div className="text-sm font-medium mb-2">
                    Selected: {selectedCount} / {limit}
                </div>

                <ScrollArea className="h-[200px] border rounded-md p-4">
                    <div className="space-y-3">
                        {conflict.stores.map((store) => (
                            <div key={store.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={store.id}
                                    checked={selectedIds.includes(store.id)}
                                    onCheckedChange={() => handleToggle(store.id)}
                                    disabled={loading || (!selectedIds.includes(store.id) && selectedCount >= limit && limit !== -1)}
                                />
                                <Label htmlFor={store.id} className="flex flex-col cursor-pointer">
                                    <span className="font-medium">{store.name}</span>
                                    <span className={`text-xs ${store.status === 'active' ? 'text-green-600' : 'text-muted-foreground'}`}>
                                        {store.status}
                                    </span>
                                </Label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onConfirm(selectedIds)}
                        disabled={loading || selectedCount === 0 || (selectedCount > limit && limit !== -1)}
                        variant="destructive"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Suspend Others'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

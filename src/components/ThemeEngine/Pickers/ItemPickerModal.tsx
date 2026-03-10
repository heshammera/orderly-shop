import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface PickerItem {
    id: string;
    name?: string;
    title?: string;
    image_url?: string;
}

interface ItemPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: PickerItem) => void;
    type: 'product' | 'category';
    storeId?: string; // Optional for the test page, required in real usage
}

export default function ItemPickerModal({ isOpen, onClose, onSelect, type, storeId }: ItemPickerModalProps) {
    const [items, setItems] = useState<PickerItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        fetchItems();
    }, [isOpen, type, storeId]);

    const fetchItems = async () => {
        if (!storeId) {
            setItems([]);
            return;
        }

        // Real Supabase Fetching
        setLoading(true);
        try {
            const supabase = createClient();
            const table = type === 'product' ? 'products' : 'categories';
            const selectCols = type === 'product' ? 'id, name, images' : 'id, name';

            const { data, error } = await supabase
                .from(table)
                .select(selectCols)
                .eq('store_id', storeId)
                .limit(50);

            if (error) throw error;

            const mappedData: PickerItem[] = (data || []).map((item: any) => {
                let displayName = 'Unnamed';

                if (type === 'category') {
                    displayName = item.name;
                    try {
                        if (typeof item.name === 'string' && item.name.startsWith('{')) {
                            const parsed = JSON.parse(item.name);
                            displayName = parsed.ar || parsed.en || item.name;
                        } else if (typeof item.name === 'object' && item.name !== null) {
                            displayName = item.name.ar || item.name.en || 'Unnamed';
                        }
                    } catch (e) {
                        // keep original string
                    }
                } else {
                    // product
                    displayName = item.name;
                    try {
                        if (typeof item.name === 'string' && item.name.startsWith('{')) {
                            const parsed = JSON.parse(item.name);
                            displayName = parsed.ar || parsed.en || item.name;
                        } else if (typeof item.name === 'object' && item.name !== null) {
                            displayName = item.name.ar || item.name.en || 'Unnamed';
                        }
                    } catch (e) {
                        // keep original string
                    }
                }

                // Parse images for products
                let imageUrl = undefined;
                if (type === 'product' && item.images) {
                    try {
                        const parsedImages = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
                        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                            imageUrl = parsedImages[0];
                        }
                    } catch (e) {
                        // ignore error
                    }
                }

                return {
                    id: item.id,
                    name: displayName,
                    title: displayName,
                    image_url: imageUrl
                };
            });

            setItems(mappedData);
        } catch (error) {
            console.error(`Error fetching ${type}s:`, error);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item => {
        const name = item.title || item.name || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden" dir="rtl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-xl font-bold">اختيار {type === 'product' ? 'منتج' : 'تصنيف'}</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-border bg-muted/20">
                    <input
                        type="text"
                        placeholder="البحث بالاسم..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border rounded-md p-2 bg-background"
                    />
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <div className="text-center text-muted-foreground py-8 animate-pulse">جاري التحميل...</div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">لا توجد نتائج مطابقة للبحث.</div>
                    ) : (
                        filteredItems.map(item => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    onSelect(item);
                                    onClose();
                                }}
                                className="flex items-center gap-4 p-3 rounded-lg border border-transparent hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-colors"
                            >
                                <div className="w-12 h-12 rounded bg-muted overflow-hidden shrink-0">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.title || item.name || 'صورة'} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">صورة</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm truncate">{item.title || item.name || 'بدون اسم'}</h4>
                                    <span className="text-xs text-muted-foreground font-mono">{item.id}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import { hslToHex, hexToHsl } from '@/lib/color-utils';
import ItemPickerModal from '@/components/ThemeEngine/Pickers/ItemPickerModal';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ImagePlus, Link as LinkIcon, Box, Tags, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SchemaSetting {
    type: string;
    id: string;
    label: string;
    default?: string;
    options?: { value: string; label: string }[];
}

interface SchemaBlock {
    type: string;
    name: string;
    settings: SchemaSetting[];
}

interface Schema {
    name: string;
    settings: SchemaSetting[];
    blocks?: SchemaBlock[];
}

interface SidebarFormProps {
    sectionId: string;
    schema: Schema;
    settings: Record<string, any>;
    blocks?: any[];
    onChange: (sectionId: string, key: string, value: any) => void;
    onBlockChange?: (sectionId: string, blockIndex: number, key: string, value: any) => void;
    onAddBlock?: (sectionId: string, blockType: string) => void;
    onRemoveBlock?: (sectionId: string, blockIndex: number) => void;
    onReorderBlocks?: (sectionId: string, oldIndex: number, newIndex: number) => void;
    onColorChange: (colorToken: string, value: string) => void;
    globalTokens: Record<string, string>;
}

// Sortable block item wrapper
function SortableBlockItem({ id, children }: { id: string; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto' as any,
    };
    return (
        <div ref={setNodeRef} style={style} className="relative">
            <div {...attributes} {...listeners} className="absolute top-3 right-3 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-100 z-10" title="اسحب لإعادة الترتيب">
                <GripVertical className="w-4 h-4 text-slate-400" />
            </div>
            {children}
        </div>
    );
}

export default function SidebarForm({
    sectionId,
    schema,
    settings,
    blocks,
    onChange,
    onBlockChange,
    onAddBlock,
    onRemoveBlock,
    onReorderBlocks,
    onColorChange,
    globalTokens
}: SidebarFormProps) {
    const [openPicker, setOpenPicker] = useState<{ type: 'product' | 'category', blockIndex: number, settingId: string, isUrlParam?: boolean } | null>(null);
    const [uploadingImage, setUploadingImage] = useState<{ sectionId: string, blockIndex?: number, settingId: string } | null>(null);

    const supabase = createClient();

    const blockSensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Generate stable IDs for blocks
    const blockIds = (blocks || []).map((_: any, i: number) => `block-${sectionId}-${i}`);

    const handleBlockDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = blockIds.indexOf(active.id as string);
            const newIndex = blockIds.indexOf(over.id as string);
            if (onReorderBlocks) {
                onReorderBlocks(sectionId, oldIndex, newIndex);
            }
        }
    };

    const getHexFromToken = (hslStr: string) => {
        try {
            if (hslStr?.startsWith('#')) return hslStr;
            return hslToHex(hslStr);
        } catch (e) {
            return '#000000';
        }
    };

    const setHexToToken = (key: string, hexStr: string) => {
        try {
            const hsl = hexToHsl(hexStr);
            onColorChange(key, hsl);
        } catch (e) {
            onColorChange(key, hexStr);
        }
    };

    const handleAddBlock = (blockType: string) => {
        if (!onAddBlock || !schema.blocks || schema.blocks.length === 0) return;
        onAddBlock(sectionId, blockType);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, settingId: string, blockIndex?: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage({ sectionId, blockIndex, settingId });

        try {
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            const fileName = `${timestamp}-${randomSuffix}-${file.name.replace(/\s/g, '_')}`;
            const filePath = `theme-uploads/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products') // using existing public bucket
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            if (blockIndex !== undefined && onBlockChange) {
                onBlockChange(sectionId, blockIndex, settingId, publicUrl);
            } else {
                onChange(sectionId, settingId, publicUrl);
            }

            toast.success('تم رفع الصورة بنجاح');
        } catch (error: any) {
            console.error('Upload Error:', error);
            toast.error('فشل رفع الصورة');
        } finally {
            setUploadingImage(null);
            e.target.value = '';
        }
    };

    return (
        <div className="flex flex-col gap-8 shrink-0 w-full">
            {/* Current Section Settings */}
            <div className="bg-card text-card-foreground p-4 rounded-lg shadow-sm border border-border">
                <h3 className="font-bold text-lg mb-4 border-b pb-2">إعدادات القسم: {schema.name}</h3>

                <div className="space-y-4">
                    {schema.settings.map((setting) => {
                        const val = settings[setting.id] !== undefined ? settings[setting.id] : setting.default || '';

                        return (
                            <div key={setting.id}>
                                <label className="block text-sm font-medium mb-1">{setting.label}</label>

                                {setting.type === 'text' && (
                                    <input
                                        type="text"
                                        value={val}
                                        onChange={(e) => onChange(sectionId, setting.id, e.target.value)}
                                        className="w-full border rounded p-2 text-sm bg-background text-foreground"
                                    />
                                )}

                                {setting.type === 'url' && (
                                    <div className="space-y-2">
                                        <input
                                            type="url"
                                            value={val}
                                            onChange={(e) => onChange(sectionId, setting.id, e.target.value)}
                                            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary outline-none transition-shadow text-left"
                                            dir="ltr"
                                            placeholder="https://..."
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setOpenPicker({ type: 'product', blockIndex: -1, settingId: setting.id, isUrlParam: true })}
                                                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded text-xs font-semibold transition-colors border shadow-sm"
                                            >
                                                <Box className="w-3.5 h-3.5" /> منتج
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setOpenPicker({ type: 'category', blockIndex: -1, settingId: setting.id, isUrlParam: true })}
                                                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded text-xs font-semibold transition-colors border shadow-sm"
                                            >
                                                <Tags className="w-3.5 h-3.5" /> قسم
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {setting.type === 'image_picker' && (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                value={val}
                                                onChange={(e) => onChange(sectionId, setting.id, e.target.value)}
                                                placeholder="رابط الصورة (URL)"
                                                className="flex-1 border border-input rounded p-2 text-sm bg-background focus:ring-1 focus:ring-primary outline-none"
                                                dir="ltr"
                                            />
                                            <label className={`shrink-0 flex items-center justify-center bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-2 rounded font-medium text-sm transition-colors border shadow-sm cursor-pointer ${(uploadingImage?.sectionId === sectionId && uploadingImage.settingId === setting.id && uploadingImage.blockIndex === undefined) ? 'opacity-50 pointer-events-none' : ''}`}>
                                                {uploadingImage?.sectionId === sectionId && uploadingImage.settingId === setting.id && uploadingImage.blockIndex === undefined ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleImageUpload(e, setting.id)}
                                                />
                                            </label>
                                        </div>
                                        {val && (
                                            <div className="relative w-full aspect-video rounded-md border border-border overflow-hidden bg-slate-100 group">
                                                <img src={val} alt="Preview" className="object-cover w-full h-full" />
                                                <button
                                                    onClick={() => onChange(sectionId, setting.id, '')}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                                >
                                                    إزالة
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {setting.type === 'boolean' && (
                                    <label className="flex items-center gap-3 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={val === true || val === 'true'}
                                            onChange={(e) => onChange(sectionId, setting.id, e.target.checked)}
                                            className="w-5 h-5 rounded border-2 border-input text-primary focus:ring-primary/30 cursor-pointer"
                                        />
                                        <span className="text-sm text-muted-foreground">{val === true || val === 'true' ? 'مفعّل' : 'معطّل'}</span>
                                    </label>
                                )}

                                {setting.type === 'textarea' && (
                                    <textarea
                                        value={val}
                                        onChange={(e) => onChange(sectionId, setting.id, e.target.value)}
                                        className="w-full border rounded p-2 text-sm bg-background text-foreground min-h-[80px] resize-y"
                                        rows={3}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Blocks Management */}
                {schema.blocks && schema.blocks.length > 0 && (
                    <div className="mt-8 border-t border-border pt-6">
                        <h4 className="font-bold text-md mb-4 flex items-center justify-between">
                            <span>العناصر (Blocks)</span>
                            <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">{blocks?.length || 0}</span>
                        </h4>

                        <DndContext sensors={blockSensors} collisionDetection={closestCenter} onDragEnd={handleBlockDragEnd}>
                            <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
                                <div className="flex flex-col gap-4 mb-4">
                                    {blocks?.map((block: any, index: number) => {
                                        const blockSchema = schema.blocks?.find(b => b.type === block.type);
                                        if (!blockSchema) return null;

                                        return (
                                            <SortableBlockItem key={blockIds[index]} id={blockIds[index]}>
                                                <div className="border border-border rounded-md p-4 pr-10 bg-card shadow-sm flex flex-col gap-3 group transition-colors hover:border-primary/30">
                                                    <div className="flex justify-between items-center border-b border-border/50 pb-2">
                                                        <span className="font-semibold text-sm text-primary">{blockSchema.name} {index + 1}</span>
                                                        <button
                                                            onClick={() => onRemoveBlock && onRemoveBlock(sectionId, index)}
                                                            className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors"
                                                        >
                                                            حذف
                                                        </button>
                                                    </div>

                                                    <div className="flex flex-col gap-3">
                                                        {blockSchema.settings.map((setting) => {
                                                            const val = block.settings?.[setting.id] !== undefined ? block.settings[setting.id] : setting.default || '';

                                                            return (
                                                                <div key={setting.id} className="flex flex-col gap-1.5">
                                                                    <label className="text-xs font-semibold text-muted-foreground">{setting.label}</label>

                                                                    {setting.type === 'text' && (
                                                                        <input
                                                                            type="text"
                                                                            value={val}
                                                                            onChange={(e) => onBlockChange && onBlockChange(sectionId, index, setting.id, e.target.value)}
                                                                            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary outline-none transition-shadow"
                                                                        />
                                                                    )}

                                                                    {setting.type === 'select' && (
                                                                        <select
                                                                            value={val}
                                                                            onChange={(e) => onBlockChange && onBlockChange(sectionId, index, setting.id, e.target.value)}
                                                                            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary outline-none transition-shadow cursor-pointer"
                                                                        >
                                                                            {(setting.options || []).map((opt) => (
                                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                            ))}
                                                                        </select>
                                                                    )}

                                                                    {setting.type === 'boolean' && (
                                                                        <label className="flex items-center gap-3 cursor-pointer select-none">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={val === true || val === 'true'}
                                                                                onChange={(e) => onBlockChange && onBlockChange(sectionId, index, setting.id, e.target.checked)}
                                                                                className="w-5 h-5 rounded border-2 border-input text-primary focus:ring-primary/30 cursor-pointer"
                                                                            />
                                                                            <span className="text-sm text-muted-foreground">{val === true || val === 'true' ? 'مفعّل' : 'معطّل'}</span>
                                                                        </label>
                                                                    )}

                                                                    {setting.type === 'url' && (
                                                                        <div className="space-y-2">
                                                                            <input
                                                                                type="url"
                                                                                value={val}
                                                                                onChange={(e) => onBlockChange && onBlockChange(sectionId, index, setting.id, e.target.value)}
                                                                                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary outline-none transition-shadow text-left"
                                                                                dir="ltr"
                                                                                placeholder="https://..."
                                                                            />
                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setOpenPicker({ type: 'product', blockIndex: index, settingId: setting.id, isUrlParam: true })}
                                                                                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded text-xs font-semibold transition-colors border shadow-sm"
                                                                                >
                                                                                    <Box className="w-3.5 h-3.5" /> منتج
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setOpenPicker({ type: 'category', blockIndex: index, settingId: setting.id, isUrlParam: true })}
                                                                                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded text-xs font-semibold transition-colors border shadow-sm"
                                                                                >
                                                                                    <Tags className="w-3.5 h-3.5" /> قسم
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {setting.type === 'image_picker' && (
                                                                        <div className="space-y-2">
                                                                            <div className="flex gap-2">
                                                                                <input
                                                                                    type="url"
                                                                                    placeholder="رابط الصورة (URL)"
                                                                                    value={val}
                                                                                    onChange={(e) => onBlockChange && onBlockChange(sectionId, index, setting.id, e.target.value)}
                                                                                    className="flex-1 border border-input rounded-md px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary outline-none transition-shadow text-left"
                                                                                    dir="ltr"
                                                                                />
                                                                                <label className={`shrink-0 flex items-center justify-center bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 rounded font-medium text-sm transition-colors border shadow-sm cursor-pointer ${(uploadingImage?.sectionId === sectionId && uploadingImage.settingId === setting.id && uploadingImage.blockIndex === index) ? 'opacity-50 pointer-events-none' : ''}`}>
                                                                                    {uploadingImage?.sectionId === sectionId && uploadingImage.settingId === setting.id && uploadingImage.blockIndex === index ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                                                                                    <input
                                                                                        type="file"
                                                                                        accept="image/*"
                                                                                        className="hidden"
                                                                                        onChange={(e) => handleImageUpload(e, setting.id, index)}
                                                                                    />
                                                                                </label>
                                                                            </div>
                                                                            {val && (
                                                                                <div className="relative w-full h-24 rounded border overflow-hidden bg-slate-100 group">
                                                                                    <img src={val} alt="Preview" className="object-cover w-full h-full" />
                                                                                    <button
                                                                                        onClick={() => onBlockChange && onBlockChange(sectionId, index, setting.id, '')}
                                                                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                                                                    >
                                                                                        حذف
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* Product & Category Pickers */}
                                                                    {setting.type === 'product' && (
                                                                        <div className="flex border border-input rounded-md px-2 py-1.5 text-sm bg-background items-center justify-between group-hover:border-primary/40 transition-colors min-h-[40px]">
                                                                            <span className="truncate text-foreground font-medium pl-2">{val ? `${val}` : 'مرتبط بـ (بدون منتج)'}</span>
                                                                            <button
                                                                                className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-3 py-1 rounded text-xs font-bold transition-colors whitespace-nowrap"
                                                                                onClick={() => setOpenPicker({ type: 'product', blockIndex: index, settingId: setting.id })}
                                                                            >اختيار</button>
                                                                        </div>
                                                                    )}

                                                                    {setting.type === 'category' && (
                                                                        <div className="flex border border-input rounded-md px-2 py-1.5 text-sm bg-background items-center justify-between group-hover:border-primary/40 transition-colors min-h-[40px]">
                                                                            <span className="truncate text-foreground font-medium pl-2">{val ? `${val}` : 'مرتبط بـ (بدون قسم)'}</span>
                                                                            <button
                                                                                className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-3 py-1 rounded text-xs font-bold transition-colors whitespace-nowrap"
                                                                                onClick={() => setOpenPicker({ type: 'category', blockIndex: index, settingId: setting.id })}
                                                                            >اختيار</button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </SortableBlockItem>
                                        );
                                    })}
                                </div>
                            </SortableContext>
                        </DndContext>

                        {schema.blocks.length > 1 ? (
                            <div className="flex flex-col relative mt-2 pt-4 border-t border-border/50">
                                <div className="text-sm font-bold text-foreground mb-3 text-center">إضافة عنصر جديد:</div>
                                <div className="flex flex-col gap-2">
                                    {schema.blocks.map((block, idx) => (
                                        <button
                                            key={block.type + idx}
                                            onClick={() => handleAddBlock(block.type)}
                                            className="w-full bg-white text-slate-700 hover:bg-slate-50 hover:text-primary py-2.5 rounded-md font-semibold text-xs transition-colors border border-slate-200 shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                            {block.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => handleAddBlock(schema.blocks![0].type)}
                                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 py-3 rounded-md font-bold text-sm transition-colors border border-border shadow-sm flex items-center justify-center gap-2 mt-4"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                إضافة {schema.blocks[0].name}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Picker Modal */}
            <ItemPickerModal
                isOpen={openPicker !== null}
                onClose={() => setOpenPicker(null)}
                type={openPicker?.type || 'product'}
                onSelect={(item) => {
                    if (openPicker) {
                        const path = openPicker.type === 'product' ? `/products/${item.id}` : `/categories/${item.id}`;

                        if (openPicker.blockIndex === -1) {
                            // Section-level setting
                            if (openPicker.isUrlParam) {
                                onChange(sectionId, openPicker.settingId, path);
                            } else {
                                onChange(sectionId, openPicker.settingId, item.id);
                            }
                        } else if (onBlockChange) {
                            // Block-level setting
                            if (openPicker.isUrlParam) {
                                onBlockChange(sectionId, openPicker.blockIndex, openPicker.settingId, path);
                            } else {
                                onBlockChange(sectionId, openPicker.blockIndex, openPicker.settingId, item.id);

                                const blockSchema = schema.blocks?.find(b => b.type === blocks?.[openPicker.blockIndex]?.type);
                                if (blockSchema) {
                                    if (item.image_url && blockSchema.settings.some(s => s.id === 'image_url')) {
                                        onBlockChange(sectionId, openPicker.blockIndex, 'image_url', item.image_url);
                                    }
                                    if ((item.title || item.name) && blockSchema.settings.some(s => s.id === 'title')) {
                                        onBlockChange(sectionId, openPicker.blockIndex, 'title', item.title || item.name);
                                    }
                                }
                            }
                        }
                    }
                }}
            />
        </div>
    );
}

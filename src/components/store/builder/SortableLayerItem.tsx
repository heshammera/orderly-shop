"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import { ComponentSchema } from '@/lib/store-builder/types';

interface SortableLayerItemProps {
    section: ComponentSchema;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: (e: React.MouseEvent) => void;
}

export function SortableLayerItem({ section, index, isSelected, onSelect, onDelete }: SortableLayerItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`p-3 rounded-md border text-sm cursor-pointer transition-all group flex items-center gap-2 ${isSelected ? 'bg-primary/10 border-primary shadow-sm' : 'hover:bg-slate-50 hover:border-slate-300'
                } ${isDragging ? 'shadow-lg z-50' : ''}`}
            onClick={onSelect}
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity"
            >
                <GripVertical className="w-4 h-4" />
            </div>

            <div className="flex flex-col overflow-hidden flex-1">
                <div className="font-medium truncate">{section.type}</div>
                <div className="text-xs text-muted-foreground truncate">{section.id}</div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onDelete}
            >
                <Trash2 className="w-3 h-3" />
            </Button>
        </div>
    );
}

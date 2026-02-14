"use client";

import { ComponentSchema } from '@/lib/store-builder/types';
import { Trash2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SectionControlsProps {
    section: ComponentSchema;
    isFirst: boolean;
    isLast: boolean;
    onDelete: (id: string) => void;
    onMoveUp: (id: string) => void;
    onMoveDown: (id: string) => void;
    onSelect: (id: string) => void;
    isSelected: boolean;
}

export function SectionControls({
    section,
    isFirst,
    isLast,
    onDelete,
    onMoveUp,
    onMoveDown,
    onSelect,
    isSelected
}: SectionControlsProps) {
    return (
        <div
            className={`absolute -top-10 left-0 right-0 flex items-center justify-between gap-2 px-2 py-1 bg-primary text-primary-foreground rounded-t-md opacity-0 group-hover/section:opacity-100 transition-opacity z-10 ${isSelected ? 'opacity-100' : ''}`}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(section.id);
            }}
        >
            <div className="flex items-center gap-1">
                <GripVertical className="w-4 h-4 cursor-grab active:cursor-grabbing" />
                <span className="text-xs font-medium">{section.type}</span>
            </div>

            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-primary-foreground/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        onMoveUp(section.id);
                    }}
                    disabled={isFirst}
                >
                    <ArrowUp className="w-3 h-3" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-primary-foreground/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        onMoveDown(section.id);
                    }}
                    disabled={isLast}
                >
                    <ArrowDown className="w-3 h-3" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
                            onDelete(section.id);
                        }
                    }}
                >
                    <Trash2 className="w-3 h-3" />
                </Button>
            </div>
        </div>
    );
}

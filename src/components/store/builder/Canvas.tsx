"use client";

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { RenderEngine } from './RenderEngine';
import { PageSchema } from '@/lib/store-builder/types';
import { Monitor, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

import { CheckoutProvider } from '@/contexts/CheckoutContext';
import { CartProvider } from '@/contexts/CartContext';

interface CanvasProps {
    schema: PageSchema | null;
    storeId: string;
    onSelectComponent: (id: string | null) => void;
    selectedComponentId: string | null;
    onUpdate?: (id: string, content: any) => void;
    onDelete?: (id: string) => void;
    onMoveUp?: (id: string) => void;
    onMoveDown?: (id: string) => void;
    pageSlug?: string;
    store?: any; // Full store object for context
}

export function Canvas({ schema, storeId, onSelectComponent, selectedComponentId, onUpdate, onDelete, onMoveUp, onMoveDown, pageSlug, store }: CanvasProps) {
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const { setNodeRef } = useDroppable({
        id: 'canvas-droppable',
    });

    if (!schema) return null;

    const content = (
        <RenderEngine
            schema={schema}
            storeId={storeId}
            store={store}
            isEditable={true}
            onUpdate={onUpdate}
            onSelectComponent={onSelectComponent}
            selectedComponentId={selectedComponentId}
            onDelete={onDelete}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
        />
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden">
            {/* Toolbar */}
            <div className="h-10 border-b bg-white flex items-center justify-center gap-2 px-4 shadow-sm z-10">
                <Button
                    variant={viewMode === 'desktop' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('desktop')}
                >
                    <Monitor className="w-4 h-4" />
                </Button>
                <Button
                    variant={viewMode === 'mobile' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('mobile')}
                >
                    <Smartphone className="w-4 h-4" />
                </Button>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-100/50" onClick={() => onSelectComponent(null)}>
                <div
                    ref={setNodeRef}
                    className={cn(
                        "bg-white shadow-xl min-h-[800px] transition-all duration-300 ease-in-out relative origin-top",
                        viewMode === 'mobile' ? 'w-[375px] rounded-3xl border-8 border-slate-900 shadow-2xl' : 'w-full max-w-[1200px] rounded-sm'
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={cn("h-full bg-white", viewMode === 'mobile' ? 'rounded-2xl overflow-y-auto' : '')}>
                        {pageSlug === 'checkout' && store ? (
                            <CartProvider storeId={storeId}>
                                <CheckoutProvider store={store} isEditable={true}>
                                    {content}
                                </CheckoutProvider>
                            </CartProvider>
                        ) : (
                            content
                        )}

                        {/* Empty State / Droppable Hint */}
                        {schema.sections.length === 0 && (
                            <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed border-slate-200 m-8 rounded-lg">
                                Drag components here
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

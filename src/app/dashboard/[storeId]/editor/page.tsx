"use client";


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { PageSchema, DEFAULT_STORE_LAYOUT, ComponentSchema, COMPONENT_DEFAULTS, ComponentType } from '@/lib/store-builder/types';
import { StoreTemplate } from '@/lib/store-builder/templates';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Eye, ArrowLeft, Undo2, Redo2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor, DragStartEvent, closestCorners } from '@dnd-kit/core';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Canvas } from '@/components/store/builder/Canvas';
import { EditorSidebar } from '@/components/store/builder/EditorSidebar';
import { PropertiesPanel } from '@/components/store/builder/PropertiesPanel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EditorPage({ params }: { params: { storeId: string } }) {
    const { storeId } = params;
    const { language } = useLanguage();
    const router = useRouter();

    // State
    const [layout, setLayout] = useState<PageSchema | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
    const [store, setStore] = useState<any>(null); // Store full object
    const [pageSlug, setPageSlug] = useState<string>('home'); // 'home' or 'checkout'
    const [activeDragType, setActiveDragType] = useState<string | null>(null);

    const supabase = createClient();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [pageRes, storeRes] = await Promise.all([
                    supabase
                        .from('store_pages')
                        .select('content')
                        .eq('store_id', storeId)
                        .eq('slug', pageSlug)
                        .single(),
                    supabase
                        .from('stores')
                        .select('*') // Fetch all for context
                        .eq('id', storeId)
                        .single()
                ]);

                if (pageRes.data?.content) {
                    setLayout(pageRes.data.content);
                } else {
                    // Default layouts
                    if (pageSlug === 'checkout') {
                        // Default Checkout Layout
                        setLayout({
                            globalSettings: DEFAULT_STORE_LAYOUT.globalSettings,
                            sections: [
                                { ...COMPONENT_DEFAULTS['CheckoutHeader'], id: 'header-1' } as ComponentSchema,
                                { ...COMPONENT_DEFAULTS['CheckoutForm'], id: 'form-1' } as ComponentSchema,
                                { ...COMPONENT_DEFAULTS['OrderSummary'], id: 'summary-1' } as ComponentSchema,
                                { ...COMPONENT_DEFAULTS['TrustBadges'], id: 'badges-1' } as ComponentSchema,
                            ]
                        });
                    } else {
                        setLayout(DEFAULT_STORE_LAYOUT);
                    }
                }

                if (storeRes.data) {
                    setStore(storeRes.data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load editor data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [storeId, supabase, pageSlug]);

    // ... (handleSave - update slug to pageSlug)
    const handleSave = async (arg?: any) => {
        const retryCount = typeof arg === 'number' ? arg : 0;
        setSaving(true);
        let currentError: any = null;

        try {
            // Save to database
            const { error: upsertError } = await supabase
                .from('store_pages')
                .upsert({
                    store_id: storeId,
                    slug: pageSlug, // Use current pageSlug
                    content: layout,
                    is_published: true,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'store_id, slug' });

            if (upsertError) throw upsertError;

            // Force Next.js to revalidate
            if (store?.slug) {
                try {
                    const path = pageSlug === 'home' ? `/ s / ${store.slug} ` : ` / s / ${store.slug}/${pageSlug}`;
                    await fetch(`/api/revalidate?path=${path}`, { method: 'POST' });
                } catch (e) { }
            }

            router.refresh();
            toast.success(language === 'ar' ? 'تم الحفظ بنجاح!' : 'Saved successfully!');
        } catch (error: any) {
            // ... (error handling)
            currentError = error;
            console.error('Save error:', error);
            if (retryCount < 2) {
                setTimeout(() => handleSave(retryCount + 1), 1000);
                return;
            }
            toast.error(`Failed to save: ${error.message}`);
        } finally {
            if (retryCount >= 2 || !currentError) setSaving(false);
        }
    };

    // ... (handleDragStart, handleDragEnd etc - keep mostly same)
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        if (active.data.current?.isNew) {
            setActiveDragType(active.data.current.type);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragType(null);

        if (!over || !layout) return;

        if (active.data.current?.isNew && over.id === 'canvas-droppable') {
            const type = active.data.current.type as ComponentType;
            // Generate ID
            const newSection = {
                ...COMPONENT_DEFAULTS[type],
                id: `${type.toLowerCase()}-${Date.now()}`,
            } as ComponentSchema;

            // If adding generic component (RichText/Banner) to Checkout, it's allowed.
            // If adding Checkout specific to Home, Sidebar filtering prevents it.

            setLayout({
                ...layout,
                sections: [...layout.sections, newSection]
            });
            toast.success(`Added ${type}`);
            setSelectedComponentId(newSection.id);
        }
    };

    // ... (updateComponentSettings, updateComponentContent, updateGlobalSettings)
    const updateComponentSettings = (id: string, newSettings: any) => {
        if (!layout) return;
        const newSections = layout.sections.map(sec =>
            sec.id === id ? { ...sec, settings: { ...sec.settings, ...newSettings } } : sec
        );
        setLayout({ ...layout, sections: newSections });
    };

    const updateComponentContent = (id: string, newContent: any) => {
        if (!layout) return;
        const newSections = layout.sections.map(sec =>
            sec.id === id ? { ...sec, content: { ...sec.content, ...newContent } } : sec
        );
        setLayout({ ...layout, sections: newSections });
    };

    const updateGlobalSettings = (newGlobal: any) => {
        if (!layout) return;
        setLayout({ ...layout, globalSettings: newGlobal });
    };

    const deleteSection = (id: string) => {
        if (!layout) return;

        // Prevent deleting critical checkout components
        if (pageSlug === 'checkout') {
            const section = layout.sections.find(s => s.id === id);
            if (section && ['CheckoutForm', 'OrderSummary'].includes(section.type)) {
                toast.error(language === 'ar' ? 'لا يمكن حذف هذا العنصر الأساسي' : 'Cannot delete this core component');
                return;
            }
        }

        const newSections = layout.sections.filter(sec => sec.id !== id);
        setLayout({ ...layout, sections: newSections });
        if (selectedComponentId === id) {
            setSelectedComponentId(null);
        }
        toast.success(language === 'ar' ? 'تم حذف القسم' : 'Section deleted');
    };

    const moveSectionUp = (id: string) => {
        if (!layout) return;
        const index = layout.sections.findIndex(sec => sec.id === id);
        if (index <= 0) return;
        const newSections = [...layout.sections];
        [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
        setLayout({ ...layout, sections: newSections });
    };

    const moveSectionDown = (id: string) => {
        if (!layout) return;
        const index = layout.sections.findIndex(sec => sec.id === id);
        if (index < 0 || index >= layout.sections.length - 1) return;
        const newSections = [...layout.sections];
        [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
        setLayout({ ...layout, sections: newSections });
    };

    // ... (handleApplyTemplate - restrict to Home for now)
    const handleApplyTemplate = (template: StoreTemplate) => {
        if (pageSlug === 'checkout') {
            toast.error(language === 'ar' ? 'القوالب متاحة للصفحة الرئيسية فقط حالياً' : 'Templates are only available for Home page currently');
            return;
        }
        if (!confirm(language === 'ar' ? 'هل أنت متأكد من تغيير التصميم؟ سيتم فقدان التغييرات الحالية.' : 'Are you sure you want to apply this template? Current changes will be lost.')) {
            return;
        }

        const newLayout = JSON.parse(JSON.stringify(template.schema));
        if (newLayout.sections) {
            newLayout.sections = newLayout.sections.map((section: any) => ({
                ...section,
                id: crypto.randomUUID()
            }));
        }

        setLayout(newLayout);
        setSelectedComponentId(null);
        toast.success(language === 'ar' ? 'تم تطبيق التصميم بنجاح' : 'Template applied successfully');
    };

    if (loading || !layout) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    const selectedComponent = layout.sections.find(s => s.id === selectedComponentId) || null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
                {/* Header */}
                <header className="h-14 border-b bg-white flex items-center justify-between px-4 z-50 shadow-sm relative">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/${storeId}`}>
                                <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} ${language === 'ar' ? 'rotate-180' : ''}`} />
                                {language === 'ar' ? 'عودة' : 'Back'}
                            </Link>
                        </Button>
                        <div className="h-6 w-px bg-slate-200" />

                        {/* Page Switcher */}
                        <Select value={pageSlug} onValueChange={setPageSlug}>
                            <SelectTrigger className="w-[180px] h-8">
                                <SelectValue placeholder="Select Page" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="home">{language === 'ar' ? 'الصفحة الرئيسية' : 'Home Page'}</SelectItem>
                                <SelectItem value="checkout">{language === 'ar' ? 'صفحة الدفع' : 'Checkout Page'}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
                        <span className="text-xs font-medium text-muted-foreground mr-2 hidden sm:inline-block">
                            {saving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : ''}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                            <Link href={pageSlug === 'home' ? `/s/${store?.slug || storeId}` : `/s/${store?.slug || storeId}/checkout`} target="_blank">
                                <Eye className="w-4 h-4 mr-2" />
                                {language === 'ar' ? 'معاينة' : 'Preview'}
                            </Link>
                        </Button>
                        <Button size="sm" onClick={() => handleSave()} disabled={saving} className="min-w-[100px]">
                            {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {language === 'ar' ? 'نشر' : 'Publish'}
                        </Button>
                    </div>
                </header>

                {/* Main Editor Area */}
                <ResizablePanelGroup direction="horizontal" className="flex-1">

                    {/* Left Sidebar: Components */}
                    <ResizablePanel defaultSize={20} minSize={15} maxSize={25} className="bg-white border-r z-10">
                        <EditorSidebar onApplyTemplate={handleApplyTemplate} pageSlug={pageSlug} />
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* Center: Canvas */}
                    <ResizablePanel defaultSize={55} className="bg-slate-100 flex flex-col relative">
                        <Canvas
                            schema={layout}
                            storeId={storeId}
                            onSelectComponent={setSelectedComponentId}
                            selectedComponentId={selectedComponentId}
                            onUpdate={updateComponentContent}
                            onDelete={deleteSection}
                            onMoveUp={moveSectionUp}
                            onMoveDown={moveSectionDown}
                            pageSlug={pageSlug}
                            store={store}
                        />
                        {/* Drag Overlay for Visual Feedback */}
                        <DragOverlay>
                            {activeDragType ? (
                                <div className="p-4 bg-white border border-primary shadow-xl rounded-lg opacity-90 cursor-grabbing">
                                    Dragging {activeDragType}
                                </div>
                            ) : null}
                        </DragOverlay>
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* Right Sidebar: Properties */}
                    <ResizablePanel defaultSize={25} minSize={20} maxSize={30} className="bg-white border-l z-10">
                        <PropertiesPanel
                            selectedComponent={selectedComponent}
                            layout={layout}
                            onUpdateContent={updateComponentContent}
                            onUpdateSettings={updateComponentSettings}
                            onUpdateGlobal={updateGlobalSettings}
                            language={language}
                        />
                    </ResizablePanel>

                </ResizablePanelGroup>
            </div>
        </DndContext>
    );
}

"use client";

import { ComponentSchema, PageSchema } from '@/lib/store-builder/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface PropertiesPanelProps {
    selectedComponent: ComponentSchema | null;
    layout: PageSchema | null;
    onUpdateContent: (id: string, content: any) => void;
    onUpdateSettings: (id: string, settings: any) => void;
    onUpdateGlobal: (settings: any) => void;
    language?: string;
}

export function PropertiesPanel({
    selectedComponent,
    layout,
    onUpdateContent,
    onUpdateSettings,
    onUpdateGlobal,
    language = 'en'
}: PropertiesPanelProps) {
    const [activeTab, setActiveTab] = useState<string>("global");

    // Update active tab when component selection changes
    useEffect(() => {
        if (selectedComponent) {
            setActiveTab("content");
        } else {
            setActiveTab("global");
        }
    }, [selectedComponent?.id]); // Only watch the ID, not the entire object

    if (!layout) return null;

    // Helper to get localized value
    const getLocalizedValue = (value: any): string => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            if ('en' in value || 'ar' in value) {
                return value[language] || value['en'] || '';
            }
        }
        return String(value || '');
    };

    // Helper to update localized value
    const updateLocalizedValue = (currentValue: any, newValue: string): any => {
        if (typeof currentValue === 'object' && currentValue !== null && !Array.isArray(currentValue)) {
            if ('en' in currentValue || 'ar' in currentValue) {
                return { ...currentValue, [language]: newValue };
            }
        }
        return newValue;
    };

    const renderSettingInput = (key: string, value: any, onChange: (val: any) => void) => {
        // Color Picker
        if (key.toLowerCase().includes('color') || key.toLowerCase().includes('background')) {
            return (
                <div className="flex gap-2">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border shadow-sm cursor-pointer ring-offset-2 ring-offset-background hover:ring-2 ring-primary transition-all">
                        <input
                            type="color"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 p-0 m-0 opacity-0 cursor-pointer"
                        />
                        <div className="w-full h-full" style={{ backgroundColor: value }} />
                    </div>
                    <Input
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="font-mono flex-1"
                    />
                </div>
            );
        }

        // Dropdowns
        if (typeof value === 'string' && (key === 'align' || key === 'height' || key === 'style')) {
            return (
                <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                >
                    {key === 'align' && <>
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                    </>}
                    {key === 'height' && <>
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="full">Full Screen</option>
                    </>}
                    {key === 'style' && <>
                        <option value="cards">Cards</option>
                        <option value="list">List</option>
                        <option value="minimal">Minimal</option>
                    </>}
                </select>
            );
        }

        // Range / Numbers
        if (typeof value === 'number' || key.toLowerCase().includes('opacity') || key === 'columns' || key === 'limit') {
            return (
                <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min={key.includes('opacity') ? 0 : 1}
                        max={key.includes('opacity') ? 100 : 12}
                        value={value}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="flex-1"
                    />
                    <Input
                        type="number"
                        value={value}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="w-16 text-center"
                        min={key.includes('opacity') ? 0 : 1}
                        max={key.includes('opacity') ? 100 : 20}
                    />
                </div>
            );
        }

        // Fallback Text Input
        return (
            <Input
                value={value as string}
                onChange={(e) => onChange(e.target.value)}
            />
        );
    };

    return (
        <div className="h-full bg-white border-l flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
                <div className="border-b px-4 py-2">
                    <TabsList className="w-full grid grid-cols-3">
                        <TabsTrigger value="content" disabled={!selectedComponent}>Content</TabsTrigger>
                        <TabsTrigger value="style" disabled={!selectedComponent}>Style</TabsTrigger>
                        <TabsTrigger value="global">Global</TabsTrigger>
                    </TabsList>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-4">
                        <TabsContent value="content" className="mt-0 space-y-4">
                            {selectedComponent ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b">
                                        <span className="font-semibold text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                                            {selectedComponent.type}
                                        </span>
                                    </div>

                                    {Object.entries(selectedComponent.content).map(([key, value]) => {
                                        if (Array.isArray(value)) {
                                            return (
                                                <Accordion type="single" collapsible key={key} className="w-full border rounded-lg">
                                                    <AccordionItem value={key} className="border-0">
                                                        <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-slate-50 rounded-t-lg">
                                                            <span className="capitalize text-sm font-medium">{key}</span>
                                                        </AccordionTrigger>
                                                        <AccordionContent className="p-3 bg-slate-50/50 space-y-3">
                                                            {value.map((item: any, idx: number) => (
                                                                <div key={idx} className="bg-white p-3 rounded border shadow-sm relative group">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="absolute top-1 right-1 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        onClick={() => {
                                                                            const newArray = value.filter((_, i) => i !== idx);
                                                                            onUpdateContent(selectedComponent.id, { [key]: newArray });
                                                                        }}
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </Button>

                                                                    <div className="space-y-3">
                                                                        {Object.entries(item).map(([itemKey, itemValue]) => (
                                                                            <div key={itemKey}>
                                                                                <Label className="text-xs text-muted-foreground capitalize mb-1 block">{itemKey}</Label>
                                                                                <Input
                                                                                    value={itemValue as string}
                                                                                    onChange={(e) => {
                                                                                        const newArray = [...value];
                                                                                        newArray[idx] = { ...newArray[idx], [itemKey]: e.target.value };
                                                                                        onUpdateContent(selectedComponent.id, { [key]: newArray });
                                                                                    }}
                                                                                    className="h-8 text-sm"
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full mt-2"
                                                                onClick={() => {
                                                                    const newItem = key === 'features'
                                                                        ? { title: 'New Feature', description: 'Description', icon: 'Star' }
                                                                        : { title: 'New Slide', subtitle: 'Subtitle', buttonText: 'Shop', backgroundImage: '' };
                                                                    onUpdateContent(selectedComponent.id, { [key]: [...value, newItem] });
                                                                }}
                                                            >
                                                                <Plus className="w-3 h-3 mr-2" /> Add Item
                                                            </Button>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>
                                            );
                                        }

                                        if (typeof value === 'string' || typeof value === 'object') {
                                            const displayValue = getLocalizedValue(value);

                                            return (
                                                <div key={key} className="space-y-1.5">
                                                    <Label className="capitalize text-xs font-medium text-slate-500">
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </Label>
                                                    {(key === 'description' || key.includes('Text')) ? (
                                                        <Textarea
                                                            value={displayValue}
                                                            onChange={(e) => onUpdateContent(selectedComponent.id, { [key]: updateLocalizedValue(value, e.target.value) })}
                                                            className="min-h-[80px] text-sm resize-y"
                                                        />
                                                    ) : (
                                                        <Input
                                                            value={displayValue}
                                                            onChange={(e) => onUpdateContent(selectedComponent.id, { [key]: updateLocalizedValue(value, e.target.value) })}
                                                            className="text-sm"
                                                        />
                                                    )}
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground text-sm">Select a component to edit content</div>
                            )}
                        </TabsContent>

                        <TabsContent value="style" className="mt-0 space-y-4">
                            {selectedComponent ? (
                                <div className="space-y-4">
                                    {Object.entries(selectedComponent.settings).map(([key, value]) => (
                                        <div key={key} className="space-y-1.5">
                                            <Label className="capitalize text-xs font-medium text-slate-500">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </Label>
                                            {renderSettingInput(key, value, (val) => onUpdateSettings(selectedComponent.id, { [key]: val }))}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground text-sm">Select a component to edit styles</div>
                            )}
                        </TabsContent>

                        <TabsContent value="global" className="mt-0 space-y-6">
                            <div className="space-y-4">
                                <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-primary rounded-full" /> Brand Colors
                                </h4>
                                {Object.entries(layout.globalSettings.colors).map(([key, value]) => (
                                    <div key={key} className="space-y-1.5">
                                        <Label className="capitalize text-xs font-medium text-slate-500">{key}</Label>
                                        {renderSettingInput(key, value, (val) => {
                                            const newColors = { ...layout.globalSettings.colors, [key]: val };
                                            onUpdateGlobal({ ...layout.globalSettings, colors: newColors });
                                        })}
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-primary rounded-full" /> Typography
                                </h4>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-500">Font Family</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        value={layout.globalSettings.font}
                                        onChange={(e) => onUpdateGlobal({ ...layout.globalSettings, font: e.target.value })}
                                    >
                                        <option value="Inter">Inter (Default)</option>
                                        <option value="Roboto">Roboto</option>
                                        <option value="Open Sans">Open Sans</option>
                                        <option value="Playfair Display">Playfair Display</option>
                                    </select>
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </ScrollArea>
            </Tabs>
        </div>
    );
}

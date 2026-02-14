import { ComponentSchema } from '@/lib/store-builder/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQ({ data, isEditable = false, onUpdate }: { data: ComponentSchema, isEditable?: boolean, onUpdate?: (id: string, content: any) => void }) {
    const { settings, content, id } = data;
    const { language } = useLanguage();

    const getText = (field: any) => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        return field[language] || field.en || '';
    };

    const handleUpdate = (field: string, value: any) => {
        if (!onUpdate) return;
        let newVal = value;
        const currentVal = content[field];
        if (typeof currentVal === 'object' && currentVal !== null && !Array.isArray(currentVal)) {
            newVal = { ...currentVal, [language]: value };
        }
        onUpdate(id, { [field]: newVal });
    };

    const handleItemUpdate = (index: number, field: string, value: string) => {
        if (!onUpdate) return;
        const newItems = [...(content.items || [])];
        const currentItem = newItems[index];

        let newVal = value;
        const currentVal = currentItem[field];
        if (typeof currentVal === 'object' && currentVal !== null) {
            newVal = { ...currentVal, [language]: value } as any;
        }

        newItems[index] = { ...currentItem, [field]: newVal };
        onUpdate(id, { items: newItems });
    };

    const addItem = () => {
        if (!onUpdate) return;
        const newItem = {
            question: { en: 'New Question?', ar: 'سؤال جديد؟' },
            answer: { en: 'Answer goes here.', ar: 'الإجابة هنا.' },
        };
        onUpdate(id, { items: [...(content.items || []), newItem] });
    };

    return (
        <section className="py-16 px-6 bg-white" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="container mx-auto max-w-3xl">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                        <HelpCircle className="w-6 h-6" />
                    </div>
                    <h2
                        className={`text-3xl font-bold mb-4 ${isEditable ? 'outline-dashed outline-2 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                        contentEditable={isEditable}
                        suppressContentEditableWarning
                        onBlur={(e) => handleUpdate('title', e.currentTarget.textContent || '')}
                    >
                        {getText(content.title)}
                    </h2>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    {content.items?.map((item: any, index: number) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="hover:no-underline">
                                <span
                                    className={`text-left text-lg font-medium w-full ${isEditable ? 'outline-dashed outline-1 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                                    contentEditable={isEditable}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleItemUpdate(index, 'question', e.currentTarget.textContent || '')}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {getText(item.question)}
                                </span>
                            </AccordionTrigger>
                            <AccordionContent>
                                <p
                                    className={`text-slate-600 leading-relaxed ${isEditable ? 'outline-dashed outline-1 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                                    contentEditable={isEditable}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleItemUpdate(index, 'answer', e.currentTarget.textContent || '')}
                                >
                                    {getText(item.answer)}
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>

                {isEditable && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={addItem}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Question
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}

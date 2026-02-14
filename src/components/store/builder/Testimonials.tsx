import { ComponentSchema } from '@/lib/store-builder/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Quote, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Testimonials({ data, isEditable = false, onUpdate }: { data: ComponentSchema, isEditable?: boolean, onUpdate?: (id: string, content: any) => void }) {
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
            name: { en: 'New Customer', ar: 'عميل جديد' },
            role: { en: 'Verified Buyer', ar: 'مشتري موثوق' },
            text: { en: 'Add testimonial text here.', ar: 'أضف نص التقييم هنا.' },
        };
        onUpdate(id, { items: [...(content.items || []), newItem] });
    };

    return (
        <section className="py-16 px-6 bg-slate-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="container mx-auto">
                <h2
                    className={`text-3xl font-bold text-center mb-12 ${isEditable ? 'outline-dashed outline-2 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(e) => handleUpdate('title', e.currentTarget.textContent || '')}
                >
                    {getText(content.title)}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {content.items?.map((item: any, index: number) => (
                        <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative group">
                            <Quote className="w-8 h-8 text-primary/20 mb-4" />
                            <p
                                className={`text-lg mb-6 italic text-slate-700 ${isEditable ? 'outline-dashed outline-1 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                                contentEditable={isEditable}
                                suppressContentEditableWarning
                                onBlur={(e) => handleItemUpdate(index, 'text', e.currentTarget.textContent || '')}
                            >
                                {getText(item.text)}
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                    <User className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <h4
                                        className={`font-bold text-sm ${isEditable ? 'outline-dashed outline-1 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                                        contentEditable={isEditable}
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleItemUpdate(index, 'name', e.currentTarget.textContent || '')}
                                    >
                                        {getText(item.name)}
                                    </h4>
                                    <p
                                        className={`text-xs text-muted-foreground ${isEditable ? 'outline-dashed outline-1 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                                        contentEditable={isEditable}
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleItemUpdate(index, 'role', e.currentTarget.textContent || '')}
                                    >
                                        {getText(item.role)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {isEditable && (
                        <button
                            onClick={addItem}
                            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all h-full min-h-[200px]"
                        >
                            <Plus className="w-8 h-8 text-primary mb-2" />
                            <span className="text-sm font-medium text-primary">Add Testimonial</span>
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}

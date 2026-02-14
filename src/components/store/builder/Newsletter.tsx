import { ComponentSchema } from '@/lib/store-builder/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';

export function Newsletter({ data, isEditable = false, onUpdate }: { data: ComponentSchema, isEditable?: boolean, onUpdate?: (id: string, content: any) => void }) {
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
        if (typeof currentVal === 'object' && currentVal !== null) {
            newVal = { ...currentVal, [language]: value };
        }
        onUpdate(id, { [field]: newVal });
    };

    return (
        <section className={`py-16 px-6 bg-${settings.backgroundColor === 'white' ? 'white text-slate-900' : 'slate-900 text-white'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="container mx-auto max-w-4xl">
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 rounded-3xl p-8 md:p-12 bg-primary/10">
                    <div className="flex-1 text-center md:text-left rtl:md:text-right">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
                            <Mail className="w-6 h-6" />
                        </div>
                        <h2
                            className={`text-2xl md:text-3xl font-bold mb-3 text-foreground ${isEditable ? 'outline-dashed outline-2 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                            contentEditable={isEditable}
                            suppressContentEditableWarning
                            onBlur={(e) => handleUpdate('title', e.currentTarget.textContent || '')}
                        >
                            {getText(content.title)}
                        </h2>
                        <p
                            className={`text-muted-foreground ${isEditable ? 'outline-dashed outline-2 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                            contentEditable={isEditable}
                            suppressContentEditableWarning
                            onBlur={(e) => handleUpdate('description', e.currentTarget.textContent || '')}
                        >
                            {getText(content.description)}
                        </p>
                    </div>

                    <div className="flex-1 w-full max-w-md">
                        <div className="flex gap-2">
                            <Input
                                placeholder={getText(content.placeholder)}
                                className="bg-background border-input"
                                disabled={isEditable}
                            />
                            <Button disabled={isEditable}>
                                <span
                                    contentEditable={isEditable}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleUpdate('buttonText', e.currentTarget.textContent || '')}
                                    className={`outline-none ${isEditable ? 'cursor-text inline-block min-w-[50px] border-b border-transparent hover:border-white' : ''}`}
                                >
                                    {getText(content.buttonText)}
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

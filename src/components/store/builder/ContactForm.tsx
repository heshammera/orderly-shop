import { ComponentSchema } from '@/lib/store-builder/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function ContactForm({ data, isEditable = false, onUpdate }: { data: ComponentSchema, isEditable?: boolean, onUpdate?: (id: string, content: any) => void }) {
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
        <section className={`py-16 px-6 bg-${settings.backgroundColor === 'slate-900' ? 'slate-900 text-white' : 'white text-slate-900'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="container mx-auto max-w-2xl">
                <div className="text-center mb-10">
                    <h2
                        className={`text-3xl font-bold mb-4 ${isEditable ? 'outline-dashed outline-2 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                        contentEditable={isEditable}
                        suppressContentEditableWarning
                        onBlur={(e) => handleUpdate('title', e.currentTarget.textContent || '')}
                    >
                        {getText(content.title)}
                    </h2>
                    <p
                        className={`text-lg opacity-80 ${isEditable ? 'outline-dashed outline-2 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                        contentEditable={isEditable}
                        suppressContentEditableWarning
                        onBlur={(e) => handleUpdate('description', e.currentTarget.textContent || '')}
                    >
                        {getText(content.description)}
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            placeholder={language === 'ar' ? 'الاسم' : 'Name'}
                            disabled={isEditable}
                            className={settings.backgroundColor === 'slate-900' ? 'bg-slate-800 border-slate-700 text-white' : ''}
                        />
                        <Input
                            placeholder={getText(content.emailPlaceholder)}
                            disabled={isEditable}
                            className={settings.backgroundColor === 'slate-900' ? 'bg-slate-800 border-slate-700 text-white' : ''}
                        />
                    </div>
                    <Textarea
                        placeholder={getText(content.messagePlaceholder)}
                        rows={5}
                        disabled={isEditable}
                        className={settings.backgroundColor === 'slate-900' ? 'bg-slate-800 border-slate-700 text-white' : ''}
                    />
                    <Button className="w-full" size="lg" disabled={isEditable}>
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
        </section>
    );
}

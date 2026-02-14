import { ComponentSchema } from '@/lib/store-builder/types';
import { useLanguage } from '@/contexts/LanguageContext';

export function RichText({ data, isEditable = false, onUpdate }: { data: ComponentSchema, isEditable?: boolean, onUpdate?: (id: string, content: any) => void }) {
    const { settings, content, id } = data;
    const { language } = useLanguage();

    const getText = (field: any) => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        return field[language] || field.en || '';
    };

    const handleUpdate = (html: string) => {
        if (!onUpdate) return;
        const currentVal = content.text;
        let newVal = html;
        if (typeof currentVal === 'object' && currentVal !== null) {
            newVal = { ...currentVal, [language]: html } as any;
        }
        onUpdate(id, { text: newVal });
    };

    const paddingClass = settings.padding === 'large' ? 'p-12' :
        settings.padding === 'small' ? 'p-4' :
            'p-8';

    return (
        <section className={`w-full ${paddingClass} bg-white`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="container mx-auto prose max-w-4xl">
                <div
                    className={`${isEditable ? 'outline-dashed outline-2 outline-transparent hover:outline-primary/50 cursor-text min-h-[100px]' : ''}`}
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(e) => handleUpdate(e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={{ __html: getText(content.text) }}
                />
            </div>
        </section>
    );
}

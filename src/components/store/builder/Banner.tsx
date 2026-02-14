import Link from 'next/link';
import { ComponentSchema } from '@/lib/store-builder/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

export function Banner({ data, isEditable = false, onUpdate }: { data: ComponentSchema, isEditable?: boolean, onUpdate?: (id: string, content: any) => void }) {
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

    const alignClass = settings.align === 'left' ? 'text-left items-start' :
        settings.align === 'right' ? 'text-right items-end' :
            'text-center items-center';

    return (
        <section className={`w-full py-16 px-6 relative overflow-hidden bg-primary text-primary-foreground`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Background Image (Optional) */}
            {content.backgroundImage && (
                <div
                    className="absolute inset-0 z-0 opacity-20 bg-cover bg-center"
                    style={{ backgroundImage: `url(${content.backgroundImage})` }}
                />
            )}

            <div className={`container mx-auto relative z-10 flex flex-col ${alignClass}`}>
                <h2
                    className={`text-3xl md:text-4xl font-bold mb-4 ${isEditable ? 'outline-dashed outline-2 outline-transparent hover:outline-white/50 cursor-text' : ''}`}
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(e) => handleUpdate('title', e.currentTarget.textContent || '')}
                >
                    {getText(content.title)}
                </h2>
                <p
                    className={`text-lg md:text-xl opacity-90 mb-8 max-w-2xl ${isEditable ? 'outline-dashed outline-2 outline-transparent hover:outline-white/50 cursor-text' : ''}`}
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(e) => handleUpdate('description', e.currentTarget.textContent || '')}
                >
                    {getText(content.description)}
                </p>

                {content.buttonText && (
                    <Button size="lg" variant="secondary" asChild={!isEditable}>
                        {isEditable ? (
                            <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => handleUpdate('buttonText', e.currentTarget.textContent || '')}
                                className="outline-none min-w-[50px] inline-block"
                            >
                                {getText(content.buttonText)}
                            </span>
                        ) : (
                            <Link href={content.buttonLink || '#'}>
                                {getText(content.buttonText)}
                            </Link>
                        )}
                    </Button>
                )}
            </div>
        </section>
    );
}

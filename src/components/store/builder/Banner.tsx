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
        <section className="relative w-full py-24 sm:py-32 px-6 flex items-center justify-center overflow-hidden bg-primary text-primary-foreground group" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Background Image with slight Parallax/Zoom effect on hover */}
            {content.backgroundImage && (
                <>
                    <div
                        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 ease-out group-hover:scale-105"
                        style={{ backgroundImage: `url(${content.backgroundImage})` }}
                    />
                    <div className="absolute inset-0 bg-black/50 z-10 transition-colors duration-500 group-hover:bg-black/60" />
                </>
            )}

            {!content.backgroundImage && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/60 mix-blend-multiply z-0" />
            )}

            <div className={`container mx-auto relative z-20 flex flex-col ${alignClass} max-w-4xl`}>
                <h2
                    className={`text-4xl md:text-5xl lg:text-7xl font-extrabold mb-6 tracking-tight drop-shadow-lg leading-tight ${isEditable ? 'outline-dashed outline-2 outline-transparent hover:outline-white/50 cursor-text' : ''}`}
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(e) => handleUpdate('title', e.currentTarget.textContent || '')}
                >
                    {getText(content.title)}
                </h2>
                <p
                    className={`text-lg md:text-2xl opacity-90 mb-10 max-w-3xl font-medium drop-shadow-md ${isEditable ? 'outline-dashed outline-2 outline-transparent hover:outline-white/50 cursor-text' : ''}`}
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(e) => handleUpdate('description', e.currentTarget.textContent || '')}
                >
                    {getText(content.description)}
                </p>

                {content.buttonText && (
                    <div className="inline-block">
                        <Button
                            size="lg"
                            className="bg-white text-primary hover:bg-gray-100 border-0 text-lg sm:text-xl font-bold px-10 py-7 rounded-full shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_-5px_rgba(255,255,255,0.5)]"
                            asChild={!isEditable}
                        >
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
                    </div>
                )}
            </div>
        </section>
    );
}

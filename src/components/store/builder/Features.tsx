import { ComponentSchema } from '@/lib/store-builder/types';
import * as Icons from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

export function Features({ data, isEditable = false, onUpdate }: { data: ComponentSchema, isEditable?: boolean, onUpdate?: (id: string, content: any) => void }) {
    const { settings, content, id } = data;
    const { language } = useLanguage();
    const features = content.features || [];

    // Helper to get text based on language
    const getText = (field: any) => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        return field[language] || field.en || '';
    };

    const handleFeatureUpdate = (index: number, field: string, value: string) => {
        if (!onUpdate) return;
        const newFeatures = [...features];
        const currentFeature = newFeatures[index];

        let newVal = value;
        const currentVal = currentFeature[field];
        if (typeof currentVal === 'object' && currentVal !== null) {
            newVal = { ...currentVal, [language]: value } as any;
        }

        newFeatures[index] = { ...currentFeature, [field]: newVal };
        onUpdate(id, { features: newFeatures });
    };

    const addFeature = () => {
        if (!onUpdate) return;
        const newFeature = {
            title: { en: 'New Feature', ar: 'ميزة جديدة' },
            description: { en: 'Description here', ar: 'الوصف هنا' },
            icon: 'Star'
        };
        onUpdate(id, { features: [...features, newFeature] });
    };

    const gridCols = settings.columns === 4 ? 'md:grid-cols-4' : settings.columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3';

    return (
        <section className="py-16 bg-muted/20">
            <div className="container px-4">
                <div className={`grid grid-cols-1 ${gridCols} gap-8`}>
                    {features.map((feature: any, index: number) => {
                        // Dynamically resolve icon
                        const IconComponent = (Icons as any)[feature.icon] || Icons.Star;

                        return (
                            <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="flex flex-col items-center text-center p-6 pt-8">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                        <IconComponent className="w-6 h-6" />
                                    </div>
                                    <h3
                                        className={`text-xl font-semibold mb-2 ${isEditable ? 'outline-dashed outline-1 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                                        contentEditable={isEditable}
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleFeatureUpdate(index, 'title', e.currentTarget.textContent || '')}
                                    >
                                        {getText(feature.title)}
                                    </h3>
                                    <p
                                        className={`text-muted-foreground ${isEditable ? 'outline-dashed outline-1 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                                        contentEditable={isEditable}
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleFeatureUpdate(index, 'description', e.currentTarget.textContent || '')}
                                    >
                                        {getText(feature.description)}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                    {isEditable && (
                        <button
                            onClick={addFeature}
                            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-primary hover:bg-primary/5 transition-all min-h-[250px]"
                        >
                            <Icons.Plus className="w-8 h-8 text-primary mb-2" />
                            <span className="text-sm font-medium text-primary">Add Feature</span>
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}

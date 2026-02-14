import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ComponentSchema } from '@/lib/store-builder/types';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Image as ImageIcon, Upload } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';

export function Hero({ data, isEditable = false, onUpdate }: { data: ComponentSchema, isEditable?: boolean, onUpdate?: (id: string, content: any) => void }) {
    const { settings, content, id } = data;
    const { language } = useLanguage();

    // Helper to get text based on language
    const getText = (field: any) => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        return field[language] || field.en || '';
    };

    const handleTextUpdate = (slideIndex: number, field: string, value: string) => {
        if (!onUpdate) return;

        // Check if we have slides array
        if (content.slides && Array.isArray(content.slides)) {
            const newSlides = [...content.slides];
            const currentSlide = newSlides[slideIndex];
            const currentVal = currentSlide[field];

            let newVal = value;
            if (typeof currentVal === 'object' && currentVal !== null) {
                newVal = { ...currentVal, [language]: value };
            }

            newSlides[slideIndex] = { ...currentSlide, [field]: newVal };
            onUpdate(id, { slides: newSlides });
        } else {
            // Update content directly (no slides array)
            const currentVal = content[field];
            let newVal = value;

            if (typeof currentVal === 'object' && currentVal !== null) {
                newVal = { ...currentVal, [language]: value };
            }

            onUpdate(id, { [field]: newVal });
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeSlideIndexRef = useRef<number>(0);

    // Settings defaults
    const heightClass = settings.height === 'large' ? 'h-[600px]' : settings.height === 'medium' ? 'h-[400px]' : 'h-[300px]';
    const alignClass = settings.align === 'left' ? 'text-left items-start' : settings.align === 'right' ? 'text-right items-end' : 'text-center items-center';

    const slides = content.slides || (content.title ? [{
        title: content.title,
        subtitle: content.subtitle,
        buttonText: content.buttonText,
        buttonLink: content.buttonLink,
        backgroundImage: content.backgroundImage
    }] : []);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !onUpdate) return;

        // In a real app, upload to storage (Supabase Storage) here
        // For now, we'll use a local object URL for preview
        const objectUrl = URL.createObjectURL(file);

        const newSlides = [...slides];
        const index = activeSlideIndexRef.current;
        if (newSlides[index]) {
            newSlides[index] = { ...newSlides[index], backgroundImage: objectUrl };
            onUpdate(id, { slides: newSlides });
            toast.success('Image updated');
        }
    };

    const triggerImageUpload = (index: number) => {
        activeSlideIndexRef.current = index;
        fileInputRef.current?.click();
    };

    if (slides.length === 0) return null;

    const renderSlideContent = (slide: any, index: number) => (
        <div className={`relative w-full h-full flex flex-col justify-center ${alignClass} text-white overflow-hidden group/slide`}>
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover/slide:scale-105"
                style={{ backgroundImage: `url(${slide.backgroundImage || '/placeholder-hero.jpg'})` }}
            />
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black z-10"
                style={{ opacity: (settings.overlayOpacity || 50) / 100 }}
            />
            {/* Edit Image Overlay */}
            {isEditable && (
                <div className="absolute top-4 right-4 z-30 opacity-0 group-hover/slide:opacity-100 transition-opacity">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => triggerImageUpload(index)}
                        className="gap-2 shadow-lg"
                    >
                        <Upload className="w-4 h-4" />
                        Change Image
                    </Button>
                </div>
            )}
            {/* Content */}
            <div className="container relative z-20 px-4">
                <div className={`max-w-2xl ${settings.align === 'center' ? 'mx-auto' : ''}`}>
                    <h1
                        className={`text-4xl md:text-6xl font-bold mb-4 tracking-tight drop-shadow-lg ${isEditable ? 'outline-dashed outline-2 outline-transparent hover:outline-primary/50 focus:outline-primary cursor-text' : ''}`}
                        contentEditable={isEditable}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextUpdate(index, 'title', e.currentTarget.textContent || '')}
                    >
                        {getText(slide.title)}
                    </h1>
                    <p
                        className={`text-lg md:text-xl mb-8 text-gray-100 drop-shadow-md ${isEditable ? 'outline-dashed outline-2 outline-transparent hover:outline-primary/50 focus:outline-primary cursor-text' : ''}`}
                        contentEditable={isEditable}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextUpdate(index, 'subtitle', e.currentTarget.textContent || '')}
                    >
                        {getText(slide.subtitle)}
                    </p>
                    {slide.buttonText && (
                        <div className="inline-block relative group">
                            <Button size="lg" className="text-lg px-8 py-6 rounded-full" asChild={!isEditable}>
                                {isEditable ? (
                                    <span
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleTextUpdate(index, 'buttonText', e.currentTarget.textContent || '')}
                                        className="outline-none min-w-[50px] inline-block"
                                    >
                                        {getText(slide.buttonText)}
                                    </span>
                                ) : (
                                    <Link href={slide.buttonLink || '#'}>
                                        {getText(slide.buttonText)}
                                    </Link>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (slides.length > 1) {
        return (
            <section className={`w-full ${heightClass}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <Carousel className="w-full h-full" opts={{ loop: true, direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                    <CarouselContent className="h-full ml-0">
                        {slides.map((slide: any, index: number) => (
                            <CarouselItem key={index} className="pl-0 h-full relative">
                                {renderSlideContent(slide, index)}
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                </Carousel>
            </section>
        )
    }

    // Fallback Single Hero (Legacy Support)
    return (
        <section className={`relative w-full ${heightClass} flex flex-col justify-center ${alignClass} text-white overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {renderSlideContent(slides[0], 0)}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
            />
        </section>
    );
}

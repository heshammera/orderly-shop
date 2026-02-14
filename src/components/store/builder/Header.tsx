import Link from 'next/link';
import { ComponentSchema } from '@/lib/store-builder/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShoppingCart, Menu, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header({ data, isEditable = false, onUpdate }: { data: ComponentSchema, isEditable?: boolean, onUpdate?: (id: string, content: any) => void }) {
    const { settings, content, id } = data;
    const { language } = useLanguage();

    const getText = (field: any) => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        return field[language] || field.en || '';
    };

    const handleUpdate = (field: string, value: any) => {
        if (!onUpdate) return;

        // Handle nested updates (e.g. storeName)
        let newVal = value;
        const currentVal = content[field];
        if (typeof currentVal === 'object' && currentVal !== null && !Array.isArray(currentVal)) {
            newVal = { ...currentVal, [language]: value };
        }

        onUpdate(id, { [field]: newVal });
    };

    const handleLinkUpdate = (index: number, key: 'label' | 'url', value: string) => {
        if (!onUpdate) return;
        const newLinks = [...(content.links || [])];
        const currentLink = newLinks[index];

        let newVal = value;
        if (key === 'label') {
            newVal = { ...currentLink.label, [language]: value } as any;
        }

        newLinks[index] = { ...currentLink, [key]: newVal };
        onUpdate(id, { links: newLinks });
    };

    const bgColor = settings.backgroundColor === 'black' ? 'bg-black text-white' :
        settings.backgroundColor === 'slate' ? 'bg-slate-900 text-white' :
            'bg-white text-slate-900 border-b';

    return (
        <header className={`w-full py-4 px-6 ${bgColor} ${settings.sticky ? 'sticky top-0 z-40' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className={`container mx-auto flex items-center justify-between`}>
                {/* Mobile Menu */}
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="w-6 h-6" />
                </Button>

                {/* Logo / Store Name */}
                <div className={`flex items-center gap-2 ${settings.layout === 'center' ? 'flex-1 md:flex-none justify-center' : ''}`}>
                    {/* Placeholder for Logo Upload trigger */}
                    {content.logo && content.logo !== '/placeholder-logo.png' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={content.logo} alt="Logo" className="h-8 md:h-10 object-contain" />
                    ) : (
                        <h2
                            className={`text-xl md:text-2xl font-bold ${isEditable ? 'outline-dashed outline-2 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                            contentEditable={isEditable}
                            suppressContentEditableWarning
                            onBlur={(e) => handleUpdate('storeName', e.currentTarget.textContent || '')}
                        >
                            {getText(content.storeName)}
                        </h2>
                    )}
                </div>

                {/* Desktop Navigation */}
                <nav className={`hidden md:flex items-center gap-6 ${settings.layout === 'center' ? 'absolute left-1/2 -translate-x-1/2' : ''}`}>
                    {settings.layout !== 'center' && content.links?.map((link: any, index: number) => (
                        <span
                            key={index}
                            className={`text-sm font-medium hover:opacity-80 transition-opacity ${isEditable ? 'outline-dashed outline-1 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                            contentEditable={isEditable}
                            suppressContentEditableWarning
                            onBlur={(e) => handleLinkUpdate(index, 'label', e.currentTarget.textContent || '')}
                        >
                            {getText(link.label)}
                        </span>
                    ))}
                    {settings.layout === 'center' && content.links?.map((link: any, index: number) => (
                        <span
                            key={index}
                            className={`text-sm font-medium hover:opacity-80 transition-opacity ${isEditable ? 'outline-dashed outline-1 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                            contentEditable={isEditable}
                            suppressContentEditableWarning
                            onBlur={(e) => handleLinkUpdate(index, 'label', e.currentTarget.textContent || '')}
                        >
                            {getText(link.label)}
                        </span>
                    ))}
                </nav>

                {/* Icons */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <Search className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <User className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="relative">
                        <ShoppingCart className="w-5 h-5" />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                    </Button>
                </div>
            </div>
        </header>
    );
}

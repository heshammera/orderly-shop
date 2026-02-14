import Link from 'next/link';
import { ComponentSchema } from '@/lib/store-builder/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

const ICONS: any = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin
};

export function Footer({ data, isEditable = false, onUpdate }: { data: ComponentSchema, isEditable?: boolean, onUpdate?: (id: string, content: any) => void }) {
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

    // Style classes
    const bgClass = settings.backgroundColor === 'white' ? 'bg-white border-t' :
        settings.backgroundColor === 'black' ? 'bg-black' :
            'bg-slate-900';

    const textClass = settings.textColor === 'dark' ? 'text-slate-900' : 'text-slate-200';
    const linkHoverClass = settings.textColor === 'dark' ? 'hover:text-primary' : 'hover:text-white';

    return (
        <footer className={`${bgClass} ${textClass} py-12 px-6`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="container mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand / About */}
                    <div className="col-span-1 md:col-span-1">
                        <h3
                            className={`text-lg font-bold mb-4 ${isEditable ? 'outline-dashed outline-1 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                            contentEditable={isEditable}
                            suppressContentEditableWarning
                            onBlur={(e) => handleUpdate('aboutTitle', e.currentTarget.textContent || 'About Us')}
                        >
                            {content.aboutTitle ? getText(content.aboutTitle) : (language === 'ar' ? 'من نحن' : 'About Us')}
                        </h3>
                        <p
                            className={`text-sm opacity-80 leading-relaxed ${isEditable ? 'outline-dashed outline-1 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                            contentEditable={isEditable}
                            suppressContentEditableWarning
                            onBlur={(e) => handleUpdate('aboutText', e.currentTarget.textContent || '')}
                        >
                            {content.aboutText ? getText(content.aboutText) : (language === 'ar' ? 'اكتب وصفاً قصيراً عن متجرك هنا.' : 'Write a short description about your store here.')}
                        </p>
                    </div>

                    {/* Links */}
                    <div className="col-span-1 md:col-span-1">
                        <h3 className="text-lg font-bold mb-4">{language === 'ar' ? 'روابط مهمة' : 'Quick Links'}</h3>
                        <ul className="space-y-2">
                            {content.links?.map((link: any, index: number) => (
                                <li key={index}>
                                    <span
                                        className={`text-sm cursor-pointer transition-colors ${linkHoverClass} ${isEditable ? 'outline-dashed outline-1 outline-transparent hover:outline-primary/50' : ''}`}
                                        contentEditable={isEditable}
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleLinkUpdate(index, 'label', e.currentTarget.textContent || '')}
                                    >
                                        {getText(link.label)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="col-span-1 md:col-span-1">
                        <h3 className="text-lg font-bold mb-4">{language === 'ar' ? 'تواصل معنا' : 'Contact'}</h3>
                        <ul className="space-y-2 text-sm opacity-80">
                            <li
                                contentEditable={isEditable}
                                suppressContentEditableWarning
                                onBlur={(e) => handleUpdate('email', e.currentTarget.textContent || '')}
                            >
                                {content.email || 'support@store.com'}
                            </li>
                            <li
                                contentEditable={isEditable}
                                suppressContentEditableWarning
                                onBlur={(e) => handleUpdate('phone', e.currentTarget.textContent || '')}
                            >
                                {content.phone || '+1 234 567 890'}
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p
                        className={`text-sm opacity-60 ${isEditable ? 'outline-dashed outline-1 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                        contentEditable={isEditable}
                        suppressContentEditableWarning
                        onBlur={(e) => handleUpdate('copyright', e.currentTarget.textContent || '')}
                    >
                        {getText(content.copyright)}
                    </p>

                    <div className="flex items-center gap-4">
                        {Object.entries(content.socials || {}).map(([platform, url]) => {
                            const Icon = ICONS[platform] || Twitter;
                            return (
                                <a key={platform} href={url as string} className={`opacity-60 hover:opacity-100 transition-opacity`}>
                                    <Icon className="w-5 h-5" />
                                </a>
                            );
                        })}
                    </div>
                </div>
            </div>
        </footer>
    );
}

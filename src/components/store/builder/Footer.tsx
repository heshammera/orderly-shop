import Link from 'next/link';
import { ComponentSchema } from '@/lib/store-builder/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

const ICONS: any = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin
};

export function Footer({ data, isEditable = false, onUpdate, store }: { data: ComponentSchema, isEditable?: boolean, onUpdate?: (id: string, content: any) => void, store?: any }) {
    const { settings, content, id } = data;
    const { language } = useLanguage();

    const getText = (field: any) => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        return field[language] || field.en || field.ar || '';
    };

    const hasRemovedCopyright = store?.has_removed_copyright || false;
    const resolvedStoreName = store?.name ? getText(store.name) : 'Store';

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

    // Premium styling classes
    // Detect dark backgrounds - covers 'black', 'dark', 'slate', 'slate-900', and anything not explicitly 'white'/'gray'/'transparent'
    const isDark = settings.backgroundColor !== 'white' && settings.backgroundColor !== 'gray' && settings.backgroundColor !== 'transparent';

    const bgClass = settings.backgroundColor === 'white'
        ? 'bg-white border-t border-gray-100'
        : settings.backgroundColor === 'black'
            ? 'bg-black text-white'
            : 'bg-slate-950 text-white';

    // Use isDark boolean directly instead of string key lookups to avoid mismatches
    const linkColor = isDark ? '#f3f4f6' : '#374151';   // gray-100 vs gray-700
    const textColor = isDark ? '#e5e7eb' : '#4b5563';    // gray-200 vs gray-600
    const headingColor = isDark ? '#ffffff' : '#111827';  // white vs gray-900

    const iconWrapperClass = isDark
        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm'
        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-primary border border-gray-200 hover:border-gray-300 shadow-sm';

    const socialPlatforms = Object.entries(store?.settings?.social_links || content.socials || {}).filter(([_, url]) => url);

    return (
        <footer className={`${bgClass} pt-8 pb-8 transition-colors duration-500`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="max-w-7xl mx-auto px-6 sm:px-12">

                {/* TOP BAR - Copyright & Branding */}
                <div className={`mb-8 pb-6 border-b flex flex-col items-center justify-center gap-5 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    {/* Copyright Section */}
                    <div className="w-full flex justify-center">
                        {hasRemovedCopyright ? (
                            <div className={`inline-flex items-center justify-center gap-3 px-6 py-3 rounded-2xl border ${isDark ? 'bg-white/10 border-white/20 hover:bg-white/15 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'bg-gray-100/80 border-gray-200/80 hover:bg-gray-100 shadow-md'} backdrop-blur-md transition-all duration-500 group cursor-default hover:scale-105`}>
                                <div className={`flex items-center justify-center w-8 h-8 rounded-xl ${isDark ? 'bg-white/20 text-white shadow-inner' : 'bg-white text-gray-900 shadow-sm border border-gray-200'} group-hover:rotate-6 transition-all duration-300`}>
                                    <span className="text-sm font-black">&copy;</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className={`text-base font-black tracking-widest uppercase bg-clip-text text-transparent ${isDark ? 'bg-gradient-to-r from-white to-gray-200' : 'bg-gradient-to-r from-gray-900 to-gray-700'}`}>
                                        {resolvedStoreName}
                                    </span>
                                    <span className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {new Date().getFullYear()}
                                    </span>
                                </div>
                                <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white/40' : 'bg-gray-400'}`} />
                                <span className={`text-sm font-bold tracking-wide ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                    {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
                                </span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center px-4 py-2 rounded-xl transition-colors">
                                <p
                                    className={`text-base font-bold ${isEditable ? 'outline-dashed outline-1 outline-transparent hover:outline-primary/50 cursor-text rounded px-2' : ''}`}
                                    style={{ color: headingColor }}
                                    contentEditable={isEditable}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleUpdate('copyright', e.currentTarget.textContent || '')}
                                >
                                    {getText(content.copyright)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Orderly Branding (If copyright is NOT removed) */}
                    {!hasRemovedCopyright && (
                        <div className="flex-shrink-0 mt-2">
                            <a
                                href="https://orderly.shop"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 bg-background/50 backdrop-blur-md border border-border/50"
                            >
                                {/* Glowing background effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <span className="relative z-10 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                                    {language === 'ar' ? 'مشغل بواسطة' : 'Powered by'}
                                </span>

                                <span className="relative z-10 text-base font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                                    ORDERLY
                                </span>

                                {/* Pulse indicator */}
                                <span className="relative z-10 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                                </span>
                            </a>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6">
                    {/* Brand / About - Takes more space on large screens */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-5 pr-0 lg:pr-12">
                        <h3
                            className={`text-xl font-bold mb-4 tracking-tight ${isEditable ? 'outline-dashed outline-1 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                            style={{ color: headingColor }}
                            contentEditable={isEditable}
                            suppressContentEditableWarning
                            onBlur={(e) => handleUpdate('aboutTitle', e.currentTarget.textContent || 'About Us')}
                        >
                            {content.aboutTitle ? getText(content.aboutTitle) : (language === 'ar' ? 'من نحن' : 'About Us')}
                        </h3>
                        <p
                            className={`text-base leading-relaxed ${isEditable ? 'outline-dashed outline-1 outline-transparent hover:outline-primary/50 cursor-text' : ''} max-w-md`}
                            style={{ color: textColor }}
                            contentEditable={isEditable}
                            suppressContentEditableWarning
                            onBlur={(e) => handleUpdate('aboutText', e.currentTarget.textContent || '')}
                        >
                            {store?.settings?.about_us ? getText(store.settings.about_us) : (content.aboutText ? getText(content.aboutText) : (language === 'ar' ? 'اكتب وصفاً قصيراً عن متجرك هنا يعبر عن هويتك ورؤيتك.' : 'Write a short description about your store here that reflects your identity and vision.'))}
                        </p>

                        {/* Social Links placed elegantly below about text */}
                        {socialPlatforms.length > 0 && (
                            <div className="flex flex-wrap items-center gap-3 mt-6">
                                {socialPlatforms.map(([platform, url]) => {
                                    const Icon = ICONS[platform] || Twitter;
                                    return (
                                        <a key={platform} href={url as string} target="_blank" rel="noopener noreferrer"
                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:-translate-y-1 ${iconWrapperClass}`}>
                                            <Icon className="w-5 h-5" />
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div className="col-span-1 lg:col-span-3">
                        <h3
                            className="text-sm font-bold mb-4 uppercase tracking-wider"
                            style={{ color: headingColor }}
                        >
                            {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
                        </h3>
                        <ul className="space-y-2">
                            {content.links?.map((link: any, index: number) => {
                                let resolvedUrl = link.url;
                                if (resolvedUrl === '/privacy' && store?.slug) resolvedUrl = `/s/${store.slug}/pages/privacy`;
                                if (resolvedUrl === '/terms' && store?.slug) resolvedUrl = `/s/${store.slug}/pages/terms`;

                                return (
                                    <li key={index}>
                                        {isEditable ? (
                                            <span
                                                className={`inline-block text-base cursor-pointer transition-all duration-300 hover:opacity-80 outline-dashed outline-1 outline-transparent hover:outline-primary/50`}
                                                style={{ color: linkColor }}
                                                contentEditable={true}
                                                suppressContentEditableWarning
                                                onBlur={(e) => handleLinkUpdate(index, 'label', e.currentTarget.textContent || '')}
                                            >
                                                {getText(link.label)}
                                            </span>
                                        ) : (
                                            <Link href={resolvedUrl} className="inline-block text-base transition-all duration-300 hover:opacity-80" style={{ color: linkColor }}>
                                                {getText(link.label)}
                                            </Link>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="col-span-1 md:col-span-1 lg:col-span-4">
                        <h3
                            className="text-sm font-bold mb-4 uppercase tracking-wider"
                            style={{ color: headingColor }}
                        >
                            {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
                        </h3>
                        <div className="space-y-3 text-base" style={{ color: textColor }}>
                            {(store?.contact_email || content.email || isEditable) && (
                                <div className="flex items-center gap-4 group">
                                    <div className={`p-2 rounded-full transition-colors ${isDark ? 'bg-white/10 group-hover:bg-white/20' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                                        <Mail className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-600'}`} />
                                    </div>
                                    <span
                                        className={`flex-1 transition-colors hover:opacity-80 ${isEditable ? 'outline-dashed outline-1 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                                        contentEditable={isEditable}
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleUpdate('email', e.currentTarget.textContent || '')}
                                        dir="ltr"
                                        style={{ textAlign: language === 'ar' ? 'right' : 'left', color: linkColor }}
                                    >
                                        {store?.contact_email || content.email || 'hello@store.com'}
                                    </span>
                                </div>
                            )}
                            {(store?.contact_phone || content.phone || isEditable) && (
                                <div className="flex items-center gap-4 group">
                                    <div className={`p-2 rounded-full transition-colors ${isDark ? 'bg-white/10 group-hover:bg-white/20' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                                        <Phone className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-600'}`} />
                                    </div>
                                    <span
                                        className={`flex-1 transition-colors hover:opacity-80 ${isEditable ? 'outline-dashed outline-1 outline-transparent hover:outline-primary/50 cursor-text' : ''}`}
                                        contentEditable={isEditable}
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleUpdate('phone', e.currentTarget.textContent || '')}
                                        dir="ltr"
                                        style={{ textAlign: language === 'ar' ? 'right' : 'left', color: linkColor }}
                                    >
                                        {store?.contact_phone || content.phone || '+1 234 567 890'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

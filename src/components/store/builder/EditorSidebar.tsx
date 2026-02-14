import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ComponentType } from '@/lib/store-builder/types';
import { LayoutTemplate, Image, Type, ShoppingBag, List, Box, Zap, Store, Feather, Palette, Component } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { STORE_TEMPLATES, StoreTemplate } from '@/lib/store-builder/templates';
import { useLanguage } from '@/contexts/LanguageContext';

interface SidebarItemProps {
    type: ComponentType;
    label: string;
    icon: React.ReactNode;
}

function SidebarItem({ type, label, icon }: SidebarItemProps) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `new-${type}`,
        data: { type, isNew: true }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="flex flex-col items-center justify-center p-4 border rounded-lg hover:border-primary hover:bg-primary/5 cursor-grab active:cursor-grabbing bg-white transition-colors"
        >
            <div className="mb-2 text-muted-foreground">{icon}</div>
            <span className="text-xs font-medium text-center">{label}</span>
        </div>
    );
}

const COMPONENTS: { type: ComponentType; label: string; icon: React.ReactNode }[] = [
    { type: 'Header', label: 'Header', icon: <LayoutTemplate className="w-6 h-6" /> },
    { type: 'Hero', label: 'Hero Banner', icon: <Box className="w-6 h-6" /> },
    { type: 'Features', label: 'Features', icon: <List className="w-6 h-6" /> },
    { type: 'ProductGrid', label: 'Products', icon: <ShoppingBag className="w-6 h-6" /> },
    { type: 'Banner', label: 'Promo Banner', icon: <Image className="w-6 h-6" /> },
    { type: 'Testimonials', label: 'Testimonials', icon: <Type className="w-6 h-6" /> },
    { type: 'FAQ', label: 'FAQ', icon: <List className="w-6 h-6" /> },
    { type: 'ContactForm', label: 'Contact Form', icon: <LayoutTemplate className="w-6 h-6" /> },
    { type: 'Newsletter', label: 'Newsletter', icon: <LayoutTemplate className="w-6 h-6" /> },
    { type: 'Footer', label: 'Footer', icon: <LayoutTemplate className="w-6 h-6 rotate-180" /> },
    // Checkout Components
    { type: 'CheckoutHeader', label: 'Checkout Header', icon: <LayoutTemplate className="w-6 h-6" /> },
    { type: 'CheckoutForm', label: 'Customer Form', icon: <List className="w-6 h-6" /> },
    { type: 'OrderSummary', label: 'Order Summary', icon: <ShoppingBag className="w-6 h-6" /> },
    { type: 'TrustBadges', label: 'Trust Badges', icon: <Zap className="w-6 h-6" /> },
    { type: 'CountdownTimer', label: 'Urgency Timer', icon: <Zap className="w-6 h-6" /> },
    { type: 'BumpOffer', label: 'Bump Offer', icon: <Store className="w-6 h-6" /> },
    { type: 'SocialProof', label: 'Social Proof', icon: <Feather className="w-6 h-6" /> },
    { type: 'ExitIntentPopup', label: 'Exit Popup', icon: <LayoutTemplate className="w-6 h-6" /> },
];

const ICON_MAP: Record<string, React.ReactNode> = {
    'Zap': <Zap className="w-5 h-5" />,
    'Store': <Store className="w-5 h-5" />,
    'Feather': <Feather className="w-5 h-5" />
};

interface EditorSidebarProps {
    onApplyTemplate?: (template: StoreTemplate) => void;
    pageSlug: string;
}

export function EditorSidebar({ onApplyTemplate, pageSlug }: EditorSidebarProps) {
    const { language } = useLanguage();

    const filteredComponents = COMPONENTS.filter(comp => {
        if (pageSlug === 'checkout') {
            return [
                'CheckoutHeader', 'CheckoutForm', 'OrderSummary',
                'TrustBadges', 'CountdownTimer', 'BumpOffer',
                'SocialProof', 'ExitIntentPopup',
                'Banner', 'RichText'
            ].includes(comp.type);
        } else {
            // Home page components
            return ![
                'CheckoutHeader', 'CheckoutForm', 'OrderSummary',
                'TrustBadges', 'CountdownTimer', 'BumpOffer',
                'SocialProof', 'ExitIntentPopup'
            ].includes(comp.type);
        }
    });

    return (
        <div className="h-full flex flex-col bg-white border-r">
            <Tabs defaultValue="components" className="flex-1 flex flex-col h-full">
                <div className="p-4 border-b shrink-0">
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="components" className="gap-2">
                            <Component className="w-4 h-4" />
                            {language === 'ar' ? 'العناصر' : 'Components'}
                        </TabsTrigger>
                        <TabsTrigger value="templates" className="gap-2">
                            <Palette className="w-4 h-4" />
                            {language === 'ar' ? 'التصاميم' : 'Designs'}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent
                    value="components"
                    className="flex-1 m-0 p-0 outline-none data-[state=active]:flex data-[state=active]:flex-col min-h-0"
                >
                    <div className="flex flex-col h-full">
                        <div className="px-4 py-2 border-b bg-muted/20 shrink-0">
                            <p className="text-xs text-muted-foreground">
                                {language === 'ar' ? 'اسحب العناصر لإضافتها للصفحة' : 'Drag elements to add to page'}
                            </p>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-4 grid grid-cols-2 gap-3">
                                {filteredComponents.map((comp) => (
                                    <SidebarItem key={comp.type} {...comp} />
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </TabsContent>

                <TabsContent
                    value="templates"
                    className="flex-1 m-0 p-0 outline-none data-[state=active]:flex data-[state=active]:flex-col min-h-0"
                >
                    <div className="flex flex-col h-full">
                        <div className="px-4 py-2 border-b bg-muted/20 shrink-0">
                            <p className="text-xs text-muted-foreground">
                                {language === 'ar' ? 'اختر تصميماً جاهزاً لمتجرك' : 'Choose a ready-made design'}
                            </p>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-4">
                                {STORE_TEMPLATES.map((template) => (
                                    <div
                                        key={template.id}
                                        className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow hover:shadow-md transition-all cursor-pointer hover:ring-2 hover:ring-primary/20"
                                        onClick={() => onApplyTemplate?.(template)}
                                    >
                                        {/* Creative Header Background */}
                                        <div className={cn("h-24 w-full flex items-center justify-center", template.color)}>
                                            <div className="bg-white/90 p-3 rounded-full shadow-sm text-foreground">
                                                {ICON_MAP[template.icon] || <LayoutTemplate className="w-5 h-5" />}
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            <h3 className="font-semibold">{language === 'ar' ? template.name.ar : template.name.en}</h3>
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                {language === 'ar' ? template.description.ar : template.description.en}
                                            </p>
                                        </div>

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-primary/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <span className="text-white font-medium border border-white/40 px-4 py-2 rounded-full">
                                                {language === 'ar' ? 'تطبيق التصميم' : 'Apply Design'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

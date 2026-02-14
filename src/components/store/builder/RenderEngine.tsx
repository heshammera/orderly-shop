"use client";

import dynamic from 'next/dynamic';
import { PageSchema } from '@/lib/store-builder/types';
import { Loader2 } from 'lucide-react';
import { SectionControls } from './SectionControls';

const Hero = dynamic(() => import('./Hero').then(mod => mod.Hero), {
    loading: () => <div className="h-64 flex items-center justify-center bg-muted/20"><Loader2 className="animate-spin" /></div>
});
const Features = dynamic(() => import('./Features').then(mod => mod.Features), {
    loading: () => <div className="h-48 flex items-center justify-center bg-muted/20"><Loader2 className="animate-spin" /></div>
});
const ProductGrid = dynamic(() => import('./ProductGrid').then(mod => mod.ProductGrid), {
    loading: () => <div className="h-96 flex items-center justify-center bg-muted/20"><Loader2 className="animate-spin" /></div>
});
const Header = dynamic(() => import('./Header').then(mod => mod.Header), {
    loading: () => <div className="h-16 flex items-center justify-center bg-muted/20"><Loader2 className="animate-spin" /></div>
});
const Footer = dynamic(() => import('./Footer').then(mod => mod.Footer), {
    loading: () => <div className="h-32 flex items-center justify-center bg-muted/20"><Loader2 className="animate-spin" /></div>
});
const Banner = dynamic(() => import('./Banner').then(mod => mod.Banner), {
    loading: () => <div className="h-48 flex items-center justify-center bg-muted/20"><Loader2 className="animate-spin" /></div>
});
const Testimonials = dynamic(() => import('./Testimonials').then(mod => mod.Testimonials), {
    loading: () => <div className="h-64 flex items-center justify-center bg-muted/20"><Loader2 className="animate-spin" /></div>
});
const FAQ = dynamic(() => import('./FAQ').then(mod => mod.FAQ), {
    loading: () => <div className="h-64 flex items-center justify-center bg-muted/20"><Loader2 className="animate-spin" /></div>
});
const RichText = dynamic(() => import('./RichText').then(mod => mod.RichText), { // Assuming RichText might be added later or placeholder
    loading: () => <div className="h-32 flex items-center justify-center bg-muted/20"><Loader2 className="animate-spin" /></div>,
    ssr: false
});
const ContactForm = dynamic(() => import('./ContactForm').then(mod => mod.ContactForm), {
    loading: () => <div className="h-64 flex items-center justify-center bg-muted/20"><Loader2 className="animate-spin" /></div>
});
const Newsletter = dynamic(() => import('./Newsletter').then(mod => mod.Newsletter), {
    loading: () => <div className="h-48 flex items-center justify-center bg-muted/20"><Loader2 className="animate-spin" /></div>
});

// Checkout Components
const CheckoutHeader = dynamic(() => import('../checkout/CheckoutHeader').then(mod => mod.CheckoutHeader));
const CheckoutForm = dynamic(() => import('../checkout/CheckoutForm').then(mod => mod.CheckoutForm));
const OrderSummary = dynamic(() => import('../checkout/OrderSummary').then(mod => mod.OrderSummary));
const TrustBadges = dynamic(() => import('../checkout/addons/TrustBadges').then(mod => mod.TrustBadges));
const CountdownTimer = dynamic(() => import('../checkout/addons/CountdownTimer').then(mod => mod.CountdownTimer));
const BumpOffer = dynamic(() => import('../checkout/addons/BumpOffer').then(mod => mod.BumpOffer));
const SocialProof = dynamic(() => import('../checkout/addons/SocialProof').then(mod => mod.SocialProof));
const ExitIntentPopup = dynamic(() => import('../checkout/addons/ExitIntentPopup').then(mod => mod.ExitIntentPopup));


const COMPONENT_MAP: Record<string, any> = {
    'Hero': Hero,
    'Features': Features,
    'ProductGrid': ProductGrid,
    'Header': Header,
    'Footer': Footer,
    'Banner': Banner,
    'Testimonials': Testimonials,
    'FAQ': FAQ,
    'RichText': RichText,
    'ContactForm': ContactForm,
    'Newsletter': Newsletter,
    // Checkout
    'CheckoutHeader': CheckoutHeader,
    'CheckoutForm': CheckoutForm,
    'OrderSummary': OrderSummary,
    'TrustBadges': TrustBadges,
    'CountdownTimer': CountdownTimer,
    'BumpOffer': BumpOffer,
    'SocialProof': SocialProof,
    'ExitIntentPopup': ExitIntentPopup
};

export function RenderEngine({ schema, storeId, storeCurrency, storeSlug, isEditable = false, onUpdate, onSelectComponent, selectedComponentId, onDelete, onMoveUp, onMoveDown }: {
    schema: PageSchema,
    storeId: string,
    storeCurrency?: string,
    storeSlug?: string,
    isEditable?: boolean,
    onUpdate?: (id: string, content: any) => void,
    onSelectComponent?: (id: string) => void,
    selectedComponentId?: string | null,
    onDelete?: (id: string) => void,
    onMoveUp?: (id: string) => void,
    onMoveDown?: (id: string) => void
}) {
    if (!schema || !schema.sections) return null;

    return (
        <div className="min-h-screen bg-background text-foreground" style={{
            // Apply global CSS variables/styles if needed based on schema.globalSettings
            // '--primary': schema.globalSettings.colors.primary 
        } as any}>
            {schema.sections.map((section, index) => {
                const Component = COMPONENT_MAP[section.type];
                if (!Component) {
                    console.warn(`Unknown component type: ${section.type}`);
                    return null;
                }
                return (
                    <div key={section.id} className="relative group/section">
                        {isEditable && onDelete && onMoveUp && onMoveDown && onSelectComponent && (
                            <SectionControls
                                section={section}
                                isFirst={index === 0}
                                isLast={index === schema.sections.length - 1}
                                onDelete={onDelete}
                                onMoveUp={onMoveUp}
                                onMoveDown={onMoveDown}
                                onSelect={onSelectComponent}
                                isSelected={selectedComponentId === section.id}
                            />
                        )}
                        <Component
                            data={section}
                            storeId={storeId}
                            storeCurrency={storeCurrency}
                            storeSlug={storeSlug}
                            isEditable={isEditable}
                            onUpdate={isEditable ? onUpdate : undefined}
                        />
                    </div>
                );
            })}
        </div>
    );
}

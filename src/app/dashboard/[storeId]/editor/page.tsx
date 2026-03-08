'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowLeft, Eye, Save, Plus, Monitor, Tablet, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import SidebarForm from '@/components/ThemeEngine/Customizer/SidebarForm';
import { SortableSidebarItem } from '@/components/ThemeEngine/Customizer/SortableSidebarItem';

// Import schemas
import featuredGridSchema from '@/themes/default/sections/FeaturedGrid/schema.json';
import heroBannerSchema from '@/themes/default/sections/HeroBanner/schema.json';
import categorySliderSchema from '@/themes/default/sections/CategorySlider/schema.json';
import footerSchema from '@/themes/default/sections/Footer/schema.json';
import headerSchema from '@/themes/default/sections/Header/schema.json';
import newsletterSchema from '@/themes/default/sections/Newsletter/schema.json';
import mainCheckoutSchema from '@/themes/default/sections/MainCheckout/schema.json';
import mainProductSchema from '@/themes/default/sections/MainProduct/schema.json';

import { hslToHex, hexToHsl } from '@/lib/color-utils';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutList, Palette, PlusCircle } from 'lucide-react';

const sectionSchemas: Record<string, any> = {
    'header': headerSchema,
    'hero_banner': heroBannerSchema,
    'category_slider': categorySliderSchema,
    'featured_grid': featuredGridSchema,
    'newsletter': newsletterSchema,
    'footer': footerSchema,
    'main_checkout': mainCheckoutSchema,
    'main_product': mainProductSchema,
};

const DEFAULT_GLOBAL_TOKENS = {
    'primary': '262.1 83.3% 57.8%',
    'primary-foreground': '210 40% 98%',
    'background': '0 0% 100%',
    'foreground': '222.2 84% 4.9%',
    'radius': '1rem'
};

const DEFAULT_PAGE_DATA = {
    sections_order: ['header_1', 'hero_banner_1', 'category_slider_1', 'featured_grid_1', 'newsletter_1', 'footer_1'],
    sections_data: {
        'header_1': { type: 'header', settings: { notice_text: '🔥 شحن مجاني للطلبات فوق 200 ريال!', search_placeholder: 'ابحث عن منتج...' }, blocks: [{ type: 'link', settings: { label: 'الرئيسية', url: '/' } }, { type: 'link', settings: { label: 'كل المنتجات', url: '/products' } }] },
        'hero_banner_1': { type: 'hero_banner', settings: { heading: 'اكتشف أحدث العروض الحصرية', subheading: 'تسوق الآن واحصل على خصم 20%', button_label: 'تسوق الآن' }, blocks: [] },
        'category_slider_1': {
            type: 'category_slider', settings: { heading: 'تسوق حسب التصنيف', subheading: 'تصفح مجموعاتنا' }, blocks: [
                { type: 'category', settings: { title: 'إلكترونيات', image_url: '', link: '' } },
                { type: 'category', settings: { title: 'أزياء', image_url: '', link: '' } },
                { type: 'category', settings: { title: 'عطور', image_url: '', link: '' } },
                { type: 'category', settings: { title: 'مكياج', image_url: '', link: '' } }
            ]
        },
        'featured_grid_1': {
            type: 'featured_grid', settings: { heading: 'استمتع بأحدث التشكيلات', subheading: 'اخترنا لك بعناية' }, blocks: [
                { type: 'product', settings: { product_id: '' } },
                { type: 'product', settings: { product_id: '' } },
                { type: 'product', settings: { product_id: '' } },
                { type: 'product', settings: { product_id: '' } }
            ]
        },
        'footer_1': { type: 'footer', settings: { about_heading: 'عن متجرنا', about_text: 'نقدم أفضل المنتجات.', copyright: 'جميع الحقوق محفوظة' }, blocks: [] },
        'newsletter_1': { type: 'newsletter', settings: { heading: 'اشترك في نشرتنا البريدية', button_label: 'اشتراك' }, blocks: [] }
    }
};

export default function EditorPage({ params }: { params: { storeId: string } }) {
    const { storeId } = params;
    const { language } = useLanguage();
    const router = useRouter();
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [store, setStore] = useState<any>(null);
    const [pageSlug, setPageSlug] = useState<string>('home');
    const [previewProductId, setPreviewProductId] = useState<string | null>(null);
    const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

    // Theme Engine State
    const [globalTokens, setGlobalTokens] = useState<Record<string, string>>(DEFAULT_GLOBAL_TOKENS);
    const [pageData, setPageData] = useState<Record<string, any>>(DEFAULT_PAGE_DATA);

    const supabase = createClient();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [themeRes, storeRes, productsRes] = await Promise.all([
                    supabase.from('store_themes')
                        .select('id, global_tokens, store_theme_templates(page_type, settings_data)')
                        .eq('store_id', storeId)
                        .eq('is_active', true)
                        .maybeSingle(),
                    supabase.from('stores').select('*').eq('id', storeId).single(),
                    supabase.from('products').select('id').eq('store_id', storeId).limit(1),
                    supabase.from('products').select('id, name, price, sale_price, images, category_id:product_categories(category_id)').eq('store_id', storeId).eq('status', 'active').limit(50)
                ]);

                if (productsRes.data && productsRes.data.length > 0) {
                    setPreviewProductId(productsRes.data[0].id);
                }

                if (themeRes.data) {
                    if (themeRes.data.global_tokens && Object.keys(themeRes.data.global_tokens).length > 0) {
                        setGlobalTokens(themeRes.data.global_tokens);
                    } else {
                        setGlobalTokens(DEFAULT_GLOBAL_TOKENS);
                    }

                    const overrides = themeRes.data.store_theme_templates || [];
                    const homeOverride = overrides.find((o: any) => o.page_type === 'home')?.settings_data;
                    const currentOverride = overrides.find((o: any) => o.page_type === pageSlug)?.settings_data;

                    // Extract Global Sections (Header & Footer) from Home
                    let globalHeaderId = 'header_1';
                    let globalFooterId = 'footer_1';
                    let globalHeaderData = DEFAULT_PAGE_DATA.sections_data['header_1'];
                    let globalFooterData = DEFAULT_PAGE_DATA.sections_data['footer_1'];

                    if (homeOverride?.sections_order) {
                        globalHeaderId = homeOverride.sections_order.find((id: string) => homeOverride.sections_data[id]?.type === 'header') || 'header_1';
                        globalFooterId = homeOverride.sections_order.find((id: string) => homeOverride.sections_data[id]?.type === 'footer') || 'footer_1';
                        if (homeOverride.sections_data[globalHeaderId]) globalHeaderData = homeOverride.sections_data[globalHeaderId];
                        if (homeOverride.sections_data[globalFooterId]) globalFooterData = homeOverride.sections_data[globalFooterId];
                    }

                    // Assemble Base Data for current page
                    let newOrder: string[] = [];
                    let newData: any = {};

                    if (currentOverride?.sections_order) {
                        newOrder = currentOverride.sections_order;
                        newData = currentOverride.sections_data || {};

                        // Defensive: if overrides were saved with empty blocks, populate defaults
                        if (pageSlug === 'home') {
                            const catKey = newOrder.find((id: string) => newData[id]?.type === 'category_slider');
                            if (catKey && (!newData[catKey].blocks || newData[catKey].blocks.length === 0)) {
                                newData[catKey] = {
                                    ...newData[catKey], blocks: [
                                        { type: 'category', settings: { title: 'إلكترونيات', image_url: '', link: '' } },
                                        { type: 'category', settings: { title: 'أزياء', image_url: '', link: '' } },
                                        { type: 'category', settings: { title: 'عطور', image_url: '', link: '' } },
                                        { type: 'category', settings: { title: 'مكياج', image_url: '', link: '' } }
                                    ]
                                };
                            }
                            const gridKey = newOrder.find((id: string) => newData[id]?.type === 'featured_grid');
                            if (gridKey && (!newData[gridKey].blocks || newData[gridKey].blocks.length === 0)) {
                                newData[gridKey] = {
                                    ...newData[gridKey], blocks: [
                                        { type: 'product', settings: { product_id: '' } },
                                        { type: 'product', settings: { product_id: '' } },
                                        { type: 'product', settings: { product_id: '' } },
                                        { type: 'product', settings: { product_id: '' } }
                                    ]
                                };
                            }
                        } else if (pageSlug === 'product') {
                            const mainKey = newOrder.find((id: string) => newData[id]?.type === 'main_product');
                            if (mainKey && (!newData[mainKey].blocks || newData[mainKey].blocks.length === 0)) {
                                newData[mainKey] = {
                                    ...newData[mainKey], blocks: [
                                        { type: 'title', id: 'block_title', settings: {} },
                                        { type: 'price', id: 'block_price', settings: {} },
                                        { type: 'visitors', id: 'block_visitors', settings: {} },
                                        { type: 'quantity', id: 'block_quantity', settings: {} },
                                        { type: 'offers', id: 'block_offers', settings: {} },
                                        { type: 'variants', id: 'block_variants', settings: {} },
                                        { type: 'buy_buttons', id: 'block_buy_buttons', settings: {} },
                                        { type: 'countdown', id: 'block_countdown', settings: {} },
                                        { type: 'shipping_info', id: 'block_shipping', settings: {} },
                                        { type: 'description', id: 'block_description', settings: {} }
                                    ]
                                };
                            }
                        } else if (pageSlug === 'checkout') {
                            const mainKey = newOrder.find((id: string) => newData[id]?.type === 'main_checkout');
                            if (mainKey && (!newData[mainKey].blocks || newData[mainKey].blocks.length === 0)) {
                                newData[mainKey] = {
                                    ...newData[mainKey], blocks: [
                                        { type: 'checkout_field', id: 'field_name', settings: { field_id: 'name', visible: true, required: true, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_phone', settings: { field_id: 'phone', visible: true, required: true, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_alt_phone', settings: { field_id: 'alt_phone', visible: false, required: false, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_email', settings: { field_id: 'email', visible: false, required: false, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_governorate', settings: { field_id: 'governorate', visible: false, required: false, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_city', settings: { field_id: 'city', visible: true, required: true, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_address', settings: { field_id: 'address', visible: true, required: true, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_notes', settings: { field_id: 'notes', visible: false, required: false, placeholder: '' } },
                                    ]
                                };
                            }
                        }
                    } else {
                        if (pageSlug === 'home') {
                            newOrder = [...DEFAULT_PAGE_DATA.sections_order];
                            newData = { ...DEFAULT_PAGE_DATA.sections_data };
                        } else if (pageSlug === 'product') {
                            newOrder = ['main_product_1'];
                            newData = {
                                'main_product_1': {
                                    type: 'main_product',
                                    settings: {},
                                    blocks: [
                                        { type: 'title', id: 'block_title', settings: {} },
                                        { type: 'price', id: 'block_price', settings: {} },
                                        { type: 'visitors', id: 'block_visitors', settings: {} },
                                        { type: 'quantity', id: 'block_quantity', settings: {} },
                                        { type: 'offers', id: 'block_offers', settings: {} },
                                        { type: 'variants', id: 'block_variants', settings: {} },
                                        { type: 'buy_buttons', id: 'block_buy_buttons', settings: {} },
                                        { type: 'countdown', id: 'block_countdown', settings: {} },
                                        { type: 'shipping_info', id: 'block_shipping', settings: {} },
                                        { type: 'description', id: 'block_description', settings: {} }
                                    ]
                                }
                            };
                        } else if (pageSlug === 'checkout') {
                            newOrder = ['main_checkout_1'];
                            newData = {
                                'main_checkout_1': {
                                    type: 'main_checkout',
                                    settings: {},
                                    blocks: [
                                        { type: 'checkout_field', id: 'field_name', settings: { field_id: 'name', visible: true, required: true, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_phone', settings: { field_id: 'phone', visible: true, required: true, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_alt_phone', settings: { field_id: 'alt_phone', visible: false, required: false, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_email', settings: { field_id: 'email', visible: false, required: false, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_governorate', settings: { field_id: 'governorate', visible: false, required: false, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_city', settings: { field_id: 'city', visible: true, required: true, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_address', settings: { field_id: 'address', visible: true, required: true, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_notes', settings: { field_id: 'notes', visible: false, required: false, placeholder: '' } },
                                    ]
                                }
                            };
                        }
                    }

                    // Enforce Global Header and Footer injection
                    newOrder = newOrder.filter((id: string) => newData[id]?.type !== 'header' && newData[id]?.type !== 'footer');
                    newOrder = [globalHeaderId, ...newOrder, globalFooterId];
                    newData[globalHeaderId] = globalHeaderData;
                    newData[globalFooterId] = globalFooterData;

                    setPageData({
                        sections_order: newOrder,
                        sections_data: newData
                    });

                } else {
                    // No active theme found — build page-aware defaults
                    const defaultHeaderData = DEFAULT_PAGE_DATA.sections_data['header_1'];
                    const defaultFooterData = DEFAULT_PAGE_DATA.sections_data['footer_1'];

                    if (pageSlug === 'home') {
                        setPageData({ ...DEFAULT_PAGE_DATA });
                    } else if (pageSlug === 'product') {
                        setPageData({
                            sections_order: ['header_1', 'main_product_1', 'footer_1'],
                            sections_data: {
                                'header_1': defaultHeaderData,
                                'main_product_1': {
                                    type: 'main_product',
                                    settings: {},
                                    blocks: [
                                        { type: 'title', id: 'block_title', settings: {} },
                                        { type: 'price', id: 'block_price', settings: {} },
                                        { type: 'visitors', id: 'block_visitors', settings: {} },
                                        { type: 'quantity', id: 'block_quantity', settings: {} },
                                        { type: 'offers', id: 'block_offers', settings: {} },
                                        { type: 'variants', id: 'block_variants', settings: {} },
                                        { type: 'buy_buttons', id: 'block_buy_buttons', settings: {} },
                                        { type: 'countdown', id: 'block_countdown', settings: {} },
                                        { type: 'shipping_info', id: 'block_shipping', settings: {} },
                                        { type: 'description', id: 'block_description', settings: {} }
                                    ]
                                },
                                'footer_1': defaultFooterData,
                            }
                        });
                    } else if (pageSlug === 'checkout') {
                        setPageData({
                            sections_order: ['header_1', 'main_checkout_1', 'footer_1'],
                            sections_data: {
                                'header_1': defaultHeaderData,
                                'main_checkout_1': {
                                    type: 'main_checkout',
                                    settings: {},
                                    blocks: [
                                        { type: 'checkout_field', id: 'field_name', settings: { field_id: 'name', visible: true, required: true, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_phone', settings: { field_id: 'phone', visible: true, required: true, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_alt_phone', settings: { field_id: 'alt_phone', visible: false, required: false, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_email', settings: { field_id: 'email', visible: false, required: false, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_governorate', settings: { field_id: 'governorate', visible: false, required: false, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_city', settings: { field_id: 'city', visible: true, required: true, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_address', settings: { field_id: 'address', visible: true, required: true, placeholder: '' } },
                                        { type: 'checkout_field', id: 'field_notes', settings: { field_id: 'notes', visible: false, required: false, placeholder: '' } },
                                    ]
                                },
                                'footer_1': defaultFooterData,
                            }
                        });
                    } else {
                        setPageData({ ...DEFAULT_PAGE_DATA });
                    }
                    setGlobalTokens(DEFAULT_GLOBAL_TOKENS);
                }

                if (storeRes.data) {
                    setStore(storeRes.data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load editor data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [storeId, supabase, pageSlug]);

    // Send full data to iframe when loaded
    useEffect(() => {
        if (!loading && iframeRef.current?.contentWindow) {
            // Give iframe a moment to mount before sending initial postMessage if it was just loaded
            setTimeout(() => {
                iframeRef.current?.contentWindow?.postMessage({
                    type: 'REPLACE_PAGE_DATA',
                    pageData: pageData
                }, '*');
                iframeRef.current?.contentWindow?.postMessage({
                    type: 'UPDATE_GLOBAL_TOKEN',
                    tokens: globalTokens
                }, '*');
            }, 500);
        }
    }, [loading]);

    const handleSave = async (arg?: any) => {
        const retryCount = typeof arg === 'number' ? arg : 0;
        setSaving(true);
        let currentError: any = null;

        try {
            // 1. Current Active Theme
            const { data: activeTheme } = await supabase
                .from('store_themes')
                .select('id')
                .eq('store_id', storeId)
                .eq('is_active', true)
                .single();

            if (!activeTheme) {
                toast.error(language === 'ar' ? 'يجب تفعيل ثيم أولاً من مدير الثيمات' : 'You must activate a theme first from Theme Manager');
                setSaving(false);
                return;
            }

            const contentToSave = {
                sections_order: pageData.sections_order,
                sections_data: pageData.sections_data,
            };

            // 2. Update Global Tokens in store_themes
            const { error: themeUpdateError } = await supabase
                .from('store_themes')
                .update({ global_tokens: globalTokens })
                .eq('id', activeTheme.id);

            if (themeUpdateError) throw themeUpdateError;

            // 3. Save Overrides for current page (select-first to avoid needing a unique constraint)
            const { data: existingTemplate } = await supabase
                .from('store_theme_templates')
                .select('id')
                .eq('store_theme_id', activeTheme.id)
                .eq('page_type', pageSlug)
                .maybeSingle();

            let saveError;
            if (existingTemplate) {
                const { error } = await supabase
                    .from('store_theme_templates')
                    .update({ settings_data: contentToSave })
                    .eq('id', existingTemplate.id);
                saveError = error;
            } else {
                const { error } = await supabase
                    .from('store_theme_templates')
                    .insert({
                        store_theme_id: activeTheme.id,
                        page_type: pageSlug,
                        settings_data: contentToSave
                    });
                saveError = error;
            }

            if (saveError) throw saveError;

            // 4. Force Sync Global Sections to Home if we are on another page and edited them!
            if (pageSlug !== 'home') {
                const globalHeaderId = pageData.sections_order.find((id: string) => pageData.sections_data[id]?.type === 'header');
                const globalFooterId = pageData.sections_order.find((id: string) => pageData.sections_data[id]?.type === 'footer');

                if (globalHeaderId && globalFooterId) {
                    const { data: homeOverrideData } = await supabase
                        .from('store_theme_templates')
                        .select('settings_data')
                        .eq('store_theme_id', activeTheme.id)
                        .eq('page_type', 'home')
                        .maybeSingle();

                    if (homeOverrideData && homeOverrideData.settings_data) {
                        const newHomeData = { ...homeOverrideData.settings_data };
                        if (!newHomeData.sections_data) newHomeData.sections_data = {};
                        newHomeData.sections_data[globalHeaderId] = pageData.sections_data[globalHeaderId];
                        newHomeData.sections_data[globalFooterId] = pageData.sections_data[globalFooterId];

                        await supabase
                            .from('store_theme_templates')
                            .update({ settings_data: newHomeData })
                            .eq('store_theme_id', activeTheme.id)
                            .eq('page_type', 'home');
                    }
                }
            }

            if (store?.slug) {
                try {
                    const path = pageSlug === 'home' ? `/s/${store.slug}` : `/s/${store.slug}/${pageSlug}`;
                    await fetch(`/api/revalidate?path=${path}&type=layout`, { method: 'POST' });
                } catch (e) { }
            }

            toast.success(language === 'ar' ? 'تم حفظ التغييرات بنجاح!' : 'Changes saved successfully!');
        } catch (error: any) {
            currentError = error;
            console.error('Save error:', error);
            if (retryCount < 2) {
                setTimeout(() => handleSave(retryCount + 1), 1000);
                return;
            }
            toast.error(`Failed to save: ${error.message}`);
        } finally {
            if (retryCount >= 2 || !currentError) setSaving(false);
        }
    };

    const getHexFromToken = (hslStr: string) => {
        try { return hslStr?.startsWith('#') ? hslStr : hslToHex(hslStr); } catch { return '#000000'; }
    };

    const setHexToToken = (key: string, hexStr: string) => {
        try { handleColorChange(key, hexToHsl(hexStr)); } catch { handleColorChange(key, hexStr); }
    };

    const handleSettingChange = (sectionId: string, key: string, value: any) => {
        setPageData(prev => {
            const newData = {
                ...prev, sections_data: {
                    ...prev.sections_data, [sectionId]: {
                        ...prev.sections_data[sectionId], settings: {
                            ...prev.sections_data[sectionId].settings, [key]: value
                        }
                    }
                }
            };
            iframeRef.current?.contentWindow?.postMessage({ type: 'UPDATE_SECTION_SETTING', sectionId, settings: { [key]: value } }, '*');
            return newData;
        });
    };

    const handleBlockChange = (sectionId: string, blockIndex: number, key: string, value: any) => {
        setPageData(prev => {
            const section = prev.sections_data[sectionId];
            if (!section || !section.blocks) return prev;
            const newBlocks = [...section.blocks];
            newBlocks[blockIndex] = { ...newBlocks[blockIndex], settings: { ...newBlocks[blockIndex].settings, [key]: value } };
            const newData = { ...prev, sections_data: { ...prev.sections_data, [sectionId]: { ...section, blocks: newBlocks } } };
            iframeRef.current?.contentWindow?.postMessage({ type: 'REPLACE_PAGE_DATA', pageData: newData }, '*');
            return newData;
        });
    };

    const handleAddBlock = (sectionId: string, blockType: string) => {
        setPageData(prev => {
            const section = prev.sections_data[sectionId];
            if (!section) return prev;
            const newData = { ...prev, sections_data: { ...prev.sections_data, [sectionId]: { ...section, blocks: [...(section.blocks || []), { type: blockType, settings: {} }] } } };
            iframeRef.current?.contentWindow?.postMessage({ type: 'REPLACE_PAGE_DATA', pageData: newData }, '*');
            return newData;
        });
    };

    const handleRemoveBlock = (sectionId: string, blockIndex: number) => {
        setPageData(prev => {
            const section = prev.sections_data[sectionId];
            if (!section || !section.blocks) return prev;
            const newBlocks = [...section.blocks];
            newBlocks.splice(blockIndex, 1);
            const newData = { ...prev, sections_data: { ...prev.sections_data, [sectionId]: { ...section, blocks: newBlocks } } };
            iframeRef.current?.contentWindow?.postMessage({ type: 'REPLACE_PAGE_DATA', pageData: newData }, '*');
            return newData;
        });
    };

    const handleReorderBlocks = (sectionId: string, oldIndex: number, newIndex: number) => {
        setPageData(prev => {
            const section = prev.sections_data[sectionId];
            if (!section || !section.blocks) return prev;
            const newBlocks = [...section.blocks];
            const [moved] = newBlocks.splice(oldIndex, 1);
            newBlocks.splice(newIndex, 0, moved);
            const newData = { ...prev, sections_data: { ...prev.sections_data, [sectionId]: { ...section, blocks: newBlocks } } };
            iframeRef.current?.contentWindow?.postMessage({ type: 'REPLACE_PAGE_DATA', pageData: newData }, '*');
            return newData;
        });
    };

    const handleColorChange = (key: string, value: string) => {
        setGlobalTokens(prev => ({ ...prev, [key]: value }));
        iframeRef.current?.contentWindow?.postMessage({ type: 'UPDATE_GLOBAL_TOKEN', tokens: { [key]: value } }, '*');
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setPageData((prev) => {
                const oldIndex = prev.sections_order.indexOf(active.id as string);
                const newIndex = prev.sections_order.indexOf(over.id as string);
                const newOrder = arrayMove(prev.sections_order, oldIndex, newIndex);
                const newData = { ...prev, sections_order: newOrder };
                iframeRef.current?.contentWindow?.postMessage({ type: 'REPLACE_PAGE_DATA', pageData: newData }, '*');
                return newData;
            });
        }
    };

    const handleAddSection = (type: string) => {
        const id = `${type}_${Date.now()}`;
        setPageData(prev => {
            const newData = {
                ...prev,
                sections_order: [...prev.sections_order, id],
                sections_data: {
                    ...prev.sections_data,
                    [id]: {
                        type,
                        settings: {},
                        blocks: []
                    }
                }
            };
            iframeRef.current?.contentWindow?.postMessage({ type: 'REPLACE_PAGE_DATA', pageData: newData }, '*');
            iframeRef.current?.contentWindow?.postMessage({ type: 'UPDATE_STORE_CONTEXT', storeContext: store }, '*');
            toast.success(`Section added`);
            return newData;
        });
    };

    const deleteSection = (id: string) => {
        setPageData(prev => {
            const newOrder = prev.sections_order.filter(secId => secId !== id);
            const newData = { ...prev };
            delete newData.sections_data[id];

            const finalData = {
                ...newData,
                sections_order: newOrder
            };
            iframeRef.current?.contentWindow?.postMessage({ type: 'REPLACE_PAGE_DATA', pageData: finalData }, '*');
            iframeRef.current?.contentWindow?.postMessage({ type: 'UPDATE_STORE_CONTEXT', storeContext: store }, '*');
            toast.success(`Section removed`);
            return finalData;
        });
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    let previewUrl = `/s/${store?.slug || storeId}?preview=true`;
    if (pageSlug === 'product') {
        previewUrl = previewProductId
            ? `/s/${store?.slug || storeId}/p/${previewProductId}?preview=true`
            : `/s/${store?.slug || storeId}/products?preview=true`; // Fallback if no products
    } else if (pageSlug === 'checkout') {
        previewUrl = `/s/${store?.slug || storeId}/checkout?preview=true`;
    }

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>

            {/* Header */}
            <header className="h-14 border-b bg-white flex items-center justify-between px-4 z-50 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/${storeId}`}>
                            <ArrowLeft className={`w-4 h-4 mr-2 ${language === 'ar' ? 'ml-2 mr-0 rotate-180' : ''}`} />
                            {language === 'ar' ? 'عودة' : 'Back'}
                        </Link>
                    </Button>
                    <div className="h-6 w-px bg-slate-200" />
                    <Select value={pageSlug} onValueChange={setPageSlug}>
                        <SelectTrigger className="w-[180px] h-8 text-sm bg-white" dir="rtl">
                            <SelectValue placeholder="اختر الصفحة" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="home">الصفحة الرئيسية</SelectItem>
                            <SelectItem value="product">صفحة المنتج</SelectItem>
                            <SelectItem value="checkout">صفحة الدفع</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200" dir="ltr">
                    <button
                        onClick={() => setDeviceView('desktop')}
                        className={`p-1.5 rounded-md flex items-center justify-center transition-all ${deviceView === 'desktop' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        title="Desktop View"
                    >
                        <Monitor className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setDeviceView('tablet')}
                        className={`p-1.5 rounded-md flex items-center justify-center transition-all ${deviceView === 'tablet' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        title="Tablet View"
                    >
                        <Tablet className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setDeviceView('mobile')}
                        className={`p-1.5 rounded-md flex items-center justify-center transition-all ${deviceView === 'mobile' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        title="Mobile View"
                    >
                        <Smartphone className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                        <Link href={previewUrl.replace('?preview=true', '')} target="_blank">
                            <Eye className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                            {language === 'ar' ? 'معاينة حية' : 'Live Preview'}
                        </Link>
                    </Button>
                    <Button size="sm" onClick={() => handleSave()} disabled={saving} className="min-w-[100px]">
                        {saving ? <Loader2 className={`animate-spin w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} /> : <Save className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />}
                        {language === 'ar' ? 'حفظ ونشر' : 'Save & Publish'}
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* 1. Editor Sidebar */}
                <aside className="w-80 h-full bg-card border-l border-border flex flex-col shadow-xl z-10 shrink-0 overflow-y-auto">
                    <div className="p-4 flex flex-col gap-6">

                        <Tabs defaultValue="sections" className="w-full flex-1 flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                            <TabsList className="w-full grid grid-cols-3 mb-6">
                                <TabsTrigger value="sections" className="text-xs flex gap-2">
                                    <LayoutList className="w-4 h-4" />
                                    {language === 'ar' ? 'الأقسام' : 'Sections'}
                                </TabsTrigger>
                                <TabsTrigger value="add" className="text-xs flex gap-2">
                                    <PlusCircle className="w-4 h-4" />
                                    {language === 'ar' ? 'إضافة' : 'Add'}
                                </TabsTrigger>
                                <TabsTrigger value="theme" className="text-xs flex gap-2">
                                    <Palette className="w-4 h-4" />
                                    {language === 'ar' ? 'الألوان' : 'Colors'}
                                </TabsTrigger>
                            </TabsList>

                            {/* Tab 1: Sections List */}
                            <TabsContent value="sections" className="flex-1 overflow-y-auto pr-1">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={pageData.sections_order} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-4">
                                            {pageData.sections_order.map((sectionId: string) => {
                                                const sectionData = pageData.sections_data[sectionId];
                                                if (!sectionData) return null;
                                                // Hide Header/Footer from sidebar on non-home pages (they're global, editable only from Home)
                                                if (pageSlug !== 'home' && (sectionData.type === 'header' || sectionData.type === 'footer')) return null;
                                                const schema = sectionSchemas[sectionData.type];
                                                if (!schema) return null;

                                                return (
                                                    <div key={sectionId} className="relative group">
                                                        <SortableSidebarItem id={sectionId}>
                                                            <SidebarForm
                                                                sectionId={sectionId}
                                                                schema={schema}
                                                                settings={sectionData.settings || {}}
                                                                blocks={sectionData.blocks || []}
                                                                globalTokens={globalTokens}
                                                                onChange={handleSettingChange}
                                                                onBlockChange={handleBlockChange}
                                                                onAddBlock={handleAddBlock}
                                                                onRemoveBlock={handleRemoveBlock}
                                                                onReorderBlocks={handleReorderBlocks}
                                                                onColorChange={handleColorChange}
                                                                storeId={storeId}
                                                            />
                                                        </SortableSidebarItem>
                                                        <button
                                                            onClick={() => deleteSection(sectionId)}
                                                            className="absolute top-2 left-2 z-20 p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Delete Section"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </TabsContent>

                            {/* Tab 2: Add New Section */}
                            <TabsContent value="add" className="space-y-4">
                                <div className="text-sm text-muted-foreground mb-4">
                                    {language === 'ar' ? 'اختر تصنيفاً لإضافته للمتجر:' : 'Select a section to add:'}
                                </div>
                                <div className="grid gap-3">
                                    {Object.keys(sectionSchemas)
                                        .filter(key => {
                                            if (key.startsWith('main_') || key === 'header' || key === 'footer') return false;
                                            if (pageSlug === 'checkout') return key === 'newsletter'; // restrict heavy sections on checkout
                                            return true;
                                        })
                                        .map(key => (
                                            <div
                                                key={key}
                                                className="border rounded-lg p-3 hover:border-primary hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-all"
                                                onClick={() => handleAddSection(key)}
                                            >
                                                <div className="font-medium text-sm">
                                                    {sectionSchemas[key].name || key}
                                                </div>
                                                <PlusCircle className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                                            </div>
                                        ))}
                                </div>
                            </TabsContent>

                            {/* Tab 3: Global Theme Attributes */}
                            <TabsContent value="theme">
                                <div className="bg-card text-card-foreground p-4 rounded-lg shadow-sm border border-border">
                                    <h3 className="font-bold text-lg mb-4 border-b pb-2">{language === 'ar' ? 'ألوان المتجر (Global)' : 'Store Colors (Global)'}</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-sm font-medium">{language === 'ar' ? 'لون الأساس (Primary)' : 'Primary Color'}</label>
                                            <input type="color" value={getHexFromToken(globalTokens['primary'] || '')} onChange={(e) => setHexToToken('primary', e.target.value)} className="w-10 h-10 rounded border p-0 cursor-pointer" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label className="block text-sm font-medium">{language === 'ar' ? 'الخلفية (Background)' : 'Background Color'}</label>
                                            <input type="color" value={getHexFromToken(globalTokens['background'] || '')} onChange={(e) => setHexToToken('background', e.target.value)} className="w-10 h-10 rounded border p-0 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                        </Tabs>


                    </div>
                </aside>

                {/* 2. Live Preview Iframe */}
                <main className="flex-1 h-full bg-slate-100 relative p-4 flex flex-col items-center overflow-x-hidden overflow-y-auto">
                    <div className={`transition-all duration-300 ease-in-out flex-1 flex flex-col bg-white overflow-hidden rounded-xl shadow-xl border border-slate-200 ${deviceView === 'desktop' ? 'w-full max-w-5xl' :
                        deviceView === 'tablet' ? 'w-[768px]' :
                            'w-[375px]'
                        }`}>
                        <div className="w-full h-10 bg-slate-50 border-b flex items-center px-4 gap-2 shrink-0">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                            </div>
                            <div className="mx-auto bg-slate-100 rounded px-4 py-1 text-xs text-slate-500 flex-1 text-center truncate pointer-events-none">
                                {window.location.origin}{previewUrl}
                            </div>
                        </div>

                        <iframe
                            ref={iframeRef}
                            src={previewUrl}
                            className="w-full flex-1 border-0"
                            title="Theme Preview"
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}

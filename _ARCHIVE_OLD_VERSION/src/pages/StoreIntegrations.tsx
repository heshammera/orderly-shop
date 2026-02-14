import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plug, Facebook, Share2, Camera, FileSpreadsheet, Loader2 } from 'lucide-react';

interface Integration {
    id: string;
    store_id: string;
    provider: 'google_sheets' | 'facebook_pixel' | 'tiktok_pixel' | 'snapchat_pixel';
    config: {
        pixel_ids?: string[]; // Support multiple pixel IDs
        sheet_id?: string; // Google Sheet ID
        service_account_key?: any; // Google Service Account JSON
        product_filter?: {
            type: 'all' | 'specific' | 'selected';
            product_ids?: string[]; // For 'specific' or 'selected' types
        };
    };
    is_active: boolean;
}

export default function StoreIntegrations() {
    const { storeId } = useParams<{ storeId: string }>();
    const { language } = useLanguage();
    const queryClient = useQueryClient();

    // Fetch store info
    const { data: store } = useQuery({
        queryKey: ['store', storeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('stores')
                .select('id, name, slug')
                .eq('id', storeId!)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!storeId,
    });

    // Fetch integrations
    const { data: integrations = [], isLoading } = useQuery({
        queryKey: ['integrations', storeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('store_integrations')
                .select('*')
                .eq('store_id', storeId!);
            if (error) throw error;
            return data as Integration[];
        },
        enabled: !!storeId,
    });

    // Upsert integration mutation
    const upsertMutation = useMutation({
        mutationFn: async ({
            provider,
            config,
            isActive,
        }: {
            provider: Integration['provider'];
            config: Integration['config'];
            isActive: boolean;
        }) => {
            const { data, error } = await supabase
                .from('store_integrations')
                .upsert(
                    {
                        store_id: storeId!,
                        provider,
                        config,
                        is_active: isActive,
                    },
                    {
                        onConflict: 'store_id,provider',
                    }
                )
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['integrations', storeId] });
            toast.success(language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully');
        },
        onError: (error) => {
            console.error('Integration save error:', error);
            toast.error(language === 'ar' ? 'فشل الحفظ' : 'Save failed');
        },
    });

    const storeName = store?.name
        ? (store.name as { ar: string; en: string })[language] || (store.name as { ar: string; en: string }).ar
        : '';

    const getIntegration = (provider: Integration['provider']) => {
        return integrations.find((i) => i.provider === provider);
    };

    const handleSavePixel = (provider: 'facebook_pixel' | 'tiktok_pixel' | 'snapchat_pixel', pixelIds: string[], isActive: boolean) => {
        upsertMutation.mutate({
            provider,
            config: { pixel_ids: pixelIds },
            isActive,
        });
    };

    const handleSaveGoogleSheets = (config: any, isActive: boolean) => {
        upsertMutation.mutate({
            provider: 'google_sheets',
            config,
            isActive,
        });
    };

    return (
        <DashboardLayout storeId={storeId!} storeName={storeName}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Plug className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">
                            {language === 'ar' ? 'الربط والتكامل' : 'Integrations'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {language === 'ar'
                                ? 'ربط متجرك بالخدمات الخارجية'
                                : 'Connect your store with external services'}
                        </p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {/* Facebook Pixel */}
                        <PixelCard
                            provider="facebook_pixel"
                            icon={<Facebook className="w-5 h-5" />}
                            title={language === 'ar' ? 'Facebook Pixel' : 'Facebook Pixel'}
                            description={
                                language === 'ar'
                                    ? 'تتبع أحداث الزوار والمبيعات على فيسبوك'
                                    : 'Track visitor events and sales on Facebook'
                            }
                            integration={getIntegration('facebook_pixel')}
                            onSave={handleSavePixel}
                            language={language}
                            isSaving={upsertMutation.isPending}
                        />

                        {/* TikTok Pixel */}
                        <PixelCard
                            provider="tiktok_pixel"
                            icon={<Share2 className="w-5 h-5" />}
                            title={language === 'ar' ? 'TikTok Pixel' : 'TikTok Pixel'}
                            description={
                                language === 'ar'
                                    ? 'تتبع أحداث الزوار والمبيعات على تيك توك'
                                    : 'Track visitor events and sales on TikTok'
                            }
                            integration={getIntegration('tiktok_pixel')}
                            onSave={handleSavePixel}
                            language={language}
                            isSaving={upsertMutation.isPending}
                        />

                        {/* Snapchat Pixel */}
                        <PixelCard
                            provider="snapchat_pixel"
                            icon={<Camera className="w-5 h-5" />}
                            title={language === 'ar' ? 'Snapchat Pixel' : 'Snapchat Pixel'}
                            description={
                                language === 'ar'
                                    ? 'تتبع أحداث الزوار والمبيعات على سناب شات'
                                    : 'Track visitor events and sales on Snapchat'
                            }
                            integration={getIntegration('snapchat_pixel')}
                            onSave={handleSavePixel}
                            language={language}
                            isSaving={upsertMutation.isPending}
                        />

                        <Separator />

                        {/* Google Sheets Integration */}
                        <GoogleSheetsCard
                            integration={getIntegration('google_sheets')}
                            onSave={handleSaveGoogleSheets}
                            language={language}
                            isSaving={upsertMutation.isPending}
                            storeId={storeId!}
                        />
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

// Pixel Card Component
interface PixelCardProps {
    provider: 'facebook_pixel' | 'tiktok_pixel' | 'snapchat_pixel';
    icon: React.ReactNode;
    title: string;
    description: string;
    integration?: Integration;
    onSave: (provider: 'facebook_pixel' | 'tiktok_pixel' | 'snapchat_pixel', pixelIds: string[], isActive: boolean) => void;
    language: string;
    isSaving: boolean;
}

function PixelCard({ provider, icon, title, description, integration, onSave, language, isSaving }: PixelCardProps) {
    const [pixelIds, setPixelIds] = useState<string[]>(integration?.config?.pixel_ids || []);
    const [newPixelId, setNewPixelId] = useState('');
    const [isActive, setIsActive] = useState(integration?.is_active || false);

    const handleAddPixel = () => {
        if (!newPixelId.trim()) {
            toast.error(language === 'ar' ? 'يرجى إدخال Pixel ID' : 'Please enter Pixel ID');
            return;
        }
        if (pixelIds.includes(newPixelId.trim())) {
            toast.error(language === 'ar' ? 'هذا الـ ID موجود بالفعل' : 'This ID already exists');
            return;
        }
        setPixelIds([...pixelIds, newPixelId.trim()]);
        setNewPixelId('');
    };

    const handleRemovePixel = (id: string) => {
        setPixelIds(pixelIds.filter(p => p !== id));
    };

    const handleSave = () => {
        if (pixelIds.length === 0) {
            toast.error(language === 'ar' ? 'يرجى إضافة Pixel ID واحد على الأقل' : 'Please add at least one Pixel ID');
            return;
        }
        onSave(provider, pixelIds, isActive);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {icon}
                        <div>
                            <CardTitle>{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </div>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* List of existing Pixel IDs */}
                {pixelIds.length > 0 && (
                    <div className="space-y-2">
                        <Label>{language === 'ar' ? 'الـ Pixels المفعلة' : 'Active Pixels'}</Label>
                        <div className="space-y-2">
                            {pixelIds.map((id) => (
                                <div key={id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                                    <span className="flex-1 text-sm font-mono">{id}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemovePixel(id)}
                                        className="h-7 w-7 p-0"
                                    >
                                        ✕
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Add new Pixel ID */}
                <div className="space-y-2">
                    <Label htmlFor={`${provider}-id`}>
                        {language === 'ar' ? 'إضافة Pixel ID جديد' : 'Add New Pixel ID'}
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            id={`${provider}-id`}
                            value={newPixelId}
                            onChange={(e) => setNewPixelId(e.target.value)}
                            placeholder={language === 'ar' ? 'أدخل Pixel ID' : 'Enter Pixel ID'}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddPixel()}
                        />
                        <Button onClick={handleAddPixel} variant="outline">
                            {language === 'ar' ? 'إضافة' : 'Add'}
                        </Button>
                    </div>
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="w-full">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </Button>
            </CardContent>
        </Card>
    );
}

// Google Sheets Card Component
interface GoogleSheetsCardProps {
    integration?: Integration;
    onSave: (config: any, isActive: boolean) => void;
    language: string;
    isSaving: boolean;
    storeId: string;
}

function GoogleSheetsCard({ integration, onSave, language, isSaving, storeId }: GoogleSheetsCardProps) {
    const [sheetId, setSheetId] = useState(integration?.config?.sheet_id || '');
    const [serviceAccountKey, setServiceAccountKey] = useState(integration?.config?.service_account_key || null);
    const [filterType, setFilterType] = useState<'all' | 'specific' | 'selected'>(
        integration?.config?.product_filter?.type || 'all'
    );
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
        integration?.config?.product_filter?.product_ids || []
    );
    const [isActive, setIsActive] = useState(integration?.is_active || false);

    // Fetch products for selection
    const { data: products = [] } = useQuery({
        queryKey: ['products', storeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select('id, name')
                .eq('store_id', storeId)
                .eq('status', 'active');
            if (error) throw error;
            return data;
        },
        enabled: !!storeId && filterType === 'selected',
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                setServiceAccountKey(json);
                toast.success(language === 'ar' ? 'تم رفع الملف بنجاح' : 'File uploaded successfully');
            } catch (error) {
                toast.error(language === 'ar' ? 'ملف JSON غير صالح' : 'Invalid JSON file');
            }
        };
        reader.readAsText(file);
    };

    const handleProductToggle = (productId: string) => {
        setSelectedProductIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const handleSave = () => {
        if (!sheetId.trim()) {
            toast.error(language === 'ar' ? 'يرجى إدخال Sheet ID' : 'Please enter Sheet ID');
            return;
        }
        if (!serviceAccountKey) {
            toast.error(language === 'ar' ? 'يرجى رفع ملف Service Account' : 'Please upload Service Account file');
            return;
        }
        if (filterType === 'selected' && selectedProductIds.length === 0) {
            toast.error(language === 'ar' ? 'يرجى اختيار منتج واحد على الأقل' : 'Please select at least one product');
            return;
        }

        const config = {
            sheet_id: sheetId,
            service_account_key: serviceAccountKey,
            product_filter: {
                type: filterType,
                product_ids: filterType === 'selected' ? selectedProductIds : undefined,
            },
        };

        onSave(config, isActive);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-5 h-5" />
                        <div>
                            <CardTitle>Google Sheets</CardTitle>
                            <CardDescription>
                                {language === 'ar'
                                    ? 'إرسال الطلبات تلقائياً إلى Google Sheets'
                                    : 'Automatically send orders to Google Sheets'}
                            </CardDescription>
                        </div>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Sheet ID */}
                <div className="space-y-2">
                    <Label htmlFor="sheet-id">Google Sheet ID</Label>
                    <Input
                        id="sheet-id"
                        value={sheetId}
                        onChange={(e) => setSheetId(e.target.value)}
                        placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                        dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground">
                        {language === 'ar'
                            ? 'يمكنك العثور على Sheet ID في رابط جوجل شيت'
                            : 'Find the Sheet ID in your Google Sheet URL'}
                    </p>
                </div>

                <Separator />

                {/* Service Account Upload */}
                <div className="space-y-2">
                    <Label htmlFor="credentials-file">
                        {language === 'ar' ? 'ملف Service Account (JSON)' : 'Service Account File (JSON)'}
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            id="credentials-file"
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="cursor-pointer"
                        />
                        {serviceAccountKey && (
                            <Button variant="ghost" size="sm" className="text-green-600">
                                ✓
                            </Button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {language === 'ar'
                            ? 'احصل على الملف من Google Cloud Console → Service Accounts'
                            : 'Get this file from Google Cloud Console → Service Accounts'}
                    </p>
                </div>

                <Separator />

                {/* Product Filter */}
                <div className="space-y-4">
                    <Label>{language === 'ar' ? 'فلتر المنتجات' : 'Product Filter'}</Label>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="filter-type"
                                value="all"
                                checked={filterType === 'all'}
                                onChange={() => setFilterType('all')}
                                className="w-4 h-4"
                            />
                            <span>{language === 'ar' ? 'كل المنتجات' : 'All Products'}</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="filter-type"
                                value="selected"
                                checked={filterType === 'selected'}
                                onChange={() => setFilterType('selected')}
                                className="w-4 h-4"
                            />
                            <span>{language === 'ar' ? 'منتجات معينة' : 'Selected Products'}</span>
                        </label>
                    </div>

                    {/* Product Selection */}
                    {filterType === 'selected' && (
                        <div className="mt-4 p-4 border rounded-lg space-y-2 max-h-60 overflow-y-auto">
                            <Label className="text-sm font-medium">
                                {language === 'ar' ? 'اختر المنتجات:' : 'Select Products:'}
                            </Label>
                            {products.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {language === 'ar' ? 'لا توجد منتجات' : 'No products available'}
                                </p>
                            ) : (
                                products.map((product) => {
                                    const productName = typeof product.name === 'string'
                                        ? JSON.parse(product.name)
                                        : product.name;
                                    const displayName = productName[language] || productName.ar || productName.en;

                                    return (
                                        <label key={product.id} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedProductIds.includes(product.id)}
                                                onChange={() => handleProductToggle(product.id)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm">{displayName}</span>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="w-full">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </Button>
            </CardContent>
        </Card>
    );
}

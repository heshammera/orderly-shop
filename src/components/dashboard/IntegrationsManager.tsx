"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Facebook, BarChart3, Save, FileSpreadsheet, Ghost, Video, Trash2, Plus, CheckCircle2, Upload, Edit, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface IntegrationsManagerProps {
    storeId: string;
}

interface PixelSettings {
    facebook_pixels: string[];
    tiktok_pixels: string[];
    snapchat_pixels: string[];
    google_analytics_ids: string[];
    google_service_account?: string;
}

interface GoogleSheetConfig {
    id: string; // Integration ID from DB
    sheet_id: string;
    tab_name: string;
    mode: 'all' | 'specific' | 'include';
    product_ids: string[];
    is_active: boolean;
}

interface Product {
    id: string;
    name_ar: string;
    name_en: string;
}

// Move PixelCard outside to prevent re-creation
interface PixelCardProps {
    platform: string;
    icon: any;
    title: string;
    color: string;
    pixels: string[];
    placeholder: string;
    inputValue: string;
    onInputChange: (value: string) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
    language: string;
}

function PixelCard({
    icon: Icon,
    title,
    color,
    pixels,
    placeholder,
    inputValue,
    onInputChange,
    onAdd,
    onRemove,
    language
}: PixelCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <CardTitle className="text-base">{title}</CardTitle>
                    <CardDescription className="text-xs">
                        {pixels.length} {language === 'ar' ? 'بيكسل نشط' : 'active pixel(s)'}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {pixels.length > 0 && (
                    <div className="space-y-2 mb-4">
                        {pixels.map((pixel, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    <code className="text-sm" dir="ltr">{pixel}</code>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onRemove(index)}
                                    className="h-8 w-8 p-0"
                                >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="space-y-2">
                    <Label>{language === 'ar' ? 'إضافة بيكسل جديد' : 'Add New Pixel'}</Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder={placeholder}
                            value={inputValue}
                            onChange={(e) => onInputChange(e.target.value)}
                            dir="ltr"
                            onKeyPress={(e) => e.key === 'Enter' && onAdd()}
                        />
                        <Button onClick={onAdd} size="sm" className="shrink-0">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function IntegrationsManager({ storeId }: IntegrationsManagerProps) {
    const { language, t } = useLanguage();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Pixel Settings
    const [settings, setSettings] = useState<PixelSettings>({
        facebook_pixels: [],
        tiktok_pixels: [],
        snapchat_pixels: [],
        google_analytics_ids: [],
    });

    const [newPixel, setNewPixel] = useState({
        facebook: '',
        tiktok: '',
        snapchat: '',
        google_analytics: '',
    });

    // Google Sheets State
    const [sheets, setSheets] = useState<GoogleSheetConfig[]>([]);
    const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
    const [editingSheet, setEditingSheet] = useState<Partial<GoogleSheetConfig> | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [sheetTestStatus, setSheetTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [sheetTestMessage, setSheetTestMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Store Settings (Pixels & Service Account)
                const { data: storeData, error: storeError } = await supabase
                    .from('stores')
                    .select('settings')
                    .eq('id', storeId)
                    .single();

                if (storeError) throw storeError;

                if (storeData?.settings?.integrations) {
                    const integrations = storeData.settings.integrations;
                    setSettings({
                        facebook_pixels: Array.isArray(integrations.facebook_pixels) ? integrations.facebook_pixels : integrations.facebook_pixel ? [integrations.facebook_pixel] : [],
                        tiktok_pixels: Array.isArray(integrations.tiktok_pixels) ? integrations.tiktok_pixels : integrations.tiktok_pixel ? [integrations.tiktok_pixel] : [],
                        snapchat_pixels: Array.isArray(integrations.snapchat_pixels) ? integrations.snapchat_pixels : integrations.snapchat_pixel ? [integrations.snapchat_pixel] : [],
                        google_analytics_ids: Array.isArray(integrations.google_analytics_ids) ? integrations.google_analytics_ids : integrations.google_analytics ? [integrations.google_analytics] : [],
                        google_service_account: integrations.google_service_account || undefined,
                    });
                }

                // 2. Fetch Google Sheet Integrations from new table
                const { data: sheetData, error: sheetError } = await supabase
                    .from('store_integrations')
                    .select('*')
                    .eq('store_id', storeId)
                    .eq('provider', 'google_sheets');

                if (sheetError) throw sheetError;

                if (sheetData && sheetData.length > 0) {
                    // Extract all sheets from all possible records (though usually it will be just one record now)
                    const allSheets: GoogleSheetConfig[] = [];
                    
                    sheetData.forEach(item => {
                        const config = item.config as any;
                        if (config.sheets && Array.isArray(config.sheets)) {
                            // New multi-sheet format
                            allSheets.push(...config.sheets.map((s: any) => ({
                                ...s,
                                is_active: item.is_active // All sheets in this record share the active status for now
                            })));
                        } else if (config.sheet_id) {
                            // Legacy single-sheet format
                            allSheets.push({
                                id: item.id,
                                sheet_id: config.sheet_id,
                                tab_name: config.tab_name || 'Sheet1',
                                mode: config.mode || 'all',
                                product_ids: config.product_ids || [],
                                is_active: item.is_active
                            });
                        }
                    });
                    
                    setSheets(allSheets);
                }

                // 3. Fetch Products for Selector
                const { data: productsData } = await supabase
                    .from('products')
                    .select('id, name')
                    .eq('store_id', storeId)
                    .eq('status', 'active');

                if (productsData) {
                    setProducts(productsData.map((p: any) => {
                        let nameObj: any = {};
                        try {
                            nameObj = typeof p.name === 'string' ? JSON.parse(p.name) : (p.name || {});
                        } catch (e) {
                            nameObj = { ar: p.name, en: p.name };
                        }
                        return {
                            id: p.id,
                            name_ar: nameObj.ar || '',
                            name_en: nameObj.en || ''
                        };
                    }));
                }

            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error(language === 'ar' ? 'فشل تحميل الإعدادات' : 'Failed to load settings');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [storeId, supabase, language]);

    const handleSavePixels = async () => {
        setSaving(true);
        try {
            const { data: currentData, error: fetchError } = await supabase
                .from('stores')
                .select('settings')
                .eq('id', storeId)
                .single();

            if (fetchError) throw fetchError;

            const existingSettings = currentData?.settings || {};
            const updatedSettings = {
                ...existingSettings,
                integrations: {
                    ...existingSettings.integrations,
                    ...settings
                }
            };

            const { error: updateError } = await supabase
                .from('stores')
                .update({ settings: updatedSettings })
                .eq('id', storeId);

            if (updateError) throw updateError;

            toast.success(language === 'ar' ? 'تم حفظ إعدادات البيكسل' : 'Pixel settings saved');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error(language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const addPixel = (platform: keyof typeof newPixel) => {
        const value = newPixel[platform].trim();
        if (!value) {
            toast.error(language === 'ar' ? 'الرجاء إدخال معرّف صحيح' : 'Please enter a valid ID');
            return;
        }

        const platformMap: Record<typeof platform, keyof PixelSettings> = {
            facebook: 'facebook_pixels',
            tiktok: 'tiktok_pixels',
            snapchat: 'snapchat_pixels',
            google_analytics: 'google_analytics_ids',
        };

        const settingsKey = platformMap[platform];
        const currentPixels = settings[settingsKey] as string[];

        if (currentPixels.includes(value)) {
            toast.error(language === 'ar' ? 'هذا المعرّف موجود بالفعل' : 'This ID already exists');
            return;
        }

        setSettings(prev => ({
            ...prev,
            [settingsKey]: [...currentPixels, value]
        }));

        setNewPixel(prev => ({ ...prev, [platform]: '' }));
        toast.success(language === 'ar' ? 'تمت الإضافة' : 'Added successfully');
    };

    const removePixel = (platform: keyof PixelSettings, index: number) => {
        setSettings(prev => ({
            ...prev,
            [platform]: (prev[platform] as string[]).filter((_, i) => i !== index)
        }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            JSON.parse(text);
            setSettings(prev => ({ ...prev, google_service_account: text }));
            // Save immediately to avoid losing it if they switch tabs
            // handleSavePixels(); // Optional: Auto-save service account? Better explicit save.
            toast.success(language === 'ar' ? 'تم رفع الملف بنجاح' : 'File uploaded successfully');
        } catch (error) {
            toast.error(language === 'ar' ? 'ملف JSON غير صحيح' : 'Invalid JSON file');
        }
    };

    const testSheetConnection = async () => {
        if (!editingSheet?.sheet_id) return;

        // If a global platform service account is configured (NEXT_PUBLIC_GOOGLE_SERVICE_EMAIL),
        // always let the backend use it (don't send per-store account which may be stale).
        // Only send per-store service account if NO global account exists.
        const serviceAccountToUse = process.env.NEXT_PUBLIC_GOOGLE_SERVICE_EMAIL 
            ? '' 
            : (settings.google_service_account || '');

        setSheetTestStatus('testing');
        setSheetTestMessage('');

        try {
            const res = await fetch('/api/integrations/google-sheets/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId,
                    serviceAccount: serviceAccountToUse,
                    sheetId: editingSheet.sheet_id,
                    tabName: editingSheet.tab_name
                })
            });

            const data = await res.json();

            if (data.success) {
                setSheetTestStatus('success');
                setSheetTestMessage(language === 'ar' ? '✅ تم الاتصال بنجاح! الشيت جاهز.' : '✅ Connection successful! Sheet is ready.');
            } else {
                setSheetTestStatus('error');
                setSheetTestMessage(language === 'ar'
                    ? `تعذر الوصول للشيت. (${data.message || 'تأكد من الصلاحيات'})`
                    : data.message || 'Could not access the sheet.'
                );
            }
        } catch (error) {
            setSheetTestStatus('error');
            setSheetTestMessage(language === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection error');
        }
    };

    const handleSaveSheet = async () => {
        if (!editingSheet?.sheet_id) {
            toast.error(language === 'ar' ? 'يجب إدخال رابط الشيت' : 'Sheet link is required');
            return;
        }

        // Auto-test connection if not yet tested
        if (sheetTestStatus !== 'success') {
            await testSheetConnection();
        }

        setSaving(true);
        try {
            const sheetToSave = {
                id: editingSheet.id || crypto.randomUUID(),
                sheet_id: editingSheet.sheet_id,
                tab_name: editingSheet.tab_name || 'Sheet1',
                mode: editingSheet.mode || 'all',
                product_ids: editingSheet.product_ids || []
            };

            // 1. Check for existing google_sheets integrations for this store (handle legacy multiple rows)
            const { data: existingRecords, error: fetchError } = await supabase
                .from('store_integrations')
                .select('*')
                .eq('store_id', storeId)
                .eq('provider', 'google_sheets');

            if (fetchError) throw fetchError;

            let finalSheets: any[] = [];

            if (existingRecords && existingRecords.length > 0) {
                const primaryRecord = existingRecords[0];
                let currentSheets: any[] = [];

                // Collect sheets from ALL existing records
                existingRecords.forEach(record => {
                    const currentConfig = record.config as any;
                    if (currentConfig.sheets && Array.isArray(currentConfig.sheets)) {
                        currentSheets.push(...currentConfig.sheets);
                    } else if (currentConfig.sheet_id) {
                        currentSheets.push({
                            id: record.id,
                            sheet_id: currentConfig.sheet_id,
                            tab_name: currentConfig.tab_name,
                            mode: currentConfig.mode,
                            product_ids: currentConfig.product_ids
                        });
                    }
                });

                // If editing existing, replace it. If new, append.
                if (editingSheet.id) {
                    finalSheets = currentSheets.map((s: any) => (s.id === editingSheet.id || s.sheet_id === editingSheet.sheet_id) ? sheetToSave : s);
                } else {
                    finalSheets = [...currentSheets, sheetToSave];
                }

                // Update primary record
                const { error: updateError } = await supabase
                    .from('store_integrations')
                    .update({
                        config: { sheets: finalSheets },
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', primaryRecord.id);

                if (updateError) throw updateError;

                // Cleanup legacy duplicate rows if any exist
                if (existingRecords.length > 1) {
                    const idsToDelete = existingRecords.slice(1).map(r => r.id);
                    await supabase.from('store_integrations').delete().in('id', idsToDelete);
                }
                
                toast.success(language === 'ar' ? 'تم حفظ التعديلات' : 'Saved successfully');
            } else {
                // Create new record
                finalSheets = [sheetToSave];
                const { error: insertError } = await supabase
                    .from('store_integrations')
                    .insert({
                        store_id: storeId,
                        provider: 'google_sheets',
                        config: { sheets: finalSheets },
                        is_active: true
                    });

                if (insertError) throw insertError;
                toast.success(language === 'ar' ? 'تم إضافة الشيت' : 'Sheet added');
            }

            // Sync UI state
            setSheets(finalSheets.map(s => ({ ...s, is_active: true })));
            setIsSheetModalOpen(false);
            setEditingSheet(null);
            setSheetTestStatus('idle');
            setSheetTestMessage('');

        } catch (error: any) {
            console.error('Error saving sheet:', error);
            toast.error(language === 'ar' ? 'فشل حفظ الشيت' : 'Failed to save sheet');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSheet = async (id: string, sheetId?: string) => {
        if (!confirm(language === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) return;

        try {
            // 1. Get existing records
            const { data: existingRecords, error: fetchError } = await supabase
                .from('store_integrations')
                .select('*')
                .eq('store_id', storeId)
                .eq('provider', 'google_sheets');

            if (fetchError || !existingRecords || existingRecords.length === 0) throw fetchError || new Error('Record not found');

            const primaryRecord = existingRecords[0];
            let currentSheets: any[] = [];
            
            // Handle legacy multiple rows
            existingRecords.forEach(record => {
                 const currentConfig = record.config as any;
                 if (currentConfig.sheets && Array.isArray(currentConfig.sheets)) {
                     currentSheets.push(...currentConfig.sheets);
                 } else if (currentConfig.sheet_id) {
                     currentSheets.push({
                         id: record.id,
                         sheet_id: currentConfig.sheet_id
                     });
                 }
            });

            // Remove the sheet
            const updatedSheets = currentSheets.filter((s: any) => s.id !== id && s.sheet_id !== sheetId);

            if (updatedSheets.length === 0) {
                // If no sheets left, we can delete all integration rows
                const idsToDelete = existingRecords.map(r => r.id);
                const { error: deleteError } = await supabase
                    .from('store_integrations')
                    .delete()
                    .in('id', idsToDelete);
                if (deleteError) throw deleteError;
                setSheets([]);
            } else {
                // Update primary record with filtered list
                const { error: updateError } = await supabase
                    .from('store_integrations')
                    .update({ config: { sheets: updatedSheets } })
                    .eq('id', primaryRecord.id);
                if (updateError) throw updateError;
                
                // Cleanup other rows if any
                if (existingRecords.length > 1) {
                    const idsToDelete = existingRecords.slice(1).map(r => r.id);
                    await supabase.from('store_integrations').delete().in('id', idsToDelete);
                }
                
                setSheets(prev => prev.filter(s => s.id !== id && s.sheet_id !== sheetId));
            }

            toast.success(language === 'ar' ? 'تم الحذف' : 'Deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(language === 'ar' ? 'فشل الحذف' : 'Deletion failed');
        }
    };

    const getText = (key: string, fallback: string) => {
        return (t as any).integrations?.[key] || fallback;
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex justify-end sticky top-4 z-10">
                <Button onClick={handleSavePixels} disabled={loading || saving} size="lg" className="shadow-lg">
                    {saving ? (
                        <span className="animate-spin mr-2">⏳</span>
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    {getText('save', 'Save Settings')}
                </Button>
            </div>

            <Alert>
                <AlertDescription>
                    {language === 'ar'
                        ? '💡 يمكنك الآن إضافة عدة بيكسلات لكل منصة. سيتم تفعيلها جميعاً في متجرك.'
                        : '💡 You can now add multiple pixels per platform. All will be active in your store.'}
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PixelCard
                    platform="facebook"
                    icon={Facebook}
                    title={getText('facebookPixel', 'Facebook Pixel')}
                    color="bg-blue-100 text-blue-600"
                    pixels={settings.facebook_pixels}
                    placeholder="123456789012345"
                    inputValue={newPixel.facebook}
                    onInputChange={(v) => setNewPixel(p => ({ ...p, facebook: v }))}
                    onAdd={() => addPixel('facebook')}
                    onRemove={(idx) => removePixel('facebook_pixels', idx)}
                    language={language}
                />

                <PixelCard
                    platform="tiktok"
                    icon={Video}
                    title={getText('tiktokPixel', 'TikTok Pixel')}
                    color="bg-black text-white"
                    pixels={settings.tiktok_pixels}
                    placeholder="CXXXXXXXXXXXX"
                    inputValue={newPixel.tiktok}
                    onInputChange={(v) => setNewPixel(p => ({ ...p, tiktok: v }))}
                    onAdd={() => addPixel('tiktok')}
                    onRemove={(idx) => removePixel('tiktok_pixels', idx)}
                    language={language}
                />

                <PixelCard
                    platform="snapchat"
                    icon={Ghost}
                    title={getText('snapchatPixel', 'Snapchat Pixel')}
                    color="bg-yellow-400 text-white"
                    pixels={settings.snapchat_pixels}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    inputValue={newPixel.snapchat}
                    onInputChange={(v) => setNewPixel(p => ({ ...p, snapchat: v }))}
                    onAdd={() => addPixel('snapchat')}
                    onRemove={(idx) => removePixel('snapchat_pixels', idx)}
                    language={language}
                />

                <PixelCard
                    platform="google_analytics"
                    icon={BarChart3}
                    title={getText('googleAnalytics', 'Google Analytics')}
                    color="bg-orange-100 text-orange-600"
                    pixels={settings.google_analytics_ids}
                    placeholder="G-XXXXXXXXXX"
                    inputValue={newPixel.google_analytics}
                    onInputChange={(v) => setNewPixel(p => ({ ...p, google_analytics: v }))}
                    onAdd={() => addPixel('google_analytics')}
                    onRemove={(idx) => removePixel('google_analytics_ids', idx)}
                    language={language}
                />
            </div>

            <Separator className="my-6" />

            {/* Google Sheets Section */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-4 space-y-0" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                        <CardTitle className="text-base">{getText('googleSheets', 'Google Sheets Integration')}</CardTitle>
                        <CardDescription className="text-xs">
                            {language === 'ar' ? 'تصدير الطلبات تلقائياً إلى جداول جوجل' : 'Export orders automatically to Google Sheets'}
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setEditingSheet({ mode: 'all', product_ids: [] });
                            setSheetTestStatus('idle');
                            setSheetTestMessage('');
                            setIsSheetModalOpen(true);
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'إضافة شيت' : 'Add Sheet'}
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Sheets List */}
                    <div className="space-y-3">
                        {sheets.map((sheet) => {
                            const displaySheetId = sheet.sheet_id.length > 30 ? `${sheet.sheet_id.slice(0, 15)}...${sheet.sheet_id.slice(-10)}` : sheet.sheet_id;
                            return (
                            <div key={sheet.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:border-green-200 transition-colors gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                        <span className="font-medium text-sm truncate max-w-[200px]" title={sheet.sheet_id}>{displaySheetId}</span>
                                        <Badge variant="outline" className="text-xs font-normal">
                                            {sheet.tab_name || 'Sheet1'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{language === 'ar' ? 'التصدير:' : 'Export:'}</span>
                                        <span className="font-medium">
                                            {sheet.mode === 'all'
                                                ? (language === 'ar' ? 'كل المنتجات' : 'All Products')
                                                : (language === 'ar' ? `${sheet.product_ids?.length} منتجات محددة` : `${sheet.product_ids?.length} Selected Products`)
                                            }
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => {
                                        setEditingSheet(sheet);
                                        setSheetTestStatus('idle');
                                        setSheetTestMessage('');
                                        setIsSheetModalOpen(true);
                                    }}>
                                        <Edit className="w-4 h-4 text-slate-500" />
                                    </Button>
                                     <Button size="sm" variant="ghost" onClick={() => handleDeleteSheet(sheet.id, sheet.sheet_id)}>
                                         <Trash2 className="w-4 h-4 text-red-500" />
                                     </Button>
                                </div>
                            </div>
                            );
                        })}

                        {sheets.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm border-dashed border-2 rounded-lg">
                                {language === 'ar' ? 'لا يوجد جداول مرتبطة بعد' : 'No sheets linked yet'}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Edit/Add Sheet Dialog — Professional Stepper */}
            <Dialog open={isSheetModalOpen} onOpenChange={setIsSheetModalOpen}>
                <DialogContent className="max-w-2xl p-0">
                    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="flex flex-col h-full">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-right rtl:text-right ltr:text-left">
                            {editingSheet?.id
                                ? (language === 'ar' ? 'تعديل ربط جوجل شيت' : 'Edit Google Sheet')
                                : (language === 'ar' ? 'ربط جوجل شيت جديد' : 'Link New Google Sheet')
                            }
                        </DialogTitle>
                        <DialogDescription className="text-right rtl:text-right ltr:text-left">
                            {language === 'ar' ? 'اتبع الخطوات التالية لربط جدول جوجل بمتجرك.' : 'Follow the steps below to link a Google Sheet to your store.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 px-6 py-4">
                        {/* Step 1: Share with platform email */}
                        {process.env.NEXT_PUBLIC_GOOGLE_SERVICE_EMAIL && (
                            <div className="space-y-3 p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                    <Label className="font-bold text-sm">
                                        {language === 'ar' ? 'شارك الشيت مع هذا الإيميل' : 'Share the sheet with this email'}
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-md border p-2.5">
                                    <code className="text-xs flex-1 truncate select-all text-green-700 dark:text-green-400 font-mono" dir="ltr">
                                        {process.env.NEXT_PUBLIC_GOOGLE_SERVICE_EMAIL}
                                    </code>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="shrink-0 h-7 px-2 text-xs"
                                        onClick={() => {
                                            navigator.clipboard.writeText(process.env.NEXT_PUBLIC_GOOGLE_SERVICE_EMAIL || '');
                                            toast.success(language === 'ar' ? 'تم النسخ!' : 'Copied!');
                                        }}
                                    >
                                        📋 {language === 'ar' ? 'نسخ' : 'Copy'}
                                    </Button>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    {language === 'ar'
                                        ? 'افتح جدول جوجل الخاص بك → اضغط "مشاركة" → الصق هذا الايميل → اختر صلاحية "محرر (Editor)" → اضغط إرسال.'
                                        : 'Open your Google Sheet → Click "Share" → Paste this email → Set permission to "Editor" → Click Send.'
                                    }
                                </p>
                            </div>
                        )}

                        {/* Legacy: If no global email, show file upload fallback */}
                        {!process.env.NEXT_PUBLIC_GOOGLE_SERVICE_EMAIL && (
                            <div className="space-y-2 p-4 border rounded-lg bg-slate-50">
                                <Label htmlFor="service-account" className="flex items-center gap-2">
                                    {language === 'ar' ? 'حساب الخدمة (Service Account JSON)' : 'Service Account JSON'}
                                    {settings.google_service_account ? (
                                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            {language === 'ar' ? 'متصل' : 'Connected'}
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                            {language === 'ar' ? 'مطلوب' : 'Required'}
                                        </Badge>
                                    )}
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="service-account"
                                        type="file"
                                        accept=".json"
                                        onChange={handleFileUpload}
                                        className="cursor-pointer bg-white"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Paste Sheet URL */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                    {process.env.NEXT_PUBLIC_GOOGLE_SERVICE_EMAIL ? '2' : '●'}
                                </div>
                                <Label className="font-bold text-sm text-right rtl:text-right ltr:text-left">
                                    {language === 'ar' ? 'الصق رابط جوجل شيت' : 'Paste Google Sheet link'}
                                </Label>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Input
                                    value={editingSheet?.sheet_id?.startsWith('http') ? editingSheet.sheet_id : (editingSheet?.sheet_id ? `https://docs.google.com/spreadsheets/d/${editingSheet.sheet_id}/edit` : '')}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.trim();
                                        // Auto-extract Sheet ID from URL
                                        const urlMatch = rawValue.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
                                        const extractedId = urlMatch ? urlMatch[1] : rawValue;
                                        setEditingSheet(prev => ({ ...prev, sheet_id: extractedId }));
                                        // Reset test when URL changes
                                        setSheetTestStatus('idle');
                                        setSheetTestMessage('');
                                    }}
                                    placeholder={language === 'ar' ? 'https://docs.google.com/spreadsheets/d/...' : 'https://docs.google.com/spreadsheets/d/...'}
                                    dir="ltr"
                                    className="text-xs flex-1 min-w-0"
                                />
                                <Button
                                    variant="outline"
                                    onClick={testSheetConnection}
                                    disabled={sheetTestStatus === 'testing' || !editingSheet?.sheet_id}
                                    className="shrink-0 h-10 px-4"
                                >
                                    {sheetTestStatus === 'testing' ? <span className="animate-spin">⏳</span> : (language === 'ar' ? 'فحص الاتصال' : 'Test Connection')}
                                </Button>
                            </div>
                        </div>

                            {/* Connection Status Message */}
                            {sheetTestStatus !== 'idle' && (
                                <div className={`text-xs flex items-center gap-1.5 p-2 rounded-md ${
                                    sheetTestStatus === 'success' ? 'text-green-700 bg-green-50 dark:bg-green-950/30' :
                                    'text-red-600 bg-red-50 dark:bg-red-950/30'
                                }`}>
                                    {sheetTestStatus === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                    {sheetTestStatus === 'error' && <AlertTriangle className="w-3.5 h-3.5" />}
                                    {sheetTestMessage}
                                </div>
                            )}

                            <p className="text-[11px] text-muted-foreground">
                                {language === 'ar'
                                    ? 'انسخ رابط الشيت كاملاً من المتصفح والصقه هنا. النظام سيستخرج المعرّف تلقائياً.'
                                    : 'Copy the full URL from your browser and paste it here. The system will extract the ID automatically.'
                                }
                            </p>

                        {/* Tab Name */}
                        <div className="space-y-2">
                            <Label>{language === 'ar' ? 'اسم التبويب (اختياري)' : 'Tab Name (Optional)'}</Label>
                            <Input
                                value={editingSheet?.tab_name || ''}
                                onChange={(e) => setEditingSheet(prev => ({ ...prev, tab_name: e.target.value }))}
                                placeholder="Sheet1"
                                dir="ltr"
                            />
                        </div>

                        {/* Export Mode */}
                        <div className="space-y-2">
                            <Label>{language === 'ar' ? 'نظام التصدير' : 'Export Mode'}</Label>
                            <Select
                                value={editingSheet?.mode || 'all'}
                                onValueChange={(val: any) => setEditingSheet(prev => ({ ...prev, mode: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{language === 'ar' ? 'كل المنتجات' : 'All Products'}</SelectItem>
                                    <SelectItem value="specific">{language === 'ar' ? 'منتج محدد' : 'Specific Product'}</SelectItem>
                                    <SelectItem value="include">{language === 'ar' ? 'منتجات مختارة' : 'Selected Products'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Product Selector */}
                        {(editingSheet?.mode === 'specific' || editingSheet?.mode === 'include') && (
                            <div className="space-y-2 border rounded-md p-3">
                                <Label className="mb-2 block">{language === 'ar' ? 'اختر المنتجات' : 'Select Products'}</Label>
                                <ScrollArea className="h-[150px]">
                                    <div className="space-y-2">
                                        {products.map(product => (
                                            <div key={product.id} className="flex items-center space-x-2 rtl:space-x-reverse">
                                                <Checkbox
                                                    checked={editingSheet?.product_ids?.includes(product.id)}
                                                    onCheckedChange={(checked) => {
                                                        const currentIds = editingSheet?.product_ids || [];
                                                        let newIds;
                                                        if (editingSheet?.mode === 'specific') {
                                                            // Only allow one
                                                            newIds = checked ? [product.id] : [];
                                                        } else {
                                                            newIds = checked
                                                                ? [...currentIds, product.id]
                                                                : currentIds.filter(id => id !== product.id);
                                                        }
                                                        setEditingSheet(prev => ({ ...prev, product_ids: newIds }));
                                                    }}
                                                />
                                                <Label className="text-sm font-normal cursor-pointer">
                                                    {language === 'ar' ? product.name_ar : product.name_en}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 gap-2 flex flex-row justify-end">
                        <Button variant="ghost" onClick={() => setIsSheetModalOpen(false)}>
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button onClick={handleSaveSheet} disabled={saving || !editingSheet?.sheet_id} className="gap-2">
                            {saving ? <span className="animate-spin">⏳</span> : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {language === 'ar' ? 'حفظ' : 'Save'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}


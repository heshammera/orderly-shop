"use client";

import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, Loader2, ClipboardPaste, Info } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface BulkProductImportProps {
    storeId: string;
    onSuccess: () => void;
}

interface ParsedProduct {
    name_ar: string;
    name_en: string;
    description_ar: string;
    description_en: string;
    price: string;
    sale_price: string;
    stock_quantity: string;
    sku: string;
    image_url: string;
    _valid: boolean;
    _error?: string;
}

const TEMPLATE_COLUMNS = [
    'اسم المنتج (عربي)',
    'اسم المنتج (إنجليزي)',
    'وصف المنتج (عربي)',
    'وصف المنتج (إنجليزي)',
    'السعر',
    'سعر الخصم',
    'الكمية',
    'SKU',
    'رابط الصورة',
];

const COLUMN_KEYS: (keyof Omit<ParsedProduct, '_valid' | '_error'>)[] = [
    'name_ar', 'name_en', 'description_ar', 'description_en',
    'price', 'sale_price', 'stock_quantity', 'sku', 'image_url',
];

const COLUMN_INFO = [
    { key: 'name_ar', label: 'اسم المنتج (عربي)', required: true, example: 'كريم مرطب للوجه', hint: 'مطلوب — اسم المنتج باللغة العربية' },
    { key: 'name_en', label: 'اسم المنتج (إنجليزي)', required: false, example: 'Face Moisturizer', hint: 'اختياري — اسم المنتج بالإنجليزية' },
    { key: 'description_ar', label: 'وصف المنتج (عربي)', required: false, example: 'كريم مرطب طبيعي للبشرة', hint: 'وصف تفصيلي للمنتج بالعربية' },
    { key: 'description_en', label: 'وصف المنتج (إنجليزي)', required: false, example: 'Natural moisturizing cream', hint: 'وصف تفصيلي بالإنجليزية' },
    { key: 'price', label: 'السعر', required: true, example: '99.99', hint: 'مطلوب — سعر المنتج (رقم فقط)' },
    { key: 'sale_price', label: 'سعر الخصم', required: false, example: '79.99', hint: 'اختياري — السعر بعد الخصم' },
    { key: 'stock_quantity', label: 'الكمية', required: false, example: '100', hint: 'اختياري — كمية المخزون (الافتراضي 0)' },
    { key: 'sku', label: 'SKU', required: false, example: 'PROD-001', hint: 'اختياري — رمز المنتج التعريفي' },
    { key: 'image_url', label: 'رابط الصورة', required: false, example: 'https://example.com/image.jpg', hint: 'اختياري — رابط URL لصورة المنتج، يمكنك اضافتها لاحقاً' },
];

export function BulkProductImport({ storeId, onSuccess }: BulkProductImportProps) {
    const { language } = useLanguage();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<'guide' | 'preview' | 'importing' | 'done'>('guide');
    const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
    const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: { row: number; error: string }[] } | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [pasteText, setPasteText] = useState('');

    const handleDownloadTemplate = () => {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Instructions
        const instructionsData = [
            ['📋 دليل استيراد المنتجات بالجملة'],
            [''],
            ['الخطوات:'],
            ['1. انتقل لورقة "المنتجات" في هذا الملف'],
            ['2. أضف بيانات منتجاتك في الصفوف بدءاً من الصف الثاني (الصف الأول هو العناوين)'],
            ['3. احفظ الملف وارفعه في المنصة'],
            [''],
            ['شرح الأعمدة:'],
            [''],
            ['العمود', 'مطلوب؟', 'الوصف', 'مثال'],
            ['اسم المنتج (عربي)', '✅ نعم', 'اسم المنتج باللغة العربية', 'كريم مرطب للوجه'],
            ['اسم المنتج (إنجليزي)', '❌ لا', 'اسم المنتج بالإنجليزية', 'Face Moisturizer'],
            ['وصف المنتج (عربي)', '❌ لا', 'وصف تفصيلي بالعربية', 'كريم مرطب طبيعي...'],
            ['وصف المنتج (إنجليزي)', '❌ لا', 'وصف تفصيلي بالإنجليزية', 'Natural moisturizing...'],
            ['السعر', '✅ نعم', 'سعر المنتج (رقم فقط)', '99.99'],
            ['سعر الخصم', '❌ لا', 'السعر بعد الخصم', '79.99'],
            ['الكمية', '❌ لا', 'كمية المخزون', '100'],
            ['SKU', '❌ لا', 'رمز المنتج التعريفي', 'PROD-001'],
            ['رابط الصورة', '❌ لا', 'رابط URL لصورة المنتج', 'https://...'],
            [''],
            ['💡 ملاحظة: يمكنك إضافة الصور لاحقاً من صفحة تعديل المنتج إذا لم يكن لديك رابط جاهز.'],
        ];
        const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
        wsInstructions['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 35 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, wsInstructions, 'التعليمات');

        // Sheet 2: Products (with sample data)
        const productsData = [
            TEMPLATE_COLUMNS,
            ['كريم مرطب للوجه', 'Face Moisturizer', 'كريم مرطب طبيعي للبشرة الجافة بخلاصة الألوفيرا', 'Natural moisturizing cream for dry skin with aloe vera extract', '99.99', '79.99', '100', 'PROD-001', ''],
            ['زيت الأرغان المغربي', 'Moroccan Argan Oil', 'زيت أرغان مغربي أصلي 100% طبيعي للشعر والبشرة', 'Original 100% natural Moroccan Argan Oil for hair and skin', '149', '', '50', 'PROD-002', ''],
            ['عطر فاخر للرجال', 'Premium Men Perfume', 'عطر رجالي فاخر بثبات عالي يدوم طوال اليوم', 'Premium men perfume with long lasting fragrance', '250', '199', '30', '', ''],
        ];
        const wsProducts = XLSX.utils.aoa_to_sheet(productsData);
        wsProducts['!cols'] = TEMPLATE_COLUMNS.map(() => ({ wch: 25 }));
        XLSX.utils.book_append_sheet(wb, wsProducts, 'المنتجات');

        XLSX.writeFile(wb, 'product_import_template.xlsx');
        toast.success(language === 'ar' ? 'تم تحميل القالب بنجاح! افتح الملف وعدّل عليه 📄' : 'Template downloaded!');
    };

    const validateProduct = (p: ParsedProduct): ParsedProduct => {
        if (!p.name_ar && !p.name_en) {
            return { ...p, _valid: false, _error: 'اسم المنتج مطلوب' };
        }
        if (!p.price || isNaN(parseFloat(p.price)) || parseFloat(p.price) <= 0) {
            return { ...p, _valid: false, _error: 'السعر مطلوب' };
        }
        return { ...p, _valid: true };
    };

    const parseRows = (rows: any[][]): ParsedProduct[] => {
        return rows
            .filter(row => row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== ''))
            .map(row => {
                const product: any = {};
                COLUMN_KEYS.forEach((key, i) => {
                    product[key] = row[i] !== undefined && row[i] !== null ? String(row[i]).trim() : '';
                });
                product._valid = true;
                return validateProduct(product as ParsedProduct);
            });
    };

    const handleFile = useCallback((file: File) => {
        if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
            toast.error(language === 'ar' ? 'يرجى رفع ملف Excel (.xlsx) أو CSV' : 'Please upload an Excel (.xlsx) or CSV file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                // Try to find "المنتجات" sheet first, then fallback to first sheet
                const sheetName = workbook.SheetNames.find(n => n === 'المنتجات') || workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (rows.length < 2) {
                    toast.error(language === 'ar' ? 'الملف فارغ أو لا يحتوي على بيانات' : 'File is empty');
                    return;
                }

                const products = parseRows(rows.slice(1));
                if (products.length === 0) {
                    toast.error(language === 'ar' ? 'لم يتم العثور على منتجات في الملف' : 'No products found');
                    return;
                }

                setParsedProducts(products);
                setStep('preview');
            } catch (err) {
                console.error('Parse error:', err);
                toast.error(language === 'ar' ? 'خطأ في قراءة الملف' : 'Error reading file');
            }
        };
        reader.readAsArrayBuffer(file);
    }, [language]);

    const handleSmartPaste = () => {
        if (!pasteText.trim()) {
            toast.error(language === 'ar' ? 'الرجاء لصق البيانات أولاً' : 'Please paste data first');
            return;
        }

        try {
            const lines = pasteText.trim().split('\n');
            const rows = lines.map(line => line.split('\t'));

            // If the first row looks like headers, skip it
            const firstRow = rows[0];
            const isHeader = firstRow.some(cell =>
                TEMPLATE_COLUMNS.some(col => cell.trim().includes(col)) ||
                cell.trim().toLowerCase().includes('name') ||
                cell.trim().includes('اسم')
            );

            const dataRows = isHeader ? rows.slice(1) : rows;
            const products = parseRows(dataRows);

            if (products.length === 0) {
                toast.error(language === 'ar' ? 'لم يتم العثور على بيانات صالحة' : 'No valid data found');
                return;
            }

            setParsedProducts(products);
            setStep('preview');
        } catch (err) {
            toast.error(language === 'ar' ? 'خطأ في قراءة البيانات' : 'Error parsing data');
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleImport = async () => {
        setStep('importing');
        try {
            const validProducts = parsedProducts
                .filter(p => p._valid)
                .map(({ _valid, _error, ...p }) => p);

            const response = await fetch('/api/dashboard/products/bulk-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeId, products: validProducts }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Import failed');

            setImportResult(data.results);
            setStep('done');
            if (data.results.success > 0) onSuccess();
        } catch (error: any) {
            toast.error(error.message);
            setStep('preview');
        }
    };

    const handleClose = () => {
        setOpen(false);
        setTimeout(() => {
            setStep('guide');
            setParsedProducts([]);
            setImportResult(null);
            setPasteText('');
        }, 200);
    };

    const validCount = parsedProducts.filter(p => p._valid).length;
    const invalidCount = parsedProducts.filter(p => !p._valid).length;

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="w-4 h-4" />
                    {language === 'ar' ? 'استيراد بالجملة' : 'Bulk Import'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                {/* Header */}
                <div className="px-6 pt-6 pb-0">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <FileSpreadsheet className="w-5 h-5 text-primary" />
                            {language === 'ar' ? 'استيراد المنتجات بالجملة' : 'Bulk Product Import'}
                        </DialogTitle>
                    </DialogHeader>
                </div>

                {/* Step 1: Guide — two methods */}
                {step === 'guide' && (
                    <div className="px-6 pb-6">
                        <Tabs defaultValue="paste" className="w-full mt-4">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="paste" className="gap-2 text-xs sm:text-sm">
                                    <ClipboardPaste className="w-4 h-4" />
                                    {language === 'ar' ? 'نسخ ولصق (الأسرع)' : 'Paste (Fastest)'}
                                </TabsTrigger>
                                <TabsTrigger value="file" className="gap-2 text-xs sm:text-sm">
                                    <FileSpreadsheet className="w-4 h-4" />
                                    {language === 'ar' ? 'رفع ملف Excel' : 'Upload Excel'}
                                </TabsTrigger>
                            </TabsList>

                            {/* Tab: Smart Paste */}
                            <TabsContent value="paste" className="space-y-4 mt-0">
                                {/* Step By Step */}
                                <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 space-y-3">
                                    <p className="font-bold text-sm text-primary">{language === 'ar' ? '🚀 الطريقة السريعة — 3 خطوات فقط:' : '🚀 Quick Method — 3 Steps:'}</p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-start gap-2">
                                            <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                                            <span>{language === 'ar' ? 'افتح ملف Excel أو Google Sheets الخاص بك' : 'Open your Excel or Google Sheets'}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                                            <span>{language === 'ar' ? 'حدد الصفوف وانسخها (Ctrl+C)' : 'Select rows and copy (Ctrl+C)'}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                                            <span>{language === 'ar' ? 'الصقها في المربع أدناه (Ctrl+V) واضغط استيراد' : 'Paste below (Ctrl+V) and import'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column order guide */}
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Info className="w-4 h-4 text-muted-foreground" />
                                        <p className="font-medium text-xs text-muted-foreground">
                                            {language === 'ar' ? 'ترتيب الأعمدة المطلوب (من اليسار لليمين):' : 'Required column order (left to right):'}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {COLUMN_INFO.map((col, i) => (
                                            <span
                                                key={i}
                                                className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border ${col.required
                                                        ? 'bg-primary/10 border-primary/30 text-primary font-bold'
                                                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-muted-foreground'
                                                    }`}
                                                title={col.hint}
                                            >
                                                {col.required && <span className="text-red-500">*</span>}
                                                {col.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Paste Area */}
                                <textarea
                                    className="w-full h-36 border-2 border-dashed rounded-xl p-4 text-sm font-mono resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-slate-950 placeholder:text-muted-foreground/60"
                                    placeholder={language === 'ar'
                                        ? 'الصق بيانات المنتجات هنا...\n\nمثال:\nكريم مرطب\tFace Cream\tوصف المنتج\tDescription\t99.99\t79.99\t100\tPROD-001\nزيت أرغان\tArgan Oil\tزيت طبيعي\tNatural oil\t149\t\t50\tPROD-002'
                                        : 'Paste product data here...\n\nExample:\nFace Cream\tكريم مرطب\tDescription\tوصف\t99.99\t79.99\t100\tPROD-001'
                                    }
                                    value={pasteText}
                                    onChange={(e) => setPasteText(e.target.value)}
                                    dir="ltr"
                                />

                                <Button onClick={handleSmartPaste} disabled={!pasteText.trim()} className="w-full gap-2" size="lg">
                                    <ClipboardPaste className="w-4 h-4" />
                                    {language === 'ar' ? 'معاينة البيانات الملصقة' : 'Preview Pasted Data'}
                                </Button>
                            </TabsContent>

                            {/* Tab: File Upload */}
                            <TabsContent value="file" className="space-y-4 mt-0">
                                {/* Download Template */}
                                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="font-bold text-sm text-emerald-800 dark:text-emerald-200">{language === 'ar' ? '📥 الخطوة 1: حمّل القالب' : '📥 Step 1: Download Template'}</p>
                                            <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-1">
                                                {language === 'ar' ? 'ملف Excel جاهز بالتعليمات والأمثلة — عدّل عليه وارفعه' : 'Ready Excel file with instructions and examples'}
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-2 shrink-0 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950">
                                            <Download className="w-4 h-4" />
                                            {language === 'ar' ? 'تحميل' : 'Download'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Column Reference */}
                                <div className="border rounded-xl overflow-hidden">
                                    <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 border-b">
                                        <p className="font-medium text-xs">{language === 'ar' ? '📋 شرح الأعمدة:' : '📋 Column Reference:'}</p>
                                    </div>
                                    <div className="divide-y max-h-48 overflow-y-auto">
                                        {COLUMN_INFO.map((col, i) => (
                                            <div key={i} className="px-4 py-2 flex items-center gap-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-900">
                                                <span className="bg-slate-200 dark:bg-slate-700 text-muted-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-mono shrink-0">{i + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-medium">{col.label}</span>
                                                    {col.required && <span className="text-red-500 ms-1 text-[10px]">(مطلوب)</span>}
                                                    <p className="text-muted-foreground text-[10px] truncate">{col.hint}</p>
                                                </div>
                                                <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md truncate max-w-[120px] text-muted-foreground">{col.example}</code>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Upload Area */}
                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                                        ${dragOver ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-accent/50'}`}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById('bulk-file-input')?.click()}
                                >
                                    <Upload className={`w-8 h-8 mx-auto mb-2 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <p className="text-sm font-medium">
                                        {language === 'ar' ? '📂 الخطوة 2: اسحب الملف هنا أو اضغط للاختيار' : '📂 Step 2: Drag file here or click'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">Excel (.xlsx) / CSV</p>
                                </div>
                                <input
                                    id="bulk-file-input"
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    className="hidden"
                                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                )}

                {/* Step 2: Preview */}
                {step === 'preview' && (
                    <div className="px-6 pb-6 space-y-4">
                        {/* Summary */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{validCount} {language === 'ar' ? 'منتج صالح' : 'valid'}</span>
                            </div>
                            {invalidCount > 0 && (
                                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    <span className="text-sm font-bold text-red-700 dark:text-red-300">{invalidCount} {language === 'ar' ? 'يحتاج تصحيح' : 'invalid'}</span>
                                </div>
                            )}
                        </div>

                        {/* Table */}
                        <div className="border rounded-xl overflow-hidden">
                            <div className="overflow-x-auto max-h-[45vh]">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-3 py-2.5 text-start font-medium text-muted-foreground">#</th>
                                            <th className="px-3 py-2.5 text-start font-medium">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                                            <th className="px-3 py-2.5 text-start font-medium">{language === 'ar' ? 'الاسم (عربي)' : 'Name (AR)'}</th>
                                            <th className="px-3 py-2.5 text-start font-medium">{language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (EN)'}</th>
                                            <th className="px-3 py-2.5 text-start font-medium">{language === 'ar' ? 'السعر' : 'Price'}</th>
                                            <th className="px-3 py-2.5 text-start font-medium">{language === 'ar' ? 'خصم' : 'Sale'}</th>
                                            <th className="px-3 py-2.5 text-start font-medium">{language === 'ar' ? 'الكمية' : 'Stock'}</th>
                                            <th className="px-3 py-2.5 text-start font-medium">{language === 'ar' ? 'صورة' : 'Img'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {parsedProducts.map((product, i) => (
                                            <tr key={i} className={!product._valid ? 'bg-red-50/70 dark:bg-red-950/20' : 'hover:bg-slate-50/70 dark:hover:bg-slate-900/50'}>
                                                <td className="px-3 py-2 text-muted-foreground font-mono">{i + 1}</td>
                                                <td className="px-3 py-2">
                                                    {product._valid
                                                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        : <span className="flex items-center gap-1 text-red-600 text-[10px]"><XCircle className="w-3.5 h-3.5 shrink-0" />{product._error}</span>
                                                    }
                                                </td>
                                                <td className="px-3 py-2 max-w-[140px] truncate font-medium">{product.name_ar}</td>
                                                <td className="px-3 py-2 max-w-[140px] truncate">{product.name_en}</td>
                                                <td className="px-3 py-2 font-mono font-medium">{product.price}</td>
                                                <td className="px-3 py-2 font-mono text-emerald-600">{product.sale_price || '—'}</td>
                                                <td className="px-3 py-2 font-mono">{product.stock_quantity || '0'}</td>
                                                <td className="px-3 py-2">
                                                    {product.image_url ? <span className="text-emerald-500 text-sm">✓</span> : <span className="text-muted-foreground">—</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <Button onClick={handleImport} disabled={validCount === 0} className="gap-2 flex-1" size="lg">
                                <Upload className="w-4 h-4" />
                                {language === 'ar' ? `استيراد ${validCount} منتج` : `Import ${validCount} products`}
                            </Button>
                            <Button variant="outline" onClick={() => { setStep('guide'); setParsedProducts([]); setPasteText(''); }}>
                                {language === 'ar' ? 'رجوع' : 'Back'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Importing */}
                {step === 'importing' && (
                    <div className="py-16 text-center space-y-4 px-6">
                        <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                        <div>
                            <p className="font-bold text-lg">{language === 'ar' ? 'جاري استيراد المنتجات...' : 'Importing products...'}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {language === 'ar' ? `يتم الآن إضافة ${validCount} منتج. يرجى الانتظار ⏳` : `Adding ${validCount} products. Please wait.`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 4: Done */}
                {step === 'done' && importResult && (
                    <div className="px-6 pb-6 space-y-6">
                        <div className="text-center py-6">
                            {importResult.success > 0
                                ? <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
                                : <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                            }
                            <h3 className="text-xl font-black">{language === 'ar' ? 'اكتمل الاستيراد! 🎉' : 'Import Complete! 🎉'}</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-5 text-center">
                                <p className="text-4xl font-black text-emerald-600">{importResult.success}</p>
                                <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1 font-medium">{language === 'ar' ? 'تم بنجاح ✅' : 'Succeeded'}</p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-5 text-center">
                                <p className="text-4xl font-black text-red-600">{importResult.failed}</p>
                                <p className="text-sm text-red-700 dark:text-red-300 mt-1 font-medium">{language === 'ar' ? 'فشل ❌' : 'Failed'}</p>
                            </div>
                        </div>

                        {importResult.errors.length > 0 && (
                            <div className="border border-red-200 rounded-xl overflow-hidden">
                                <div className="bg-red-50 dark:bg-red-950/30 px-4 py-2 border-b">
                                    <p className="font-medium text-sm text-red-700">{language === 'ar' ? 'تفاصيل الأخطاء:' : 'Error details:'}</p>
                                </div>
                                <div className="max-h-32 overflow-y-auto p-3 space-y-1">
                                    {importResult.errors.map((err, i) => (
                                        <p key={i} className="text-xs text-red-600">
                                            {language === 'ar' ? `صف ${err.row}: ${err.error}` : `Row ${err.row}: ${err.error}`}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button onClick={handleClose} className="w-full" size="lg">
                            {language === 'ar' ? 'إغلاق' : 'Close'}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

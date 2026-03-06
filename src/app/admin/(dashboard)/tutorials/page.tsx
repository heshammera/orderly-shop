"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2, Edit, Trash2, Video, Settings, FolderTree, GripVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { VideoPlayer } from '@/components/tutorials/VideoPlayer';

interface Tutorial {
    id: string;
    title: { ar: string; en: string };
    description: { ar: string; en: string };
    video_type: string;
    video_url: string;
    video_id: string;
    uploaded_video_path: string;
    thumbnail_url: string;
    category_id: string;
    slug: string;
    sort_order: number;
    is_published: boolean;
    display_mode: string;
    category?: { name: { ar: string; en: string } };
}

interface Category {
    id: string;
    name: { ar: string; en: string };
    slug: string;
    sort_order: number;
}

export default function AdminTutorialsPage() {
    const { language, dir } = useLanguage();
    const { toast } = useToast();

    // State
    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [settings, setSettings] = useState({ landing: true, dashboard: true });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Modals state
    const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isCategoriesManagerOpen, setIsCategoriesManagerOpen] = useState(false);

    // Form state
    const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const defaultTutorialForm = {
        title_ar: '', title_en: '',
        desc_ar: '', desc_en: '',
        video_type: 'youtube', video_url: '',
        category_id: '', slug: '',
        is_published: true, display_mode: 'both',
        sort_order: 0,
        thumbnail_url: '', uploaded_video_path: ''
    };
    const [tutorialForm, setTutorialForm] = useState(defaultTutorialForm);
    const [videoPreview, setVideoPreview] = useState<{ url: string, type: string } | null>(null);

    const defaultCategoryForm = { name_ar: '', name_en: '', slug: '', sort_order: 0 };
    const [categoryForm, setCategoryForm] = useState(defaultCategoryForm);
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    // Initial load
    useEffect(() => {
        fetchData();
        fetchSettings();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tRes, cRes] = await Promise.all([
                fetch('/api/admin/tutorials?admin=true'),
                fetch('/api/admin/tutorials/categories')
            ]);

            if (tRes.ok) setTutorials(await tRes.json());
            if (cRes.ok) setCategories(await cRes.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/tutorials/settings');
            if (res.ok) {
                const data = await res.json();
                setSettings({
                    landing: data.tutorials_enabled_landing,
                    dashboard: data.tutorials_enabled_dashboard
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSettingChange = async (key: 'landing' | 'dashboard', value: boolean) => {
        try {
            const newSettings = { ...settings, [key]: value };
            setSettings(newSettings);
            await fetch('/api/admin/tutorials/settings', {
                method: 'PATCH',
                body: JSON.stringify({
                    [`tutorials_enabled_${key}`]: value
                })
            });
            toast({ title: language === 'ar' ? 'تم حفظ الإعدادات' : 'Settings saved' });
        } catch (error) {
            console.error(error);
        }
    };

    const handleFileUpload = async () => {
        if (!uploadFile) return null;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', uploadFile);

        try {
            const res = await fetch('/api/admin/tutorials/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data.url;
        } catch (error: any) {
            toast({ variant: 'destructive', title: error.message });
            return null;
        } finally {
            setUploading(false);
        }
    };

    const saveTutorial = async () => {
        setSaving(true);
        try {
            let uploadedUrl = tutorialForm.video_url;

            if (tutorialForm.video_type === 'upload' && uploadFile) {
                const url = await handleFileUpload();
                if (!url) throw new Error('Upload failed');
                uploadedUrl = url;
            }

            const payload = {
                id: editingTutorial?.id,
                title: { ar: tutorialForm.title_ar, en: tutorialForm.title_en },
                description: { ar: tutorialForm.desc_ar, en: tutorialForm.desc_en },
                video_type: tutorialForm.video_type,
                video_url: uploadedUrl,
                thumbnail_url: tutorialForm.thumbnail_url, // Allow custom override
                category_id: tutorialForm.category_id || null,
                slug: tutorialForm.slug,
                is_published: tutorialForm.is_published,
                display_mode: tutorialForm.display_mode,
                sort_order: tutorialForm.sort_order
            };

            const method = editingTutorial ? 'PUT' : 'POST';
            const res = await fetch('/api/admin/tutorials', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(await res.text());

            toast({ title: language === 'ar' ? 'تم الحفظ' : 'Saved successfully' });
            setIsTutorialModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast({ variant: 'destructive', title: language === 'ar' ? 'خطأ' : 'Error', description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const deleteTutorial = async (id: string) => {
        if (!confirm(language === 'ar' ? 'تأكيد الحذف؟' : 'Confirm delete?')) return;
        try {
            await fetch(`/api/admin/tutorials?id=${id}`, { method: 'DELETE' });
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const saveCategory = async () => {
        setSaving(true);
        try {
            const payload = {
                id: editingCategory?.id,
                name: { ar: categoryForm.name_ar, en: categoryForm.name_en },
                slug: categoryForm.slug,
                sort_order: categoryForm.sort_order
            };

            const method = editingCategory ? 'PUT' : 'POST';
            const res = await fetch('/api/admin/tutorials/categories', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(await res.text());

            toast({ title: language === 'ar' ? 'تم حفظ التصنيف' : 'Category saved' });
            setIsCategoryModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast({ variant: 'destructive', title: error.message });
        } finally {
            setSaving(false);
        }
    };

    const openEditTutorial = (t: Tutorial) => {
        setEditingTutorial(t);
        setTutorialForm({
            title_ar: t.title?.ar || '',
            title_en: t.title?.en || '',
            desc_ar: t.description?.ar || '',
            desc_en: t.description?.en || '',
            video_type: t.video_type,
            video_url: t.video_url,
            category_id: t.category_id || '',
            slug: t.slug,
            is_published: t.is_published,
            display_mode: t.display_mode,
            sort_order: t.sort_order,
            thumbnail_url: t.thumbnail_url || '',
            uploaded_video_path: t.uploaded_video_path || ''
        });
        setUploadFile(null);
        setVideoPreview(t.video_url ? { url: t.video_url, type: t.video_type } : null);
        setIsTutorialModalOpen(true);
    };

    const openEditCategory = (c: Category) => {
        setEditingCategory(c);
        setCategoryForm({
            name_ar: c.name?.ar || '',
            name_en: c.name?.en || '',
            slug: c.slug,
            sort_order: c.sort_order
        });
        setIsCategoryModalOpen(true);
    };

    if (loading && tutorials.length === 0) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto" dir={dir}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{language === 'ar' ? 'إدارة الشروحات' : 'Tutorials Management'}</h1>
                    <p className="text-muted-foreground">{language === 'ar' ? 'إدارة الفيديوهات والشروحات التعليمية للمنصة' : 'Manage platform video tutorials and guides'}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsCategoriesManagerOpen(true)}>
                        <FolderTree className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'التصنيفات' : 'Categories'}
                    </Button>
                    <Button onClick={() => {
                        setEditingTutorial(null);
                        setTutorialForm(defaultTutorialForm);
                        setVideoPreview(null);
                        setUploadFile(null);
                        setIsTutorialModalOpen(true);
                    }}>
                        <Plus className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'إضافة فيديو' : 'Add Video'}
                    </Button>
                </div>
            </div>

            {/* settings card */}
            <Card>
                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-6 justify-between items-center bg-slate-50/50">
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                        <div className="space-y-0.5">
                            <h4 className="font-medium text-sm">{language === 'ar' ? 'في الصفحة الرئيسية' : 'Landing Page'}</h4>
                            <p className="text-xs text-muted-foreground">{language === 'ar' ? 'عرض الشروحات للزوار العامين' : 'Show to public visitors'}</p>
                        </div>
                        <Switch
                            checked={settings.landing}
                            onCheckedChange={(v) => handleSettingChange('landing', v)}
                        />
                    </div>
                    <div className="h-px sm:h-auto sm:w-px bg-slate-200 self-stretch" />
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                        <div className="space-y-0.5">
                            <h4 className="font-medium text-sm">{language === 'ar' ? 'في لوحة تحكم التاجر' : 'Merchant Dashboard'}</h4>
                            <p className="text-xs text-muted-foreground">{language === 'ar' ? 'عرض الشروحات لجميع التجار' : 'Show to all merchants'}</p>
                        </div>
                        <Switch
                            checked={settings.dashboard}
                            onCheckedChange={(v) => handleSettingChange('dashboard', v)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Tutorials List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tutorials.map(t => (
                    <Card key={t.id} className={`overflow-hidden transition-all ${!t.is_published ? 'opacity-60' : ''}`}>
                        <div className="aspect-video relative bg-slate-100 group">
                            {t.thumbnail_url ? (
                                <img src={t.thumbnail_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-black">
                                    <Video className="w-8 h-8 text-white/50" />
                                </div>
                            )}

                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button size="icon" variant="secondary" onClick={() => openEditTutorial(t)}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="destructive" onClick={() => deleteTutorial(t.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="absolute top-2 right-2 flex gap-1">
                                {!t.is_published && (
                                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded font-medium">
                                        {language === 'ar' ? 'مسودة' : 'Draft'}
                                    </span>
                                )}
                                {t.category && (
                                    <span className="bg-white/90 backdrop-blur text-slate-800 text-xs px-2 py-1 rounded font-medium shadow-sm">
                                        {t.category.name[language as 'ar' | 'en'] || t.category.name.ar}
                                    </span>
                                )}
                            </div>
                        </div>
                        <CardContent className="p-4">
                            <h3 className="font-bold line-clamp-1 mb-1">{t.title?.[language as 'ar' | 'en'] || t.title?.ar}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2">{t.description?.[language as 'ar' | 'en'] || t.description?.ar}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {tutorials.length === 0 && !loading && (
                <div className="text-center py-20 border border-dashed rounded-lg bg-slate-50">
                    <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">{language === 'ar' ? 'لا توجد شروحات بعد' : 'No tutorials yet'}</h3>
                </div>
            )}

            {/* Add/Edit Tutorial Dialog */}
            <Dialog open={isTutorialModalOpen} onOpenChange={setIsTutorialModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingTutorial ? (language === 'ar' ? 'تعديل فيديو' : 'Edit Video') : (language === 'ar' ? 'إضافة فيديو جديد' : 'Add New Video')}</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        {/* Left Col - Video Source & Preview */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{language === 'ar' ? 'مصدر الفيديو' : 'Video Source'}</label>
                                <Select
                                    value={tutorialForm.video_type}
                                    onValueChange={(v) => {
                                        setTutorialForm({ ...tutorialForm, video_type: v });
                                        if (v !== tutorialForm.video_type) setVideoPreview(null);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="youtube">YouTube</SelectItem>
                                        <SelectItem value="vimeo">Vimeo</SelectItem>
                                        <SelectItem value="dailymotion">Dailymotion</SelectItem>
                                        <SelectItem value="upload">{language === 'ar' ? 'رفع مباشر' : 'Direct Upload'}</SelectItem>
                                        <SelectItem value="other">{language === 'ar' ? 'رابط آخر' : 'Other URL'}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {tutorialForm.video_type === 'upload' ? (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{language === 'ar' ? 'اختر ملف الفيديو' : 'Select Video File'}</label>
                                    <Input
                                        type="file"
                                        accept="video/*"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setUploadFile(e.target.files[0]);
                                                // Local preview
                                                const objUrl = URL.createObjectURL(e.target.files[0]);
                                                setVideoPreview({ url: objUrl, type: 'upload' });
                                            }
                                        }}
                                    />
                                    {tutorialForm.video_url && !uploadFile && (
                                        <p className="text-xs text-green-600">{language === 'ar' ? 'يوجد فيديو مرفوع حالياً' : 'Video currently uploaded'} ({tutorialForm.video_url.split('/').pop()})</p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{language === 'ar' ? 'رابط الفيديو' : 'Video URL'}</label>
                                    <Input
                                        dir="ltr"
                                        placeholder="https://..."
                                        value={tutorialForm.video_url}
                                        onChange={(e) => {
                                            const url = e.target.value;
                                            setTutorialForm({ ...tutorialForm, video_url: url });
                                            if (url.length > 10) setVideoPreview({ url, type: tutorialForm.video_type });
                                        }}
                                    />
                                </div>
                            )}

                            {/* Custom Thumbnail */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{language === 'ar' ? 'صورة مصغرة مخصصة (اختياري)' : 'Custom Thumbnail (Optional)'}</label>
                                <Input
                                    dir="ltr"
                                    placeholder="https://"
                                    value={tutorialForm.thumbnail_url}
                                    onChange={(e) => setTutorialForm({ ...tutorialForm, thumbnail_url: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'إذا تُرك فارغاً سيتم جلبه من يوتيوب/فيميو إن أمكن.' : 'Leave empty to auto-fetch if supported.'}</p>
                            </div>

                            {/* Preview box */}
                            <div className="border rounded-xl mt-4 bg-slate-50 overflow-hidden">
                                <div className="p-2 border-b bg-slate-100 text-xs font-medium text-slate-500">
                                    {language === 'ar' ? 'معاينة المشغل' : 'Player Preview'}
                                </div>
                                {videoPreview?.url ? (
                                    <div className="p-2">
                                        <VideoPlayer
                                            videoUrl={videoPreview.url}
                                            videoType={videoPreview.type}
                                            thumbnailUrl={tutorialForm.thumbnail_url}
                                        />
                                    </div>
                                ) : (
                                    <div className="aspect-video flex items-center justify-center text-slate-400">
                                        {language === 'ar' ? 'أدخل الرابط أولاً للمعاينة' : 'Enter URL to preview'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Col - Details */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{language === 'ar' ? 'العنوان (أساسي)' : 'Title (Main)'}</label>
                                <Input
                                    required
                                    value={tutorialForm.title_ar}
                                    onChange={e => setTutorialForm({ ...tutorialForm, title_ar: e.target.value })}
                                    placeholder={language === 'ar' ? 'مثال: كيفية إعداد المتجر' : 'e.g. How to setup store'}
                                />
                                <Input
                                    dir="ltr"
                                    value={tutorialForm.title_en}
                                    onChange={e => setTutorialForm({ ...tutorialForm, title_en: e.target.value })}
                                    placeholder="English title"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">{language === 'ar' ? 'وصف مبسط' : 'Short Description'}</label>
                                <Textarea
                                    rows={2}
                                    value={tutorialForm.desc_ar}
                                    onChange={e => setTutorialForm({ ...tutorialForm, desc_ar: e.target.value })}
                                    placeholder={language === 'ar' ? 'سطر أو سطرين يشرح محتوى الفيديو...' : 'Short description...'}
                                />
                                <Textarea
                                    rows={2}
                                    dir="ltr"
                                    value={tutorialForm.desc_en}
                                    onChange={e => setTutorialForm({ ...tutorialForm, desc_en: e.target.value })}
                                    placeholder="English description..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{language === 'ar' ? 'التصنيف' : 'Category'}</label>
                                    <Select
                                        value={tutorialForm.category_id}
                                        onValueChange={(v) => setTutorialForm({ ...tutorialForm, category_id: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={language === 'ar' ? 'بدون تصنيف' : 'Uncategorized'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">{language === 'ar' ? 'بدون تصنيف' : 'Uncategorized'}</SelectItem>
                                            {categories.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name[language as 'ar' | 'en'] || c.name.ar}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Slug (URL Route)</label>
                                    <Input
                                        dir="ltr"
                                        value={tutorialForm.slug}
                                        onChange={e => setTutorialForm({ ...tutorialForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                                        placeholder="how-to-setup"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                                <div>
                                    <p className="font-medium text-sm">{language === 'ar' ? 'منشور (يظهر للعلن)' : 'Published'}</p>
                                </div>
                                <Switch
                                    checked={tutorialForm.is_published}
                                    onCheckedChange={v => setTutorialForm({ ...tutorialForm, is_published: v })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t pt-4 mt-4">
                        <Button variant="outline" onClick={() => setIsTutorialModalOpen(false)}>
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button onClick={saveTutorial} disabled={saving || uploading}>
                            {(saving || uploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {uploading ? (language === 'ar' ? 'جاري الرفع...' : 'Uploading...') : (language === 'ar' ? 'حفظ الفيديو' : 'Save Video')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Categories Manager Dialog */}
            <Dialog open={isCategoriesManagerOpen} onOpenChange={setIsCategoriesManagerOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{language === 'ar' ? 'إدارة تصنيفات الشروحات' : 'Manage Tutorial Categories'}</DialogTitle>
                    </DialogHeader>

                    {!isCategoryModalOpen ? (
                        <div className="space-y-4">
                            <Button className="w-full" onClick={() => {
                                setEditingCategory(null);
                                setCategoryForm(defaultCategoryForm);
                                setIsCategoryModalOpen(true);
                            }}>
                                <Plus className="w-4 h-4 mr-2" />
                                {language === 'ar' ? 'تصنيف جديد' : 'New Category'}
                            </Button>

                            <div className="border rounded-lg divide-y">
                                {categories.length === 0 ? (
                                    <p className="p-4 text-center text-muted-foreground">{language === 'ar' ? 'لا توجد تصنيفات' : 'No categories'}</p>
                                ) : categories.map(c => (
                                    <div key={c.id} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <GripVertical className="w-4 h-4 text-slate-400 cursor-move" />
                                            <span className="font-medium">{c.name[language as 'ar' | 'en'] || c.name.ar}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="icon" variant="ghost" onClick={() => openEditCategory(c)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={async () => {
                                                if (confirm(language === 'ar' ? 'تأكيد الحذف؟ ستصبح الفيديوهات بدون تصنيف.' : 'Translate to English?')) {
                                                    await fetch(`/api/admin/tutorials/categories?id=${c.id}`, { method: 'DELETE' });
                                                    fetchData();
                                                }
                                            }}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{language === 'ar' ? 'الاسم' : 'Name'} (AR/EN)</label>
                                <Input placeholder="عربي" value={categoryForm.name_ar} onChange={e => setCategoryForm({ ...categoryForm, name_ar: e.target.value })} />
                                <Input placeholder="English" dir="ltr" value={categoryForm.name_en} onChange={e => setCategoryForm({ ...categoryForm, name_en: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Slug (URL)</label>
                                <Input dir="ltr" placeholder="category-slug" value={categoryForm.slug} onChange={e => setCategoryForm({ ...categoryForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
                                    {language === 'ar' ? 'رجوع' : 'Back'}
                                </Button>
                                <Button onClick={saveCategory} disabled={saving}>
                                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {language === 'ar' ? 'حفظ' : 'Save'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
}

"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Plus, RefreshCw, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MerchandisingSnapshot, RecommendationMode, merchandisingProductImage, merchandisingProductName, recommendationExclusion } from '@/lib/product-merchandising';

type Props = {
    storeId: string;
    productId?: string;
    value: MerchandisingSnapshot | null;
    onChange: (value: MerchandisingSnapshot) => void;
    language: string;
    currency: string;
    loading: boolean;
    error: string | null;
    conflict: boolean;
    disabled?: boolean;
    onReload: () => void;
};

const PAGE_SIZE = 12;

export function ProductMerchandisingEditor({ storeId, productId, value, onChange, language, currency, loading, error, conflict, disabled, onReload }: Props) {
    const db = useMemo(() => createClient(), []);
    const ar = language === 'ar';
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const [results, setResults] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<Record<string, any>>({});
    const [selectionLoading, setSelectionLoading] = useState(false);
    const [selectionError, setSelectionError] = useState<string | null>(null);
    const [retry, setRetry] = useState(0);
    const searchRequest = useRef(0);
    const idsKey = (value?.recommendation_ids || []).join(',');

    useEffect(() => {
        const request = ++searchRequest.current;
        if (!value || value.mode !== 'manual' || loading || error) return;
        setSearching(true);
        setSearchError(null);
        const timer = setTimeout(async () => {
            try {
                // The RPC treats the query as a literal and authorizes the store owner.
                const { data, error: rpcError } = await db.rpc('search_product_merchandising_candidates', {
                    p_store_id: storeId, p_query: query.trim(), p_offset: page * PAGE_SIZE, p_limit: PAGE_SIZE,
                });
                if (rpcError) throw rpcError;
                if (!data || !Array.isArray(data.products)) throw new Error(ar ? 'تعذر تحميل المنتجات' : 'Could not load products');
                if (request !== searchRequest.current) return;
                setResults(data.products.filter((product: any) => product.id !== productId && product.store_id === storeId));
                setTotal(Number(data.total) || 0);
            } catch (cause: any) {
                if (request === searchRequest.current) { setResults([]); setSearchError(cause.message || (ar ? 'تعذر البحث عن المنتجات' : 'Could not search products')); }
            } finally { if (request === searchRequest.current) setSearching(false); }
        }, 250);
        return () => { clearTimeout(timer); searchRequest.current++; };
    }, [db, storeId, productId, query, page, value?.mode, loading, error, retry, ar]);

    useEffect(() => {
        let cancelled = false;
        const ids = idsKey ? idsKey.split(',') : [];
        setSelectionError(null);
        if (!ids.length) { setSelectedProducts({}); setSelectionLoading(false); return; }
        setSelectionLoading(true);
        (async () => {
            try {
                const { data, error: readError } = await db.from('products')
                    .select('id,store_id,name,sku,images,price,sale_price,status,catalog_visibility,stock_quantity,track_inventory,ignore_stock,max_per_order,product_variants(required,variant_options(in_stock,manage_stock,stock))')
                    .eq('store_id', storeId).in('id', ids);
                if (readError) throw readError;
                if (!cancelled) setSelectedProducts(Object.fromEntries((data || []).map((product: any) => [product.id, product])));
            } catch (cause: any) {
                if (!cancelled) setSelectionError(cause.message || (ar ? 'تعذر التحقق من المنتجات المختارة' : 'Could not check selected products'));
            } finally { if (!cancelled) setSelectionLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [db, storeId, idsKey, retry, ar]);

    const locked = disabled || loading || !!error || !value || conflict;
    const change = (patch: Partial<MerchandisingSnapshot>) => { if (value && !locked) onChange({ ...value, ...patch }); };
    const move = (index: number, delta: number) => {
        if (!value) return;
        const ids = [...value.recommendation_ids];
        const next = index + delta;
        if (next < 0 || next >= ids.length) return;
        [ids[index], ids[next]] = [ids[next], ids[index]];
        change({ recommendation_ids: ids });
    };
    const add = (product: any) => {
        if (!value || product.id === productId || product.store_id !== storeId || value.recommendation_ids.includes(product.id) || value.recommendation_ids.length >= 8) return;
        setSelectedProducts(current => ({ ...current, [product.id]: product }));
        change({ recommendation_ids: [...value.recommendation_ids, product.id] });
    };
    const price = (product: any) => `${Number(product.sale_price) > 0 && Number(product.sale_price) < Number(product.price) ? product.sale_price : product.price} ${currency}`;
    const thumbnail = (product: any) => {
        const src = merchandisingProductImage(product);
        return <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">{src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-muted-foreground"><Eye className="h-4 w-4" /></span>}</div>;
    };
    const preview = (value?.recommendation_ids || []).map(id => selectedProducts[id]).filter(product => product && !recommendationExclusion(product, language)).slice(0, value?.display_limit || 4);

    return <div className="space-y-6" aria-busy={loading}>
        {(loading || error || conflict) && <div className="space-y-2 rounded-lg border p-4" role={error || conflict ? 'alert' : 'status'}>
            {loading ? <p className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />{ar ? 'جاري تحميل الظهور والاقتراحات…' : 'Loading visibility and recommendations…'}</p> : <>
                <p className="text-sm text-destructive">{conflict ? (ar ? 'تغيرت إعدادات المنتج في جلسة أخرى. أعد تحميل الظهور والاقتراحات قبل حفظها؛ سيستبدل ذلك تعديلات هذا القسم فقط.' : 'These settings changed in another session. Reload visibility and recommendations before saving; this replaces edits in this section only.') : error}</p>
                <Button type="button" variant="outline" size="sm" onClick={onReload} disabled={disabled}><RefreshCw className="h-4 w-4 me-2" />{ar ? 'إعادة تحميل الإعدادات' : 'Reload settings'}</Button>
            </>}
        </div>}

        <Card>
            <CardHeader><CardTitle>{ar ? 'ظهور المنتج' : 'Product visibility'}</CardTitle><CardDescription>{ar ? 'الإخفاء يزيل المنتج من الرئيسية والبحث والتصنيفات والاقتراحات. يظل الرابط المباشر صالحًا للعرض والشراء وفق حالة البيع والمخزون.' : 'Hiding removes this product from the catalog, search, categories and recommendations. Its direct link remains available for viewing and purchase, subject to sale status and stock.'}</CardDescription></CardHeader>
            <CardContent>
                <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="catalog-visibility" className="flex items-center gap-2">{value?.catalog_visibility === 'unlisted' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{value?.catalog_visibility === 'unlisted' ? (ar ? 'مخفي من المتجر' : 'Hidden from catalog') : (ar ? 'ظاهر في المتجر' : 'Listed in catalog')}</Label>
                    <Switch id="catalog-visibility" checked={value?.catalog_visibility === 'listed'} disabled={locked} onCheckedChange={checked => change({ catalog_visibility: checked ? 'listed' : 'unlisted' })} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{ar ? 'هذا الإعداد لا يغير إتاحة البيع. الرابط المخفي ليس خاصًا أو محميًا.' : 'This setting does not change sale availability. A hidden link is not private or password protected.'}</p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>{ar ? 'المنتجات المقترحة' : 'Product recommendations'}</CardTitle><CardDescription>{ar ? 'اختر ما يظهر أسفل هذا المنتج. الاختيار لا ينشئ اقتراحًا عكسيًا.' : 'Choose what appears below this product. Selections do not create reciprocal recommendations.'}</CardDescription></CardHeader>
            <CardContent className="space-y-5">
                <fieldset disabled={locked} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <legend className="sr-only">{ar ? 'وضع الاقتراحات' : 'Recommendation mode'}</legend>
                    {([{ id: 'auto', ar: 'تلقائي', en: 'Automatic' }, { id: 'manual', ar: 'أختار بنفسي', en: 'Choose products' }, { id: 'off', ar: 'إيقاف', en: 'Off' }] as const).map(mode => <label key={mode.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${value?.mode === mode.id ? 'border-primary bg-primary/5' : ''}`}><input type="radio" name="recommendation-mode" value={mode.id} checked={value?.mode === mode.id} onChange={() => change({ mode: mode.id as RecommendationMode })} />{ar ? mode.ar : mode.en}</label>)}
                </fieldset>
                {value?.mode === 'auto' && <p className="text-sm text-muted-foreground">{ar ? 'تُختار منتجات متاحة من نفس التصنيفات أولًا، ثم يُستكمل العدد من المتجر.' : 'Available products from the same categories are preferred, followed by other eligible store products.'}</p>}
                {value?.mode === 'off' && <p className="text-sm text-muted-foreground">{ar ? 'لن يظهر قسم اقتراحات على صفحة هذا المنتج.' : 'The recommendations section will not appear on this product page.'}</p>}

                {value && value.mode !== 'off' && <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label htmlFor="recommendation-title-ar">{ar ? 'عنوان القسم بالعربية' : 'Section title in Arabic'}</Label><Input id="recommendation-title-ar" dir="rtl" maxLength={120} disabled={locked} value={value.title.ar} placeholder="قد يعجبك أيضًا" onChange={event => change({ title: { ...value.title, ar: event.target.value } })} /></div>
                    <div className="space-y-2"><Label htmlFor="recommendation-title-en">{ar ? 'عنوان القسم بالإنجليزية' : 'Section title in English'}</Label><Input id="recommendation-title-en" dir="ltr" maxLength={120} disabled={locked} value={value.title.en} placeholder="You may also like" onChange={event => change({ title: { ...value.title, en: event.target.value } })} /></div>
                    <div className="space-y-2"><Label htmlFor="recommendation-limit">{ar ? 'العدد الظاهر' : 'Display limit'}</Label><select id="recommendation-limit" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" disabled={locked} value={value.display_limit} onChange={event => change({ display_limit: Number(event.target.value) as MerchandisingSnapshot['display_limit'] })}>{[2, 4, 6, 8].map(count => <option key={count} value={count}>{count}</option>)}</select></div>
                </div>}

                {value?.mode === 'manual' && <>
                    <div className="space-y-3 rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-2"><h4 className="text-sm font-medium">{ar ? 'المنتجات المختارة بالترتيب' : 'Selected products in order'}</h4><Badge variant="secondary">{value.recommendation_ids.length} / 8</Badge></div>
                        {(selectionLoading || selectionError) && <p role={selectionError ? 'alert' : 'status'} className="text-sm text-muted-foreground">{selectionError || (ar ? 'جاري التحقق من الاختيارات…' : 'Checking selected products…')}{selectionError && <Button type="button" size="sm" variant="ghost" onClick={() => setRetry(count => count + 1)}>{ar ? 'إعادة المحاولة' : 'Retry'}</Button>}</p>}
                        {!value.recommendation_ids.length && <p className="text-sm text-muted-foreground">{ar ? 'أضف منتجات من البحث أدناه.' : 'Add products using the search below.'}</p>}
                        <ol className="space-y-2">
                            {value.recommendation_ids.map((id, index) => {
                                const product = selectedProducts[id];
                                const reason = selectionLoading || selectionError ? null : recommendationExclusion(product, language);
                                const name = product ? merchandisingProductName(product, language) : (ar ? 'منتج غير متاح' : 'Unavailable product');
                                return <li key={id} className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/40 p-2">
                                    <span className="text-xs text-muted-foreground">{index + 1}</span>{thumbnail(product)}
                                    <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{name}</p>{product && <p className="text-xs text-muted-foreground">{price(product)}{product.sku ? ` · ${product.sku}` : ''}</p>}{reason && <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{reason}</p>}</div>
                                    <div className="flex items-center gap-1"><Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={locked || index === 0} aria-label={`${ar ? 'تحريك لأعلى' : 'Move up'}: ${name}`} onClick={() => move(index, -1)}><ArrowUp className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={locked || index === value.recommendation_ids.length - 1} aria-label={`${ar ? 'تحريك لأسفل' : 'Move down'}: ${name}`} onClick={() => move(index, 1)}><ArrowDown className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={locked} aria-label={`${ar ? 'إزالة الاقتراح' : 'Remove recommendation'}: ${name}`} onClick={() => change({ recommendation_ids: value.recommendation_ids.filter(selected => selected !== id) })}><X className="h-4 w-4" /></Button></div>
                                </li>;
                            })}
                        </ol>
                        <p className="text-xs text-muted-foreground">{ar ? 'الاختيارات المخفية أو غير المتاحة تُحفظ، لكنها لا تظهر للزائر ولا تُستبدل تلقائيًا.' : 'Hidden or unavailable selections are retained, excluded from the storefront and never automatically replaced.'}</p>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="recommendation-search">{ar ? 'بحث بالاسم أو SKU' : 'Search by name or SKU'}</Label>
                        <Input id="recommendation-search" type="search" disabled={locked} value={query} maxLength={120} placeholder={ar ? 'ابحث في منتجات هذا المتجر…' : 'Search this store’s products…'} onChange={event => { setQuery(event.target.value); setPage(0); }} />
                        {searchError && <div role="alert" className="text-sm text-destructive">{searchError}<Button type="button" variant="ghost" size="sm" onClick={() => setRetry(count => count + 1)}>{ar ? 'إعادة المحاولة' : 'Retry'}</Button></div>}
                        {searching ? <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{ar ? 'جاري البحث…' : 'Searching…'}</p> : <div className="grid gap-2 sm:grid-cols-2">{results.map(product => {
                            const selected = value.recommendation_ids.includes(product.id);
                            const reason = recommendationExclusion(product, language);
                            return <div key={product.id} className="flex items-center gap-2 rounded-lg border p-2">{thumbnail(product)}<div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{merchandisingProductName(product, language)}</p><p className="text-xs text-muted-foreground">{price(product)}{product.sku ? ` · ${product.sku}` : ''}</p>{reason && <p className="text-xs text-amber-700 dark:text-amber-400">{reason}</p>}</div><Button type="button" variant="outline" size="sm" disabled={locked || selected || value.recommendation_ids.length >= 8} onClick={() => add(product)} aria-label={`${ar ? 'إضافة اقتراح' : 'Add recommendation'}: ${merchandisingProductName(product, language)}`}>{selected ? (ar ? 'مختار' : 'Selected') : <Plus className="h-4 w-4" />}</Button></div>;
                        })}</div>}
                        {!searching && !searchError && !results.length && <p className="text-sm text-muted-foreground">{ar ? 'لا توجد منتجات مطابقة في هذه الصفحة.' : 'No matching products on this page.'}</p>}
                        <div className="flex items-center justify-between gap-2"><Button type="button" variant="outline" size="sm" disabled={locked || searching || page === 0} onClick={() => setPage(current => current - 1)}>{ar ? 'السابق' : 'Previous'}</Button><span className="text-xs text-muted-foreground">{ar ? 'الصفحة' : 'Page'} {page + 1} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span><Button type="button" variant="outline" size="sm" disabled={locked || searching || (page + 1) * PAGE_SIZE >= total} onClick={() => setPage(current => current + 1)}>{ar ? 'التالي' : 'Next'}</Button></div>
                    </div>
                </>}

                {value && value.mode !== 'off' && <div className="space-y-3 rounded-lg border border-dashed p-4">
                    <p className="text-xs text-muted-foreground">{ar ? 'معاينة القسم' : 'Section preview'}</p><h4 className="font-semibold">{value.title[ar ? 'ar' : 'en'] || (ar ? 'قد يعجبك أيضًا' : 'You may also like')}</h4>
                    {value.mode === 'auto' ? <p className="text-sm text-muted-foreground">{ar ? `حتى ${value.display_limit} منتجات متاحة، تُحدّد تلقائيًا عند زيارة صفحة المنتج.` : `Up to ${value.display_limit} eligible products, selected automatically when the product page is visited.`}</p> : selectionLoading || selectionError ? <p className="text-sm text-muted-foreground">{ar ? 'تتوفر المعاينة بعد التحقق من الاختيارات.' : 'The preview is available after selections are checked.'}</p> : preview.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{preview.map(product => <div key={product.id} className="space-y-2 rounded-lg border p-3">{thumbnail(product)}<p className="break-words text-sm">{merchandisingProductName(product, language)}</p><p className="text-xs text-muted-foreground">{price(product)}</p></div>)}</div> : <p className="text-sm text-muted-foreground">{ar ? 'لن يظهر القسم للزائر حتى يتوفر منتج مختار مؤهل.' : 'This section stays hidden until an eligible selected product is available.'}</p>}
                </div>}
            </CardContent>
        </Card>
    </div>;
}

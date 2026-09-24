export type CatalogVisibility = 'listed' | 'unlisted';
export type RecommendationMode = 'auto' | 'manual' | 'off';
export type MerchandisingSnapshot = {
    revision: number;
    catalog_visibility: CatalogVisibility;
    mode: RecommendationMode;
    title: { ar: string; en: string };
    display_limit: 2 | 4 | 6 | 8;
    recommendation_ids: string[];
};

export function defaultMerchandising(): MerchandisingSnapshot {
    return { revision: 0, catalog_visibility: 'listed', mode: 'auto', title: { ar: '', en: '' }, display_limit: 4, recommendation_ids: [] };
}

export function validateMerchandising(value: MerchandisingSnapshot, productId?: string) {
    if (!Number.isInteger(value.revision) || value.revision < 0) throw new Error('Invalid merchandising revision.');
    if (!['listed', 'unlisted'].includes(value.catalog_visibility) || !['auto', 'manual', 'off'].includes(value.mode)) throw new Error('Invalid merchandising settings.');
    if (![2, 4, 6, 8].includes(value.display_limit)) throw new Error('Choose 2, 4, 6 or 8 recommendations.');
    if (!value.title || typeof value.title.ar !== 'string' || typeof value.title.en !== 'string' || value.title.ar.length > 120 || value.title.en.length > 120) throw new Error('Recommendation titles must be at most 120 characters.');
    if (!Array.isArray(value.recommendation_ids) || value.recommendation_ids.length > 8) throw new Error('Select at most 8 recommendations.');
    if (new Set(value.recommendation_ids).size !== value.recommendation_ids.length) throw new Error('A recommendation cannot be selected twice.');
    if (productId && value.recommendation_ids.includes(productId)) throw new Error('A product cannot recommend itself.');
    if (value.recommendation_ids.some(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) throw new Error('Invalid recommendation product.');
}

function parseSnapshot(data: unknown): MerchandisingSnapshot {
    // Never replace a failed/malformed read with defaults on an existing product.
    if (!data || typeof data !== 'object') throw new Error('Could not load product visibility and recommendations.');
    const snapshot = data as MerchandisingSnapshot;
    validateMerchandising(snapshot);
    return snapshot;
}

export async function loadProductMerchandising(db: any, productId: string): Promise<MerchandisingSnapshot> {
    const { data, error } = await db.rpc('get_product_merchandising', { p_product_id: productId });
    if (error) throw error;
    return parseSnapshot(data);
}

export class MerchandisingSaveError extends Error {
    constructor(message: string, public conflict = false) { super(message); this.name = 'MerchandisingSaveError'; }
}

async function catalogRequest(storeId: string, body: Record<string, unknown>) {
    const response = await fetch(`/api/dashboard/${encodeURIComponent(storeId)}/catalog`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new MerchandisingSaveError(result.error || 'Could not save product visibility and recommendations.', response.status === 409);
    return result;
}

export async function saveProductMerchandising(storeId: string, productId: string, value: MerchandisingSnapshot): Promise<MerchandisingSnapshot> {
    validateMerchandising(value, productId);
    const result = await catalogRequest(storeId, { operation: 'save', productId, ...value });
    return parseSnapshot(result.snapshot ?? result);
}

export async function setProductsCatalogVisibility(storeId: string, productIds: string[], visibility: CatalogVisibility) {
    if (!productIds.length || productIds.length > 200) throw new Error('Select between 1 and 200 products.');
    await catalogRequest(storeId, { operation: 'visibility', productIds, visibility });
}

export function merchandisingProductName(product: any, language: string): string {
    let name = product?.name;
    try { if (typeof name === 'string') name = JSON.parse(name); } catch { /* A plain product name is also supported. */ }
    if (typeof name === 'string') return name;
    return name?.[language] || name?.ar || name?.en || (language === 'ar' ? 'منتج دون اسم' : 'Unnamed product');
}

export function merchandisingProductImage(product: any): string | null {
    let images = product?.images;
    try { if (typeof images === 'string') images = JSON.parse(images); } catch { return images || null; }
    return Array.isArray(images) && typeof images[0] === 'string' ? images[0] : null;
}

export function recommendationExclusion(product: any, language: string): string | null {
    const ar = language === 'ar';
    if (!product) return ar ? 'محذوف أو لم يعد متاحًا — لن يظهر للزائر' : 'Deleted or no longer accessible — excluded from storefront';
    if (product.catalog_visibility === 'unlisted') return ar ? 'مخفي من المتجر — لن يظهر في الاقتراحات' : 'Hidden from catalog — excluded from recommendations';
    if (product.status !== 'active') return ar ? 'غير متاح للبيع — لن يظهر في الاقتراحات' : 'Unavailable for sale — excluded from recommendations';
    if (typeof product.buyable === 'boolean') return product.buyable ? null : (ar ? 'المخزون أو الخيارات المطلوبة غير متاحة' : 'Stock or required options are unavailable');
    if (product.max_per_order != null && Number(product.max_per_order) < 1) return ar ? 'المنتج لا يسمح بإضافة كمية للطلب' : 'The product does not allow an order quantity';
    const groups = product.product_variants || [];
    if (groups.some((group: any) => group.required && !(group.variant_options || []).some((option: any) => product.ignore_stock || (option.in_stock !== false && (!option.manage_stock || option.stock == null || Number(option.stock) > 0))))) {
        return ar ? 'خيارات المنتج المطلوبة غير متاحة' : 'Required product options are unavailable';
    }
    if (!product.ignore_stock && product.track_inventory !== false && product.stock_quantity != null && Number(product.stock_quantity) <= 0) return ar ? 'نفد المخزون — لن يظهر في الاقتراحات' : 'Out of stock — excluded from recommendations';
    return null;
}

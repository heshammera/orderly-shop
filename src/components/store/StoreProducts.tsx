"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Loader2, SlidersHorizontal, X, Eye, ShoppingCart, Search } from 'lucide-react';
import { QuickViewModal } from '@/components/store/QuickViewModal';
import { useCart } from '@/contexts/CartContext';

// New Advanced Search Components
import { SearchBar } from '@/components/store/SearchBar';
import { AdvancedFilters } from '@/components/store/AdvancedFilters';
import { SortDropdown } from '@/components/store/SortDropdown';

interface Product {
    id: string;
    name: { ar: string; en: string };
    price: number;
    compare_at_price: number | null;
    images: string[];
}

interface Category {
    id: string;
    name: { ar: string; en: string };
    parent_id: string | null;
}

interface StoreData {
    id: string;
    currency: string;
    slug: string;
}

interface StoreProductsProps {
    store: StoreData;
    initialCategories: Category[];
    initialProducts: Product[];
}

export function StoreProducts({ store, initialCategories, initialProducts }: StoreProductsProps) {
    const { language } = useLanguage();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { addToCart } = useCart();

    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [categories] = useState<Category[]>(initialCategories);
    const [loading, setLoading] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [quickViewProduct, setQuickViewProduct] = useState<string | null>(null);
    const [totalProducts, setTotalProducts] = useState(initialProducts.length);

    // Filter states from URL
    const selectedCategory = searchParams.get('category');
    const searchQuery = searchParams.get('q');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort');

    // Fetch filtered products whenever searchParams change
    useEffect(() => {
        // If there are no search params, we could just use initialProducts, but to be sure we fetch the freshest.
        // Or if initial products match exactly what's requested. 
        // We will fetch if any filter is applied to make sure we reflect the advanced search API logic.
        const shouldFetch = searchParams.toString().length > 0;

        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams(searchParams.toString());
                params.set('storeId', store.id);
                params.set('limit', '20'); // Pagination can be added later

                const res = await fetch(`/api/store/search?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data.products || []);
                    setTotalProducts(data.total || 0);
                }
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };

        if (shouldFetch) {
            fetchProducts();
        } else {
            // Revert to initial
            setProducts(initialProducts);
            setTotalProducts(initialProducts.length);
        }
    }, [searchParams, store.id, initialProducts]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
            style: 'currency',
            currency: store.currency,
        }).format(price);
    };

    const handleClearFilters = () => {
        router.push(pathname, { scroll: false });
    };

    const selectedCategoryName = selectedCategory
        ? categories.find(c => c.id === selectedCategory)?.name[language] || ''
        : '';

    const hasFilters = !!(selectedCategory || searchQuery || minPrice || maxPrice);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header section with title and search bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        {searchQuery
                            ? (language === 'ar' ? `نتائج البحث عن "${searchQuery}"` : `Search results for "${searchQuery}"`)
                            : selectedCategory
                                ? selectedCategoryName
                                : (language === 'ar' ? 'جميع المنتجات' : 'All Products')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {totalProducts} {language === 'ar' ? 'منتج' : 'products'}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    {/* Search Component */}
                    <div className="w-full sm:w-64 order-2 sm:order-1">
                        <SearchBar storeId={store.id} storeSlug={store.slug} />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="order-3 sm:order-2">
                        <SortDropdown />
                    </div>

                    {/* Mobile Filter Button */}
                    <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                        <SheetTrigger asChild className="md:hidden order-1 sm:order-3">
                            <Button variant="outline" className="gap-2">
                                <SlidersHorizontal className="w-4 h-4" />
                                {language === 'ar' ? 'تصفية وترتيب' : 'Filter & Sort'}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side={language === 'ar' ? 'right' : 'left'} className="w-[85vw] sm:w-[400px]">
                            <SheetHeader className="mb-6">
                                <SheetTitle>{language === 'ar' ? 'تصفية المنتجات' : 'Filter Products'}</SheetTitle>
                            </SheetHeader>
                            <AdvancedFilters categories={categories} currency={store.currency} />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Active Filters Badges */}
            {hasFilters && (
                <div className="flex flex-wrap items-center gap-2 mb-6 pb-6 border-b border-gray-100">
                    <span className="text-sm text-muted-foreground me-2">
                        {language === 'ar' ? 'الفلاتر النشطة:' : 'Active Filters:'}
                    </span>

                    {selectedCategory && (
                        <Badge variant="secondary" className="gap-1.5 px-3 py-1 font-normal bg-blue-50 text-blue-700 hover:bg-blue-100">
                            {selectedCategoryName}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => {
                                const params = new URLSearchParams(searchParams.toString());
                                params.delete('category');
                                router.push(`${pathname}?${params.toString()}`);
                            }} />
                        </Badge>
                    )}

                    {(minPrice || maxPrice) && (
                        <Badge variant="secondary" className="gap-1.5 px-3 py-1 font-normal bg-green-50 text-green-700 hover:bg-green-100">
                            {language === 'ar' ? 'السعر' : 'Price'}: {minPrice || '0'} - {maxPrice || '∞'} {store.currency}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => {
                                const params = new URLSearchParams(searchParams.toString());
                                params.delete('minPrice');
                                params.delete('maxPrice');
                                router.push(`${pathname}?${params.toString()}`);
                            }} />
                        </Badge>
                    )}

                    <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs text-muted-foreground hover:text-red-500 h-7">
                        {language === 'ar' ? 'مسح الكل' : 'Clear All'}
                    </Button>
                </div>
            )}

            <div className="flex gap-8 relative items-start">
                {/* Desktop Sidebar containing Advanced Filters */}
                <aside className="hidden md:block w-64 flex-shrink-0 sticky top-24">
                    <AdvancedFilters categories={categories} currency={store.currency} />
                </aside>

                {/* Products Grid */}
                <div className="flex-1">
                    {loading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-pulse">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="bg-gray-100 rounded-xl aspect-[3/4] w-full"></div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <Search className="w-6 h-6 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {language === 'ar' ? 'لا توجد منتجات مطابقة' : 'No matching products'}
                            </h3>
                            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                {language === 'ar'
                                    ? 'حاول تغيير معايير البحث أو مسح الفلاتر لرؤية المزيد من المنتجات.'
                                    : 'Try changing your search criteria or clear filters to see more products.'}
                            </p>
                            <Button onClick={handleClearFilters} variant="outline" className="rounded-full">
                                {language === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {products.map((product) => (
                                <div key={product.id} className="relative group">
                                    <div onClick={() => router.push(`/s/${store.slug}/p/${product.id}`)} className="block h-full cursor-pointer">
                                        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col border border-gray-100 hover:border-primary/20 bg-white group-hover:-translate-y-1">
                                            <Link href={`/s/${store.slug}/p/${product.id}`} className="sr-only">
                                                {product.name[language] || product.name.ar}
                                            </Link>
                                            <CardContent className="p-0 flex flex-col h-full">
                                                <div className="aspect-square bg-gray-50 relative overflow-hidden flex-shrink-0">
                                                    {product.images?.length > 0 ? (
                                                        <img
                                                            src={product.images[0]}
                                                            alt={product.name[language] || product.name.ar}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                            <span className="text-5xl font-bold text-gray-300">
                                                                {(product.name[language] || product.name.ar || '').charAt(0)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {product.compare_at_price && product.compare_at_price > product.price && (
                                                        <Badge className="absolute top-3 start-3 bg-red-500 text-white border-none shadow-sm font-medium px-2.5 py-1">
                                                            {language === 'ar' ? 'تخفيض' : 'Sale'}
                                                        </Badge>
                                                    )}

                                                    {/* Quick View Button Overlay */}
                                                    <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 pointer-events-none z-10">
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewProduct(product.id); }}
                                                            className="pointer-events-auto bg-white/95 backdrop-blur-sm rounded-full px-5 py-2.5 flex items-center gap-2 text-sm font-medium text-gray-900 shadow-lg hover:bg-primary hover:text-white transition-colors"
                                                            title={language === 'ar' ? 'معاينة سريعة' : 'Quick View'}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            {language === 'ar' ? 'معاينة' : 'Quick View'}
                                                        </button>
                                                    </div>

                                                    {/* Top Gradient Overlay for subtle look */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                                </div>
                                                <div className="p-4 sm:p-5 flex flex-col flex-grow">
                                                    <h3 className="font-medium text-sm sm:text-base mb-2 line-clamp-2 text-gray-800 group-hover:text-primary transition-colors">
                                                        {product.name[language] || product.name.ar}
                                                    </h3>
                                                    <div className="flex items-center justify-between mt-auto pt-2">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-900 font-mono text-base sm:text-lg">
                                                                {formatPrice(product.price)}
                                                            </span>
                                                            {product.compare_at_price && product.compare_at_price > product.price && (
                                                                <span className="text-xs text-muted-foreground line-through font-mono">
                                                                    {formatPrice(product.compare_at_price)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                addToCart({
                                                                    productId: product.id,
                                                                    productName: product.name,
                                                                    productImage: product.images?.[0] || null,
                                                                    basePrice: product.price,
                                                                    unitPrice: product.price,
                                                                    quantity: 1,
                                                                    variants: [],
                                                                    addedAt: new Date().toISOString()
                                                                });
                                                            }}
                                                            className="bg-gray-100 hover:bg-primary text-gray-800 hover:text-white p-2.5 sm:p-3 rounded-full transition-colors flex-shrink-0"
                                                            title={language === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
                                                        >
                                                            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {quickViewProduct && (
                <QuickViewModal
                    isOpen={!!quickViewProduct}
                    onOpenChange={(open) => !open && setQuickViewProduct(null)}
                    productId={quickViewProduct}
                    storeId={store.slug}
                />
            )}
        </div>
    );
}

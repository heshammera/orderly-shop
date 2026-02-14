"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Loader2, Search, SlidersHorizontal, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
    const supabase = createClient();

    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);

    const selectedCategory = searchParams.get('category');

    useEffect(() => {
        // If we have initial data and no filter changes, we might not need to fetch.
        // But if the URL changes (category selected), we need to fetch filtered products.
        // Or we can filter client side if we have ALL products, but usually we don't.
        // Let's assume we fetch on client for filtering to keep it simple effectively like the old one,
        // OR we could use Server Actions / Router refresh.
        // For now, let's replicate the client-side fetching logic on param change for consistency with the old app,
        // but use the initial data if it matches.

        if (selectedCategory) {
            fetchProducts();
        } else {
            // If no category, we might default to initialProducts if they are "All"
            // But if user navigates back to "All", we should ensure we show all.
            // If initialProducts was "All", we can use it.
            // Let's just fetch to be safe and reactive, or optimize later.
            // Optimization: If initialProducts is present and we are on first load (no selectedCategory), use it.
            // But this useEffect runs on dependency change.
            fetchProducts();
        }
    }, [selectedCategory, store.id]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('products')
                .select('id, name, price, compare_at_price, images')
                .eq('store_id', store.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (selectedCategory) {
                // Get products in this category via product_categories
                const { data: productCategories } = await supabase
                    .from('product_categories')
                    .select('product_id')
                    .eq('category_id', selectedCategory);

                if (productCategories && productCategories.length > 0) {
                    const productIds = productCategories.map(pc => pc.product_id);
                    query = query.in('id', productIds);
                } else {
                    setProducts([]);
                    setLoading(false);
                    return;
                }
            }

            const { data } = await query;

            if (data) {
                setProducts(data.map(p => ({
                    ...p,
                    name: typeof p.name === 'string' ? JSON.parse(p.name) : p.name,
                    images: Array.isArray(p.images) ? (p.images as string[]) : [],
                })));
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
            style: 'currency',
            currency: store.currency,
        }).format(price);
    };

    const filteredProducts = products.filter(product => {
        if (!searchQuery) return true;
        const name = product.name[language] || product.name.ar || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleCategorySelect = (categoryId: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (categoryId) {
            params.set('category', categoryId);
        } else {
            params.delete('category');
        }
        router.push(`${pathname}?${params.toString()}`);
        setFilterOpen(false);
    };

    const selectedCategoryName = selectedCategory
        ? categories.find(c => c.id === selectedCategory)?.name[language] || ''
        : '';

    const CategoryFilter = () => (
        <div className="space-y-2">
            <Button
                variant={!selectedCategory ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => handleCategorySelect(null)}
            >
                {language === 'ar' ? 'كل المنتجات' : 'All Products'}
            </Button>
            {categories.filter(c => !c.parent_id).map((category) => (
                <div key={category.id}>
                    <Button
                        variant={selectedCategory === category.id ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => handleCategorySelect(category.id)}
                    >
                        {category.name[language] || category.name.ar}
                    </Button>
                    {/* Sub-categories */}
                    {categories.filter(c => c.parent_id === category.id).map((sub) => (
                        <Button
                            key={sub.id}
                            variant={selectedCategory === sub.id ? 'default' : 'ghost'}
                            className="w-full justify-start ps-8"
                            onClick={() => handleCategorySelect(sub.id)}
                        >
                            {sub.name[language] || sub.name.ar}
                        </Button>
                    ))}
                </div>
            ))}
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        {selectedCategory
                            ? selectedCategoryName
                            : (language === 'ar' ? 'جميع المنتجات' : 'All Products')}
                    </h1>
                    <p className="text-muted-foreground">
                        {filteredProducts.length} {language === 'ar' ? 'منتج' : 'products'}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ps-10"
                        />
                    </div>

                    {/* Mobile Filter Button */}
                    <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="outline" size="icon">
                                <SlidersHorizontal className="w-4 h-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side={language === 'ar' ? 'right' : 'left'}>
                            <SheetHeader>
                                <SheetTitle>{language === 'ar' ? 'التصنيفات' : 'Categories'}</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6">
                                <CategoryFilter />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Selected Category Badge */}
            {selectedCategory && (
                <div className="mb-4">
                    <Badge variant="secondary" className="gap-2 px-3 py-1">
                        {selectedCategoryName}
                        <button onClick={() => handleCategorySelect(null)}>
                            <X className="w-3 h-3" />
                        </button>
                    </Badge>
                </div>
            )}

            <div className="flex gap-8">
                {/* Desktop Sidebar */}
                <aside className="hidden md:block w-64 flex-shrink-0">
                    <h3 className="font-semibold mb-4">{language === 'ar' ? 'التصنيفات' : 'Categories'}</h3>
                    <CategoryFilter />
                </aside>

                {/* Products Grid */}
                <div className="flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                {language === 'ar' ? 'لا توجد منتجات' : 'No products found'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {filteredProducts.map((product) => (
                                <Link key={product.id} href={`/s/${store.slug}/p/${product.id}`}>
                                    <Card className="group overflow-hidden hover:shadow-lg transition-shadow h-full">
                                        <CardContent className="p-0">
                                            <div className="aspect-square bg-muted relative overflow-hidden">
                                                {product.images.length > 0 ? (
                                                    <img
                                                        src={product.images[0]}
                                                        alt={product.name[language] || product.name.ar}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                                        <span className="text-4xl font-bold text-primary/20">
                                                            {(product.name[language] || product.name.ar).charAt(0)}
                                                        </span>
                                                    </div>
                                                )}
                                                {product.compare_at_price && product.compare_at_price > product.price && (
                                                    <Badge className="absolute top-2 start-2 bg-destructive">
                                                        {language === 'ar' ? 'تخفيض' : 'Sale'}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-medium text-sm mb-2 line-clamp-2">
                                                    {product.name[language] || product.name.ar}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-primary">
                                                        {formatPrice(product.price)}
                                                    </span>
                                                    {product.compare_at_price && product.compare_at_price > product.price && (
                                                        <span className="text-sm text-muted-foreground line-through">
                                                            {formatPrice(product.compare_at_price)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

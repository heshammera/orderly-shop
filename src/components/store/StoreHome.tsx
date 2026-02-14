"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Product {
    id: string;
    name: { ar: string; en: string };
    price: number;
    compare_at_price: number | null;
    images: string[];
    status: string;
}

interface Category {
    id: string;
    name: { ar: string; en: string };
    image_url: string | null;
}

interface StoreData {
    id: string;
    name: { ar: string; en: string };
    description: { ar: string; en: string };
    currency: string;
    slug: string;
}

interface StoreHomeProps {
    store: StoreData;
    products: Product[];
    categories: Category[];
}

export function StoreHome({ store, products, categories }: StoreHomeProps) {
    const { language } = useLanguage();
    const ArrowForward = language === 'ar' ? ArrowLeft : ArrowRight;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
            style: 'currency',
            currency: store.currency,
        }).format(price);
    };

    const storeName = store.name[language] || store.name.ar || store.name.en;
    const storeDescription = store.description[language] || store.description.ar || store.description.en;

    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">{storeName}</h1>
                    {storeDescription && (
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                            {storeDescription}
                        </p>
                    )}
                    <Link href={`/s/${store.slug}/products`}>
                        <Button size="lg" className="gap-2">
                            {language === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
                            <ArrowForward className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Categories */}
            {categories.length > 0 && (
                <section className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">
                            {language === 'ar' ? 'التصنيفات' : 'Categories'}
                        </h2>
                        <Link href={`/s/${store.slug}/products`}>
                            <Button variant="ghost" className="gap-1">
                                {language === 'ar' ? 'عرض الكل' : 'View All'}
                                <ArrowForward className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/s/${store.slug}/products?category=${category.id}`}
                            >
                                <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
                                    <CardContent className="p-0">
                                        <div className="aspect-square bg-muted relative overflow-hidden">
                                            {category.image_url ? (
                                                <img
                                                    src={category.image_url}
                                                    alt={category.name[language] || category.name.ar}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                                    <span className="text-3xl font-bold text-primary/40">
                                                        {(category.name[language] || category.name.ar).charAt(0)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 text-center">
                                            <h3 className="font-medium text-sm truncate">
                                                {category.name[language] || category.name.ar}
                                            </h3>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Featured Products */}
            <section className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">
                        {language === 'ar' ? 'أحدث المنتجات' : 'Latest Products'}
                    </h2>
                    <Link href={`/s/${store.slug}/products`}>
                        <Button variant="ghost" className="gap-1">
                            {language === 'ar' ? 'عرض الكل' : 'View All'}
                            <ArrowForward className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>

                {products.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        {language === 'ar' ? 'لا توجد منتجات حالياً' : 'No products available'}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {products.map((product) => (
                            <Link key={product.id} href={`/s/${store.slug}/p/${product.id}`}>
                                <Card className="group overflow-hidden hover:shadow-lg transition-shadow h-full">
                                    <CardContent className="p-0">
                                        <div className="aspect-square bg-muted relative overflow-hidden">
                                            {product.images?.length > 0 ? (
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
            </section>
        </div>
    );
}

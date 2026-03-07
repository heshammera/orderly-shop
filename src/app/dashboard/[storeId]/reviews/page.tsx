"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Star, User, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Review {
    id: string;
    customer_name: string;
    rating: number;
    comment: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    product: {
        name: any;
        images: string[];
    } | null;
}

export default function ReviewsPage({ params }: { params: { storeId: string } }) {
    const { language, dir } = useLanguage();
    const { toast } = useToast();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

    const fetchReviews = async (statusFilter: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dashboard/${params.storeId}/reviews?status=${statusFilter}`);
            const data = await res.json();
            if (res.ok) {
                setReviews(data.reviews || []);
            } else {
                toast({
                    title: language === 'ar' ? 'خطأ' : 'Error',
                    description: data.error || (language === 'ar' ? 'حدث خطأ أثناء جلب التقييمات' : 'Error fetching reviews'),
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: language === 'ar' ? 'حدث خطأ أثناء جلب التقييمات' : 'Error fetching reviews',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews(filter);
    }, [params.storeId, filter]);

    const updateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
        setUpdating(id);
        try {
            const res = await fetch(`/api/dashboard/${params.storeId}/reviews`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewId: id, status: newStatus })
            });

            if (res.ok) {
                setReviews(prev => prev.filter(r => r.id !== id));
                toast({
                    title: language === 'ar' ? 'تم التحديث' : 'Updated',
                    description: language === 'ar' ? 'تم تحديث حالة التقييم بنجاح' : 'Review status updated successfully',
                });
            }
        } catch (error) {
            console.error('Error updating review:', error);
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: language === 'ar' ? 'حدث خطأ أثناء تحديث التقييم' : 'Error updating review',
                variant: 'destructive',
            });
        } finally {
            setUpdating(null);
        }
    };

    const deleteReview = async (id: string) => {
        if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا التقييم؟' : 'Are you sure you want to delete this review?')) return;

        setUpdating(id);
        try {
            const res = await fetch(`/api/dashboard/${params.storeId}/reviews?reviewId=${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete review');

            setReviews(prev => prev.filter(r => r.id !== id));
            toast({
                title: language === 'ar' ? 'تم الحذف' : 'Deleted',
                description: language === 'ar' ? 'تم حذف التقييم نهائياً' : 'Review deleted permanently',
            });
        } catch (error) {
            console.error('Error deleting review:', error);
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: language === 'ar' ? 'حدث خطأ أثناء حذف التقييم' : 'Error deleting review',
                variant: 'destructive',
            });
        } finally {
            setUpdating(null);
        }
    };

    const StatusTabs = () => (
        <div className="flex flex-wrap gap-2 border-b pb-4 mb-6">
            <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilter('pending')}
                className="rounded-full"
            >
                {language === 'ar' ? 'بانتظار الموافقة' : 'Pending'}
            </Button>
            <Button
                variant={filter === 'approved' ? 'default' : 'outline'}
                onClick={() => setFilter('approved')}
                className="rounded-full"
            >
                {language === 'ar' ? 'المعتمدة' : 'Approved'}
            </Button>
            <Button
                variant={filter === 'rejected' ? 'default' : 'outline'}
                onClick={() => setFilter('rejected')}
                className="rounded-full"
            >
                {language === 'ar' ? 'المرفوضة' : 'Rejected'}
            </Button>
        </div>
    );

    const getProductName = (nameObj: any) => {
        if (!nameObj) return language === 'ar' ? 'منتج غير معروف' : 'Unknown Product';
        if (typeof nameObj === 'string') return nameObj;
        return nameObj[language] || nameObj.ar || nameObj.en;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6" dir={dir}>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {language === 'ar' ? 'التقييمات والمراجعات' : 'Product Reviews'}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {language === 'ar'
                            ? 'إدارة تقييمات العملاء لمنتجات متجرك'
                            : 'Manage customer reviews for your products'}
                    </p>
                </div>
            </div>

            <StatusTabs />

            {loading ? (
                <div className="flex items-center justify-center min-h-[300px]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : reviews.length === 0 ? (
                <div className="bg-card border rounded-lg p-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">
                        {language === 'ar' ? 'لا توجد تقييمات بهذا التصنيف' : 'No reviews found in this category'}
                    </h3>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-card border rounded-lg p-5 flex flex-col relative">
                            {/* Product Info */}
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                                {(() => {
                                    let imgUrl: string | null = null;
                                    if (review.product?.images) {
                                        const imgs = typeof review.product.images === 'string'
                                            ? JSON.parse(review.product.images)
                                            : review.product.images;
                                        if (Array.isArray(imgs) && imgs.length > 0) imgUrl = imgs[0];
                                    }
                                    return imgUrl ? (
                                        <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0 border">
                                            <Image src={imgUrl} alt="" fill className="object-cover" sizes="40px" />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                                            <MessageSquare className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                    );
                                })()}
                                <p className="text-sm font-medium line-clamp-2 leading-tight flex-1">
                                    {getProductName(review.product?.name)}
                                </p>
                            </div>

                            {/* Customer & Rating */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {review.customer_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">{review.customer_name}</h4>
                                        <div className="flex gap-0.5 mt-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={cn(
                                                        "w-3.5 h-3.5",
                                                        star <= review.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground text-center">
                                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: language === 'ar' ? ar : enUS })}
                                </span>
                            </div>

                            {/* Comment */}
                            <div className="flex-1">
                                {review.comment ? (
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-4">"{review.comment}"</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground/50 italic mt-2">
                                        {language === 'ar' ? 'بدون تعليق نصي' : 'No written comment'}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                                {filter === 'pending' && (
                                    <>
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                            onClick={() => updateStatus(review.id, 'approved')}
                                            disabled={updating === review.id}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            {language === 'ar' ? 'قبول' : 'Approve'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="flex-1"
                                            onClick={() => updateStatus(review.id, 'rejected')}
                                            disabled={updating === review.id}
                                        >
                                            <XCircle className="w-4 h-4 mr-1" />
                                            {language === 'ar' ? 'رفض' : 'Reject'}
                                        </Button>
                                    </>
                                )}

                                {filter === 'approved' && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => updateStatus(review.id, 'rejected')}
                                        disabled={updating === review.id}
                                    >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        {language === 'ar' ? 'إلغاء وتخفية' : 'Hide / Reject'}
                                    </Button>
                                )}

                                {filter === 'rejected' && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => updateStatus(review.id, 'approved')}
                                        disabled={updating === review.id}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                                        {language === 'ar' ? 'إعادة قبول' : 'Restore / Approve'}
                                    </Button>
                                )}

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive px-2"
                                    onClick={() => deleteReview(review.id)}
                                    disabled={updating === review.id}
                                    title={language === 'ar' ? 'حذف نهائياً' : 'Delete permanently'}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                    }
                </div >
            )}
        </div >
    );
}

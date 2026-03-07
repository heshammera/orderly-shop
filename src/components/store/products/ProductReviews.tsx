"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare, Loader2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface ProductReviewsProps {
    storeSlug: string;
    productId: string;
    productName?: string;
}

interface Review {
    id: string;
    customer_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export function ProductReviews({ storeSlug, productId, productName }: ProductReviewsProps) {
    const { language, dir } = useLanguage();
    const { toast } = useToast();

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(5);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [comment, setComment] = useState('');

    const fetchReviews = async () => {
        try {
            const res = await fetch(`/api/store/${storeSlug}/products/${productId}/reviews`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data.reviews || []);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [productId, storeSlug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast({
                title: language === 'ar' ? 'مطلوب' : 'Required',
                description: language === 'ar' ? 'الرجاء إدخال اسمك أولاً' : 'Please enter your name first',
                variant: 'destructive',
            });
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/store/${storeSlug}/products/${productId}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rating,
                    comment,
                    customer_name: name,
                    customer_phone: phone, // Optional for tracking but nice to have
                })
            });

            if (res.ok) {
                toast({
                    title: language === 'ar' ? 'تم الإرسال بنجاح' : 'Submitted successfully',
                    description: language === 'ar'
                        ? 'شكراً لتقييمك! سيظهر التقييم بعد مراجعته من قبل إدارة المتجر.'
                        : 'Thank you for your rating! It will appear after review by the store.',
                });

                // Reset form
                setShowForm(false);
                setRating(5);
                setComment('');
            } else {
                throw new Error('Failed to submit review');
            }
        } catch (error) {
            console.error('Submit review error:', error);
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: language === 'ar' ? 'حدث خطأ أثناء إرسال التقييم' : 'Failed to submit review',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, current) => acc + current.rating, 0) / reviews.length).toFixed(1)
        : 0;

    return (
        <div className="mt-12 border-t pt-10" dir={dir}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-primary" />
                        {language === 'ar' ? 'تقييمات المتسوقين' : 'Customer Reviews'}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={cn(
                                        "w-5 h-5",
                                        star <= Number(averageRating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                                    )}
                                />
                            ))}
                        </div>
                        <span className="font-semibold">{averageRating} من 5</span>
                        <span className="text-muted-foreground text-sm">
                            ({reviews.length} {language === 'ar' ? 'تقييم' : 'review'})
                        </span>
                    </div>
                </div>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)} className="rounded-full">
                        {language === 'ar' ? 'أضف تقييمك' : 'Write a Review'}
                    </Button>
                )}
            </div>

            {showForm && (
                <div className="bg-muted/30 border rounded-xl p-6 md:p-8 mb-10 max-w-2xl">
                    <h4 className="font-semibold text-lg mb-4">
                        {language === 'ar' ? 'مشاركة تجربتك معنا' : 'Share your experience'}
                    </h4>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">
                                {language === 'ar' ? 'التقييم العام' : 'Overall Rating'} *
                            </label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(rating)}
                                        className="p-1 transition-all focus:outline-none"
                                    >
                                        <Star
                                            className={cn(
                                                "w-8 h-8 transition-all hover:scale-110",
                                                star <= hoverRating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                                            )}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {language === 'ar' ? 'الاسم' : 'Name'} *
                                </label>
                                <Input
                                    placeholder={language === 'ar' ? 'الاسم الكريم...' : 'Your name...'}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                        {language === 'ar' ? 'اختياري' : 'Optional'}
                                    </span>
                                </label>
                                <Input
                                    placeholder={language === 'ar' ? 'للتأكيد فقط...' : 'For verification...'}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="bg-background text-left"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {language === 'ar' ? 'رأيك' : 'Review Note'}
                            </label>
                            <Textarea
                                placeholder={language === 'ar' ? 'كيف كانت تجربتك مع هذا المنتج؟' : 'How was your experience with this product?'}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={4}
                                className="bg-background resize-none"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="submit" disabled={submitting} className="min-w-[120px]">
                                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {language === 'ar' ? 'إرسال التقييم' : 'Submit Review'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={submitting}>
                                {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-12 px-4 border rounded-xl border-dashed bg-card/50">
                    <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                        {language === 'ar'
                            ? 'لا توجد تقييمات لهذا المنتج حتى الآن. كن أول من يقيّم!'
                            : 'No reviews for this product yet. Be the first to review!'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                    {reviews.map((review) => (
                        <div key={review.id} className="p-5 border rounded-xl bg-card hover:border-primary/20 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-semibold text-sm">{review.customer_name}</span>
                                    </div>
                                    <div className="flex gap-0.5">
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
                                <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: language === 'ar' ? ar : enUS })}
                                </span>
                            </div>
                            {review.comment && (
                                <p className="text-sm text-foreground/80 mt-3 leading-relaxed">
                                    {review.comment}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

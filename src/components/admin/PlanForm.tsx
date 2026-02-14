"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

const planSchema = z.object({
    slug: z.string().min(2, "Slug is required"),
    name_ar: z.string().min(2, "Arabic Name is required"),
    name_en: z.string().min(2, "English Name is required"),
    description_ar: z.string().optional(),
    description_en: z.string().optional(),
    price_monthly: z.coerce.number().min(0),
    price_yearly: z.coerce.number().min(0),
    products_limit: z.coerce.number().default(0),
    orders_limit: z.coerce.number().default(0),
    stores_limit: z.coerce.number().default(1),
    is_active: z.boolean().default(true),
    display_features_ar: z.string().optional(),
    display_features_en: z.string().optional(),
});

type PlanFormValues = z.infer<typeof planSchema>;

interface PlanFormProps {
    defaultValues?: PlanFormValues;
    onSubmit: (data: PlanFormValues) => Promise<void>;
    isSubmitting?: boolean;
}

export function PlanForm({ defaultValues, onSubmit, isSubmitting }: PlanFormProps) {
    const { language } = useLanguage();

    const form = useForm<PlanFormValues>({
        resolver: zodResolver(planSchema),
        defaultValues: defaultValues || {
            slug: '',
            name_ar: '',
            name_en: '',
            description_ar: '',
            description_en: '',
            price_monthly: 0,
            price_yearly: 0,
            products_limit: 50,
            orders_limit: 100,
            stores_limit: 1,
            is_active: true,
            display_features_ar: '',
            display_features_en: '',
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Slug (Unique ID)</FormLabel>
                                <FormControl>
                                    <Input placeholder="basic, pro..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-auto">
                                <div className="space-y-0.5">
                                    <FormLabel>Active Status</FormLabel>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="name_en"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name (English)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Basic Plan" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="name_ar"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name (Arabic)</FormLabel>
                                <FormControl>
                                    <Input placeholder="الباقة الأساسية" className="text-right" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="price_monthly"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monthly Price ($)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="price_yearly"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Yearly Price ($)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="products_limit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Products Limit (-1 for unlimited)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="orders_limit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monthly Orders Limit (-1 for unlimited)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="stores_limit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Stores Limit</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="description_en"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description (English)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Short description..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description_ar"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description (Arabic)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="وصف قصير..." className="text-right" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="display_features_en"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Display Features (English, comma separated)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Unlimited products, 24/7 support..." {...field} />
                                </FormControl>
                                <FormDescription>Separate multiple features with a comma.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="display_features_ar"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Display Features (Arabic, comma separated)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="منتجات غير محدودة، دعم فني..." className="text-right" {...field} />
                                </FormControl>
                                <FormDescription className="text-right">افصل بين المميزات بفاصلة (,).</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </Button>
            </form>
        </Form>
    );
}

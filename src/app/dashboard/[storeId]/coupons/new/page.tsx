"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function NewCouponPage({ params }: { params: { storeId: string } }) {
    const { storeId } = params;
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage', // percentage | fixed
        discount_value: '',
        min_order_amount: '',
        usage_limit: '',
        expires_at: '',
        is_active: true
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validation
            if (!formData.code || !formData.discount_value) {
                toast.error('Please fill in all required fields');
                setLoading(false);
                return;
            }

            const { error } = await supabase
                .from('coupons')
                .insert({
                    store_id: storeId,
                    code: formData.code.toUpperCase(),
                    discount_type: formData.discount_type,
                    discount_value: Number(formData.discount_value),
                    min_order_amount: formData.min_order_amount ? Number(formData.min_order_amount) : 0,
                    usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
                    expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
                    is_active: formData.is_active
                });

            if (error) {
                if (error.code === '23505') { // Unique violation
                    toast.error('Coupon code already exists');
                } else {
                    toast.error('Failed to create coupon');
                    console.error(error);
                }
            } else {
                toast.success('Coupon created successfully');
                router.push(`/dashboard/${storeId}/coupons`);
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/${storeId}/coupons`}>
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Create New Coupon</h2>
                    <p className="text-muted-foreground">Add a new discount code for your customers.</p>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Coupon Details</CardTitle>
                        <CardDescription>Configure the discount and limitations.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div className="space-y-2">
                            <Label htmlFor="code">Coupon Code</Label>
                            <Input
                                id="code"
                                placeholder="e.g. SUMMER2024"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                className="font-mono uppercase placeholder:normal-case"
                                required
                            />
                            <p className="text-xs text-muted-foreground">The code customers will enter at checkout.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Discount Type</Label>
                                <Select
                                    value={formData.discount_type}
                                    onValueChange={(val) => setFormData({ ...formData, discount_type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="value">Discount Value</Label>
                                <div className="relative">
                                    <Input
                                        id="value"
                                        type="number"
                                        placeholder="0"
                                        min="0"
                                        value={formData.discount_value}
                                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                        className="pr-8"
                                        required
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                                        {formData.discount_type === 'percentage' ? '%' : '$'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="min_order">Min. Order Amount (Optional)</Label>
                                <Input
                                    id="min_order"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={formData.min_order_amount}
                                    onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="usage_limit">Usage Limit (Optional)</Label>
                                <Input
                                    id="usage_limit"
                                    type="number"
                                    min="1"
                                    placeholder="Total times usable"
                                    value={formData.usage_limit}
                                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expiry">Expiry Date (Optional)</Label>
                            <Input
                                id="expiry"
                                type="datetime-local"
                                value={formData.expires_at}
                                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center space-x-2 rounded-lg border p-4">
                            <Switch
                                id="active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                            <Label htmlFor="active" className="flex-1 cursor-pointer">
                                Active Status
                                <p className="font-normal text-xs text-muted-foreground">Enable or disable this coupon immediately.</p>
                            </Label>
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="ml-auto" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Coupon
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

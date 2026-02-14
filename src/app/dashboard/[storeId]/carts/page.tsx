"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart, User, RefreshCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AbandonedCartsPage({ params }: { params: { storeId: string } }) {
    const { storeId } = params;
    const { language } = useLanguage();
    const [carts, setCarts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchCarts = async () => {
        setLoading(true);
        // Fetch active carts that haven't been updated in 1 hour (mock abandoned definition)
        // For MVP, just showing all active carts with items
        const { data, error } = await supabase
            .from('carts')
            .select(`
                id, 
                status, 
                created_at, 
                updated_at, 
                session_id,
                customer:customers(name, email, phone),
                items:cart_items(
                    quantity,
                    unit_price_at_addition,
                    product:products(name)
                )
            `)
            .eq('store_id', storeId)
            .eq('status', 'active')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching carts:', error);
        } else {
            // Filter carts that actually have items
            const activeCarts = (data || []).filter((cart: any) => cart.items && cart.items.length > 0);
            setCarts(activeCarts);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCarts();
    }, [storeId]);

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {language === 'ar' ? 'السلات المتروكة' : 'Carts'}
                    </h2>
                    <p className="text-muted-foreground">
                        {language === 'ar' ? 'عرض السلات النشطة والمتروكة في الوقت الفعلي' : 'View active and abandoned carts in real-time.'}
                    </p>
                </div>
                <Button variant="outline" onClick={fetchCarts}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'تحديث' : 'Refresh'}
                </Button>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Last Active</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {carts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No active carts found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            carts.map((cart) => {
                                const totalValue = cart.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price_at_addition), 0);
                                const itemCount = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
                                const customerName = cart.customer?.name || 'Guest';

                                return (
                                    <TableRow key={cart.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium flex items-center gap-2">
                                                    {cart.customer ? <User className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3 text-muted-foreground" />}
                                                    {customerName}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                    {cart.customer?.email || cart.customer?.phone || `Session: ${cart.session_id?.slice(0, 8)}...`}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {itemCount} items
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {cart.items.slice(0, 2).map((i: any) => {
                                                    const pName = typeof i.product.name === 'string' ? JSON.parse(i.product.name).en : i.product.name.en;
                                                    return <div key={i.product?.name}>{i.quantity}x {pName}</div>
                                                })}
                                                {cart.items.length > 2 && <div>+{cart.items.length - 2} more</div>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(totalValue)}
                                        </TableCell>
                                        <TableCell>
                                            {formatDistanceToNow(new Date(cart.updated_at), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {cart.customer && (
                                                <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                    Recover
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

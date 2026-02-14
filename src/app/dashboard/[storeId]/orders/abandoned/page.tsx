"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Mail, RefreshCw, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Cart {
    id: string;
    customer_id?: string;
    session_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    store_id: string;
    customers?: {
        name: string;
        email: string;
        phone: string;
    };
    cart_items: {
        id: string;
        quantity: number;
        unit_price_at_addition: number;
        product_id: string;
        products?: {
            name: any;
        }
    }[];
}

export default function AbandonedCartsPage({ params }: { params: { storeId: string } }) {
    const { storeId } = params;
    const supabase = createClient();
    const [carts, setCarts] = useState<Cart[]>([]);
    const [loading, setLoading] = useState(true);
    const [recoveringId, setRecoveringId] = useState<string | null>(null);

    useEffect(() => {
        fetchAbandonedCarts();
    }, [storeId]);

    const fetchAbandonedCarts = async () => {
        setLoading(true);
        // Fetch carts that are 'abandoned' OR 'active' but older than 1 hour (mock abandoned logic)
        // Since we can't easily do complex OR logic with foreign tables in one go without a view,
        // we'll fetch 'active' and 'abandoned' and filter client side for MVP.
        const { data, error } = await supabase
            .from("carts")
            .select(`
                *,
                customers (name, email, phone),
                cart_items (
                    id,
                    quantity,
                    unit_price_at_addition,
                    product_id,
                    products (name)
                )
            `)
            .eq("store_id", storeId)
            .in("status", ["active", "abandoned"])
            .order("updated_at", { ascending: false })
            .limit(50);

        if (error) {
            console.error("Error fetching carts:", error);
            toast.error("Failed to fetch abandoned carts");
        } else {
            // Filter locally: Active carts must be > 1 hour old to be considered "abandoned" candidate
            // Or just show all active carts as "Live Carts"?
            // User requested "Abandoned".
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

            const abandoned = (data || []).filter((cart: any) => {
                if (cart.status === 'abandoned') return true;
                const updated = new Date(cart.updated_at);
                // Return true if it hasn't been updated in 1 hour
                return updated < oneHourAgo && cart.cart_items?.length > 0;
            });

            setCarts(abandoned);
        }
        setLoading(false);
    };

    const handleRecover = async (cart: Cart) => {
        if (!cart.customers?.email) {
            toast.error("No email available for this customer");
            return;
        }

        setRecoveringId(cart.id);

        // Mock sending recovery email
        await new Promise(resolve => setTimeout(resolve, 1500));

        // In a real app, we'd call an API route: /api/marketing/recover-cart

        toast.success(`Recovery email sent to ${cart.customers.email}`);
        setRecoveringId(null);
    };

    const calculateTotal = (items: Cart['cart_items']) => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unit_price_at_addition), 0);
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Abandoned Carts</h1>
                <p className="text-muted-foreground">Recover lost sales by reaching out to customers.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        Abandoned Checkouts
                    </CardTitle>
                    <CardDescription>
                        Carts with items that haven't been updated in over 1 hour.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Cart Value</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Active</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {carts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No abandoned carts found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                carts.map((cart) => {
                                    const total = calculateTotal(cart.cart_items);
                                    return (
                                        <TableRow key={cart.id}>
                                            <TableCell>
                                                {cart.customers ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{cart.customers.name}</span>
                                                        <span className="text-xs text-muted-foreground">{cart.customers.email}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground italic">Guest ({cart.session_id.slice(0, 8)}...)</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR' }).format(total)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{cart.cart_items.length} items</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={cart.status === 'abandoned' ? 'destructive' : 'secondary'}>
                                                    {cart.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDistanceToNow(new Date(cart.updated_at), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    onClick={() => handleRecover(cart)}
                                                    disabled={recoveringId === cart.id || !cart.customers?.email}
                                                >
                                                    {recoveringId === cart.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Mail className="w-4 h-4 mr-2" /> Recover
                                                        </>
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

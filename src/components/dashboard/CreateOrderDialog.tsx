"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Minus, Search, Trash, User, Package, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CreateOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    storeId: string;
    onOrderCreated: () => void;
}

export function CreateOrderDialog({ open, onOpenChange, storeId, onOrderCreated }: CreateOrderDialogProps) {
    const supabase = createClient();
    const { language } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [storeCurrency, setStoreCurrency] = useState('SAR');

    // Customer State
    const [customerSearch, setCustomerSearch] = useState('');
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', email: '', address: '' });

    // Product State
    const [openCombobox, setOpenCombobox] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [cartItems, setCartItems] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            // Reset state
            setCartItems([]);
            setSelectedCustomer(null);
            setIsNewCustomer(false);
            setNewCustomerData({ name: '', phone: '', email: '', address: '' });
            setCustomerSearch('');

            // Fetch Store Currency
            const fetchStoreSettings = async () => {
                const { data } = await supabase
                    .from('stores')
                    .select('currency')
                    .eq('id', storeId)
                    .single();
                if (data?.currency) setStoreCurrency(data.currency);
            };
            fetchStoreSettings();

            // Fetch Products (Initial load)
            fetchProducts();
        }
    }, [open, storeId]);

    const fetchProducts = async () => {
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false })
            .limit(100); // Fetch more products for client-side filtering
        setProducts(data || []);
    };

    // Customer Search
    useEffect(() => {
        const searchCustomers = async () => {
            if (customerSearch.length < 2) return;
            const { data } = await supabase
                .from('customers')
                .select('*')
                .eq('store_id', storeId)
                .or(`name.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%`)
                .limit(5);
            setCustomers(data || []);
        };
        const timer = setTimeout(searchCustomers, 300);
        return () => clearTimeout(timer);
    }, [customerSearch, storeId]);

    const handleAddProduct = (product: any) => {
        const existing = cartItems.find(item => item.id === product.id);
        if (existing) {
            setCartItems(cartItems.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCartItems([...cartItems, { ...product, quantity: 1 }]);
        }
        setOpenCombobox(false);
    };

    const updateQuantity = (id: string, delta: number) => {
        setCartItems(cartItems.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeProduct = (id: string) => {
        setCartItems(cartItems.filter(item => item.id !== id));
    };

    const calculateTotal = () => {
        return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handleCreateOrder = async () => {
        if (!selectedCustomer && !isNewCustomer) {
            toast.error(language === 'ar' ? 'الرجاء اختيار عميل' : 'Please select a customer');
            return;
        }
        if (cartItems.length === 0) {
            toast.error(language === 'ar' ? 'الرجاء إضافة منتجات' : 'Please add products');
            return;
        }

        setLoading(true);
        try {
            let customerId = selectedCustomer?.id;
            let customerSnapshot = selectedCustomer;

            // Create new customer if needed
            if (isNewCustomer) {
                const { data: newCustomer, error: customerError } = await supabase
                    .from('customers')
                    .insert({
                        store_id: storeId,
                        ...newCustomerData
                    })
                    .select()
                    .single();

                if (customerError) throw customerError;
                customerId = newCustomer.id;
                customerSnapshot = newCustomer;
            }

            // Create Order
            const total = calculateTotal();
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    store_id: storeId,
                    customer_id: customerId,
                    customer_snapshot: customerSnapshot,
                    total: total,
                    status: 'pending',
                    currency: storeCurrency,
                    order_number: `ORD-${Date.now().toString().slice(-6)}`
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // Create Order Items
            const orderItems = cartItems.map(item => ({
                order_id: order.id,
                product_id: item.id,
                product_snapshot: item,
                quantity: item.quantity,
                unit_price: item.price,
                total_price: item.price * item.quantity
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            toast.success(language === 'ar' ? 'تم إنشاء الطلب بنجاح' : 'Order created successfully');
            onOrderCreated();
            onOpenChange(false);

        } catch (error: any) {
            console.error('Create order error:', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const getProductName = (product: any) => {
        if (product.name && typeof product.name === 'object') {
            return product.name.ar || product.name.en || 'Product';
        }
        try {
            const parsed = JSON.parse(product.name);
            return parsed.ar || parsed.en || product.name;
        } catch {
            return product.name;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>{language === 'ar' ? 'إنشاء طلب جديد' : 'Create New Order'}</DialogTitle>
                    <DialogDescription>
                        {language === 'ar' ? 'أدخل تفاصيل العميل والمنتجات لإنشاء طلب يدوي.' : 'Enter customer and product details to manually create an order.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Customer & Products Selection */}
                    <div className="flex-1 p-6 pt-2 overflow-y-auto border-r space-y-6">

                        {/* Customer Section */}
                        <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                            <h3 className="font-semibold flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {language === 'ar' ? 'بيانات العميل' : 'Customer Details'}
                            </h3>

                            {!isNewCustomer && !selectedCustomer && (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder={language === 'ar' ? 'بحث عن عميل...' : 'Search customers...'}
                                            value={customerSearch}
                                            onChange={(e) => setCustomerSearch(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    {customers.length > 0 && (
                                        <div className="border rounded-md bg-background shadow-sm max-h-[200px] overflow-y-auto">
                                            {customers.map(c => (
                                                <div
                                                    key={c.id}
                                                    className="p-2 hover:bg-muted cursor-pointer flex justify-between items-center border-b last:border-0"
                                                    onClick={() => setSelectedCustomer(c)}
                                                >
                                                    <div>
                                                        <p className="font-medium text-sm">{c.name}</p>
                                                        <p className="text-xs text-muted-foreground">{c.phone}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Button variant="outline" size="sm" onClick={() => setIsNewCustomer(true)} className="w-full">
                                        {language === 'ar' ? 'إضافة عميل جديد' : 'Add New Customer'}
                                    </Button>
                                </div>
                            )}

                            {selectedCustomer && (
                                <div className="bg-background p-3 rounded border flex justify-between items-center transition-all animate-in fade-in">
                                    <div>
                                        <p className="font-bold">{selectedCustomer.name}</p>
                                        <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                            {typeof selectedCustomer.address === 'string'
                                                ? selectedCustomer.address
                                                : (selectedCustomer.address?.full_address || selectedCustomer.address?.city || 'No address')}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                                        {language === 'ar' ? 'تغيير' : 'Change'}
                                    </Button>
                                </div>
                            )}

                            {isNewCustomer && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <Input
                                        placeholder={language === 'ar' ? 'اسم العميل' : 'Customer Name'}
                                        value={newCustomerData.name}
                                        onChange={e => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                                    />
                                    <Input
                                        placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                                        value={newCustomerData.phone}
                                        onChange={e => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                                    />
                                    <Input
                                        placeholder={language === 'ar' ? 'العنوان' : 'Address'}
                                        value={newCustomerData.address}
                                        onChange={e => setNewCustomerData({ ...newCustomerData, address: e.target.value })}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setIsNewCustomer(false)}>
                                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Product Selection (Combobox) */}
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                {language === 'ar' ? 'إضافة منتجات' : 'Add Products'}
                            </h3>

                            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openCombobox}
                                        className="w-full justify-between"
                                    >
                                        {language === 'ar' ? 'اختر منتج...' : 'Select product...'}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder={language === 'ar' ? 'بحث عن منتج...' : 'Search product...'} />
                                        <CommandList>
                                            <CommandEmpty>{language === 'ar' ? 'لا توجد منتجات.' : 'No products found.'}</CommandEmpty>
                                            <CommandGroup>
                                                {products.map((product) => {
                                                    const name = getProductName(product);
                                                    return (
                                                        <CommandItem
                                                            key={product.id}
                                                            value={name + ' ' + product.id} // Ensure uniqueness and searchability
                                                            onSelect={() => handleAddProduct(product)}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    cartItems.some(item => item.id === product.id) ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            <div className="flex items-center gap-3">
                                                                {product.images?.[0] && (
                                                                    <img src={product.images[0]} className="w-8 h-8 rounded object-cover" />
                                                                )}
                                                                <div className="flex flex-col">
                                                                    <span>{name}</span>
                                                                    <span className="text-xs text-muted-foreground">{product.price} {storeCurrency}</span>
                                                                </div>
                                                            </div>
                                                        </CommandItem>
                                                    );
                                                })}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                    </div>

                    {/* Right: Cart Summary */}
                    <div className="w-[350px] bg-muted/10 p-6 flex flex-col border-l">
                        <h3 className="font-semibold mb-4">{language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</h3>

                        <ScrollArea className="flex-1 -mx-2 px-2">
                            <div className="space-y-3">
                                {cartItems.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground text-sm">
                                        {language === 'ar' ? 'السلة فارغة' : 'Empty Cart'}
                                    </div>
                                ) : (
                                    cartItems.map(item => {
                                        const nameStr = getProductName(item);

                                        return (
                                            <div key={item.id} className="bg-background p-3 rounded border text-sm animate-in zoom-in-95">
                                                <div className="flex justify-between mb-2">
                                                    <span className="font-medium truncate flex-1">{nameStr}</span>
                                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeProduct(item.id)}>
                                                        <Trash className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2 border rounded px-1">
                                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => updateQuantity(item.id, -1)}>
                                                            <Minus className="w-3 h-3" />
                                                        </Button>
                                                        <span className="w-4 text-center">{item.quantity}</span>
                                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => updateQuantity(item.id, 1)}>
                                                            <Plus className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                    <span className="font-semibold">{(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>

                        <div className="mt-4 pt-4 border-t space-y-4">
                            <div className="flex justify-between items-center text-lg font-bold">
                                <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                                <span>{calculateTotal().toFixed(2)} {storeCurrency}</span>
                            </div>
                            <Button className="w-full" size="lg" onClick={handleCreateOrder} disabled={loading || cartItems.length === 0}>
                                {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                {language === 'ar' ? 'تأكيد الطلب' : 'Confirm Order'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

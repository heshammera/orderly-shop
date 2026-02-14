import { useState } from "react"
import { format } from "date-fns"
import * as XLSX from 'xlsx'
import { Calendar as CalendarIcon, Download, Loader2, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface ExportOrdersDialogProps {
    storeId: string;
    isLocked: boolean;
}

export function ExportOrdersDialog({ storeId, isLocked }: ExportOrdersDialogProps) {
    const { language } = useLanguage()
    const [open, setOpen] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [date, setDate] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    })

    const [selectedProducts, setSelectedProducts] = useState<string[]>([])
    const [products, setProducts] = useState<{ id: string; name: string }[]>([])
    const [productsLoading, setProductsLoading] = useState(false)
    const [openCombobox, setOpenCombobox] = useState(false)

    const fetchProducts = async () => {
        setProductsLoading(true)
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, name')
                .eq('store_id', storeId)

            if (error) throw error

            const formattedProducts = data.map(p => {
                let name = p.name;
                if (typeof p.name !== 'string') {
                    // Handle JSON name
                    const nameObj = p.name as any;
                    name = nameObj[language] || nameObj.en || nameObj.ar || 'Unknown';
                } else {
                    try {
                        const parsed = JSON.parse(p.name);
                        name = parsed[language] || parsed.en || parsed.ar || p.name;
                    } catch {
                        // Keep as string
                    }
                }
                return { id: p.id, name: name as string };
            })

            setProducts(formattedProducts)
        } catch (error) {
            console.error('Error fetching products:', error)
            toast.error(language === 'ar' ? 'حدث خطأ أثناء جلب المنتجات' : 'Error fetching products')
        } finally {
            setProductsLoading(false)
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (newOpen && products.length === 0) {
            fetchProducts();
        }
    }

    const handleExport = async () => {
        setIsExporting(true)
        try {
            let query = supabase
                .from('orders')
                .select(`
                *,
                order_items (
                    product_id,
                    quantity,
                    unit_price,
                    total_price,
                    products (name)
                )
            `)
                .eq('store_id', storeId)
                .order('created_at', { ascending: false });

            if (date.from) {
                query = query.gte('created_at', date.from.toISOString());
            }
            if (date.to) {
                // Set to end of day
                const endDate = new Date(date.to);
                endDate.setHours(23, 59, 59, 999);
                query = query.lte('created_at', endDate.toISOString());
            }

            const { data: orders, error } = await query;

            if (error) throw error;

            // Filter by selected products if any
            let filteredOrders = orders;
            if (selectedProducts.length > 0) {
                filteredOrders = orders.filter(order =>
                    order.order_items.some((item: any) => selectedProducts.includes(item.product_id))
                );
            }

            if (filteredOrders.length === 0) {
                toast.warning(language === 'ar' ? 'لا توجد طلبات تصدير' : 'No orders to export');
                setIsExporting(false);
                return;
            }

            // Prepare data for Excel
            const dataToExport = filteredOrders.map((order: any) => {
                const customer = order.customer_snapshot || {};
                const address = order.shipping_address || {};

                // Format products list
                const productsList = order.order_items.map((item: any) => {
                    let pName = "Unknown";
                    if (item.products?.name) { // Check if product data exists
                        if (typeof item.products.name === 'object') {
                            pName = item.products.name[language] || item.products.name.en || item.products.name.ar;
                        } else {
                            try {
                                const parsed = JSON.parse(item.products.name);
                                pName = parsed[language] || parsed.en || parsed.ar || item.products.name;
                            } catch {
                                pName = item.products.name;
                            }
                        }
                    }
                    return `${pName} (x${item.quantity}) - ${item.total_price} ${order.currency}`;
                }).join('\n');

                return {
                    [language === 'ar' ? 'رقم الطلب' : 'Order Number']: order.order_number,
                    [language === 'ar' ? 'تاريخ الطلب' : 'Order Date']: new Date(order.created_at).toLocaleString(),
                    [language === 'ar' ? 'الحالة' : 'Status']: order.status,

                    // Customer Info
                    [language === 'ar' ? 'اسم العميل' : 'Customer Name']: customer.name || 'N/A',
                    [language === 'ar' ? 'رقم الهاتف' : 'Phone']: customer.phone || 'N/A',
                    [language === 'ar' ? 'البريد الإلكتروني' : 'Email']: customer.email || 'N/A',

                    // Shipping Address
                    [language === 'ar' ? 'الدولة' : 'Country']: address.country || 'N/A',
                    [language === 'ar' ? 'المدينة' : 'City']: address.city || 'N/A',
                    [language === 'ar' ? 'المنطقة/المحافظة' : 'State/Province']: address.state || 'N/A',
                    [language === 'ar' ? 'العنوان' : 'Street Address']: address.street || 'N/A',
                    [language === 'ar' ? 'الرمز البريدي' : 'Postal Code']: address.postal_code || 'N/A',

                    // Financials
                    [language === 'ar' ? 'العملة' : 'Currency']: order.currency,
                    [language === 'ar' ? 'المجموع الفرعي' : 'Subtotal']: order.subtotal,
                    [language === 'ar' ? 'تكلفة الشحن' : 'Shipping Cost']: order.shipping_cost,
                    [language === 'ar' ? 'الخصم' : 'Discount']: order.discount,
                    [language === 'ar' ? 'الإجمالي' : 'Total']: order.total,

                    // Products
                    [language === 'ar' ? 'المنتجات' : 'Products']: productsList,

                    // Notes
                    [language === 'ar' ? 'ملاحظات' : 'Notes']: order.notes || '',
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
            XLSX.writeFile(workbook, `Orders_Export_${new Date().toISOString().split('T')[0]}.xlsx`);

            toast.success(language === 'ar' ? 'تم التصدير بنجاح' : 'Exported successfully');
            setOpen(false);

        } catch (error) {
            console.error('Export error:', error);
            toast.error(language === 'ar' ? 'فشل التصدير' : 'Export failed');
        } finally {
            setIsExporting(false);
        }
    }

    const toggleProduct = (productId: string) => {
        setSelectedProducts(current =>
            current.includes(productId)
                ? current.filter(id => id !== productId)
                : [...current, productId]
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" disabled={isLocked}>
                    <Download className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'تصدير Excel' : 'Export Excel'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{language === 'ar' ? 'تصدير الطلبات' : 'Export Orders'}</DialogTitle>
                    <DialogDescription>
                        {language === 'ar'
                            ? 'قم بتحديد الفترة الزمنية والمنتجات لتصدير تقرير الطلبات.'
                            : 'Select date range and products to export orders report.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Date Range Picker (Simplified as two inputs for now or Shadcn Calendar) */}
                    <div className="space-y-2">
                        <Label>{language === 'ar' ? 'الفترة الزمنية' : 'Date Range'}</Label>
                        <div className="flex gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date.from && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date.from ? format(date.from, "PPP") : <span>{language === 'ar' ? 'من' : 'From'}</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date.from}
                                        onSelect={(d) => setDate(prev => ({ ...prev, from: d }))}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date.to && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date.to ? format(date.to, "PPP") : <span>{language === 'ar' ? 'إلى' : 'To'}</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date.to}
                                        onSelect={(d) => setDate(prev => ({ ...prev, to: d }))}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Product Selector */}
                    <div className="space-y-2">
                        <Label>{language === 'ar' ? 'المنتجات' : 'Products'}</Label>
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCombobox}
                                    className="w-full justify-between"
                                    disabled={productsLoading}
                                >
                                    {selectedProducts.length === 0
                                        ? (language === 'ar' ? 'كل المنتجات (الافتراضي)' : 'All Products (Default)')
                                        : (language === 'ar' ? `${selectedProducts.length} منتجات محددة` : `${selectedProducts.length} products selected`)}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                                <Command>
                                    <CommandInput placeholder={language === 'ar' ? 'بحث عن منتج...' : 'Search product...'} />
                                    <CommandList>
                                        <CommandEmpty>{language === 'ar' ? 'لا توجد نتائج.' : 'No results found.'}</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                onSelect={() => setSelectedProducts([])}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedProducts.length === 0 ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {language === 'ar' ? 'كل المنتجات' : 'All Products'}
                                            </CommandItem>
                                            {products.map((product) => (
                                                <CommandItem
                                                    key={product.id}
                                                    value={product.name} // Used for filtering
                                                    onSelect={() => toggleProduct(product.id)}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedProducts.includes(product.id) ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {product.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {selectedProducts.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedProducts.map(id => {
                                    const product = products.find(p => p.id === id);
                                    return product ? (
                                        <Badge key={id} variant="secondary" className="cursor-pointer" onClick={() => toggleProduct(id)}>
                                            {product.name} X
                                        </Badge>
                                    ) : null;
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleExport} disabled={isExporting}>
                        {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {language === 'ar' ? 'تصدير' : 'Export'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

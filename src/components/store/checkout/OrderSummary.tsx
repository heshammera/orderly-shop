
import { useCheckout } from '@/contexts/CheckoutContext';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComponentSchema } from '@/lib/store-builder/types';

interface OrderSummaryProps extends ComponentSchema { }

export function OrderSummary({ data }: { data: ComponentSchema }) {
    const { settings, content } = data;
    const { language } = useLanguage();
    const { cart } = useCart();

    const {
        couponCode, setCouponCode,
        appliedCoupon, handleApplyCoupon, removeCoupon,
        subtotal, shippingCost, discount, total,
        loading, store,
        customerPoints, redeemPoints, setRedeemPoints, pointsDiscount, pointsToRedeem,
        handlePlaceOrder
    } = useCheckout();

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
            style: 'currency',
            currency: store.currency,
        }).format(price);
    };

    const title = typeof content.title === 'string' ? content.title : (content.title?.[language] || 'Order Summary');

    return (
        <Card className={cn("w-full", settings.sticky && "sticky top-24")}>
            <CardHeader className={settings.backgroundColor ? `bg-${settings.backgroundColor}` : ''}>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                {/* Cart Items */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {cart.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-1 border-b border-dashed last:border-0">
                            <div className="flex flex-col">
                                <span className="font-medium">
                                    {item.quantity}x {typeof item.productName === 'string' ? item.productName : (item.productName[language] || item.productName.ar)}
                                </span>
                                {item.variants.length > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                        {item.variants.map(v =>
                                            typeof v.optionLabel === 'string' ? v.optionLabel : (v.optionLabel[language] || v.optionLabel.ar)
                                        ).join(', ')}
                                    </span>
                                )}
                            </div>
                            <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                        </div>
                    ))}
                </div>

                <Separator />

                {/* Coupon Section */}
                <div className="flex gap-2">
                    <Input
                        placeholder={language === 'ar' ? 'كود الكوبون' : 'Coupon Code'}
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        disabled={!!appliedCoupon || loading}
                    />
                    {appliedCoupon ? (
                        <Button variant="destructive" size="icon" onClick={removeCoupon} disabled={loading}>
                            <X className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleApplyCoupon} disabled={!couponCode || loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'ar' ? 'تطبيق' : 'Apply')}
                        </Button>
                    )}
                </div>
                {appliedCoupon && (
                    <div className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {language === 'ar' ? 'تم تطبيق الكوبون بنجاح' : 'Coupon applied successfully'}
                    </div>
                )}

                <Separator />

                {/* Loyalty Points Section */}
                {store.settings?.loyalty_program_enabled && customerPoints > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">{language === 'ar' ? 'نقاط الولاء' : 'Loyalty Points'}</Label>
                                <p className="text-xs text-muted-foreground">
                                    {language === 'ar'
                                        ? `لديك ${customerPoints} نقطة (قيمة ${formatPrice((customerPoints / (store.settings.loyalty_redemption_rate || 100)))})`
                                        : `You have ${customerPoints} points (Worth ${formatPrice((customerPoints / (store.settings.loyalty_redemption_rate || 100)))})`
                                    }
                                </p>
                            </div>
                            <Switch
                                checked={redeemPoints}
                                onCheckedChange={setRedeemPoints}
                            />
                        </div>

                        {redeemPoints && (
                            <div className="p-3 bg-purple-50 text-purple-700 rounded-md text-sm flex justify-between items-center">
                                <span>{language === 'ar' ? 'سيتم خصم' : 'Redeeming'} {pointsToRedeem} {language === 'ar' ? 'نقطة' : 'points'}</span>
                                <span className="font-bold">-{formatPrice(pointsDiscount)}</span>
                            </div>
                        )}
                    </div>
                )}

                {store.settings?.loyalty_program_enabled && customerPoints > 0 && <Separator />}

                {/* Totals */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{language === 'ar' ? 'المجموع' : 'Subtotal'}</span>
                        <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
                        <span className={shippingCost === 0 ? "text-green-600" : ""}>
                            {shippingCost === 0
                                ? (language === 'ar' ? 'مجاني' : 'Free')
                                : formatPrice(shippingCost)
                            }
                        </span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>{language === 'ar' ? 'الخصم (كوبون)' : 'Discount'}</span>
                            <span>-{formatPrice(discount)}</span>
                        </div>
                    )}
                    {redeemPoints && pointsDiscount > 0 && (
                        <div className="flex justify-between text-purple-600">
                            <span>{language === 'ar' ? 'خصم الولاء' : 'Loyalty Discount'}</span>
                            <span>-{formatPrice(pointsDiscount)}</span>
                        </div>
                    )}
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                    <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                </div>

                <Button
                    onClick={(e) => handlePlaceOrder(e)}
                    size="lg"
                    className="w-full text-lg h-12"
                    disabled={loading}
                >
                    {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                    {language === 'ar' ? 'تأكيد الطلب' : 'Place Order'}
                </Button>
            </CardContent>
        </Card>
    );
}

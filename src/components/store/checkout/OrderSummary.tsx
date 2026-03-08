
import { useCheckout } from '@/contexts/CheckoutContext';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, X, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComponentSchema } from '@/lib/store-builder/types';
import { ProductRecommendations } from './ProductRecommendations';
import { StockIndicator } from './StockIndicator';

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
        handlePlaceOrder, currentStep, setCurrentStep
    } = useCheckout();

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
            style: 'currency',
            currency: store.currency,
        }).format(price);
    };

    const title = typeof content.title === 'string' ? content.title : (content.title?.[language] || 'Order Summary');

    return (
        <Card className={cn("border-none shadow-lg overflow-hidden bg-white ring-1 ring-slate-200", settings.sticky && "sticky top-24")}>
            <CardHeader className="border-b bg-slate-50/50 py-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-primary rounded-full" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {/* Cart Items */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {cart.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                            {/* Product Image */}
                            <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border border-slate-100 shadow-sm">
                                {item.productImage ? (
                                    <img
                                        src={item.productImage}
                                        alt={typeof item.productName === 'string' ? item.productName : item.productName[language]}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                                        <div className="w-4 h-4 bg-slate-200 rounded-sm" />
                                    </div>
                                )}
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                                    {item.quantity}
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="flex-grow min-w-0">
                                <h4 className="text-sm font-semibold truncate leading-tight mb-1">
                                    {typeof item.productName === 'string' ? item.productName : (item.productName[language] || item.productName.ar)}
                                </h4>
                                {item.variants.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-1">
                                        {item.variants.map((v, vIdx) => (
                                            <span key={vIdx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                                {typeof v.optionLabel === 'string' ? v.optionLabel : (v.optionLabel[language] || v.optionLabel.ar)}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <StockIndicator stock={item.maxQuantity} threshold={10} />
                                <div className="text-sm font-bold text-slate-900 mt-1">
                                    {formatPrice(item.unitPrice * item.quantity)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <ProductRecommendations />

                <div className="space-y-6 bg-slate-50/50 -mx-6 p-6">
                    {/* Coupon Section */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {language === 'ar' ? 'كود الخصم' : 'Discount Code'}
                        </Label>
                        <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <Input
                                    placeholder={language === 'ar' ? 'أدخل الكود...' : 'Enter code...'}
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    disabled={!!appliedCoupon || loading}
                                    className="h-10 bg-white border-slate-200 focus:border-primary focus:ring-primary/10 transition-all uppercase placeholder:normal-case pr-10"
                                />
                                {appliedCoupon && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
                            </div>
                            {appliedCoupon ? (
                                <Button variant="outline" size="sm" onClick={removeCoupon} disabled={loading} className="h-10 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100">
                                    <X className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button onClick={handleApplyCoupon} size="sm" disabled={!couponCode || loading} className="h-10 px-6">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'ar' ? 'تطبيق' : 'Apply')}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Loyalty Points Section */}
                    {store.settings?.loyalty_program_enabled && customerPoints > 0 && (
                        <div className="space-y-3 border-t border-slate-100 pt-5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold text-slate-900">
                                        {language === 'ar' ? 'نقاط الولاء' : 'Loyalty Points'}
                                    </Label>
                                    <p className="text-[11px] text-slate-500">
                                        {language === 'ar'
                                            ? `لديك ${customerPoints} نقطة (قيمة ${formatPrice((customerPoints / (store.settings.loyalty_redemption_rate || 100)))})`
                                            : `You have ${customerPoints} points (Worth ${formatPrice((customerPoints / (store.settings.loyalty_redemption_rate || 100)))})`
                                        }
                                    </p>
                                </div>
                                <Switch
                                    checked={redeemPoints}
                                    onCheckedChange={setRedeemPoints}
                                    className="data-[state=checked]:bg-purple-600"
                                />
                            </div>

                            {redeemPoints && (
                                <div className="p-3 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium flex justify-between items-center border border-purple-100 animate-in fade-in slide-in-from-top-1">
                                    <span>{language === 'ar' ? 'سيتم خصم' : 'Redeeming'} {pointsToRedeem} {language === 'ar' ? 'نقطة' : 'points'}</span>
                                    <span className="font-bold">-{formatPrice(pointsDiscount)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Totals Section */}
                <div className="space-y-3 pt-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">{language === 'ar' ? 'المجموع' : 'Subtotal'}</span>
                        <span className="text-slate-900 font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
                        <span className={cn("font-medium", shippingCost === 0 ? "text-green-600" : "text-slate-900")}>
                            {shippingCost === 0
                                ? (language === 'ar' ? 'مجاني' : 'Free')
                                : formatPrice(shippingCost)
                            }
                        </span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600 font-medium bg-green-50/50 px-2 py-1 rounded -mx-2">
                            <span>{language === 'ar' ? 'الخصم (كوبون)' : 'Coupon Discount'}</span>
                            <span>-{formatPrice(discount)}</span>
                        </div>
                    )}
                    {redeemPoints && pointsDiscount > 0 && (
                        <div className="flex justify-between text-sm text-purple-600 font-medium bg-purple-50/50 px-2 py-1 rounded -mx-2">
                            <span>{language === 'ar' ? 'خصم الولاء' : 'Loyalty Discount'}</span>
                            <span>-{formatPrice(pointsDiscount)}</span>
                        </div>
                    )}

                    <Separator className="my-4" />

                    <div className="flex justify-between items-baseline pt-2 leading-none">
                        <span className="text-base font-bold text-slate-900">{language === 'ar' ? 'الإجمالي النهائي' : 'Order Total'}</span>
                        <span className="text-2xl font-black text-primary drop-shadow-sm">{formatPrice(total)}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center mt-2 italic">
                        {language === 'ar' ? '* السعر شامل ضريبة القيمة المضافة' : '* Price includes VAT where applicable'}
                    </p>
                </div>

                <div className="pt-4">
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            const form = document.getElementById('checkout-form') as HTMLFormElement;
                            if (form && !form.checkValidity()) {
                                form.reportValidity();
                                return;
                            }

                            if (currentStep < 3) {
                                setCurrentStep(currentStep + 1);
                            } else {
                                handlePlaceOrder(e);
                            }
                        }}
                        size="lg"
                        className="w-full text-lg h-14 font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <span>
                                    {currentStep < 3
                                        ? (language === 'ar' ? 'المتابعة' : 'Continue')
                                        : (content.buttonText || (language === 'ar' ? 'إتمام الشراء الآن' : 'Complete Purchase'))
                                    }
                                </span>
                                {currentStep < 3 ? <ArrowRight className="w-5 h-5 rtl:rotate-180" /> : <CheckCircle2 className="w-5 h-5" />}
                            </div>
                        )}
                    </Button>
                </div>

                {/* Secure Payment Badges */}
                <div className="flex justify-between items-center gap-3 pt-4 px-2 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                    <img src="/payment-methods/visa.svg" alt="Visa" className="h-8 w-auto" />
                    <img src="/payment-methods/mastercard.svg" alt="Mastercard" className="h-8 w-auto" />
                    <img src="/payment-methods/mada.svg" alt="Mada" className="h-8 w-auto" />
                    <img src="/payment-methods/cod.svg" alt="COD" className="h-8 w-auto" />
                </div>
            </CardContent>
        </Card>
    );
}

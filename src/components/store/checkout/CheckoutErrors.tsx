import { CheckoutErrors, focusCheckoutError } from '@/lib/checkout-validation';
export function CheckoutErrorSummary({errors, prefix = '', language = 'ar'}: {errors: CheckoutErrors; prefix?: string; language?: string}) {
 if (!Object.keys(errors).length) return null;
 return <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800"><p className="font-bold mb-2">{language === 'ar' ? 'تعذر إرسال الطلب. صحّح البيانات التالية:' : 'Please correct the following before placing your order:'}</p><ul className="space-y-2">{Object.entries(errors).map(([key,message])=><li key={key}><button type="button" className="text-start underline underline-offset-4" onClick={()=>focusCheckoutError({[key]:message},prefix)}>{message}</button></li>)}</ul></div>;
}
export function CheckoutFieldError({message,id}: {message?:string;id:string}) {
 return message ? <p id={id} className="text-sm text-red-600 mt-1">{message}</p> : null;
}

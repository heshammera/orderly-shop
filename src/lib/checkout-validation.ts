export type CheckoutErrors = Record<string, string>;
export function normalizePhone(value: unknown): string {
  return String(value ?? '').replace(/[٠-٩]/g, d => String(d.charCodeAt(0)-1632)).replace(/[۰-۹]/g, d => String(d.charCodeAt(0)-1776)).replace(/[\s()\-\u200e\u200f\u061c]/g, '');
}
export function validateCheckout(input: any, shipping: any = {}, governorate = '', language = 'ar') {
  const ar = language !== 'en';
  const data = {...input};
  const errors: CheckoutErrors = {};
  const message = (a: string, e: string) => ar ? a : e;
  for (const key of ['name','address','city','email','notes']) data[key] = String(data[key] ?? '').trim();
  for (const key of ['name','address']) {
    const label = key === 'name' ? message('الاسم','Name') : message('العنوان','Address');
    const min = key === 'name' ? 2 : 3, max = key === 'name' ? 150 : 1000;
    if (!data[key]) errors[key] = message(`${label}: هذا الحقل مطلوب؛ اكتب ${key === 'name' ? 'اسم المستلم' : 'عنوان التوصيل بالتفصيل'}.`, `${label} is required. Enter the recipient’s ${key}.`);
    else if (data[key].length < min) errors[key] = message(`${label}: اكتب ${min} أحرف على الأقل.`, `${label}: enter at least ${min} characters.`);
    else if (data[key].length > max) errors[key] = message(`${label}: الحد الأقصى ${max} حرفًا.`, `${label}: use at most ${max} characters.`);
  }
  for (const key of ['phone','alt_phone']) {
    data[key] = normalizePhone(data[key]);
    const label = key === 'phone' ? message('رقم الهاتف','Phone number') : message('رقم الهاتف البديل','Alternative phone number');
    if (!data[key]) { if (key === 'phone') errors[key] = message('رقم الهاتف مطلوب للتواصل معك وتأكيد الطلب.', 'Phone number is required to confirm your order.'); continue; }
    if (!/^\+?[0-9]+$/.test(data[key])) errors[key] = message(`${label}: استخدم أرقامًا فقط، ويمكن وضع + في البداية لرمز الدولة. الأرقام العربية مقبولة.`, `${label}: use digits only, with an optional + at the start. Arabic digits are accepted.`);
    else if (!/^\+?[0-9]{8,15}$/.test(data[key])) errors[key] = message(`${label}: يجب أن يحتوي على 8 إلى 15 رقمًا؛ كتبت ${data[key].replace('+','').length} رقمًا. راجع الرقم ورمز الدولة.`, `${label}: enter 8–15 digits; you entered ${data[key].replace('+','').length}. Check the number and country code.`);
  }
  if (shipping.type === 'dynamic') {
    if (!governorate) errors.city = message('المحافظة: اختر محافظة التوصيل من القائمة لحساب الشحن.', 'Governorate: select your delivery area to calculate shipping.');
    else if (!Object.prototype.hasOwnProperty.call(shipping.governorate_prices || {}, governorate)) errors.city = message('المحافظة: الشحن غير متاح للمحافظة المختارة. اختر محافظة أخرى أو تواصل مع المتجر.', 'Shipping is unavailable for this area. Choose another or contact the store.');
  } else if (!data.city) errors.city = message('المدينة / المحافظة: اكتب اسم مدينة التوصيل.', 'City / governorate: enter your delivery city.');
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = message('البريد الإلكتروني: اكتب عنوانًا صحيحًا مثل name@example.com.', 'Email: enter a valid address, such as name@example.com.');
  return {data, errors};
}
export function focusCheckoutError(errors: CheckoutErrors, prefix = '') {
  if (typeof document === 'undefined') return;
  requestAnimationFrame(() => {
    for (const key of Object.keys(errors)) {
      const el = document.getElementById(prefix + (prefix ? key.replace('_','-') : key));
      if (el) { el.focus({preventScroll:true}); el.scrollIntoView({behavior:'smooth',block:'center'}); break; }
    }
  });
}

import { normalizePhone } from '@/lib/checkout-validation';
export function contactErrors(name:unknown,phone:unknown,language='ar') {
 const ar=language!=='en',errors:Record<string,string>={};
 const cleanName=typeof name==='string'?name.trim():'';
 const cleanPhone=normalizePhone(typeof phone==='string'?phone:'');
 if(cleanName.length<2||cleanName.length>150)errors.name=ar?'الاسم مطلوب ويجب أن يحتوي على حرفين إلى 150 حرفًا.':'Name is required and must contain 2–150 characters.';
 if(!cleanPhone)errors.phone=ar?'رقم الهاتف مطلوب للتواصل معك.':'Phone number is required.';
 else if(!/^\+?[0-9]{8,15}$/.test(cleanPhone))errors.phone=ar?'رقم الهاتف يجب أن يحتوي على 8 إلى 15 رقمًا، ويمكن وضع + في البداية. الأرقام العربية مقبولة.':'Enter 8–15 digits, optionally starting with +. Arabic digits are accepted.';
 return {name:cleanName,phone:cleanPhone,errors};
}

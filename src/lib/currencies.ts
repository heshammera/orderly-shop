export const STORE_CURRENCIES = [
 {code:'EGP',ar:'جنيه مصري',en:'Egyptian Pound'}, {code:'SAR',ar:'ريال سعودي',en:'Saudi Riyal'},
 {code:'AED',ar:'درهم إماراتي',en:'UAE Dirham'}, {code:'KWD',ar:'دينار كويتي',en:'Kuwaiti Dinar'},
 {code:'BHD',ar:'دينار بحريني',en:'Bahraini Dinar'}, {code:'OMR',ar:'ريال عماني',en:'Omani Rial'},
 {code:'QAR',ar:'ريال قطري',en:'Qatari Riyal'}, {code:'JOD',ar:'دينار أردني',en:'Jordanian Dinar'},
 {code:'USD',ar:'دولار أمريكي',en:'US Dollar'}, {code:'EUR',ar:'يورو',en:'Euro'}
];
export const isSupportedCurrency = (code: unknown): code is string => typeof code==='string' && STORE_CURRENCIES.some(c=>c.code===code);
export function currencyDecimals(code:string) {return new Intl.NumberFormat('en',{style:'currency',currency:code}).resolvedOptions().maximumFractionDigits ?? 2;}

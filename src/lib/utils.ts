import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = 'SAR', locale: string = 'ar-SA') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(price);
}

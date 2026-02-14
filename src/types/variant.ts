import type { Json } from '@/integrations/supabase/types';

export type DisplayType = 'buttons' | 'list' | 'dropdown' | 'color' | 'image';
export type OptionType = 'text' | 'color' | 'image';
export type DiscountType = 'percentage' | 'fixed';

export interface ProductVariant {
  id: string;
  product_id: string;
  name: { ar: string; en: string };
  display_type: DisplayType;
  option_type: OptionType;
  sort_order: number;
  required: boolean;
  created_at: string;
  updated_at: string;
  options?: VariantOption[];
}

export interface VariantOption {
  id: string;
  variant_id: string;
  label: { ar: string; en: string };
  value: string;
  price_modifier: number;
  stock_quantity: number | null;
  sort_order: number;
  is_default: boolean;
  created_at: string;
}

export interface UpsellOffer {
  id: string;
  product_id: string;
  min_quantity: number;
  discount_type: DiscountType;
  discount_value: number;
  label: { ar: string; en: string } | null;
  badge: { ar: string; en: string } | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Helper functions
export function parseVariant(data: {
  id: string;
  product_id: string;
  name: Json;
  display_type: string;
  option_type: string;
  sort_order: number;
  required: boolean;
  created_at: string;
  updated_at: string;
}): ProductVariant {
  return {
    id: data.id,
    product_id: data.product_id,
    name: (data.name as { ar: string; en: string }) || { ar: '', en: '' },
    display_type: data.display_type as DisplayType,
    option_type: data.option_type as OptionType,
    sort_order: data.sort_order,
    required: data.required,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export function parseVariantOption(data: {
  id: string;
  variant_id: string;
  label: Json;
  value: string;
  price_modifier: number | null;
  stock_quantity: number | null;
  sort_order: number;
  is_default: boolean;
  created_at: string;
}): VariantOption {
  return {
    id: data.id,
    variant_id: data.variant_id,
    label: (data.label as { ar: string; en: string }) || { ar: '', en: '' },
    value: data.value,
    price_modifier: data.price_modifier || 0,
    stock_quantity: data.stock_quantity,
    sort_order: data.sort_order,
    is_default: data.is_default,
    created_at: data.created_at,
  };
}

export function parseUpsellOffer(data: {
  id: string;
  product_id: string;
  min_quantity: number;
  discount_type: string;
  discount_value: number;
  label: Json | null;
  badge: Json | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}): UpsellOffer {
  return {
    id: data.id,
    product_id: data.product_id,
    min_quantity: data.min_quantity,
    discount_type: data.discount_type as DiscountType,
    discount_value: data.discount_value,
    label: data.label as { ar: string; en: string } | null,
    badge: data.badge as { ar: string; en: string } | null,
    is_active: data.is_active,
    sort_order: data.sort_order,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

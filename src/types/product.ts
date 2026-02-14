import type { Json } from '@/integrations/supabase/types';

export interface Product {
  id: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string } | null;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  track_inventory: boolean;
  status: string;
  sku: string | null;
  barcode: string | null;
  images: string[] | null;
  created_at: string;
  store_id: string;
}

// Helper function to convert database product to typed Product
export function parseProduct(data: {
  id: string;
  name: Json;
  description: Json | null;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  track_inventory: boolean;
  status: string;
  sku: string | null;
  barcode: string | null;
  images: Json | null;
  created_at: string;
  store_id: string;
}): Product {
  return {
    id: data.id,
    name: (data.name as { ar: string; en: string }) || { ar: '', en: '' },
    description: data.description as { ar: string; en: string } | null,
    price: data.price,
    compare_at_price: data.compare_at_price,
    stock_quantity: data.stock_quantity,
    track_inventory: data.track_inventory,
    status: data.status,
    sku: data.sku,
    barcode: data.barcode,
    images: Array.isArray(data.images) ? (data.images as string[]) : null,
    created_at: data.created_at,
    store_id: data.store_id,
  };
}

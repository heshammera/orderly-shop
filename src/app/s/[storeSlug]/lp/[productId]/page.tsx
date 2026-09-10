import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  LandingPageRenderer,
  LandingTemplate,
} from "@/components/landing-pages/LandingPageRenderer";
export const dynamic = "force-dynamic";
const parsed = (value: any, fallback: any) => {
  if (typeof value !== "string") return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};
const getPage = cache(async (storeSlug: string, productId: string) => {
  const db = createAdminClient();
  const { data: store, error: storeError } = await db
    .from("public_stores")
    .select("id,slug,name,currency")
    .eq("slug", storeSlug)
    .maybeSingle();
  if (storeError || !store) return null;
  const [product, landing] = await Promise.all([
    db
      .from("public_products")
      .select("id,name,price,sale_price,images,store_id")
      .eq("id", productId)
      .eq("store_id", store.id)
      .maybeSingle(),
    db
      .from("product_landing_pages")
      .select("template,content,is_standalone")
      .eq("product_id", productId)
      .eq("store_id", store.id)
      .eq("is_enabled", true)
      .maybeSingle(),
  ]);
  if (product.error || landing.error || !product.data || !landing.data)
    return null;
  return { store, product: product.data, landing: landing.data };
});
export async function generateMetadata({
  params,
}: {
  params: { storeSlug: string; productId: string };
}): Promise<Metadata> {
  const data = await getPage(params.storeSlug, params.productId);
  if (!data)
    return {
      title: "الصفحة غير متاحة",
      robots: { index: false, follow: false },
    };
  const c = parsed(data.landing.content, {}),
    name = parsed(data.product.name, {}),
    images = parsed(data.product.images, []);
  const title =
    c.headline?.ar || c.headline?.en || name.ar || name.en || "Product";
  const hero = c.hero_image || (Array.isArray(images) ? images[0] : null);
  return {
    title,
    description: c.subheadline?.ar || c.subheadline?.en || undefined,
    openGraph: { title, images: hero ? [hero] : [] },
  };
}
export default async function LandingPage({
  params,
}: {
  params: { storeSlug: string; productId: string };
}) {
  const data = await getPage(params.storeSlug, params.productId);
  if (!data) notFound();
  const c = parsed(data.landing.content, {}),
    name = parsed(data.product.name, {}),
    images = parsed(data.product.images, []);
  const content = { ...c, is_standalone: data.landing.is_standalone };
  for (const key of [
    "benefits",
    "testimonials",
    "gallery",
    "product_sections",
    "faq",
    "sections_order",
    "hidden_sections",
  ])
    if (!Array.isArray(content[key])) content[key] = [];
  return (
    <LandingPageRenderer
      template={data.landing.template as LandingTemplate}
      content={content}
      product={{
        name,
        price: Number(data.product.price || 0),
        sale_price: data.product.sale_price
          ? Number(data.product.sale_price)
          : undefined,
        currency: data.store.currency || "SAR",
        images: Array.isArray(images) ? images : [],
      }}
      language="ar"
      storeSlug={data.store.slug}
      productId={data.product.id}
    />
  );
}

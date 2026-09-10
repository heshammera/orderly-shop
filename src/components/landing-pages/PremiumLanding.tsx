"use client";
import { useState } from "react";
import {
  ArrowUpLeft,
  ArrowUpRight,
  Check,
  Plus,
  Minus,
  ShoppingBag,
  Loader2,
  Star,
} from "lucide-react";
import { LANDING_PRESETS, LANDING_SECTIONS } from "./landing-presets";
import { createClient } from "@/lib/supabase/client";
import { QuickOrderForm } from "@/components/store/QuickOrderForm";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function PremiumLanding({
  content: c,
  product: p,
  language = "ar",
  template = "modern",
  storeSlug,
  productId,
  isPreview = false,
  forceMobile = false,
}: any) {
  const ar = language === "ar";
  const preset =
    LANDING_PRESETS[template as keyof typeof LANDING_PRESETS] ||
    LANDING_PRESETS.modern;
  const accent = /^#[0-9a-f]{6}$/i.test(c.accent_color || "")
    ? c.accent_color
    : preset.accent;
  const background = /^#[0-9a-f]{6}$/i.test(c.bg_color || "")
    ? c.bg_color
    : preset.background;
  const ink = preset.ink;
  const text = (v: any) =>
    typeof v === "string" ? v : v?.[language] || v?.ar || v?.en || "";
  const price = Number(p.sale_price > 0 ? p.sale_price : p.price) || 0;
  const money = (n: number) =>
    new Intl.NumberFormat(ar ? "ar-EG" : "en-US", {
      style: "currency",
      currency: p.currency || "SAR",
    }).format(n);
  const images = [
    ...new Set(
      [
        c.hero_image,
        ...(c.gallery?.length ? c.gallery : p.images || []),
      ].filter(Boolean),
    ),
  ] as string[];
  const [activeImage, setActiveImage] = useState("");
  const hero = activeImage || images[0];
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [purchase, setPurchase] = useState<any>(null),
    [quantity, setQuantity] = useState(1),
    [choices, setChoices] = useState<Record<string, string>>({}),
    [orderOpen, setOrderOpen] = useState(false);
  const buy = async () => {
    if (isPreview) return;
    setBusy(true);
    setError("");
    try {
      const db = createClient();
      const [pr, st, vr] = await Promise.all([
        db.from("public_products").select("*").eq("id", productId).single(),
        db
          .from("public_stores")
          .select("id,slug,name,currency,settings")
          .eq("slug", storeSlug)
          .single(),
        db
          .from("product_variants")
          .select("*,variant_options(*)")
          .eq("product_id", productId)
          .order("sort_order"),
      ]);
      if (pr.error || st.error || vr.error || pr.data.store_id !== st.data.id)
        throw Error();
      setChoices({});
      setQuantity(1);
      setPurchase({ product: pr.data, store: st.data, variants: vr.data });
    } catch {
      setError(
        ar
          ? "تعذر تحميل الطلب، حاول مرة أخرى."
          : "Unable to load checkout. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  let unit = Number(
    purchase?.product.sale_price || purchase?.product.price || price,
  );
  if (purchase)
    for (const v of purchase.variants) {
      const o = v.variant_options.find((o: any) => o.id === choices[v.id]);
      if (o)
        unit +=
          o.price != null
            ? Number(o.price) -
              Number(purchase.product.sale_price || purchase.product.price)
            : Number(o.price_modifier || 0);
    }
  const ready = purchase?.variants.every((v: any) => {
    const selected = choices[v.id];
    if (!selected) return !v.required;
    const option = v.variant_options.find((o: any) => o.id === selected);
    return (
      option &&
      option.in_stock !== false &&
      (!option.manage_stock || option.stock == null || option.stock >= quantity)
    );
  });
  const action = (small = false) => (
    <button
      type="button"
      onClick={buy}
      disabled={busy}
      style={{
        background: accent,
        color: template === "noir" ? "#17191b" : "white",
      }}
      className={`${small ? "px-5 py-3 text-sm" : "px-8 py-4 text-base"} rounded-full font-bold inline-flex items-center justify-center gap-4 transition-transform hover:-translate-y-0.5 disabled:opacity-60`}
    >
      {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
      {text(c.cta_text) || (ar ? "اطلب الآن" : "Order now")}
      {ar ? <ArrowUpLeft size={18} /> : <ArrowUpRight size={18} />}
    </button>
  );
  const wide = !forceMobile;
  const order = Array.from(
    new Set([
      ...(Array.isArray(c.sections_order)
        ? c.sections_order
        : LANDING_SECTIONS),
      ...LANDING_SECTIONS,
    ]),
  );
  const section = (id: string) => {
    if (c.hidden_sections?.includes(id)) return null;
    if (id === "benefits" && c.benefits?.some((b: any) => text(b)))
      return (
        <section
          className={`grid ${wide ? "md:grid-cols-3" : ""} gap-8 py-14 border-y`}
          style={{ borderColor: ink + "20" }}
        >
          {c.benefits
            .filter((b: any) => text(b))
            .map((b: any, i: number) => (
              <div key={i} className="flex gap-4 items-start">
                <span
                  style={{ color: accent }}
                  className="text-xs font-mono pt-1"
                >
                  0{i + 1}
                </span>
                <p className="text-lg leading-relaxed">{text(b)}</p>
              </div>
            ))}
        </section>
      );
    if (id === "story" && c.product_sections?.length)
      return (
        <section className="space-y-16 py-16">
          {c.product_sections.map((s: any, i: number) => (
            <article
              key={i}
              className={`grid ${wide ? "md:grid-cols-2" : ""} gap-10 items-center`}
            >
              {s.image && (
                <img
                  src={s.image}
                  alt={text(s.title)}
                  loading="lazy"
                  className={`w-full aspect-[4/3] object-cover rounded-[2rem] ${wide && i % 2 ? "md:order-2" : ""}`}
                />
              )}
              <div className="space-y-5">
                <span className="text-xs tracking-[.2em] opacity-50">
                  0{i + 1} / {ar ? "عن المنتج" : "THE DETAILS"}
                </span>
                <h2 className="text-3xl font-bold leading-relaxed">
                  {text(s.title)}
                </h2>
                <p className="opacity-70 leading-8 whitespace-pre-line">
                  {text(s.description)}
                </p>
              </div>
            </article>
          ))}
        </section>
      );
    if (id === "gallery" && images.length > 1)
      return (
        <section className="py-14">
          <h2 className="text-2xl font-bold mb-8">
            {ar ? "كل التفاصيل، عن قرب." : "A closer look."}
          </h2>
          <div
            className={`grid grid-cols-2 ${wide ? "md:grid-cols-3" : ""} gap-4`}
          >
            {images.map((img, i) => (
              <img
                key={img}
                src={img}
                alt={`${text(p.name)} ${i + 1}`}
                loading="lazy"
                className="w-full aspect-square object-cover rounded-3xl"
              />
            ))}
          </div>
        </section>
      );
    if (id === "faq" && c.faq?.length)
      return (
        <section
          className={`py-16 grid ${wide ? "md:grid-cols-[1fr_1.5fr]" : ""} gap-10`}
        >
          <div>
            <p style={{ color: accent }} className="text-sm mb-3">
              {ar ? "قبل أن تطلب" : "GOOD TO KNOW"}
            </p>
            <h2 className="text-3xl font-bold">
              {ar ? "نسهّل عليك الاختيار." : "Made clear."}
            </h2>
          </div>
          <div>
            {c.faq.map((f: any, i: number) => (
              <details
                key={i}
                className="border-b py-5"
                style={{ borderColor: ink + "25" }}
              >
                <summary className="cursor-pointer font-bold leading-7">
                  {text(f.question)}
                </summary>
                <p className="opacity-70 leading-8 pt-4 whitespace-pre-line">
                  {text(f.answer)}
                </p>
              </details>
            ))}
          </div>
        </section>
      );
    if (id === "testimonials" && c.testimonials?.length)
      return (
        <section className="py-14">
          <h2 className="text-2xl font-bold mb-8">
            {ar ? "من تجارب العملاء" : "Customer stories"}
          </h2>
          <div className={`grid ${wide ? "md:grid-cols-3" : ""} gap-5`}>
            {c.testimonials.map((t: any, i: number) => (
              <blockquote
                key={i}
                className="border rounded-3xl p-7 space-y-5"
                style={{ borderColor: ink + "25" }}
              >
                <div
                  className="flex gap-1"
                  aria-label={`${t.rating}/5`}
                  style={{ color: accent }}
                >
                  {Array.from(
                    { length: Math.min(5, Math.max(0, t.rating || 5)) },
                    (_, j) => (
                      <Star key={j} size={13} fill="currentColor" />
                    ),
                  )}
                </div>
                <p className="leading-8">{text(t.text)}</p>
                <footer className="text-sm opacity-60">{t.name}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      );
    if (id === "guarantee" && text(c.guarantee_text))
      return (
        <section className="py-16 text-center max-w-2xl mx-auto">
          <Check style={{ color: accent }} className="mx-auto mb-5" />
          <h2 className="text-xl font-bold mb-4">
            {ar ? "تسوّق على بيّنة" : "Shop with clarity"}
          </h2>
          <p className="leading-8 opacity-70 whitespace-pre-line">
            {text(c.guarantee_text)}
          </p>
        </section>
      );
    return null;
  };
  return (
    <div
      dir={ar ? "rtl" : "ltr"}
      style={{ background, color: ink }}
      className="min-h-full overflow-hidden"
    >
      <div
        className={`max-w-7xl mx-auto ${forceMobile ? "px-5" : "px-6 md:px-12"}`}
      >
        <nav
          className="flex justify-between items-center gap-5 py-6 border-b"
          style={{ borderColor: ink + "20" }}
        >
          <span className="font-bold text-lg tracking-tight">
            {c.brand_name || text(p.name)}
          </span>
          <span className="text-xs opacity-55 truncate">
            {c.is_standalone === false ? (
              <a href={`https://${storeSlug}.orderlyshops.com/`}>
                {ar ? "زيارة المتجر" : "Visit store"}
              </a>
            ) : (
              text(c.eyebrow)
            )}
          </span>
        </nav>
        <header
          className={`grid ${wide ? "md:grid-cols-2" : ""} gap-10 lg:gap-16 py-10 md:py-16 items-center`}
        >
          <div className="space-y-4">
            <div
              className="relative rounded-[2rem] overflow-hidden aspect-[4/5]"
              style={{ background: ink + "08" }}
            >
              {hero ? (
                <img
                  key={hero}
                  src={hero}
                  alt={text(p.name)}
                  fetchPriority="high"
                  className={`w-full h-full ${c.image_fit === "cover" ? "object-cover" : "object-contain p-6"}`}
                />
              ) : (
                <div className="h-full flex items-center justify-center opacity-25">
                  <ShoppingBag size={80} strokeWidth={1} />
                </div>
              )}
              <span
                className="absolute bottom-5 start-5 backdrop-blur rounded-full px-4 py-2 text-xs"
                style={{ background: background + "dd" }}
              >
                01 / {String(images.length || 1).padStart(2, "0")}
              </span>
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img) => (
                  <button
                    type="button"
                    key={img}
                    onClick={() => setActiveImage(img)}
                    aria-label={ar ? "عرض صورة المنتج" : "View product image"}
                    className="w-16 h-16 rounded-xl border-2 shrink-0 overflow-hidden"
                    style={{
                      borderColor: hero === img ? accent : "transparent",
                    }}
                  >
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-7">
            <p
              style={{ color: accent }}
              className="text-sm font-semibold tracking-widest"
            >
              {text(c.eyebrow)}
            </p>
            <h1
              className={`${forceMobile ? "text-4xl" : "text-4xl lg:text-6xl"} font-bold leading-[1.3] tracking-tight whitespace-pre-line`}
            >
              {text(c.headline) || text(p.name)}
            </h1>
            {text(c.subheadline) && (
              <p className="text-lg leading-9 opacity-65 whitespace-pre-line">
                {text(c.subheadline)}
              </p>
            )}
            <div className="flex flex-wrap items-baseline gap-4">
              <span className="text-3xl font-bold">{money(price)}</span>
              {p.sale_price > 0 && p.sale_price < p.price && (
                <del className="text-lg opacity-45">{money(p.price)}</del>
              )}
            </div>
            <div>{action()}</div>
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            <div
              className="border-t pt-5 text-xs opacity-55 leading-6"
              style={{ borderColor: ink + "20" }}
            >
              {ar
                ? "راجع خيارات المنتج وتفاصيل الشحن قبل تأكيد طلبك."
                : "Review product options and delivery details before confirming."}
            </div>
          </div>
        </header>
        {order.map((id) => (
          <div key={id}>{section(id)}</div>
        ))}
        <footer
          className="py-8 border-t flex justify-between gap-4 text-xs opacity-60"
          style={{ borderColor: ink + "20" }}
        >
          <span>{c.brand_name || text(p.name)}</span>
          <span>© {new Date().getFullYear()}</span>
        </footer>
      </div>
      {c.sticky_cta !== false && (
        <div
          className={`${isPreview ? "" : "sticky bottom-0 z-20"} border-t px-5 py-3 flex items-center justify-between gap-4 backdrop-blur-xl`}
          style={{ background: background + "ee", borderColor: ink + "20" }}
        >
          <div>
            <p className="text-xs opacity-60 mb-1">{text(p.name)}</p>
            <strong>{money(price)}</strong>
          </div>
          {action(true)}
        </div>
      )}
      <Dialog
        open={!!purchase && !orderOpen}
        onOpenChange={(open) => {
          if (!open) setPurchase(null);
        }}
      >
        <DialogContent dir={ar ? "rtl" : "ltr"}>
          <DialogTitle>{ar ? "خيارات طلبك" : "Your order"}</DialogTitle>
          <DialogDescription>
            {ar
              ? "حدد الكمية والخيارات قبل إدخال بيانات الشحن."
              : "Choose your options before entering delivery details."}
          </DialogDescription>
          {purchase?.variants.map((v: any) => (
            <label key={v.id} className="block space-y-2 text-sm">
              <span>
                {text(v.name)} {v.required ? "*" : ""}
              </span>
              <select
                className="border rounded-xl p-3 w-full bg-background"
                value={choices[v.id] || ""}
                onChange={(e) =>
                  setChoices({ ...choices, [v.id]: e.target.value })
                }
              >
                <option value="">{ar ? "اختر" : "Select"}</option>
                {v.variant_options.map((o: any) => (
                  <option
                    key={o.id}
                    value={o.id}
                    disabled={
                      o.in_stock === false ||
                      (o.manage_stock && o.stock != null && o.stock < quantity)
                    }
                  >
                    {text(o.label)}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <div className="flex items-center justify-between">
            <span>{ar ? "الكمية" : "Quantity"}</span>
            <div className="flex items-center gap-5">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus size={18} />
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity(Math.min(99, quantity + 1))}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
          <button
            type="button"
            disabled={!ready}
            onClick={() => setOrderOpen(true)}
            className="bg-primary text-primary-foreground p-3 rounded-xl disabled:opacity-40"
          >
            {ar ? "متابعة لبيانات الشحن" : "Continue to delivery"}
          </button>
        </DialogContent>
      </Dialog>
      {purchase && (
        <QuickOrderForm
          isOpen={orderOpen}
          onClose={() => {
            setOrderOpen(false);
            setPurchase(null);
          }}
          product={purchase.product}
          store={purchase.store}
          quantity={quantity}
          subtotal={unit * quantity}
          variants={purchase.variants}
          selections={Object.fromEntries(
            Array.from({ length: quantity }, (_, i) => [i, choices]),
          )}
        />
      )}
    </div>
  );
}

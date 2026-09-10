"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/dashboard/ImageUpload";
import { createClient } from "@/lib/supabase/client";
import { revalidateLandingPage } from "@/app/actions/landing-page";
import { useLanguage } from "@/contexts/LanguageContext";
import { PremiumLanding } from "./PremiumLanding";
import {
  LANDING_PRESETS,
  LANDING_SECTIONS,
  sectionNames,
  newLandingContent,
  StudioTemplate,
} from "./landing-presets";
import {
  Palette,
  Type,
  Images,
  Layers,
  Settings2,
  Monitor,
  Smartphone,
  Save,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Check,
  Loader2,
  Copy,
  ArrowUpLeft,
  Lock,
  X,
} from "lucide-react";
import { toast } from "sonner";
interface Props {
  productId: string;
  storeId: string;
  storeSlug: string;
  productName: { ar: string; en: string };
  productPrice: number;
  productSalePrice?: number;
  productImages: string[];
  productCurrency: string;
  canUseLandingPages: boolean;
}
export function LandingPageEditor(p: Props) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const [open, setOpen] = useState(false),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [loadFailed, setLoadFailed] = useState(false);
  const [content, setContent] = useState<any>(newLandingContent()),
    [template, setTemplate] = useState<StudioTemplate>("modern"),
    [enabled, setEnabled] = useState(false),
    [standalone, setStandalone] = useState(true),
    [baseline, setBaseline] = useState("");
  const [panel, setPanel] = useState("design"),
    [locale, setLocale] = useState<"ar" | "en">("ar"),
    [mobile, setMobile] = useState(true),
    [view, setView] = useState("edit"),
    [expanded, setExpanded] = useState("benefits");
  const snapshot = JSON.stringify({ content, template, enabled, standalone });
  const dirty = !!baseline && snapshot !== baseline;
  const url = p.storeSlug
    ? `https://${p.storeSlug}.orderlyshops.com/lp/${p.productId}`
    : "";
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadFailed(false);
    if (!p.canUseLandingPages) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data, error } = await createClient()
          .from("product_landing_pages")
          .select("*")
          .eq("product_id", p.productId)
          .eq("store_id", p.storeId)
          .maybeSingle();
        if (error) throw error;
        if (!alive) return;
        const c = {
          ...newLandingContent(),
          ...(data?.content || {}),
          design_version: 2,
        };
        const t: StudioTemplate =
          data?.template in LANDING_PRESETS ? data.template : "modern";
        const en = !!data?.is_enabled,
          st = data?.is_standalone ?? true;
        setContent(c);
        setTemplate(t);
        setEnabled(en);
        setStandalone(st);
        setBaseline(
          JSON.stringify({
            content: c,
            template: t,
            enabled: en,
            standalone: st,
          }),
        );
      } catch {
        if (alive) {
          setLoadFailed(true);
          toast.error(
            ar
              ? "تعذر تحميل الصفحة؛ أعد فتح المنتج قبل التعديل."
              : "Could not load this page. Reopen the product.",
          );
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [p.productId, p.storeId, p.canUseLandingPages]);
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  const update = (key: string, value: any) =>
    setContent((c: any) => ({ ...c, [key]: value }));
  const localText = (key: string, value: string) =>
    setContent((c: any) => ({
      ...c,
      [key]: { ...(c[key] || {}), [locale]: value },
    }));
  const close = () => {
    if (
      !dirty ||
      window.confirm(
        ar
          ? "عند إغلاق الاستوديو ستبقى التعديلات هنا، لكنها غير منشورة. هل تريد الإغلاق؟"
          : "Close the studio with unpublished changes?",
      )
    )
      setOpen(false);
  };
  const save = async () => {
    if (saving || loading || loadFailed) return;
    setSaving(true);
    const savedSnapshot = snapshot;
    try {
      const { error } = await createClient()
        .from("product_landing_pages")
        .upsert(
          {
            product_id: p.productId,
            store_id: p.storeId,
            template,
            is_enabled: enabled,
            is_standalone: standalone,
            content,
          },
          { onConflict: "product_id" },
        );
      if (error) throw error;
      setBaseline(savedSnapshot);
      const revalidated = await revalidateLandingPage(p.storeSlug, p.productId);
      toast.success(
        ar
          ? enabled
            ? "تم حفظ الصفحة ونشر التعديلات"
            : "تم حفظ المسودة؛ الصفحة غير منشورة"
          : "Page saved",
      );
      if (!revalidated.success)
        toast.message(
          ar ? "قد يستغرق ظهور التعديل دقيقة." : "Updates may take a minute.",
        );
    } catch {
      toast.error(
        ar
          ? "تعذر الحفظ. تعديلاتك موجودة؛ حاول مرة أخرى."
          : "Could not save. Your changes are still here.",
      );
    } finally {
      setSaving(false);
    }
  };
  const field = (title: string, key: string, multi = false) => (
    <label className="block space-y-2 text-sm">
      <span className="font-semibold text-slate-700">{title}</span>
      {multi ? (
        <Textarea
          value={content[key]?.[locale] || ""}
          onChange={(e) => localText(key, e.target.value)}
          rows={4}
          className="resize-y bg-white rounded-xl leading-7"
        />
      ) : (
        <Input
          value={content[key]?.[locale] || ""}
          onChange={(e) => localText(key, e.target.value)}
          className="bg-white rounded-xl"
        />
      )}
    </label>
  );
  const listChange = (key: string, index: number, value: any) =>
    update(
      key,
      (content[key] || []).map((x: any, i: number) =>
        i === index ? value : x,
      ),
    );
  const remove = (key: string, index: number) =>
    update(
      key,
      (content[key] || []).filter((_: any, i: number) => i !== index),
    );
  const add = (key: string, value: any) =>
    update(key, [...(content[key] || []), value]);
  const order: string[] = Array.from(
    new Set([
      ...(content.sections_order || LANDING_SECTIONS),
      ...LANDING_SECTIONS,
    ]),
  );
  const move = (id: string, delta: number) => {
    const i = order.indexOf(id),
      j = i + delta;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    update("sections_order", next);
  };
  const rows = (id: string) => {
    const key = id === "story" ? "product_sections" : id;
    if (id === "guarantee")
      return field("اكتب سياسة حقيقية خاصة بالمتجر", "guarantee_text", true);
    if (id === "gallery")
      return (
        <p className="text-sm leading-7 text-slate-500">
          اختر صور المعرض من تبويب «الصور».
        </p>
      );
    return (
      <div className="space-y-4">
        {id === "testimonials" && (
          <p className="text-xs leading-6 text-slate-500">
            أضف تقييمات عملاء حقيقية بعد الحصول على موافقتهم. لا توجد تقييمات
            افتراضية.
          </p>
        )}
        {(content[key] || []).map((item: any, i: number) => (
          <div key={i} className="border rounded-xl p-3 space-y-3 bg-white">
            <div className="flex justify-between text-xs text-slate-400">
              <span>{i + 1}</span>
              <button
                type="button"
                aria-label="حذف العنصر"
                onClick={() => remove(key, i)}
              >
                <Trash2 size={15} />
              </button>
            </div>
            {id === "benefits" ? (
              <Textarea
                aria-label="نص الميزة"
                value={item[locale] || ""}
                onChange={(e) =>
                  listChange(key, i, { ...item, [locale]: e.target.value })
                }
              />
            ) : (
              <>
                {id === "story" && (
                  <ImageUpload
                    value={item.image ? [item.image] : []}
                    onChange={(v) =>
                      listChange(key, i, {
                        ...item,
                        image: v[v.length - 1] || "",
                      })
                    }
                    onRemove={() => listChange(key, i, { ...item, image: "" })}
                  />
                )}
                <Input
                  aria-label={
                    id === "faq"
                      ? "السؤال"
                      : id === "testimonials"
                        ? "اسم العميل"
                        : "عنوان القسم"
                  }
                  placeholder={
                    id === "faq"
                      ? "السؤال"
                      : id === "testimonials"
                        ? "اسم العميل"
                        : "عنوان القسم"
                  }
                  value={
                    id === "testimonials"
                      ? item.name || ""
                      : item[id === "faq" ? "question" : "title"]?.[locale] ||
                        ""
                  }
                  onChange={(e) => {
                    const k = id === "faq" ? "question" : "title";
                    listChange(
                      key,
                      i,
                      id === "testimonials"
                        ? { ...item, name: e.target.value }
                        : {
                            ...item,
                            [k]: { ...item[k], [locale]: e.target.value },
                          },
                    );
                  }}
                />
                <Textarea
                  aria-label="التفاصيل"
                  placeholder="التفاصيل"
                  value={
                    item[
                      id === "faq"
                        ? "answer"
                        : id === "testimonials"
                          ? "text"
                          : "description"
                    ]?.[locale] || ""
                  }
                  onChange={(e) => {
                    const k =
                      id === "faq"
                        ? "answer"
                        : id === "testimonials"
                          ? "text"
                          : "description";
                    listChange(key, i, {
                      ...item,
                      [k]: { ...item[k], [locale]: e.target.value },
                    });
                  }}
                />
                {id === "testimonials" && (
                  <label className="block text-xs">
                    التقييم
                    <select
                      className="border rounded-lg mx-3 p-2"
                      value={item.rating || 5}
                      onChange={(e) =>
                        listChange(key, i, {
                          ...item,
                          rating: Number(e.target.value),
                        })
                      }
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-xl"
          onClick={() =>
            add(
              key,
              id === "benefits"
                ? { ar: "", en: "" }
                : id === "faq"
                  ? { question: { ar: "", en: "" }, answer: { ar: "", en: "" } }
                  : id === "testimonials"
                    ? { name: "", rating: 5, text: { ar: "", en: "" } }
                    : {
                        image: "",
                        title: { ar: "", en: "" },
                        description: { ar: "", en: "" },
                      },
            )
          }
        >
          <Plus size={16} className="mx-2" />
          إضافة عنصر
        </Button>
      </div>
    );
  };
  if (!p.canUseLandingPages)
    return (
      <div className="rounded-3xl border p-8 space-y-4 bg-slate-50">
        <Lock className="text-slate-400" />
        <h3 className="text-xl font-bold">استوديو صفحات الهبوط</h3>
        <p className="text-sm text-slate-500">
          فعّل خدمة صفحات الهبوط لإنشاء صفحة مستقلة ومخصصة لمنتجك.
        </p>
      </div>
    );
  return (
    <>
      <div className="rounded-3xl overflow-hidden border bg-[#f4f5f1] p-7 md:p-10 flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1 space-y-4">
          <span className="text-xs tracking-[.25em] text-emerald-700">
            ORDERLY / STUDIO
          </span>
          <h3 className="text-3xl font-bold text-slate-900">
            صفحة تستحق منتجك.
          </h3>
          <p className="text-sm text-slate-500 leading-7">
            تصاميم جاهزة، تحرير سهل، ومعاينة مباشرة. ابنِ صفحة مستقلة بدون كتابة
            كود.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={loading || loadFailed}
              onClick={() => setOpen(true)}
              className="rounded-full px-7 bg-[#234d42] hover:bg-[#19392f]"
            >
              {loading ? (
                <Loader2 className="animate-spin mx-2" size={16} />
              ) : (
                <Palette size={16} className="mx-2" />
              )}
              فتح استوديو التصميم
            </Button>
            {enabled && url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-slate-600"
              >
                عرض الصفحة
                <ExternalLink size={15} />
              </a>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {enabled ? "الصفحة منشورة" : "مسودة — الصفحة غير منشورة"}{" "}
            {dirty ? "· لديك تعديلات غير محفوظة" : ""}
          </p>
        </div>
        <div className="w-40 h-48 rounded-2xl border-[5px] border-white shadow-xl overflow-hidden bg-white flex-shrink-0">
          {p.productImages?.[0] ? (
            <img
              src={content.hero_image || p.productImages[0]}
              alt=""
              className="w-full h-32 object-cover"
            />
          ) : (
            <div className="h-32 bg-emerald-100" />
          )}
          <div className="p-3 space-y-2">
            <div className="h-2 w-3/4 rounded bg-slate-200" />
            <div className="h-5 w-1/2 rounded-full bg-[#234d42]" />
          </div>
        </div>
      </div>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) close();
        }}
      >
        <DialogContent
          onEscapeKeyDown={(e) => {
            if (saving) e.preventDefault();
          }}
          className="!max-w-none !w-screen !h-[100dvh] !rounded-none !p-0 !gap-0 !border-0 !bg-[#f5f6f8] !z-[100] [&>button]:hidden flex flex-col"
          dir="rtl"
        >
          <DialogTitle className="sr-only">
            استوديو تصميم صفحة الهبوط
          </DialogTitle>
          <DialogDescription className="sr-only">
            عدّل التصميم والنصوص والصور وشاهد النتيجة مباشرة قبل الحفظ.
          </DialogDescription>
          <header className="h-20 shrink-0 border-b bg-white flex items-center justify-between gap-4 px-4 md:px-7">
            <div className="flex gap-3 items-center">
              <button
                type="button"
                aria-label="إغلاق الاستوديو"
                disabled={saving}
                onClick={close}
                className="rounded-full border p-2"
              >
                <X size={18} />
              </button>
              <div>
                <strong className="block text-sm">استوديو صفحات الهبوط</strong>
                <span className="text-xs text-slate-400">
                  {dirty
                    ? "تعديلات غير محفوظة"
                    : enabled
                      ? "منشورة · تم الحفظ"
                      : "مسودة · تم الحفظ"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden md:inline text-xs text-slate-400 max-w-52 truncate">
                {p.productName.ar || p.productName.en}
              </span>
              <Button
                type="button"
                disabled={saving || loadFailed}
                onClick={save}
                className="rounded-full bg-[#234d42] hover:bg-[#19392f]"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin mx-2" />
                ) : (
                  <Save size={16} className="mx-2" />
                )}
                {enabled ? "حفظ ونشر" : "حفظ المسودة"}
              </Button>
            </div>
          </header>
          <div className="flex lg:hidden bg-white border-b p-2 gap-2">
            <button
              type="button"
              onClick={() => setView("edit")}
              className={`flex-1 p-2 rounded-lg text-sm ${view === "edit" ? "bg-slate-100 font-bold" : ""}`}
            >
              التعديل
            </button>
            <button
              type="button"
              onClick={() => setView("preview")}
              className={`flex-1 p-2 rounded-lg text-sm ${view === "preview" ? "bg-slate-100 font-bold" : ""}`}
            >
              المعاينة المباشرة
            </button>
          </div>
          <div className="flex flex-1 min-h-0">
            <aside
              className={`${view === "edit" ? "flex" : "hidden"} lg:flex w-full lg:w-[360px] xl:w-[400px] shrink-0 bg-white border-l flex-col min-h-0`}
            >
              <nav className="flex shrink-0 border-b p-3 gap-1">
                {[
                  ["design", "التصميم", Palette],
                  ["text", "النصوص", Type],
                  ["images", "الصور", Images],
                  ["sections", "الأقسام", Layers],
                  ["publish", "النشر", Settings2],
                ].map(([id, label, Icon]: any) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => setPanel(id)}
                    className={`flex-1 flex flex-col items-center gap-2 rounded-xl py-3 text-[11px] ${panel === id ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-400 hover:bg-slate-50"}`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </nav>
              <div className="overflow-y-auto flex-1 p-5 space-y-6">
                {panel === "design" && (
                  <>
                    <div>
                      <h3 className="font-bold text-lg">اختر طابع الصفحة</h3>
                      <p className="text-xs text-slate-400 mt-2 leading-6">
                        يتغير التصميم فورًا؛ محتواك وصورك يظلان كما هما.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(LANDING_PRESETS).map(([id, t]) => (
                        <button
                          type="button"
                          key={id}
                          onClick={() => {
                            setTemplate(id as StudioTemplate);
                            setContent((c: any) => ({
                              ...c,
                              accent_color: t.accent,
                              bg_color: t.background,
                            }));
                          }}
                          className={`rounded-2xl border-2 overflow-hidden text-start ${template === id ? "border-emerald-700" : "border-slate-100"}`}
                        >
                          <div
                            style={{ background: t.background }}
                            className="h-24 p-3 flex gap-2"
                          >
                            <div
                              style={{ background: t.accent + "30" }}
                              className="w-1/2 rounded-xl"
                            />
                            <div className="flex-1 pt-3 space-y-2">
                              <div
                                style={{ background: t.ink }}
                                className="h-1.5 rounded"
                              />
                              <div
                                style={{ background: t.ink, opacity: 0.2 }}
                                className="h-1 w-3/4 rounded"
                              />
                              <div
                                style={{ background: t.accent }}
                                className="h-4 w-3/4 rounded-full"
                              />
                            </div>
                          </div>
                          <div className="p-3 text-xs flex justify-between font-semibold">
                            <span>{t.name}</span>
                            {template === id && <Check size={13} />}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ["accent_color", "لون الأزرار"],
                        ["bg_color", "الخلفية"],
                      ].map(([k, label]) => (
                        <label key={k} className="text-xs space-y-2">
                          <span>{label}</span>
                          <input
                            aria-label={label}
                            type="color"
                            className="block w-full h-10 rounded-xl border p-1"
                            value={content[k] || "#ffffff"}
                            onChange={(e) => update(k, e.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                    <label className="flex items-center justify-between text-sm">
                      زر طلب أسفل الصفحة
                      <Switch
                        checked={content.sticky_cta !== false}
                        onCheckedChange={(v) => update("sticky_cta", v)}
                      />
                    </label>
                  </>
                )}
                {["text", "sections"].includes(panel) && (
                  <div className="flex gap-2 border-b pb-3">
                    {["ar", "en"].map((l) => (
                      <button
                        type="button"
                        key={l}
                        onClick={() => setLocale(l as "ar" | "en")}
                        className={`rounded-full px-4 py-2 text-xs ${locale === l ? "bg-slate-900 text-white" : "bg-slate-100"}`}
                      >
                        {l === "ar" ? "العربية" : "English"}
                      </button>
                    ))}
                  </div>
                )}
                {panel === "text" && (
                  <>
                    <h3 className="font-bold">الانطباع الأول</h3>
                    <label className="block space-y-2 text-sm">
                      <span>اسم العلامة التجارية</span>
                      <Input
                        value={content.brand_name || ""}
                        onChange={(e) => update("brand_name", e.target.value)}
                        placeholder={p.productName[locale]}
                      />
                    </label>
                    {field("عبارة قصيرة أعلى العنوان", "eyebrow")}
                    {field("العنوان الرئيسي", "headline", true)}
                    {field("الوصف المختصر", "subheadline", true)}
                    {field("نص زر الطلب", "cta_text")}
                    <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500 leading-6">
                      السعر وخيارات المنتج تأتي من بيانات المنتج؛ لا تحتاج
                      تعديلها هنا.
                    </div>
                  </>
                )}
                {panel === "images" && (
                  <>
                    <h3 className="font-bold">الصورة الرئيسية</h3>
                    <ImageUpload
                      value={content.hero_image ? [content.hero_image] : []}
                      onChange={(v) =>
                        update("hero_image", v[v.length - 1] || "")
                      }
                      onRemove={() => update("hero_image", "")}
                    />
                    <p className="text-xs text-slate-400">
                      أو اختر من صور المنتج
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {(p.productImages || []).map((img) => (
                        <button
                          type="button"
                          key={img}
                          onClick={() => update("hero_image", img)}
                          className={`rounded-xl border-2 overflow-hidden ${content.hero_image === img ? "border-emerald-600" : "border-transparent"}`}
                        >
                          <img
                            src={img}
                            alt="اختيار الصورة الرئيسية"
                            className="aspect-square object-cover"
                          />
                        </button>
                      ))}
                    </div>
                    <label className="block text-sm space-y-2">
                      <span>طريقة عرض الصورة</span>
                      <select
                        className="w-full border rounded-xl p-3"
                        value={content.image_fit || "contain"}
                        onChange={(e) => update("image_fit", e.target.value)}
                      >
                        <option value="contain">عرض المنتج بالكامل</option>
                        <option value="cover">ملء المساحة بالصورة</option>
                      </select>
                    </label>
                    <h3 className="font-bold pt-4">معرض صور إضافية</h3>
                    <ImageUpload
                      value={content.gallery || []}
                      onChange={(v) => update("gallery", v)}
                      onRemove={(img) =>
                        update(
                          "gallery",
                          (content.gallery || []).filter(
                            (v: string) => v !== img,
                          ),
                        )
                      }
                    />
                  </>
                )}
                {panel === "sections" && (
                  <>
                    <p className="text-xs text-slate-400 leading-6">
                      رتّب الأقسام بالأسهم. الأقسام الفارغة لا تظهر في الصفحة
                      المنشورة.
                    </p>
                    {order.map((id, i) => (
                      <div
                        key={id}
                        className="border rounded-2xl overflow-hidden"
                      >
                        <div className="flex items-center gap-2 p-3 bg-slate-50">
                          <button
                            type="button"
                            onClick={() =>
                              setExpanded(expanded === id ? "" : id)
                            }
                            className="font-semibold text-sm flex-1 text-start"
                          >
                            {sectionNames[id] || id}
                          </button>
                          <button
                            type="button"
                            aria-label={`تحريك ${sectionNames[id]} لأعلى`}
                            disabled={i === 0}
                            onClick={() => move(id, -1)}
                            className="disabled:opacity-20"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label={`تحريك ${sectionNames[id]} لأسفل`}
                            disabled={i === order.length - 1}
                            onClick={() => move(id, 1)}
                            className="disabled:opacity-20"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <Switch
                            aria-label={`إظهار ${sectionNames[id]}`}
                            checked={!content.hidden_sections?.includes(id)}
                            onCheckedChange={(show) =>
                              update(
                                "hidden_sections",
                                show
                                  ? (content.hidden_sections || []).filter(
                                      (x: string) => x !== id,
                                    )
                                  : [...(content.hidden_sections || []), id],
                              )
                            }
                          />
                        </div>
                        {expanded === id && (
                          <div className="p-3">{rows(id)}</div>
                        )}
                      </div>
                    ))}
                  </>
                )}
                {panel === "publish" && (
                  <>
                    <h3 className="text-lg font-bold">
                      جاهزة لاستقبال الزوار؟
                    </h3>
                    <div className="border rounded-2xl p-4 space-y-5">
                      <label className="flex justify-between items-center text-sm font-semibold">
                        نشر صفحة الهبوط
                        <Switch
                          checked={enabled}
                          onCheckedChange={setEnabled}
                        />
                      </label>
                      <p className="text-xs text-slate-400 leading-6">
                        احفظ التعديلات لتطبيق حالة النشر الجديدة.
                      </p>
                      <label className="flex justify-between items-center text-sm">
                        الوضع المستقل
                        <Switch
                          checked={standalone}
                          onCheckedChange={setStandalone}
                        />
                      </label>
                    </div>
                    <label className="block text-xs space-y-2">
                      <span>رابط الصفحة</span>
                      <Input readOnly value={url} dir="ltr" />
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(url);
                            toast.success("تم نسخ الرابط");
                          } catch {
                            toast.error("انسخ الرابط من الحقل");
                          }
                        }}
                      >
                        <Copy size={14} className="mx-2" />
                        نسخ الرابط
                      </Button>
                      {enabled && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm border rounded-md p-3 inline-flex gap-2"
                        >
                          فتح الصفحة
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                    <p className="text-xs leading-6 text-slate-400">
                      المعاينة هنا تعرض تغييراتك فورًا. الرابط العام يعرض آخر
                      نسخة حفظتها فقط.
                    </p>
                  </>
                )}
              </div>
            </aside>
            <main
              className={`${view === "preview" ? "flex" : "hidden"} lg:flex flex-1 min-w-0 flex-col`}
            >
              <div className="h-14 shrink-0 flex justify-between items-center px-5 border-b bg-[#f5f6f8]">
                <span className="text-xs text-slate-500">
                  معاينة حيّة · {dirty ? "غير منشورة بعد" : "آخر تعديل محفوظ"}
                </span>
                <div className="flex bg-white border rounded-full p-1">
                  <button
                    type="button"
                    aria-label="معاينة الهاتف"
                    onClick={() => setMobile(true)}
                    className={`p-2 rounded-full ${mobile ? "bg-slate-100" : ""}`}
                  >
                    <Smartphone size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="معاينة الكمبيوتر"
                    onClick={() => setMobile(false)}
                    className={`p-2 rounded-full ${!mobile ? "bg-slate-100" : ""}`}
                  >
                    <Monitor size={16} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div
                  className={`${mobile ? "max-w-[390px] rounded-[2rem]" : "w-full rounded-xl"} mx-auto shadow-xl overflow-hidden border border-slate-200 bg-white transition-[max-width] duration-300`}
                >
                  <div className="bg-white flex items-center justify-center gap-2 py-3 border-b text-[10px] text-slate-400">
                    <Lock size={10} />
                    {p.storeSlug}.orderlyshops.com
                  </div>
                  <PremiumLanding
                    template={template}
                    content={{ ...content, is_standalone: standalone }}
                    product={{
                      name: p.productName,
                      price: p.productPrice,
                      sale_price: p.productSalePrice,
                      images: p.productImages || [],
                      currency: p.productCurrency,
                    }}
                    language={locale}
                    storeSlug={p.storeSlug}
                    productId={p.productId}
                    isPreview
                    forceMobile={mobile}
                  />
                </div>
              </div>
            </main>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

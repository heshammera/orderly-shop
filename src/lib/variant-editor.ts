export type VariantEditorOption = {
  id?: string;
  label: { ar: string; en: string };
  value: string;
  price: number | null;
  price_modifier?: number | null;
  stock: number | null;
  stock_quantity?: number | null;
  manage_stock: boolean;
  in_stock: boolean;
  is_default: boolean;
  sort_order: number;
};
export type VariantEditorGroup = {
  id?: string;
  name: { ar: string; en: string };
  display_type: string;
  option_type: string;
  required: boolean;
  sort_order: number;
  options: VariantEditorOption[];
  isExpanded?: boolean;
};

export function splitOptionLabels(value: string): string[] {
  return [...new Set(value.split(/[,،;\n]+/).map(x => x.trim()).filter(Boolean))];
}

export function appendVariantOptions(group: VariantEditorGroup, text: string, language: 'ar'|'en' = 'ar'): VariantEditorGroup {
  const existing = new Set(group.options.flatMap(o => [o.label.ar.trim().toLocaleLowerCase(), o.label.en.trim().toLocaleLowerCase()]));
  const added = splitOptionLabels(text).filter(label => { const key=label.toLocaleLowerCase(); if(existing.has(key))return false;existing.add(key);return true; });
  const colors: Record<string, string> = { 'أسود': '#171717', 'أبيض': '#ffffff', 'أحمر': '#dc2626', 'أزرق': '#2563eb', 'أخضر': '#15803d', 'بيج': '#d6c4a4', 'وردي': '#ec4899' };
  return { ...group, options: [...group.options, ...added.map((label, i) => ({
    label: { ar: language==='ar'?label:'', en: language==='en'?label:'' }, value: group.option_type === 'color' ? colors[label] || '#64748b' : group.option_type === 'image' ? '' : label,
    price: null, price_modifier: 0, stock: null, manage_stock: false, in_stock: true,
    is_default: false, sort_order: group.options.length + i,
  }))] };
}

export async function loadVariantEditor(db: any, productId: string) {
  const {data, error} = await db.rpc('get_product_variant_editor', {p_product_id: productId});
  if (error) throw error;
  return { revision: data.revision as number, variants: (data.variants || []).map((group: any) => ({
    ...group, isExpanded: true, options: group.variant_options || [],
  })) as VariantEditorGroup[] };
}

export async function saveVariantEditor(db: any, productId: string, variants: VariantEditorGroup[], revision: number | null) {
  if (revision === null) throw new Error('انتظر تحميل خيارات المنتج قبل الحفظ.');
  validateVariantEditor(variants);
  const {data, error} = await db.rpc('save_product_variant_editor', {
    p_product_id: productId, p_variants: variants, p_expected_revision: revision,
  });
  if (error) throw error;
  return data as {revision: number};
}

export function validateVariantEditor(groups: VariantEditorGroup[]) {
  if(groups.length>30)throw new Error('الحد الأقصى 30 مجموعة خيارات.');
  groups.forEach((group,i)=>{
    const name=group.name.ar?.trim()||group.name.en?.trim();
    if(!name)throw new Error(`اكتب اسم مجموعة الخيارات رقم ${i+1}.`);
    if(!group.options.length)throw new Error(`أضف خيارًا إلى مجموعة «${name}» أو احذف المجموعة الفارغة.`);
    if(group.options.length>300)throw new Error(`الحد الأقصى 300 خيار في مجموعة «${name}».`);
    group.options.forEach((option,j)=>{
      const label=option.label.ar?.trim()||option.label.en?.trim();
      if(!label)throw new Error(`اكتب اسم الخيار رقم ${j+1} في مجموعة «${name}».`);
      for(const field of ['price','price_modifier','stock','stock_quantity'] as const){
        const value=option[field];
        if(value==null)continue;
        const stock=field==='stock'||field==='stock_quantity';
        if(!Number.isFinite(value)||(field!=='price_modifier'&&value<0)||(stock&&!Number.isInteger(value)))
          throw new Error(`القيمة غير صالحة في «${name} / ${label}»: ${stock?'المخزون يجب أن يكون عددًا صحيحًا غير سالب':'راجع السعر وفرق السعر'}.`);
      }
    });
  });
}

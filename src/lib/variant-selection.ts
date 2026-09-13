export function needsVariantSelection(
    groups: { id: string; required: boolean; variant_options: { id: string }[] }[],
    selections: { variantId: string; optionId: string }[],
    confirmed = false,
): boolean {
    const missingRequired = groups.some(group => group.required && !selections.some(selected =>
        selected.variantId === group.id && group.variant_options.some(option => option.id === selected.optionId)));
    return missingRequired || (!confirmed && selections.length === 0 && groups.some(group => group.variant_options.length > 0));
}

export function availableVariantOption(option: { in_stock?: boolean; manage_stock?: boolean; stock?: number | null }, ignoreStock = false): boolean {
    return ignoreStock || (option.in_stock !== false && !(option.manage_stock && option.stock != null && option.stock <= 0));
}

export function defaultVariantOption<T extends { is_default?: boolean; in_stock?: boolean; manage_stock?: boolean; stock?: number | null }>(options: T[], ignoreStock = false): T | undefined {
    const available = options.filter(option => availableVariantOption(option, ignoreStock));
    return available.find(option => option.is_default) || (available.length === 1 ? available[0] : undefined);
}

export function variantUnitPrice(base: number, options: {price?: number | null; price_modifier?: number | null}[]): number {
    return options.reduce((price, option) => price + (option.price != null ? Number(option.price) - base : Number(option.price_modifier || 0)), base);
}

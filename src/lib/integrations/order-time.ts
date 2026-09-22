/** Sheet dates represent the order's creation instant in the store's IANA time zone.
 * Never use the server's local zone or a fixed UTC offset (Cairo observes DST).
 */
export function formatOrderTimeForSheet(createdAt: string, storeTimeZone?: string | null): string {
    if (!createdAt || !/(Z|[+-]\d{2}:?\d{2})$/i.test(createdAt)) {
        throw new Error('Order creation time must include its UTC offset');
    }
    const instant = new Date(createdAt);
    if (!Number.isFinite(instant.getTime())) throw new Error('Invalid order creation time');
    let timeZone = storeTimeZone?.trim() || 'Africa/Cairo';
    try { new Intl.DateTimeFormat('en-US', { timeZone }).format(instant); }
    catch { timeZone = 'Africa/Cairo'; }
    return instant.toLocaleString('en-US', { timeZone });
}

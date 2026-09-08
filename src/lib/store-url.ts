export const STORE_ROOT_DOMAIN = 'orderlyshops.com';
export const RESERVED_STORE_SLUGS = ['www', 'app', 'api', 'admin', 'dashboard', 'cdn', 'static', 'assets', 'public', 'domains', 'mail', 'smtp', 'ftp', 'supabase'];

export function isValidStoreSlug(slug: string): boolean {
    return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug) && !RESERVED_STORE_SLUGS.includes(slug);
}

export function getStorefrontUrl(slug: string): string {
    return `https://${slug}.${STORE_ROOT_DOMAIN}`;
}

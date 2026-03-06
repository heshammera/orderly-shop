export type VideoPlatform = 'youtube' | 'vimeo' | 'dailymotion' | 'upload' | 'other';

export interface ParsedVideo {
    platform: VideoPlatform;
    id: string;
    thumbnailUrl?: string;
    originalUrl: string;
}

/**
 * Extracts the video ID and platform from a given URL
 */
export function parseVideoUrl(url: string | null | undefined): ParsedVideo {
    if (!url) {
        return { platform: 'other', id: '', originalUrl: '' };
    }

    // YouTube: match various forms of YouTube URLs
    // e.g. youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const ytMatch = url.match(youtubeRegex);
    if (ytMatch && ytMatch[1]) {
        return {
            platform: 'youtube',
            id: ytMatch[1],
            thumbnailUrl: `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`, // Default high quality
            originalUrl: url
        };
    }

    // Vimeo: match vimeo.com/ID or player.vimeo.com/video/ID
    const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch && vimeoMatch[1]) {
        return {
            platform: 'vimeo',
            id: vimeoMatch[1],
            // Note: Vimeo thumbnail fetching typically requires an API call to their open-embed endpoint
            // We can't generate it purely statically reliably without an API key for high-res, 
            // but we can return the ID. A fallback is needed unless fetched server-side.
            originalUrl: url
        };
    }

    // Dailymotion: match dailymotion.com/video/ID or dai.ly/ID
    const dailymotionRegex = /(?:dailymotion\.com\/(?:video|hub)|dai\.ly)\/([a-zA-Z0-9]+)/i;
    const dmMatch = url.match(dailymotionRegex);
    if (dmMatch && dmMatch[1]) {
        return {
            platform: 'dailymotion',
            id: dmMatch[1],
            thumbnailUrl: `https://www.dailymotion.com/thumbnail/video/${dmMatch[1]}`,
            originalUrl: url
        };
    }

    // Check if it's an uploaded Supabase URL or general mp4/webm file
    if (url.includes('supabase.co') && url.includes('/storage/v1/object/public/')) {
        return {
            platform: 'upload',
            id: url,
            originalUrl: url
        };
    }

    if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg')) {
        return {
            platform: 'upload',
            id: url,
            originalUrl: url
        };
    }

    return {
        platform: 'other',
        id: url,
        originalUrl: url
    };
}

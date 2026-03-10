import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Orderly',
        short_name: 'Orderly',
        description: 'Build and manage your social commerce store with AI-powered tools',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        icons: [
            {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable any' as any,
            },
            {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable any' as any,
            },
        ],
    }
}

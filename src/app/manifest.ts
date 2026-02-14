import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Social Commerce Hub',
        short_name: 'StoreHub',
        description: 'Your premium shopping experience',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
            {
                src: '/icons/icon.svg',
                sizes: '192x192',
                type: 'image/svg+xml',
            },
            {
                src: '/icons/icon.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
            },
        ],
    }
}

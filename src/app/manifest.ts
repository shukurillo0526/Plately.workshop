import type { MetadataRoute } from 'next';
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Plately Workshop - Merchant Portal',
    short_name: 'Plately Workshop',
    description: 'B2B merchant portal for the Plately food ecosystem',
    start_url: '/',
    display: 'standalone',
    background_color: '#0D1117',
    theme_color: '#0D1117',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

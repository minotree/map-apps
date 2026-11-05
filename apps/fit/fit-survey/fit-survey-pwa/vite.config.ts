import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'Field Survey PWA',
        short_name: 'Field Survey',
        start_url: '/',
        display: 'standalone',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.vworld\.kr\/req\/wmts\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'vworld-map-tiles-v1',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: '127.0.0.1',
    port: 5175,
    strictPort: true,
    proxy: {
      // /api-vworld 경로로 들어오는 요청을 Vworld API 서버로 전달
      '/api-vworld': {
        target: 'https://api.vworld.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-vworld/, ''),
      },
    },
  },
});


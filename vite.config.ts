import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages deploys this app at https://<user>.github.io/oihana-money/
// so all asset paths must resolve under that sub-path.
const BASE = '/oihana-money/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Money School',
        short_name: 'Money',
        description: 'Learn money + investing the way you learn a language: small bites, every day.',
        theme_color: '#059669',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell + static assets for offline use
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // Don't try to cache the dev server's /@vite/* paths
        navigateFallback: BASE + 'index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        // Enable the service worker in dev so we can test install + update flows
        enabled: true,
        type: 'module',
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
})

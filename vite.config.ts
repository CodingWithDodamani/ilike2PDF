import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// PWA (Workbox precache) is heavy and can stall the resource-constrained dev
// sandbox during build. Disable it for sandbox preview builds via DISABLE_PWA=1.
// Production deploy builds keep PWA enabled (flag unset).
const disablePWA = process.env.DISABLE_PWA === '1'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  worker: { format: 'es' },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    minify: 'esbuild',
    sourcemap: false,
    reportCompressedSize: false,
    rollupOptions: {
      maxParallelFileOps: 2,
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('pdfjs-dist')) return 'pdfjs'
            if (id.includes('pdf-lib')) return 'pdflib'
            if (id.includes('framer-motion')) return 'motion'
            if (id.includes('react-markdown') || id.includes('remark') || id.includes('micromark') || id.includes('mdast') || id.includes('hast')) return 'markdown'
            if (id.includes('qrcode') || id.includes('jsqr')) return 'qr'
            if (id.includes('kokoro-js') || id.includes('onnxruntime') || id.includes('transformers')) return 'kokoro'
            if (id.includes('jszip')) return 'jszip'
            if (id.includes('react-router')) return 'router'
            if (id.includes('react') || id.includes('scheduler')) return 'react'
          }
        },
      },
    },
  },
  plugins: [
    react(),
    ...(disablePWA ? [] : [VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'cdn-cache', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
      manifest: {
        name: 'iLike2PDF — Private Document Tools',
        short_name: 'iLike2PDF',
        description: 'Free client-side PDF, image & QR tools. Zero uploads, 100% private. Most tools work offline.',
        theme_color: '#e11d48',
        background_color: '#0b0b14',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        categories: ['productivity', 'utilities'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Merge PDF', url: '/tool/merge-pdf' },
          { name: 'Compress Image', url: '/tool/compress-image' },
          { name: 'QR Generator', url: '/tool/qr-generator' },
        ],
      },
    })]),
  ],
})

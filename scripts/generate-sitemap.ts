import { SitemapStream, streamToPromise } from 'sitemap'
import { createWriteStream } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')

const HOSTNAME = 'https://ilike2pdf.pages.dev'

// All tool slugs from src/lib/tools.ts (keep in sync)
const TOOL_SLUGS = [
  'image-to-pdf', 'pdf-to-image', 'compress-pdf', 'merge-pdf', 'split-pdf', 'rotate-pdf',
  'watermark-pdf', 'sign-pdf', 'pdf-to-text', 'organize-pdf', 'markdown-to-pdf', 'compare-pdf',
  'unlock-pdf', 'protect-pdf', 'extract-images', 'delete-pages', 'page-numbers', 'extract-pages',
  'pdf-metadata', 'pdf-page-size', 'pdf-crop', 'pdf-bookmarks', 'pdf-annotate', 'pdf-to-word',
  'pdf-compress-advanced',
  'resize-image', 'compress-image', 'convert-image', 'crop-image', 'passport-photo',
  'image-to-base64', 'remove-background', 'blur-background', 'watermark-image', 'color-picker',
  'image-metadata', 'collage-maker', 'image-exif-editor', 'meme-generator', 'image-compress-batch',
  'background-remover', 'image-upscaler', 'heic-converter', 'color-palette', 'photo-to-sketch',
  'image-border', 'image-ocr', 'favicon-generator',
  'qr-generator', 'qr-scanner', 'qr-batch', 'qr-customizer', 'barcode-generator',
  'wifi-qr', 'vcard-qr', 'qr-to-pdf', 'qr-scanner-enhanced',
  'file-size', 'document-size', 'base64', 'text-counter', 'hash-generator', 'age-calculator',
  'text-to-speech', 'currency-converter', 'unit-converter', 'json-formatter', 'password-generator',
  'timestamp-converter', 'base-converter', 'lorem-ipsum', 'markdown-preview', 'color-converter',
  'regex-tester', 'uuid-generator', 'dice-roller', 'random-number', 'tip-calculator',
  'bmi-calculator', 'loan-calculator', 'roman-numeral', 'scientific-calculator', 'text-diff',
  'csv-viewer', 'css-gradient-generator', 'box-shadow-generator', 'svg-to-png', 'json-csv',
  'stopwatch', 'cron-generator', 'currency-chart', 'color-blindness', 'text-to-handwriting',
  'heatmap-generator',
]

const POPULAR_SLUGS = new Set([
  'image-to-pdf', 'pdf-to-image', 'compress-pdf', 'merge-pdf', 'split-pdf', 'rotate-pdf',
  'watermark-pdf', 'sign-pdf', 'pdf-to-text', 'organize-pdf', 'markdown-to-pdf', 'compare-pdf',
  'unlock-pdf', 'protect-pdf', 'extract-images', 'delete-pages', 'page-numbers', 'extract-pages',
  'pdf-metadata', 'pdf-page-size', 'pdf-crop', 'pdf-bookmarks', 'pdf-annotate', 'pdf-to-word',
  'resize-image', 'compress-image', 'convert-image', 'crop-image', 'passport-photo',
  'image-to-base64', 'remove-background', 'blur-background', 'watermark-image', 'color-picker',
  'image-metadata', 'collage-maker', 'background-remover',
  'qr-generator', 'qr-scanner', 'qr-batch', 'qr-customizer',
  'currency-converter', 'unit-converter', 'json-formatter', 'password-generator',
  'timestamp-converter', 'base-converter', 'json-csv',
])

async function generateSitemap() {
  const smStream = new SitemapStream({ hostname: HOSTNAME })
  const writeStream = createWriteStream(resolve(__dirname, '../dist/sitemap.xml'))

  smStream.pipe(writeStream)

  // Static routes
  const staticRoutes = [
    { url: '/', changefreq: 'daily', priority: 1.0 },
    { url: '/category/pdf', priority: 0.9 },
    { url: '/category/image', priority: 0.9 },
    { url: '/category/qr', priority: 0.9 },
    { url: '/category/utility', priority: 0.9 },
    { url: '/about', priority: 0.7 },
    { url: '/privacy', priority: 0.7 },
    { url: '/terms', priority: 0.7 },
    { url: '/contact', priority: 0.7 },
    { url: '/faq', priority: 0.8 },
    { url: '/changelog', priority: 0.6 },
    { url: '/shortcuts', priority: 0.5 },
    { url: '/accessibility', priority: 0.5 },
    { url: '/offline-guide', priority: 0.5 },
    { url: '/pwa-install', priority: 0.5 },
    { url: '/licenses', priority: 0.5 },
  ]

  staticRoutes.forEach((route) => smStream.write(route))

  // Tool routes
  TOOL_SLUGS.forEach((slug) => {
    smStream.write({
      url: `/tool/${slug}`,
      priority: POPULAR_SLUGS.has(slug) ? 0.85 : 0.75,
      changefreq: 'monthly',
    })
  })

  smStream.end()
  await streamToPromise(smStream)
  console.log('sitemap.xml generated at dist/sitemap.xml')
}

generateSitemap().catch(console.error)

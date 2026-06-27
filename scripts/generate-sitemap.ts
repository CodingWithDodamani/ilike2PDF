import { SitemapStream, streamToPromise } from 'sitemap'
import { createWriteStream } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')

const HOSTNAME = 'https://snappdf.pages.dev'

// Tool slugs from src/lib/tools.ts
const TOOL_SLUGS = [
  'image-to-pdf', 'pdf-to-image', 'compress-pdf', 'merge-pdf', 'split-pdf', 'rotate-pdf',
  'watermark-pdf', 'sign-pdf', 'pdf-to-text', 'organize-pdf', 'markdown-to-pdf', 'compare-pdf',
  'unlock-pdf', 'protect-pdf', 'extract-images', 'delete-pages', 'page-numbers', 'extract-pages',
  'pdf-metadata', 'pdf-page-size',
  'resize-image', 'compress-image', 'convert-image', 'crop-image', 'passport-photo',
  'image-to-base64', 'remove-background', 'blur-background', 'watermark-image',
  'color-picker', 'image-metadata', 'collage-maker',
  'qr-generator', 'qr-scanner', 'qr-batch',
  'file-size', 'document-size', 'base64', 'text-counter', 'hash-generator',
]

const POPULAR_SLUGS = new Set([
  'image-to-pdf', 'pdf-to-image', 'compress-pdf', 'merge-pdf', 'split-pdf', 'rotate-pdf',
  'watermark-pdf', 'sign-pdf', 'pdf-to-text', 'organize-pdf', 'markdown-to-pdf', 'compare-pdf',
  'unlock-pdf', 'protect-pdf', 'extract-images', 'delete-pages', 'page-numbers', 'extract-pages',
  'pdf-metadata', 'pdf-page-size',
  'resize-image', 'compress-image', 'convert-image', 'crop-image', 'passport-photo',
  'image-to-base64', 'remove-background', 'blur-background', 'watermark-image',
  'color-picker', 'image-metadata', 'collage-maker',
  'qr-generator', 'qr-scanner', 'qr-batch',
  'file-size', 'document-size', 'base64', 'text-counter', 'hash-generator',
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
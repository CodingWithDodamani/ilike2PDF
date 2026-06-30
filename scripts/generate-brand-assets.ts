import sharp from 'sharp'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const ROOT = join(import.meta.dirname, '..')
const PUBLIC = join(ROOT, 'public')
const ICONS_DIR = join(PUBLIC, 'icons')
if (!existsSync(ICONS_DIR)) mkdirSync(ICONS_DIR, { recursive: true })

const SOURCE = join(PUBLIC, 'iLike2PDF.png')

async function run() {
  if (!existsSync(SOURCE)) {
    console.error('❌ Place your logo as "logo-source.png" in the project root, then re-run.')
    process.exit(1)
  }

  console.log('🎨 Converting logo to all brand assets...\n')

  // Full logo (for README, social, etc.) - keep original aspect ratio, max 800px
  await sharp(SOURCE)
    .resize(800, 800, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(PUBLIC, 'ilike2pdf-logo.png'))
  console.log('✅ ilike2pdf-logo.png (800×800)')

  // PWA icons (icon only, square crop)
  for (const [size, name] of [[192, 'icon-192.png'], [512, 'icon-512.png']] as const) {
    await sharp(SOURCE)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(join(ICONS_DIR, name))
    console.log(`✅ ${name} (${size}×${size})`)
  }

  // Maskable icon (with padding for safe zone)
  const maskSize = 512
  const pad = Math.round(maskSize * 0.1)
  const inner = maskSize - pad * 2
  const maskBuffer = await sharp(SOURCE)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
  await sharp({
    create: {
      width: maskSize,
      height: maskSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: maskBuffer, left: pad, top: pad }])
    .png()
    .toFile(join(ICONS_DIR, 'icon-512-maskable.png'))
  console.log('✅ icon-512-maskable.png (512×512)')

  // Apple touch icon
  await sharp(SOURCE)
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(ICONS_DIR, 'apple-touch-icon.png'))
  console.log('✅ apple-touch-icon.png (180×180)')

  // Favicon (SVG wrapping the PNG as base64 for best quality)
  const favPng = await sharp(SOURCE)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  const b64 = favPng.toString('base64')
  const svgFav = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <image href="data:image/png;base64,${b64}" width="64" height="64"/>
</svg>`
  writeFileSync(join(PUBLIC, 'favicon.svg'), svgFav)
  console.log('✅ favicon.svg')

  // OG Image (1200×630) - crop just the document icon from source, place on dark background
  const sourceMeta = await sharp(SOURCE).metadata()
  const sw = sourceMeta.width || 1000
  const sh = sourceMeta.height || 1000

  // Crop just the document icon (top ~60% of source, centered horizontally)
  const iconCropH = Math.round(sh * 0.60)
  const iconCropW = Math.round(sw * 0.60)
  const iconCropX = Math.round((sw - iconCropW) / 2)
  const iconCropY = 0

  // Remove white background: threshold then make white transparent
  const logoForOg = await sharp(SOURCE)
    .extract({ left: iconCropX, top: iconCropY, width: iconCropW, height: iconCropH })
    .resize(380, 380, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Make white/near-white pixels transparent
  const pixels = logoForOg.data
  const channels = logoForOg.info.channels
  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2]
    if (r > 240 && g > 240 && b > 240) {
      pixels[i + 3] = 0
    }
  }

  const ogLogoBuf = await sharp(Buffer.from(pixels), {
    raw: { width: logoForOg.info.width, height: logoForOg.info.height, channels }
  }).png().toBuffer()

  const ogW = 1200, ogH = 630
  const logoX = 80, logoY = 75

  // Dark background with orbs
  const ogBg = await sharp({
    create: {
      width: ogW,
      height: ogH,
      channels: 4,
      background: { r: 26, g: 26, b: 46, alpha: 1 }
    }
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${ogW}" height="${ogH}">
            <defs>
              <radialGradient id="orb1" cx="12%" cy="35%" r="28%">
                <stop offset="0%" stop-color="#e11d48" stop-opacity="0.18"/>
                <stop offset="100%" stop-color="#e11d48" stop-opacity="0"/>
              </radialGradient>
              <radialGradient id="orb2" cx="88%" cy="60%" r="22%">
                <stop offset="0%" stop-color="#f97316" stop-opacity="0.12"/>
                <stop offset="100%" stop-color="#f97316" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <rect width="${ogW}" height="${ogH}" fill="url(#orb1)"/>
            <rect width="${ogW}" height="${ogH}" fill="url(#orb2)"/>
          </svg>`
        ),
        top: 0,
        left: 0
      },
      {
        input: ogLogoBuf,
        top: logoY,
        left: logoX
      },
      {
        input: Buffer.from(
          `<svg width="${ogW}" height="${ogH}">
            <text x="600" y="260" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="82" fill="white" text-anchor="middle">iLike2PDF</text>
            <text x="600" y="315" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="26" fill="rgba(255,255,255,0.55)">40+ tools · 100% private · works offline</text>
            <g transform="translate(600, 355)">
              <rect x="0" y="0" width="118" height="36" rx="18" fill="rgba(225,29,72,0.12)" stroke="rgba(225,29,72,0.25)" stroke-width="1"/>
              <text x="14" y="24" font-family="system-ui, sans-serif" font-weight="600" font-size="15" fill="#fb7185">No uploads</text>
              <rect x="130" y="0" width="122" height="36" rx="18" fill="rgba(225,29,72,0.12)" stroke="rgba(225,29,72,0.25)" stroke-width="1"/>
              <text x="144" y="24" font-family="system-ui, sans-serif" font-weight="600" font-size="15" fill="#fb7185">No tracking</text>
              <rect x="264" y="0" width="118" height="36" rx="18" fill="rgba(225,29,72,0.12)" stroke="rgba(225,29,72,0.25)" stroke-width="1"/>
              <text x="278" y="24" font-family="system-ui, sans-serif" font-weight="600" font-size="15" fill="#fb7185">Free forever</text>
              <rect x="394" y="0" width="112" height="36" rx="18" fill="rgba(225,29,72,0.12)" stroke="rgba(225,29,72,0.25)" stroke-width="1"/>
              <text x="408" y="24" font-family="system-ui, sans-serif" font-weight="600" font-size="15" fill="#fb7185">Open source</text>
            </g>
            <rect y="${ogH - 6}" width="${ogW}" height="6" fill="url(#bar)"/>
            <defs>
              <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#e11d48"/>
                <stop offset="100%" stop-color="#f97316"/>
              </linearGradient>
            </defs>
          </svg>`
        ),
        top: 0,
        left: 0
      }
    ])
    .png()
    .toFile(join(PUBLIC, 'og-image.png'))
  console.log('✅ og-image.png (1200×630)')

  console.log('\n✨ All iLike2PDF brand assets generated from your logo!')
}

run().catch((e) => { console.error(e); process.exit(1) })

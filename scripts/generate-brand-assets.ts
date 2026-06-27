import sharp from 'sharp'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'

const ROOT = join(import.meta.dirname, '..')
const PUBLIC = join(ROOT, 'public')
const ICONS_DIR = join(PUBLIC, 'icons')
if (!existsSync(ICONS_DIR)) mkdirSync(ICONS_DIR, { recursive: true })

const RED = '#e11d48'
const ORANGE = '#f97316'
const DARK = '#0b0b14'
const WHITE = '#ffffff'

const SRC_LOGO = join(PUBLIC, 'snappdf_logo_flat_1782547779742.png')

// ─── OG Image Background SVG (1200×630) ───
function ogImageBgSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${DARK}"/>
      <stop offset="1" stop-color="#1a0a14"/>
    </linearGradient>
    <radialGradient id="orb1" cx="15%" cy="40%" r="30%">
      <stop offset="0%" stop-color="${RED}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${RED}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="orb2" cx="85%" cy="55%" r="25%">
      <stop offset="0%" stop-color="${ORANGE}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${ORANGE}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${RED}"/>
      <stop offset="100%" stop-color="${ORANGE}"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#orb1)"/>
  <rect width="1200" height="630" fill="url(#orb2)"/>

  <!-- Grid dots -->
  ${Array.from({ length: 30 }, (_, x) =>
    Array.from({ length: 16 }, (_, y) =>
      `<circle cx="${x * 40 + 20}" cy="${y * 40 + 10}" r="1" fill="rgba(255,255,255,0.03)"/>`
    ).join('\n  ')
  ).join('\n  ')}

  <!-- Brand name -->
  <text x="310" y="240" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="76" fill="${WHITE}">SnapPDF</text>

  <!-- Tagline -->
  <text x="310" y="290" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="28" fill="rgba(255,255,255,0.65)">40+ tools · 100% private · works offline</text>

  <!-- Feature pills -->
  <g transform="translate(310, 330)">
    ${['No uploads', 'No tracking', 'Free forever', 'Open source'].map((feat, i) => {
      const x = i * 175
      return `<rect x="${x}" y="0" width="${feat.length * 11 + 28}" height="36" rx="18" fill="rgba(225,29,72,0.15)" stroke="rgba(225,29,72,0.3)" stroke-width="1"/>
    <text x="${x + 14}" y="24" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="16" fill="#fb7185">${feat}</text>`
    }).join('\n    ')}
  </g>

  <!-- Tool icons (right side) -->
  <g transform="translate(880, 145)">
    ${[
      { emoji: '📄', label: 'PDF Tools', bg: 'rgba(225,29,72,0.12)', border: 'rgba(225,29,72,0.25)' },
      { emoji: '🖼', label: 'Image Tools', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)' },
      { emoji: '📱', label: 'QR Codes', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.25)' },
    ].map((ic, i) => {
      const y = i * 110
      return `<rect x="0" y="${y}" width="90" height="90" rx="20" fill="${ic.bg}" stroke="${ic.border}" stroke-width="1.5"/>
    <text x="45" y="${y + 56}" font-size="38" text-anchor="middle">${ic.emoji}</text>
    <text x="45" y="${y + 108}" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="13" fill="rgba(255,255,255,0.5)" text-anchor="middle">${ic.label}</text>`
    }).join('\n    ')}
  </g>

  <!-- Bottom bar -->
  <rect y="624" width="1200" height="6" fill="url(#bar)"/>
</svg>`
}

async function run() {
  if (!existsSync(SRC_LOGO)) {
    console.error(`❌ Source logo not found at: ${SRC_LOGO}`)
    process.exit(1)
  }

  console.log('🎨 Regenerating all brand assets from approved PNG logo...\n')

  // 1. Generate Favicon (SVG base64 embedded)
  const base64Logo = readFileSync(SRC_LOGO).toString('base64')
  const faviconContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="data:image/png;base64,${base64Logo}" width="512" height="512"/>
</svg>`
  writeFileSync(join(PUBLIC, 'favicon.svg'), faviconContent)
  console.log('✅ favicon.svg (Generated via embedded base64)')

  // 2. Generate PWA Icons
  for (const [size, name] of [[192, 'icon-192.png'], [512, 'icon-512.png']] as const) {
    await sharp(SRC_LOGO).resize(size, size).png().toFile(join(ICONS_DIR, name))
    console.log(`✅ ${name} (${size}×${size})`)
  }

  // 3. Generate Apple Touch Icon (180×180)
  await sharp(SRC_LOGO).resize(180, 180).png().toFile(join(ICONS_DIR, 'apple-touch-icon.png'))
  console.log('✅ apple-touch-icon.png (180×180)')

  // 4. Generate Maskable Icon (512×512, padded inside dark container)
  const maskSize = 512
  const pad = Math.round(maskSize * 0.08)
  const innerSize = maskSize - pad * 2
  const logoResizedBuffer = await sharp(SRC_LOGO).resize(innerSize, innerSize).png().toBuffer()

  const maskBackground = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
      <rect width="512" height="512" fill="${DARK}"/>
    </svg>`
  )
  await sharp(maskBackground)
    .composite([{ input: logoResizedBuffer, top: pad, left: pad }])
    .png()
    .toFile(join(ICONS_DIR, 'icon-512-maskable.png'))
  console.log('✅ icon-512-maskable.png (512×512)')

  // 5. Generate OG Image (1200×630, composite logo onto SVG background)
  const ogBgSvg = ogImageBgSvg()
  const logoOgResizedBuffer = await sharp(SRC_LOGO).resize(220, 220).png().toBuffer()
  await sharp(Buffer.from(ogBgSvg))
    .composite([{ input: logoOgResizedBuffer, top: 125, left: 70 }])
    .png()
    .toFile(join(PUBLIC, 'og-image.png'))
  console.log('✅ og-image.png (1200×630)')

  console.log('\n✨ All brand assets successfully regenerated from the approved flat logo PNG!')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})

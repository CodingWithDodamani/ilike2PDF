# SnapPDF — Private, Browser-First Document Tools

## Project Overview
- **Name**: SnapPDF
- **Goal**: A free, enterprise-grade document utility platform that performs **100% of its work in the browser** — zero uploads, zero tracking, zero accounts. A privacy-first alternative to iLovePDF / SmallPDF / PDF24.
- **Core principles**: Client-side processing · Offline-first · Installable PWA · WCAG 2.2 AA accessibility · Mobile-first · Open source.

## Live URLs
- **Sandbox preview**: served via `wrangler pages dev` on port 3000 (use the GetServiceUrl link from the build session).
- **Production**: deploy to Cloudflare Pages (`npm run deploy`). Replace with the `*.pages.dev` URL after first deploy.

## Tech Stack
- **Build**: Vite 5 + React 18 + TypeScript (strict)
- **Styling**: Tailwind CSS 3 + custom design system (`brand` / `accent` / `ink` palettes, glassmorphism, gradient borders)
- **Animation**: Framer Motion · **Icons**: Lucide
- **PWA**: vite-plugin-pwa (Workbox service worker, offline precache, install prompt, app shortcuts)
- **PDF**: pdf-lib (edit/create) + pdf.js (render/extract)
- **Image**: browser-image-compression, exifr, native Canvas APIs
- **QR**: qrcode (generate) + jsQR (scan)
- **Misc**: Fuse.js (command palette fuzzy search), react-markdown + remark-gfm, JSZip, Web Crypto API

## Completed Features
### 40 Tools across 4 categories
- **PDF (20)**: Merge, Split, Extract Pages, Delete Pages, Rotate, Organize (reorder/rotate/remove), PDF→Image, Compress, PDF→Text, Extract Images, Watermark, Page Numbers, Edit Metadata, Page-Size Converter, Unlock (known password), Protect (AES-GCM container), Compare, Sign (draw/type/upload), Markdown→PDF, Image→PDF.
- **Image (12)**: Resize, Compress, Convert format, Crop, Image→Base64, Remove Background (chroma-key), Blur, Watermark, Color Picker, Image Metadata (EXIF), Passport Photo, Collage Maker.
- **QR (3)**: Generator (text/URL/wifi/vcard/etc.), Scanner (camera/file), Batch generator.
- **Utility (5)**: File-size inspector, Document-size inspector, Base64 encode/decode, Text Counter, Hash Generator (SHA-1/256/384/512 via Web Crypto).

### Platform
- **Premium landing page** — animated hero, category grid, popular tools, features, comparison table, testimonials, open-source/PWA sections, FAQ teaser, footer.
- **Command Palette (Ctrl/⌘ K)** — fuzzy search across all tools and navigation.
- **Smart File Router** — detect dropped file type (PDF/image/QR) and suggest best tools.
- **Theme** — light / dark with persisted preference.
- **Installable PWA** — works fully offline after first visit.


## Functional Entry URIs
| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/category/:cat` | Tool grid for a category (`pdf`, `image`, `qr`, `utility`) with search |
| `/tool/:slug` | A specific tool (e.g. `/tool/merge-pdf`, `/tool/qr-generator`) — invalid slugs render 404 |

| `/about` `/privacy` `/terms` `/contact` | Company / legal pages |
| `/faq` `/changelog` `/shortcuts` `/accessibility` | Help & info pages |
| `/offline-guide` `/pwa-install` `/licenses` | Offline & open-source info |
| `*` | 404 Not Found |

All processing routes accept input via drag-and-drop or file picker. No query parameters are required — files are read locally in-browser.

## Data Architecture
- **Data models**: `ToolDef` (tool registry), `HistoryEntry` (per-action record), `AnalyticsState` (`filesProcessed`, `bytesSaved`, `bytesProcessed`, `toolUsage`, `daily`).
- **Storage services**: **Browser `localStorage` only** — keys `snappdf.history`, `snappdf.analytics`, `snappdf.recentTools`, `snappdf.theme`. No server, no database, no cloud storage.
- **Data flow**: File → read in-memory (FileReader / ArrayBuffer) → processed via WASM/JS libraries → result downloaded via Blob URL. Usage metadata (not file contents) is recorded to localStorage via `trackUsage()`.

## User Guide
1. Open the app (or install it as a PWA for offline use).
2. Pick a tool from the homepage, a category page, or press **Ctrl/⌘ K** to search.
3. Drag a file onto the dropzone (or click to browse).
4. Adjust options, run the tool, and download the result — everything stays on your device.
5. Review your activity in **History** and **Dashboard** (both private and clearable).

## Development
```bash
npm install            # install dependencies
npm run build          # type-check + production build to dist/
pm2 start ecosystem.config.cjs   # serve dist via wrangler pages dev on :3000
curl http://localhost:3000       # smoke test
```

## Deployment (Cloudflare Pages)
- **Platform**: Cloudflare Pages (static SPA + PWA)
- **Build output**: `./dist`
- **Deploy**: `npm run build && npx wrangler pages deploy dist --project-name <project>`
- **Status**: ✅ Builds clean (TypeScript strict, 0 errors), service worker generated, all 40 tools code-split and lazy-loaded.

## Not Yet Implemented / Known Limitations
- **Compress PDF** re-rasterizes pages (flattens selectable text into images) — no text-preserving optimization yet.
- **Protect PDF** wraps the file in an AES-GCM container with a `.snappdf` extension (pdf-lib cannot emit native encrypted PDFs); pair it with **Unlock** to reverse.
- **Remove Background** uses chroma-key thresholding, not ML segmentation.
- **OCR** for scanned/image-only PDFs is not included (PDF→Text extracts embedded text only).
- No multi-language UI (English only at launch).

## Recommended Next Steps
1. Add a Tesseract.js-based OCR tool for image-only PDFs (lazy-loaded to keep bundle small).
2. Replace chroma-key Remove Background with a WASM ML model (e.g. MODNet) behind an opt-in download.
3. Add a `sitemap.xml` generator and per-route meta tags for SEO.
4. Add E2E smoke tests (Playwright) per tool category.
5. Wire a real GitHub repository URL into the footer/contact links.

## Last Updated
June 2026

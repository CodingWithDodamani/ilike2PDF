# iLike2PDF — Private, Browser-First Document Tools

## Project Overview
- **Name**: iLike2PDF
- **Goal**: A free, enterprise-grade document utility platform that performs **100% of its work in the browser** — zero uploads, zero tracking, zero accounts. A privacy-first alternative to iLovePDF / SmallPDF / PDF24.
- **Core principles**: Client-side processing · Offline-first · Installable PWA · WCAG 2.2 AA accessibility · Mobile-first · Open source.

## Live URLs
- **Sandbox preview**: served via `wrangler pages dev` on port 5173 (use the GetServiceUrl link from the build session).
- **Production**: deploy to Cloudflare Pages (`npm run deploy`). Replace with the `*.pages.dev` URL after first deploy.

## Tech Stack
- **Build**: Vite 5 + React 18 + TypeScript (strict)
- **Styling**: Tailwind CSS 3 + custom design system (`brand` / `accent` / `ink` palettes, glassmorphism, gradient borders)
- **Animation**: Framer Motion · **Icons**: Lucide + React Icons (Font Awesome 6)
- **PWA**: vite-plugin-pwa (Workbox service worker, offline precache, install prompt, app shortcuts)
- **PDF**: pdf-lib (edit/create) + pdf.js (render/extract)
- **Image**: browser-image-compression, exifr, native Canvas APIs
- **QR**: qrcode (generate) + jsQR (scan)
- **Misc**: Fuse.js (command palette fuzzy search), react-markdown + remark-gfm, JSZip, Web Crypto API, Tesseract.js (OCR)

## Completed Features
### 98 Tools across 5 categories
- **PDF (25)**: Merge, Split, Extract Pages, Delete Pages, Rotate, Organize, PDF→Image, Compress, PDF→Text, Extract Images, Watermark, Page Numbers, Edit Metadata, Page-Size Converter, Unlock, Protect, Compare, Sign, Markdown→PDF, Image→PDF, Crop, Bookmarks, Annotate, PDF→Word, Advanced Compression.
- **Image (25)**: Resize, Compress, Convert format, Crop, Image→Base64, Remove Background, Watermark, Color Picker, Image Metadata, Passport Photo, Collage Maker, HEIC Converter, Color Palette, Photo to Sketch, Image Border, AI Background Remover, Image Upscaler, Meme Generator, Batch Compressor, EXIF Editor, Signature Maker, Social Media Resizer, Face Blur, Resize to 3.5×4.5cm, Increase Image Size.
- **QR (9)**: Generator, Scanner, Batch generator, Customizer, Barcode Generator, WiFi QR, vCard QR, QR to PDF, Enhanced Scanner.
- **Dev (21)**: Base64 Encode/Decode, Hash Generator (SHA-1/256/384/512), JSON Formatter, Timestamp Converter, Number Base Converter, Lorem Ipsum, Markdown Preview, **Color Converter** (HEX/RGB/HSL/HSV/CMYK with live sliders, 6 color schemes, EyeDropper API, Tailwind class match, color history), Regex Tester, UUID Generator, Scientific Calculator, Text Diff Checker, CSV Viewer, CSS Gradient Generator, Box Shadow Generator, SVG to PNG, Favicon Generator, JSON↔CSV Converter, Cron Generator, Color Blindness Simulator, Heatmap Generator.
- **Utility (18)**: File-size inspector, Document-size inspector, Text Counter, Age Calculator, Text to Speech (3 engines: Browser Native, Kokoro AI, Edge Neural), Currency Converter (170+ currencies), Unit Converter (100+ units), Password Generator, Dice Roller, Random Generator, Tip Calculator, BMI Calculator, Loan/EMI Calculator, Roman Numeral Converter, Image to Text OCR (Tesseract.js, 11 languages), Stopwatch & Timer, Currency Chart, Text to Handwriting.

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
| `/category/:cat` | Tool grid for a category (`pdf`, `image`, `qr`, `dev`, `utility`) with search |
| `/tool/:slug` | A specific tool (e.g. `/tool/merge-pdf`, `/tool/qr-generator`) — invalid slugs render 404 |
| `/about` `/privacy` `/terms` `/contact` | Company / legal pages |
| `/faq` `/changelog` `/shortcuts` `/accessibility` | Help & info pages |
| `/offline-guide` `/pwa-install` `/licenses` | Offline & open-source info |
| `*` | 404 Not Found |

All processing routes accept input via drag-and-drop or file picker. No query parameters are required — files are read locally in-browser.

## Data Architecture
- **Data models**: `ToolDef` (tool registry), `HistoryEntry` (per-action record), `AnalyticsState` (`filesProcessed`, `bytesSaved`, `bytesProcessed`, `toolUsage`, `daily`).
- **Storage services**: **Browser `localStorage` only** — keys `ilike2pdf.history`, `ilike2pdf.analytics`, `ilike2pdf.recentTools`, `ilike2pdf.colorHistory`, `ilike2pdf.theme`. No server, no database, no cloud storage.
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
npm run dev            # start Vite dev server on :5173
npm run build          # type-check + production build to dist/
npm run test           # run Vitest unit tests (56 tests)
npm run test:e2e       # run Playwright E2E tests (100 tests)
npm run lint           # ESLint check
npm run lint:fix       # ESLint auto-fix
npm run format         # Prettier format
```

## Deployment (Cloudflare Pages)
- **Platform**: Cloudflare Pages (static SPA + PWA)
- **Build output**: `./dist`
- **Deploy**: `npm run build && npx wrangler pages deploy dist --project-name <project>`
- **Status**: ✅ Builds clean (TypeScript strict, 0 errors), service worker generated, all 98 tools code-split and lazy-loaded.

## Not Yet Implemented / Known Limitations
- **Compress PDF** re-rasterizes pages (flattens selectable text into images) — no text-preserving optimization yet.
- **Protect PDF** wraps the file in an AES-GCM container with a `.snappdf` extension (pdf-lib cannot emit native encrypted PDFs); pair it with **Unlock** to reverse.
- **Remove Background** uses chroma-key thresholding, not ML segmentation.
- **OCR** for scanned/image-only PDFs is not included (PDF→Text extracts embedded text only).
- No multi-language UI (English only at launch).

## Branding & Identity
iLike2PDF utilizes a custom-designed **Flat Minimalist Aperture** brand logo. The icon represents a PDF document sheet integrated with a camera lens aperture to highlight the "instant snap" capability of client-side offline processing. 

Brand assets are generated programmatically using:
```bash
npm run generate-assets
```
This reads the approved flat logo file (`/public/snappdf_logo_flat_1782547779742.png`) and regenerates:
- Web Tab Favicon (`favicon.svg`) with embedded base64 source vector.
- PWA App Icons (`icon-192.png`, `icon-512.png`, `icon-512-maskable.png`).
- Apple touch icons (`apple-touch-icon.png`).
- OpenGraph preview cards (`og-image.png`) composited onto the dark mesh layout.

## Recommended Next Steps
1. ~~Add a Tesseract.js-based OCR tool for image-only PDFs~~ — Done (Image to Text OCR).
2. ~~Replace chroma-key Remove Background with a WASM ML model~~ — Done (Background Remover AI uses @imgly/background-removal).
3. ~~Add E2E smoke tests (Playwright) per tool category~~ — Done (100 tests passing).
4. ~~Add Vitest unit tests for utility functions and tool logic~~ — Done (56 tests passing).
5. ~~Implement privacy-respecting localStorage analytics via `trackUsage()`~~ — Done.
6. ~~Add ESLint + Prettier for code quality~~ — Done (44 warnings, 0 errors).
7. ~~Add Dev Tools category (21 tools)~~ — Done (JSON, Base64, Hash, Regex, Color Converter, etc.).
8. ~~Enhance Color Converter with HSV, schemes, EyeDropper, Tailwind~~ — Done.
9. Add i18n support for multi-language UI.
10. Add batch processing for more image tools.

## GitHub Repository
- **Remote**: [CodingWithDodamani/ilike2PDF](https://github.com/CodingWithDodamani/ilike2PDF)

## Last Updated
July 2026

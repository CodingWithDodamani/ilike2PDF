import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Shield, Lock, FileText, Mail, HelpCircle, History as HistoryIcon, Keyboard,
  Accessibility as AccessibilityIcon, WifiOff, Download, Scale, ChevronDown,
  Github, Heart, CheckCircle2, Cpu, Zap, Globe, Copy, Check,
} from 'lucide-react'

type PageKey =
  | 'about' | 'privacy' | 'terms' | 'contact' | 'faq' | 'changelog'
  | 'shortcuts' | 'accessibility' | 'offline' | 'pwa' | 'licenses'

const HOSTNAME = 'https://snappdf.pages.dev'

const TITLES: Record<PageKey, { title: string; sub: string; description: string; icon: typeof Shield }> = {
  about: { title: 'About SnapPDF', sub: 'A free, private, browser-first document toolkit.', description: 'Learn about SnapPDF — a free, private, browser-first document toolkit with 40+ tools that run entirely in your browser. No uploads, no tracking, works offline.', icon: Shield },
  privacy: { title: 'Privacy Policy', sub: 'How SnapPDF handles (and doesn’t handle) your data.', description: 'SnapPDF privacy policy — we collect no data, no files are uploaded, no tracking. Your files never leave your device.', icon: Lock },
  terms: { title: 'Terms of Use', sub: 'The simple rules for using SnapPDF.', description: 'Terms of use for SnapPDF — free, open-source document tools provided as-is without warranty.', icon: FileText },
  contact: { title: 'Contact', sub: 'Questions, feedback or bug reports — reach out.', description: 'Contact the SnapPDF team — report bugs, request features, or ask questions via GitHub or email.', icon: Mail },
  faq: { title: 'Frequently Asked Questions', sub: 'Everything you might wonder about SnapPDF.', description: 'SnapPDF FAQ — answers about file privacy, offline use, file size limits, password removal, and browser support.', icon: HelpCircle },
  changelog: { title: 'Changelog', sub: 'What’s new and what’s coming.', description: 'SnapPDF changelog — track new features, improvements, and releases for the privacy-first document toolkit.', icon: HistoryIcon },
  shortcuts: { title: 'Keyboard Shortcuts', sub: 'Work faster with the keyboard.', description: 'SnapPDF keyboard shortcuts — Ctrl/Cmd+K for command palette, Esc to close dialogs, arrow keys to navigate.', icon: Keyboard },
  accessibility: { title: 'Accessibility', sub: 'Our commitment to WCAG 2.2 AA.', description: 'SnapPDF accessibility statement — WCAG 2.2 AA compliant, keyboard operable, sufficient contrast, screen reader support.', icon: AccessibilityIcon },
  offline: { title: 'Offline Guide', sub: 'Use every tool with no connection.', description: 'SnapPDF offline guide — install the PWA and use all 40+ document tools without an internet connection.', icon: WifiOff },
  pwa: { title: 'Install SnapPDF', sub: 'Add SnapPDF to your device like a native app.', description: 'Install SnapPDF as a Progressive Web App on desktop, iOS, or Android for offline access to all tools.', icon: Download },
  licenses: { title: 'Open-Source Licenses', sub: 'The libraries that power SnapPDF.', description: 'SnapPDF open-source licenses — MIT, Apache-2.0, ISC licenses for React, pdf-lib, PDF.js, qrcode, and more.', icon: Scale },
}

function H2({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-bold mt-8 mb-3 first:mt-0">{children}</h2>
}
function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={`text-ink-600 dark:text-ink-300 leading-relaxed mb-4 ${className ?? ''}`}>{children}</p>
}
function UL({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2 mb-4">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 text-ink-600 dark:text-ink-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}

/* ---------------- ABOUT ---------------- */
function About() {
  return (
    <Prose>
      <P>
        SnapPDF is a 100% client-side document utility platform. Every PDF, image and QR-code
        operation runs inside your browser using the Web Platform — there is no server to upload to,
        no account to create, and nothing to track. Your files never leave your device.
      </P>
      <div className="grid sm:grid-cols-3 gap-3 my-6 not-prose">
        {[
          { icon: Cpu, t: '40+ tools', d: 'PDF, image, QR & utility tools in one place.' },
          { icon: Lock, t: 'Zero uploads', d: 'Files are processed locally and stay local.' },
          { icon: Zap, t: 'Offline-first', d: 'Installable PWA that works without a connection.' },
        ].map((c) => (
          <div key={c.t} className="card p-4">
            <c.icon className="h-6 w-6 text-brand-500 mb-2" />
            <p className="font-semibold">{c.t}</p>
            <p className="text-sm text-ink-500">{c.d}</p>
          </div>
        ))}
      </div>
      <H2>Why we built it</H2>
      <P>
        Most “free” online PDF tools quietly upload your documents to a server. For contracts,
        IDs, medical records and financial statements, that is an unnecessary risk. SnapPDF proves
        you don’t need a server at all — modern browsers are powerful enough to do the work safely
        on your machine.
      </P>
      <H2>Our principles</H2>
      <UL items={[
        'Privacy by architecture, not by promise — there is no upload endpoint.',
        'Fast by default — code-split, lazy-loaded, and cached for offline use.',
        'Accessible to everyone — built to WCAG 2.2 AA.',
        'Open and transparent — the source is available for anyone to audit.',
      ]} />
    </Prose>
  )
}

/* ---------------- PRIVACY ---------------- */
function Privacy() {
  return (
    <Prose>
      <div className="card p-4 not-prose mb-6 border-emerald-500/30 bg-emerald-500/5">
        <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <Shield className="h-5 w-5" /> The short version
        </p>
        <p className="text-sm text-ink-600 dark:text-ink-300 mt-1">
          We don’t collect your files, we don’t use analytics or cookies, and nothing you process
          is ever sent to a server. Everything happens in your browser.
        </p>
      </div>
      <H2>What we collect</H2>
      <P>Nothing. SnapPDF has no backend, no database, and no telemetry. There is no account system.</P>
      <H2>Your files</H2>
      <P>
        Files you open are read directly by your browser and processed in memory using JavaScript and
        WebAssembly. They are never transmitted over the network. When you close the tab, they’re gone.
      </P>
      <H2>Local storage</H2>
      <P>
        The only thing SnapPDF stores in your browser’s <code className="font-mono text-brand-500">localStorage</code>
        is your theme preference (light / dark / system). We keep no history of your files and gather no usage
        statistics. Nothing leaves your device.
      </P>
      <H2>Third parties</H2>
      <P>
        Fonts and a few JavaScript libraries are loaded from public CDNs. These providers may see your IP
        address as part of serving those static assets, but receive none of your file content.
      </P>
      <P className="text-sm text-ink-500">Last updated: June 2026.</P>
    </Prose>
  )
}

/* ---------------- TERMS ---------------- */
function Terms() {
  return (
    <Prose>
      <H2>Acceptance</H2>
      <P>By using SnapPDF you agree to these terms. If you don’t agree, please don’t use the service.</P>
      <H2>The service</H2>
      <P>
        SnapPDF is provided free of charge, “as is”, without warranty of any kind. Because all processing
        happens locally in your browser, results may vary depending on your device, browser and the files
        you provide. Always keep backups of important documents.
      </P>
      <H2>Acceptable use</H2>
      <UL items={[
        'Use SnapPDF only for content you own or are authorized to process.',
        'Do not use it to infringe copyright or violate any law.',
        'Do not attempt to misrepresent SnapPDF as your own commercial service without complying with its open-source license.',
      ]} />
      <H2>Limitation of liability</H2>
      <P>
        To the maximum extent permitted by law, SnapPDF and its contributors are not liable for any loss
        of data, profits or other damages arising from use of the tools. You are responsible for verifying
        output before relying on it.
      </P>
      <P className="text-sm text-ink-500">Last updated: June 2026.</P>
    </Prose>
  )
}

/* ---------------- CONTACT ---------------- */
function Contact() {
  return (
    <Prose>
      <P>
        SnapPDF is a community-driven open-source project. The best way to report a bug, request a feature
        or ask a question is through the project repository.
      </P>
      <div className="grid sm:grid-cols-2 gap-3 not-prose my-6">
        <a href="https://github.com" target="_blank" rel="noreferrer" className="card p-5 hover:border-brand-500/50 transition group">
          <Github className="h-7 w-7 text-brand-500 mb-2" />
          <p className="font-semibold group-hover:text-brand-500 transition">Open an issue</p>
          <p className="text-sm text-ink-500">Report bugs or request features on GitHub.</p>
        </a>
        <a href="mailto:hello@snappdf.app" className="card p-5 hover:border-brand-500/50 transition group">
          <Mail className="h-7 w-7 text-brand-500 mb-2" />
          <p className="font-semibold group-hover:text-brand-500 transition">Email us</p>
          <p className="text-sm text-ink-500">hello@snappdf.app</p>
        </a>
      </div>
      <H2>Before you reach out</H2>
      <P>
        Many questions are answered on the <Link to="/faq" className="text-brand-500 hover:underline">FAQ</Link> page.
        For “how do I install the app” questions, see the <Link to="/pwa-install" className="text-brand-500 hover:underline">Install guide</Link>.
      </P>
    </Prose>
  )
}

/* ---------------- FAQ ---------------- */
const FAQS: { q: string; a: ReactNode }[] = [
  { q: 'Are my files uploaded anywhere?', a: 'No. Every tool runs entirely in your browser. There is no server endpoint that receives your files — they never leave your device.' },
  { q: 'Is SnapPDF really free?', a: 'Yes, completely. There are no accounts, no paywalls, no premium tiers and no ads. It is open-source software.' },
  { q: 'Does it work offline?', a: 'Yes. SnapPDF is a Progressive Web App. After your first visit it caches everything needed, so you can install it and use every tool with no connection.' },
  { q: 'How large a file can I process?', a: 'It depends on your device’s available memory rather than any fixed limit. Most phones handle files up to ~50 MB comfortably; desktops can go much higher.' },
  { q: 'Can SnapPDF compress a PDF without losing text?', a: 'Our Compress PDF tool re-rasterizes pages to shrink size, which flattens selectable text into images. For text-preserving optimization, try removing unused pages or images instead.' },
  { q: 'Can it remove a password I don’t know?', a: 'No. The Unlock tool only removes a password you already know — it does not crack encryption. That would be both impractical in a browser and unethical.' },
  { q: 'Do you keep a history of my files?', a: 'No. SnapPDF stores no history and no usage statistics. The only thing saved locally is your theme preference.' },
  { q: 'Which browsers are supported?', a: 'Any modern browser — Chrome, Edge, Firefox and Safari (recent versions). Some advanced features rely on the latest Web APIs.' },
]
function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="grid gap-3">
      {FAQS.map((f, i) => (
        <div key={i} className="card overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="w-full flex items-center justify-between gap-3 p-4 text-left focus-ring"
          >
            <span className="font-semibold">{f.q}</span>
            <ChevronDown className={`h-5 w-5 text-ink-400 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && <div className="px-4 pb-4 text-ink-600 dark:text-ink-300 leading-relaxed">{f.a}</div>}
        </div>
      ))}
    </div>
  )
}

/* ---------------- CHANGELOG ---------------- */
const RELEASES: { v: string; date: string; tag: string; items: string[] }[] = [
  {
    v: '1.0.0', date: 'June 2026', tag: 'Launch',
    items: [
      '40+ tools across PDF, Image, QR and Utility categories.',
      'Installable PWA with full offline support.',
      'Command Palette (Ctrl K) with fuzzy search.',
      'Smart File Router that suggests the best tool for a dropped file.',
      'Light / dark / system themes and WCAG 2.2 AA accessibility.',
    ],
  },
]
function Changelog() {
  return (
    <div className="relative pl-6">
      <div className="absolute left-1.5 top-2 bottom-2 w-px bg-ink-200 dark:bg-ink-800" />
      {RELEASES.map((r) => (
        <div key={r.v} className="relative mb-8">
          <span className="absolute -left-[1.42rem] top-1.5 h-3 w-3 rounded-full bg-brand-500 ring-4 ring-white dark:ring-ink-950" />
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-lg font-bold">v{r.v}</span>
            <span className="badge">{r.tag}</span>
            <span className="text-sm text-ink-500">{r.date}</span>
          </div>
          <UL items={r.items} />
        </div>
      ))}
    </div>
  )
}

/* ---------------- SHORTCUTS ---------------- */
const SHORTCUTS: { keys: string[]; desc: string }[] = [
  { keys: ['Ctrl', 'K'], desc: 'Open the Command Palette' },
  { keys: ['Esc'], desc: 'Close dialogs / palette' },
  { keys: ['↑', '↓'], desc: 'Navigate palette results' },
  { keys: ['Enter'], desc: 'Open the selected tool' },
  { keys: ['Tab'], desc: 'Move between interactive elements' },
  { keys: ['/'], desc: 'Focus search on category pages' },
]
function Shortcuts() {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {SHORTCUTS.map((s, i) => (
        <div key={i} className="card p-4 flex items-center justify-between gap-3">
          <span className="text-ink-600 dark:text-ink-300">{s.desc}</span>
          <span className="flex items-center gap-1">
            {s.keys.map((k) => (
              <kbd key={k} className="px-2 py-1 rounded-md bg-ink-100 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 text-xs font-mono font-semibold">{k}</kbd>
            ))}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ---------------- ACCESSIBILITY ---------------- */
function AccessibilityPage() {
  return (
    <Prose>
      <P>
        SnapPDF is designed to meet <strong>WCAG 2.2 Level AA</strong>. Accessibility isn’t a feature we
        bolt on — it’s a baseline requirement for every page and tool.
      </P>
      <H2>What we’ve done</H2>
      <UL items={[
        'Full keyboard operability — every control is reachable and usable without a mouse.',
        'Visible focus indicators on all interactive elements.',
        'Semantic landmarks (header, nav, main, footer) and proper heading order.',
        'Sufficient color contrast in both light and dark themes.',
        'ARIA labels on icon-only buttons and live regions for status updates.',
        'Respect for prefers-reduced-motion and prefers-color-scheme.',
      ]} />
      <H2>Found a barrier?</H2>
      <P>
        Accessibility is never “done”. If something doesn’t work for you, please
        <Link to="/contact" className="text-brand-500 hover:underline"> let us know</Link> so we can fix it.
      </P>
    </Prose>
  )
}

/* ---------------- OFFLINE ---------------- */
function Offline() {
  return (
    <Prose>
      <P>
        SnapPDF works without an internet connection. Because all tools run locally, the only thing that
        needs to load is the app itself — and after your first visit, it’s cached on your device.
      </P>
      <H2>How to use it offline</H2>
      <div className="grid sm:grid-cols-3 gap-3 not-prose my-6">
        {[
          { n: '1', t: 'Visit once online', d: 'Open SnapPDF while connected so it can cache the app.' },
          { n: '2', t: 'Install (optional)', d: 'Add it to your device for an app-like, offline experience.' },
          { n: '3', t: 'Go offline', d: 'Open it anytime — every tool keeps working.' },
        ].map((s) => (
          <div key={s.n} className="card p-4">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-white font-bold mb-2">{s.n}</span>
            <p className="font-semibold">{s.t}</p>
            <p className="text-sm text-ink-500">{s.d}</p>
          </div>
        ))}
      </div>
      <H2>What needs a connection?</H2>
      <P>
        Only the QR generator’s optional logo-from-URL and any explicitly online actions need a network.
        Core PDF, image and QR processing all work fully offline.
      </P>
      <P className="not-prose">
        <Link to="/pwa-install" className="btn-primary"><Download className="h-4 w-4" /> Install guide</Link>
      </P>
    </Prose>
  )
}

/* ---------------- PWA INSTALL ---------------- */
function Pwa() {
  return (
    <Prose>
      <P>
        SnapPDF is a Progressive Web App, so you can install it like a native app — with its own icon,
        window and full offline support — without any app store.
      </P>
      <H2>Desktop (Chrome / Edge)</H2>
      <UL items={[
        'Look for the install icon in the address bar, or open the browser menu.',
        'Choose “Install SnapPDF”.',
        'Launch it from your dock, taskbar or start menu like any app.',
      ]} />
      <H2>iPhone / iPad (Safari)</H2>
      <UL items={[
        'Tap the Share button.',
        'Scroll down and tap “Add to Home Screen”.',
        'Tap “Add” — SnapPDF now appears on your home screen.',
      ]} />
      <H2>Android (Chrome)</H2>
      <UL items={[
        'Tap the three-dot menu.',
        'Tap “Install app” or “Add to Home screen”.',
        'Confirm to add the icon to your launcher.',
      ]} />
      <div className="card p-4 not-prose bg-brand-500/5 border-brand-500/30">
        <p className="flex items-center gap-2 font-semibold text-brand-600 dark:text-brand-400">
          <Globe className="h-5 w-5" /> Tip
        </p>
        <p className="text-sm text-ink-600 dark:text-ink-300 mt-1">
          When an install prompt is available, SnapPDF shows a one-tap install button automatically.
        </p>
      </div>
    </Prose>
  )
}

/* ---------------- LICENSES ---------------- */
const LIBS: { name: string; license: string; use: string }[] = [
  { name: 'React', license: 'MIT', use: 'UI framework' },
  { name: 'React Router', license: 'MIT', use: 'Client-side routing' },
  { name: 'Vite', license: 'MIT', use: 'Build tooling' },
  { name: 'Tailwind CSS', license: 'MIT', use: 'Styling system' },
  { name: 'Framer Motion', license: 'MIT', use: 'Animations' },
  { name: 'Lucide Icons', license: 'ISC', use: 'Icon set' },
  { name: 'pdf-lib', license: 'MIT', use: 'PDF creation & editing' },
  { name: 'pdf.js', license: 'Apache-2.0', use: 'PDF rendering & text extraction' },
  { name: 'qrcode', license: 'MIT', use: 'QR code generation' },
  { name: 'jsQR', license: 'Apache-2.0', use: 'QR code scanning' },
  { name: 'browser-image-compression', license: 'MIT', use: 'Image compression' },
  { name: 'exifr', license: 'MIT', use: 'EXIF metadata parsing' },
  { name: 'Fuse.js', license: 'Apache-2.0', use: 'Fuzzy search' },
  { name: 'react-markdown', license: 'MIT', use: 'Markdown rendering' },
  { name: 'JSZip', license: 'MIT', use: 'ZIP archive creation' },
]
function Licenses() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(LIBS.map((l) => `${l.name} — ${l.license}`).join('\n')).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div>
      <P>
        SnapPDF stands on the shoulders of incredible open-source projects. We’re grateful to every
        maintainer and contributor. Below are the major libraries we use and their licenses.
      </P>
      <div className="flex justify-end mb-3">
        <button onClick={copy} className="btn-ghost btn-sm">
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />} Copy list
        </button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 dark:bg-ink-900 text-left">
            <tr>
              <th className="p-3 font-semibold">Library</th>
              <th className="p-3 font-semibold">License</th>
              <th className="p-3 font-semibold hidden sm:table-cell">Used for</th>
            </tr>
          </thead>
          <tbody>
            {LIBS.map((l, i) => (
              <tr key={l.name} className={i % 2 ? 'bg-ink-50/50 dark:bg-ink-900/40' : ''}>
                <td className="p-3 font-medium">{l.name}</td>
                <td className="p-3"><span className="badge">{l.license}</span></td>
                <td className="p-3 text-ink-500 hidden sm:table-cell">{l.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-ink-500 mt-4 flex items-center gap-2">
        <Heart className="h-4 w-4 text-rose-500" /> Made with open source.
      </p>
    </div>
  )
}

function Prose({ children }: { children: ReactNode }) {
  return <div className="max-w-none">{children}</div>
}

const RENDERERS: Record<PageKey, () => ReactNode> = {
  about: About,
  privacy: Privacy,
  terms: Terms,
  contact: Contact,
  faq: FAQ,
  changelog: Changelog,
  shortcuts: Shortcuts,
  accessibility: AccessibilityPage,
  offline: Offline,
  pwa: Pwa,
  licenses: Licenses,
}

export default function StaticPage({ page }: { page: string }) {
  const key = (page in TITLES ? page : 'about') as PageKey
  const meta = TITLES[key]
  const Icon = meta.icon
  const Body = RENDERERS[key]

  const url = `${HOSTNAME}/${page}`
  const title = `${meta.title} — SnapPDF`

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={meta.description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:url" content={url} />
        <meta property="og:site_name" content="SnapPDF" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={meta.description} />
      </Helmet>
      <div className="mx-auto max-w-3xl px-5 sm:px-6 py-14">
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <span className="relative grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-glow-sm">
              <span className="absolute inset-0 rounded-3xl bg-shine opacity-30" aria-hidden />
              <Icon className="relative h-7 w-7" />
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">{meta.title}</h1>
          </div>
          <p className="text-ink-500 dark:text-ink-400">{meta.sub}</p>
        </header>
        <Body />
      </div>
    </>
  )
}

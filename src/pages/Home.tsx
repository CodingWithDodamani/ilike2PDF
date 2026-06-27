import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  Shield, WifiOff, UploadCloud, Zap, ArrowRight, Check, X, Star,
  Github, Smartphone, Lock, Sparkles, FileText, Image as ImageIcon, QrCode, Wrench,
  Gauge, MousePointerClick, Quote,
} from 'lucide-react'
import { CATEGORY_META, popularTools, toolsByCategory } from '@/lib/tools'
import { ToolCard } from '@/components/ToolCard'

const HOSTNAME = 'https://snappdf.pages.dev'

export default function Home() {
  const popular = useMemo(() => popularTools(), [])

  const description = 'Merge, split, compress and convert PDFs & images, generate QR codes — 40+ free, private, browser-based tools. No uploads, no tracking, works offline.'

  return (
    <div className="overflow-x-hidden">
      <Helmet>
        <title>SnapPDF — Private, Browser-First Document Tools</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={HOSTNAME} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="SnapPDF — Private, Browser-First Document Tools" />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={HOSTNAME} />
        <meta property="og:site_name" content="SnapPDF" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SnapPDF — Private, Browser-First Document Tools" />
        <meta name="twitter:description" content={description} />
      </Helmet>
      {/* ============ HERO ============ */}
      <section className="relative grain overflow-hidden">
        <div className="absolute inset-0 bg-mesh animate-mesh opacity-70 dark:opacity-100" aria-hidden />
        <div className="absolute inset-0 bg-grid-light dark:bg-grid-dark bg-grid [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)]" aria-hidden />
        <div aria-hidden className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-brand-500/25 blur-[120px]" />
        <div aria-hidden className="absolute top-0 right-0 h-80 w-80 rounded-full bg-accent-500/20 blur-[130px]" />

        {/* Floating particles */}
        <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-brand-400/30"
              style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 25}%` }}
              animate={{ y: [-8, 8, -8], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
            />
          ))}
        </div>

        <div className="relative section pt-12 pb-8 sm:pt-16 sm:pb-12 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center grid">
          {/* Left: copy */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2.5 rounded-full glass px-4 py-2 text-sm font-medium mb-5 shadow-soft"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-ink-700 dark:text-ink-200">No sign-up · No subscription · No catch</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="font-display text-[clamp(1.5rem,5vw,3.25rem)] leading-[1.05] sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tightest text-balance"
            >
              All the PDF essentials.
              <br className="hidden sm:block" />
              <span className="gradient-text">One place. Zero cost.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="max-w-xl mx-auto lg:mx-0 mt-4 text-base leading-relaxed text-ink-600 dark:text-ink-300"
            >
              Merge, split, compress, convert, sign — right in your browser. No sign-up. No subscription. No catch. Just free tools that actually work.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-7"
            >
              <a href="#tools" className="btn-primary btn-lg">Explore tools <ArrowRight className="h-5 w-5" /></a>
              <Link to="/tool/merge-pdf" className="btn-secondary btn-lg">Merge a PDF</Link>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 mt-6 text-sm font-medium text-ink-500 dark:text-ink-400"
            >
              <li className="inline-flex items-center gap-1.5 list-none"><Shield className="h-4 w-4 text-emerald-500" /> No uploads</li>
              <li className="inline-flex items-center gap-1.5 list-none"><WifiOff className="h-4 w-4 text-brand-500" /> Works offline</li>
              <li className="inline-flex items-center gap-1.5 list-none"><Lock className="h-4 w-4 text-accent-500" /> No sign-up</li>
            </motion.ul>
          </div>

          {/* Right: hero illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            <HeroArt />
          </motion.div>
        </div>
      </section>

      {/* ============ CATEGORIES ============ */}
      <section id="tools" className="section py-16 sm:py-20">
        <SectionHeading eyebrow="Browse by category" title="Find the right tool, fast" subtitle="Four focused toolkits covering every everyday document task." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mt-12">
          {(['pdf', 'image', 'qr', 'utility'] as const).map((cat, i) => {
            const meta = CATEGORY_META[cat]
            const count = toolsByCategory(cat).length
            return (
              <motion.div key={cat} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <Link to={`/category/${cat}`} className="group card card-hover p-7 block relative overflow-hidden h-full">
                  <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-300`} />
                  <span className={`relative inline-grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${meta.gradient} text-white shadow-lg group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300`}>
                    <span className="absolute inset-0 rounded-2xl bg-shine opacity-30" aria-hidden />
                    <meta.icon className="relative h-7 w-7" />
                  </span>
                  <h3 className="font-display font-bold text-lg mt-5">{meta.label}</h3>
                  <p className="text-sm text-ink-500 dark:text-ink-400 mt-1.5 leading-relaxed">{meta.description}</p>
                  <p className="text-sm font-semibold text-brand-500 mt-4 inline-flex items-center gap-1.5">
                    {count} tools <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </p>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ============ POPULAR ============ */}
      <section className="section py-16 sm:py-20">
        <SectionHeading
          eyebrow="Trending now"
          title="Most-loved tools"
          subtitle="The fastest way to get things done."
          action={<Link to="/category/pdf" className="btn-secondary btn-md">View all tools <ArrowRight className="h-4 w-4" /></Link>}
        />
        <div className="grid gap-5 sm:grid-cols-2 tl:grid-cols-3 lg:grid-cols-4 mt-12">
          {popular.map((t, i) => <ToolCard key={t.id} tool={t} index={i} />)}
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="relative py-16 sm:py-24">
        <div aria-hidden className="absolute inset-0 bg-grid-light dark:bg-grid-dark bg-grid opacity-60 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000,transparent)]" />
        <div className="relative section">
          <SectionHeading eyebrow="Why SnapPDF" title={<>Engineered for privacy &amp; speed</>} subtitle="A premium experience that never sends your files anywhere." center />
        <div className="grid gap-5 sm:grid-cols-2 tl:grid-cols-3 lg:grid-cols-4 mt-12">
            {[
              { icon: Shield, title: 'Privacy First', desc: 'Files are processed on your device and never uploaded — ever.', grad: 'from-emerald-500 to-teal-500' },
              { icon: WifiOff, title: 'Works Offline', desc: 'Install once and keep working without an internet connection.', grad: 'from-brand-500 to-fuchsia-500' },
              { icon: UploadCloud, title: 'Zero Uploads', desc: 'No servers, no accounts, no cloud — just instant local processing.', grad: 'from-accent-500 to-cyan-500' },
              { icon: Gauge, title: 'Blazing Fast', desc: 'Web Workers and native browser APIs keep everything snappy.', grad: 'from-gold-500 to-orange-500' },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="card p-7 relative overflow-hidden group"
              >
                <div className={`absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br ${f.grad} opacity-[0.07] group-hover:opacity-15 blur-2xl transition-opacity`} />
                <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${f.grad} text-white shadow-lg mb-5`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold text-lg">{f.title}</h3>
                <p className="text-sm text-ink-500 dark:text-ink-400 mt-2 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="section py-16 sm:py-20">
        <SectionHeading eyebrow="How it works" title="Three steps. Zero friction." center />
        <div className="grid md:grid-cols-3 gap-6 mt-12 relative">
          <div aria-hidden className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />
          {[
            { n: '01', icon: MousePointerClick, t: 'Pick a tool', d: 'Choose from 40+ tools or press Ctrl+K to search instantly.' },
            { n: '02', icon: UploadCloud, t: 'Drop your file', d: 'Drag & drop — your file is read locally, never uploaded.' },
            { n: '03', icon: Check, t: 'Download result', d: 'Process and download in seconds. Done, privately.' },
          ].map((s, i) => (
            <motion.div key={s.n} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="relative text-center">
              <div className="relative inline-grid h-24 w-24 place-items-center mx-auto">
                <span className="absolute inset-0 rounded-3xl bg-white dark:bg-ink-900 border border-ink-200/70 dark:border-white/10 shadow-card dark:shadow-card-dark" />
                <s.icon className="relative h-9 w-9 text-brand-500" />
                <span className="absolute -top-2 -right-1 badge-gold">{s.n}</span>
              </div>
              <h3 className="font-display font-bold text-lg mt-6">{s.t}</h3>
              <p className="text-sm text-ink-500 dark:text-ink-400 mt-2 max-w-xs mx-auto leading-relaxed">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ COMPARISON ============ */}
      <section className="section max-w-5xl py-16 sm:py-20">
        <SectionHeading eyebrow="How we compare" title="SnapPDF vs. typical SaaS" center />
        <div className="card overflow-hidden mt-12">
          <table className="w-full text-sm" aria-label="SnapPDF vs typical SaaS comparison">
            <thead>
              <tr className="border-b border-ink-200/60 dark:border-white/10 bg-ink-50/60 dark:bg-ink-850/50">
                <th scope="col" className="text-left p-5 font-semibold text-ink-600 dark:text-ink-300">Feature</th>
                <th scope="col" className="p-5 font-display font-bold text-base gradient-text">SnapPDF</th>
                <th scope="col" className="p-5 font-medium text-ink-500">Typical SaaS</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Files stay on your device', true, false],
                ['Works fully offline', true, false],
                ['No account required', true, false],
                ['No file-size paywall', true, false],
                ['Open source', true, false],
                ['Free forever', true, false],
              ].map(([label, a, b]) => (
                <tr key={label as string} className="border-b border-ink-200/40 dark:border-white/5 last:border-0 hover:bg-ink-50/40 dark:hover:bg-ink-850/30 transition-colors">
                  <td className="p-5 font-medium">{label}</td>
                  <td className="p-5 text-center">
                    {a ? <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-emerald-500/15 mx-auto"><Check className="h-4 w-4 text-emerald-500" /></span>
                       : <X className="h-5 w-5 text-rose-400 mx-auto" />}
                  </td>
                  <td className="p-5 text-center">
                    {b ? <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                       : <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-rose-500/10 mx-auto"><X className="h-4 w-4 text-rose-400" /></span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <Testimonials />

      {/* ============ OPEN SOURCE + PWA ============ */}
      <section className="section py-16 sm:py-20 grid gap-6 lg:grid-cols-2">
        <div className="card p-9 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-brand-500/20 blur-3xl group-hover:bg-brand-500/30 transition-colors" />
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-lg"><Github className="h-6 w-6" /></div>
          <h3 className="font-display text-2xl font-bold mt-5">Proudly open source</h3>
          <p className="text-ink-500 dark:text-ink-400 mt-2.5 leading-relaxed">Built on great libraries like pdf-lib, PDF.js and qrcode. Inspect the code, file issues, contribute.</p>
          <Link to="/licenses" className="btn-secondary btn-md mt-6">View licenses <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="card p-9 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-accent-500/20 blur-3xl group-hover:bg-accent-500/30 transition-colors" />
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-accent-500 to-cyan-500 text-white shadow-lg"><Smartphone className="h-6 w-6" /></div>
          <h3 className="font-display text-2xl font-bold mt-5">Install as an app</h3>
          <p className="text-ink-500 dark:text-ink-400 mt-2.5 leading-relaxed">SnapPDF is a Progressive Web App. Install it on desktop or mobile and use every tool offline.</p>
          <Link to="/pwa-install" className="btn-secondary btn-md mt-6">Install guide <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="section pb-20 sm:pb-28">
        <div className="relative card !rounded-[2rem] overflow-hidden text-center px-6 py-16 sm:py-20">
          <div className="absolute inset-0 bg-mesh animate-mesh opacity-90" aria-hidden />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-brand-600/90 to-accent-600/80" />
          <div className="relative">
            <Sparkles className="h-9 w-9 text-white/90 mx-auto" />
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-4 text-balance">Ready to get started?</h2>
            <p className="text-white/85 mt-3 max-w-lg mx-auto text-lg">Pick a tool and process your first file in seconds — no account, no upload, no cost.</p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <a href="#tools" className="btn-lg bg-white text-brand-700 font-bold rounded-2xl shadow-lg hover:-translate-y-0.5 transition-transform inline-flex items-center gap-2">Browse tools <ArrowRight className="h-5 w-5" /></a>
              <Link to="/faq" className="btn-lg bg-white/15 text-white border border-white/30 backdrop-blur rounded-2xl hover:bg-white/25 transition-colors">Read the FAQ</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function SectionHeading({ eyebrow, title, subtitle, action, center }: { eyebrow: string; title: React.ReactNode; subtitle?: string; action?: React.ReactNode; center?: boolean }) {
  return (
    <div className={center ? 'text-center max-w-2xl mx-auto' : 'flex items-end justify-between gap-6 flex-wrap'}>
      <div className={center ? '' : 'max-w-2xl'}>
        <p className={`eyebrow ${center ? 'justify-center' : ''}`}><span className="h-1 w-1 rounded-full bg-brand-500" />{eyebrow}</p>
        <h2
          className="font-display text-3xl sm:text-[2.5rem] leading-tight font-extrabold tracking-tight mt-3 text-balance"
        >{title}</h2>
        {subtitle && <p className="text-ink-500 dark:text-ink-400 mt-3 text-lg">{subtitle}</p>}
      </div>
      {action && <div className={center ? 'mt-6' : ''}>{action}</div>}
    </div>
  )
}

function HeroArt() {
  return (
    <div className="relative mx-auto w-full max-w-sm aspect-square">
      {/* glow base */}
      <div aria-hidden className="absolute inset-8 rounded-full bg-gradient-to-br from-brand-500/30 to-accent-500/20 blur-3xl" />

      {/* Rotating outer ring */}
      <motion.svg
        aria-hidden viewBox="0 0 400 400"
        className="absolute inset-0 w-full h-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="200" cy="200" r="180" fill="none" stroke="url(#ring-grad)" strokeWidth="0.8" strokeDasharray="4 12" opacity="0.4" />
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="theme('colors.brand.400')" />
            <stop offset="100%" stopColor="theme('colors.accent.400')" />
          </linearGradient>
        </defs>
      </motion.svg>

      {/* Central document card */}
      <motion.div
        animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-52 glass-strong rounded-3xl p-4 shadow-glow gradient-ring"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-gold-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <img src="/snappdf_logo_flat_1782547779742.png" className="h-12 w-12 rounded-xl object-contain shadow-md mb-4" alt="SnapPDF Logo" />
        <div className="h-2.5 w-3/4 rounded-full bg-brand-500/70 mb-2.5" />
        <div className="h-2 w-full rounded-full bg-ink-300/60 dark:bg-ink-600/60 mb-2" />
        <div className="h-2 w-5/6 rounded-full bg-ink-300/50 dark:bg-ink-600/50 mb-2" />
        <div className="h-2 w-2/3 rounded-full bg-ink-300/40 dark:bg-ink-600/40" />
        <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="inline-grid h-4 w-4 place-items-center rounded-full bg-emerald-500/15"><Check className="h-3 w-3" /></span> Done · on your device
        </div>
      </motion.div>

      {/* Orbiting tool chips */}
      {[
        { icon: ImageIcon, grad: 'from-brand-500 to-fuchsia-500', pos: 'top-1 left-2', d: 0, orbit: [-6, 6] },
        { icon: QrCode, grad: 'from-accent-500 to-emerald-500', pos: 'top-8 right-0', d: 1.2, orbit: [8, -8] },
        { icon: Wrench, grad: 'from-gold-500 to-orange-500', pos: 'bottom-5 left-0', d: 0.6, orbit: [-5, 5] },
        { icon: Zap, grad: 'from-rose-500 to-orange-500', pos: 'bottom-1 right-7', d: 1.8, orbit: [7, -7] },
      ].map((c, i) => (
        <motion.div
          key={i}
          animate={{ y: c.orbit }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: c.d }}
          className={`absolute ${c.pos} grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${c.grad} text-white shadow-xl`}
        >
          <span className="absolute inset-0 rounded-2xl bg-shine opacity-30" aria-hidden />
          <c.icon className="relative h-5.5 w-5.5" />
        </motion.div>
      ))}

      {/* Inner dotted ring (static) */}
      <svg aria-hidden viewBox="0 0 400 400" className="absolute inset-0 w-full h-full text-brand-400/25">
        <circle cx="200" cy="200" r="155" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 9" />
      </svg>
    </div>
  )
}

function Testimonials() {
  const items = [
    { name: 'Priya S.', role: 'Product Designer', text: 'Finally a PDF tool that doesn’t upload my client files. Merge & compress are instant — and gorgeous.' },
    { name: 'Marcus T.', role: 'Software Engineer', text: 'I use the hash & base64 utilities daily. Love that it all works offline as a PWA.' },
    { name: 'Aisha K.', role: 'Graduate Student', text: 'Made my passport photo and compressed assignment PDFs in seconds. No sign-up, no ads, no nonsense.' },
  ]
  return (
    <section className="section py-16 sm:py-20">
      <SectionHeading eyebrow="Loved by users" title="What people are saying" center />
      <div className="grid gap-5 sm:grid-cols-3 mt-12">
        {items.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            className="card p-7 relative"
          >
            <Quote className="h-8 w-8 text-brand-500/25 absolute top-6 right-6" />
            <div className="flex gap-0.5 text-gold-400 mb-4">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}</div>
            <p className="text-[15px] leading-relaxed text-ink-700 dark:text-ink-200">“{t.text}”</p>
            <div className="mt-6 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white font-display font-bold text-sm">{t.name[0]}</span>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-ink-500">{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Command, Sun, Moon, Menu, X, Home, FileText, Image as ImageIcon,
  QrCode, Wrench, Shield, WifiOff,
} from 'lucide-react'
import { CommandPalette } from './CommandPalette'
import { getTheme, setTheme, type ThemeMode } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { PwaInstall } from './PwaInstall'

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/category/pdf', label: 'PDF', icon: FileText },
  { to: '/category/image', label: 'Image', icon: ImageIcon },
  { to: '/category/qr', label: 'QR', icon: QrCode },
  { to: '/category/utility', label: 'Tools', icon: Wrench },
]

export function Layout() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setThemeState] = useState<ThemeMode>(getTheme())
  const location = useLocation()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => { setMenuOpen(false); window.scrollTo({ top: 0 }) }, [location.pathname])

  const cycleTheme = () => {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark'
    setTheme(next); setThemeState(next)
  }
  const refreshTheme = useCallback(() => setThemeState(getTheme()), [])
  const isDark = document.documentElement.classList.contains('dark')

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-50 glass border-b border-ink-200/50 dark:border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 h-[4.5rem] flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 font-display font-extrabold text-xl shrink-0 focus-ring rounded-xl">
            <img src="/ilikepdf-logo.png" className="h-10 w-10 rounded-xl object-contain shadow-md" alt="iLikePDF Logo" />
            <span className="tracking-tight">iLike<span className="gradient-text">PDF</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5 ml-6">
            {NAV.map((n) => (
              <NavLink
                key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => cn(
                  'px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5',
                  isActive ? 'bg-brand-500/12 text-brand-600 dark:text-brand-300 shadow-inner-glow dark:shadow-inner-glow-dark' : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800'
                )}
              >
                <n.icon className="h-4 w-4" />{n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-xl border border-ink-200 dark:border-white/10 bg-white/60 dark:bg-ink-850/60 px-3.5 py-2 text-sm text-ink-500 hover:border-brand-400 hover:text-ink-700 dark:hover:text-ink-200 transition focus-ring shadow-sm"
              aria-label="Open command palette"
            >
              <Command className="h-3.5 w-3.5" /> <span className="font-medium">Search</span>
              <kbd className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-ink-100 dark:bg-ink-800">Ctrl+K</kbd>
            </button>
            <button onClick={() => setPaletteOpen(true)} className="sm:hidden btn-ghost btn-sm !p-2" aria-label="Search">
              <Command className="h-5 w-5" />
            </button>
            <button onClick={cycleTheme} className="btn-ghost btn-sm !p-2" aria-label="Toggle theme">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <a href="https://github.com/CodingWithDodamani" target="_blank" rel="noreferrer" className="hidden sm:flex btn-ghost btn-sm !p-2" aria-label="GitHub">
              <img src="https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/github.svg" alt="" className="h-5 w-5" />
            </a>
            <Link to="/category/pdf" className="hidden lg:inline-flex btn-primary btn-sm">Get started</Link>
            <button onClick={() => setMenuOpen((o) => !o)} className="md:hidden btn-ghost btn-sm !p-2" aria-label="Menu">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-ink-200/50 dark:border-white/10"
            >
              <div className="px-4 py-3 grid gap-1">
                {NAV.map((n) => (
                  <NavLink key={n.to} to={n.to} end={n.end}
                    className={({ isActive }) => cn('px-3 py-3 rounded-lg text-sm font-medium flex items-center gap-2', isActive ? 'bg-brand-500/12 text-brand-600 dark:text-brand-300' : 'hover:bg-ink-100 dark:hover:bg-ink-800')}>
                    <n.icon className="h-4 w-4" />{n.label}
                  </NavLink>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-strong border-t border-ink-200/60 dark:border-white/10 pb-[env(safe-area-inset-bottom)]" aria-label="Mobile navigation">
        <div className="grid grid-cols-5">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => cn('flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition', isActive ? 'text-brand-500' : 'text-ink-500 dark:text-ink-400')}>
              {({ isActive }) => (<><n.icon className={cn('h-5 w-5', isActive && 'scale-110')} />{n.label}</>)}
            </NavLink>
          ))}
        </div>
      </nav>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onThemeChange={refreshTheme} />
      <PwaInstall />
    </div>
  )
}

function Footer() {
  const cols = [
    { title: 'PDF', links: [['Merge PDF', '/tool/merge-pdf'], ['Split PDF', '/tool/split-pdf'], ['Compress PDF', '/tool/compress-pdf'], ['Image to PDF', '/tool/image-to-pdf']] },
    { title: 'Image', links: [['Resize', '/tool/resize-image'], ['Compress', '/tool/compress-image'], ['Convert', '/tool/convert-image'], ['Crop', '/tool/crop-image']] },
    { title: 'Product', links: [['About', '/about'], ['FAQ', '/faq'], ['Changelog', '/changelog'], ['Shortcuts', '/shortcuts']] },
    { title: 'Legal', links: [['Privacy', '/privacy'], ['Terms', '/terms'], ['Accessibility', '/accessibility'], ['Licenses', '/licenses']] },
  ]
  const productCol = cols.find((c) => c.title === 'Product')!
  return (
    <footer className="relative border-t border-ink-200/60 dark:border-white/[0.06] mt-16 overflow-hidden">
      <div aria-hidden className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />
      <div aria-hidden className="absolute -bottom-24 left-1/2 -translate-x-1/2 h-64 w-[40rem] rounded-full bg-brand-500/10 blur-[120px]" />
      <div className="relative section py-14">
        <div className="grid gap-10 md:grid-cols-6">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 font-display font-extrabold text-xl">
              <img src="/ilikepdf-logo.png" className="h-10 w-10 rounded-xl object-contain shadow" alt="iLikePDF Logo" />
              iLike<span className="gradient-text">PDF</span>
            </Link>
            <p className="text-sm text-ink-500 dark:text-ink-400 mt-4 max-w-xs leading-relaxed">
              40+ free document tools that run entirely in your browser. Zero uploads. Zero tracking. Works offline.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <span className="badge"><Shield className="h-3 w-3" /> 100% private</span>
              <span className="badge"><WifiOff className="h-3 w-3" /> Installable</span>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <a href="https://github.com/CodingWithDodamani" target="_blank" rel="noreferrer" className="text-ink-400 hover:text-brand-500 transition" aria-label="GitHub">
                <img src="https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/github.svg" alt="" className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/in/halludodamani/" target="_blank" rel="noreferrer" className="text-ink-400 hover:text-brand-500 transition" aria-label="LinkedIn">
                <img src="https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/linkedin.svg" alt="" className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/royal_hudga_hallu777/" target="_blank" rel="noreferrer" className="text-ink-400 hover:text-brand-500 transition" aria-label="Instagram">
                <img src="https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/instagram.svg" alt="" className="h-5 w-5" />
              </a>
              <a href="https://www.youtube.com/@Dodamanicraftschannel" target="_blank" rel="noreferrer" className="text-ink-400 hover:text-brand-500 transition" aria-label="YouTube">
                <img src="https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/youtube.svg" alt="" className="h-5 w-5" />
              </a>
              <a href="https://www.pinterest.com/dodamanihallu75/" target="_blank" rel="noreferrer" className="text-ink-400 hover:text-brand-500 transition" aria-label="Pinterest">
                <img src="https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/pinterest.svg" alt="" className="h-5 w-5" />
              </a>
            </div>
          </div>
          {cols.map((c) => {
            if (c.title === 'Product') {
              return (
                <div key={c.title}>
                  <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400 mb-4">{c.title}</h3>
                  <ul className="space-y-2.5">
                    {productCol.links.map(([label, to]) => (
                      <li key={to}><Link to={to} className="text-sm text-ink-600 dark:text-ink-300 hover:text-brand-500 transition-colors">{label}</Link></li>
                    ))}

                  </ul>
                </div>
              )
            }
            return (
              <div key={c.title}>
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400 mb-4">{c.title}</h3>
                <ul className="space-y-2.5">
                  {c.links.map(([label, to]) => (
                    <li key={to}><Link to={to} className="text-sm text-ink-600 dark:text-ink-300 hover:text-brand-500 transition-colors">{label}</Link></li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
        <div className="mt-12 pt-7 border-t border-ink-200/60 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-ink-500">
          <p>© {new Date().getFullYear()} iLikePDF — Open source &amp; client-side.</p>
          <p className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-emerald-500" /> Your files never leave your device.</p>
        </div>
      </div>
    </footer>
  )
}



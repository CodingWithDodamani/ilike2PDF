import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import Fuse from 'fuse.js'
import { Search, Sun, Moon, Monitor, Home, CornerDownLeft } from 'lucide-react'
import { TOOLS } from '@/lib/tools'
import { setTheme } from '@/lib/storage'
import { cn } from '@/lib/utils'

interface Cmd {
  id: string
  title: string
  subtitle?: string
  group: string
  icon: React.ComponentType<{ className?: string }>
  run: () => void
}

export function CommandPalette({ open, onClose, onThemeChange }: { open: boolean; onClose: () => void; onThemeChange?: () => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragY = useMotionValue(0)
  const dragOpacity = useTransform(dragY, [0, 150], [1, 0])

  const stableOnClose = useCallback(() => onClose(), [onClose])

  const commands = useMemo<Cmd[]>(() => {
    const toolCmds: Cmd[] = TOOLS.map((t) => ({
      id: `tool-${t.id}`,
      title: t.name,
      subtitle: t.short,
      group: 'Tools',
      icon: t.icon,
      run: () => { navigate(`/tool/${t.slug}`); stableOnClose() },
    }))
    const nav: Cmd[] = [
      { id: 'nav-home', title: 'Home', group: 'Navigation', icon: Home, run: () => { navigate('/'); stableOnClose() } },
    ]
    const themes: Cmd[] = [
      { id: 'theme-light', title: 'Theme: Light', group: 'Theme', icon: Sun, run: () => { setTheme('light'); onThemeChange?.(); stableOnClose() } },
      { id: 'theme-dark', title: 'Theme: Dark', group: 'Theme', icon: Moon, run: () => { setTheme('dark'); onThemeChange?.(); stableOnClose() } },
      { id: 'theme-system', title: 'Theme: System', group: 'Theme', icon: Monitor, run: () => { setTheme('system'); onThemeChange?.(); stableOnClose() } },
    ]
    return [...toolCmds, ...nav, ...themes]
  }, [navigate, stableOnClose, onThemeChange])

  const fuse = useMemo(() => new Fuse(commands, {
    keys: ['title', 'subtitle', 'group'],
    threshold: 0.4,
  }), [commands])

  const results = useMemo(() => {
    if (!query.trim()) {
      return commands.filter((c) => c.group === 'Tools').slice(0, 8)
    }
    return fuse.search(query).map((r) => r.item).slice(0, 12)
  }, [query, fuse, commands])

  useEffect(() => { setActive(0) }, [query])
  useEffect(() => {
    if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
      else if (e.key === 'Enter') { e.preventDefault(); results[active]?.run() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, active, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-start justify-center p-4 pt-[12vh]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            style={{ opacity: dragOpacity }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.4}
            onDrag={(_, info) => dragY.set(info.offset.y)}
            onDragEnd={(_, info) => { if (info.offset.y > 100) onClose(); dragY.set(0) }}
            className="relative w-full max-w-xl glass-strong rounded-2xl shadow-glow overflow-hidden touch-pan-y"
            role="dialog" aria-modal="true" aria-label="Command palette"
          >
            <div className="flex items-center gap-3 px-4 border-b border-ink-200/60 dark:border-white/10">
              <Search className="h-5 w-5 text-ink-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools, pages, actions…"
                className="flex-1 bg-transparent py-4 outline-none text-ink-900 dark:text-ink-100 placeholder:text-ink-400"
              />
              <kbd className="hidden sm:inline-block text-xs px-2 py-1 rounded bg-ink-100 dark:bg-ink-800 text-ink-500">ESC</kbd>
            </div>
            <ul className="max-h-[40vh] sm:max-h-[50vh] overflow-y-auto p-2" role="listbox">
              {results.length === 0 && (
                <li className="px-3 py-8 text-center text-sm text-ink-500">No results for “{query}”</li>
              )}
              {results.map((c, i) => {
                const Icon = c.icon
                return (
                  <li key={c.id} role="option" aria-selected={i === active}>
                    <button
                      onMouseEnter={() => setActive(i)}
                      onClick={c.run}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
                        i === active ? 'bg-brand-500/15 text-brand-700 dark:text-brand-200' : 'hover:bg-ink-100 dark:hover:bg-ink-800'
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium truncate">{c.title}</span>
                        {c.subtitle && <span className="block text-xs text-ink-500 truncate">{c.subtitle}</span>}
                      </span>
                      <span className="text-[11px] uppercase tracking-wide text-ink-400">{c.group}</span>
                      {i === active && <CornerDownLeft className="h-4 w-4 text-ink-400" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

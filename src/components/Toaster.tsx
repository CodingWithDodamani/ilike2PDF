import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { uid } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'
interface Toast { id: string; type: ToastType; message: string }

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void
  success: (m: string) => void
  error: (m: string) => void
  info: (m: string) => void
}
const Ctx = createContext<ToastCtx | null>(null)

export function useToast() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useToast must be used within ToasterProvider')
  return c
}

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info }
const COLORS = {
  success: 'text-emerald-500',
  error: 'text-rose-500',
  info: 'text-brand-500',
}

export function ToasterProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const remove = useCallback((id: string) => { timers.current.delete(id); setToasts((t) => t.filter((x) => x.id !== id)) }, [])
  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = uid()
      setToasts((t) => [...t, { id, type, message }])
      timers.current.set(id, setTimeout(() => remove(id), 4500))
    },
    [remove]
  )
  const pause = useCallback((id: string) => { const t = timers.current.get(id); if (t) { clearTimeout(t); timers.current.delete(id) } }, [])
  const resume = useCallback((id: string) => { timers.current.set(id, setTimeout(() => remove(id), 4500)) }, [remove])
  const value: ToastCtx = {
    toast,
    success: (m) => toast(m, 'success'),
    error: (m) => toast(m, 'error'),
    info: (m) => toast(m, 'info'),
  }
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 items-end pointer-events-none" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.type]
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.9 }}
                className="glass-strong pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 shadow-glow max-w-sm w-full sm:w-auto"
                role="status"
                onMouseEnter={() => pause(t.id)}
                onMouseLeave={() => resume(t.id)}
              >
                <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${COLORS[t.type]}`} />
                <p className="text-sm text-ink-800 dark:text-ink-100 flex-1">{t.message}</p>
                <button onClick={() => remove(t.id)} className="shrink-0 grid h-11 w-11 place-items-center rounded-xl text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors focus-ring -mr-2 -mt-1" aria-label="Dismiss">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}

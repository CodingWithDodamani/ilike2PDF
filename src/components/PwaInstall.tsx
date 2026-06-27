import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, X } from 'lucide-react'

interface BIPEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstall() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('snappdf.installDismissed')
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BIPEvent)
      if (!dismissed) setTimeout(() => setShow(true), 8000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setShow(false)
    setDeferred(null)
  }
  const dismiss = () => {
    setShow(false)
    localStorage.setItem('snappdf.installDismissed', '1')
  }

  return (
    <AnimatePresence>
      {show && deferred && (
        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-24 md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-[90] max-w-sm glass-strong rounded-2xl p-4 shadow-glow"
        >
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shrink-0">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Install SnapPDF</p>
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">Add to your home screen for offline access & a faster experience.</p>
              <div className="flex gap-2 mt-3">
                <button onClick={install} className="btn-primary btn-sm">Install</button>
                <button onClick={dismiss} className="btn-ghost btn-sm">Not now</button>
              </div>
            </div>
            <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 grid h-11 w-11 place-items-center rounded-xl text-ink-400 hover:text-ink-600 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors focus-ring -mr-1 -mt-1"><X className="h-4 w-4" /></button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

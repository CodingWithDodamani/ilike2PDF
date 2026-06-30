import { useEffect } from 'react'

interface KeyboardShortcuts {
  onOpenFile?: () => void
  onSaveFile?: () => void
}

/**
 * Global keyboard shortcuts for tool pages.
 * Ctrl/⌘ + O → Open file picker
 * Ctrl/⌘ + S → Save/download result
 */
export function useKeyboardShortcuts({ onOpenFile, onSaveFile }: KeyboardShortcuts) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey
      if (!isMod) return

      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault()
        onOpenFile?.()
      }
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        onSaveFile?.()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onOpenFile, onSaveFile])
}

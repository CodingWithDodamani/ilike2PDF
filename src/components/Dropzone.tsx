import { useCallback, useId, useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DropzoneProps {
  accept?: string[]
  multiple?: boolean
  onFiles: (files: File[]) => void
  label?: string
  hint?: string
  icon?: ReactNode
  compact?: boolean
}

function matches(file: File, accept?: string[]): boolean {
  if (!accept || accept.length === 0 || accept.includes('*/*')) return true
  return accept.some((a) => {
    if (a.includes('/')) {
      if (a.endsWith('/*')) return file.type.startsWith(a.slice(0, -1))
      return file.type === a
    }
    return file.name.toLowerCase().endsWith(a.startsWith('.') ? a : `.${a}`)
  })
}

export function Dropzone({ accept, multiple, onFiles, label, hint, icon, compact }: DropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()

  const handle = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return
      let files = Array.from(fileList).filter((f) => matches(f, accept))
      if (!multiple) files = files.slice(0, 1)
      if (files.length) onFiles(files)
    },
    [accept, multiple, onFiles]
  )

  const acceptAttr = accept && !accept.includes('*/*')
    ? accept.map((a) => (a.includes('/') ? a : a.startsWith('.') ? a : `.${a}`)).join(',')
    : undefined

  return (
    <div>
      <motion.button
        type="button"
        id={id}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files) }}
        className={cn(
          'group w-full rounded-3xl border-2 border-dashed transition-all duration-200 text-center cursor-pointer',
          'border-ink-300 dark:border-ink-700 hover:border-brand-400 dark:hover:border-brand-500',
          compact ? 'p-6' : 'p-6 sm:p-8',
          dragging && 'dropzone-active'
        )}
        aria-describedby={`${id}-hint`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            'grid place-items-center rounded-2xl bg-gradient-to-br from-brand-500/15 to-accent-500/15 text-brand-500 transition-transform group-hover:scale-110',
            compact ? 'h-10 w-10' : 'h-12 w-12'
          )}>
            {icon ?? <UploadCloud className={compact ? 'h-5 w-5' : 'h-6 w-6'} />}
          </div>
          <div>
            <p className={cn('font-semibold text-ink-800 dark:text-ink-100', compact ? 'text-sm' : 'text-sm')}>
              {label ?? 'Drop files here or click to browse'}
            </p>
            <p id={`${id}-hint`} className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
              {hint ?? (multiple ? 'You can select multiple files' : 'Select a file')}
            </p>
          </div>
        </div>
      </motion.button>
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => { handle(e.target.files); e.target.value = '' }}
      />
    </div>
  )
}

import { GripVertical, X, FileText } from 'lucide-react'
import { formatBytes } from '@/lib/utils'

interface Props {
  files: File[]
  onRemove?: (i: number) => void
  onReorder?: (from: number, to: number) => void
  thumbs?: (string | undefined)[]
}

export function FileChips({ files, onRemove, onReorder, thumbs }: Props) {
  return (
    <ul className="grid gap-2">
      {files.map((f, i) => (
        <li
          key={`${f.name}-${i}`}
          draggable={!!onReorder}
          onDragStart={(e) => e.dataTransfer.setData('text/plain', String(i))}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const raw = e.dataTransfer.getData('text/plain')
            if (!raw || !onReorder) return
            const from = Number(raw)
            if (Number.isNaN(from) || from === i) return
            onReorder(from, i)
          }}
          className="flex items-center gap-3 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850 px-3 py-2"
        >
          {onReorder && <GripVertical className="h-4 w-4 text-ink-400 cursor-grab shrink-0" />}
          {thumbs?.[i] ? (
            <img src={thumbs[i]} alt="" className="h-10 w-8 object-cover rounded border border-ink-200 dark:border-ink-700" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500/10 text-brand-500 shrink-0"><FileText className="h-4 w-4" /></span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{f.name}</p>
            <p className="text-xs text-ink-500">{formatBytes(f.size)}</p>
          </div>
          {onRemove && (
            <button onClick={() => onRemove(i)} className="shrink-0 grid h-11 w-11 place-items-center rounded-xl text-ink-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors focus-ring" aria-label={`Remove ${f.name}`}>
              <X className="h-4 w-4" />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

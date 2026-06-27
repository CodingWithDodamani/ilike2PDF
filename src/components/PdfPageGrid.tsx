import { useEffect, useState } from 'react'
import { RotateCw, Check } from 'lucide-react'
import { renderThumbnail } from '@/lib/pdf'
import { cn } from '@/lib/utils'
import { Spinner } from './ui'

interface Props {
  data: ArrayBuffer
  pageCount: number
  selected?: Set<number>
  onToggle?: (page: number) => void
  rotations?: Record<number, number>
  onRotate?: (page: number) => void
  selectable?: boolean
}

export function PdfPageGrid({ data, pageCount, selected, onToggle, rotations, onRotate, selectable }: Props) {
  const [thumbs, setThumbs] = useState<(string | null)[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setThumbs(new Array(pageCount).fill(null))
    ;(async () => {
      const BATCH = 6
      for (let start = 0; start < pageCount; start += BATCH) {
        const end = Math.min(start + BATCH, pageCount)
        const batch = Array.from({ length: end - start }, (_, j) =>
          renderThumbnail(data, start + j + 1).catch(() => null)
        )
        const results = await Promise.all(batch)
        if (cancelled) return
        setThumbs((prev) => {
          const c = [...prev]
          results.forEach((t, j) => { c[start + j] = t })
          return c
        })
      }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [data, pageCount])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 tl:grid-cols-4 lg:grid-cols-5 gap-3">
      {Array.from({ length: pageCount }).map((_, i) => {
        const isSel = selected?.has(i)
        const rot = rotations?.[i] ?? 0
        return (
          <div key={i} className="relative group">
            <button
              type="button"
              onClick={() => onToggle?.(i)}
              disabled={!selectable}
              aria-pressed={isSel}
              className={cn(
                'block w-full rounded-xl overflow-hidden border-2 bg-white dark:bg-ink-850 transition aspect-[3/4]',
                isSel ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-ink-200 dark:border-ink-700',
                selectable && 'hover:border-brand-400 cursor-pointer'
              )}
            >
              {thumbs[i] ? (
                <img src={thumbs[i]!} alt={`Page ${i + 1}`} loading="lazy" decoding="async" className="h-full w-full object-contain" style={{ transform: `rotate(${rot}deg)` }} />
              ) : (
                <span className="grid h-full place-items-center"><Spinner className="h-4 w-4 text-ink-400" /></span>
              )}
            </button>
            <span className="absolute bottom-1 left-1 text-[11px] font-bold px-1.5 py-0.5 rounded bg-ink-900/70 text-white">{i + 1}</span>
            {isSel && <span className="absolute top-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-white"><Check className="h-3 w-3" /></span>}
            {onRotate && (
              <button onClick={() => onRotate(i)} className="absolute top-1.5 left-1.5 grid h-10 w-10 place-items-center rounded-full bg-ink-900/70 text-white sm:invisible sm:group-hover:visible transition focus-ring" aria-label={`Rotate page ${i + 1}`}>
                <RotateCw className="h-4 w-4" />
              </button>
            )}
          </div>
        )
      })}
      {loading && <span className="sr-only">Loading thumbnails…</span>}
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { PDFDocument, degrees } from 'pdf-lib'
import { LayoutGrid, Download, RotateCw, Trash2, GripVertical } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { usePdfFile } from '@/hooks/usePdfFile'
import { renderThumbnail } from '@/lib/pdf'
import { baseName, downloadBlob, bytesToBlob } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { useTouchDnd } from '@/hooks/useTouchDnd'

interface PageItem { orig: number; rot: number; thumb: string | null }

export default function OrganizePdf() {
  const toast = useToast()
  const pdf = usePdfFile()
  const [pages, setPages] = useState<PageItem[]>([])
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState<number | null>(null)
  const move = useCallback((from: number, to: number) => setPages((p) => { const c = [...p]; const [m] = c.splice(from, 1); c.splice(to, 0, m); return c }), [])
  const touch = useTouchDnd({ onReorder: move })

  useEffect(() => {
    if (!pdf.data || !pdf.count) return
    setPages(Array.from({ length: pdf.count }, (_, i) => ({ orig: i, rot: 0, thumb: null })))
    let cancelled = false
    ;(async () => {
      for (let i = 1; i <= pdf.count; i++) {
        try {
          const t = await renderThumbnail(pdf.data!.slice(0), i)
          if (cancelled) return
          setPages((prev) => prev.map((p) => (p.orig === i - 1 ? { ...p, thumb: t } : p)))
        } catch { /* ignore */ }
      }
    })()
    return () => { cancelled = true }
  }, [pdf.data, pdf.count])
  const rotate = (i: number) => setPages((p) => p.map((x, idx) => (idx === i ? { ...x, rot: (x.rot + 90) % 360 } : x)))
  const del = (i: number) => setPages((p) => p.filter((_, idx) => idx !== i))

  const run = async () => {
    if (!pdf.file || !pdf.data || pages.length === 0) { toast.error('No pages to export.'); return }
    setBusy(true)
    try {
      const src = await PDFDocument.load(pdf.data, { ignoreEncryption: true })
      const out = await PDFDocument.create()
      const copied = await out.copyPages(src, pages.map((p) => p.orig))
      copied.forEach((pg, i) => {
        if (pages[i].rot) pg.setRotation(degrees((pg.getRotation().angle + pages[i].rot) % 360))
        out.addPage(pg)
      })
      const bytes = await out.save()
      downloadBlob(bytesToBlob(bytes, 'application/pdf'), `${baseName(pdf.file.name)}-organized.pdf`)
      trackUsage({ toolId: 'organize-pdf', toolName: 'Page Organizer', action: 'Reorganized pages', fileName: pdf.file.name, inputSize: pdf.file.size })
      toast.success('Organized PDF saved.')
    } catch { toast.error('Export failed.') } finally { setBusy(false) }
  }

  if (!pdf.file || !pdf.data) {
    return (
      <div className="grid gap-3">
        <Dropzone accept={['application/pdf']} onFiles={(f) => pdf.load(f[0])} label="Drop a PDF to organize" icon={<LayoutGrid className="h-8 w-8" />} />
        {pdf.error && <p className="text-sm text-rose-500">{pdf.error}</p>}
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <div className="card p-5 flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{pdf.file.name} · {pages.length} pages</p>
        <div className="flex gap-2">
          <button onClick={run} disabled={busy} className="btn-primary btn-sm">{busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Save</button>
          <button onClick={pdf.reset} className="btn-ghost btn-sm">Change</button>
        </div>
      </div>
      <div className="card p-5">
        <p className="text-sm text-ink-500 mb-3">Drag to reorder · rotate or delete with the page buttons.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {pages.map((p, i) => (
            <div
              key={`${p.orig}-${i}`}
              ref={el => touch.register(i, el)}
              draggable
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (drag !== null) move(drag, i); setDrag(null) }}
              onTouchStart={e => touch.onTouchStart(i, e)}
              onTouchMove={e => touch.onTouchMove(i, e)}
              onTouchEnd={e => touch.onTouchEnd(i, e)}
              className={cn(
                'relative group rounded-xl overflow-hidden border-2 bg-white dark:bg-ink-850 aspect-[3/4] select-none',
                touch.dragging === i ? 'border-brand-500 opacity-50' : touch.over === i ? 'border-brand-500' : drag === i ? 'border-brand-500' : 'border-ink-200 dark:border-ink-700'
              )}
            >
              {p.thumb ? <img src={p.thumb} alt={`Page ${p.orig + 1}`} className="h-full w-full object-contain" style={{ transform: `rotate(${p.rot}deg)` }} /> : <span className="grid h-full place-items-center"><Spinner className="h-4 w-4 text-ink-400" /></span>}
              <span className="absolute bottom-1 left-1 text-[11px] font-bold px-1.5 py-0.5 rounded bg-ink-900/70 text-white flex items-center gap-1"><GripVertical className="h-3 w-3" />{p.orig + 1}</span>
              <div className="absolute top-1 right-1 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition">
                <button onClick={() => rotate(i)} className="grid h-10 w-10 place-items-center rounded-full bg-ink-900/70 text-white focus-ring" aria-label="Rotate"><RotateCw className="h-4 w-4" /></button>
                <button onClick={() => del(i)} className="grid h-10 w-10 place-items-center rounded-full bg-rose-500/90 text-white focus-ring" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Grid3x3, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { FileChips } from '@/components/FileChips'
import { Spinner, Field, Segmented } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { canvasToBlob, downloadBlob, fileToImage } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

export default function CollageMaker() {
  const toast = useToast()
  const [files, setFiles] = useState<File[]>([])
  const [cols, setCols] = useState(2)
  const [gap, setGap] = useState(12)
  const [bg, setBg] = useState('#ffffff')
  const [cell, setCell] = useState(400)
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const add = (f: File[]) => setFiles((p) => [...p, ...f])
  const remove = (i: number) => setFiles((p) => p.filter((_, idx) => idx !== i))
  const reorder = (from: number, to: number) => setFiles((p) => { const c = [...p]; const [m] = c.splice(from, 1); c.splice(to, 0, m); return c })

  const render = async () => {
    const c = canvasRef.current; if (!c || files.length === 0) return
    const imgs = await Promise.all(files.map((f) => fileToImage(f)))
    const rows = Math.ceil(imgs.length / cols)
    c.width = cols * cell + gap * (cols + 1)
    c.height = rows * cell + gap * (rows + 1)
    const ctx = c.getContext('2d')!
    ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height)
    imgs.forEach((img, i) => {
      const col = i % cols, row = Math.floor(i / cols)
      const x = gap + col * (cell + gap), y = gap + row * (cell + gap)
      const scale = Math.max(cell / img.naturalWidth, cell / img.naturalHeight)
      const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, cell, cell); ctx.clip()
      ctx.drawImage(img, x + (cell - dw) / 2, y + (cell - dh) / 2, dw, dh)
      ctx.restore()
    })
  }
  useEffect(() => { render() }, [files, cols, gap, bg, cell])

  const run = async () => {
    if (!canvasRef.current || files.length === 0) { toast.error('Add some images first.'); return }
    setBusy(true)
    try {
      const blob = await canvasToBlob(canvasRef.current, 'image/jpeg', 0.92)
      downloadBlob(blob, 'collage.jpg')
      trackUsage({ toolId: 'collage-maker', toolName: 'Collage Maker', action: `Collage of ${files.length}`, files: files.length, outputSize: blob.size })
      toast.success('Collage saved.')
    } catch { toast.error('Failed.') } finally { setBusy(false) }
  }

  return (
    <div className="grid gap-5">
      <Dropzone accept={['image/png', 'image/jpeg', 'image/webp']} multiple onFiles={add} label="Drop images for your collage" icon={<Grid3x3 className="h-8 w-8" />} />
      {files.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card p-5 grid gap-3">
            <FileChips files={files} onRemove={remove} onReorder={reorder} />
          </div>
          <div className="card p-5 grid gap-4">
            <Field label={`Columns: ${cols}`}><input type="range" min={1} max={5} value={cols} onChange={(e) => setCols(+e.target.value)} className="w-full accent-brand-500" /></Field>
            <Field label={`Spacing: ${gap}px`}><input type="range" min={0} max={40} value={gap} onChange={(e) => setGap(+e.target.value)} className="w-full accent-brand-500" /></Field>
            <Field label="Background"><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-10 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-transparent" /></Field>
            <canvas ref={canvasRef} className="block w-full max-h-72 object-contain rounded-xl border border-ink-200 dark:border-ink-700 bg-white mx-auto" />
            <button onClick={run} disabled={busy} className="btn-primary btn-md w-fit">{busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Download collage</button>
          </div>
        </div>
      )}
    </div>
  )
}

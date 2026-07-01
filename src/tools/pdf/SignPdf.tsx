import { useEffect, useRef, useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import { PenLine, Download, Eraser, Type, Upload } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field, Segmented } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { usePdfFile } from '@/hooks/usePdfFile'
import { renderThumbnail } from '@/lib/pdf'
import { baseName, downloadBlob, bytesToBlob, fileToArrayBuffer } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

type Mode = 'draw' | 'type' | 'upload'

export default function SignPdf() {
  const toast = useToast()
  const pdf = usePdfFile()
  const [mode, setMode] = useState<Mode>('draw')
  const [sigDataUrl, setSigDataUrl] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [page, setPage] = useState(0)
  const [thumb, setThumb] = useState<string | null>(null)
  const [pos, setPos] = useState({ x: 0.6, y: 0.1, w: 0.3 })
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  useEffect(() => {
    if (pdf.data) renderThumbnail(pdf.data.slice(0), page + 1, 360).then(setThumb).catch(() => {})
  }, [pdf.data, page])

  // Canvas drawing
  useEffect(() => {
    const c = canvasRef.current
    if (!c || mode !== 'draw') return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#111'
    const pos = (e: PointerEvent) => { const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) } }
    const down = (e: PointerEvent) => { drawing.current = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
    const move = (e: PointerEvent) => { if (!drawing.current) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke() }
    const up = () => { if (drawing.current) { drawing.current = false; setSigDataUrl(c.toDataURL('image/png')) } }
    c.addEventListener('pointerdown', down); c.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
    return () => { c.removeEventListener('pointerdown', down); c.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [mode])

  const clearCanvas = () => { const c = canvasRef.current; if (c) { const ctx = c.getContext('2d'); if (ctx) ctx.clearRect(0, 0, c.width, c.height) }; setSigDataUrl(null) }

  const typedToImage = (): string => {
    const c = document.createElement('canvas'); c.width = 600; c.height = 160
    const ctx = c.getContext('2d')
    if (!ctx) return ''
    ctx.fillStyle = '#111'; ctx.font = "64px 'Brush Script MT', cursive, serif"; ctx.textBaseline = 'middle'
    ctx.fillText(typed || 'Signature', 20, 80)
    return c.toDataURL('image/png')
  }

  const onUpload = async (files: File[]) => {
    if (!files[0]) { toast.error('No file selected.'); return }
    try {
      const buf = await fileToArrayBuffer(files[0])
      const bytes = new Uint8Array(buf)
      let binary = ''
      const chunkSize = 8192
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
      }
      setSigDataUrl(`data:${files[0].type};base64,${btoa(binary)}`)
    } catch {
      toast.error('Failed to read signature image.')
    }
  }

  const run = async () => {
    if (!pdf.file || !pdf.data) return
    const sig = mode === 'type' ? typedToImage() : sigDataUrl
    if (!sig) { toast.error('Create a signature first.'); return }
    setBusy(true)
    try {
      const doc = await PDFDocument.load(pdf.data, { ignoreEncryption: true })
      const png = await doc.embedPng(sig)
      const pg = doc.getPage(page)
      const { width, height } = pg.getSize()
      const w = width * pos.w
      const h = w * (png.height / png.width)
      pg.drawImage(png, { x: width * pos.x, y: height * pos.y, width: w, height: h })
      const bytes = await doc.save()
      downloadBlob(bytesToBlob(bytes, 'application/pdf'), `${baseName(pdf.file.name)}-signed.pdf`)
      trackUsage({ toolId: 'sign-pdf', toolName: 'Sign PDF', action: 'Signed PDF', fileName: pdf.file.name, inputSize: pdf.file.size })
      toast.success('Signature placed.')
    } catch { toast.error('Signing failed.') } finally { setBusy(false) }
  }

  if (!pdf.file || !pdf.data) {
    return (
      <div className="grid gap-3">
        <Dropzone accept={['application/pdf']} onFiles={(f) => pdf.load(f[0])} label="Drop a PDF to sign" icon={<PenLine className="h-8 w-8" />} />
        {pdf.error && <p className="text-sm text-rose-500">{pdf.error}</p>}
      </div>
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="card p-5 grid gap-4">
        <p className="text-sm font-medium">{pdf.file.name} · {pdf.count} pages</p>
        <Field label="Signature type">
          <Segmented value={mode} onChange={setMode} options={[
            { value: 'draw', label: <span className="flex items-center gap-1"><PenLine className="h-3.5 w-3.5" />Draw</span> },
            { value: 'type', label: <span className="flex items-center gap-1"><Type className="h-3.5 w-3.5" />Type</span> },
            { value: 'upload', label: <span className="flex items-center gap-1"><Upload className="h-3.5 w-3.5" />Upload</span> },
          ]} />
        </Field>
        {mode === 'draw' && (
          <div>
            <canvas ref={canvasRef} width={500} height={180} className="w-full rounded-xl border-2 border-dashed border-ink-300 dark:border-ink-700 bg-white touch-none" />
            <button onClick={clearCanvas} className="btn-ghost btn-sm mt-2"><Eraser className="h-4 w-4" /> Clear</button>
          </div>
        )}
        {mode === 'type' && <Field label="Your name">
          <input
            value={typed}
            onChange={(e) => {
              const raw = e.target.value
              const lettersOnly = raw.replace(/[^a-zA-Z\s\-'.]/g, '')
              if (lettersOnly !== raw) toast.error('Name: Only letters, spaces, hyphens, apostrophes, and periods are allowed.')
              setTyped(lettersOnly)
            }}
            className={`input ${typed.length > 0 && /[^a-zA-Z\s\-'.]/.test(typed) ? 'border-red-500 dark:border-red-500' : ''}`}
            style={{ fontFamily: 'Brush Script MT, cursive', fontSize: 24 }}
            placeholder="John Doe"
            inputMode="text"
          />
        </Field>}
        {mode === 'upload' && <Dropzone accept={['image/png', 'image/jpeg']} compact onFiles={onUpload} label="Upload signature image" />}
        {(sigDataUrl || (mode === 'type' && typed)) && (
          <img src={mode === 'type' ? typedToImage() : sigDataUrl!} alt="Signature preview" className="h-16 object-contain rounded-lg border border-ink-200 dark:border-ink-700 bg-white p-1" />
        )}
      </div>

      <div className="card p-5 grid gap-4">
        <Field label="Page"><input type="range" min={0} max={pdf.count - 1} value={page} onChange={(e) => setPage(+e.target.value)} className="w-full accent-brand-500" /><p className="text-xs text-ink-500 mt-1">Page {page + 1}</p></Field>
        {thumb && (
          <div className="relative rounded-xl overflow-hidden border border-ink-200 dark:border-ink-700">
            <img src={thumb} alt={`Page ${page + 1}`} className="w-full" />
            <div className="absolute border-2 border-brand-500 bg-brand-500/20" style={{ left: `${pos.x * 100}%`, bottom: `${pos.y * 100}%`, width: `${pos.w * 100}%`, aspectRatio: '3/1' }} />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <label>Horizontal<input type="range" min={0} max={90} value={pos.x * 100} onChange={(e) => setPos((p) => ({ ...p, x: +e.target.value / 100 }))} /></label>
          <label>Vertical<input type="range" min={0} max={90} value={pos.y * 100} onChange={(e) => setPos((p) => ({ ...p, y: +e.target.value / 100 }))} /></label>
          <label>Size<input type="range" min={10} max={60} value={pos.w * 100} onChange={(e) => setPos((p) => ({ ...p, w: +e.target.value / 100 }))} /></label>
        </div>
        <button onClick={run} disabled={busy} className="btn-primary btn-md w-fit">{busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Sign & download</button>
      </div>
    </div>
  )
}

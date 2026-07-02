import { useEffect, useRef, useState } from 'react'
import { IdCard, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field, Segmented } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { fileToImage, canvasToBlob, downloadBlob, baseName } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

type Preset = 'passport' | 'visa' | 'aadhaar' | 'pan' | 'canada' | 'indian-passport' | 'indian-passport-child' | 'indian-voter-id' | 'indian-driving-license'
// width, height in mm, DPI 300
const PRESETS: Record<Preset, { label: string; w: number; h: number; note: string }> = {
  passport: { label: 'Passport (35×45mm)', w: 35, h: 45, note: 'Head 32-36mm, neutral expression, plain light background.' },
  visa: { label: 'US Visa (51×51mm)', w: 51, h: 51, note: 'Head 25-35mm (50-69%), white background.' },
  aadhaar: { label: 'Aadhaar (35×45mm)', w: 35, h: 45, note: 'Front-facing, light background.' },
  pan: { label: 'PAN (25×35mm)', w: 25, h: 35, note: 'Clear front-facing photo.' },
  canada: { label: 'Canada (50×70mm)', w: 50, h: 70, note: 'Front-facing, white or light grey background, taken within last 6 months.' },
  'indian-passport': { label: 'Indian Passport (35×45mm)', w: 35, h: 45, note: 'Head 31-36mm from chin to crown, ears visible, white background, neutral expression, no glasses.' },
  'indian-passport-child': { label: 'Indian Passport – Child (35×45mm)', w: 35, h: 45, note: 'Child must be alone, no parent in frame, eyes open, mouth closed, white background.' },
  'indian-voter-id': { label: 'Indian Voter ID (35×45mm)', w: 35, h: 45, note: 'Front-facing, plain white background, recent photo, full face visible.' },
  'indian-driving-license': { label: 'Indian Driving License (35×45mm)', w: 35, h: 45, note: 'Front-facing, white background, clear face, no sunglasses.' },
}
const DPI = 300
const mmToPx = (mm: number) => Math.round((mm / 25.4) * DPI)

export default function PassportPhoto() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [preset, setPreset] = useState<Preset>('passport')
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [bg, setBg] = useState('#ffffff')
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  const onFile = async (files: File[]) => { setImg(await fileToImage(files[0])); setFile(files[0]); setZoom(1); setOffset({ x: 0, y: 0 }) }

  const draw = () => {
    const c = canvasRef.current; if (!c || !img) return
    const p = PRESETS[preset]
    const cw = mmToPx(p.w), ch = mmToPx(p.h)
    c.width = cw; c.height = ch
    const ctx = c.getContext('2d')!
    ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch)
    const baseScale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
    const s = baseScale * zoom
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s
    ctx.drawImage(img, (cw - dw) / 2 + offset.x, (ch - dh) / 2 + offset.y, dw, dh)
    // guide overlay
    ctx.strokeStyle = 'rgba(124,58,237,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6])
    ctx.strokeRect(cw * 0.2, ch * 0.08, cw * 0.6, ch * 0.78)
    ctx.setLineDash([])
  }
  useEffect(draw, [img, preset, zoom, offset, bg])

  const onDown = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }; (e.target as Element).setPointerCapture(e.pointerId) }
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || !canvasRef.current) return
    const r = canvasRef.current.getBoundingClientRect()
    const sx = canvasRef.current.width / r.width
    setOffset({ x: drag.current.ox + (e.clientX - drag.current.x) * sx, y: drag.current.oy + (e.clientY - drag.current.y) * sx })
  }

  const exportPhoto = async (sheet: boolean) => {
    if (!file || !canvasRef.current) return
    setBusy(true)
    try {
      // redraw without guide
      const p = PRESETS[preset]
      const cw = mmToPx(p.w), ch = mmToPx(p.h)
      const clean = document.createElement('canvas'); clean.width = cw; clean.height = ch
      const ctx = clean.getContext('2d')!
      ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch)
      const baseScale = Math.max(cw / img!.naturalWidth, ch / img!.naturalHeight)
      const s = baseScale * zoom
      const dw = img!.naturalWidth * s, dh = img!.naturalHeight * s
      ctx.drawImage(img!, (cw - dw) / 2 + offset.x, (ch - dh) / 2 + offset.y, dw, dh)

      let out = clean
      if (sheet) {
        // 4x6 inch print sheet at 300dpi
        const sw = mmToPx(152), sh = mmToPx(102)
        const sheetC = document.createElement('canvas'); sheetC.width = sw; sheetC.height = sh
        const sctx = sheetC.getContext('2d')!; sctx.fillStyle = '#fff'; sctx.fillRect(0, 0, sw, sh)
        const cols = Math.floor(sw / (cw + 20)), rows = Math.floor(sh / (ch + 20))
        for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) sctx.drawImage(clean, 20 + col * (cw + 20), 20 + r * (ch + 20))
        out = sheetC
      }
      const blob = await canvasToBlob(out, 'image/jpeg', 0.95)
      downloadBlob(blob, `${baseName(file.name)}-${preset}${sheet ? '-sheet' : ''}.jpg`)
      trackUsage({ toolId: 'passport-photo', toolName: 'Passport Photo', action: `${preset}${sheet ? ' sheet' : ''}`, fileName: file.name, inputSize: file.size, outputSize: blob.size })
      toast.success('Photo exported.')
      draw()
    } catch { toast.error('Export failed.') } finally { setBusy(false) }
  }

  if (!file || !img) {
    return (
      <div className="grid gap-3">
        <Dropzone accept={['image/png', 'image/jpeg', 'image/webp']} onFiles={onFile} label="Drop a portrait photo" icon={<IdCard className="h-8 w-8" />} />
        <p className="text-xs text-ink-500">Drag the photo to position your face inside the guide. Output is 300 DPI, print-ready.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="card p-5 grid gap-3">
        <p className="text-sm font-medium">{file.name}</p>
        <canvas ref={canvasRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={() => (drag.current = null)} className="block w-full max-w-xs mx-auto rounded-xl border border-ink-200 dark:border-ink-700 cursor-move touch-none bg-white" />
        <p className="text-xs text-ink-500 text-center">Drag to reposition · the dashed box is the recommended head area</p>
      </div>
      <div className="card p-5 grid gap-4">
        <Field label="Document type"><Segmented value={preset} onChange={setPreset} options={(Object.keys(PRESETS) as Preset[]).map((k) => ({ value: k, label: k.toUpperCase() }))} /></Field>
        <p className="text-xs text-ink-500">{PRESETS[preset].note}</p>
        <Field label={`Zoom: ${zoom.toFixed(2)}×`}><input type="range" min={50} max={250} value={zoom * 100} onChange={(e) => setZoom(+e.target.value / 100)} className="w-full accent-brand-500" /></Field>
        <Field label="Background color"><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-10 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-transparent" /></Field>
        <div className="rounded-lg bg-ink-100 dark:bg-ink-850 p-3 text-xs grid gap-1">
          <p className="font-medium">Compliance checklist</p>
          <p>✔ Resolution: 300 DPI ({mmToPx(PRESETS[preset].w)}×{mmToPx(PRESETS[preset].h)} px)</p>
          <p>✔ Plain background — set above</p>
          <p>○ Center your face within the dashed guide</p>
          <p>○ Neutral expression, eyes open, no glare</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => exportPhoto(false)} disabled={busy} className="btn-primary btn-md">{busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Single photo</button>
          <button onClick={() => exportPhoto(true)} disabled={busy} className="btn-secondary btn-md"><Download className="h-4 w-4" /> 4×6 print sheet</button>
          <button onClick={() => { setFile(null); setImg(null) }} className="btn-ghost btn-md">Change</button>
        </div>
      </div>
    </div>
  )
}

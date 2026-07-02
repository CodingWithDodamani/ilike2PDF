import { useEffect, useRef, useState } from 'react'
import { PenLine, Download, Eraser, Type, Upload } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field, Segmented } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { downloadBlob, canvasToBlob, baseName, fileToArrayBuffer } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

type Mode = 'draw' | 'type' | 'upload'
type BgMode = 'transparent' | 'white'

const FONTS = [
  { label: 'Dancing Script', family: "'Dancing Script', cursive" },
  { label: 'Caveat', family: "'Caveat', cursive" },
  { label: 'Pacifico', family: "'Pacifico', cursive" },
  { label: 'Satisfy', family: "'Satisfy', cursive" },
  { label: 'Great Vibes', family: "'Great Vibes', cursive" },
] as const

const FONT_URL = 'https://fonts.googleapis.com/css2?family=Caveat&family=Dancing+Script&family=Great+Vibes&family=Pacifico&family=Satisfy&display=swap'

export default function SignatureMaker() {
  const toast = useToast()
  const [mode, setMode] = useState<Mode>('draw')
  const [bgMode, setBgMode] = useState<BgMode>('transparent')
  const [penColor, setPenColor] = useState('#111111')
  const [penWidth, setPenWidth] = useState(3)
  const [typed, setTyped] = useState('')
  const [fontIdx, setFontIdx] = useState(0)
  const [fontSize, setFontSize] = useState(48)
  const [sigDataUrl, setSigDataUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const fontsLoaded = useRef(false)

  // Load Google Fonts once
  useEffect(() => {
    if (fontsLoaded.current) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = FONT_URL
    document.head.appendChild(link)
    fontsLoaded.current = true
  }, [])

  // Canvas drawing — mode: 'draw'
  useEffect(() => {
    const c = canvasRef.current
    if (!c || mode !== 'draw') return
    const ctx = c.getContext('2d')
    if (!ctx) return

    // Preserve existing content (e.g. when switching back from type mode)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = penColor
    ctx.lineWidth = penWidth

    const pos = (e: PointerEvent) => {
      const r = c.getBoundingClientRect()
      return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) }
    }
    const down = (e: PointerEvent) => {
      drawing.current = true
      const p = pos(e)
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
    }
    const move = (e: PointerEvent) => {
      if (!drawing.current) return
      const p = pos(e)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
    }
    const up = () => {
      if (drawing.current) {
        drawing.current = false
        setSigDataUrl(c.toDataURL('image/png'))
      }
    }
    c.addEventListener('pointerdown', down)
    c.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      c.removeEventListener('pointerdown', down)
      c.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [mode, penColor, penWidth])

  const clearCanvas = () => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, c.width, c.height)
    setSigDataUrl(null)
  }

  // Render typed signature to canvas
  const renderTyped = () => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.fillStyle = penColor
    ctx.font = `${fontSize}px ${FONTS[fontIdx].family}`
    ctx.textBaseline = 'middle'
    ctx.fillText(typed || 'Signature', 20, c.height / 2)
    setSigDataUrl(c.toDataURL('image/png'))
  }

  useEffect(() => {
    if (mode === 'type') renderTyped()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, typed, fontIdx, fontSize, penColor])

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

  const buildOutputCanvas = (): HTMLCanvasElement => {
    const c = document.createElement('canvas')
    const src = canvasRef.current!
    if (bgMode === 'white') {
      c.width = src.width; c.height = src.height
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, c.width, c.height)
      ctx.drawImage(src, 0, 0)
    } else {
      // Transparent: draw from sigDataUrl if available
      c.width = src.width; c.height = src.height
      const ctx = c.getContext('2d')!
      if (sigDataUrl) {
        // We need to re-render cleanly
        if (mode === 'type') {
          ctx.fillStyle = penColor
          ctx.font = `${fontSize}px ${FONTS[fontIdx].family}`
          ctx.textBaseline = 'middle'
          ctx.fillText(typed || 'Signature', 20, c.height / 2)
        } else {
          ctx.drawImage(src, 0, 0)
        }
      }
    }
    return c
  }

  const exportPng = async () => {
    if (!sigDataUrl) { toast.error('Create a signature first.'); return }
    setBusy(true)
    try {
      const out = buildOutputCanvas()
      const blob = await canvasToBlob(out, 'image/png')
      downloadBlob(blob, `${baseName('signature')}-signature.png`)
      trackUsage({ toolId: 'signature-maker', toolName: 'Signature Maker', action: 'Export PNG', fileName: 'signature.png' })
      toast.success('Signature downloaded.')
    } catch { toast.error('Export failed.') } finally { setBusy(false) }
  }

  const exportJpg = async () => {
    if (!sigDataUrl) { toast.error('Create a signature first.'); return }
    setBusy(true)
    try {
      const out = buildOutputCanvas()
      // Force white background for JPG
      const ctx = out.getContext('2d')!
      ctx.globalCompositeOperation = 'destination-over'
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, out.width, out.height)
      const blob = await canvasToBlob(out, 'image/jpeg', 0.95)
      downloadBlob(blob, `${baseName('signature')}-signature.jpg`)
      trackUsage({ toolId: 'signature-maker', toolName: 'Signature Maker', action: 'Export JPG', fileName: 'signature.jpg' })
      toast.success('Signature downloaded.')
    } catch { toast.error('Export failed.') } finally { setBusy(false) }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="card p-5 grid gap-4">
        <Field label="Mode">
          <Segmented value={mode} onChange={setMode} options={[
            { value: 'draw', label: <span className="flex items-center gap-1"><PenLine className="h-3.5 w-3.5" />Draw</span> },
            { value: 'type', label: <span className="flex items-center gap-1"><Type className="h-3.5 w-3.5" />Type</span> },
            { value: 'upload', label: <span className="flex items-center gap-1"><Upload className="h-3.5 w-3.5" />Upload</span> },
          ]} />
        </Field>

        {mode === 'draw' && (
          <div>
            <canvas ref={canvasRef} width={500} height={180} className="w-full rounded-xl border-2 border-dashed border-ink-300 dark:border-ink-700 bg-white touch-none cursor-crosshair" />
            <button onClick={clearCanvas} className="btn-ghost btn-sm mt-2"><Eraser className="h-4 w-4" /> Clear</button>
          </div>
        )}

        {mode === 'type' && (
          <>
            <Field label="Your name">
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className="input"
                placeholder="John Doe"
                maxLength={50}
              />
            </Field>
            <Field label="Font">
              <Segmented
                value={String(fontIdx)}
                onChange={(v) => setFontIdx(+v)}
                options={FONTS.map((f, i) => ({ value: String(i), label: <span style={{ fontFamily: f.family, fontSize: 14 }}>{f.label}</span> }))}
              />
            </Field>
            <Field label={`Size: ${fontSize}px`}>
              <input type="range" min={20} max={72} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} className="w-full accent-brand-500" />
            </Field>
            <canvas ref={canvasRef} width={500} height={180} className="w-full rounded-xl border-2 border-ink-200 dark:border-ink-700 bg-white" />
          </>
        )}

        {mode === 'upload' && (
          <div>
            <Dropzone accept={['image/png', 'image/jpeg']} compact onFiles={onUpload} label="Upload signature image" />
            {sigDataUrl && <canvas ref={canvasRef} width={500} height={180} className="hidden" />}
          </div>
        )}

        {sigDataUrl && (
          <div className="rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-900 p-3">
            <p className="text-xs text-ink-500 mb-2">Preview</p>
            <img src={sigDataUrl} alt="Signature preview" className="h-20 object-contain rounded bg-white dark:bg-ink-800 mx-auto" />
          </div>
        )}
      </div>

      <div className="card p-5 grid gap-4">
        <Field label="Pen color"><input type="color" value={penColor} onChange={(e) => setPenColor(e.target.value)} className="h-10 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-transparent" /></Field>
        {mode === 'draw' && <Field label={`Pen thickness: ${penWidth}px`}><input type="range" min={1} max={10} value={penWidth} onChange={(e) => setPenWidth(+e.target.value)} className="w-full accent-brand-500" /></Field>}
        <Field label="Background">
          <Segmented value={bgMode} onChange={setBgMode} options={[{ value: 'transparent', label: 'Transparent' }, { value: 'white', label: 'White' }]} />
        </Field>

        <div className="rounded-lg bg-ink-100 dark:bg-ink-850 p-3 text-xs grid gap-1">
          <p className="font-medium">Usage tips</p>
          <p>● Draw mode: sign with mouse or touch</p>
          <p>● Type mode: pick a cursive font style</p>
          <p>● Upload mode: import a scanned signature</p>
          <p>● Transparent = PNG with no background</p>
          <p>● White = solid white background (good for documents)</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={exportPng} disabled={busy || !sigDataUrl} className="btn-primary btn-md">{busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} PNG (transparent)</button>
          <button onClick={exportJpg} disabled={busy || !sigDataUrl} className="btn-secondary btn-md"><Download className="h-4 w-4" /> JPG (white bg)</button>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Crop, Download, RotateCw, FlipHorizontal2 } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field, Segmented } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { baseName, canvasToBlob, downloadBlob, fileToImage } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

type Ratio = 'free' | '1:1' | '4:3' | '16:9' | '3:2'
const RATIOS: Record<Ratio, number | null> = { free: null, '1:1': 1, '4:3': 4 / 3, '16:9': 16 / 9, '3:2': 3 / 2 }

export default function CropImage() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [ratio, setRatio] = useState<Ratio>('free')
  const [rotate, setRotate] = useState(0)
  const [flip, setFlip] = useState(false)
  const [crop, setCrop] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 })
  const [busy, setBusy] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  const previewUrlRef = useRef('')

  useEffect(() => () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current) }, [])

  const onFile = async (files: File[]) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const i = await fileToImage(files[0])
    const url = URL.createObjectURL(files[0])
    previewUrlRef.current = url
    setFile(files[0]); setImg(i); setPreviewUrl(url); setCrop({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 }); setRotate(0); setFlip(false)
  }

  useEffect(() => {
    const r = RATIOS[ratio]
    if (r && boxRef.current) {
      const box = boxRef.current.getBoundingClientRect()
      const pixW = crop.w * box.width
      const pixH = pixW / r
      setCrop((c) => ({ ...c, h: Math.min(pixH / box.height, 1 - c.y) }))
    }
  }, [ratio])

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { sx: e.clientX, sy: e.clientY, ox: crop.x, oy: crop.y }
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !boxRef.current) return
    const box = boxRef.current.getBoundingClientRect()
    const dx = (e.clientX - drag.current.sx) / box.width
    const dy = (e.clientY - drag.current.sy) / box.height
    setCrop((c) => ({ ...c, x: Math.max(0, Math.min(drag.current!.ox + dx, 1 - c.w)), y: Math.max(0, Math.min(drag.current!.oy + dy, 1 - c.h)) }))
  }
  const onPointerUp = () => { drag.current = null }

  const run = async () => {
    if (!file || !img) return
    setBusy(true)
    try {
      const sx = crop.x * img.naturalWidth, sy = crop.y * img.naturalHeight
      const sw = crop.w * img.naturalWidth, sh = crop.h * img.naturalHeight
      const rad = (rotate * Math.PI) / 180
      const swapped = rotate % 180 !== 0
      const canvas = document.createElement('canvas')
      canvas.width = swapped ? sh : sw
      canvas.height = swapped ? sw : sh
      const ctx = canvas.getContext('2d')!
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(rad)
      if (flip) ctx.scale(-1, 1)
      ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh)
      const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const blob = await canvasToBlob(canvas, type, 0.92)
      downloadBlob(blob, `${baseName(file.name)}-cropped.${type === 'image/png' ? 'png' : 'jpg'}`)
      trackUsage({ toolId: 'crop-image', toolName: 'Crop & Rotate', action: 'Cropped image', fileName: file.name, inputSize: file.size, outputSize: blob.size })
      toast.success('Cropped image saved.')
    } catch { toast.error('Crop failed.') } finally { setBusy(false) }
  }

  if (!file || !img) return <Dropzone accept={['image/png', 'image/jpeg', 'image/webp']} onFiles={onFile} label="Drop an image to crop" icon={<Crop className="h-8 w-8" />} />

  return (
    <div className="card p-5 grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{file.name}</p>
        <button onClick={() => { setFile(null); setImg(null) }} className="btn-ghost btn-sm">Change image</button>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <Field label="Aspect ratio"><Segmented value={ratio} onChange={setRatio} options={(Object.keys(RATIOS) as Ratio[]).map((r) => ({ value: r, label: r }))} /></Field>
        <button onClick={() => setRotate((r) => (r + 90) % 360)} className="btn-secondary btn-sm"><RotateCw className="h-4 w-4" /> Rotate</button>
        <button onClick={() => setFlip((f) => !f)} className="btn-secondary btn-sm"><FlipHorizontal2 className="h-4 w-4" /> Flip</button>
      </div>
      <div ref={boxRef} className="relative w-full max-w-xl mx-auto overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-100 dark:bg-ink-900">
        <img src={previewUrl} alt="Crop source" className="block w-full pointer-events-none" style={{ transform: `rotate(${rotate}deg) scaleX(${flip ? -1 : 1})` }} />
        <div
          className="absolute border-2 border-brand-500 bg-brand-500/10 cursor-move touch-none"
          style={{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.w * 100}%`, height: `${crop.h * 100}%` }}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Width: ${Math.round(crop.w * 100)}%`}><input type="range" min={10} max={100} value={crop.w * 100} onChange={(e) => setCrop((c) => ({ ...c, w: Math.min(+e.target.value / 100, 1 - c.x) }))} className="w-full accent-brand-500" /></Field>
        <Field label={`Height: ${Math.round(crop.h * 100)}%`}><input type="range" min={10} max={100} value={crop.h * 100} onChange={(e) => setCrop((c) => ({ ...c, h: Math.min(+e.target.value / 100, 1 - c.y) }))} className="w-full accent-brand-500" /></Field>
      </div>
      <button onClick={run} disabled={busy} className="btn-primary btn-md w-fit">{busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Crop & download</button>
    </div>
  )
}

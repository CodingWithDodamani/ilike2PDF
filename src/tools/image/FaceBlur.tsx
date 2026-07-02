import { useEffect, useRef, useState, useCallback } from 'react'
import { EyeOff, Download, Trash2, Undo2 } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field, Segmented, ResultBar } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { downloadBlob, canvasToBlob, baseName, fileToImage } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

type EffectType = 'blur' | 'pixelate' | 'grayscale'

interface BlurRegion {
  id: number
  x: number // fraction 0-1
  y: number // fraction 0-1
  radius: number // fraction 0-1
}

let nextId = 1

export default function FaceBlur() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [regions, setRegions] = useState<BlurRegion[]>([])
  const [radius, setRadius] = useState(0.06)
  const [effect, setEffect] = useState<EffectType>('blur')
  const [blurAmount, setBlurAmount] = useState(15)
  const [pixelSize, setPixelSize] = useState(10)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const cleanupRef = useRef<string[]>([])

  useEffect(() => {
    return () => { cleanupRef.current.forEach(URL.revokeObjectURL) }
  }, [])

  const onFiles = async (files: File[]) => {
    const f = files[0]
    if (!f) return
    const image = await fileToImage(f)
    setFile(f); setImg(image); setRegions([]); setResult(null)
  }

  // Draw preview with blur regions
  const drawPreview = useCallback(() => {
    const c = previewCanvasRef.current
    if (!c || !img) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    c.width = img.naturalWidth
    c.height = img.naturalHeight

    // Draw original image
    ctx.drawImage(img, 0, 0)

    // Apply each blur region
    for (const region of regions) {
      const cx = region.x * c.width
      const cy = region.y * c.height
      const r = region.radius * Math.max(c.width, c.height)

      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.clip()

      if (effect === 'blur') {
        ctx.filter = `blur(${blurAmount}px)`
        ctx.drawImage(img, 0, 0)
        ctx.filter = 'none'
      } else if (effect === 'pixelate') {
        const sw = Math.max(1, Math.round(r * 2 / pixelSize))
        const sh = Math.max(1, Math.round(r * 2 / pixelSize))
        // Draw small then scale up for pixelation
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = sw
        tempCanvas.height = sh
        const tempCtx = tempCanvas.getContext('2d')!
        tempCtx.drawImage(img, cx - r, cy - r, r * 2, r * 2, 0, 0, sw, sh)
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(tempCanvas, cx - r, cy - r, r * 2, r * 2)
        ctx.imageSmoothingEnabled = true
      } else {
        // grayscale
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(Math.max(0, Math.floor(cx - r)), Math.max(0, Math.floor(cy - r)), Math.ceil(r * 2), Math.ceil(r * 2))
        const data = imageData.data
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
          data[i] = gray; data[i + 1] = gray; data[i + 2] = gray
        }
        ctx.putImageData(imageData, Math.max(0, Math.floor(cx - r)), Math.max(0, Math.floor(cy - r)))
      }

      ctx.restore()
    }

    // Draw region markers
    for (const region of regions) {
      const cx = region.x * c.width
      const cy = region.y * c.height
      const r = region.radius * Math.max(c.width, c.height)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'
      ctx.lineWidth = 3
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [img, regions, effect, blurAmount, pixelSize])

  useEffect(drawPreview, [drawPreview])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!previewCanvasRef.current) return
    const rect = previewCanvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setRegions(prev => [...prev, { id: nextId++, x, y, radius }])
  }

  const removeRegion = (id: number) => {
    setRegions(prev => prev.filter(r => r.id !== id))
  }

  const undoLast = () => {
    setRegions(prev => prev.slice(0, -1))
  }

  const exportResult = async () => {
    if (!img || regions.length === 0) { toast.error('Click on the image to add blur regions first.'); return }
    setBusy(true)
    try {
      const c = document.createElement('canvas')
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      for (const region of regions) {
        const cx = region.x * c.width
        const cy = region.y * c.height
        const r = region.radius * Math.max(c.width, c.height)

        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.clip()

        if (effect === 'blur') {
          ctx.filter = `blur(${blurAmount}px)`
          ctx.drawImage(img, 0, 0)
          ctx.filter = 'none'
        } else if (effect === 'pixelate') {
          const sw = Math.max(1, Math.round(r * 2 / pixelSize))
          const sh = Math.max(1, Math.round(r * 2 / pixelSize))
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = sw
          tempCanvas.height = sh
          const tempCtx = tempCanvas.getContext('2d')!
          tempCtx.drawImage(img, cx - r, cy - r, r * 2, r * 2, 0, 0, sw, sh)
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(tempCanvas, cx - r, cy - r, r * 2, r * 2)
          ctx.imageSmoothingEnabled = true
        } else {
          ctx.drawImage(img, 0, 0)
          const imageData = ctx.getImageData(Math.max(0, Math.floor(cx - r)), Math.max(0, Math.floor(cy - r)), Math.ceil(r * 2), Math.ceil(r * 2))
          const data = imageData.data
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
            data[i] = gray; data[i + 1] = gray; data[i + 2] = gray
          }
          ctx.putImageData(imageData, Math.max(0, Math.floor(cx - r)), Math.max(0, Math.floor(cy - r)))
        }

        ctx.restore()
      }

      const blob = await canvasToBlob(c, 'image/png')
      const url = URL.createObjectURL(blob)
      cleanupRef.current.push(url)
      setResult({ blob, url })
      trackUsage({ toolId: 'face-blur', toolName: 'Face Blur', action: `${effect} ${regions.length} regions`, fileName: file!.name, inputSize: file!.size, outputSize: blob.size })
      toast.success('Blur applied.')
    } catch { toast.error('Export failed.') } finally { setBusy(false) }
  }

  const downloadResult = () => {
    if (!result || !file) return
    downloadBlob(result.blob, `${baseName(file.name)}-blurred.png`)
  }

  const remove = () => {
    cleanupRef.current.forEach(URL.revokeObjectURL)
    cleanupRef.current = []
    setFile(null); setImg(null); setRegions([]); setResult(null)
  }

  if (!file || !img) {
    return (
      <div className="grid gap-3">
        <Dropzone accept={['image/jpeg', 'image/png', 'image/webp']} onFiles={onFiles} label="Drop an image to blur faces or regions" icon={<EyeOff className="h-8 w-8" />} />
        <p className="text-xs text-ink-500">Click anywhere on the image to place blur, pixelate, or grayscale regions. Great for privacy before sharing photos publicly.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{file.name} · {regions.length} region{regions.length !== 1 ? 's' : ''}</p>
        <button onClick={remove} className="btn-ghost btn-sm"><Trash2 className="h-4 w-4" /> Change</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Effect">
          <Segmented value={effect} onChange={setEffect} options={[
            { value: 'blur', label: 'Blur' },
            { value: 'pixelate', label: 'Pixelate' },
            { value: 'grayscale', label: 'Grayscale' },
          ]} />
        </Field>
        <Field label={`Radius: ${Math.round(radius * 100)}%`}>
          <input type="range" min={2} max={20} value={radius * 100} onChange={(e) => setRadius(+e.target.value / 100)} className="w-full accent-brand-500" />
        </Field>
      </div>

      {effect === 'blur' && (
        <Field label={`Blur amount: ${blurAmount}px`}>
          <input type="range" min={3} max={50} value={blurAmount} onChange={(e) => setBlurAmount(+e.target.value)} className="w-full accent-brand-500" />
        </Field>
      )}

      {effect === 'pixelate' && (
        <Field label={`Pixel size: ${pixelSize}px`}>
          <input type="range" min={3} max={30} value={pixelSize} onChange={(e) => setPixelSize(+e.target.value)} className="w-full accent-brand-500" />
        </Field>
      )}

      <div className="relative rounded-xl overflow-hidden border border-ink-200 dark:border-ink-700 cursor-crosshair">
        <canvas ref={previewCanvasRef} onClick={handleCanvasClick} className="w-full block touch-none" />
      </div>

      <p className="text-xs text-ink-500">Click on the image to add blur regions. Click the ✕ on a region to remove it.</p>

      {regions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {regions.map((r) => (
            <span key={r.id} className="inline-flex items-center gap-1 bg-ink-100 dark:bg-ink-800 text-xs px-2 py-1 rounded-full">
              Region {r.id}
              <button onClick={() => removeRegion(r.id)} className="text-ink-400 hover:text-red-500 ml-1">✕</button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {regions.length > 0 && <button onClick={undoLast} className="btn-ghost btn-sm"><Undo2 className="h-4 w-4" /> Undo last</button>}
        {!result && <button onClick={exportResult} disabled={busy || regions.length === 0} className="btn-primary btn-md">{busy ? <Spinner className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />} Apply & export</button>}
      </div>

      {result && (
        <>
          <ResultBar inputSize={file.size} outputSize={result.blob.size} />
          <img src={result.url} alt="Blurred result" className="max-h-80 rounded-lg border border-ink-200 dark:border-ink-700 object-contain mx-auto" />
          <div className="flex gap-2 flex-wrap">
            <button onClick={downloadResult} className="btn-primary btn-md"><Download className="h-4 w-4" /> Download</button>
            <button onClick={() => setResult(null)} className="btn-secondary btn-md">Edit regions</button>
          </div>
        </>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Eraser, Download, Pipette } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { imageToCanvas, removeBackgroundColor, detectCornerColor } from '@/lib/image'
import { baseName, canvasToBlob, downloadBlob, fileToImage } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

export default function RemoveBackground() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [target, setTarget] = useState<[number, number, number]>([255, 255, 255])
  const [threshold, setThreshold] = useState(60)
  const [feather, setFeather] = useState(20)
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const onFile = async (files: File[]) => {
    const i = await fileToImage(files[0])
    const base = imageToCanvas(i)
    setFile(files[0]); setImg(i); setTarget(detectCornerColor(base))
  }

  useEffect(() => {
    if (!img || !canvasRef.current) return
    const src = imageToCanvas(img)
    const canvas = canvasRef.current
    canvas.width = src.width; canvas.height = src.height
    canvas.getContext('2d')!.drawImage(src, 0, 0)
    removeBackgroundColor(canvas, target, threshold, feather)
  }, [img, target, threshold, feather])

  const pickColor = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current; if (!c || !img) return
    const r = c.getBoundingClientRect()
    const x = Math.floor((e.clientX - r.left) * (c.width / r.width))
    const y = Math.floor((e.clientY - r.top) * (c.height / r.height))
    const src = imageToCanvas(img)
    const p = src.getContext('2d')!.getImageData(x, y, 1, 1).data
    setTarget([p[0], p[1], p[2]])
  }

  const run = async () => {
    if (!file || !canvasRef.current) return
    setBusy(true)
    try {
      const blob = await canvasToBlob(canvasRef.current, 'image/png')
      downloadBlob(blob, `${baseName(file.name)}-nobg.png`)
      trackUsage({ toolId: 'remove-background', toolName: 'Remove Background', action: 'Removed background', fileName: file.name, inputSize: file.size, outputSize: blob.size })
      toast.success('Saved transparent PNG.')
    } catch { toast.error('Failed.') } finally { setBusy(false) }
  }

  if (!file || !img) {
    return (
      <div className="grid gap-3">
        <Dropzone accept={['image/png', 'image/jpeg', 'image/webp']} onFiles={onFile} label="Drop an image with a solid background" icon={<Eraser className="h-8 w-8" />} />
        <p className="text-xs text-ink-500">Works best on photos with a solid or near-solid background. Click the preview to pick the exact color to remove.</p>
      </div>
    )
  }

  return (
    <div className="card p-5 grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{file.name}</p>
        <button onClick={() => { setFile(null); setImg(null) }} className="btn-ghost btn-sm">Change image</button>
      </div>
      <div className="rounded-xl overflow-hidden border border-ink-200 dark:border-ink-700 bg-[repeating-conic-gradient(#e5e5e5_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
        <canvas ref={canvasRef} onClick={pickColor} className="block w-full max-h-80 object-contain cursor-crosshair mx-auto" />
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Pipette className="h-4 w-4 text-brand-500" /> Background color:
        <span className="h-5 w-5 rounded border border-ink-300" style={{ background: `rgb(${target.join(',')})` }} />
        <span className="font-mono text-xs">rgb({target.join(', ')})</span>
        <span className="text-ink-400">— click image to re-pick</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={`Threshold: ${threshold}`} hint="How close a color must be to be removed"><input type="range" min={5} max={200} value={threshold} onChange={(e) => setThreshold(+e.target.value)} className="w-full accent-brand-500" /></Field>
        <Field label={`Edge feather: ${feather}`} hint="Soften edges"><input type="range" min={0} max={80} value={feather} onChange={(e) => setFeather(+e.target.value)} className="w-full accent-brand-500" /></Field>
      </div>
      <button onClick={run} disabled={busy} className="btn-primary btn-md w-fit">{busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Download PNG</button>
    </div>
  )
}

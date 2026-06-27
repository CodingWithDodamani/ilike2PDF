import { useEffect, useRef, useState } from 'react'
import { Aperture, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { imageToCanvas, blurCanvas } from '@/lib/image'
import { baseName, canvasToBlob, downloadBlob, fileToImage } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

export default function BlurImage() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [radius, setRadius] = useState(8)
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const onFile = async (files: File[]) => { setImg(await fileToImage(files[0])); setFile(files[0]) }

  useEffect(() => {
    if (!img || !canvasRef.current) return
    const src = imageToCanvas(img)
    const c = canvasRef.current
    c.width = src.width; c.height = src.height
    c.getContext('2d')!.drawImage(src, 0, 0)
    blurCanvas(c, radius)
  }, [img, radius])

  const run = async () => {
    if (!file || !canvasRef.current) return
    setBusy(true)
    try {
      const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const blob = await canvasToBlob(canvasRef.current, type, 0.92)
      downloadBlob(blob, `${baseName(file.name)}-blurred.${type === 'image/png' ? 'png' : 'jpg'}`)
      trackUsage({ toolId: 'blur-background', toolName: 'Blur Image', action: `Blur ${radius}px`, fileName: file.name, inputSize: file.size, outputSize: blob.size })
      toast.success('Blurred image saved.')
    } catch { toast.error('Failed.') } finally { setBusy(false) }
  }

  if (!file || !img) return <Dropzone accept={['image/png', 'image/jpeg', 'image/webp']} onFiles={onFile} label="Drop an image to blur" icon={<Aperture className="h-8 w-8" />} />

  return (
    <div className="card p-5 grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{file.name}</p>
        <button onClick={() => { setFile(null); setImg(null) }} className="btn-ghost btn-sm">Change image</button>
      </div>
      <canvas ref={canvasRef} className="block w-full max-h-80 object-contain rounded-xl border border-ink-200 dark:border-ink-700 mx-auto" />
      <Field label={`Blur radius: ${radius}px`}><input type="range" min={0} max={50} value={radius} onChange={(e) => setRadius(+e.target.value)} className="w-full accent-brand-500" /></Field>
      <button onClick={run} disabled={busy} className="btn-primary btn-md w-fit">{busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Download</button>
    </div>
  )
}

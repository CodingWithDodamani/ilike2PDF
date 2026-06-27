import { useEffect, useRef, useState } from 'react'
import { Stamp, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field, Segmented } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { imageToCanvas } from '@/lib/image'
import { baseName, canvasToBlob, downloadBlob, fileToImage } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

export default function WatermarkImage() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [text, setText] = useState('© SnapPDF')
  const [opacity, setOpacity] = useState(0.35)
  const [size, setSize] = useState(6)
  const [color, setColor] = useState('#ffffff')
  const [tile, setTile] = useState<'single' | 'tiled'>('tiled')
  const [angle, setAngle] = useState(30)
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const onFile = async (files: File[]) => { setImg(await fileToImage(files[0])); setFile(files[0]) }

  useEffect(() => {
    if (!img || !canvasRef.current) return
    const src = imageToCanvas(img)
    const c = canvasRef.current
    c.width = src.width; c.height = src.height
    const ctx = c.getContext('2d')!
    ctx.drawImage(src, 0, 0)
    const fontSize = (size / 100) * Math.min(c.width, c.height)
    ctx.font = `bold ${fontSize}px Inter, sans-serif`
    ctx.fillStyle = color
    ctx.globalAlpha = opacity
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    if (tile === 'single') {
      ctx.save(); ctx.translate(c.width / 2, c.height / 2); ctx.rotate((-angle * Math.PI) / 180); ctx.fillText(text, 0, 0); ctx.restore()
    } else {
      const step = fontSize * 6
      ctx.save(); ctx.rotate((-angle * Math.PI) / 180)
      for (let y = -c.height; y < c.height * 2; y += step)
        for (let x = -c.width; x < c.width * 2; x += step) ctx.fillText(text, x, y)
      ctx.restore()
    }
    ctx.globalAlpha = 1
  }, [img, text, opacity, size, color, tile, angle])

  const run = async () => {
    if (!file || !canvasRef.current) return
    setBusy(true)
    try {
      const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const blob = await canvasToBlob(canvasRef.current, type, 0.92)
      downloadBlob(blob, `${baseName(file.name)}-watermarked.${type === 'image/png' ? 'png' : 'jpg'}`)
      trackUsage({ toolId: 'watermark-image', toolName: 'Watermark Image', action: 'Added watermark', fileName: file.name, inputSize: file.size, outputSize: blob.size })
      toast.success('Watermarked image saved.')
    } catch { toast.error('Failed.') } finally { setBusy(false) }
  }

  if (!file || !img) return <Dropzone accept={['image/png', 'image/jpeg', 'image/webp']} onFiles={onFile} label="Drop an image to watermark" icon={<Stamp className="h-8 w-8" />} />

  return (
    <div className="card p-5 grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{file.name}</p>
        <button onClick={() => { setFile(null); setImg(null) }} className="btn-ghost btn-sm">Change image</button>
      </div>
      <canvas ref={canvasRef} className="block w-full max-h-80 object-contain rounded-xl border border-ink-200 dark:border-ink-700 mx-auto" />
      <Field label="Watermark text"><input value={text} onChange={(e) => setText(e.target.value)} className="input" /></Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Pattern"><Segmented value={tile} onChange={setTile} options={[{ value: 'single', label: 'Single' }, { value: 'tiled', label: 'Tiled' }]} /></Field>
        <Field label="Color"><input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-transparent" /></Field>
        <Field label={`Opacity: ${Math.round(opacity * 100)}%`}><input type="range" min={5} max={100} value={opacity * 100} onChange={(e) => setOpacity(+e.target.value / 100)} className="w-full accent-brand-500" /></Field>
        <Field label={`Size: ${size}%`}><input type="range" min={2} max={20} value={size} onChange={(e) => setSize(+e.target.value)} className="w-full accent-brand-500" /></Field>
        <Field label={`Angle: ${angle}°`}><input type="range" min={0} max={90} value={angle} onChange={(e) => setAngle(+e.target.value)} className="w-full accent-brand-500" /></Field>
      </div>
      <button onClick={run} disabled={busy} className="btn-primary btn-md w-fit">{busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Download</button>
    </div>
  )
}

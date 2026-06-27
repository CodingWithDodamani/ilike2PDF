import { useEffect, useRef, useState } from 'react'
import { Pipette, Copy } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { useToast } from '@/components/Toaster'
import { imageToCanvas } from '@/lib/image'
import { fileToImage } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

export default function ColorPicker() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [picked, setPicked] = useState<{ hex: string; rgb: string } | null>(null)
  const [palette, setPalette] = useState<string[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const onFile = async (files: File[]) => {
    const i = await fileToImage(files[0])
    setFile(files[0]); setImg(i)
    setPalette(extractPalette(imageToCanvas(i)))
    trackUsage({ toolId: 'color-picker', toolName: 'Color Picker', action: 'Extracted palette', fileName: files[0].name })
  }

  useEffect(() => {
    if (!img || !canvasRef.current) return
    const src = imageToCanvas(img)
    const c = canvasRef.current
    c.width = src.width; c.height = src.height
    c.getContext('2d')!.drawImage(src, 0, 0)
  }, [img])

  const pick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current; if (!c) return
    const r = c.getBoundingClientRect()
    const x = Math.floor((e.clientX - r.left) * (c.width / r.width))
    const y = Math.floor((e.clientY - r.top) * (c.height / r.height))
    const p = c.getContext('2d')!.getImageData(x, y, 1, 1).data
    setPicked({ hex: rgbToHex(p[0], p[1], p[2]), rgb: `rgb(${p[0]}, ${p[1]}, ${p[2]})` })
  }

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success(`Copied ${v}`) }

  if (!file || !img) return <Dropzone accept={['image/png', 'image/jpeg', 'image/webp']} onFiles={onFile} label="Drop an image to pick colors" icon={<Pipette className="h-8 w-8" />} />

  return (
    <div className="card p-5 grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{file.name} · click image to pick</p>
        <button onClick={() => { setFile(null); setImg(null); setPicked(null) }} className="btn-ghost btn-sm">Change image</button>
      </div>
      <canvas ref={canvasRef} onClick={pick} className="block w-full max-h-80 object-contain rounded-xl border border-ink-200 dark:border-ink-700 cursor-crosshair mx-auto" />
      {picked && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="h-12 w-12 rounded-lg border border-ink-300 shadow" style={{ background: picked.hex }} />
          <button onClick={() => copy(picked.hex)} className="btn-secondary btn-sm font-mono"><Copy className="h-3.5 w-3.5" />{picked.hex}</button>
          <button onClick={() => copy(picked.rgb)} className="btn-secondary btn-sm font-mono"><Copy className="h-3.5 w-3.5" />{picked.rgb}</button>
        </div>
      )}
      <div>
        <p className="text-sm font-medium mb-2">Dominant palette</p>
        <div className="flex flex-wrap gap-2">
          {palette.map((hex) => (
            <button key={hex} onClick={() => copy(hex)} className="group relative h-14 w-14 rounded-lg border border-ink-200 dark:border-ink-700 shadow-sm" style={{ background: hex }} title={`Copy ${hex}`}>
              <span className="absolute inset-x-0 bottom-0 text-[11px] font-mono bg-black/50 text-white rounded-b-lg sm:opacity-0 sm:group-hover:opacity-100 transition">{hex}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function extractPalette(canvas: HTMLCanvasElement, count = 8): string[] {
  const max = 100
  const scale = Math.min(max / canvas.width, max / canvas.height, 1)
  const w = Math.max(1, Math.round(canvas.width * scale))
  const h = Math.max(1, Math.round(canvas.height * scale))
  const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h
  const ctx = tmp.getContext('2d')!; ctx.drawImage(canvas, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h).data
  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>()
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    const key = `${data[i] >> 5}-${data[i + 1] >> 5}-${data[i + 2] >> 5}`
    const b = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 }
    b.r += data[i]; b.g += data[i + 1]; b.b += data[i + 2]; b.n++
    buckets.set(key, b)
  }
  return [...buckets.values()].sort((a, b) => b.n - a.n).slice(0, count)
    .map((b) => rgbToHex(Math.round(b.r / b.n), Math.round(b.g / b.n), Math.round(b.b / b.n)))
}

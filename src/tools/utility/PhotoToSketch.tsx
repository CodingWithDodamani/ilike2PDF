import { useState, useCallback, useRef } from 'react'
import { Download, Image, RefreshCw } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'
import { downloadBlob } from '@/lib/utils'

type SketchStyle = 'pencil' | 'ink' | 'charcoal' | 'negative'

export default function PhotoToSketch() {
  const [original, setOriginal] = useState<string | null>(null)
  const [sketch, setSketch] = useState<string | null>(null)
  const [style, setStyle] = useState<SketchStyle>('pencil')
  const [intensity, setIntensity] = useState(0.8)
  const [processing, setProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processImage = useCallback((file: File) => {
    setProcessing(true)
    const img = new window.Image()
    img.onload = () => {
      const canvas = canvasRef.current!
      const maxDim = 800
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // Convert to grayscale
      const gray = new Float32Array(canvas.width * canvas.height)
      for (let i = 0; i < data.length; i += 4) {
        gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      }

      // Edge detection (Sobel-like)
      const edges = new Float32Array(canvas.width * canvas.height)
      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          const idx = y * canvas.width + x
          const gx = -gray[(y - 1) * canvas.width + (x - 1)] + gray[(y - 1) * canvas.width + (x + 1)]
            - 2 * gray[y * canvas.width + (x - 1)] + 2 * gray[y * canvas.width + (x + 1)]
            - gray[(y + 1) * canvas.width + (x - 1)] + gray[(y + 1) * canvas.width + (x + 1)]
          const gy = -gray[(y - 1) * canvas.width + (x - 1)] - 2 * gray[(y - 1) * canvas.width + x] - gray[(y - 1) * canvas.width + (x + 1)]
            + gray[(y + 1) * canvas.width + (x - 1)] + 2 * gray[(y + 1) * canvas.width + x] + gray[(y + 1) * canvas.width + (x + 1)]
          edges[idx] = Math.sqrt(gx * gx + gy * gy)
        }
      }

      // Normalize and apply style
      const maxEdge = Math.max(...edges)
      for (let i = 0; i < edges.length; i++) {
        let val = 1 - (edges[i] / maxEdge) * intensity
        val = Math.max(0, Math.min(1, val))

        const pi = i * 4
        switch (style) {
          case 'pencil':
            data[pi] = data[pi + 1] = data[pi + 2] = val * 255
            break
          case 'ink':
            data[pi] = data[pi + 1] = data[pi + 2] = val < 0.5 ? 0 : 255
            break
          case 'charcoal':
            const noise = (Math.random() - 0.5) * 20
            const v = Math.max(0, Math.min(255, val * 255 + noise))
            data[pi] = data[pi + 1] = data[pi + 2] = v
            break
          case 'negative':
            data[pi] = (1 - val) * 255
            data[pi + 1] = (1 - val) * 200
            data[pi + 2] = val * 255
            break
        }
        data[pi + 3] = 255
      }

      ctx.putImageData(imageData, 0, 0)
      setSketch(canvas.toDataURL('image/png'))
      setProcessing(false)
    }
    img.src = URL.createObjectURL(file)
    setOriginal(URL.createObjectURL(file))
  }, [style, intensity])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'))
    if (file) processImage(file)
  }, [processImage])

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processImage(file)
    e.target.value = ''
  }, [processImage])

  const downloadSketch = () => {
    if (!sketch) return
    const a = document.createElement('a')
    a.href = sketch; a.download = 'sketch.png'; a.click()
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Photo to Sketch</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Convert photos to pencil, ink, charcoal, or negative sketch effects.
      </p>

      <canvas ref={canvasRef} className="hidden" />

      {/* Style */}
      <div className="flex rounded-xl bg-ink-100 dark:bg-ink-850 p-1 mb-4">
        {(['pencil', 'ink', 'charcoal', 'negative'] as const).map(s => (
          <button key={s} onClick={() => setStyle(s)}
            className={cn('flex-1 px-3 py-2 rounded-lg text-sm font-medium transition capitalize',
              style === s ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-300 shadow' : 'text-ink-600 dark:text-ink-300')}>
            {s}
          </button>
        ))}
      </div>

      {/* Intensity */}
      <div className="mb-4">
        <label className="label">Intensity: {Math.round(intensity * 100)}%</label>
        <input type="range" min={0.1} max={1.5} step={0.05} value={intensity}
          onChange={e => setIntensity(parseFloat(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-ink-200 dark:bg-ink-800 accent-brand-500" />
      </div>

      {/* Drop zone */}
      <div onDragOver={e => e.preventDefault()} onDrop={handleDrop}
        className="border-2 border-dashed rounded-xl p-6 text-center border-ink-300 dark:border-ink-600 hover:border-brand-500 transition cursor-pointer mb-4">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <label className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <Image className="w-8 h-8 mx-auto mb-2 text-ink-400" />
          <p className="text-sm">{processing ? 'Processing...' : 'Drop an image or click to browse'}</p>
        </label>
      </div>

      {/* Preview */}
      {original && sketch && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="label mb-1">Original</p>
            <img src={original} alt="Original" className="w-full rounded-xl object-cover max-h-60" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="label mb-0">Sketch</p>
              <button onClick={downloadSketch} className="btn-ghost px-2 py-1 text-xs rounded-lg flex items-center gap-1">
                <Download className="w-3 h-3" /> Save
              </button>
            </div>
            <img src={sketch} alt="Sketch" className="w-full rounded-xl object-cover max-h-60" />
          </div>
        </div>
      )}
    </Section>
  )
}

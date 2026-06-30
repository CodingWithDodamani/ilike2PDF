import { useState, useCallback, useRef, useEffect } from 'react'
import { Download, Image } from 'lucide-react'
import { Section } from '@/components/ui'
import { downloadBlob } from '@/lib/utils'

export default function ImageBorder() {
  const [original, setOriginal] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [borderWidth, setBorderWidth] = useState(10)
  const [borderColor, setBorderColor] = useState('#3b82f6')
  const [borderRadius, setBorderRadius] = useState(0)
  const [padding, setPadding] = useState(0)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [shadow, setShadow] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const origUrlRef = useRef('')

  useEffect(() => {
    return () => { if (origUrlRef.current) URL.revokeObjectURL(origUrlRef.current) }
  }, [])

  const processImage = useCallback((file: File) => {
    const img = new window.Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const totalW = img.width + (borderWidth + padding) * 2
      const totalH = img.height + (borderWidth + padding) * 2
      canvas.width = totalW
      canvas.height = totalH

      if (shadow > 0) {
        ctx.shadowColor = 'rgba(0,0,0,0.3)'
        ctx.shadowBlur = shadow
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = shadow / 2
      }

      if (borderRadius > 0) {
        ctx.beginPath()
        ctx.roundRect(0, 0, totalW, totalH, borderRadius)
        ctx.fillStyle = borderColor
        ctx.fill()
        ctx.shadowColor = 'transparent'
        ctx.beginPath()
        ctx.roundRect(borderWidth, borderWidth, totalW - borderWidth * 2, totalH - borderWidth * 2, Math.max(0, borderRadius - borderWidth))
        ctx.clip()
        ctx.drawImage(img, borderWidth + padding, borderWidth + padding, img.width, img.height)
      } else {
        ctx.fillStyle = borderColor
        ctx.fillRect(0, 0, totalW, totalH)
        ctx.shadowColor = 'transparent'
        if (bgColor !== borderColor) {
          ctx.fillStyle = bgColor
          ctx.fillRect(borderWidth, borderWidth, totalW - borderWidth * 2, totalH - borderWidth * 2)
        }
        ctx.drawImage(img, borderWidth + padding, borderWidth + padding, img.width, img.height)
      }

      setResult(canvas.toDataURL('image/png'))
    }
    if (origUrlRef.current) URL.revokeObjectURL(origUrlRef.current)
    const url = URL.createObjectURL(file)
    origUrlRef.current = url
    setOriginal(url)
    img.src = url
  }, [borderWidth, borderColor, borderRadius, padding, bgColor, shadow])

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

  const downloadImage = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result; a.download = 'bordered-image.png'; a.click()
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Image Border & Frame</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Add borders, rounded corners, padding, and shadows to images.
      </p>

      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="label">Border Width: {borderWidth}px</label>
          <input type="range" min={0} max={50} value={borderWidth}
            onChange={e => setBorderWidth(parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-ink-200 dark:bg-ink-800 accent-brand-500" />
        </div>
        <div>
          <label className="label">Border Color</label>
          <input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)}
            className="w-full h-8 rounded cursor-pointer" />
        </div>
        <div>
          <label className="label">Border Radius: {borderRadius}px</label>
          <input type="range" min={0} max={100} value={borderRadius}
            onChange={e => setBorderRadius(parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-ink-200 dark:bg-ink-800 accent-brand-500" />
        </div>
        <div>
          <label className="label">Padding: {padding}px</label>
          <input type="range" min={0} max={50} value={padding}
            onChange={e => setPadding(parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-ink-200 dark:bg-ink-800 accent-brand-500" />
        </div>
        <div>
          <label className="label">Shadow: {shadow}px</label>
          <input type="range" min={0} max={50} value={shadow}
            onChange={e => setShadow(parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-ink-200 dark:bg-ink-800 accent-brand-500" />
        </div>
        <div>
          <label className="label">Inner BG</label>
          <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
            className="w-full h-8 rounded cursor-pointer" />
        </div>
      </div>

      {/* Drop zone */}
      <div onDragOver={e => e.preventDefault()} onDrop={handleDrop}
        className="border-2 border-dashed rounded-xl p-6 text-center border-ink-300 dark:border-ink-600 hover:border-brand-500 transition cursor-pointer mb-4">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <label className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <Image className="w-8 h-8 mx-auto mb-2 text-ink-400" />
          <p className="text-sm">Drop an image or click to browse</p>
        </label>
      </div>

      {/* Preview */}
      {original && result && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="label mb-1">Original</p>
            <img src={original} alt="Original" className="w-full rounded-xl object-cover max-h-60" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="label mb-0">Result</p>
              <button onClick={downloadImage} className="btn-ghost px-2 py-1 text-xs rounded-lg flex items-center gap-1">
                <Download className="w-3 h-3" /> Save
              </button>
            </div>
            <img src={result} alt="Result" className="w-full rounded-xl object-cover max-h-60" style={{ background: 'repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 50% / 10px 10px' }} />
          </div>
        </div>
      )}
    </Section>
  )
}

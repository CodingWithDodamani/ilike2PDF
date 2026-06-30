import { useState, useCallback, useRef, useEffect } from 'react'
import { Download, Upload, Image } from 'lucide-react'
import { Section } from '@/components/ui'
import { downloadBlob } from '@/lib/utils'

const SIZES = [16, 32, 48, 64, 128, 180, 192, 512]

export default function FaviconGenerator() {
  const [preview, setPreview] = useState<string | null>(null)
  const [previews, setPreviews] = useState<{ size: number; url: string }[]>([])
  const [bgColor, setBgColor] = useState('#ffffff')
  const [transparent, setTransparent] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef('')

  useEffect(() => {
    return () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current) }
  }, [])

  const processImage = useCallback((file: File) => {
    const img = new window.Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const results: { size: number; url: string }[] = []

      for (const size of SIZES) {
        canvas.width = size
        canvas.height = size
        ctx.clearRect(0, 0, size, size)
        if (!transparent) {
          ctx.fillStyle = bgColor
          ctx.fillRect(0, 0, size, size)
        }
        const minDim = Math.min(img.width, img.height)
        const sx = (img.width - minDim) / 2
        const sy = (img.height - minDim) / 2
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)
        const url = canvas.toDataURL('image/png')
        results.push({ size, url })
      }
      setPreviews(results)
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(file)
    previewUrlRef.current = url
    setPreview(url)
    img.src = url
  }, [bgColor, transparent])

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

  const downloadAll = () => {
    previews.forEach(p => {
      const a = document.createElement('a')
      a.href = p.url
      a.download = p.size === 16 ? 'favicon-16x16.png' : p.size === 32 ? 'favicon-32x32.png' : p.size === 180 ? 'apple-touch-icon.png' : p.size === 192 ? 'android-chrome-192x192.png' : p.size === 512 ? 'android-chrome-512x512.png' : `icon-${p.size}x${p.size}.png`
      a.click()
    })
  }

  const downloadICO = () => {
    const canvas = canvasRef.current!
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')!
    const img = new window.Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 32, 32)
      canvas.toBlob(b => {
        if (b) downloadBlob(b, 'favicon.ico')
      }, 'image/png')
    }
    img.src = previews[1]?.url || previews[0]?.url || ''
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Favicon Generator</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Generate favicons and app icons from any image. All sizes included.
      </p>

      <canvas ref={canvasRef} className="hidden" />

      {/* Options */}
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={transparent} onChange={e => setTransparent(e.target.checked)}
            className="w-4 h-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500" />
          <span className="text-sm">Transparent BG</span>
        </label>
        {!transparent && (
          <div className="flex items-center gap-2">
            <label className="label mb-0">BG</label>
            <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer" />
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div onDragOver={e => e.preventDefault()} onDrop={handleDrop}
        className="border-2 border-dashed rounded-xl p-6 text-center border-ink-300 dark:border-ink-600 hover:border-brand-500 transition cursor-pointer mb-4">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <label className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <Image className="w-8 h-8 mx-auto mb-2 text-ink-400" />
          <p className="text-sm">Drop an image (512x512 recommended) or click to browse</p>
        </label>
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <>
          <div className="flex flex-wrap gap-3 mb-4">
            {previews.map(p => (
              <div key={p.size} className="text-center">
                <div className="card p-2 inline-block" style={{ background: transparent ? 'repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 50% / 8px 8px' : undefined }}>
                  <img src={p.url} alt={`${p.size}px`} style={{ width: Math.min(p.size, 64), height: Math.min(p.size, 64) }} />
                </div>
                <p className="text-[10px] text-ink-400 mt-1">{p.size}x{p.size}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={downloadAll} className="btn-primary px-4 py-2 text-sm rounded-lg flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Download All PNGs
            </button>
            <button onClick={downloadICO} className="btn-ghost px-3 py-2 text-sm rounded-lg flex items-center gap-1.5">
              <Download className="w-4 h-4" /> favicon.ico
            </button>
          </div>

          {/* HTML tags */}
          <div className="mt-4">
            <p className="label mb-2">HTML Tags</p>
            <pre className="card p-3 text-xs font-mono text-ink-600 dark:text-ink-300 overflow-x-auto">
{`<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`}
            </pre>
          </div>
        </>
      )}
    </Section>
  )
}

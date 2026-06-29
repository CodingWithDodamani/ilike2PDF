import { useState, useCallback, useRef } from 'react'
import { Download, Upload, Image, Trash2 } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'
import { downloadBlob } from '@/lib/utils'

export default function SvgToPng() {
  const [svgInput, setSvgInput] = useState('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">\n  <circle cx="100" cy="100" r="80" fill="#667eea" />\n  <text x="100" y="110" text-anchor="middle" fill="white" font-size="24" font-family="Arial">SVG</text>\n</svg>')
  const [scale, setScale] = useState(2)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [transparent, setTransparent] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const convert = useCallback(() => {
    setError('')
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const img = new window.Image()
    const blob = new Blob([svgInput], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    img.onload = () => {
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      if (!transparent) {
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob(b => {
        if (b) setPreview(URL.createObjectURL(b))
      }, 'image/png')
    }
    img.onerror = () => { setError('Invalid SVG'); URL.revokeObjectURL(url) }
    img.src = url
  }, [svgInput, scale, bgColor, transparent])

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(b => {
      if (b) downloadBlob(b, 'converted.png')
    }, 'image/png')
  }

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setSvgInput(reader.result as string)
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">SVG to PNG Converter</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Convert SVG to high-resolution PNG. Adjustable scale and background.
      </p>

      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="label">Scale: {scale}x</label>
          <input type="range" min={1} max={8} value={scale}
            onChange={e => setScale(parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-ink-200 dark:bg-ink-800 accent-brand-500" />
        </div>
        <div className="flex items-end gap-2">
          <label className="label mb-0">BG</label>
          <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer" disabled={transparent} />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-1.5 cursor-pointer pb-2">
            <input type="checkbox" checked={transparent} onChange={e => setTransparent(e.target.checked)}
              className="w-4 h-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500" />
            <span className="text-xs">Transparent BG</span>
          </label>
        </div>
      </div>

      {/* SVG input */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="label mb-0">SVG Code</label>
          <label className="btn-ghost px-2 py-1 text-xs rounded-lg flex items-center gap-1 cursor-pointer">
            <Upload className="w-3 h-3" /> Import File
            <input type="file" accept=".svg,image/svg+xml" onChange={handleFile} className="hidden" />
          </label>
        </div>
        <textarea className="input w-full h-40 font-mono text-xs resize-y" value={svgInput}
          onChange={e => setSvgInput(e.target.value)} spellCheck={false} />
      </div>

      {error && <div className="rounded-xl bg-red-500/10 text-red-600 px-4 py-3 text-sm mb-4">{error}</div>}

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <button onClick={convert} className="btn-primary px-4 py-2 text-sm rounded-lg">Convert to PNG</button>
        {preview && (
          <button onClick={download} className="btn-ghost px-3 py-2 text-sm rounded-lg flex items-center gap-1">
            <Download className="w-4 h-4" /> Download
          </button>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="card p-4 flex items-center justify-center" style={{ background: transparent ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 20px 20px' : undefined }}>
          <img src={preview} alt="Converted PNG" className="max-w-full max-h-60" />
        </div>
      )}
    </Section>
  )
}

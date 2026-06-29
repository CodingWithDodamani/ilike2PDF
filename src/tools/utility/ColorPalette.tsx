import { useState, useCallback, useRef } from 'react'
import { Copy, Check, Download, Trash2, Image } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Color {
  r: number; g: number; b: number
  hex: string
  count: number
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function extractColors(imageData: ImageData, numColors: number): Color[] {
  const data = imageData.data
  const colorMap = new Map<string, number>()
  // Sample every 4th pixel for speed
  for (let i = 0; i < data.length; i += 16) {
    const r = Math.round(data[i] / 32) * 32
    const g = Math.round(data[i + 1] / 32) * 32
    const b = Math.round(data[i + 2] / 32) * 32
    const key = `${r},${g},${b}`
    colorMap.set(key, (colorMap.get(key) || 0) + 1)
  }

  const sorted = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, numColors * 3)

  // Merge similar colors
  const colors: Color[] = []
  for (const [key, count] of sorted) {
    const [r, g, b] = key.split(',').map(Number)
    const hex = rgbToHex(r, g, b)
    // Check if similar color already exists
    const existing = colors.find(c => {
      const [hr, hg, hb] = [parseInt(c.hex.slice(1, 3), 16), parseInt(c.hex.slice(3, 5), 16), parseInt(c.hex.slice(5, 7), 16)]
      return Math.abs(hr - r) < 50 && Math.abs(hg - g) < 50 && Math.abs(hb - b) < 50
    })
    if (existing) {
      existing.count += count
    } else {
      colors.push({ r, g, b, hex, count })
    }
    if (colors.length >= numColors) break
  }

  return colors.sort((a, b) => b.count - a.count)
}

export default function ColorPalette() {
  const [colors, setColors] = useState<Color[]>([])
  const [preview, setPreview] = useState<string | null>(null)
  const [numColors, setNumColors] = useState(8)
  const [copied, setCopied] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processImage = useCallback((file: File) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = canvasRef.current!
      const maxDim = 200
      const scale = Math.min(maxDim / img.width, maxDim / 1, 1)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const extracted = extractColors(imageData, numColors)
      setColors(extracted)
      setPreview(URL.createObjectURL(file))
    }
    img.src = URL.createObjectURL(file)
  }, [numColors])

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

  const copyColor = (hex: string, label: string) => {
    navigator.clipboard.writeText(hex)
    setCopied(label)
    setTimeout(() => setCopied(''), 1500)
  }

  const downloadPalette = () => {
    const text = colors.map(c => `${c.hex} — rgb(${c.r}, ${c.g}, ${c.b}) — hsl${rgbToHsl(c.r, c.g, c.b).join(', ')}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'palette.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Color Palette from Image</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Extract dominant colors from any image. Pick, copy, and export palettes.
      </p>

      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4">
        <div>
          <label className="label">Colors: {numColors}</label>
          <input type="range" min={3} max={16} value={numColors}
            onChange={e => setNumColors(parseInt(e.target.value))}
            className="w-32 h-2 rounded-full appearance-none bg-ink-200 dark:bg-ink-800 accent-brand-500" />
        </div>
        <button onClick={downloadPalette} disabled={colors.length === 0}
          className="btn-ghost px-3 py-2 text-sm rounded-lg flex items-center gap-1.5 disabled:opacity-40">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Drop zone */}
      <div onDragOver={e => e.preventDefault()} onDrop={handleDrop}
        className="border-2 border-dashed rounded-xl p-6 text-center border-ink-300 dark:border-ink-600 hover:border-brand-500 transition cursor-pointer mb-4">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <label htmlFor="" className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <Image className="w-8 h-8 mx-auto mb-2 text-ink-400" />
          <p className="text-sm">Drop an image or click to browse</p>
        </label>
      </div>

      {/* Preview + palette */}
      {preview && colors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <img src={preview} alt="Source" className="w-full rounded-xl object-cover max-h-60" />
          </div>
          <div className="space-y-1.5">
            {colors.map((c, i) => {
              const [h, s, l] = rgbToHsl(c.r, c.g, c.b)
              const textColor = luminance(c.r, c.g, c.b) > 0.179 ? '#000' : '#fff'
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{ background: c.hex, color: textColor }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-medium">{c.hex.toUpperCase()}</p>
                    <p className="text-xs text-ink-400">rgb({c.r}, {c.g}, {c.b}) · hsl({h}°, {s}%, {l}%)</p>
                  </div>
                  <button onClick={() => copyColor(c.hex, String(i))}
                    className="p-1.5 rounded-lg text-ink-400 hover:text-brand-500 transition">
                    {copied === String(i) ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Color strip */}
      {colors.length > 0 && (
        <div className="flex h-12 rounded-xl overflow-hidden mt-4">
          {colors.map((c, i) => (
            <div key={i} className="flex-1 cursor-pointer hover:opacity-80 transition"
              style={{ background: c.hex }} title={c.hex} onClick={() => copyColor(c.hex, String(i))} />
          ))}
        </div>
      )}
    </Section>
  )
}

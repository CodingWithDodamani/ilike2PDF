import { useState, useRef, useEffect } from 'react'
import { Grid3x3, Download } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

type HeatmapType = 'viridis' | 'magma' | 'plasma' | 'inferno' | 'hot' | 'cool' | 'rainbow'

const COLORMAPS: Record<HeatmapType, (t: number) => [number, number, number]> = {
  viridis: (t) => {
    const r = Math.round(68 + t * (253 - 68))
    const g = Math.round(1 + t * (231 - 1))
    const b = Math.round(84 + t * (37 - 84))
    return [r, g, b]
  },
  magma: (t) => {
    const r = Math.round(0 + t * 255)
    const g = Math.round(0 + t * t * 200)
    const b = Math.round(4 + (1 - t) * 100 + t * 150)
    return [r, g, b]
  },
  plasma: (t) => {
    const r = Math.round(13 + t * 242)
    const g = Math.round(8 + Math.sin(t * Math.PI) * 200)
    const b = Math.round(135 + (1 - t) * 120)
    return [r, g, b]
  },
  inferno: (t) => {
    const r = Math.round(0 + t * 255)
    const g = Math.round(0 + t * t * 180)
    const b = Math.round(4 + (1 - t) * 80)
    return [r, g, b]
  },
  hot: (t) => {
    if (t < 0.33) return [Math.round(t * 3 * 255), 0, 0]
    if (t < 0.66) return [255, Math.round((t - 0.33) * 3 * 255), 0]
    return [255, 255, Math.round((t - 0.66) * 3 * 255)]
  },
  cool: (t) => {
    const r = Math.round(0 + t * 100)
    const g = Math.round(255 - t * 100)
    const b = Math.round(255)
    return [r, g, b]
  },
  rainbow: (t) => {
    const h = t * 360
    const s = 1
    const l = 0.5
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = l - c / 2
    let r = 0, g = 0, b = 0
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
  },
}

const SAMPLE_DATA = [
  [0.2, 0.5, 0.8, 0.3, 0.7, 0.9, 0.1, 0.4],
  [0.6, 0.1, 0.4, 0.9, 0.2, 0.5, 0.8, 0.3],
  [0.9, 0.3, 0.7, 0.1, 0.5, 0.8, 0.2, 0.6],
  [0.4, 0.8, 0.2, 0.6, 0.9, 0.1, 0.5, 0.7],
  [0.1, 0.6, 0.9, 0.3, 0.7, 0.4, 0.8, 0.2],
  [0.7, 0.2, 0.5, 0.8, 0.3, 0.9, 0.1, 0.4],
]

export default function HeatmapGenerator() {
  const [data, setData] = useState(SAMPLE_DATA)
  const [colormap, setColormap] = useState<HeatmapType>('viridis')
  const [cellSize, setCellSize] = useState(50)
  const [showValues, setShowValues] = useState(true)
  const [inputText, setInputText] = useState(SAMPLE_DATA.map(r => r.join(',')).join('\n'))
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const parseData = () => {
    try {
      const rows = inputText.trim().split('\n').map(r =>
        r.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
      ).filter(r => r.length > 0)
      if (rows.length > 0) setData(rows)
    } catch { /* ignore parse errors */ }
  }

  useEffect(() => { parseData() }, [inputText])

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rows = data.length
    const cols = Math.max(...data.map(r => r.length))
    const w = cols * cellSize + 100
    const h = rows * cellSize + 60

    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.scale(dpr, dpr)

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, w, h)

    // Find min/max
    const flat = data.flat()
    const min = Math.min(...flat)
    const max = Math.max(...flat)
    const range = max - min || 1

    const colorFn = COLORMAPS[colormap]

    // Draw cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < data[r].length; c++) {
        const val = data[r][c]
        const t = (val - min) / range
        const [cr, cg, cb] = colorFn(t)

        ctx.fillStyle = `rgb(${cr},${cg},${cb})`
        ctx.fillRect(c * cellSize + 40, r * cellSize + 30, cellSize - 2, cellSize - 2)

        if (showValues) {
          ctx.fillStyle = t > 0.6 ? '#fff' : '#000'
          ctx.font = `${Math.min(14, cellSize / 3)}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(
            val.toFixed(2),
            c * cellSize + 40 + (cellSize - 2) / 2,
            r * cellSize + 30 + (cellSize - 2) / 2
          )
        }
      }
    }

    // Color legend
    const legendW = 20
    const legendH = rows * cellSize
    const legendX = w - 30
    for (let i = 0; i < legendH; i++) {
      const t = 1 - i / legendH
      const [cr, cg, cb] = colorFn(t)
      ctx.fillStyle = `rgb(${cr},${cg},${cb})`
      ctx.fillRect(legendX, 30 + i, legendW, 1)
    }

    ctx.fillStyle = '#333'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(max.toFixed(2), legendX + legendW + 4, 38)
    ctx.fillText(min.toFixed(2), legendX + legendW + 4, 30 + legendH)
  }, [data, colormap, cellSize, showValues])

  const download = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = 'heatmap.png'
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Grid3x3 className="w-5 h-5 text-brand-500" />
        Heatmap Generator
      </h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Create beautiful heatmap visualizations from numerical data. Multiple colormaps and styles.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <div>
          <div className="card p-2 flex justify-center overflow-auto">
            <canvas ref={canvasRef} />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Data (CSV: rows = lines, values = comma-separated)</label>
            <textarea
              className="input w-full font-mono text-xs"
              rows={6}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="0.2, 0.5, 0.8&#10;0.6, 0.1, 0.4"
            />
          </div>

          <div>
            <label className="label">Colormap</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(COLORMAPS) as HeatmapType[]).map(cm => (
                <button
                  key={cm}
                  onClick={() => setColormap(cm)}
                  className={cn(
                    'px-2 py-1.5 rounded-lg text-xs font-medium transition capitalize',
                    colormap === cm
                      ? 'bg-brand-500 text-white'
                      : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300'
                  )}
                >
                  {cm}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Cell Size: {cellSize}px</label>
            <input
              type="range"
              min="20"
              max="80"
              value={cellSize}
              onChange={e => setCellSize(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show-vals"
              checked={showValues}
              onChange={e => setShowValues(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="show-vals" className="text-sm">Show values in cells</label>
          </div>

          <button onClick={download} className="btn-primary w-full flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Download Heatmap
          </button>
        </div>
      </div>
    </Section>
  )
}

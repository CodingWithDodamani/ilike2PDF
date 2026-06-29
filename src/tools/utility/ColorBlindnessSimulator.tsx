import { useState, useRef, useCallback } from 'react'
import { Eye, Upload, Download, RotateCcw } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

type BlindnessType = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'

const TYPES: { id: BlindnessType; name: string; description: string }[] = [
  { id: 'protanopia', name: 'Protanopia', description: 'Red-blind (~1% males)' },
  { id: 'deuteranopia', name: 'Deuteranopia', description: 'Green-blind (~1% males)' },
  { id: 'tritanopia', name: 'Tritanopia', description: 'Blue-blind (very rare)' },
  { id: 'achromatopsia', name: 'Achromatopsia', description: 'Total color blindness' },
]

// Color blindness simulation matrices
const MATRICES: Record<BlindnessType, number[]> = {
  protanopia: [
    0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758,
  ],
  deuteranopia: [
    0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7,
  ],
  tritanopia: [
    0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525,
  ],
  achromatopsia: [
    0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114,
  ],
}

function applyMatrix(r: number, g: number, b: number, matrix: number[]): [number, number, number] {
  return [
    Math.min(255, Math.round(r * matrix[0] + g * matrix[1] + b * matrix[2])),
    Math.min(255, Math.round(r * matrix[3] + g * matrix[4] + b * matrix[5])),
    Math.min(255, Math.round(r * matrix[6] + g * matrix[7] + b * matrix[8])),
  ]
}

export default function ColorBlindnessSimulator() {
  const [original, setOriginal] = useState<HTMLImageElement | null>(null)
  const [activeType, setActiveType] = useState<BlindnessType>('protanopia')
  const [showSplit, setShowSplit] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const splitCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const img = new Image()
    img.onload = () => {
      setOriginal(img)
    }
    img.src = URL.createObjectURL(file)
  }

  const render = useCallback(() => {
    if (!original || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = original.width
    canvas.height = original.height
    ctx.drawImage(original, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const matrix = MATRICES[activeType]

    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b] = applyMatrix(data[i], data[i + 1], data[i + 2], matrix)
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
    }

    ctx.putImageData(imageData, 0, 0)

    // Split view
    if (showSplit && splitCanvasRef.current) {
      const split = splitCanvasRef.current
      const sctx = split.getContext('2d')
      if (!sctx) return

      split.width = original.width
      split.height = original.height
      sctx.drawImage(original, 0, 0)

      const halfW = Math.floor(split.width / 2)
      const simData = ctx.getImageData(0, 0, halfW, split.height)
      sctx.putImageData(simData, halfW, 0)

      // Draw dividing line
      sctx.strokeStyle = '#fff'
      sctx.lineWidth = 2
      sctx.beginPath()
      sctx.moveTo(halfW, 0)
      sctx.lineTo(halfW, split.height)
      sctx.stroke()

      // Labels
      sctx.font = 'bold 14px sans-serif'
      sctx.fillStyle = '#fff'
      sctx.shadowColor = '#000'
      sctx.shadowBlur = 4
      sctx.fillText('Normal', 10, 24)
      sctx.fillText(TYPES.find(t => t.id === activeType)?.name || '', halfW + 10, 24)
      sctx.shadowBlur = 0
    }
  }, [original, activeType, showSplit])

  // Re-render when dependencies change
  useState(() => {
    render()
  })

  const download = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `color-blindness-${activeType}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Eye className="w-5 h-5 text-brand-500" />
        Color Blindness Simulator
      </h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        See how images look to people with different types of color vision deficiency.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <button onClick={() => fileRef.current?.click()} className="btn-primary flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Image
        </button>
        {original && (
          <>
            <button onClick={download} className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download
            </button>
            <button onClick={() => setShowSplit(!showSplit)} className="btn-ghost flex items-center gap-2">
              {showSplit ? 'Full View' : 'Split View'}
            </button>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveType(t.id); setTimeout(render, 0) }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition',
              activeType === t.id
                ? 'bg-brand-500 text-white'
                : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200'
            )}
          >
            {t.name}
            <span className="block text-[10px] opacity-70">{t.description}</span>
          </button>
        ))}
      </div>

      {!original ? (
        <div
          className="card border-2 border-dashed border-ink-300 dark:border-ink-600 p-12 text-center cursor-pointer hover:border-brand-400 transition"
          onClick={() => fileRef.current?.click()}
        >
          <Eye className="w-12 h-12 mx-auto text-ink-300 dark:text-ink-600 mb-3" />
          <p className="text-sm text-ink-500">Click or drop an image to simulate color blindness</p>
        </div>
      ) : showSplit ? (
        <div className="card p-2">
          <canvas ref={splitCanvasRef} className="w-full rounded-lg" style={{ maxHeight: '500px', objectFit: 'contain' }} />
        </div>
      ) : (
        <div className="card p-2">
          <canvas ref={canvasRef} className="w-full rounded-lg" style={{ maxHeight: '500px', objectFit: 'contain' }} />
        </div>
      )}

      {/* Hidden canvas for download */}
      <canvas ref={canvasRef} className="hidden" />
    </Section>
  )
}

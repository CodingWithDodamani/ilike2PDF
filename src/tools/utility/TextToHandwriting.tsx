import { useState, useRef } from 'react'
import { PenLine, Download, Type } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

const FONTS = [
  { id: 'caveat', name: 'Caveat', family: 'Caveat, cursive', style: 'Casual handwriting' },
  { id: 'dancing', name: 'Dancing Script', family: '"Dancing Script", cursive', style: 'Elegant flowing' },
  { id: 'indie', name: 'Indie Flower', family: '"Indie Flower", cursive', style: 'Playful casual' },
  { id: 'patrick', name: 'Patrick Hand', family: '"Patrick Hand", cursive', style: 'Clean neat' },
  { id: 'shadows', name: 'Shadows Into Light', family: '"Shadows Into Light", cursive', style: 'Light informal' },
  { id: 'kalam', name: 'Kalam', family: 'Kalam, cursive', style: 'Natural pen' },
]

const INK_COLORS = [
  { id: 'black', color: '#1a1a2e', name: 'Black Ink' },
  { id: 'blue', color: '#0a3d62', name: 'Blue Ink' },
  { id: 'darkblue', color: '#1e3799', name: 'Dark Blue' },
  { id: 'green', color: '#006266', name: 'Green Ink' },
  { id: 'red', color: '#b71540', name: 'Red Ink' },
  { id: 'purple', color: '#6c5ce7', name: 'Purple Ink' },
]

const BG_COLORS = [
  { id: 'white', color: '#ffffff', name: 'White Paper' },
  { id: 'cream', color: '#fdf6e3', name: 'Cream' },
  { id: 'lined', color: '#f8f9fa', name: 'Light Gray' },
  { id: 'yellow', color: '#fff9c4', name: 'Yellow Sticky' },
]

export default function TextToHandwriting() {
  const [text, setText] = useState('Hello! This is a sample of handwritten text. You can write anything here and it will appear in a beautiful handwriting style.')
  const [font, setFont] = useState(FONTS[0])
  const [inkColor, setInkColor] = useState(INK_COLORS[0])
  const [bgColor, setBgColor] = useState(BG_COLORS[0])
  const [fontSize, setFontSize] = useState(24)
  const [lineSpacing, setLineSpacing] = useState(1.8)
  const [showLines, setShowLines] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const generateHandwriting = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = 800
    const lineHeight = fontSize * lineSpacing
    const lines = text.split('\n')
    const totalHeight = Math.max(600, lines.length * lineHeight + 80)

    canvas.width = width * dpr
    canvas.height = totalHeight * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${totalHeight}px`
    ctx.scale(dpr, dpr)

    // Background
    ctx.fillStyle = bgColor.color
    ctx.fillRect(0, 0, width, totalHeight)

    // Draw ruled lines
    if (showLines) {
      ctx.strokeStyle = 'rgba(100,149,237,0.3)'
      ctx.lineWidth = 1
      for (let y = 40; y < totalHeight; y += lineHeight) {
        ctx.beginPath()
        ctx.moveTo(20, y)
        ctx.lineTo(width - 20, y)
        ctx.stroke()
      }
    }

    // Draw text
    ctx.fillStyle = inkColor.color
    ctx.font = `${fontSize}px ${font.family}`
    ctx.textBaseline = 'top'

    let yPos = 40
    for (const line of lines) {
      // Add slight random offset for natural look
      const xOffset = (Math.random() - 0.5) * 2
      const yOffset = (Math.random() - 0.5) * 1
      ctx.fillText(line, 30 + xOffset, yPos + yOffset)
      yPos += lineHeight
    }
  }

  const downloadImage = () => {
    if (!canvasRef.current) return
    generateHandwriting()
    const link = document.createElement('a')
    link.download = 'handwriting.png'
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <PenLine className="w-5 h-5 text-brand-500" />
        Text to Handwriting
      </h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Convert typed text into realistic handwriting. Multiple fonts, ink colors, and paper styles.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-4">
        <div>
          <textarea
            className="input w-full font-mono"
            rows={4}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type your text here..."
          />

          <div className="mt-3">
            <label className="label">Handwriting Style</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FONTS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFont(f)}
                  className={cn(
                    'p-2 rounded-xl text-left text-sm transition border',
                    font.id === f.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                      : 'border-ink-200 dark:border-ink-700 hover:border-brand-300'
                  )}
                >
                  <span className="block font-medium" style={{ fontFamily: f.family }}>
                    {f.name}
                  </span>
                  <span className="block text-xs text-ink-400">{f.style}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="label">Font Size: {fontSize}px</label>
              <input
                type="range"
                min="14"
                max="40"
                value={fontSize}
                onChange={e => setFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="label">Line Spacing: {lineSpacing.toFixed(1)}</label>
              <input
                type="range"
                min="1.2"
                max="3"
                step="0.1"
                value={lineSpacing}
                onChange={e => setLineSpacing(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="label">Ink Color</label>
            <div className="flex flex-wrap gap-2">
              {INK_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setInkColor(c)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition',
                    inkColor.id === c.id ? 'border-brand-500 scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="mt-3">
            <label className="label">Paper Style</label>
            <div className="flex flex-wrap gap-2">
              {BG_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setBgColor(c)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs border transition',
                    bgColor.id === c.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                      : 'border-ink-200 dark:border-ink-700'
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="show-lines"
              checked={showLines}
              onChange={e => setShowLines(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="show-lines" className="text-sm">Show ruled lines</label>
          </div>

          <button onClick={generateHandwriting} className="btn-primary mt-4 w-full flex items-center justify-center gap-2">
            <Type className="w-4 h-4" />
            Generate
          </button>
        </div>

        <div>
          <div className="card p-2 sticky top-20">
            <canvas ref={canvasRef} className="w-full rounded-lg" />
            <button onClick={downloadImage} className="btn-secondary mt-2 w-full flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Download PNG
            </button>
          </div>
        </div>
      </div>
    </Section>
  )
}

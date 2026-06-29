import { useState, useRef, useCallback, useEffect } from 'react'
import { Smile, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Section } from '@/components/ui'
import { downloadBlob, fileToImage, canvasToBlob } from '@/lib/utils'

export default function MemeGenerator() {
  const [file, setFile] = useState<File | null>(null)
  const [topText, setTopText] = useState('')
  const [bottomText, setBottomText] = useState('')
  const [fontSize, setFontSize] = useState(40)
  const [fontColor, setFontColor] = useState('#ffffff')
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const handleFile = useCallback(async (files: File[]) => {
    if (files.length === 0) return
    const f = files[0]
    setFile(f)
    imgRef.current = await fileToImage(f)
    setTopText('')
    setBottomText('')
  }, [])

  const wrapText = useCallback(
    (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
      if (!text) return []
      const words = text.toUpperCase().split(' ')
      const lines: string[] = []
      let current = ''
      for (const word of words) {
        const test = current ? `${current} ${word}` : word
        if (ctx.measureText(test).width > maxWidth && current) {
          lines.push(current)
          current = word
        } else {
          current = test
        }
      }
      if (current) lines.push(current)
      return lines
    },
    []
  )

  const draw = useCallback(() => {
    const c = canvasRef.current
    const img = imgRef.current
    if (!c || !img) return
    const ctx = c.getContext('2d')!
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    ctx.drawImage(img, 0, 0)

    const font = `${fontSize}px Impact, "Arial Black", sans-serif`
    ctx.font = font
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    const padding = 30
    const maxWidth = c.width - padding * 2
    const topLines = wrapText(ctx, topText, maxWidth)
    const bottomLines = wrapText(ctx, bottomText, maxWidth)

    const drawLines = (lines: string[], y: number) => {
      const lineHeight = fontSize * 1.2
      ctx.fillStyle = fontColor
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = strokeWidth
      ctx.lineJoin = 'round'
      ctx.miterLimit = 2
      for (let i = 0; i < lines.length; i++) {
        const ly = y + i * lineHeight
        ctx.strokeText(lines[i], c.width / 2, ly)
        ctx.fillText(lines[i], c.width / 2, ly)
      }
    }

    if (topLines.length > 0) drawLines(topLines, padding)
    if (bottomLines.length > 0) {
      const lineHeight = fontSize * 1.2
      const totalH = bottomLines.length * lineHeight
      drawLines(bottomLines, c.height - totalH - padding)
    }
  }, [topText, bottomText, fontSize, fontColor, strokeColor, strokeWidth, wrapText])

  useEffect(() => { draw() }, [draw])

  const download = async () => {
    if (!canvasRef.current) return
    setBusy(true)
    try {
      const blob = await canvasToBlob(canvasRef.current, 'image/png')
      const name = file ? `${file.name.replace(/\.[^.]+$/, '')}-meme.png` : 'meme.png'
      downloadBlob(blob, name)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1 flex items-center gap-2"><Smile className="h-5 w-5 text-brand-500" /> Meme Generator</h2>
      <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">Add top and bottom text to any image to create a meme.</p>

      {!file ? (
        <Dropzone accept={['image/jpeg', 'image/png', 'image/webp']} onFiles={handleFile} label="Drop an image to create a meme" icon={<Smile className="h-8 w-8" />} />
      ) : (
        <div className="grid gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <button onClick={() => { setFile(null); imgRef.current = null }} className="btn-ghost btn-sm">Change image</button>
          </div>

          <canvas ref={canvasRef} className="block w-full max-w-full rounded-xl border border-ink-200 dark:border-ink-700 mx-auto" />

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Top Text</label>
              <input value={topText} onChange={(e) => setTopText(e.target.value)} className="input" placeholder="Top text" />
            </div>
            <div>
              <label className="label">Bottom Text</label>
              <input value={bottomText} onChange={(e) => setBottomText(e.target.value)} className="input" placeholder="Bottom text" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Font Size: {fontSize}</label>
              <input type="range" min={20} max={80} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} className="w-full accent-brand-500" />
            </div>
            <div>
              <label className="label">Stroke Width: {strokeWidth}</label>
              <input type="range" min={0} max={5} value={strokeWidth} onChange={(e) => setStrokeWidth(+e.target.value)} className="w-full accent-brand-500" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Font Color</label>
              <input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="h-10 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-transparent cursor-pointer" />
            </div>
            <div>
              <label className="label">Stroke Color</label>
              <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="h-10 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-transparent cursor-pointer" />
            </div>
          </div>

          <button onClick={download} disabled={busy} className="btn-primary btn-md w-fit">
            <Download className="h-4 w-4" /> {busy ? 'Saving...' : 'Download Meme'}
          </button>
        </div>
      )}
    </Section>
  )
}

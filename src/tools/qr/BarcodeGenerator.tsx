import { useEffect, useRef, useState, useCallback } from 'react'
import JsBarcode from 'jsbarcode'
import { motion } from 'framer-motion'
import { Download, Info } from 'lucide-react'
import { Field, Segmented } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { downloadDataUrl } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

type BarcodeFormat = 'CODE128' | 'EAN13' | 'CODE39'

const FORMAT_INFO: Record<BarcodeFormat, { label: string; hint: string; example: string; validate: (v: string) => boolean }> = {
  CODE128: { label: 'Code 128', hint: 'Any ASCII text, 1–80 chars', example: 'Hello-123', validate: v => v.length > 0 && v.length <= 80 },
  EAN13: { label: 'EAN-13', hint: 'Exactly 12 or 13 digits', example: '5901234123457', validate: v => /^[0-9]{12,13}$/.test(v) },
  CODE39: { label: 'Code 39', hint: 'Uppercase A-Z, 0-9, symbols: - . $ / + % SPACE', example: 'HELLO-123', validate: v => /^[A-Z0-9\-.$/+%\s]+$/.test(v) && v.length > 0 },
}

export default function BarcodeGenerator() {
  const toast = useToast()
  const svgRef = useRef<SVGSVGElement>(null)
  const [format, setFormat] = useState<BarcodeFormat>('CODE128')
  const [value, setValue] = useState('Hello-123')
  const [fg, setFg] = useState('#000000')
  const [bg, setBg] = useState('#ffffff')
  const [showText, setShowText] = useState(true)
  const [lineWidth, setLineWidth] = useState(2)
  const [height, setHeight] = useState(100)
  const [valid, setValid] = useState(true)

  const info = FORMAT_INFO[format]

  useEffect(() => {
    setValid(info.validate(value))
  }, [value, format, info])

  const generate = useCallback(() => {
    if (!svgRef.current || !value || !valid) return
    try {
      JsBarcode(svgRef.current, value, {
        format,
        lineColor: fg,
        background: bg,
        displayValue: showText,
        width: lineWidth,
        height,
        margin: 10,
        font: 'monospace',
        fontSize: 14,
      })
    } catch { /* invalid input */ }
  }, [value, format, fg, bg, showText, lineWidth, height, valid])

  useEffect(() => { generate() }, [generate])

  const downloadPng = () => {
    if (!svgRef.current || !valid) return
    const svg = svgRef.current
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      downloadDataUrl(canvas.toDataURL('image/png'), `barcode-${format.toLowerCase()}.png`)
      trackUsage({ toolId: 'barcode-generator', toolName: 'Barcode Generator', action: `Downloaded ${format} PNG` })
    }
    img.onerror = () => toast.error('PNG download failed.')
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`
  }

  const downloadSvg = () => {
    if (!svgRef.current || !valid) return
    const svgData = new XMLSerializer().serializeToString(svgRef.current)
    downloadDataUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`, `barcode-${format.toLowerCase()}.svg`)
    trackUsage({ toolId: 'barcode-generator', toolName: 'Barcode Generator', action: `Downloaded ${format} SVG` })
  }

  const handleFormatChange = (f: BarcodeFormat) => {
    setFormat(f)
    setValue(FORMAT_INFO[f].example)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="card p-5 grid gap-4">
        <Field label="Barcode format">
          <Segmented value={format} onChange={handleFormatChange} options={[
            { value: 'CODE128', label: 'Code 128' },
            { value: 'EAN13', label: 'EAN-13' },
            { value: 'CODE39', label: 'Code 39' },
          ]} />
        </Field>

        <Field label="Value" hint={info.hint}>
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            className={`input font-mono ${!valid ? 'border-red-500 dark:border-red-500' : ''}`}
            placeholder={info.example}
          />
          {!valid && <p className="text-xs text-red-500 mt-1">Invalid input for {info.label}</p>}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Bar color"><input type="color" value={fg} onChange={e => setFg(e.target.value)} className="h-10 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-transparent cursor-pointer" /></Field>
          <Field label="Background"><input type="color" value={bg} onChange={e => setBg(e.target.value)} className="h-10 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-transparent cursor-pointer" /></Field>
        </div>

        <Field label="Show text below barcode">
          <Segmented value={showText ? 'yes' : 'no'} onChange={v => setShowText(v === 'yes')} options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ]} />
        </Field>

        <Field label={`Bar width: ${lineWidth}px`}>
          <input type="range" min={1} max={4} value={lineWidth} onChange={e => setLineWidth(+e.target.value)} className="w-full accent-brand-500" />
        </Field>

        <Field label={`Height: ${height}px`}>
          <input type="range" min={30} max={200} value={height} onChange={e => setHeight(+e.target.value)} className="w-full accent-brand-500" />
        </Field>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200 dark:border-ink-700">
          <Info className="w-4 h-4 text-accent-500 mt-0.5 shrink-0" />
          <p className="text-xs text-ink-500 dark:text-ink-400">{info.hint}. Example: <span className="font-mono text-ink-700 dark:text-ink-300">{info.example}</span></p>
        </div>
      </div>

      <div className="card p-5 grid gap-4 place-items-center">
        {valid && value ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full overflow-x-auto">
            <svg ref={svgRef} className="w-full max-w-md mx-auto" />
          </motion.div>
        ) : (
          <div className="w-full h-48 grid place-items-center rounded-xl border-2 border-dashed border-ink-300 dark:border-ink-700 text-ink-400">
            <p className="text-sm">Enter valid data to generate</p>
          </div>
        )}

        <div className="flex gap-2 flex-wrap justify-center">
          <button onClick={downloadPng} disabled={!valid || !value} className="btn-primary btn-sm"><Download className="h-4 w-4" /> PNG</button>
          <button onClick={downloadSvg} disabled={!valid || !value} className="btn-secondary btn-sm"><Download className="h-4 w-4" /> SVG</button>
        </div>
      </div>
    </div>
  )
}

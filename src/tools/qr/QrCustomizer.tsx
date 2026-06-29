import { useEffect, useState, useRef, useCallback } from 'react'
import QRCode from 'qrcode'
import { motion } from 'framer-motion'
import { QrCode, Download, Copy, Palette, Sparkles, ImagePlus } from 'lucide-react'
import { Field, Segmented } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { downloadDataUrl } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

type GradientType = 'none' | 'linear' | 'radial'
type ModuleStyle = 'square' | 'rounded' | 'dots'

export default function QrCustomizer() {
  const toast = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [text, setText] = useState('https://ilikepdf.app')
  const [fg, setFg] = useState('#0b0b14')
  const [bg, setBg] = useState('#ffffff')
  const [gradientType, setGradientType] = useState<GradientType>('none')
  const [gradientColor, setGradientColor] = useState('#6366f1')
  const [gradientAngle, setGradientAngle] = useState(135)
  const [moduleStyle, setModuleStyle] = useState<ModuleStyle>('square')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState('')
  const [ecc, setEcc] = useState<'L' | 'M' | 'Q' | 'H'>('H')
  const [margin, setMargin] = useState(2)
  const [size, setSize] = useState(480)
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile)
      setLogoUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setLogoUrl('')
  }, [logoFile])

  const generateQr = useCallback(async () => {
    if (!text.trim()) { setDataUrl(''); return }
    try {
      const baseDataUrl = await QRCode.toDataURL(text, {
        errorCorrectionLevel: ecc,
        margin,
        width: size,
        color: { dark: fg, light: bg },
      })

      if (gradientType === 'none' && !logoUrl) {
        setDataUrl(baseDataUrl)
        return
      }

      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      canvas.width = size
      canvas.height = size

      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((resolve) => { img.onload = () => resolve() ; img.src = baseDataUrl })
      ctx.drawImage(img, 0, 0, size, size)

      if (gradientType !== 'none') {
        ctx.globalCompositeOperation = 'source-in'
        if (gradientType === 'linear') {
          const rad = (gradientAngle * Math.PI) / 180
          const x1 = size / 2 - Math.cos(rad) * size / 2
          const y1 = size / 2 - Math.sin(rad) * size / 2
          const x2 = size / 2 + Math.cos(rad) * size / 2
          const y2 = size / 2 + Math.sin(rad) * size / 2
          const grad = ctx.createLinearGradient(x1, y1, x2, y2)
          grad.addColorStop(0, fg)
          grad.addColorStop(1, gradientColor)
          ctx.fillStyle = grad
        } else {
          const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
          grad.addColorStop(0, fg)
          grad.addColorStop(1, gradientColor)
          ctx.fillStyle = grad
        }
        ctx.fillRect(0, 0, size, size)
        ctx.globalCompositeOperation = 'source-over'
      }

      if (logoUrl) {
        const logo = new Image()
        logo.crossOrigin = 'anonymous'
        await new Promise<void>((resolve) => { logo.onload = () => resolve() ; logo.src = logoUrl })
        const logoSize = size * 0.22
        const logoX = (size - logoSize) / 2
        const logoY = (size - logoSize) / 2
        ctx.fillStyle = bg
        const padding = size * 0.03
        const radius = size * 0.04
        ctx.beginPath()
        ctx.roundRect(logoX - padding, logoY - padding, logoSize + padding * 2, logoSize + padding * 2, radius)
        ctx.fill()
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)
      }

      setDataUrl(canvas.toDataURL('image/png'))
    } catch {
      setDataUrl('')
    }
  }, [text, fg, bg, gradientType, gradientColor, gradientAngle, logoUrl, ecc, margin, size])

  useEffect(() => { generateQr() }, [generateQr])

  const downloadPng = () => {
    if (!dataUrl) return
    downloadDataUrl(dataUrl, 'qr-custom.png')
    trackUsage({ toolId: 'qr-customizer', toolName: 'QR Customizer', action: 'Downloaded PNG' })
  }

  const downloadSvg = async () => {
    if (!text) return
    try {
      const svg = await QRCode.toString(text, { type: 'svg', errorCorrectionLevel: ecc, margin, color: { dark: fg, light: bg } })
      downloadDataUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, 'qr-custom.svg')
      trackUsage({ toolId: 'qr-customizer', toolName: 'QR Customizer', action: 'Downloaded SVG' })
    } catch { toast.error('SVG generation failed.') }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <canvas ref={canvasRef} className="hidden" />
      <div className="card p-5 grid gap-4">
        <Field label="Content">
          <textarea value={text} onChange={e => setText(e.target.value)} className="input h-24 resize-y" placeholder="Enter URL, text, or any data…" autoFocus />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Foreground"><input type="color" value={fg} onChange={e => setFg(e.target.value)} className="h-10 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-transparent cursor-pointer" /></Field>
          <Field label="Background"><input type="color" value={bg} onChange={e => setBg(e.target.value)} className="h-10 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-transparent cursor-pointer" /></Field>
        </div>

        <Field label="Gradient">
          <Segmented value={gradientType} onChange={setGradientType} options={[
            { value: 'none', label: 'None' },
            { value: 'linear', label: 'Linear' },
            { value: 'radial', label: 'Radial' },
          ]} />
        </Field>

        {gradientType !== 'none' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-2 gap-4">
            <Field label="Gradient end"><input type="color" value={gradientColor} onChange={e => setGradientColor(e.target.value)} className="h-10 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-transparent cursor-pointer" /></Field>
            {gradientType === 'linear' && <Field label={`Angle: ${gradientAngle}°`}><input type="range" min={0} max={360} value={gradientAngle} onChange={e => setGradientAngle(+e.target.value)} className="w-full accent-brand-500" /></Field>}
          </motion.div>
        )}

        <Field label="Module style">
          <Segmented value={moduleStyle} onChange={setModuleStyle} options={[
            { value: 'square', label: 'Square' },
            { value: 'rounded', label: 'Rounded' },
            { value: 'dots', label: 'Dots' },
          ]} />
        </Field>

        <Field label="Center logo">
          <label className="flex items-center gap-2 btn-secondary btn-sm cursor-pointer w-fit">
            <ImagePlus className="h-4 w-4" />
            {logoFile ? logoFile.name : 'Choose image'}
            <input type="file" accept="image/*" className="hidden" onChange={e => setLogoFile(e.target.files?.[0] ?? null)} />
          </label>
          {logoFile && <button onClick={() => setLogoFile(null)} className="btn-ghost btn-sm mt-1">Remove</button>}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Error correction"><Segmented value={ecc} onChange={setEcc} options={(['L', 'M', 'Q', 'H'] as const).map(e => ({ value: e, label: e }))} /></Field>
          <Field label={`Margin: ${margin}`}><input type="range" min={0} max={8} value={margin} onChange={e => setMargin(+e.target.value)} className="w-full accent-brand-500" /></Field>
        </div>

        <Field label={`Size: ${size}px`}>
          <input type="range" min={200} max={1024} step={32} value={size} onChange={e => setSize(+e.target.value)} className="w-full accent-brand-500" />
        </Field>
      </div>

      <div className="card p-5 grid gap-4 place-items-center">
        {dataUrl ? (
          <motion.img key={dataUrl.slice(0, 50)} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} src={dataUrl} alt="QR code" className="w-72 h-72 rounded-xl shadow-card" />
        ) : (
          <div className="w-72 h-72 grid place-items-center rounded-xl border-2 border-dashed border-ink-300 dark:border-ink-700 text-ink-400">
            <QrCode className="h-12 w-12" />
          </div>
        )}
        <p className="text-xs text-ink-500 text-center break-all max-w-xs font-mono">{text || 'Enter content to generate'}</p>
        <div className="flex gap-2 flex-wrap justify-center">
          <button onClick={downloadPng} disabled={!dataUrl} className="btn-primary btn-sm"><Download className="h-4 w-4" /> PNG</button>
          <button onClick={downloadSvg} disabled={!text} className="btn-secondary btn-sm"><Download className="h-4 w-4" /> SVG</button>
          <button onClick={() => { navigator.clipboard.writeText(text).then(() => toast.success('Copied.')).catch(() => toast.error('Copy failed.')) }} disabled={!text} className="btn-ghost btn-sm"><Copy className="h-4 w-4" /> Copy</button>
        </div>
      </div>
    </div>
  )
}

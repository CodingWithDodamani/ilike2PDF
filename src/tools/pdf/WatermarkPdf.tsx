import { useState } from 'react'
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'
import { Droplets, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { usePdfFile } from '@/hooks/usePdfFile'
import { baseName, downloadBlob, bytesToBlob } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

export default function WatermarkPdf() {
  const toast = useToast()
  const pdf = usePdfFile()
  const [text, setText] = useState('CONFIDENTIAL')
  const [opacity, setOpacity] = useState(0.2)
  const [size, setSize] = useState(48)
  const [angle, setAngle] = useState(45)
  const [color, setColor] = useState('#7c3aed')
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (!pdf.file || !pdf.data || !text.trim()) { toast.error('Enter watermark text.'); return }
    setBusy(true)
    try {
      const doc = await PDFDocument.load(pdf.data, { ignoreEncryption: true })
      const font = await doc.embedFont(StandardFonts.HelveticaBold)
      const [r, g, b] = hexToRgb(color)
      doc.getPages().forEach((page) => {
        const { width, height } = page.getSize()
        const tw = font.widthOfTextAtSize(text, size)
        page.drawText(text, {
          x: width / 2 - tw / 2,
          y: height / 2,
          size, font, color: rgb(r, g, b), opacity,
          rotate: degrees(angle),
        })
      })
      const bytes = await doc.save()
      downloadBlob(bytesToBlob(bytes, 'application/pdf'), `${baseName(pdf.file.name)}-watermarked.pdf`)
      trackUsage({ toolId: 'watermark-pdf', toolName: 'Watermark PDF', action: 'Added watermark', fileName: pdf.file.name, inputSize: pdf.file.size })
      toast.success('Watermark added.')
    } catch { toast.error('Failed to add watermark.') } finally { setBusy(false) }
  }

  if (!pdf.file || !pdf.data) {
    return (
      <div className="grid gap-3">
        <Dropzone accept={['application/pdf']} onFiles={(f) => pdf.load(f[0])} label="Drop a PDF to watermark" icon={<Droplets className="h-8 w-8" />} />
        {pdf.error && <p className="text-sm text-rose-500">{pdf.error}</p>}
      </div>
    )
  }

  return (
    <div className="card p-5 grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{pdf.file.name} · {pdf.count} pages</p>
        <button onClick={pdf.reset} className="btn-ghost btn-sm">Change file</button>
      </div>
      <Field label="Watermark text"><input value={text} onChange={(e) => setText(e.target.value)} className="input" /></Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={`Opacity: ${Math.round(opacity * 100)}%`}><input type="range" min={5} max={100} value={opacity * 100} onChange={(e) => setOpacity(+e.target.value / 100)} className="w-full accent-brand-500" /></Field>
        <Field label={`Font size: ${size}pt`}><input type="range" min={12} max={120} value={size} onChange={(e) => setSize(+e.target.value)} className="w-full accent-brand-500" /></Field>
        <Field label={`Angle: ${angle}°`}><input type="range" min={0} max={90} value={angle} onChange={(e) => setAngle(+e.target.value)} className="w-full accent-brand-500" /></Field>
        <Field label="Color"><input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-transparent" /></Field>
      </div>
      <button onClick={run} disabled={busy} className="btn-primary btn-md w-fit">{busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Apply & download</button>
    </div>
  )
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '')
  return [parseInt(m.slice(0, 2), 16) / 255, parseInt(m.slice(2, 4), 16) / 255, parseInt(m.slice(4, 6), 16) / 255]
}

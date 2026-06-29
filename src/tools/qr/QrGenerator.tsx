import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { motion } from 'framer-motion'
import { QrCode, Download, Copy } from 'lucide-react'
import { Field, Segmented } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { buildQrData, QR_FIELDS, type QrType } from '@/lib/qr'
import { downloadDataUrl } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

const TYPES: QrType[] = ['text', 'url', 'wifi', 'vcard', 'email', 'phone', 'sms', 'whatsapp', 'geo', 'event']

export default function QrGenerator() {
  const toast = useToast()
  const [type, setType] = useState<QrType>('url')
  const [fields, setFields] = useState<Record<string, string>>({ url: 'https://ilikepdf.app' })
  const [fg, setFg] = useState('#0b0b14')
  const [bg, setBg] = useState('#ffffff')
  const [ecc, setEcc] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const [margin, setMargin] = useState(2)
  const [dataUrl, setDataUrl] = useState('')

  const data = buildQrData(type, fields)

  useEffect(() => {
    if (!data) { setDataUrl(''); return }
    QRCode.toDataURL(data, { errorCorrectionLevel: ecc, margin, width: 480, color: { dark: fg, light: bg } })
      .then(setDataUrl)
      .catch(() => setDataUrl(''))
  }, [data, fg, bg, ecc, margin])

  const downloadPng = () => {
    if (!dataUrl) return
    downloadDataUrl(dataUrl, `qrcode-${type}.png`)
    trackUsage({ toolId: 'qr-generator', toolName: 'QR Generator', action: `Generated ${type} QR` })
  }
  const downloadSvg = async () => {
    try {
      const svg = await QRCode.toString(data, { type: 'svg', errorCorrectionLevel: ecc, margin, color: { dark: fg, light: bg } })
      downloadDataUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, `qrcode-${type}.svg`)
      trackUsage({ toolId: 'qr-generator', toolName: 'QR Generator', action: `Generated ${type} SVG` })
    } catch { toast.error('SVG generation failed.') }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="card p-5 grid gap-4">
        <Field label="QR type">
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <button key={t} onClick={() => { setType(t); setFields({}) }} className={`px-3 py-2.5 rounded-lg text-sm font-medium capitalize transition ${type === t ? 'bg-brand-500 text-white' : 'bg-ink-100 dark:bg-ink-800 hover:bg-ink-200 dark:hover:bg-ink-700'}`}>{t}</button>
            ))}
          </div>
        </Field>
        {QR_FIELDS[type].map((f) => (
          <Field key={f.key} label={f.label}>
            {f.type === 'textarea'
              ? <textarea value={fields[f.key] ?? ''} onChange={(e) => setFields((s) => ({ ...s, [f.key]: e.target.value }))} className="input h-24 resize-y" placeholder={f.placeholder} />
              : <input type={f.type ?? 'text'} value={fields[f.key] ?? ''} onChange={(e) => setFields((s) => ({ ...s, [f.key]: e.target.value }))} className="input" placeholder={f.placeholder} />}
          </Field>
        ))}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Foreground"><input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-10 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-transparent" /></Field>
          <Field label="Background"><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-10 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-transparent" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Error correction"><Segmented value={ecc} onChange={setEcc} options={(['L', 'M', 'Q', 'H'] as const).map((e) => ({ value: e, label: e }))} /></Field>
          <Field label={`Margin: ${margin}`}><input type="range" min={0} max={8} value={margin} onChange={(e) => setMargin(+e.target.value)} className="w-full accent-brand-500" /></Field>
        </div>
      </div>

      <div className="card p-5 grid gap-4 place-items-center">
        {dataUrl ? (
          <motion.img key={dataUrl} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} src={dataUrl} alt="QR code" className="w-64 h-64 rounded-xl shadow-card" />
        ) : (
          <div className="w-64 h-64 grid place-items-center rounded-xl border-2 border-dashed border-ink-300 dark:border-ink-700 text-ink-400"><QrCode className="h-12 w-12" /></div>
        )}
        <p className="text-xs text-ink-500 text-center break-all max-w-xs font-mono">{data || 'Enter details to generate a QR code'}</p>
        <div className="flex gap-2 flex-wrap justify-center">
          <button onClick={downloadPng} disabled={!dataUrl} className="btn-primary btn-sm"><Download className="h-4 w-4" /> PNG</button>
          <button onClick={downloadSvg} disabled={!data} className="btn-secondary btn-sm"><Download className="h-4 w-4" /> SVG</button>
          <button onClick={() => { navigator.clipboard.writeText(data).then(() => toast.success('Data copied.')).catch(() => toast.error('Copy failed.')) }} disabled={!data} className="btn-ghost btn-sm"><Copy className="h-4 w-4" /> Copy data</button>
        </div>
      </div>
    </div>
  )
}

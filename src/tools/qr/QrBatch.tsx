import { useState } from 'react'
import QRCode from 'qrcode'
import JSZip from 'jszip'
import { ScanLine, Download } from 'lucide-react'
import { Field, Spinner } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { downloadBlob } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

export default function QrBatch() {
  const toast = useToast()
  const [input, setInput] = useState('https://example.com\nWiFi password: hunter2\nhello@example.com')
  const [fg, setFg] = useState('#0b0b14')
  const [bg, setBg] = useState('#ffffff')
  const [busy, setBusy] = useState(false)
  const [previews, setPreviews] = useState<{ text: string; url: string }[]>([])

  const lines = input.split('\n').map((l) => l.trim()).filter(Boolean)

  const generate = async () => {
    if (!lines.length) { toast.error('Add at least one line.'); return }
    setBusy(true)
    try {
      const out = await Promise.all(lines.map(async (line) => {
        const url = await QRCode.toDataURL(line, { width: 300, margin: 2, color: { dark: fg, light: bg } })
        return { text: line, url }
      }))
      setPreviews(out)
      toast.success(`Generated ${out.length} QR codes.`)
    } catch { toast.error('Generation failed.') } finally { setBusy(false) }
  }

  const downloadZip = async () => {
    if (!previews.length) return
    const zip = new JSZip()
    previews.forEach((p, i) => {
      const safe = p.text.replace(/[^a-z0-9]+/gi, '_').slice(0, 40)
      zip.file(`${i + 1}-${safe || 'qr'}.png`, p.url.split(',')[1], { base64: true })
    })
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(blob, 'qr-batch.zip')
    trackUsage({ toolId: 'qr-batch', toolName: 'QR Batch', action: `Batch of ${previews.length}`, files: previews.length })
  }

  return (
    <div className="grid gap-5">
      <div className="card p-5 grid gap-4">
        <Field label="One entry per line" hint={`${lines.length} QR code${lines.length !== 1 ? 's' : ''} will be generated`}>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} className="input font-mono text-sm h-40 resize-y" placeholder="https://...\nText line 2\n..." />
        </Field>
        <div className="grid grid-cols-2 gap-4 max-w-xs">
          <Field label="Foreground"><input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-10 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-transparent" /></Field>
          <Field label="Background"><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-10 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-transparent" /></Field>
        </div>
        <div className="flex gap-2">
          <button onClick={generate} disabled={busy} className="btn-primary btn-md">{busy ? <Spinner className="h-4 w-4" /> : <ScanLine className="h-4 w-4" />} Generate all</button>
          {previews.length > 0 && <button onClick={downloadZip} className="btn-secondary btn-md"><Download className="h-4 w-4" /> Download ZIP</button>}
        </div>
      </div>
      {previews.length > 0 && (
        <div className="card p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((p, i) => (
              <a key={i} href={p.url} download={`qr-${i + 1}.png`} className="grid gap-1 place-items-center p-2 rounded-xl border border-ink-200 dark:border-ink-700">
                <img src={p.url} alt={p.text} className="w-full" />
                <span className="text-[11px] text-ink-500 truncate w-full text-center">{p.text}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

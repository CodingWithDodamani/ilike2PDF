import { useState } from 'react'
import QRCode from 'qrcode'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'
import { FileDown, Plus, Trash2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { downloadBlob, bytesToBlob } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

type QrItem = { text: string; label: string }

export default function QrToPdf() {
  const [items, setItems] = useState<QrItem[]>([{ text: '', label: '' }])
  const [cols, setCols] = useState<2 | 3>(2)
  const [busy, setBusy] = useState(false)

  const addItem = () => setItems((p) => [...p, { text: '', label: '' }])
  const removeItem = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof QrItem, value: string) =>
    setItems((p) => p.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)))

  const valid = items.filter((it) => it.text.trim())
  const hasContent = valid.length > 0

  const exportPdf = async () => {
    if (!hasContent) return
    setBusy(true)
    try {
      const doc = await PDFDocument.create()
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const pageW = cols === 3 ? 841.89 : 595.28
      const pageH = 841.89
      const margin = 40
      const gap = 20
      const cellW = (pageW - margin * 2 - gap * (cols - 1)) / cols
      const qrSize = Math.min(cellW, 160)
      const labelFontSize = 10
      const labelH = 16
      const cellH = qrSize + labelH + gap
      const rowsPerPage = Math.max(1, Math.floor((pageH - margin * 2) / cellH))
      const perPage = rowsPerPage * cols
      const totalPages = Math.ceil(valid.length / perPage)

      for (let p = 0; p < totalPages; p++) {
        const page = doc.addPage([pageW, pageH])
        const slice = valid.slice(p * perPage, p * perPage + perPage)

        for (let i = 0; i < slice.length; i++) {
          const col = i % cols
          const row = Math.floor(i / cols)
          const x = margin + col * (cellW + gap)
          const yTop = pageH - margin - row * cellH

          const pngDataUrl = await QRCode.toDataURL(slice[i].text, {
            width: 320,
            margin: 1,
            color: { dark: '#0b0b14', light: '#ffffff' },
          })
          const pngBytes = Uint8Array.from(atob(pngDataUrl.split(',')[1]), (c) => c.charCodeAt(0))
          const img = await doc.embedPng(pngBytes)
          page.drawImage(img, { x: x + (cellW - qrSize) / 2, y: yTop - qrSize, width: qrSize, height: qrSize })

          const lbl = slice[i].label.trim()
          if (lbl) {
            const truncated = lbl.length > 30 ? lbl.slice(0, 28) + '…' : lbl
            const textW = font.widthOfTextAtSize(truncated, labelFontSize)
            page.drawText(truncated, {
              x: x + (cellW - textW) / 2,
              y: yTop - qrSize - labelFontSize - 4,
              size: labelFontSize,
              font,
              color: rgb(0.3, 0.3, 0.3),
            })
          }
        }
      }

      const out = await doc.save()
      const blob = bytesToBlob(out, 'application/pdf')
      downloadBlob(blob, 'qrcodes.pdf')
      trackUsage({ toolId: 'qr-to-pdf', toolName: 'QR to PDF', action: 'Exported QR codes to PDF', files: valid.length })
    } catch {
      /* empty */
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">QR to PDF</h2>
      <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">Generate QR codes and export them as a PDF document.</p>
      <div className="grid gap-4">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1 grid sm:grid-cols-2 gap-2">
              <input value={item.text} onChange={(e) => updateItem(i, 'text', e.target.value)} className="input" placeholder="Text or URL" />
              <input value={item.label} onChange={(e) => updateItem(i, 'label', e.target.value)} className="input" placeholder="Label (optional)" />
            </div>
            {items.length > 1 && (
              <button onClick={() => removeItem(i)} className="btn-secondary btn-sm mt-0.5"><Trash2 className="h-4 w-4" /></button>
            )}
          </div>
        ))}
        <button onClick={addItem} className="btn-secondary btn-sm w-fit"><Plus className="h-4 w-4" /> Add item</button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-500">Columns per row:</span>
          <button onClick={() => setCols(2)} className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition', cols === 2 ? 'bg-brand-500 text-white' : 'bg-ink-100 dark:bg-ink-800')}>2</button>
          <button onClick={() => setCols(3)} className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition', cols === 3 ? 'bg-brand-500 text-white' : 'bg-ink-100 dark:bg-ink-800')}>3</button>
        </div>
        {hasContent && (
          <div className="card p-4">
            <p className="text-xs text-ink-500 mb-3">Preview</p>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {valid.map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <QRCodeSVG value={item.text} size={120} />
                  {item.label.trim() && <span className="text-xs text-ink-600 dark:text-ink-300 text-center truncate w-full">{item.label}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        <button onClick={exportPdf} disabled={busy || !hasContent} className="btn-primary btn-sm w-fit">
          <FileDown className="h-4 w-4" /> {busy ? 'Exporting…' : 'Export PDF'}
        </button>
      </div>
    </Section>
  )
}

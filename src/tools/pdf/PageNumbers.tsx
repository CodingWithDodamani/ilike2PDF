import { useState } from 'react'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { Hash, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field, Segmented } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { usePdfFile } from '@/hooks/usePdfFile'
import { baseName, downloadBlob, bytesToBlob } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

type Pos = 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right'
type Fmt = 'n' | 'n-of-total' | 'page-n'

export default function PageNumbers() {
  const toast = useToast()
  const pdf = usePdfFile()
  const [pos, setPos] = useState<Pos>('bottom-center')
  const [fmt, setFmt] = useState<Fmt>('n')
  const [size, setSize] = useState(11)
  const [start, setStart] = useState(1)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (!pdf.file || !pdf.data) return
    setBusy(true)
    try {
      const doc = await PDFDocument.load(pdf.data, { ignoreEncryption: true })
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const pages = doc.getPages()
      const total = pages.length
      pages.forEach((page, i) => {
        const n = start + i
        const label = fmt === 'n' ? `${n}` : fmt === 'page-n' ? `Page ${n}` : `${n} / ${start + total - 1}`
        const { width, height } = page.getSize()
        const tw = font.widthOfTextAtSize(label, size)
        const margin = 24
        let x = width / 2 - tw / 2
        let y = margin
        if (pos.includes('right')) x = width - tw - margin
        if (pos.includes('left')) x = margin
        if (pos.startsWith('top')) y = height - margin - size
        page.drawText(label, { x, y, size, font, color: rgb(0.3, 0.3, 0.35) })
      })
      const bytes = await doc.save()
      downloadBlob(bytesToBlob(bytes, 'application/pdf'), `${baseName(pdf.file.name)}-numbered.pdf`)
      trackUsage({ toolId: 'page-numbers', toolName: 'Add Page Numbers', action: 'Added page numbers', fileName: pdf.file.name, inputSize: pdf.file.size })
      toast.success('Page numbers added.')
    } catch { toast.error('Failed.') } finally { setBusy(false) }
  }

  if (!pdf.file || !pdf.data) {
    return (
      <div className="grid gap-3">
        <Dropzone accept={['application/pdf']} onFiles={(f) => pdf.load(f[0])} label="Drop a PDF" icon={<Hash className="h-8 w-8" />} />
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
      <Field label="Position">
        <Segmented value={pos} onChange={setPos} options={[
          { value: 'bottom-center', label: 'Bottom ¢' }, { value: 'bottom-right', label: 'Bottom →' },
          { value: 'bottom-left', label: '← Bottom' }, { value: 'top-center', label: 'Top ¢' }, { value: 'top-right', label: 'Top →' },
        ]} />
      </Field>
      <Field label="Format">
        <Segmented value={fmt} onChange={setFmt} options={[{ value: 'n', label: '1' }, { value: 'n-of-total', label: '1 / N' }, { value: 'page-n', label: 'Page 1' }]} />
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={`Font size: ${size}pt`}><input type="range" min={8} max={24} value={size} onChange={(e) => setSize(+e.target.value)} className="w-full accent-brand-500" /></Field>
        <Field label="Start at"><input type="number" min={0} value={start} onChange={(e) => setStart(+e.target.value)} className="input" /></Field>
      </div>
      <button onClick={run} disabled={busy} className="btn-primary btn-md w-fit">{busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Apply & download</button>
    </div>
  )
}

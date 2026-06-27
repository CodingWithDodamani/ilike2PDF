import { useState } from 'react'
import { PDFDocument, PageSizes } from 'pdf-lib'
import { Ruler, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field, Segmented } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { usePdfFile } from '@/hooks/usePdfFile'
import { baseName, downloadBlob, bytesToBlob } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

type SizeKey = 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'Tabloid'
const SIZES: Record<SizeKey, [number, number]> = {
  A4: PageSizes.A4, A3: PageSizes.A3, A5: PageSizes.A5, Letter: PageSizes.Letter, Legal: PageSizes.Legal, Tabloid: PageSizes.Tabloid,
}

export default function PdfPageSize() {
  const toast = useToast()
  const pdf = usePdfFile()
  const [target, setTarget] = useState<SizeKey>('A4')
  const [orient, setOrient] = useState<'portrait' | 'landscape'>('portrait')
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (!pdf.file || !pdf.data) return
    setBusy(true)
    try {
      const src = await PDFDocument.load(pdf.data, { ignoreEncryption: true })
      const out = await PDFDocument.create()
      let [tw, th] = SIZES[target]
      if (orient === 'landscape') [tw, th] = [th, tw]
      const embedded = await out.embedPdf(src, src.getPageIndices())
      embedded.forEach((emb) => {
        const page = out.addPage([tw, th])
        const scale = Math.min(tw / emb.width, th / emb.height)
        const w = emb.width * scale
        const h = emb.height * scale
        page.drawPage(emb, { x: (tw - w) / 2, y: (th - h) / 2, width: w, height: h })
      })
      const bytes = await out.save()
      downloadBlob(bytesToBlob(bytes, 'application/pdf'), `${baseName(pdf.file.name)}-${target}.pdf`)
      trackUsage({ toolId: 'pdf-page-size', toolName: 'Page Size Converter', action: `Converted to ${target}`, fileName: pdf.file.name, inputSize: pdf.file.size })
      toast.success(`Converted to ${target}.`)
    } catch { toast.error('Conversion failed.') } finally { setBusy(false) }
  }

  if (!pdf.file || !pdf.data) {
    return (
      <div className="grid gap-3">
        <Dropzone accept={['application/pdf']} onFiles={(f) => pdf.load(f[0])} label="Drop a PDF to resize pages" icon={<Ruler className="h-8 w-8" />} />
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
      <Field label="Target size">
        <Segmented value={target} onChange={setTarget} options={(Object.keys(SIZES) as SizeKey[]).map((k) => ({ value: k, label: k }))} />
      </Field>
      <Field label="Orientation">
        <Segmented value={orient} onChange={setOrient} options={[{ value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]} />
      </Field>
      <button onClick={run} disabled={busy} className="btn-primary btn-md w-fit">{busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Convert & download</button>
    </div>
  )
}

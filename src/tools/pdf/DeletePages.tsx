import { useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import { FileMinus2, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { PdfPageGrid } from '@/components/PdfPageGrid'
import { Spinner } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { usePdfFile } from '@/hooks/usePdfFile'
import { baseName, downloadBlob, bytesToBlob } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

export default function DeletePages() {
  const toast = useToast()
  const pdf = usePdfFile()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)

  const toggle = (p: number) => setSelected((s) => { const n = new Set(s); if (n.has(p)) n.delete(p); else n.add(p); return n })

  const run = async () => {
    if (!pdf.file || !pdf.data || selected.size === 0) { toast.error('Select pages to delete.'); return }
    if (selected.size >= pdf.count) { toast.error('You cannot delete every page.'); return }
    setBusy(true)
    try {
      const src = await PDFDocument.load(pdf.data, { ignoreEncryption: true })
      const out = await PDFDocument.create()
      const keep = Array.from({ length: pdf.count }, (_, i) => i).filter((i) => !selected.has(i))
      const pages = await out.copyPages(src, keep)
      pages.forEach((p) => out.addPage(p))
      const bytes = await out.save()
      downloadBlob(bytesToBlob(bytes, 'application/pdf'), `${baseName(pdf.file.name)}-trimmed.pdf`)
      trackUsage({ toolId: 'delete-pages', toolName: 'Delete Pages', action: `Deleted ${selected.size} pages`, fileName: pdf.file.name, inputSize: pdf.file.size })
      toast.success('Pages deleted.')
    } catch { toast.error('Operation failed.') } finally { setBusy(false) }
  }

  if (!pdf.file || !pdf.data) {
    return (
      <div className="grid gap-3">
        <Dropzone accept={['application/pdf']} onFiles={(f) => pdf.load(f[0])} label="Drop a PDF" icon={<FileMinus2 className="h-8 w-8" />} />
        {pdf.error && <p className="text-sm text-rose-500">{pdf.error}</p>}
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <div className="card p-5 flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{pdf.file.name} · delete {selected.size} of {pdf.count}</p>
        <div className="flex gap-2">
          <button onClick={run} disabled={busy || selected.size === 0 || selected.size >= pdf.count} className="btn-primary btn-sm">{busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Delete & save</button>
          <button onClick={pdf.reset} className="btn-ghost btn-sm">Change file</button>
        </div>
      </div>
      <div className="card p-5">
        <p className="text-sm text-ink-500 mb-3">Tap the pages you want to remove.</p>
        <PdfPageGrid data={pdf.data} pageCount={pdf.count} selectable selected={selected} onToggle={toggle} />
      </div>
    </div>
  )
}

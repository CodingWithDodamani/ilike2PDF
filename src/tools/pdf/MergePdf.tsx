import { useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import { Combine, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { FileChips } from '@/components/FileChips'
import { Spinner } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { downloadBlob, bytesToBlob, fileToArrayBuffer } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

export default function MergePdf() {
  const toast = useToast()
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)

  const add = (f: File[]) => setFiles((prev) => [...prev, ...f])
  const remove = (i: number) => setFiles((p) => p.filter((_, idx) => idx !== i))
  const reorder = (from: number, to: number) =>
    setFiles((p) => { const c = [...p]; const [m] = c.splice(from, 1); c.splice(to, 0, m); return c })

  const merge = async () => {
    if (files.length < 2) { toast.error('Add at least two PDF files to merge.'); return }
    setBusy(true)
    try {
      const out = await PDFDocument.create()
      let total = 0
      for (const f of files) {
        total += f.size
        const buf = await fileToArrayBuffer(f)
        const src = await PDFDocument.load(buf, { ignoreEncryption: true })
        const pages = await out.copyPages(src, src.getPageIndices())
        pages.forEach((p) => out.addPage(p))
      }
      const bytes = await out.save()
      const blob = bytesToBlob(bytes, 'application/pdf')
      downloadBlob(blob, 'merged.pdf')
      trackUsage({ toolId: 'merge-pdf', toolName: 'Merge PDF', action: 'Merged PDFs', files: files.length, inputSize: total, outputSize: blob.size })
      toast.success(`Merged ${files.length} PDFs successfully.`)
    } catch (e) {
      toast.error('Failed to merge. One of the files may be encrypted or corrupt.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-5">
      <Dropzone accept={['application/pdf']} multiple onFiles={add} label="Drop PDF files to merge" hint="Add two or more PDFs — drag to reorder" icon={<Combine className="h-8 w-8" />} />
      {files.length > 0 && (
        <div className="card p-5 grid gap-4">
          <p className="text-sm font-medium">{files.length} file{files.length > 1 ? 's' : ''} · drag to set the order</p>
          <FileChips files={files} onRemove={remove} onReorder={reorder} />
          <div className="grid gap-2">
            <button onClick={merge} disabled={busy || files.length < 2} className="btn-primary btn-md w-fit" title={files.length < 2 ? 'Add at least 2 PDFs to merge' : undefined}>
              {busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Merge & download
            </button>
            {files.length < 2 && <p className="text-xs text-ink-500">Add at least 2 PDFs to merge.</p>}
            <button onClick={() => setFiles([])} className="btn-ghost btn-md w-fit">Clear all</button>
          </div>
        </div>
      )}
    </div>
  )
}

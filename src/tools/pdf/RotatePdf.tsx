import { useState } from 'react'
import { PDFDocument, degrees } from 'pdf-lib'
import { RotateCw, Download, RotateCcw } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { PdfPageGrid } from '@/components/PdfPageGrid'
import { Spinner } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { usePdfFile } from '@/hooks/usePdfFile'
import { baseName, downloadBlob, bytesToBlob } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

export default function RotatePdf() {
  const toast = useToast()
  const pdf = usePdfFile()
  const [rot, setRot] = useState<Record<number, number>>({})
  const [busy, setBusy] = useState(false)

  const rotateOne = (p: number) => setRot((r) => ({ ...r, [p]: ((r[p] ?? 0) + 90) % 360 }))
  const rotateAll = (deg: number) => {
    const next: Record<number, number> = {}
    for (let i = 0; i < pdf.count; i++) next[i] = (((rot[i] ?? 0) + deg) % 360 + 360) % 360
    setRot(next)
  }

  const run = async () => {
    if (!pdf.file || !pdf.data) return
    setBusy(true)
    try {
      const doc = await PDFDocument.load(pdf.data, { ignoreEncryption: true })
      doc.getPages().forEach((page, i) => {
        const extra = rot[i] ?? 0
        if (extra) {
          const cur = page.getRotation().angle
          page.setRotation(degrees((cur + extra) % 360))
        }
      })
      const bytes = await doc.save()
      downloadBlob(bytesToBlob(bytes, 'application/pdf'), `${baseName(pdf.file.name)}-rotated.pdf`)
      trackUsage({ toolId: 'rotate-pdf', toolName: 'Rotate PDF', action: 'Rotated pages', fileName: pdf.file.name, inputSize: pdf.file.size })
      toast.success('Rotated PDF saved.')
    } catch { toast.error('Rotation failed.') } finally { setBusy(false) }
  }

  if (!pdf.file || !pdf.data) {
    return (
      <div className="grid gap-3">
        <Dropzone accept={['application/pdf']} onFiles={(f) => pdf.load(f[0])} label="Drop a PDF to rotate" icon={<RotateCw className="h-8 w-8" />} />
        {pdf.error && <p className="text-sm text-rose-500">{pdf.error}</p>}
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <div className="card p-5 flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-medium">{pdf.file.name} · {pdf.count} pages</p>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => rotateAll(-90)} className="btn-secondary btn-sm"><RotateCcw className="h-4 w-4" /> All left</button>
          <button onClick={() => rotateAll(90)} className="btn-secondary btn-sm"><RotateCw className="h-4 w-4" /> All right</button>
          <button onClick={run} disabled={busy} className="btn-primary btn-sm">{busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Save</button>
          <button onClick={pdf.reset} className="btn-ghost btn-sm">Change</button>
        </div>
      </div>
      <div className="card p-5">
        <p className="text-sm text-ink-500 mb-3">Use the rotate icons on each page, or rotate all at once with the buttons above.</p>
        <PdfPageGrid data={pdf.data} pageCount={pdf.count} rotations={rot} onRotate={rotateOne} />
      </div>
    </div>
  )
}

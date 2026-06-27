import { useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import { FileArchive, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field, Segmented, Progress, ResultBar } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { loadPdfDocument, renderPageToCanvas } from '@/lib/pdf'
import { baseName, canvasToBlob, downloadBlob, bytesToBlob, fileToArrayBuffer, formatBytes } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

type Quality = 'low' | 'medium' | 'high'
const PRESET: Record<Quality, { scale: number; quality: number; label: string }> = {
  low: { scale: 1.0, quality: 0.5, label: 'Strong (smallest)' },
  medium: { scale: 1.4, quality: 0.7, label: 'Balanced' },
  high: { scale: 2.0, quality: 0.85, label: 'Light (best quality)' },
}

export default function CompressPdf() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<ArrayBuffer | null>(null)
  const [quality, setQuality] = useState<Quality>('medium')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ input: number; output: number; blob: Blob; name: string } | null>(null)

  const onFile = async (files: File[]) => {
    setResult(null)
    try {
      const buf = await fileToArrayBuffer(files[0])
      await loadPdfDocument(buf.slice(0))
      setFile(files[0]); setData(buf)
    } catch { toast.error('Could not open PDF (it may be encrypted).') }
  }

  const run = async () => {
    if (!file || !data) return
    setBusy(true); setProgress(0); setResult(null)
    try {
      const { scale, quality: q } = PRESET[quality]
      const doc = await loadPdfDocument(data.slice(0))
      const out = await PDFDocument.create()
      for (let i = 1; i <= doc.numPages; i++) {
        const canvas = await renderPageToCanvas(doc, i, scale)
        const jpgBlob = await canvasToBlob(canvas, 'image/jpeg', q)
        const jpgBytes = await jpgBlob.arrayBuffer()
        const img = await out.embedJpg(jpgBytes)
        // preserve aspect by using original page size in points
        const page = await doc.getPage(i)
        const vp = page.getViewport({ scale: 1 })
        const p = out.addPage([vp.width, vp.height])
        p.drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height })
        setProgress(Math.round((i / doc.numPages) * 100))
      }
      const bytes = await out.save()
      const blob = bytesToBlob(bytes, 'application/pdf')
      setResult({ input: file.size, output: blob.size, blob, name: `${baseName(file.name)}-compressed.pdf` })
      trackUsage({ toolId: 'compress-pdf', toolName: 'Compress PDF', action: `Compressed (${quality})`, fileName: file.name, inputSize: file.size, outputSize: blob.size })
      if (blob.size >= file.size) toast.info('This PDF was already well-optimized — try a stronger preset.')
      else toast.success(`Reduced by ${Math.round((1 - blob.size / file.size) * 100)}%.`)
    } catch { toast.error('Compression failed.') } finally { setBusy(false); setProgress(0) }
  }

  if (!file || !data) {
    return (
      <div className="grid gap-3">
        <Dropzone accept={['application/pdf']} onFiles={onFile} label="Drop a PDF to compress" icon={<FileArchive className="h-8 w-8" />} />
        <p className="text-xs text-ink-500">Note: compression works by re-rasterizing pages, so text becomes part of the image. Best for scanned or image-heavy PDFs.</p>
      </div>
    )
  }

  return (
    <div className="card p-5 grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{file.name} · {formatBytes(file.size)}</p>
        <button onClick={() => { setFile(null); setData(null); setResult(null) }} className="btn-ghost btn-sm">Change file</button>
      </div>
      <Field label="Compression level">
        <Segmented value={quality} onChange={setQuality} options={(['low', 'medium', 'high'] as Quality[]).map((q) => ({ value: q, label: PRESET[q].label }))} />
      </Field>
      {busy && <Progress value={progress} />}
      <button onClick={result ? () => downloadBlob(result.blob, result.name) : run} disabled={busy} className="btn-primary btn-md w-fit">
        {busy ? <Spinner className="h-4 w-4" /> : result ? <Download className="h-4 w-4" /> : <FileArchive className="h-4 w-4" />} {result ? 'Download' : 'Compress'}
      </button>
      {result && <ResultBar inputSize={result.input} outputSize={result.output} />}
    </div>
  )
}

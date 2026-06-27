import { useState } from 'react'
import JSZip from 'jszip'
import { FileImage, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field, Segmented, Progress } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { loadPdfDocument, renderPageToCanvas } from '@/lib/pdf'
import { baseName, canvasToBlob, downloadBlob, fileToArrayBuffer } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

export default function PdfToImage() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<ArrayBuffer | null>(null)
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/png')
  const [scale, setScale] = useState(2)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)

  const onFile = async (files: File[]) => {
    try {
      const buf = await fileToArrayBuffer(files[0])
      await loadPdfDocument(buf.slice(0))
      setFile(files[0]); setData(buf)
    } catch { toast.error('Could not open PDF (it may be encrypted).') }
  }

  const run = async () => {
    if (!file || !data) return
    setBusy(true); setProgress(0)
    try {
      const doc = await loadPdfDocument(data.slice(0))
      const zip = new JSZip()
      const ext = format === 'image/png' ? 'png' : 'jpg'
      const name = baseName(file.name)
      for (let i = 1; i <= doc.numPages; i++) {
        const canvas = await renderPageToCanvas(doc, i, scale)
        const blob = await canvasToBlob(canvas, format, 0.9)
        zip.file(`${name}-page-${i}.${ext}`, blob)
        setProgress(Math.round((i / doc.numPages) * 100))
      }
      const out = await zip.generateAsync({ type: 'blob' })
      downloadBlob(out, `${name}-images.zip`)
      trackUsage({ toolId: 'pdf-to-image', toolName: 'PDF to Image', action: `Rendered ${doc.numPages} pages`, fileName: file.name, inputSize: file.size, outputSize: out.size })
      toast.success(`Exported ${doc.numPages} images.`)
    } catch { toast.error('Rendering failed.') } finally { setBusy(false); setProgress(0) }
  }

  if (!file || !data) {
    return <Dropzone accept={['application/pdf']} onFiles={onFile} label="Drop a PDF to convert to images" icon={<FileImage className="h-8 w-8" />} />
  }

  return (
    <div className="card p-5 grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{file.name}</p>
        <button onClick={() => { setFile(null); setData(null) }} className="btn-ghost btn-sm">Change file</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Format">
          <Segmented value={format} onChange={setFormat} options={[{ value: 'image/png', label: 'PNG' }, { value: 'image/jpeg', label: 'JPEG' }]} />
        </Field>
        <Field label={`Resolution: ${scale}×`} hint="Higher = sharper but larger files">
          <input type="range" min={1} max={4} step={0.5} value={scale} onChange={(e) => setScale(+e.target.value)} className="w-full accent-brand-500" />
        </Field>
      </div>
      {busy && <Progress value={progress} />}
      <button onClick={run} disabled={busy} className="btn-primary btn-md w-fit">
        {busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Convert & download ZIP
      </button>
    </div>
  )
}

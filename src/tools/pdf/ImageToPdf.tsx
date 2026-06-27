import { useState } from 'react'
import { PDFDocument, PageSizes } from 'pdf-lib'
import { Image as ImageIcon, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { FileChips } from '@/components/FileChips'
import { Spinner, Field, Segmented } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { downloadBlob, bytesToBlob, fileToArrayBuffer } from '@/lib/utils'
import { convertImageFile } from '@/lib/image'
import { trackUsage } from '@/lib/storage'

type Size = 'A4' | 'Letter' | 'fit'
type Orient = 'portrait' | 'landscape'

export default function ImageToPdf() {
  const toast = useToast()
  const [files, setFiles] = useState<File[]>([])
  const [size, setSize] = useState<Size>('A4')
  const [orient, setOrient] = useState<Orient>('portrait')
  const [margin, setMargin] = useState(24)
  const [busy, setBusy] = useState(false)

  const add = (f: File[]) => setFiles((p) => [...p, ...f])
  const remove = (i: number) => setFiles((p) => p.filter((_, idx) => idx !== i))
  const reorder = (from: number, to: number) =>
    setFiles((p) => { const c = [...p]; const [m] = c.splice(from, 1); c.splice(to, 0, m); return c })

  const make = async () => {
    if (!files.length) { toast.error('Add at least one image.'); return }
    setBusy(true)
    try {
      const doc = await PDFDocument.create()
      let total = 0
      for (const f of files) {
        total += f.size
        // Normalize to PNG/JPEG that pdf-lib supports
        let bytes: ArrayBuffer
        let isPng = f.type === 'image/png'
        if (f.type === 'image/png' || f.type === 'image/jpeg') {
          bytes = await fileToArrayBuffer(f)
        } else {
          const conv = await convertImageFile(f, 'image/jpeg', 0.92)
          bytes = await conv.arrayBuffer()
          isPng = false
        }
        const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes)
        let pw: number, ph: number
        if (size === 'fit') {
          pw = img.width + margin * 2
          ph = img.height + margin * 2
        } else {
          ;[pw, ph] = size === 'A4' ? PageSizes.A4 : PageSizes.Letter
          if (orient === 'landscape') [pw, ph] = [ph, pw]
        }
        const page = doc.addPage([pw, ph])
        const maxW = pw - margin * 2
        const maxH = ph - margin * 2
        const scale = Math.min(maxW / img.width, maxH / img.height, 1)
        const w = img.width * scale
        const h = img.height * scale
        page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h })
      }
      const out = await doc.save()
      const blob = bytesToBlob(out, 'application/pdf')
      downloadBlob(blob, 'images.pdf')
      trackUsage({ toolId: 'image-to-pdf', toolName: 'Image to PDF', action: 'Created PDF from images', files: files.length, inputSize: total, outputSize: blob.size })
      toast.success('PDF created successfully.')
    } catch {
      toast.error('Failed to create PDF. Check your image files.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-5">
      <Dropzone accept={['image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/gif']} multiple onFiles={add} label="Drop images to convert to PDF" hint="JPG, PNG, WebP — drag to reorder" icon={<ImageIcon className="h-8 w-8" />} />
      {files.length > 0 && (
        <div className="card p-5 grid gap-4">
          <FileChips files={files} onRemove={remove} onReorder={reorder} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Page size">
              <Segmented value={size} onChange={setSize} options={[{ value: 'A4', label: 'A4' }, { value: 'Letter', label: 'Letter' }, { value: 'fit', label: 'Fit image' }]} />
            </Field>
            {size !== 'fit' && (
              <Field label="Orientation">
                <Segmented value={orient} onChange={setOrient} options={[{ value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]} />
              </Field>
            )}
          </div>
          <Field label={`Margin: ${margin}px`}>
            <input type="range" min={0} max={80} value={margin} onChange={(e) => setMargin(+e.target.value)} className="w-full accent-brand-500" />
          </Field>
          <div className="flex gap-2">
            <button onClick={make} disabled={busy} className="btn-primary btn-md">
              {busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Create PDF
            </button>
            <button onClick={() => setFiles([])} className="btn-ghost btn-md">Clear</button>
          </div>
        </div>
      )}
    </div>
  )
}

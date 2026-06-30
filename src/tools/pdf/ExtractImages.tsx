import { useState } from 'react'
import JSZip from 'jszip'
import { Images, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Progress, EmptyHint } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { loadPdfDocument } from '@/lib/pdf'
import { baseName, downloadBlob, fileToArrayBuffer } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

export default function ExtractImages() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)

  const onFile = async (files: File[]) => {
    const f = files[0]
    setFile(f); setBusy(true); setImages([]); setProgress(0)
    try {
      const buf = await fileToArrayBuffer(f)
      const doc = await loadPdfDocument(buf)
      const { pdfjsLib } = await import('@/lib/pdf')
      const found: string[] = []
      const seen = new Set<string>()
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const ops = await page.getOperatorList()
        for (let j = 0; j < ops.fnArray.length; j++) {
          if (ops.fnArray[j] === pdfjsLib.OPS.paintImageXObject) {
            const name = ops.argsArray[j][0]
            try {
              const img: any = await Promise.race([
                new Promise((res) => { page.objs.get(name, res) }),
                new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000)),
              ])
              if (!img || !img.width || seen.has(name)) continue
              seen.add(name)
              const canvas = document.createElement('canvas')
              canvas.width = img.width; canvas.height = img.height
              const ctx = canvas.getContext('2d')!
              const data = ctx.createImageData(img.width, img.height)
              putImage(img, data)
              ctx.putImageData(data, 0, 0)
              found.push(canvas.toDataURL('image/png'))
            } catch { /* skip */ }
          }
        }
        setProgress(Math.round((i / doc.numPages) * 100))
      }
      setImages(found)
      trackUsage({ toolId: 'extract-images', toolName: 'Extract Images', action: `Found ${found.length} images`, fileName: f.name, inputSize: f.size })
      if (!found.length) toast.info('No embedded raster images detected.')
      else toast.success(`Found ${found.length} images.`)
    } catch { toast.error('Extraction failed (PDF may be encrypted).') } finally { setBusy(false); setProgress(0) }
  }

  const downloadZip = async () => {
    if (!file || !images.length) return
    const zip = new JSZip()
    images.forEach((src, i) => {
      const base64 = src.split(',')[1]
      zip.file(`image-${i + 1}.png`, base64, { base64: true })
    })
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(blob, `${baseName(file.name)}-images.zip`)
  }

  return (
    <div className="grid gap-5">
      <Dropzone accept={['application/pdf']} onFiles={onFile} label="Drop a PDF to extract images" icon={<Images className="h-8 w-8" />} />
      {busy && <Progress value={progress} />}
      {file && !busy && (
        <div className="card p-5 grid gap-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-medium">{images.length} image{images.length !== 1 ? 's' : ''} found</p>
            {images.length > 0 && <button onClick={downloadZip} className="btn-primary btn-sm"><Download className="h-4 w-4" /> Download ZIP</button>}
          </div>
          {images.length === 0 ? <EmptyHint>No images extracted from this PDF.</EmptyHint> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((src, i) => (
                <a key={i} href={src} download={`image-${i + 1}.png`} className="block rounded-xl overflow-hidden border border-ink-200 dark:border-ink-700 bg-[repeating-conic-gradient(#e5e5e5_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
                  <img src={src} alt={`Extracted ${i + 1}`} className="w-full h-32 object-contain" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function putImage(img: any, data: ImageData) {
  const src = img.data as Uint8ClampedArray
  const out = data.data
  const px = img.width * img.height
  if (src.length === px * 4) {
    out.set(src)
  } else if (src.length === px * 3) {
    for (let i = 0, j = 0; i < px; i++, j += 3) {
      out[i * 4] = src[j]; out[i * 4 + 1] = src[j + 1]; out[i * 4 + 2] = src[j + 2]; out[i * 4 + 3] = 255
    }
  } else if (src.length === px) {
    for (let i = 0; i < px; i++) { out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = src[i]; out[i * 4 + 3] = 255 }
  } else {
    for (let i = 0; i < px; i++) { out[i * 4 + 3] = 255 }
  }
}

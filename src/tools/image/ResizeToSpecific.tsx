import { useEffect, useRef, useState } from 'react'
import { Maximize2, Download, Trash2 } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field, Segmented } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { downloadBlob, formatBytes, canvasToBlob, baseName, fileToImage } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

type OutputFormat = 'jpeg' | 'png'
type FitMode = 'cover' | 'contain'

interface FileResult {
  file: File
  originalSize: number
  resultBlob: Blob
  resultSize: number
  resultUrl: string
  origUrl: string
  name: string
  done: boolean
  progress: number
}

const TARGET_CM = { w: 3.5, h: 4.5 }
const DPI_OPTIONS = [300, 600]

function cmToPixels(cm: number, dpi: number): number {
  return Math.round((cm / 2.54) * dpi)
}

async function resizeToTarget(
  file: File,
  dpi: number,
  fit: FitMode,
  format: OutputFormat,
  quality: number,
  targetKB?: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await fileToImage(file)
  const tw = cmToPixels(TARGET_CM.w, dpi)
  const th = cmToPixels(TARGET_CM.h, dpi)

  const canvas = document.createElement('canvas')
  canvas.width = tw
  canvas.height = th
  const ctx = canvas.getContext('2d')!

  // White background for JPEG
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, tw, th)

  if (fit === 'cover') {
    const scale = Math.max(tw / img.naturalWidth, th / img.naturalHeight)
    const dw = img.naturalWidth * scale
    const dh = img.naturalHeight * scale
    ctx.drawImage(img, (tw - dw) / 2, (th - dh) / 2, dw, dh)
  } else {
    const scale = Math.min(tw / img.naturalWidth, th / img.naturalHeight)
    const dw = img.naturalWidth * scale
    const dh = img.naturalHeight * scale
    ctx.drawImage(img, (tw - dw) / 2, (th - dh) / 2, dw, dh)
  }

  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'

  // If target KB specified, binary search for quality
  if (targetKB && format === 'jpeg') {
    const targetBytes = targetKB * 1024
    let lo = 0.05
    let hi = 0.95
    let best: Blob | null = null

    for (let i = 0; i < 8; i++) {
      const q = (lo + hi) / 2
      const blob = await canvasToBlob(canvas, mimeType, q)
      if (blob.size <= targetBytes) {
        best = blob
        lo = q + 0.01
      } else {
        hi = q - 0.01
      }
    }

    if (best) return { blob: best, width: tw, height: th }
  }

  const blob = await canvasToBlob(canvas, mimeType, quality)
  return { blob, width: tw, height: th }
}

export default function ResizeToSpecific() {
  const toast = useToast()
  const [files, setFiles] = useState<FileResult[]>([])
  const [dpi, setDpi] = useState(300)
  const [fit, setFit] = useState<FitMode>('cover')
  const [format, setFormat] = useState<OutputFormat>('jpeg')
  const [quality, setQuality] = useState(92)
  const [compressKb, setCompressKb] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const cleanupRef = useRef<string[]>([])

  useEffect(() => {
    return () => { cleanupRef.current.forEach(URL.revokeObjectURL) }
  }, [])

  const tw = cmToPixels(TARGET_CM.w, dpi)
  const th = cmToPixels(TARGET_CM.h, dpi)

  const onFiles = async (newFiles: File[]) => {
    const results: FileResult[] = []
    for (const f of newFiles.slice(0, 10)) {
      const origUrl = URL.createObjectURL(f)
      cleanupRef.current.push(origUrl)
      results.push({
        file: f,
        originalSize: f.size,
        resultBlob: new Blob(),
        resultSize: 0,
        resultUrl: '',
        origUrl,
        name: f.name,
        done: false,
        progress: 0,
      })
    }
    setFiles(prev => [...prev, ...results])
  }

  const resizeAll = async () => {
    if (files.length === 0) return
    setBusy(true)
    try {
      const updated = await Promise.all(
        files.map(async (f) => {
          if (f.done) return f
          try {
            const { blob } = await resizeToTarget(f.file, dpi, fit, format, quality / 100, compressKb ?? undefined)
            const resultUrl = URL.createObjectURL(blob)
            cleanupRef.current.push(resultUrl)
            return { ...f, resultBlob: blob, resultSize: blob.size, resultUrl, done: true, progress: 100 }
          } catch {
            return f
          }
        })
      )
      setFiles(updated)
      trackUsage({ toolId: 'resize-to-specific', toolName: 'Resize to 3.5×4.5cm', action: `${files.length} files`, fileName: files[0].file.name, inputSize: files[0].file.size, outputSize: updated[0]?.resultSize || 0 })
      toast.success(`Resized ${updated.filter(f => f.done).length} image(s) to ${tw}×${th}px.`)
    } catch { toast.error('Resize failed.') } finally { setBusy(false) }
  }

  const downloadFile = (f: FileResult) => {
    const ext = format === 'png' ? 'png' : 'jpg'
    downloadBlob(f.resultBlob, `${baseName(f.file.name)}-3.5x4.5cm.${ext}`)
  }

  const downloadAll = async () => {
    const doneFiles = files.filter(f => f.done)
    if (doneFiles.length === 0) return
    for (const f of doneFiles) downloadFile(f)
  }

  const removeFile = (idx: number) => {
    const f = files[idx]
    if (f.origUrl) URL.revokeObjectURL(f.origUrl)
    if (f.resultUrl) URL.revokeObjectURL(f.resultUrl)
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const clearAll = () => {
    files.forEach(f => { if (f.origUrl) URL.revokeObjectURL(f.origUrl); if (f.resultUrl) URL.revokeObjectURL(f.resultUrl) })
    cleanupRef.current = []
    setFiles([])
  }

  return (
    <div className="grid gap-4">
      {files.length === 0 ? (
        <div className="grid gap-3">
          <Dropzone accept={['image/jpeg', 'image/png', 'image/webp']} multiple onFiles={onFiles} label="Drop images to resize to 3.5cm × 4.5cm" icon={<Maximize2 className="h-8 w-8" />} />
          <p className="text-xs text-ink-500">Standard size for Indian documents: PAN, Aadhaar, Passport, Voter ID, Driving License. Supports up to 10 images at once.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-medium">{files.length} image{files.length > 1 ? 's' : ''} · Output: {tw}×{th}px ({TARGET_CM.w}×{TARGET_CM.h}cm @ {dpi} DPI)</p>
            <button onClick={clearAll} className="btn-ghost btn-sm"><Trash2 className="h-4 w-4" /> Clear all</button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="DPI">
              <Segmented value={String(dpi)} onChange={(v) => setDpi(+v)} options={DPI_OPTIONS.map(d => ({ value: String(d), label: `${d} DPI` }))} />
            </Field>
            <Field label="Fit">
              <Segmented value={fit} onChange={setFit} options={[{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }]} />
            </Field>
            <Field label="Format">
              <Segmented value={format} onChange={setFormat} options={[{ value: 'jpeg', label: 'JPG' }, { value: 'png', label: 'PNG' }]} />
            </Field>
            {format === 'jpeg' && (
              <Field label={`Quality: ${quality}%`}>
                <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} className="w-full accent-brand-500" />
              </Field>
            )}
          </div>

          {format === 'jpeg' && (
            <Field label="Compress to specific size (optional)">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={10}
                  max={2000}
                  value={compressKb ?? ''}
                  onChange={(e) => setCompressKb(e.target.value ? +e.target.value : null)}
                  placeholder="e.g. 100"
                  className="input w-32"
                />
                <span className="text-sm text-ink-500">KB</span>
              </div>
            </Field>
          )}

          {/* File list */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((f, i) => (
              <div key={i} className="card p-3 flex gap-3 items-center">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{f.file.name}</p>
                  <p className="text-xs text-ink-500">{formatBytes(f.originalSize)}{f.done && <> → {formatBytes(f.resultSize)}</>}</p>
                  {f.done && f.resultUrl && (
                    <img src={f.resultUrl} alt="" className="mt-2 h-16 w-16 object-cover rounded border border-ink-200 dark:border-ink-700" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {f.done && <button onClick={() => downloadFile(f)} className="btn-ghost btn-sm !p-1"><Download className="h-4 w-4" /></button>}
                  <button onClick={() => removeFile(i)} className="btn-ghost btn-sm !p-1"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button onClick={resizeAll} disabled={busy || files.every(f => f.done)} className="btn-primary btn-md">
              {busy ? <Spinner className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {files.every(f => f.done) ? 'All done' : `Resize ${files.filter(f => !f.done).length} image(s)`}
            </button>
            {files.some(f => f.done) && (
              <button onClick={downloadAll} className="btn-secondary btn-md"><Download className="h-4 w-4" /> Download all</button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

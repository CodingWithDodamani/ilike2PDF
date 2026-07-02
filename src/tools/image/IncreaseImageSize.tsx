import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Download, Trash2 } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field, Segmented, Progress, ResultBar } from '@/components/ui'
import { BeforeAfter } from '@/components/BeforeAfter'
import { useToast } from '@/components/Toaster'
import { downloadBlob, formatBytes, canvasToBlob } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

type TargetPreset = 50 | 100 | 200 | 500 | 1000 | 2000 | 'custom'

interface FileResult {
  file: File
  originalSize: number
  resultBlob: Blob
  resultSize: number
  resultUrl: string
  origUrl: string
  name: string
  done: boolean
}

const PRESETS: { label: string; value: TargetPreset; kb: number }[] = [
  { label: '50 KB', value: 50, kb: 50 },
  { label: '100 KB', value: 100, kb: 100 },
  { label: '200 KB', value: 200, kb: 200 },
  { label: '500 KB', value: 500, kb: 500 },
  { label: '1 MB', value: 1000, kb: 1000 },
  { label: '2 MB', value: 2000, kb: 2000 },
]

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => { resolve(img); URL.revokeObjectURL(url) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
    img.src = url
  })
}

async function increaseToTargetSize(
  file: File,
  targetKB: number,
  onProgress?: (pct: number) => void,
): Promise<Blob> {
  const targetBytes = targetKB * 1024
  const img = await blobToImage(file)
  const baseW = img.naturalWidth || img.width
  const baseH = img.naturalHeight || img.height
  const srcType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'

  // Scale factors to try — going larger
  const scaleSteps = [1.0, 1.1, 1.2, 1.4, 1.6, 2.0, 2.5, 3.0]

  for (let s = 0; s < scaleSteps.length; s++) {
    onProgress?.(((s + 1) / (scaleSteps.length + 1)) * 100)
    const scale = scaleSteps[s]
    const w = Math.round(baseW * scale)
    const h = Math.round(baseH * scale)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)

    // At larger scales, try high quality first
    const qualities = [0.98, 0.95, 0.92, 0.90]

    for (const q of qualities) {
      const blob = await canvasToBlob(canvas, srcType, q)
      if (blob.size >= targetBytes) {
        return blob
      }
    }

    // Even at max quality, check if we got close enough (within 5%)
    const bestBlob = await canvasToBlob(canvas, srcType, 0.98)
    if (bestBlob.size >= targetBytes * 0.95) {
      return bestBlob
    }
  }

  // If all scale steps fail, try maximum resolution with PNG
  const maxW = Math.round(baseW * 3)
  const maxH = Math.round(baseH * 3)
  const canvas = document.createElement('canvas')
  canvas.width = maxW
  canvas.height = maxH
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, maxW, maxH)
  ctx.drawImage(img, 0, 0, maxW, maxH)

  // PNG is lossless — try that as last resort
  const pngBlob = await canvasToBlob(canvas, 'image/png')
  return pngBlob
}

export default function IncreaseImageSize() {
  const toast = useToast()
  const [files, setFiles] = useState<FileResult[]>([])
  const [preset, setPreset] = useState<TargetPreset>(100)
  const [customKb, setCustomKb] = useState(100)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const cleanupRef = useRef<string[]>([])

  useEffect(() => {
    return () => { cleanupRef.current.forEach(URL.revokeObjectURL) }
  }, [])

  const targetKB = preset === 'custom' ? Math.max(10, Math.min(5000, customKb)) : preset

  const onFiles = async (newFiles: File[]) => {
    const f = newFiles[0]
    if (!f) return
    const origUrl = URL.createObjectURL(f)
    setFiles([{ file: f, originalSize: f.size, resultBlob: new Blob(), resultSize: 0, resultUrl: '', origUrl, name: f.name, done: false }])
    cleanupRef.current.push(origUrl)
  }

  const run = async () => {
    if (files.length === 0) return
    const file = files[0]
    if (file.originalSize >= targetKB * 1024) {
      toast.info(`File is already ${formatBytes(file.originalSize)}, which is larger than ${targetKB} KB. No increase needed.`)
      return
    }
    setBusy(true); setProgress(0)
    try {
      const blob = await increaseToTargetSize(file.file, targetKB, setProgress)
      const resultUrl = URL.createObjectURL(blob)
      cleanupRef.current.push(resultUrl)
      setFiles([{ ...file, resultBlob: blob, resultSize: blob.size, resultUrl, done: true }])
      trackUsage({ toolId: 'increase-image-size', toolName: 'Increase Image Size', action: `To ${targetKB}KB`, fileName: file.file.name, inputSize: file.file.size, outputSize: blob.size })
      toast.success(`Increased to ${formatBytes(blob.size)}.`)
    } catch { toast.error('Increase failed.') } finally { setBusy(false) }
  }

  const download = () => {
    const f = files[0]
    if (!f?.done) return
    const ext = f.file.type === 'image/png' ? 'png' : 'jpg'
    downloadBlob(f.resultBlob, `${f.name.replace(/\.[^.]+$/, '')}-${targetKB}kb.${ext}`)
  }

  const remove = () => {
    files.forEach(f => { if (f.origUrl) URL.revokeObjectURL(f.origUrl); if (f.resultUrl) URL.revokeObjectURL(f.resultUrl) })
    setFiles([])
    cleanupRef.current = []
  }

  if (files.length === 0) {
    return (
      <div className="grid gap-3">
        <Dropzone accept={['image/jpeg', 'image/png', 'image/webp']} onFiles={onFiles} label="Drop an image to increase its size" icon={<ArrowUp className="h-8 w-8" />} />
        <p className="text-xs text-ink-500">Useful when a website requires a minimum file size for uploads (e.g., government portals).</p>
      </div>
    )
  }

  const file = files[0]
  const ratio = file.done ? file.resultSize / file.originalSize : 0

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{file.file.name} · {formatBytes(file.originalSize)}</p>
        <button onClick={remove} className="btn-ghost btn-sm"><Trash2 className="h-4 w-4" /> Remove</button>
      </div>

      {!file.done && (
        <>
          <Field label="Target size">
            <Segmented
              value={String(preset)}
              onChange={(v) => setPreset(v === 'custom' ? 'custom' : +v as TargetPreset)}
              options={[...PRESETS.map(p => ({ value: String(p.value), label: p.label })), { value: 'custom', label: 'Custom' }]}
            />
          </Field>
          {preset === 'custom' && (
            <Field label={`Custom target (KB): ${customKb}`}>
              <input type="range" min={10} max={5000} step={10} value={customKb} onChange={(e) => setCustomKb(+e.target.value)} className="w-full accent-brand-500" />
            </Field>
          )}
          <p className="text-xs text-ink-500">Target: {targetKB} KB ({formatBytes(targetKB * 1024)})</p>
          {busy && <Progress value={progress} />}
          <button onClick={run} disabled={busy} className="btn-primary btn-md w-fit">{busy ? <Spinner className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />} Increase to {targetKB} KB</button>
        </>
      )}

      {file.done && (
        <>
          <ResultBar inputSize={file.originalSize} outputSize={file.resultSize} />
          <div className="rounded-lg bg-ink-100 dark:bg-ink-850 p-3 text-xs grid grid-cols-2 gap-2">
            <div><span className="text-ink-500">Original:</span> {formatBytes(file.originalSize)}</div>
            <div><span className="text-ink-500">Result:</span> {formatBytes(file.resultSize)}</div>
            <div><span className="text-ink-500">Increase:</span> {ratio.toFixed(1)}×</div>
            <div><span className="text-ink-500">Format:</span> {file.file.type === 'image/png' ? 'PNG' : 'JPEG'}</div>
          </div>
          <BeforeAfter before={file.origUrl} after={file.resultUrl} />
          <div className="flex gap-2 flex-wrap">
            <button onClick={download} className="btn-primary btn-md"><Download className="h-4 w-4" /> Download</button>
            <button onClick={() => { setFiles([]); cleanupRef.current = [] }} className="btn-secondary btn-md">Process another</button>
          </div>
        </>
      )}
    </div>
  )
}

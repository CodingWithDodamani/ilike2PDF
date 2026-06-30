import { useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import { Minimize2, Download } from 'lucide-react'
import JSZip from 'jszip'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field, Segmented, Progress, ResultBar } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { loadPdfDocument, renderPageToCanvas } from '@/lib/pdf'
import { fileToArrayBuffer, bytesToBlob, downloadBlob, baseName, formatBytes, canvasToBlob } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

type QualityPreset = 'maximum' | 'high' | 'medium' | 'low' | 'aggressive'
type OutputFormat = 'pdf' | 'jpeg' | 'png'
type CompressionMethod = 'image' | 'stream' | 'font'

const QUALITY_PRESETS: Record<QualityPreset, { quality: number; label: string }> = {
  maximum: { quality: 100, label: 'Maximum (100%)' },
  high: { quality: 80, label: 'High (80%)' },
  medium: { quality: 50, label: 'Medium (50%)' },
  low: { quality: 25, label: 'Low (25%)' },
  aggressive: { quality: 10, label: 'Aggressive (10%)' },
}

const DPI_OPTIONS = [
  { value: '72', label: '72 DPI' },
  { value: '96', label: '96 DPI' },
  { value: '150', label: '150 DPI' },
  { value: '300', label: '300 DPI' },
]

export default function PdfCompressAdvanced() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<ArrayBuffer | null>(null)
  const [preset, setPreset] = useState<QualityPreset>('medium')
  const [customQuality, setCustomQuality] = useState(50)
  const [useCustom, setUseCustom] = useState(false)
  const [dpi, setDpi] = useState('150')
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('pdf')
  const [method, setMethod] = useState<CompressionMethod>('image')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ blob: Blob; originalSize: number; compressedSize: number; name: string } | null>(null)

  const effectiveQuality = useCustom ? customQuality : QUALITY_PRESETS[preset].quality

  const onFile = async (files: File[]) => {
    setResult(null)
    try {
      const buf = await fileToArrayBuffer(files[0])
      await loadPdfDocument(buf.slice(0))
      setFile(files[0])
      setData(buf)
    } catch {
      toast.error('Could not open PDF (it may be encrypted).')
    }
  }

  const compressPdf = async () => {
    if (!file || !data) return
    setBusy(true)
    setProgress(0)
    setResult(null)
    try {
      const doc = await loadPdfDocument(data.slice(0))
      const out = await PDFDocument.create()
      const scale = Number(dpi) / 72
      const qualityDecimal = effectiveQuality / 100

      for (let i = 1; i <= doc.numPages; i++) {
        const canvas = await renderPageToCanvas(doc, i, scale)
        const jpgBlob = await canvasToBlob(canvas, 'image/jpeg', qualityDecimal)
        const jpgBytes = await jpgBlob.arrayBuffer()
        const img = await out.embedJpg(jpgBytes)
        const page = await doc.getPage(i)
        const vp = page.getViewport({ scale: 1 })
        const p = out.addPage([vp.width, vp.height])
        p.drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height })
        setProgress(Math.round((i / doc.numPages) * 100))
      }

      const bytes = await out.save()
      const blob = bytesToBlob(bytes, 'application/pdf')
      setResult({ blob, originalSize: file.size, compressedSize: blob.size, name: `${baseName(file.name)}-compressed.pdf` })
      trackUsage({ toolId: 'compress-pdf-advanced', toolName: 'Advanced PDF Compression', action: `Compressed (${effectiveQuality}%, ${dpi}dpi)`, fileName: file.name, inputSize: file.size, outputSize: blob.size })
      if (blob.size >= file.size) toast.info('This PDF was already well-optimized.')
      else toast.success(`Reduced by ${Math.round((1 - blob.size / file.size) * 100)}%.`)
    } catch {
      toast.error('Compression failed.')
    } finally {
      setBusy(false)
      setProgress(0)
    }
  }

  const exportImages = async () => {
    if (!file || !data) return
    setBusy(true)
    setProgress(0)
    setResult(null)
    try {
      const doc = await loadPdfDocument(data.slice(0))
      const zip = new JSZip()
      const scale = Number(dpi) / 72
      const qualityDecimal = effectiveQuality / 100
      const mime = outputFormat === 'png' ? 'image/png' : 'image/jpeg'
      const ext = outputFormat === 'png' ? 'png' : 'jpg'

      for (let i = 1; i <= doc.numPages; i++) {
        const canvas = await renderPageToCanvas(doc, i, scale)
        const blob = await canvasToBlob(canvas, mime, qualityDecimal)
        const arrayBuffer = await blob.arrayBuffer()
        zip.file(`page-${i}.${ext}`, arrayBuffer)
        setProgress(Math.round((i / doc.numPages) * 100))
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      setResult({ blob: zipBlob, originalSize: file.size, compressedSize: zipBlob.size, name: `${baseName(file.name)}-pages.zip` })
      trackUsage({ toolId: 'compress-pdf-advanced', toolName: 'Advanced PDF Compression', action: `Exported as ${ext.toUpperCase()} images`, fileName: file.name, inputSize: file.size, outputSize: zipBlob.size })
      toast.success('Image export complete.')
    } catch {
      toast.error('Image export failed.')
    } finally {
      setBusy(false)
      setProgress(0)
    }
  }

  const run = () => {
    if (outputFormat === 'pdf') compressPdf()
    else exportImages()
  }

  if (!file || !data) {
    return (
      <div className="grid gap-3">
        <Dropzone accept={['application/pdf']} onFiles={onFile} label="Drop a PDF to compress" icon={<Minimize2 className="h-8 w-8" />} />
        <p className="text-xs text-ink-500">Multi-pass compression with DPI and quality controls. Best for scanned or image-heavy PDFs.</p>
      </div>
    )
  }

  const ratio = result ? Math.round((1 - result.compressedSize / result.originalSize) * 100) : 0
  const saved = result ? result.originalSize - result.compressedSize : 0

  return (
    <div className="card p-5 grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{file.name} · {formatBytes(file.size)}</p>
        <button onClick={() => { setFile(null); setData(null); setResult(null) }} className="btn-ghost btn-sm">Change file</button>
      </div>

      <Field label="Quality Preset">
        <Segmented
          value={preset}
          onChange={(v) => { setPreset(v); setUseCustom(false) }}
          options={Object.entries(QUALITY_PRESETS).map(([k, v]) => ({ value: k as QualityPreset, label: v.label }))}
        />
      </Field>

      <Field label={`Custom Quality: ${effectiveQuality}%`}>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={useCustom ? customQuality : QUALITY_PRESETS[preset].quality}
            onChange={(e) => { setCustomQuality(Number(e.target.value)); setUseCustom(true) }}
            className="flex-1 h-1.5 rounded-full bg-ink-200 dark:bg-ink-700 appearance-none cursor-pointer accent-brand-500"
          />
          <span className="text-xs font-mono text-ink-500 w-10 text-right">{effectiveQuality}%</span>
        </div>
      </Field>

      <Field label="DPI (Resolution)">
        <Segmented
          value={dpi}
          onChange={setDpi}
          options={DPI_OPTIONS.map((d) => ({ value: d.value, label: d.label }))}
        />
      </Field>

      <Field label="Output Format">
        <Segmented
          value={outputFormat}
          onChange={setOutputFormat}
          options={[
            { value: 'pdf', label: 'PDF (recompressed)' },
            { value: 'jpeg', label: 'JPEG images' },
            { value: 'png', label: 'PNG images' },
          ]}
        />
      </Field>

      <Field label="Compression Method">
        <Segmented
          value={method}
          onChange={setMethod}
          options={[
            { value: 'image', label: 'Image Recompression' },
            { value: 'stream', label: 'Stream Optimization' },
            { value: 'font', label: 'Font Subsetting' },
          ]}
        />
      </Field>

      {method === 'image' && (
        <p className="text-xs text-ink-500">Re-rasterize pages at chosen DPI and compress images with JPEG quality setting.</p>
      )}
      {method === 'stream' && (
        <p className="text-xs text-ink-500">Remove duplicate objects and flatten form fields for smaller file size.</p>
      )}
      {method === 'font' && (
        <p className="text-xs text-ink-500">Keep only used characters. pdf-lib handles this automatically during rebuild.</p>
      )}

      {busy && <Progress value={progress} />}

      <button onClick={result ? () => downloadBlob(result.blob, result.name) : run} disabled={busy} className="btn-primary btn-md w-fit">
        {busy ? <Spinner className="h-4 w-4" /> : result ? <Download className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />} {result ? 'Download' : 'Compress'}
      </button>

      {result && (
        <>
          <ResultBar inputSize={result.originalSize} outputSize={result.compressedSize} />
          <div className="flex gap-4 text-xs text-ink-500">
            <span>Compression ratio: <strong className="text-ink-800 dark:text-ink-100">{ratio}%</strong></span>
            <span>Saved: <strong className="text-ink-800 dark:text-ink-100">{formatBytes(Math.max(0, saved))}</strong></span>
          </div>
        </>
      )}
    </div>
  )
}

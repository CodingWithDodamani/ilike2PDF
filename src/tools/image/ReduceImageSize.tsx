import { useCallback, useEffect, useRef, useState } from 'react'
import { Minimize2, Download, Trash2, Archive, Eye } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Segmented, Progress, ResultBar } from '@/components/ui'
import { BeforeAfter } from '@/components/BeforeAfter'
import { useToast } from '@/components/Toaster'
import { cn, downloadBlob, formatBytes, canvasToBlob } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'
import JSZip from 'jszip'

type OutputFormat = 'jpeg' | 'webp'
type TargetPreset = 20 | 50 | 100 | 200 | 500 | 'custom'

interface FileResult {
  file: File
  originalSize: number
  compressedBlob: Blob
  compressedSize: number
  url: string
  origUrl: string
  name: string
  done: boolean
}

const SCALE_STEPS = [1.0, 0.85, 0.72, 0.6, 0.5, 0.4, 0.32, 0.25, 0.18, 0.12]
const MIN_DIMENSION = 50
const BINARY_ITERATIONS = 9

const PRESETS: { label: string; value: TargetPreset; kb: number }[] = [
  { label: '20 KB', value: 20, kb: 20 },
  { label: '50 KB', value: 50, kb: 50 },
  { label: '100 KB', value: 100, kb: 100 },
  { label: '200 KB', value: 200, kb: 200 },
  { label: '500 KB', value: 500, kb: 500 },
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

async function compressToTargetSize(
  file: File,
  targetKB: number,
  format: OutputFormat,
  onProgress?: (pct: number) => void,
): Promise<Blob> {
  const targetBytes = targetKB * 1024
  const img = await blobToImage(file)
  const baseW = img.naturalWidth || img.width
  const baseH = img.naturalHeight || img.height
  const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg'

  for (let s = 0; s < SCALE_STEPS.length; s++) {
    onProgress?.(((s + 1) / (SCALE_STEPS.length + 1)) * 100)
    const scale = SCALE_STEPS[s]
    const w = Math.max(MIN_DIMENSION, Math.round(baseW * scale))
    const h = Math.max(MIN_DIMENSION, Math.round(baseH * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)

    let lo = 0.05
    let hi = 0.95
    let fit: Blob | null = null

    for (let i = 0; i < BINARY_ITERATIONS; i++) {
      const q = (lo + hi) / 2
      const blob = await canvasToBlob(canvas, mimeType, q)
      if (blob.size <= targetBytes) {
        fit = blob
        lo = q
      } else {
        hi = q
      }
    }

    if (fit) {
      onProgress?.(100)
      return fit
    }
  }

  // Extreme fallback
  const ew = Math.max(MIN_DIMENSION, Math.round(baseW * 0.1))
  const eh = Math.max(MIN_DIMENSION, Math.round(baseH * 0.1))
  const ec = document.createElement('canvas')
  ec.width = ew
  ec.height = eh
  const ectx = ec.getContext('2d')!
  ectx.fillStyle = '#ffffff'
  ectx.fillRect(0, 0, ew, eh)
  ectx.drawImage(img, 0, 0, ew, eh)
  onProgress?.(100)
  return canvasToBlob(ec, mimeType, 0.4)
}

function sanitizeName(name: string, targetKB: number, format: OutputFormat): string {
  const clean = name.replace(/[^a-zA-Z0-9 ._-]/g, '')
    .replace(/\.(png|webp|heic|heif|jpg|jpeg)$/i, '')
    .replace(/-\d+(kb|mb)$/i, '')
    || 'image'
  const ext = format === 'webp' ? 'webp' : 'jpg'
  return `${clean}-${targetKB}kb.${ext}`
}

export default function ReduceImageSize() {
  const toast = useToast()
  const [files, setFiles] = useState<File[]>([])
  const [targetKB, setTargetKB] = useState(100)
  const [preset, setPreset] = useState<TargetPreset>(100)
  const [format, setFormat] = useState<OutputFormat>('jpeg')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, pct: 0 })
  const [results, setResults] = useState<FileResult[]>([])
  const [previewIdx, setPreviewIdx] = useState<number | null>(null)

  const resultsRef = useRef<FileResult[]>([])
  useEffect(() => {
    return () => { resultsRef.current.forEach(r => { URL.revokeObjectURL(r.url); URL.revokeObjectURL(r.origUrl) }) }
  }, [])

  const onFiles = useCallback(async (incoming: File[]) => {
    const valid = incoming.filter(f =>
      f.type === 'image/jpeg' || f.type === 'image/png' || f.type === 'image/webp' ||
      f.name.toLowerCase().endsWith('.heic') || f.name.toLowerCase().endsWith('.heif')
    )
    if (valid.length === 0) {
      toast.error('Please select JPEG, PNG, or WebP images.')
      return
    }
    if (valid.length + files.length > 20) {
      toast.error('Maximum 20 images at once.')
      return
    }
    resultsRef.current.forEach(r => { URL.revokeObjectURL(r.url); URL.revokeObjectURL(r.origUrl) })
    resultsRef.current = []
    setResults([])
    setPreviewIdx(null)

    // Create original thumbnails
    const withUrls = valid.map(f => ({
      file: f,
      origUrl: URL.createObjectURL(f),
    }))
    setFiles(prev => [...prev, ...valid])
    // Store origUrls in results temporarily for thumbnails
    const thumbResults: FileResult[] = withUrls.map(({ file: f, origUrl }) => ({
      file: f,
      originalSize: f.size,
      compressedBlob: f,
      compressedSize: f.size,
      url: origUrl,
      origUrl,
      name: f.name,
      done: false,
    }))
    setResults(thumbResults)
  }, [files.length, toast])

  const removeFile = useCallback((idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setResults(prev => {
      const r = prev[idx]
      if (r) { URL.revokeObjectURL(r.url); URL.revokeObjectURL(r.origUrl) }
      return prev.filter((_, i) => i !== idx)
    })
    if (previewIdx === idx) setPreviewIdx(null)
    else if (previewIdx !== null && previewIdx > idx) setPreviewIdx(previewIdx - 1)
  }, [previewIdx])

  const clearAll = useCallback(() => {
    resultsRef.current.forEach(r => { URL.revokeObjectURL(r.url); URL.revokeObjectURL(r.origUrl) })
    resultsRef.current = []
    setFiles([])
    setResults([])
    setPreviewIdx(null)
    setProgress({ current: 0, total: 0, pct: 0 })
  }, [])

  const run = useCallback(async () => {
    if (files.length === 0 || busy) return
    setBusy(true)
    setProgress({ current: 0, total: files.length, pct: 0 })
    setPreviewIdx(null)

    const newResults: FileResult[] = []

    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      setProgress({ current: i + 1, total: files.length, pct: 0 })

      try {
        const origUrl = results[i]?.origUrl || URL.createObjectURL(f)
        const blob = await compressToTargetSize(f, targetKB, format, (pct) => {
          setProgress(prev => ({ ...prev, pct }))
        })
        const url = URL.createObjectURL(blob)
        const name = sanitizeName(f.name, targetKB, format)
        newResults.push({
          file: f,
          originalSize: f.size,
          compressedBlob: blob,
          compressedSize: blob.size,
          url,
          origUrl,
          name,
          done: true,
        })
      } catch {
        toast.error(`Failed to compress ${f.name}`)
        const origUrl = results[i]?.origUrl || URL.createObjectURL(f)
        newResults.push({
          file: f,
          originalSize: f.size,
          compressedBlob: f,
          compressedSize: f.size,
          url: origUrl,
          origUrl,
          name: f.name,
          done: false,
        })
      }
    }

    resultsRef.current.forEach(r => { URL.revokeObjectURL(r.url); if (!newResults.find(nr => nr.origUrl === r.origUrl)) URL.revokeObjectURL(r.origUrl) })
    resultsRef.current = newResults
    setResults(newResults)
    setBusy(false)

    trackUsage({
      toolId: 'reduce-image-size',
      toolName: 'Reduce Image Size',
      action: `Compressed ${files.length} image(s) to ~${targetKB}KB`,
    })

    const totalOrig = newResults.reduce((s, r) => s + r.originalSize, 0)
    const totalComp = newResults.reduce((s, r) => s + r.compressedSize, 0)
    if (totalOrig > 0 && totalComp < totalOrig) {
      const pct = Math.round((1 - totalComp / totalOrig) * 100)
      toast.success(`Compressed ${newResults.length} image(s) — ${pct}% smaller on average.`)
    } else {
      toast.info('Images are already near or below the target size.')
    }
  }, [files, targetKB, format, busy, toast, results])

  const downloadAll = useCallback(async () => {
    if (results.length === 1) {
      const r = results[0]
      downloadBlob(r.compressedBlob, r.name)
      return
    }
    const zip = new JSZip()
    results.forEach(r => { if (r.done) zip.file(r.name, r.compressedBlob) })
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(blob, `reduced-images.zip`)
  }, [results])

  const totalOriginal = results.filter(r => r.done).reduce((s, r) => s + r.originalSize, 0)
  const totalCompressed = results.filter(r => r.done).reduce((s, r) => s + r.compressedSize, 0)
  const totalSavings = totalOriginal ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100) : 0
  const doneCount = results.filter(r => r.done).length
  const preview = previewIdx !== null ? results[previewIdx] : null

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      {/* Main area */}
      <div className="grid gap-4">
        {files.length === 0 ? (
          <div className="card p-5">
            <Dropzone
              accept={['image/png', 'image/jpeg', 'image/webp']}
              multiple
              onFiles={onFiles}
              label="Drop images here to reduce size"
              icon={<Minimize2 className="h-8 w-8" />}
              hint="JPEG, PNG, WebP · up to 20 files · target any KB size"
            />
          </div>
        ) : (
          <>
            {/* Header bar */}
            <div className="card p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-500/10 grid place-items-center">
                    <Minimize2 className="h-5 w-5 text-brand-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{files.length} image{files.length > 1 ? 's' : ''} selected</p>
                    <p className="text-xs text-ink-400">{formatBytes(totalOriginal)} total</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {doneCount > 0 && (
                    <button onClick={downloadAll} className="btn-primary btn-sm gap-1.5">
                      <Download className="h-4 w-4" />
                      {results.length === 1 ? 'Download' : `Download ${doneCount > 1 ? `All (${doneCount})` : ''}`}
                      {doneCount > 1 && <Archive className="h-3.5 w-3.5 ml-0.5" />}
                    </button>
                  )}
                  <button onClick={clearAll} disabled={busy} className="btn-ghost btn-sm gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4" /> Clear
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              {busy && (
                <div className="mt-3 space-y-1">
                  <Progress value={((progress.current - 1) / progress.total) * 100 + (progress.pct / progress.total)} />
                  <p className="text-[11px] text-ink-400 text-center">
                    Processing {progress.current} of {progress.total} — {Math.round(((progress.current - 1) / progress.total) * 100 + (progress.pct / progress.total))}%
                  </p>
                </div>
              )}
            </div>

            {/* Results summary */}
            {doneCount > 0 && (
              <>
                <ResultBar inputSize={totalOriginal} outputSize={totalCompressed} />
                <div className="grid grid-cols-3 gap-3">
                  <div className="card p-3 text-center">
                    <p className="text-[11px] uppercase tracking-wide text-ink-400">Original</p>
                    <p className="text-lg font-bold mt-0.5">{formatBytes(totalOriginal)}</p>
                  </div>
                  <div className="card p-3 text-center">
                    <p className="text-[11px] uppercase tracking-wide text-ink-400">Compressed</p>
                    <p className="text-lg font-bold mt-0.5">{formatBytes(totalCompressed)}</p>
                  </div>
                  <div className="card p-3 text-center">
                    <p className="text-[11px] uppercase tracking-wide text-ink-400">Saved</p>
                    <p className={cn('text-lg font-bold mt-0.5', totalSavings > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-400')}>
                      {totalSavings > 0 ? `${totalSavings}%` : '—'}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Before/After preview */}
            {preview && preview.done && (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium truncate">{preview.name}</p>
                  <button onClick={() => setPreviewIdx(null)} className="btn-ghost btn-sm text-xs">Close preview</button>
                </div>
                <BeforeAfter before={preview.origUrl} after={preview.url} />
              </div>
            )}

            {/* File list table */}
            <div className="card overflow-hidden">
              <div className="grid grid-cols-[48px_1fr_auto_auto_auto_32px] gap-3 px-3 py-2 text-[11px] uppercase tracking-wide text-ink-500 dark:text-ink-400 bg-ink-50 dark:bg-ink-900 border-b border-ink-200 dark:border-ink-800">
                <span />
                <span>File</span>
                <span className="text-right">Original</span>
                <span className="text-right">Reduced</span>
                <span className="text-right">Savings</span>
                <span />
              </div>
              {results.map((r, i) => {
                const saved = r.done ? Math.round(((r.originalSize - r.compressedSize) / r.originalSize) * 100) : 0
                const isActive = previewIdx === i
                return (
                  <div
                    key={i}
                    className={cn(
                      'grid grid-cols-[48px_1fr_auto_auto_auto_32px] gap-3 px-3 py-2.5 items-center text-sm border-b border-ink-100 dark:border-ink-800 last:border-b-0 transition-colors',
                      isActive && 'bg-brand-50 dark:bg-brand-950/30',
                      !isActive && (i % 2 === 0 ? 'bg-white dark:bg-ink-950' : 'bg-ink-50/50 dark:bg-ink-900/50'),
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-ink-100 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 flex-shrink-0">
                      <img src={r.done ? r.url : r.origUrl} alt="" className="h-full w-full object-cover" />
                    </div>

                    {/* Name */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" title={r.file.name}>{r.file.name}</p>
                      {r.done && <p className="text-[11px] text-ink-400 truncate">{r.name}</p>}
                    </div>

                    {/* Original */}
                    <span className="text-right text-xs text-ink-500 tabular-nums whitespace-nowrap">{formatBytes(r.originalSize)}</span>

                    {/* Compressed */}
                    {r.done ? (
                      <span className="text-right text-xs font-medium text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">{formatBytes(r.compressedSize)}</span>
                    ) : busy ? (
                      <Spinner className="h-3.5 w-3.5" />
                    ) : (
                      <span className="text-right text-xs text-ink-300">—</span>
                    )}

                    {/* Savings */}
                    {r.done ? (
                      <span className={cn('text-right text-xs font-semibold tabular-nums whitespace-nowrap', saved > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-400')}>
                        {saved > 0 ? `−${saved}%` : '—'}
                      </span>
                    ) : (
                      <span className="text-right text-xs text-ink-300">—</span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-0.5">
                      {r.done && (
                        <>
                          <button onClick={() => setPreviewIdx(isActive ? null : i)} className="p-1 rounded text-ink-400 hover:text-brand-500 transition" title="Preview">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => downloadBlob(r.compressedBlob, r.name)} className="p-1 rounded text-ink-400 hover:text-brand-500 transition" title="Download">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {!busy && (
                        <button onClick={() => removeFile(i)} className="p-1 rounded text-ink-400 hover:text-red-500 transition" title="Remove">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Compress button */}
            <button onClick={run} disabled={busy} className="btn-primary btn-lg w-full gap-2">
              {busy ? <Spinner className="h-5 w-5" /> : <Minimize2 className="h-5 w-5" />}
              {busy ? `Compressing ${progress.current}/${progress.total}...` : `Reduce to ${targetKB} KB`}
            </button>
          </>
        )}
      </div>

      {/* Sidebar controls */}
      <div className="card p-5 grid gap-5 h-fit lg:sticky lg:top-20">
        {/* Target size */}
        <div>
          <label className="label mb-2">Target Size</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => { setPreset(p.value); setTargetKB(p.kb) }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  preset === p.value
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                    : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={10}
              max={5000}
              step={10}
              value={targetKB}
              onChange={e => {
                const v = Math.max(10, Math.min(5000, parseInt(e.target.value) || 10))
                setTargetKB(v)
                setPreset('custom')
              }}
              className="input w-full text-sm font-mono text-center"
            />
            <span className="text-sm font-medium text-ink-500 shrink-0">KB</span>
          </div>
        </div>

        {/* Output format */}
        <div>
          <label className="label mb-2">Output Format</label>
          <Segmented
            value={format}
            onChange={v => setFormat(v as OutputFormat)}
            options={[
              { value: 'jpeg', label: 'JPEG' },
              { value: 'webp', label: 'WebP' },
            ]}
          />
          <p className="text-[11px] text-ink-400 mt-2">
            {format === 'webp' ? 'Smaller files, modern browsers.' : 'Universal compatibility.'}
          </p>
        </div>

        {/* Quick info */}
        <div className="space-y-2 pt-3 border-t border-ink-200 dark:border-ink-700">
          <p className="text-xs font-medium text-ink-500">How it works</p>
          <ul className="text-[11px] text-ink-400 space-y-1">
            <li className="flex items-start gap-1.5">
              <span className="text-brand-500 mt-0.5">1</span>
              Scale image down progressively
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-brand-500 mt-0.5">2</span>
              Binary search for optimal quality
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-brand-500 mt-0.5">3</span>
              White background for JPEG compat
            </li>
          </ul>
        </div>

        {results.filter(r => r.done).length > 0 && (
          <div className="pt-3 border-t border-ink-200 dark:border-ink-700 space-y-1.5">
            <p className="text-xs font-medium text-ink-500">Per-file downloads</p>
            {results.filter(r => r.done).map((r, i) => (
              <button
                key={i}
                onClick={() => downloadBlob(r.compressedBlob, r.name)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-ink-100 dark:hover:bg-ink-800 transition group"
              >
                <span className="truncate text-ink-600 dark:text-ink-300 group-hover:text-brand-600 dark:group-hover:text-brand-400">{r.name}</span>
                <Download className="w-3 h-3 text-ink-400 group-hover:text-brand-500 shrink-0 ml-2" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

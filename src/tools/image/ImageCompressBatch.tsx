import { useState, useCallback } from 'react'
import { Section, Field, Segmented, Spinner, Progress } from '@/components/ui'
import { cn } from '@/lib/utils'
import { downloadBlob, formatBytes, baseName } from '@/lib/utils'
import { Minimize2, Download, Trash2 } from 'lucide-react'
import JSZip from 'jszip'
import { Dropzone } from '@/components/Dropzone'

type OutputFormat = 'jpeg' | 'png' | 'webp'

const FORMAT_EXT: Record<OutputFormat, string> = { jpeg: 'jpg', png: 'png', webp: 'webp' }
const FORMAT_MIME: Record<OutputFormat, string> = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }

interface FileResult {
  file: File
  name: string
  original: number
  compressed: number
  blob: Blob
}

export default function ImageCompressBatch() {
  const [files, setFiles] = useState<File[]>([])
  const [quality, setQuality] = useState(80)
  const [format, setFormat] = useState<OutputFormat>('jpeg')
  const [results, setResults] = useState<FileResult[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles])
    setResults([])
  }, [])

  const clearAll = useCallback(() => {
    setFiles([])
    setResults([])
    setProgress(0)
  }, [])

  const compressImage = useCallback((file: File): Promise<FileResult> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas not supported'))
        ctx.drawImage(img, 0, 0)
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Compression failed'))
            const ext = FORMAT_EXT[format]
            const name = `${baseName(file.name)}.${ext}`
            resolve({ file, name, original: file.size, compressed: blob.size, blob })
          },
          FORMAT_MIME[format],
          quality / 100
        )
      }
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Failed to load image')) }
      img.src = objectUrl
    })
  }, [format, quality])

  const compressAll = useCallback(async () => {
    if (!files.length) return
    setProcessing(true)
    setResults([])
    setProgress(0)
    const allResults: FileResult[] = []
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await compressImage(files[i])
        allResults.push(result)
      } catch {
        allResults.push({
          file: files[i],
          name: files[i].name,
          original: files[i].size,
          compressed: files[i].size,
          blob: files[i],
        })
      }
      setProgress(((i + 1) / files.length) * 100)
    }
    setResults(allResults)
    setProcessing(false)
  }, [files, compressImage])

  const downloadZip = useCallback(async () => {
    if (!results.length) return
    const zip = new JSZip()
    results.forEach((r) => zip.file(r.name, r.blob))
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(blob, 'compressed-images.zip')
  }, [results])

  const totalOriginal = results.reduce((s, r) => s + r.original, 0)
  const totalCompressed = results.reduce((s, r) => s + r.compressed, 0)
  const totalSavings = totalOriginal ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100) : 0

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Batch Image Compressor</h2>
      <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">Compress multiple images at once with quality control.</p>

      {files.length === 0 ? (
        <Dropzone
          accept={['image/jpeg', 'image/png', 'image/webp', 'image/gif']}
          multiple
          onFiles={handleFiles}
          label="Drop images here or click to browse"
          icon={<Minimize2 className="h-8 w-8" />}
        />
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`Quality: ${quality}%`}>
              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(+e.target.value)}
                className="w-full accent-brand-500"
              />
            </Field>
            <Field label="Output format">
              <Segmented
                value={format}
                onChange={setFormat}
                options={[
                  { value: 'jpeg', label: 'JPEG' },
                  { value: 'png', label: 'PNG' },
                  { value: 'webp', label: 'WebP' },
                ]}
              />
            </Field>
          </div>

          {processing && (
            <div className="grid gap-2">
              <p className="text-xs text-ink-500 dark:text-ink-400">Compressing... {Math.round(progress)}%</p>
              <Progress value={progress} />
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <button onClick={compressAll} disabled={processing} className="btn-primary btn-md">
              {processing ? <Spinner className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              Compress All
            </button>
            {results.length > 0 && (
              <button onClick={downloadZip} className="btn-secondary btn-md">
                <Download className="h-4 w-4" /> Download All as ZIP
              </button>
            )}
            <button onClick={clearAll} className="btn-ghost btn-md">
              <Trash2 className="h-4 w-4" /> Clear
            </button>
          </div>

          <div className="rounded-xl border border-ink-200 dark:border-ink-800 overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-3 py-2 text-[11px] uppercase tracking-wide text-ink-500 dark:text-ink-400 bg-ink-50 dark:bg-ink-900 border-b border-ink-200 dark:border-ink-800">
              <span>File</span>
              <span className="text-right">Original</span>
              <span className="text-right">Compressed</span>
              <span className="text-right">Savings</span>
              <span className="w-8" />
            </div>
            {files.map((file, i) => {
              const r = results[i]
              const saved = r ? Math.round(((r.original - r.compressed) / r.original) * 100) : 0
              return (
                <div key={i} className={cn('grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-3 py-2 items-center text-sm border-b border-ink-100 dark:border-ink-800 last:border-b-0', i % 2 === 0 ? 'bg-white dark:bg-ink-950' : 'bg-ink-50/50 dark:bg-ink-900/50')}>
                  <span className="truncate font-medium" title={file.name}>{file.name}</span>
                  <span className="text-right text-xs text-ink-500 dark:text-ink-400 tabular-nums">{formatBytes(file.size)}</span>
                  {r ? (
                    <>
                      <span className="text-right text-xs text-ink-500 dark:text-ink-400 tabular-nums">{formatBytes(r.compressed)}</span>
                      <span className={cn('text-right text-xs font-medium tabular-nums', saved > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-500 dark:text-ink-400')}>
                        {saved > 0 ? `${saved}%` : '—'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-right text-xs text-ink-400">—</span>
                      <span className="text-right text-xs text-ink-400">—</span>
                    </>
                  )}
                  {r && (
                    <button onClick={() => downloadBlob(r.blob, r.name)} className="btn-ghost btn-sm p-1" title="Download">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {results.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-3">
                <p className="text-[11px] uppercase tracking-wide text-ink-500 dark:text-ink-400">Original</p>
                <p className="text-lg font-bold mt-0.5">{formatBytes(totalOriginal)}</p>
              </div>
              <div className="card p-3">
                <p className="text-[11px] uppercase tracking-wide text-ink-500 dark:text-ink-400">Compressed</p>
                <p className="text-lg font-bold mt-0.5">{formatBytes(totalCompressed)}</p>
              </div>
              <div className="card p-3">
                <p className="text-[11px] uppercase tracking-wide text-ink-500 dark:text-ink-400">Total Savings</p>
                <p className={cn('text-lg font-bold mt-0.5', totalSavings > 0 ? 'text-emerald-600 dark:text-emerald-400' : '')}>{totalSavings}%</p>
              </div>
            </div>
          )}
        </div>
      )}
    </Section>
  )
}

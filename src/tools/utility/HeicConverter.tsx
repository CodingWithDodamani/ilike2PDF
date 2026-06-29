import { useState, useCallback } from 'react'
import { Download, RefreshCw, Image, Trash2 } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'
import { downloadBlob } from '@/lib/utils'
import heic2any from 'heic2any'

interface ConvertedFile {
  name: string
  originalSize: number
  outputSize: number
  blob: Blob
  url: string
  format: string
}

export default function HeicConverter() {
  const [files, setFiles] = useState<ConvertedFile[]>([])
  const [converting, setConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [outputFormat, setOutputFormat] = useState<'jpeg' | 'png'>('jpeg')
  const [quality, setQuality] = useState(0.92)

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      f.type === 'image/heic' || f.type === 'image/heif' || f.name.toLowerCase().endsWith('.heic') || f.name.toLowerCase().endsWith('.heif')
    )
    if (dropped.length === 0) return
    await convertFiles(dropped)
  }, [outputFormat, quality])

  const handleInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return
    await convertFiles(selected)
    e.target.value = ''
  }, [outputFormat, quality])

  const convertFiles = async (inputFiles: File[]) => {
    setConverting(true)
    setProgress(0)
    const results: ConvertedFile[] = []

    for (let i = 0; i < inputFiles.length; i++) {
      const file = inputFiles[i]
      try {
        const blob = await heic2any({
          blob: file,
          toType: `image/${outputFormat}`,
          quality,
        }) as Blob

        const ext = outputFormat === 'jpeg' ? 'jpg' : 'png'
        const outName = file.name.replace(/\.(heic|heif)$/i, `.${ext}`)
        const url = URL.createObjectURL(blob)

        results.push({
          name: outName,
          originalSize: file.size,
          outputSize: blob.size,
          blob,
          url,
          format: outputFormat,
        })
      } catch (err) {
        console.error(`Failed to convert ${file.name}:`, err)
      }
      setProgress(((i + 1) / inputFiles.length) * 100)
    }

    setFiles(prev => [...prev, ...results])
    setConverting(false)
  }

  const downloadFile = (f: ConvertedFile) => {
    downloadBlob(f.blob, f.name)
  }

  const downloadAll = () => {
    files.forEach(f => downloadFile(f))
  }

  const removeFile = (idx: number) => {
    URL.revokeObjectURL(files[idx].url)
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const clearAll = () => {
    files.forEach(f => URL.revokeObjectURL(f.url))
    setFiles([])
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">HEIC to JPG/PNG Converter</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Convert iPhone HEIC photos to JPG or PNG. Batch convert, preview, and download.
      </p>

      {/* Format & quality */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="label">Output Format</label>
          <div className="flex rounded-xl bg-ink-100 dark:bg-ink-850 p-1">
            {(['jpeg', 'png'] as const).map(f => (
              <button key={f} onClick={() => setOutputFormat(f)}
                className={cn('flex-1 px-3 py-2 rounded-lg text-sm font-medium transition uppercase',
                  outputFormat === f ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-300 shadow' : 'text-ink-600 dark:text-ink-300')}>
                {f}
              </button>
            ))}
          </div>
        </div>
        {outputFormat === 'jpeg' && (
          <div>
            <label className="label">Quality: {Math.round(quality * 100)}%</label>
            <input type="range" min={0.1} max={1} step={0.05} value={quality}
              onChange={e => setQuality(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-ink-200 dark:bg-ink-800 accent-brand-500 mt-2" />
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer',
          converting ? 'border-brand-500 bg-brand-500/5' : 'border-ink-300 dark:border-ink-600 hover:border-brand-500'
        )}
      >
        <input type="file" multiple accept=".heic,.heif,image/heic,image/heif" onChange={handleInput}
          className="hidden" id="heic-input" />
        <label htmlFor="heic-input" className="cursor-pointer">
          <Image className="w-10 h-10 mx-auto mb-3 text-ink-400" />
          <p className="text-sm font-medium mb-1">
            {converting ? `Converting... ${Math.round(progress)}%` : 'Drop HEIC files here or click to browse'}
          </p>
          <p className="text-xs text-ink-400">Supports .heic and .heif from iPhone/iPad</p>
        </label>
      </div>

      {/* Progress */}
      {converting && (
        <div className="mt-3 h-2 rounded-full bg-ink-200 dark:bg-ink-800 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all duration-300"
            style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Results */}
      {files.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="label mb-0">Converted ({files.length})</p>
            <div className="flex gap-2">
              <button onClick={downloadAll} className="btn-ghost px-3 py-1 text-xs rounded-lg flex items-center gap-1">
                <Download className="w-3 h-3" /> Download All
              </button>
              <button onClick={clearAll} className="btn-ghost px-3 py-1 text-xs rounded-lg flex items-center gap-1 text-red-500">
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            </div>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {files.map((f, i) => (
              <div key={i} className="card p-3 flex items-center gap-3">
                <img src={f.url} alt={f.name} className="w-12 h-12 object-cover rounded-lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-xs text-ink-400">
                    {formatSize(f.originalSize)} → {formatSize(f.outputSize)}
                    <span className={cn('ml-2', f.outputSize < f.originalSize ? 'text-emerald-500' : 'text-amber-500')}>
                      ({f.outputSize < f.originalSize ? '-' : '+'}{Math.abs(Math.round((1 - f.outputSize / f.originalSize) * 100))}%)
                    </span>
                  </p>
                </div>
                <button onClick={() => downloadFile(f)} className="p-2 rounded-lg text-ink-400 hover:text-brand-500 transition">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => removeFile(i)} className="p-2 rounded-lg text-ink-400 hover:text-red-500 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}

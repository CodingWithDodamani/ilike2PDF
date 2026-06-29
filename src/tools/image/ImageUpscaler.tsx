import { useState, useRef, useCallback } from 'react'
import { Maximize2, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Section, Field, Segmented, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'
import { downloadBlob, baseName, fileToImage } from '@/lib/utils'

type Scale = 2 | 3 | 4

export default function ImageUpscaler() {
  const [file, setFile] = useState<File | null>(null)
  const [scale, setScale] = useState<Scale>(2)
  const [busy, setBusy] = useState(false)
  const [origDims, setOrigDims] = useState<{ w: number; h: number } | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [showAfter, setShowAfter] = useState(false)
  const [origUrl, setOrigUrl] = useState<string | null>(null)
  const origUrlRef = useRef('')
  const resultUrlRef = useRef('')

  const cleanup = useCallback(() => {
    if (origUrlRef.current) { URL.revokeObjectURL(origUrlRef.current); origUrlRef.current = '' }
    if (resultUrlRef.current) { URL.revokeObjectURL(resultUrlRef.current); resultUrlRef.current = '' }
    setFile(null); setOrigDims(null); setResultBlob(null); setResultUrl(null); setOrigUrl(null); setShowAfter(false)
  }, [])

  const onFiles = async (files: File[]) => {
    cleanup()
    const f = files[0]
    const img = await fileToImage(f)
    const url = URL.createObjectURL(f)
    origUrlRef.current = url
    setFile(f)
    setOrigDims({ w: img.naturalWidth, h: img.naturalHeight })
    setOrigUrl(url)
    setResultBlob(null)
    setShowAfter(false)
  }

  const run = async () => {
    if (!file || !origDims) return
    setBusy(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = origDims.w * scale
      canvas.height = origDims.h * scale
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      const img = await fileToImage(file)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      canvas.toBlob((blob) => {
        if (!blob) return
        if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
        const url = URL.createObjectURL(blob)
        resultUrlRef.current = url
        setResultBlob(blob)
        setResultUrl(url)
        setShowAfter(true)
        setBusy(false)
      }, type, 0.92)
    } catch {
      setBusy(false)
    }
  }

  const download = () => {
    if (!resultBlob || !file) return
    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    downloadBlob(resultBlob, `${baseName(file.name)}-${scale}x.${ext}`)
  }

  const scaledW = origDims ? origDims.w * scale : 0
  const scaledH = origDims ? origDims.h * scale : 0

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Image Upscaler</h2>
      <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">Upscale images to 2x, 3x, or 4x with high-quality smoothing.</p>

      {!file && (
        <Dropzone accept={['image/jpeg', 'image/png', 'image/webp']} onFiles={onFiles} label="Drop an image to upscale" icon={<Maximize2 className="h-8 w-8" />} />
      )}

      {file && (
        <div className="grid gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-medium">{file.name}</p>
            <button onClick={cleanup} className="btn-ghost btn-sm">Change image</button>
          </div>

          <Field label="Scale">
            <Segmented value={String(scale)} onChange={(v) => setScale(Number(v) as Scale)} options={[{ value: '2', label: '2×' }, { value: '3', label: '3×' }, { value: '4', label: '4×' }]} />
          </Field>

          <div className="flex items-center gap-4 text-xs text-ink-600 dark:text-ink-300">
            <span>Original: {origDims?.w}×{origDims?.h}</span>
            <span>→</span>
            <span>Upscaled: {scaledW}×{scaledH}</span>
          </div>

          {resultBlob && (
            <div className="flex items-center gap-4 text-xs text-ink-600 dark:text-ink-300">
              <span>Original: {(file.size / 1024).toFixed(1)} KB</span>
              <span>→</span>
              <span>Upscaled: {(resultBlob.size / 1024).toFixed(1)} KB</span>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={run} disabled={busy} className="btn-primary btn-md">
              {busy ? <Spinner className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />} Upscale
            </button>
            {resultBlob && (
              <button onClick={download} className="btn-secondary btn-md">
                <Download className="h-4 w-4" /> Download
              </button>
            )}
          </div>

          {(origUrl || resultUrl) && (
            <div className="grid gap-2">
              <div className="flex gap-1">
                {origUrl && (
                  <button onClick={() => setShowAfter(false)} className={cn('btn-ghost btn-sm text-xs', !showAfter && 'bg-ink-100 dark:bg-ink-800')}>
                    Before
                  </button>
                )}
                {resultUrl && (
                  <button onClick={() => setShowAfter(true)} className={cn('btn-ghost btn-sm text-xs', showAfter && 'bg-ink-100 dark:bg-ink-800')}>
                    After
                  </button>
                )}
              </div>
              <div className="overflow-auto rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-900 p-2 flex items-center justify-center min-h-[200px] max-h-[400px]">
                {showAfter && resultUrl ? (
                  <img src={resultUrl} alt="Upscaled" className="max-w-full max-h-[380px] object-contain" />
                ) : origUrl ? (
                  <img src={origUrl} alt="Original" className="max-w-full max-h-[380px] object-contain" />
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}
    </Section>
  )
}

import { useRef, useState } from 'react'
import { removeBackground } from '@imgly/background-removal'
import { Eraser, Download, Loader2 } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Section, Progress } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { BeforeAfter } from '@/components/BeforeAfter'
import { baseName, downloadBlob, fileToDataUrl, formatBytes } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

export default function BackgroundRemover() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [origUrl, setOrigUrl] = useState('')
  const [result, setResult] = useState<Blob | null>(null)
  const [resultUrl, setResultUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const origRef = useRef('')
  const resRef = useRef('')

  const cleanup = () => {
    if (origRef.current) URL.revokeObjectURL(origRef.current)
    if (resRef.current) URL.revokeObjectURL(resRef.current)
    origRef.current = ''
    resRef.current = ''
  }

  const onFile = async (files: File[]) => {
    cleanup()
    const f = files[0]
    const url = URL.createObjectURL(f)
    origRef.current = url
    setFile(f)
    setOrigUrl(url)
    setResult(null)
    setResultUrl('')
  }

  const process = async () => {
    if (!file) return
    setBusy(true)
    setProgress(0)
    setProgressText('Initializing AI model…')
    try {
      const blob = await removeBackground(file, {
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            const pct = Math.round((current / total) * 100)
            setProgress(pct)
            if (key === 'fetch:model') setProgressText(`Downloading model… ${pct}%`)
            else if (key === 'compute:inference') setProgressText('Processing image…')
            else setProgressText(`${key} ${pct}%`)
          }
        },
      })
      if (resRef.current) URL.revokeObjectURL(resRef.current)
      const url = URL.createObjectURL(blob)
      resRef.current = url
      setResult(blob)
      setResultUrl(url)
      trackUsage({
        toolId: 'background-remover-ai',
        toolName: 'Background Remover (AI)',
        action: 'Removed background',
        fileName: file.name,
        inputSize: file.size,
        outputSize: blob.size,
      })
      toast.success('Background removed!')
    } catch {
      toast.error('Failed to remove background.')
    } finally {
      setBusy(false)
      setProgress(100)
      setProgressText('')
    }
  }

  const downloadPng = () => {
    if (!result || !file) return
    downloadBlob(result, `${baseName(file.name)}-nobg.png`)
  }

  const downloadJpeg = async () => {
    if (!result || !file) return
    const img = new Image()
    img.src = URL.createObjectURL(result)
    await new Promise<void>((r) => { img.onload = () => r() })
    const c = document.createElement('canvas')
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.drawImage(img, 0, 0)
    c.toBlob((blob) => {
      if (blob) downloadBlob(blob, `${baseName(file!.name)}-nobg-white.jpg`)
      URL.revokeObjectURL(img.src)
    }, 'image/jpeg', 0.92)
  }

  return (
    <Section>
      <div className="grid gap-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">Background Remover (AI)</h2>
          <p className="text-xs text-ink-500 dark:text-ink-400">Remove image backgrounds using AI. Runs entirely in your browser.</p>
        </div>

        {!file && (
          <>
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              First use downloads a ~30 MB AI model. This is cached by your browser for future use.
            </div>
            <Dropzone accept={['image/jpeg', 'image/png', 'image/webp']} onFiles={onFile} label="Drop an image to remove its background" icon={<Eraser className="h-8 w-8" />} />
          </>
        )}

        {file && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-medium">{file.name} · {formatBytes(file.size)}</p>
              <button onClick={() => { cleanup(); setFile(null); setOrigUrl(''); setResult(null); setResultUrl('') }} className="btn-ghost btn-sm">Change image</button>
            </div>

            {busy && (
              <div className="grid gap-2">
                <Progress value={progress} />
                <p className="text-xs text-ink-500 dark:text-ink-400 text-center flex items-center justify-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> {progressText}
                </p>
              </div>
            )}

            {result && resultUrl && <BeforeAfter before={origUrl} after={resultUrl} />}

            {result && (
              <div className="flex flex-wrap gap-2">
                <button onClick={downloadPng} className="btn-primary btn-md"><Download className="h-4 w-4" /> PNG (transparent)</button>
                <button onClick={downloadJpeg} className="btn-secondary btn-md"><Download className="h-4 w-4" /> JPEG (white bg)</button>
              </div>
            )}

            {!result && !busy && (
              <button onClick={process} className="btn-primary btn-md w-fit"><Eraser className="h-4 w-4" /> Remove Background</button>
            )}
          </>
        )}
      </div>
    </Section>
  )
}

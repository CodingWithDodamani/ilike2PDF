import { useEffect, useRef, useState } from 'react'
import imageCompression from 'browser-image-compression'
import { Minimize2, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field, Segmented, ResultBar } from '@/components/ui'
import { BeforeAfter } from '@/components/BeforeAfter'
import { useToast } from '@/components/Toaster'
import { baseName, downloadBlob, fileToImage, formatBytes } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

type Preset = 'web' | 'balanced' | 'high'
const PRESETS: Record<Preset, { maxSizeMB: number; quality: number; label: string }> = {
  web: { maxSizeMB: 0.3, quality: 0.6, label: 'Web (smallest)' },
  balanced: { maxSizeMB: 1, quality: 0.75, label: 'Balanced' },
  high: { maxSizeMB: 3, quality: 0.9, label: 'High quality' },
}

export default function CompressImage() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [origUrl, setOrigUrl] = useState('')
  const [preset, setPreset] = useState<Preset>('balanced')
  const [quality, setQuality] = useState(0.75)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; url: string; name: string } | null>(null)

  const origUrlRef = useRef('')
  const resultUrlRef = useRef('')
  useEffect(() => () => { if (origUrlRef.current) URL.revokeObjectURL(origUrlRef.current); if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current) }, [])

  const onFile = async (files: File[]) => {
    const f = files[0]
    await fileToImage(f) // validate
    if (origUrlRef.current) URL.revokeObjectURL(origUrlRef.current)
    const url = URL.createObjectURL(f)
    origUrlRef.current = url
    setFile(f); setOrigUrl(url); setResult(null)
  }

  const run = async () => {
    if (!file) return
    setBusy(true)
    try {
      const p = PRESETS[preset]
      const compressed = await imageCompression(file, {
        maxSizeMB: p.maxSizeMB,
        initialQuality: quality,
        useWebWorker: true,
        maxWidthOrHeight: 4096,
      })
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
      const url = URL.createObjectURL(compressed)
      resultUrlRef.current = url
      const name = `${baseName(file.name)}-compressed.${file.type === 'image/png' ? 'png' : 'jpg'}`
      setResult({ blob: compressed, url, name })
      trackUsage({ toolId: 'compress-image', toolName: 'Compress Image', action: 'Compressed image', fileName: file.name, inputSize: file.size, outputSize: compressed.size })
      if (compressed.size >= file.size) toast.info('Already optimized — try the Web preset.')
      else toast.success(`Reduced by ${Math.round((1 - compressed.size / file.size) * 100)}%.`)
    } catch { toast.error('Compression failed.') } finally { setBusy(false) }
  }

  if (!file) return <Dropzone accept={['image/png', 'image/jpeg', 'image/webp']} onFiles={onFile} label="Drop an image to compress" icon={<Minimize2 className="h-8 w-8" />} />

  return (
    <div className="card p-5 grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{file.name} · {formatBytes(file.size)}</p>
        <button onClick={() => { if (origUrlRef.current) URL.revokeObjectURL(origUrlRef.current); if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current); origUrlRef.current = ''; resultUrlRef.current = ''; setFile(null); setOrigUrl(''); setResult(null) }} className="btn-ghost btn-sm">Change image</button>
      </div>
      <Field label="Preset"><Segmented value={preset} onChange={(p) => { setPreset(p); setQuality(PRESETS[p].quality) }} options={(Object.keys(PRESETS) as Preset[]).map((k) => ({ value: k, label: PRESETS[k].label }))} /></Field>
      <Field label={`Quality: ${Math.round(quality * 100)}%`}><input type="range" min={10} max={100} value={quality * 100} onChange={(e) => setQuality(+e.target.value / 100)} className="w-full accent-brand-500" /></Field>
      <div className="flex gap-2">
        <button onClick={run} disabled={busy} className="btn-primary btn-md">{busy ? <Spinner className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />} Compress</button>
        {result && <button onClick={() => downloadBlob(result.blob, result.name)} className="btn-secondary btn-md"><Download className="h-4 w-4" /> Download</button>}
      </div>
      {result && (
        <>
          <ResultBar inputSize={file.size} outputSize={result.blob.size} />
          <BeforeAfter before={origUrl} after={result.url} />
        </>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Repeat, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field, Segmented, ResultBar } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { convertImageFile } from '@/lib/image'
import { baseName, downloadBlob, fileToImage } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

type Fmt = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/bmp'
const EXT: Record<Fmt, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/bmp': 'bmp' }

export default function ConvertImage() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [fmt, setFmt] = useState<Fmt>('image/webp')
  const [quality, setQuality] = useState(0.92)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null)

  const onFile = async (files: File[]) => { await fileToImage(files[0]); setFile(files[0]); setResult(null) }

  const run = async () => {
    if (!file) return
    setBusy(true)
    try {
      const blob = await convertImageFile(file, fmt, quality)
      const name = `${baseName(file.name)}.${EXT[fmt]}`
      setResult({ blob, name })
      trackUsage({ toolId: 'convert-image', toolName: 'Convert Format', action: `→ ${EXT[fmt].toUpperCase()}`, fileName: file.name, inputSize: file.size, outputSize: blob.size })
      toast.success(`Converted to ${EXT[fmt].toUpperCase()}.`)
    } catch { toast.error('Conversion failed.') } finally { setBusy(false) }
  }

  if (!file) return <Dropzone accept={['image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/gif']} onFiles={onFile} label="Drop an image to convert" icon={<Repeat className="h-8 w-8" />} />

  const lossy = fmt === 'image/jpeg' || fmt === 'image/webp'
  return (
    <div className="card p-5 grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{file.name}</p>
        <button onClick={() => { setFile(null); setResult(null) }} className="btn-ghost btn-sm">Change image</button>
      </div>
      <Field label="Target format"><Segmented value={fmt} onChange={setFmt} options={(Object.keys(EXT) as Fmt[]).map((f) => ({ value: f, label: EXT[f].toUpperCase() }))} /></Field>
      {lossy && <Field label={`Quality: ${Math.round(quality * 100)}%`}><input type="range" min={10} max={100} value={quality * 100} onChange={(e) => setQuality(+e.target.value / 100)} className="w-full accent-brand-500" /></Field>}
      <div className="flex gap-2">
        <button onClick={run} disabled={busy} className="btn-primary btn-md">{busy ? <Spinner className="h-4 w-4" /> : <Repeat className="h-4 w-4" />} Convert</button>
        {result && <button onClick={() => downloadBlob(result.blob, result.name)} className="btn-secondary btn-md"><Download className="h-4 w-4" /> Download</button>}
      </div>
      {result && <ResultBar inputSize={file.size} outputSize={result.blob.size} />}
    </div>
  )
}

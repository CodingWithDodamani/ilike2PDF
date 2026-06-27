import { useEffect, useRef, useState } from 'react'
import { Maximize2, Download, Link2, Unlink } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field, Segmented, ResultBar } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { resizeImageFile } from '@/lib/image'
import { baseName, downloadDataUrl, extOf, fileToImage } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

export default function ResizeImage() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [orig, setOrig] = useState({ w: 0, h: 0 })
  const [w, setW] = useState(0)
  const [h, setH] = useState(0)
  const [lock, setLock] = useState(true)
  const [unit, setUnit] = useState<'px' | 'pct'>('px')
  const [pct, setPct] = useState(100)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ size: number; url: string; name: string } | null>(null)

  const onFile = async (files: File[]) => {
    const f = files[0]
    const img = await fileToImage(f)
    setFile(f); setOrig({ w: img.naturalWidth, h: img.naturalHeight }); setW(img.naturalWidth); setH(img.naturalHeight); setPct(100); setResult(null)
  }

  const setWidth = (val: number) => { setW(val); if (lock && orig.w) setH(Math.round(val * (orig.h / orig.w))) }
  const setHeight = (val: number) => { setH(val); if (lock && orig.h) setW(Math.round(val * (orig.w / orig.h))) }

  useEffect(() => {
    if (unit === 'pct') { setW(Math.round(orig.w * pct / 100)); setH(Math.round(orig.h * pct / 100)) }
  }, [pct, unit, orig])

  const resultUrlRef = useRef('')
  useEffect(() => () => { if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current) }, [])

  const run = async () => {
    if (!file) return
    setBusy(true)
    try {
      const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const { blob } = await resizeImageFile(file, { width: w, height: h, type, quality: 0.92 })
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
      const url = URL.createObjectURL(blob)
      resultUrlRef.current = url
      const name = `${baseName(file.name)}-${w}x${h}.${extOf(file.name) || 'png'}`
      setResult({ size: blob.size, url, name })
      trackUsage({ toolId: 'resize-image', toolName: 'Resize Image', action: `Resized to ${w}×${h}`, fileName: file.name, inputSize: file.size, outputSize: blob.size })
      toast.success('Image resized.')
    } catch { toast.error('Resize failed.') } finally { setBusy(false) }
  }

  if (!file) return <Dropzone accept={['image/png', 'image/jpeg', 'image/webp', 'image/bmp']} onFiles={onFile} label="Drop an image to resize" icon={<Maximize2 className="h-8 w-8" />} />

  return (
    <div className="card p-5 grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{file.name} · {orig.w}×{orig.h}</p>
        <button onClick={() => { if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current); resultUrlRef.current = ''; setFile(null); setResult(null) }} className="btn-ghost btn-sm">Change image</button>
      </div>
      <Field label="Unit">
        <Segmented value={unit} onChange={setUnit} options={[{ value: 'px', label: 'Pixels' }, { value: 'pct', label: 'Percent' }]} />
      </Field>
      {unit === 'px' ? (
        <div className="flex items-end gap-3 flex-wrap">
          <Field label="Width"><input type="number" min={1} max={10000} value={w} onChange={(e) => setWidth(Math.max(1, +e.target.value))} className="input w-32" /></Field>
          <button onClick={() => setLock((l) => !l)} className="btn-ghost btn-sm !p-2 mb-1" aria-label="Toggle aspect lock">{lock ? <Link2 className="h-5 w-5 text-brand-500" /> : <Unlink className="h-5 w-5" />}</button>
          <Field label="Height"><input type="number" min={1} max={10000} value={h} onChange={(e) => setHeight(Math.max(1, +e.target.value))} className="input w-32" /></Field>
        </div>
      ) : (
        <Field label={`Scale: ${pct}% → ${w}×${h}`}><input type="range" min={5} max={200} value={pct} onChange={(e) => setPct(+e.target.value)} className="w-full accent-brand-500" /></Field>
      )}
      <div className="flex gap-2">
        <button onClick={run} disabled={busy} className="btn-primary btn-md">{busy ? <Spinner className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />} Resize</button>
        {result && <button onClick={() => downloadDataUrl(result.url, result.name)} className="btn-secondary btn-md"><Download className="h-4 w-4" /> Download</button>}
      </div>
      {result && (
        <>
          <ResultBar inputSize={file.size} outputSize={result.size} />
          <img src={result.url} alt="Resized preview" className="max-h-72 rounded-lg border border-ink-200 dark:border-ink-700 object-contain mx-auto" />
        </>
      )}
    </div>
  )
}

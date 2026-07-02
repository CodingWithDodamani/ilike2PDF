import { useEffect, useRef, useState } from 'react'
import { Image as ImageIcon, Download, Trash2 } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field, Segmented, ResultBar } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { downloadBlob, formatBytes, canvasToBlob, baseName, cn } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

type FitMode = 'cover' | 'contain' | 'stretch'
type OutputFormat = 'jpeg' | 'png'

interface Preset {
  platform: string
  name: string
  w: number
  h: number
  icon: string
}

const PRESETS: Preset[] = [
  // Instagram
  { platform: 'Instagram', name: 'Post (1080×1080)', w: 1080, h: 1080, icon: '📷' },
  { platform: 'Instagram', name: 'Story / Reel (1080×1920)', w: 1080, h: 1920, icon: '📱' },
  { platform: 'Instagram', name: 'Landscape (1080×566)', w: 1080, h: 566, icon: '🖼️' },
  // Facebook
  { platform: 'Facebook', name: 'Post (1200×630)', w: 1200, h: 630, icon: '👤' },
  { platform: 'Facebook', name: 'Cover (820×312)', w: 820, h: 312, icon: '🖼️' },
  { platform: 'Facebook', name: 'Story (1080×1920)', w: 1080, h: 1920, icon: '📱' },
  // YouTube
  { platform: 'YouTube', name: 'Thumbnail (1280×720)', w: 1280, h: 720, icon: '▶️' },
  { platform: 'YouTube', name: 'Banner (2560×1440)', w: 2560, h: 1440, icon: '🎨' },
  // Twitter / X
  { platform: 'Twitter / X', name: 'Post (1200×675)', w: 1200, h: 675, icon: '🐦' },
  { platform: 'Twitter / X', name: 'Header (1500×500)', w: 1500, h: 500, icon: '🖼️' },
  // LinkedIn
  { platform: 'LinkedIn', name: 'Post (1200×627)', w: 1200, h: 627, icon: '💼' },
  { platform: 'LinkedIn', name: 'Banner (1584×396)', w: 1584, h: 396, icon: '🖼️' },
  // Pinterest
  { platform: 'Pinterest', name: 'Pin (1000×1500)', w: 1000, h: 1500, icon: '📌' },
  // WhatsApp
  { platform: 'WhatsApp', name: 'DP / Profile (500×500)', w: 500, h: 500, icon: '💬' },
  { platform: 'WhatsApp', name: 'Status (1080×1920)', w: 1080, h: 1920, icon: '📱' },
  // TikTok
  { platform: 'TikTok', name: 'Video (1080×1920)', w: 1080, h: 1920, icon: '🎵' },
]

const PLATFORMS = [...new Set(PRESETS.map(p => p.platform))]

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new window.Image()
    img.onload = () => { resolve(img); URL.revokeObjectURL(url) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
    img.src = url
  })
}

async function resizeSocial(
  file: File,
  tw: number,
  th: number,
  fit: FitMode,
  format: OutputFormat,
  quality: number,
): Promise<Blob> {
  const img = await blobToImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = tw
  canvas.height = th
  const ctx = canvas.getContext('2d')!

  if (fit === 'stretch') {
    ctx.drawImage(img, 0, 0, tw, th)
  } else if (fit === 'contain') {
    const scale = Math.min(tw / img.naturalWidth, th / img.naturalHeight)
    const dw = img.naturalWidth * scale
    const dh = img.naturalHeight * scale
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, tw, th)
    ctx.drawImage(img, (tw - dw) / 2, (th - dh) / 2, dw, dh)
  } else {
    // cover — fill + center crop
    const scale = Math.max(tw / img.naturalWidth, th / img.naturalHeight)
    const dw = img.naturalWidth * scale
    const dh = img.naturalHeight * scale
    ctx.drawImage(img, (tw - dw) / 2, (th - dh) / 2, dw, dh)
  }

  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
  return canvasToBlob(canvas, mimeType, quality)
}

export default function SocialMediaResizer() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [platform, setPlatform] = useState('Instagram')
  const [presetIdx, setPresetIdx] = useState(0)
  const [fit, setFit] = useState<FitMode>('cover')
  const [format, setFormat] = useState<OutputFormat>('jpeg')
  const [quality, setQuality] = useState(92)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; url: string; name: string; size: number } | null>(null)
  const cleanupRef = useRef<string[]>([])

  useEffect(() => {
    return () => { cleanupRef.current.forEach(URL.revokeObjectURL) }
  }, [])

  const platformPresets = PRESETS.filter(p => p.platform === platform)
  const selected = platformPresets[presetIdx] || platformPresets[0]

  useEffect(() => { setPresetIdx(0) }, [platform])

  const onFiles = async (files: File[]) => {
    const f = files[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    cleanupRef.current.push(url)
    setFile(f); setResult(null)
  }

  const run = async () => {
    if (!file || !selected) return
    setBusy(true)
    try {
      const blob = await resizeSocial(file, selected.w, selected.h, fit, format, quality / 100)
      const url = URL.createObjectURL(blob)
      cleanupRef.current.push(url)
      const name = `${baseName(file.name)}-${selected.w}x${selected.h}.${format === 'png' ? 'png' : 'jpg'}`
      setResult({ blob, url, name, size: blob.size })
      trackUsage({ toolId: 'social-media-resizer', toolName: 'Social Media Resizer', action: `${platform} ${selected.name}`, fileName: file.name, inputSize: file.size, outputSize: blob.size })
      toast.success(`Resized to ${selected.w}×${selected.h}.`)
    } catch { toast.error('Resize failed.') } finally { setBusy(false) }
  }

  const downloadResult = () => {
    if (!result) return
    downloadBlob(result.blob, result.name)
  }

  const remove = () => {
    cleanupRef.current.forEach(URL.revokeObjectURL)
    cleanupRef.current = []
    setFile(null); setResult(null)
  }

  if (!file) {
    return (
      <div className="grid gap-3">
        <Dropzone accept={['image/jpeg', 'image/png', 'image/webp', 'image/bmp']} onFiles={onFiles} label="Drop an image to resize for social media" icon={<ImageIcon className="h-8 w-8" />} />
        <p className="text-xs text-ink-500">Resize images to the exact dimensions required by Instagram, Facebook, YouTube, Twitter/X, LinkedIn, Pinterest, WhatsApp, and TikTok.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{file.name} · {formatBytes(file.size)}</p>
        <button onClick={remove} className="btn-ghost btn-sm"><Trash2 className="h-4 w-4" /> Change</button>
      </div>

      <Field label="Platform">
        <Segmented value={platform} onChange={setPlatform} options={PLATFORMS.map(p => ({ value: p, label: p }))} />
      </Field>

      <Field label="Size">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {platformPresets.map((p, i) => (
            <button
              key={i}
              onClick={() => setPresetIdx(i)}
              className={cn(
                'rounded-lg border p-3 text-left text-xs transition',
                i === presetIdx
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                  : 'border-ink-200 dark:border-ink-700 hover:border-ink-400'
              )}
            >
              <span className="text-base">{p.icon}</span>
              <p className="font-medium mt-1">{p.name}</p>
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fit mode">
          <Segmented value={fit} onChange={setFit} options={[
            { value: 'cover', label: 'Cover' },
            { value: 'contain', label: 'Contain' },
            { value: 'stretch', label: 'Stretch' },
          ]} />
        </Field>
        <Field label="Format">
          <Segmented value={format} onChange={setFormat} options={[
            { value: 'jpeg', label: 'JPG' },
            { value: 'png', label: 'PNG' },
          ]} />
        </Field>
      </div>

      {format === 'jpeg' && (
        <Field label={`Quality: ${quality}%`}>
          <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} className="w-full accent-brand-500" />
        </Field>
      )}

      <p className="text-xs text-ink-500">Output: {selected.w}×{selected.h} px · {fit} fit · {format.toUpperCase()}</p>

      {!result && (
        <button onClick={run} disabled={busy} className="btn-primary btn-md w-fit">{busy ? <Spinner className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />} Resize</button>
      )}

      {result && (
        <>
          <ResultBar inputSize={file.size} outputSize={result.size} />
          <div className="relative rounded-xl overflow-hidden border border-ink-200 dark:border-ink-700">
            <img src={result.url} alt="Resized preview" className="w-full max-h-80 object-contain mx-auto" />
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {selected.w}×{selected.h}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={downloadResult} className="btn-primary btn-md"><Download className="h-4 w-4" /> Download</button>
            <button onClick={() => setResult(null)} className="btn-secondary btn-md">Try another preset</button>
          </div>
        </>
      )}
    </div>
  )
}

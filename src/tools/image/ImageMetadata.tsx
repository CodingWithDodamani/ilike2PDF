import { useState } from 'react'
import exifr from 'exifr'
import { FileSearch, MapPin } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, EmptyHint } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { fileToImage, formatBytes } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

export default function ImageMetadata() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [exif, setExif] = useState<Record<string, unknown> | null>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })
  const [gps, setGps] = useState<{ lat: number; lon: number } | null>(null)
  const [busy, setBusy] = useState(false)

  const onFile = async (files: File[]) => {
    const f = files[0]
    setFile(f); setBusy(true); setExif(null); setGps(null)
    try {
      const img = await fileToImage(f)
      setDims({ w: img.naturalWidth, h: img.naturalHeight })
      const data = await exifr.parse(f, { gps: true }).catch(() => null)
      setExif(data ?? {})
      const g = await exifr.gps(f).catch(() => null)
      if (g && g.latitude) setGps({ lat: g.latitude, lon: g.longitude })
      trackUsage({ toolId: 'image-metadata', toolName: 'Image Metadata', action: 'Read EXIF', fileName: f.name, inputSize: f.size })
    } catch { toast.error('Could not read metadata.') } finally { setBusy(false) }
  }

  if (!file) return <Dropzone accept={['image/jpeg', 'image/png', 'image/tiff', 'image/heic']} onFiles={onFile} label="Drop an image to inspect EXIF" icon={<FileSearch className="h-8 w-8" />} />

  const entries = exif ? Object.entries(exif).filter(([, v]) => v != null && typeof v !== 'object') : []

  return (
    <div className="card p-5 grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{file.name} · {formatBytes(file.size)} · {dims.w}×{dims.h}</p>
        <button onClick={() => setFile(null)} className="btn-ghost btn-sm">Change image</button>
      </div>
      {busy ? <div className="grid place-items-center py-8"><Spinner className="h-6 w-6 text-brand-500" /></div> : (
        <>
          {gps && (
            <a href={`https://www.openstreetmap.org/?mlat=${gps.lat}&mlon=${gps.lon}#map=15/${gps.lat}/${gps.lon}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-brand-500 hover:underline">
              <MapPin className="h-4 w-4" /> GPS: {gps.lat.toFixed(5)}, {gps.lon.toFixed(5)} — view on map
            </a>
          )}
          {entries.length === 0 ? <EmptyHint>No EXIF metadata found (it may have been stripped).</EmptyHint> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {entries.map(([k, v]) => (
                    <tr key={k} className="border-b border-ink-200/50 dark:border-white/5">
                      <td className="py-2 pr-4 font-medium text-ink-600 dark:text-ink-300">{k}</td>
                      <td className="py-2 font-mono text-xs break-all">{String(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

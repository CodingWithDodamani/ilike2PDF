import { useState, useCallback, useRef, useEffect } from 'react'
import { Section } from '@/components/ui'
import { downloadBlob, baseName, fileToImage, canvasToBlob } from '@/lib/utils'
import { useToast } from '@/components/Toaster'
import { FileSearch, Trash2, Download } from 'lucide-react'
import exifr from 'exifr'
import { Dropzone } from '@/components/Dropzone'
import { trackUsage } from '@/lib/storage'

interface ExifFields {
  Make?: string
  Model?: string
  DateTimeOriginal?: string
  CreateDate?: string
  GPSLatitude?: number
  GPSLongitude?: number
  ImageDescription?: string
  UserComment?: string
  ExposureTime?: number
  FNumber?: number
  ISO?: number
  FocalLength?: number
  LensModel?: string
  ImageWidth?: number
  ImageHeight?: number
  [key: string]: unknown
}

const DISPLAY_FIELDS: { key: string; label: string }[] = [
  { key: 'Make', label: 'Camera Make' },
  { key: 'Model', label: 'Camera Model' },
  { key: 'DateTimeOriginal', label: 'Date/Time' },
  { key: 'CreateDate', label: 'Create Date' },
  { key: 'ExposureTime', label: 'Exposure' },
  { key: 'FNumber', label: 'Aperture' },
  { key: 'ISO', label: 'ISO' },
  { key: 'FocalLength', label: 'Focal Length' },
  { key: 'LensModel', label: 'Lens' },
  { key: 'GPSLatitude', label: 'GPS Latitude' },
  { key: 'GPSLongitude', label: 'GPS Longitude' },
  { key: 'ImageDescription', label: 'Description' },
  { key: 'UserComment', label: 'Comment' },
]

export default function ImageExifEditor() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [metadata, setMetadata] = useState<ExifFields | null>(null)
  const [busy, setBusy] = useState(false)
  const [imgUrl, setImgUrl] = useState('')
  const imgUrlRef = useRef('')
  const [dims, setDims] = useState({ w: 0, h: 0 })

  useEffect(() => {
    return () => { if (imgUrlRef.current) URL.revokeObjectURL(imgUrlRef.current) }
  }, [])

  const reset = useCallback(() => {
    if (imgUrlRef.current) URL.revokeObjectURL(imgUrlRef.current)
    imgUrlRef.current = ''
    setFile(null)
    setMetadata(null)
    setImgUrl('')
    setDims({ w: 0, h: 0 })
  }, [])

  const onFiles = useCallback(async (files: File[]) => {
    const f = files[0]
    reset()
    setFile(f)
    setBusy(true)
    try {
      const img = await fileToImage(f)
      setDims({ w: img.naturalWidth, h: img.naturalHeight })
      const url = URL.createObjectURL(f)
      imgUrlRef.current = url
      setImgUrl(url)
      const data = await exifr.parse(f, { gps: true }).catch(() => null)
      const exif: ExifFields = {}
      if (data) {
        for (const key of Object.keys(data)) {
          if (data[key] != null) exif[key] = data[key]
        }
      }
      setMetadata(exif)
      trackUsage({ toolId: 'image-exif-editor', toolName: 'Image EXIF Editor', action: 'Read EXIF', fileName: f.name, inputSize: f.size })
    } catch {
      toast.error('Could not read metadata.')
      reset()
    } finally {
      setBusy(false)
    }
  }, [reset, toast])

  const metaCount = metadata ? Object.keys(metadata).length : 0

  const stripAllMetadata = useCallback(async () => {
    if (!file) return
    setBusy(true)
    try {
      const img = await fileToImage(file)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const ext = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const quality = ext === 'image/jpeg' ? 0.92 : undefined
      const blob = await canvasToBlob(canvas, ext, quality)
      const name = `${baseName(file.name)}-clean.${ext === 'image/png' ? 'png' : 'jpg'}`
      downloadBlob(blob, name)
      trackUsage({ toolId: 'image-exif-editor', toolName: 'Image EXIF Editor', action: 'Strip all metadata', fileName: file.name, inputSize: file.size, outputSize: blob.size })
      toast.success('Metadata stripped and image downloaded.')
    } catch {
      toast.error('Failed to strip metadata.')
    } finally {
      setBusy(false)
    }
  }, [file, toast])

  const downloadClean = useCallback(async () => {
    if (!file || !imgUrl) return
    setBusy(true)
    try {
      const img = await fileToImage(file)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const ext = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const quality = ext === 'image/jpeg' ? 0.92 : undefined
      const blob = await canvasToBlob(canvas, ext, quality)
      const name = `${baseName(file.name)}.${ext === 'image/png' ? 'png' : 'jpg'}`
      downloadBlob(blob, name)
      trackUsage({ toolId: 'image-exif-editor', toolName: 'Image EXIF Editor', action: 'Download clean image', fileName: file.name, inputSize: file.size, outputSize: blob.size })
      toast.success('Clean image downloaded.')
    } catch {
      toast.error('Failed to generate clean image.')
    } finally {
      setBusy(false)
    }
  }, [file, imgUrl, toast])

  const formatValue = (v: unknown): string => {
    if (v == null) return '—'
    if (typeof v === 'number') return String(v)
    if (typeof v === 'string') return v
    return String(v)
  }

  if (!file) {
    return (
      <Section>
        <h2 className="text-lg font-semibold mb-1">Image Metadata Editor</h2>
        <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">View and remove EXIF metadata from photos.</p>
        <Dropzone accept={['image/jpeg', 'image/png', 'image/webp']} onFiles={onFiles} icon={<FileSearch className="h-8 w-8" />} />
      </Section>
    )
  }

  return (
    <Section>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <h2 className="text-lg font-semibold">Image Metadata Editor</h2>
          <p className="text-xs text-ink-500 dark:text-ink-400">{file.name} · {dims.w}×{dims.h} · {metaCount} metadata fields</p>
        </div>
        <button onClick={reset} className="btn-ghost btn-sm">Change image</button>
      </div>

      {busy ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid gap-4">
          {imgUrl && (
            <div className="rounded-xl overflow-hidden border border-ink-200/50 dark:border-white/5">
              <img src={imgUrl} alt="Preview" className="max-h-48 w-full object-contain bg-ink-100 dark:bg-ink-800" />
            </div>
          )}

          {metadata && metaCount > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">EXIF Data ({metaCount} fields)</h3>
              <div className="overflow-x-auto rounded-xl border border-ink-200/50 dark:border-white/5">
                <table className="w-full text-sm">
                  <tbody>
                    {DISPLAY_FIELDS.filter((f) => metadata[f.key] != null).map(({ key, label }) => (
                      <tr key={key} className="border-b border-ink-200/50 dark:border-white/5 last:border-0">
                        <td className="py-2 px-3 font-medium text-ink-600 dark:text-ink-300 whitespace-nowrap">{label}</td>
                        <td className="py-2 px-3 font-mono text-xs break-all">{formatValue(metadata[key])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {metadata && metaCount === 0 && (
            <div className="text-center py-6 text-sm text-ink-500">No EXIF metadata found.</div>
          )}

          <div className="flex gap-2 flex-wrap">
            <button onClick={downloadClean} className="btn-secondary btn-sm">
              <Download className="h-4 w-4" /> Download Clean Image
            </button>
            <button onClick={stripAllMetadata} className="btn-primary btn-sm">
              <Trash2 className="h-4 w-4" /> Remove All Metadata
            </button>
          </div>
        </div>
      )}
    </Section>
  )
}

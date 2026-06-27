import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { ScanQrCode, Camera, Upload, Copy, ExternalLink, X } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Segmented } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { fileToImage } from '@/lib/utils'
import { imageToCanvas } from '@/lib/image'
import { trackUsage } from '@/lib/storage'

export default function QrScanner() {
  const toast = useToast()
  const [mode, setMode] = useState<'upload' | 'camera'>('upload')
  const [result, setResult] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)

  const decodeCanvas = (canvas: HTMLCanvasElement): string | null => {
    const ctx = canvas.getContext('2d')!
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(data.data, canvas.width, canvas.height)
    return code?.data ?? null
  }

  const onFile = async (files: File[]) => {
    try {
      const img = await fileToImage(files[0])
      const found = decodeCanvas(imageToCanvas(img))
      if (found) { setResult(found); toast.success('QR code decoded.'); trackUsage({ toolId: 'qr-scanner', toolName: 'QR Scanner', action: 'Decoded from image' }) }
      else toast.error('No QR code found in this image.')
    } catch { toast.error('Could not read image.') }
  }

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  useEffect(() => {
    if (mode !== 'camera') { stopCamera(); return }
    let cancelled = false
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
        const canvas = document.createElement('canvas')
        const scan = () => {
          const v = videoRef.current
          if (v && v.videoWidth) {
            canvas.width = v.videoWidth; canvas.height = v.videoHeight
            canvas.getContext('2d')!.drawImage(v, 0, 0)
            const found = decodeCanvas(canvas)
            if (found) { setResult(found); toast.success('QR code detected!'); trackUsage({ toolId: 'qr-scanner', toolName: 'QR Scanner', action: 'Scanned via camera' }); setMode('upload'); return }
          }
          rafRef.current = requestAnimationFrame(scan)
        }
        scan()
      } catch { toast.error('Camera access denied or unavailable.'); setMode('upload') }
    })()
    return () => { cancelled = true; stopCamera() }
  }, [mode])

  const isUrl = result && /^https?:\/\//i.test(result)

  return (
    <div className="grid gap-5">
      <Segmented value={mode} onChange={setMode} ariaLabel="Scan mode" options={[
        { value: 'upload', label: <span className="flex items-center gap-1"><Upload className="h-3.5 w-3.5" />Upload</span> },
        { value: 'camera', label: <span className="flex items-center gap-1"><Camera className="h-3.5 w-3.5" />Camera</span> },
      ]} />
      {mode === 'upload'
        ? <Dropzone accept={['image/png', 'image/jpeg', 'image/webp']} onFiles={onFile} label="Drop a QR code image" icon={<ScanQrCode className="h-8 w-8" />} />
        : (
          <div className="card p-3">
            <video ref={videoRef} playsInline muted className="w-full max-h-96 rounded-xl bg-black object-contain" />
            <p className="text-xs text-ink-500 text-center mt-2">Point your camera at a QR code…</p>
          </div>
        )}
      {result && (
        <div className="card p-5 grid gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Result</p>
            <button onClick={() => setResult(null)} className="shrink-0 grid h-11 w-11 place-items-center rounded-xl text-ink-400 hover:text-ink-600 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors focus-ring"><X className="h-4 w-4" /></button>
          </div>
          <p className="font-mono text-sm break-all bg-ink-100 dark:bg-ink-850 rounded-lg p-3">{result}</p>
          <div className="flex gap-2">
            <button onClick={() => { navigator.clipboard.writeText(result); toast.success('Copied.') }} className="btn-secondary btn-sm"><Copy className="h-4 w-4" /> Copy</button>
            {isUrl && <a href={result} target="_blank" rel="noreferrer" className="btn-primary btn-sm"><ExternalLink className="h-4 w-4" /> Open link</a>}
          </div>
        </div>
      )}
    </div>
  )
}

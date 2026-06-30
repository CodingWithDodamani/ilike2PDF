import { useState, useCallback, useRef, useEffect } from 'react'
import { Camera, Upload, Copy, Check, ExternalLink } from 'lucide-react'
import { Section } from '@/components/ui'

interface QrResult {
  text: string
  isUrl: boolean
}

export default function QrReader() {
  const [result, setResult] = useState<QrResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    return () => {
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  const isUrl = (text: string): boolean => {
    try { new URL(text); return true } catch { return false }
  }

  const processImage = useCallback(async (file: File) => {
    setScanning(true)
    setError('')
    try {
      const img = new window.Image()
      img.onload = async () => {
        const canvas = canvasRef.current!
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        // Use BarcodeDetector API if available
        if ('BarcodeDetector' in window) {
          try {
            const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const barcodes = await detector.detect(imageData)
            if (barcodes.length > 0) {
              const text = barcodes[0].rawValue
              setResult({ text, isUrl: isUrl(text) })
            } else {
              setError('No QR code found in image')
            }
          } catch {
            setError('BarcodeDetector not supported. Try a different browser.')
          }
        } else {
          setError('QR scanning requires Chrome, Edge, or Opera browser')
        }
        setScanning(false)
      }
      img.src = URL.createObjectURL(file)
    } catch {
      setError('Failed to process image')
      setScanning(false)
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setCameraActive(true)
        // Start scanning loop
        const scan = async () => {
          if (!videoRef.current || !canvasRef.current) return
          const video = videoRef.current
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(video, 0, 0)
            if ('BarcodeDetector' in window) {
              try {
                const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
                const barcodes = await detector.detect(canvas)
                if (barcodes.length > 0) {
                  const text = barcodes[0].rawValue
                  setResult({ text, isUrl: isUrl(text) })
                  stopCamera()
                  return
                }
              } catch { /* QR decode error — skip frame */ }
            }
          }
          animRef.current = requestAnimationFrame(scan)
        }
        animRef.current = requestAnimationFrame(scan)
      }
    } catch {
      setError('Camera access denied. Please allow camera access.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    cancelAnimationFrame(animRef.current)
    setCameraActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'))
    if (file) processImage(file)
  }, [processImage])

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processImage(file)
    e.target.value = ''
  }, [processImage])

  const copy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">QR Code Scanner</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Scan QR codes from camera or uploaded images. Requires Chrome/Edge/Opera.
      </p>

      <canvas ref={canvasRef} className="hidden" />

      {/* Camera */}
      <div className="mb-4">
        <div className="flex gap-2">
          {!cameraActive ? (
            <button onClick={startCamera} className="btn-primary px-4 py-2 text-sm rounded-lg flex items-center gap-1.5">
              <Camera className="w-4 h-4" /> Start Camera
            </button>
          ) : (
            <button onClick={stopCamera} className="btn-ghost px-4 py-2 text-sm rounded-lg flex items-center gap-1.5 text-red-500">
              <Camera className="w-4 h-4" /> Stop Camera
            </button>
          )}
        </div>
        {cameraActive && (
          <div className="mt-3 rounded-xl overflow-hidden relative">
            <video ref={videoRef} className="w-full max-h-60 object-cover" playsInline muted />
            <div className="absolute inset-0 border-2 border-brand-500/50 rounded-xl pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-brand-500 rounded-lg" />
            </div>
          </div>
        )}
      </div>

      {/* Upload */}
      <div onDragOver={e => e.preventDefault()} onDrop={handleDrop}
        className="border-2 border-dashed rounded-xl p-6 text-center border-ink-300 dark:border-ink-600 hover:border-brand-500 transition cursor-pointer mb-4">
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" id="qr-input" />
        <label htmlFor="qr-input" className="cursor-pointer">
          <Upload className="w-8 h-8 mx-auto mb-2 text-ink-400" />
          <p className="text-sm">{scanning ? 'Scanning...' : 'Drop an image with QR code or click to browse'}</p>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 text-sm mb-4">{error}</div>
      )}

      {/* Result */}
      {result && (
        <div className="card p-5 bg-gradient-to-br from-brand-500/5 to-accent-400/5">
          <p className="text-xs text-ink-500 dark:text-ink-400 mb-2">Scanned Content</p>
          <p className="text-lg font-mono font-medium break-all mb-3">{result.text}</p>
          <div className="flex gap-2">
            <button onClick={copy} className="btn-ghost px-3 py-2 text-sm rounded-lg flex items-center gap-1.5">
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            {result.isUrl && (
              <a href={result.text} target="_blank" rel="noopener"
                className="btn-ghost px-3 py-2 text-sm rounded-lg flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4" /> Open Link
              </a>
            )}
          </div>
        </div>
      )}
    </Section>
  )
}

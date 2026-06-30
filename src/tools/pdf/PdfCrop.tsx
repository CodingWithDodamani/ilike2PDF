import { useState, useRef, useCallback, useEffect } from 'react'
import { Section, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'
import { fileToArrayBuffer, bytesToBlob, downloadBlob, baseName } from '@/lib/utils'
import { loadPdfDocument, renderPageToCanvas } from '@/lib/pdf'
import { PDFDocument } from 'pdf-lib'
import { Crop, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { useToast } from '@/components/Toaster'
import { trackUsage } from '@/lib/storage'

interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

export default function PdfCrop() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [previewWidth, setPreviewWidth] = useState(0)
  const [previewHeight, setPreviewHeight] = useState(0)
  const [cropRect, setCropRect] = useState<CropRect | null>(null)
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null)
  const [moving, setMoving] = useState(false)
  const [moveStart, setMoveStart] = useState<{ x: number; y: number } | null>(null)
  const [rectStart, setRectStart] = useState<CropRect | null>(null)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)

  const overlayRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfDataRef = useRef<ArrayBuffer | null>(null)
  const scaleRef = useRef(1)
  const pdfWidthRef = useRef(0)
  const pdfHeightRef = useRef(0)

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile(f)
    setCropRect(null)
    try {
      const buf = await fileToArrayBuffer(f)
      pdfDataRef.current = buf
      const doc = await loadPdfDocument(buf)
      const page = await doc.getPage(1)
      const vp = page.getViewport({ scale: 1 })
      pdfWidthRef.current = vp.width
      pdfHeightRef.current = vp.height
      const rendered = await renderPageToCanvas(doc, 1, 0.8)
      scaleRef.current = rendered.width / vp.width
      setPreviewWidth(rendered.width)
      setPreviewHeight(rendered.height)
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = rendered.width
        canvas.height = rendered.height
        const ctx = canvas.getContext('2d')
        if (ctx) ctx.drawImage(rendered, 0, 0)
      }
    } catch {
      toast.error('Failed to load PDF.')
      setFile(null)
    }
  }, [toast])

  const getOverlayCoords = useCallback((e: React.MouseEvent | React.PointerEvent | MouseEvent) => {
    if (!overlayRef.current) return { x: 0, y: 0 }
    const rect = overlayRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const clampRect = useCallback((r: CropRect): CropRect => {
    const maxW = previewWidth
    const maxH = previewHeight
    const x = Math.max(0, Math.min(r.x, maxW - 10))
    const y = Math.max(0, Math.min(r.y, maxH - 10))
    const w = Math.max(10, Math.min(r.w, maxW - x))
    const h = Math.max(10, Math.min(r.h, maxH - y))
    return { x, y, w, h }
  }, [previewWidth, previewHeight])

  const handleOverlayMouseDown = useCallback((e: React.MouseEvent | React.PointerEvent) => {
    const pos = getOverlayCoords(e)
    if (cropRect) {
      const handleSize = 10
      const corners: { key: 'nw' | 'ne' | 'sw' | 'se'; cx: number; cy: number }[] = [
        { key: 'nw', cx: cropRect.x, cy: cropRect.y },
        { key: 'ne', cx: cropRect.x + cropRect.w, cy: cropRect.y },
        { key: 'sw', cx: cropRect.x, cy: cropRect.y + cropRect.h },
        { key: 'se', cx: cropRect.x + cropRect.w, cy: cropRect.y + cropRect.h },
      ]
      for (const c of corners) {
        if (Math.abs(pos.x - c.cx) <= handleSize && Math.abs(pos.y - c.cy) <= handleSize) {
          setResizing(c.key)
          setMoveStart(pos)
          setRectStart(cropRect)
          e.preventDefault()
          return
        }
      }
      if (pos.x >= cropRect.x && pos.x <= cropRect.x + cropRect.w && pos.y >= cropRect.y && pos.y <= cropRect.y + cropRect.h) {
        setMoving(true)
        setMoveStart(pos)
        setRectStart(cropRect)
        e.preventDefault()
        return
      }
    }
    setDragging(true)
    setDrawStart(pos)
    setCropRect({ x: pos.x, y: pos.y, w: 0, h: 0 })
  }, [cropRect, getOverlayCoords])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const pos = getOverlayCoords(e)
    if (dragging && drawStart) {
      const x = Math.min(drawStart.x, pos.x)
      const y = Math.min(drawStart.y, pos.y)
      const w = Math.abs(pos.x - drawStart.x)
      const h = Math.abs(pos.y - drawStart.y)
      setCropRect(clampRect({ x, y, w, h }))
      return
    }
    if (resizing && moveStart && rectStart) {
      let { x, y, w, h } = rectStart
      const dx = pos.x - moveStart.x
      const dy = pos.y - moveStart.y
      if (resizing === 'nw') { x = rectStart.x + dx; y = rectStart.y + dy; w = rectStart.w - dx; h = rectStart.h - dy }
      else if (resizing === 'ne') { y = rectStart.y + dy; w = rectStart.w + dx; h = rectStart.h - dy }
      else if (resizing === 'sw') { x = rectStart.x + dx; w = rectStart.w - dx; h = rectStart.h + dy }
      else if (resizing === 'se') { w = rectStart.w + dx; h = rectStart.h + dy }
      if (w > 0 && h > 0) setCropRect(clampRect({ x, y, w, h }))
      return
    }
    if (moving && moveStart && rectStart) {
      const dx = pos.x - moveStart.x
      const dy = pos.y - moveStart.y
      setCropRect(clampRect({ x: rectStart.x + dx, y: rectStart.y + dy, w: rectStart.w, h: rectStart.h }))
    }
  }, [dragging, drawStart, resizing, moveStart, rectStart, moving, getOverlayCoords, clampRect])

  const handleMouseUp = useCallback(() => {
    setDragging(false)
    setResizing(null)
    setMoving(false)
    setMoveStart(null)
    setRectStart(null)
    setDrawStart(null)
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp) }
  }, [handleMouseMove, handleMouseUp])

  const applyCrop = useCallback(async () => {
    if (!file || !pdfDataRef.current || !cropRect) { toast.error('Draw a crop area first.'); return }
    setBusy(true)
    try {
      const scale = scaleRef.current
      const x = cropRect.x / scale
      const pdfH = pdfHeightRef.current
      const y = pdfH - (cropRect.y + cropRect.h) / scale
      const w = cropRect.w / scale
      const h = cropRect.h / scale
      const src = await PDFDocument.load(pdfDataRef.current, { ignoreEncryption: true })
      src.getPages().forEach((page) => {
        page.setMediaBox(x, y, w, h)
      })
      const bytes = await src.save()
      downloadBlob(bytesToBlob(bytes, 'application/pdf'), `${baseName(file.name)}-cropped.pdf`)
      trackUsage({ toolId: 'pdf-crop', toolName: 'PDF Crop', action: `Cropped to ${Math.round(w)}x${Math.round(h)}pt`, fileName: file.name, inputSize: file.size })
      toast.success('PDF cropped successfully.')
    } catch { toast.error('Crop failed.') } finally { setBusy(false) }
  }, [file, cropRect, toast])

  const coords = cropRect ? {
    x: Math.round(cropRect.x / scaleRef.current),
    y: Math.round((pdfHeightRef.current * scaleRef.current - cropRect.y - cropRect.h) / scaleRef.current),
    w: Math.round(cropRect.w / scaleRef.current),
    h: Math.round(cropRect.h / scaleRef.current),
  } : null

  if (!file) {
    return (
      <Section>
        <h2 className="text-lg font-semibold mb-1">PDF Crop</h2>
        <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">Crop margins from all PDF pages.</p>
        <Dropzone accept={['application/pdf']} onFiles={handleFiles} icon={<Crop className="h-8 w-8" />} />
      </Section>
    )
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">PDF Crop</h2>
      <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">Crop margins from all PDF pages.</p>
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="text-sm font-medium">{file.name}</p>
          <div className="flex gap-2">
            <button onClick={applyCrop} disabled={busy || !cropRect} className={cn('btn-primary btn-sm', (!cropRect || busy) && 'opacity-50 cursor-not-allowed')}>
              {busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Apply Crop
            </button>
            <button onClick={() => { setFile(null); setCropRect(null); pdfDataRef.current = null }} className="btn-ghost btn-sm">Change</button>
          </div>
        </div>
        {coords && (
          <div className="mb-3 rounded-lg bg-ink-50 dark:bg-ink-800 px-3 py-2 text-xs font-mono text-ink-600 dark:text-ink-300 inline-flex gap-4 flex-wrap">
            <span>X: {coords.x} pt</span>
            <span>Y: {coords.y} pt</span>
            <span>W: {coords.w} pt</span>
            <span>H: {coords.h} pt</span>
          </div>
        )}
        <div className="relative inline-block max-w-full overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700">
          <canvas ref={canvasRef} className="block max-w-full h-auto" />
          <div
            ref={overlayRef}
            className="absolute inset-0 cursor-crosshair"
            style={{ touchAction: 'none' }}
            onPointerDown={handleOverlayMouseDown}
          >
            {cropRect && (
              <>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(to right, rgba(0,0,0,0.5) ${cropRect.x}px, transparent ${cropRect.x}px, transparent ${cropRect.x + cropRect.w}px, rgba(0,0,0,0.5) ${cropRect.x + cropRect.w}px)`,
                  }}
                />
                <div
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{
                    top: 0,
                    height: cropRect.y,
                    background: 'rgba(0,0,0,0.5)',
                  }}
                />
                <div
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{
                    top: cropRect.y + cropRect.h,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                  }}
                />
                <div
                  className="absolute border-2 border-brand-500 pointer-events-none"
                  style={{ left: cropRect.x, top: cropRect.y, width: cropRect.w, height: cropRect.h }}
                >
                  <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-brand-500 rounded-full cursor-nw-resize pointer-events-auto" />
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-brand-500 rounded-full cursor-ne-resize pointer-events-auto" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-brand-500 rounded-full cursor-sw-resize pointer-events-auto" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-brand-500 rounded-full cursor-se-resize pointer-events-auto" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Section>
  )
}

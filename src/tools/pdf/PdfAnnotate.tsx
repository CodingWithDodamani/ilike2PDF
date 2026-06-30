import { useState, useRef, useCallback, useEffect } from 'react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'
import { fileToArrayBuffer, bytesToBlob, downloadBlob, baseName } from '@/lib/utils'
import { loadPdfDocument, renderPageToCanvas } from '@/lib/pdf'
import { PDFDocument, rgb } from 'pdf-lib'
import { Highlighter, Type, Download, Undo2, Minus } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { useToast } from '@/components/Toaster'

interface Annotation {
  type: 'highlight' | 'text' | 'underline'
  pageIndex: number
  x: number
  y: number
  w: number
  h: number
  text?: string
}

const SCALE = 1.5

export default function PdfAnnotate() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<ArrayBuffer | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [tool, setTool] = useState<'highlight' | 'text' | 'underline'>('highlight')
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [drawing, setDrawing] = useState(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [textInput, setTextInput] = useState<{ x: number; y: number; pageIndex: number } | null>(null)
  const [textValue, setTextValue] = useState('')
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 })
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const renderPage = useCallback(async () => {
    if (!data || !canvasRef.current) return
    const doc = await loadPdfDocument(data.slice(0))
    const canvas = await renderPageToCanvas(doc, currentPage + 1, SCALE)
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    canvasRef.current.width = canvas.width
    canvasRef.current.height = canvas.height
    ctx.drawImage(canvas, 0, 0)
    setCanvasSize({ w: canvas.width, h: canvas.height })
  }, [data, currentPage])

  useEffect(() => {
    renderPage()
  }, [renderPage])

  const onFile = async (files: File[]) => {
    const buf = await fileToArrayBuffer(files[0])
    const doc = await loadPdfDocument(buf.slice(0))
    setFile(files[0])
    setData(buf)
    setTotalPages(doc.numPages)
    setCurrentPage(0)
    setAnnotations([])
  }

  const getCanvasCoords = (e: React.MouseEvent | React.PointerEvent) => {
    const overlay = overlayRef.current
    if (!overlay) return { x: 0, y: 0 }
    const rect = overlay.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * canvasSize.w
    const y = ((e.clientY - rect.top) / rect.height) * canvasSize.h
    return { x, y }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!data) return
    const pos = getCanvasCoords(e)

    if (tool === 'text') {
      setTextInput({ x: pos.x, y: pos.y, pageIndex: currentPage })
      setTextValue('')
      return
    }

    setDrawing(true)
    setStartPos(pos)
    setCurrentRect({ x: pos.x, y: pos.y, w: 0, h: 0 })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawing || !startPos) return
    const pos = getCanvasCoords(e)
    const x = Math.min(startPos.x, pos.x)
    const y = Math.min(startPos.y, pos.y)
    const w = Math.abs(pos.x - startPos.x)
    const h = Math.abs(pos.y - startPos.y)
    setCurrentRect({ x, y, w, h })
  }

  const handlePointerUp = () => {
    if (!drawing || !currentRect || currentRect.w < 5 || currentRect.h < 5) {
      setDrawing(false)
      setStartPos(null)
      setCurrentRect(null)
      return
    }

    setAnnotations((prev) => [
      ...prev,
      {
        type: tool,
        pageIndex: currentPage,
        x: currentRect.x,
        y: currentRect.y,
        w: currentRect.w,
        h: currentRect.h,
      },
    ])
    setDrawing(false)
    setStartPos(null)
    setCurrentRect(null)
  }

  const handleTextSubmit = () => {
    if (!textInput || !textValue.trim()) {
      setTextInput(null)
      return
    }
    setAnnotations((prev) => [
      ...prev,
      {
        type: 'text',
        pageIndex: textInput.pageIndex,
        x: textInput.x,
        y: textInput.y,
        w: 0,
        h: 0,
        text: textValue.trim(),
      },
    ])
    setTextInput(null)
    setTextValue('')
  }

  const removeLast = () => {
    setAnnotations((prev) => prev.slice(0, -1))
  }

  const pageAnnotations = annotations.filter((a) => a.pageIndex === currentPage)

  const save = async () => {
    if (!file || !data) return
    setBusy(true)
    try {
      const doc = await PDFDocument.load(data, { ignoreEncryption: true })

      for (const ann of annotations) {
        const page = doc.getPage(ann.pageIndex)
        const { height } = page.getSize()

        if (ann.type === 'highlight') {
          page.drawRectangle({
            x: ann.x / SCALE,
            y: height - (ann.y + ann.h) / SCALE,
            width: ann.w / SCALE,
            height: ann.h / SCALE,
            opacity: 0.3,
            color: rgb(1, 1, 0),
          })
        } else if (ann.type === 'text' && ann.text) {
          page.drawText(ann.text, {
            x: ann.x / SCALE,
            y: height - ann.y / SCALE - 12,
            size: 12,
            color: rgb(1, 0, 0),
          })
        } else if (ann.type === 'underline') {
          page.drawLine({
            start: { x: ann.x / SCALE, y: height - (ann.y + ann.h) / SCALE },
            end: { x: (ann.x + ann.w) / SCALE, y: height - (ann.y + ann.h) / SCALE },
            thickness: 1,
            color: rgb(0, 0, 1),
          })
        }
      }

      const bytes = await doc.save()
      downloadBlob(bytesToBlob(bytes, 'application/pdf'), `${baseName(file.name)}-annotated.pdf`)
      toast.success('Annotated PDF saved.')
    } catch {
      toast.error('Failed to save annotations.')
    } finally {
      setBusy(false)
    }
  }

  if (!file || !data) {
    return (
      <Section>
        <h2 className="text-lg font-semibold mb-1">PDF Annotate</h2>
        <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">Highlight, underline, and add text to PDF pages.</p>
        <Dropzone accept={['application/pdf']} onFiles={onFile} icon={<Highlighter className="h-8 w-8" />} />
      </Section>
    )
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">PDF Annotate</h2>
      <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">Highlight, underline, and add text to PDF pages.</p>

      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <button onClick={() => { setFile(null); setData(null); setAnnotations([]) }} className="btn-ghost btn-sm">Change file</button>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={() => setTool('highlight')} className={cn('btn-ghost btn-sm', tool === 'highlight' && 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400')}>
          <Highlighter className="h-4 w-4" /> Highlight
        </button>
        <button onClick={() => setTool('text')} className={cn('btn-ghost btn-sm', tool === 'text' && 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400')}>
          <Type className="h-4 w-4" /> Text
        </button>
        <button onClick={() => setTool('underline')} className={cn('btn-ghost btn-sm', tool === 'underline' && 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400')}>
          <Minus className="h-4 w-4" /> Underline
        </button>
        <div className="flex-1" />
        <button onClick={removeLast} disabled={annotations.length === 0} className="btn-ghost btn-sm disabled:opacity-40">
          <Undo2 className="h-4 w-4" /> Undo
        </button>
      </div>

      <div ref={containerRef} className="relative mx-auto border border-ink-200 dark:border-ink-700 rounded-xl overflow-hidden bg-ink-100 dark:bg-ink-900 mb-4" style={{ maxWidth: 700 }}>
        <canvas ref={canvasRef} className="w-full block" />
        <div
          ref={overlayRef}
          className="absolute inset-0"
          style={{ cursor: tool === 'text' ? 'text' : 'crosshair', touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {pageAnnotations.map((ann, i) => {
            if (ann.type === 'highlight') {
              return (
                <div
                  key={i}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${(ann.x / canvasSize.w) * 100}%`,
                    top: `${(ann.y / canvasSize.h) * 100}%`,
                    width: `${(ann.w / canvasSize.w) * 100}%`,
                    height: `${(ann.h / canvasSize.h) * 100}%`,
                    backgroundColor: 'rgba(255, 255, 0, 0.35)',
                  }}
                />
              )
            }
            if (ann.type === 'text') {
              return (
                <div
                  key={i}
                  className="absolute text-red-600 font-semibold pointer-events-none"
                  style={{
                    left: `${(ann.x / canvasSize.w) * 100}%`,
                    top: `${(ann.y / canvasSize.h) * 100}%`,
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ann.text}
                </div>
              )
            }
            if (ann.type === 'underline') {
              return (
                <div
                  key={i}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${(ann.x / canvasSize.w) * 100}%`,
                    top: `${((ann.y + ann.h) / canvasSize.h) * 100}%`,
                    width: `${(ann.w / canvasSize.w) * 100}%`,
                    height: 2,
                    backgroundColor: 'blue',
                  }}
                />
              )
            }
            return null
          })}

          {drawing && currentRect && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${(currentRect.x / canvasSize.w) * 100}%`,
                top: `${(currentRect.y / canvasSize.h) * 100}%`,
                width: `${(currentRect.w / canvasSize.w) * 100}%`,
                height: `${(currentRect.h / canvasSize.h) * 100}%`,
                border: '2px dashed #6366f1',
                backgroundColor: tool === 'highlight' ? 'rgba(255, 255, 0, 0.15)' : 'transparent',
              }}
            />
          )}

          {textInput && (
            <div
              className="absolute z-10"
              style={{
                left: `${(textInput.x / canvasSize.w) * 100}%`,
                top: `${(textInput.y / canvasSize.h) * 100}%`,
              }}
            >
              <input
                autoFocus
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTextSubmit(); if (e.key === 'Escape') setTextInput(null) }}
                onBlur={handleTextSubmit}
                className="bg-white dark:bg-ink-800 border border-ink-300 dark:border-ink-600 rounded px-2 py-1 text-sm text-ink-900 dark:text-ink-100 shadow-lg outline-none"
                placeholder="Type text..."
                style={{ minWidth: 120 }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0} className="btn-ghost btn-sm disabled:opacity-40">Prev</button>
          <span className="text-sm text-ink-600 dark:text-ink-300">{currentPage + 1} / {totalPages}</span>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} className="btn-ghost btn-sm disabled:opacity-40">Next</button>
        </div>
        <button onClick={save} disabled={busy || annotations.length === 0} className="btn-primary btn-md disabled:opacity-40">
          {busy ? 'Saving…' : <><Download className="h-4 w-4" /> Save annotated PDF</>}
        </button>
      </div>
    </Section>
  )
}
import * as pdfjsLib from 'pdfjs-dist'
// Vite resolves the worker URL; ?url import gives a bundled asset path.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export { pdfjsLib }

export interface PdfInfo {
  pageCount: number
  encrypted: boolean
  title?: string
  author?: string
}

export async function loadPdfDocument(data: ArrayBuffer, password?: string) {
  const task = pdfjsLib.getDocument({ data: data.slice(0), password })
  return task.promise
}

/** Render a single PDF page to a canvas at the given scale. Returns the canvas. */
export async function renderPageToCanvas(
  doc: Awaited<ReturnType<typeof loadPdfDocument>>,
  pageNumber: number,
  scale: number
): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport }).promise
  return canvas
}

export async function renderThumbnail(
  data: ArrayBuffer,
  pageNumber: number,
  maxWidth = 220
): Promise<string> {
  const doc = await loadPdfDocument(data)
  const page = await doc.getPage(pageNumber)
  const base = page.getViewport({ scale: 1 })
  const scale = maxWidth / base.width
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport }).promise
  return canvas.toDataURL('image/jpeg', 0.7)
}

export async function inspectPdf(data: ArrayBuffer): Promise<PdfInfo> {
  try {
    const doc = await loadPdfDocument(data)
    let title: string | undefined
    let author: string | undefined
    try {
      const meta = await doc.getMetadata()
      const info = meta.info as Record<string, unknown> | undefined
      title = info?.Title as string | undefined
      author = info?.Author as string | undefined
    } catch {
      /* ignore */
    }
    return { pageCount: doc.numPages, encrypted: false, title, author }
  } catch (e: unknown) {
    const err = e as { name?: string }
    if (err?.name === 'PasswordException') {
      return { pageCount: 0, encrypted: true }
    }
    throw e
  }
}

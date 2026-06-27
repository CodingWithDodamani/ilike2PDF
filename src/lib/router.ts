import type { ToolDef } from './types'
import { getTool } from './tools'
import { fileToArrayBuffer, fileToImage } from './utils'
import { inspectPdf } from './pdf'

export interface ToolSuggestion {
  tool: ToolDef
  reason: string
  score: number
}

/** Analyze a file and suggest the best tools (Smart File Router 2.0) */
export async function detectBestTools(file: File): Promise<ToolSuggestion[]> {
  const suggestions: ToolSuggestion[] = []
  const push = (slug: string, reason: string, score: number) => {
    const tool = getTool(slug)
    if (tool) suggestions.push({ tool, reason, score })
  }

  const type = file.type
  const isPdf = type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  const isImage = type.startsWith('image/')

  if (isPdf) {
    try {
      const buf = await fileToArrayBuffer(file)
      const info = await inspectPdf(buf)
      if (info.encrypted) {
        push('unlock-pdf', 'an encrypted PDF', 100)
        push('protect-pdf', 'a protected PDF', 40)
      } else {
        push('compress-pdf', `a ${info.pageCount}-page PDF`, 70)
        push('split-pdf', 'a multi-page PDF', info.pageCount > 1 ? 80 : 30)
        push('merge-pdf', 'a PDF', 50)
        push('pdf-to-image', 'a PDF', 60)
        push('organize-pdf', 'a PDF', 45)
      }
    } catch {
      push('compress-pdf', 'a PDF file', 50)
    }
  } else if (isImage) {
    try {
      const img = await fileToImage(file)
      const big = img.naturalWidth * img.naturalHeight > 2_000_000
      // Try QR detection
      const hasQr = await quickQrCheck(img)
      if (hasQr) push('qr-scanner', 'a QR code image', 95)
      push('compress-image', `a ${img.naturalWidth}×${img.naturalHeight} image`, big ? 85 : 60)
      push('resize-image', 'an image', 70)
      push('convert-image', 'an image', 55)
      push('image-to-pdf', 'an image', 50)
      push('crop-image', 'an image', 45)
    } catch {
      push('compress-image', 'an image', 50)
    }
  } else {
    push('document-size', 'a file', 60)
    push('base64', 'a file', 40)
    push('hash-generator', 'a file', 40)
  }

  return suggestions.sort((a, b) => b.score - a.score).slice(0, 5)
}

async function quickQrCheck(img: HTMLImageElement): Promise<boolean> {
  try {
    const jsQR = (await import('jsqr')).default
    const size = 320
    const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight, 1)
    const w = Math.round(img.naturalWidth * scale)
    const h = Math.round(img.naturalHeight * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, w, h)
    const data = ctx.getImageData(0, 0, w, h)
    return !!jsQR(data.data, w, h)
  } catch {
    return false
  }
}

import { canvasToBlob, fileToImage } from './utils'

export interface ResizeOpts {
  width?: number
  height?: number
  keepAspect?: boolean
  type?: string
  quality?: number
}

/** High-quality resize using multi-step downscaling. */
export async function resizeImageFile(file: Blob, opts: ResizeOpts): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await fileToImage(file)
  let tw = opts.width ?? img.naturalWidth
  let th = opts.height ?? img.naturalHeight
  if (opts.keepAspect) {
    const ratio = img.naturalWidth / img.naturalHeight
    if (opts.width && !opts.height) th = Math.round(opts.width / ratio)
    else if (opts.height && !opts.width) tw = Math.round(opts.height * ratio)
    else {
      // fit within box
      const scale = Math.min(tw / img.naturalWidth, th / img.naturalHeight)
      tw = Math.round(img.naturalWidth * scale)
      th = Math.round(img.naturalHeight * scale)
    }
  }
  const canvas = stepDownscale(img, tw, th)
  const type = opts.type ?? 'image/png'
  const blob = await canvasToBlob(canvas, type, opts.quality)
  return { blob, width: tw, height: th }
}

function stepDownscale(img: HTMLImageElement, tw: number, th: number): HTMLCanvasElement {
  let cw = img.naturalWidth
  let ch = img.naturalHeight
  let src: HTMLCanvasElement | HTMLImageElement = img
  // Step down by halves for smoother results
  while (cw * 0.5 > tw && ch * 0.5 > th) {
    cw = Math.round(cw * 0.5)
    ch = Math.round(ch * 0.5)
    const c = document.createElement('canvas')
    c.width = cw; c.height = ch
    const ctx = c.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(src, 0, 0, cw, ch)
    src = c
  }
  const out = document.createElement('canvas')
  out.width = tw; out.height = th
  const ctx = out.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, 0, 0, tw, th)
  return out
}

export async function convertImageFile(file: Blob, type: string, quality = 0.92): Promise<Blob> {
  const img = await fileToImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  if (type === 'image/jpeg' || type === 'image/bmp') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(img, 0, 0)
  return canvasToBlob(canvas, type, quality)
}

export function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  c.getContext('2d')!.drawImage(img, 0, 0)
  return c
}

/** Stack-blur-ish: simple separable box blur repeated to approximate Gaussian. */
export function blurCanvas(canvas: HTMLCanvasElement, radius: number) {
  if (radius <= 0) return
  const ctx = canvas.getContext('2d')!
  // Use built-in filter for performance & quality
  const tmp = document.createElement('canvas')
  tmp.width = canvas.width; tmp.height = canvas.height
  const tctx = tmp.getContext('2d')!
  tctx.filter = `blur(${radius}px)`
  tctx.drawImage(canvas, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(tmp, 0, 0)
}

/** Remove a background color within a threshold, making matching pixels transparent. */
export function removeBackgroundColor(canvas: HTMLCanvasElement, target: [number, number, number], threshold: number, feather: number) {
  const ctx = canvas.getContext('2d')!
  const { width, height } = canvas
  const imageData = ctx.getImageData(0, 0, width, height)
  const d = imageData.data
  const [tr, tg, tb] = target
  const t = threshold
  for (let i = 0; i < d.length; i += 4) {
    const dist = Math.sqrt((d[i] - tr) ** 2 + (d[i + 1] - tg) ** 2 + (d[i + 2] - tb) ** 2)
    if (dist < t) {
      d[i + 3] = 0
    } else if (feather > 0 && dist < t + feather) {
      d[i + 3] = Math.round(((dist - t) / feather) * d[i + 3])
    }
  }
  ctx.putImageData(imageData, 0, 0)
}

/** Auto-detect background color from canvas corners. */
export function detectCornerColor(canvas: HTMLCanvasElement): [number, number, number] {
  const ctx = canvas.getContext('2d')!
  const { width, height } = canvas
  const pts = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]]
  let r = 0, g = 0, b = 0
  for (const [x, y] of pts) {
    const p = ctx.getImageData(x, y, 1, 1).data
    r += p[0]; g += p[1]; b += p[2]
  }
  return [Math.round(r / 4), Math.round(g / 4), Math.round(b / 4)]
}

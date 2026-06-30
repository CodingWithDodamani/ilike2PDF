import { useState, useMemo, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'
import { Section } from '@/components/ui'

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('')
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v] }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ]
}

function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
  if (r === 0 && g === 0 && b === 0) return [0, 0, 0, 100]
  const c = 1 - r / 255, m = 1 - g / 255, y = 1 - b / 255
  const k = Math.min(c, m, y)
  return [
    Math.round(((c - k) / (1 - k)) * 100),
    Math.round(((m - k) / (1 - k)) * 100),
    Math.round(((y - k) / (1 - k)) * 100),
    Math.round(k * 100),
  ]
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function contrastColor(r: number, g: number, b: number): string {
  return luminance(r, g, b) > 0.179 ? '#000000' : '#ffffff'
}

export default function ColorConverter() {
  const [hex, setHex] = useState('#3b82f6')
  const [copied, setCopied] = useState('')

  const rgb = useMemo(() => hexToRgb(hex), [hex])
  const hsl = useMemo(() => rgb ? rgbToHsl(...rgb) : null, [rgb])
  const cmyk = useMemo(() => rgb ? rgbToCmyk(...rgb) : null, [rgb])

  const fromHex = useCallback((h: string) => {
    if (/^#[0-9a-f]{6}$/i.test(h)) setHex(h)
  }, [])

  const fromRgb = useCallback((r: number, g: number, b: number) => {
    setHex(rgbToHex(r, g, b))
  }, [])

  const fromHsl = useCallback((h: number, s: number, l: number) => {
    const [r, g, b] = hslToRgb(h, s, l)
    setHex(rgbToHex(r, g, b))
  }, [])

  const copyValue = (label: string, value: string) => {
    navigator.clipboard.writeText(value)
    setCopied(label)
    setTimeout(() => setCopied(''), 1500)
  }

  const ColorSwatch = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <div className="card p-3 flex items-center justify-between">
      <div>
        <p className="text-xs text-ink-500 dark:text-ink-400 mb-0.5">{label}</p>
        <p className="text-sm font-mono font-medium">{value}</p>
      </div>
      <div className="flex items-center gap-2">
        {color && <div className="w-8 h-8 rounded-lg border border-ink-200 dark:border-ink-700" style={{ background: color }} />}
        <button onClick={() => copyValue(label, value)} className="p-1.5 rounded-lg text-ink-400 hover:text-brand-500 transition">
          {copied === label ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Color Converter</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Convert between HEX, RGB, HSL, CMYK. Pick colors or enter values directly.
      </p>

      {/* Color picker */}
      <div className="flex items-center gap-4 mb-5">
        <input type="color" value={hex} onChange={e => setHex(e.target.value)}
          className="w-16 h-16 rounded-xl cursor-pointer border-2 border-ink-200 dark:border-ink-700" />
        <div className="flex-1">
          <label className="label">HEX</label>
          <input type="text" className="input w-full font-mono text-sm" value={hex}
            onChange={e => fromHex(e.target.value)} maxLength={7} />
        </div>
      </div>

      {/* Color preview */}
      <div className="rounded-xl h-20 mb-5 flex items-center justify-center text-lg font-bold"
        style={{ background: hex, color: rgb ? contrastColor(...rgb) : '#000' }}>
        {hex.toUpperCase()}
      </div>

      {/* RGB inputs */}
      {rgb && (
        <div className="mb-4">
          <label className="label">RGB</label>
          <div className="grid grid-cols-3 gap-2">
            {(['R', 'G', 'B'] as const).map((ch, i) => (
              <div key={ch}>
                <p className="text-xs text-ink-400 mb-1">{ch}</p>
                <input type="number" className="input w-full text-center font-mono" value={rgb[i]}
                  onChange={e => {
                    const v = [...rgb]; v[i] = parseInt(e.target.value) || 0; fromRgb(v[0], v[1], v[2])
                  }} min={0} max={255} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HSL inputs */}
      {hsl && (
        <div className="mb-4">
          <label className="label">HSL</label>
          <div className="grid grid-cols-3 gap-2">
            {(['H', 'S', 'L'] as const).map((ch, i) => (
              <div key={ch}>
                <p className="text-xs text-ink-400 mb-1">{ch} {i === 0 ? '°' : '%'}</p>
                <input type="number" className="input w-full text-center font-mono" value={hsl[i]}
                  onChange={e => {
                    const v = [...hsl]; v[i] = parseInt(e.target.value) || 0; fromHsl(v[0], v[1], v[2])
                  }} min={0} max={i === 0 ? 360 : 100} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All formats */}
      <div className="space-y-2">
        {rgb && (
          <>
            <ColorSwatch label="HEX" value={hex} color={hex} />
            <ColorSwatch label="RGB" value={`rgb(${rgb.join(', ')})`} />
            <ColorSwatch label="RGB %" value={`rgb(${rgb.map(x => Math.round(x / 255 * 100)).join('%, ')}%)`} />
            {hsl && <ColorSwatch label="HSL" value={`hsl(${hsl.join(', ')}%)`} />}
            {cmyk && <ColorSwatch label="CMYK" value={`cmyk(${cmyk.join('%, ')}%)`} />}
            <ColorSwatch label="CSS" value={`color: ${hex};`} />
          </>
        )}
      </div>
    </Section>
  )
}

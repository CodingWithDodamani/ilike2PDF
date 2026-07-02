import { useState, useMemo, useCallback } from 'react'
import { Copy, Check, Shuffle, Pipette, Trash2, Palette } from 'lucide-react'
import { Section, Segmented } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { trackUsage } from '@/lib/storage'

// ── Conversion helpers ──────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0'))
    .join('')
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

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  const s = max === 0 ? 0 : d / max
  const v = max
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)]
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  h /= 360; s /= 100; v /= 100
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  const mod = i % 6
  const rgb: [number, number, number] =
    mod === 0 ? [v, t, p] : mod === 1 ? [q, v, p] : mod === 2 ? [p, v, t] :
    mod === 3 ? [p, q, v] : mod === 4 ? [t, p, v] : [v, p, q]
  return rgb.map((x) => Math.round(x * 255)) as [number, number, number]
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
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function contrastColor(r: number, g: number, b: number): string {
  return luminance(r, g, b) > 0.179 ? '#000000' : '#ffffff'
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

// ── Color schemes ───────────────────────────────────────────────────

type Scheme = 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'split-complementary' | 'monochromatic'

function generateScheme(h: number, s: number, l: number, scheme: Scheme): string[] {
  const wrap = (hue: number) => ((hue % 360) + 360) % 360
  const toHex = (hue: number, sat: number, light: number) => {
    const [r, g, b] = hslToRgb(hue, sat, light)
    return rgbToHex(r, g, b)
  }
  switch (scheme) {
    case 'complementary':
      return [toHex(h, s, l), toHex(wrap(h + 180), s, l)]
    case 'analogous':
      return [toHex(wrap(h - 30), s, l), toHex(h, s, l), toHex(wrap(h + 30), s, l)]
    case 'triadic':
      return [toHex(h, s, l), toHex(wrap(h + 120), s, l), toHex(wrap(h + 240), s, l)]
    case 'tetradic':
      return [toHex(h, s, l), toHex(wrap(h + 90), s, l), toHex(wrap(h + 180), s, l), toHex(wrap(h + 270), s, l)]
    case 'split-complementary':
      return [toHex(h, s, l), toHex(wrap(h + 150), s, l), toHex(wrap(h + 210), s, l)]
    case 'monochromatic':
      return [
        toHex(h, s, clamp(l - 30, 5, 95)),
        toHex(h, s, clamp(l - 15, 5, 95)),
        toHex(h, s, l),
        toHex(h, s, clamp(l + 15, 5, 95)),
        toHex(h, s, clamp(l + 30, 5, 95)),
      ]
    default:
      return [toHex(h, s, l)]
  }
}

// ── Tailwind nearest color ──────────────────────────────────────────

const TAILWIND: Record<string, string> = {
  '#f8fafc': 'slate-50', '#f1f5f9': 'slate-100', '#e2e8f0': 'slate-200', '#cbd5e1': 'slate-300',
  '#94a3b8': 'slate-400', '#64748b': 'slate-500', '#475569': 'slate-600', '#334155': 'slate-700',
  '#1e293b': 'slate-800', '#0f172a': 'slate-900', '#020617': 'slate-950',
  '#fafafa': 'gray-50', '#f4f4f5': 'gray-100', '#e4e4e7': 'gray-200', '#d4d4d8': 'gray-300',
  '#a1a1aa': 'gray-400', '#71717a': 'gray-500', '#52525b': 'gray-600', '#3f3f46': 'gray-700',
  '#27272a': 'gray-800', '#18181b': 'gray-900', '#09090b': 'gray-950',
  '#f9fafb': 'white',
  '#ef4444': 'red-500', '#f87171': 'red-400', '#dc2626': 'red-600',
  '#f97316': 'orange-500', '#fb923c': 'orange-400', '#ea580c': 'orange-600',
  '#eab308': 'yellow-500', '#facc15': 'yellow-400', '#ca8a04': 'yellow-600',
  '#22c55e': 'green-500', '#4ade80': 'green-400', '#16a34a': 'green-600',
  '#14b8a6': 'teal-500', '#2dd4bf': 'teal-400', '#0d9488': 'teal-600',
  '#06b6d4': 'cyan-500', '#22d3ee': 'cyan-400', '#0891b2': 'cyan-600',
  '#3b82f6': 'blue-500', '#60a5fa': 'blue-400', '#2563eb': 'blue-600',
  '#6366f1': 'indigo-500', '#818cf8': 'indigo-400', '#4f46e5': 'indigo-600',
  '#8b5cf6': 'violet-500', '#a78bfa': 'violet-400', '#7c3aed': 'violet-600',
  '#a855f7': 'purple-500', '#c084fc': 'purple-400', '#9333ea': 'purple-600',
  '#ec4899': 'pink-500', '#f472b6': 'pink-400', '#db2777': 'pink-600',
  '#f43f5e': 'rose-500', '#fb7185': 'rose-400', '#e11d48': 'rose-600',
}

function findNearestTailwind(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return ''
  let best = '', bestDist = Infinity
  for (const [h, name] of Object.entries(TAILWIND)) {
    const t = hexToRgb(h)
    if (!t) continue
    const dist = Math.sqrt((rgb[0] - t[0]) ** 2 + (rgb[1] - t[1]) ** 2 + (rgb[2] - t[2]) ** 2)
    if (dist < bestDist) { bestDist = dist; best = name }
  }
  return best
}

// ── Component ───────────────────────────────────────────────────────

const HISTORY_KEY = 'snappdf.colorHistory'
const MAX_HISTORY = 20

function loadHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
function saveHistory(colors: string[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(colors)) } catch { /* ignore */ }
}

export default function ColorConverter() {
  const toast = useToast()
  const [hex, setHex] = useState('#3b82f6')
  const [copied, setCopied] = useState('')
  const [scheme, setScheme] = useState<Scheme>('complementary')
  const [history, setHistory] = useState<string[]>(loadHistory)
  const [inputTab, setInputTab] = useState<'hex' | 'rgb' | 'hsl' | 'hsv'>('hex')

  const rgb = useMemo(() => hexToRgb(hex), [hex])
  const hsl = useMemo(() => rgb ? rgbToHsl(...rgb) : null, [rgb])
  const hsv = useMemo(() => rgb ? rgbToHsv(...rgb) : null, [rgb])
  const cmyk = useMemo(() => rgb ? rgbToCmyk(...rgb) : null, [rgb])
  const tailwind = useMemo(() => findNearestTailwind(hex), [hex])

  const schemes = useMemo(() => {
    if (!hsl) return []
    return generateScheme(hsl[0], hsl[1], hsl[2], scheme)
  }, [hsl, scheme])

  const addToHistory = useCallback((color: string) => {
    setHistory((prev) => {
      const next = [color, ...prev.filter((c) => c !== color)].slice(0, MAX_HISTORY)
      saveHistory(next)
      return next
    })
  }, [])

  const setFromHex = useCallback((h: string) => {
    if (/^#[0-9a-f]{6}$/i.test(h)) {
      setHex(h)
      addToHistory(h)
    }
  }, [addToHistory])

  const setFromRgb = useCallback((r: number, g: number, b: number) => {
    const h = rgbToHex(r, g, b)
    setHex(h)
    addToHistory(h)
  }, [addToHistory])

  const setFromHsl = useCallback((h: number, s: number, l: number) => {
    const [r, g, b] = hslToRgb(h, s, l)
    const hex = rgbToHex(r, g, b)
    setHex(hex)
    addToHistory(hex)
  }, [addToHistory])

  const setFromHsv = useCallback((h: number, s: number, v: number) => {
    const [r, g, b] = hsvToRgb(h, s, v)
    const hex = rgbToHex(r, g, b)
    setHex(hex)
    addToHistory(hex)
  }, [addToHistory])

  const copyValue = (label: string, value: string) => {
    navigator.clipboard.writeText(value)
    setCopied(label)
    toast.success(`${label} copied!`)
    setTimeout(() => setCopied(''), 1500)
  }

  const copyAll = () => {
    if (!rgb || !hsl || !cmyk) return
    const lines = [
      `HEX: ${hex}`,
      `RGB: rgb(${rgb.join(', ')})`,
      `HSL: hsl(${hsl.join(', ')}%)`,
      `HSV: hsv(${hsv?.join(', ') || ''}%)`,
      `CMYK: cmyk(${cmyk.join('%, ')}%)`,
      `CSS: color: ${hex};`,
      tailwind ? `Tailwind: ${tailwind}` : '',
    ].filter(Boolean).join('\n')
    navigator.clipboard.writeText(lines)
    toast.success('All formats copied!')
  }

  const randomColor = () => {
    const h = Math.floor(Math.random() * 360)
    const s = Math.floor(Math.random() * 40) + 60
    const l = Math.floor(Math.random() * 40) + 30
    const [r, g, b] = hslToRgb(h, s, l)
    const newHex = rgbToHex(r, g, b)
    setHex(newHex)
    addToHistory(newHex)
    trackUsage({ toolId: 'color-converter', toolName: 'Color Converter', action: 'Random color' })
  }

  const pickFromScreen = async () => {
    if (!('EyeDropper' in window)) {
      toast.error('EyeDropper API not supported in this browser')
      return
    }
    try {
      const eyeDropper = new (window as any).EyeDropper()
      const result = await eyeDropper.open()
      setHex(result.sRGBHex)
      addToHistory(result.sRGBHex)
      trackUsage({ toolId: 'color-converter', toolName: 'Color Converter', action: 'Eye dropper' })
    } catch { /* cancelled */ }
  }

  // ── Slider component ────────────────────────────────────────────

  const ColorSlider = ({
    label, value, max, color, gradient, onChange,
  }: {
    label: string; value: number; max: number; color: string; gradient?: string; onChange: (v: number) => void
  }) => (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-ink-500 dark:text-ink-400 w-5 text-right">{label}</span>
      <div className="flex-1 relative">
        <div
          className="h-3 rounded-full w-full"
          style={{ background: gradient || color }}
        />
        <input
          type="range" min={0} max={max} value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
          aria-label={`${label} slider`}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none"
          style={{ left: `calc(${(value / max) * 100}% - 8px)`, background: color }}
        />
      </div>
      <span className="text-xs font-mono text-ink-600 dark:text-ink-300 w-10 text-right">{value}</span>
    </div>
  )

  // ── Format row ──────────────────────────────────────────────────

  const FormatRow = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-ink-50 dark:bg-ink-850 hover:bg-ink-100 dark:hover:bg-ink-800 transition group">
      <div className="flex items-center gap-2 min-w-0">
        {color && <div className="w-6 h-6 rounded-md border border-ink-200 dark:border-ink-700 shrink-0" style={{ background: color }} />}
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-ink-400 dark:text-ink-500">{label}</p>
          <p className="text-xs font-mono font-medium truncate">{value}</p>
        </div>
      </div>
      <button
        onClick={() => copyValue(label, value)}
        className="shrink-0 p-1.5 rounded-lg text-ink-400 hover:text-brand-500 hover:bg-brand-500/10 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        {copied === label ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  )

  return (
    <Section>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold mb-0.5">Color Converter</h2>
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Convert between HEX, RGB, HSL, HSV, CMYK with schemes & sliders.
          </p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={randomColor} className="btn-ghost btn-sm gap-1.5" title="Random color">
            <Shuffle className="h-4 w-4" /> Random
          </button>
          <button onClick={pickFromScreen} className="btn-ghost btn-sm gap-1.5" title="Pick from screen">
            <Pipette className="h-4 w-4" /> Pick
          </button>
        </div>
      </div>

      {/* Color picker + HEX input */}
      <div className="flex items-center gap-4 mb-4">
        <input
          type="color" value={hex} onChange={(e) => setFromHex(e.target.value)}
          className="w-16 h-16 rounded-xl cursor-pointer border-2 border-ink-200 dark:border-ink-700 shrink-0"
        />
        <div className="flex-1">
          <label className="label">HEX</label>
          <input
            type="text" className="input w-full font-mono text-sm" value={hex}
            onChange={(e) => setFromHex(e.target.value)} maxLength={7}
          />
        </div>
      </div>

      {/* Live preview */}
      <div
        className="rounded-xl h-16 mb-4 flex items-center justify-center text-lg font-bold border border-ink-200 dark:border-ink-700"
        style={{ background: hex, color: rgb ? contrastColor(...rgb) : '#000' }}
      >
        {hex.toUpperCase()}
      </div>

      {/* Sliders */}
      {rgb && hsl && hsv && (
        <div className="card p-4 mb-4 space-y-3">
          <p className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider mb-2">Sliders</p>
          <ColorSlider
            label="H" value={hsl[0]} max={360}
            gradient="linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)"
            color={hex} onChange={(h) => setFromHsl(h, hsl[1], hsl[2])}
          />
          <ColorSlider
            label="S" value={hsl[1]} max={100}
            gradient={`linear-gradient(to right, ${rgbToHex(...hslToRgb(hsl[0], 0, hsl[2]))}, ${rgbToHex(...hslToRgb(hsl[0], 100, hsl[2]))})`}
            color={hex} onChange={(s) => setFromHsl(hsl[0], s, hsl[2])}
          />
          <ColorSlider
            label="L" value={hsl[2]} max={100}
            gradient={`linear-gradient(to right, #000000, ${rgbToHex(...hslToRgb(hsl[0], hsl[1], 50))}, #ffffff)`}
            color={hex} onChange={(l) => setFromHsl(hsl[0], hsl[1], l)}
          />
        </div>
      )}

      {/* Input tabs */}
      <div className="mb-4">
        <Segmented
          value={inputTab} onChange={setInputTab}
          options={[
            { value: 'hex', label: 'HEX' },
            { value: 'rgb', label: 'RGB' },
            { value: 'hsl', label: 'HSL' },
            { value: 'hsv', label: 'HSV' },
          ]}
          ariaLabel="Color format input"
        />
      </div>

      {/* RGB inputs */}
      {rgb && inputTab === 'rgb' && (
        <div className="card p-4 mb-4">
          <div className="grid grid-cols-3 gap-3">
            {(['R', 'G', 'B'] as const).map((ch, i) => (
              <div key={ch}>
                <label className="label">{ch}</label>
                <input
                  type="number" className="input w-full text-center font-mono" value={rgb[i]}
                  onChange={(e) => {
                    const v = [...rgb]; v[i] = clamp(parseInt(e.target.value) || 0, 0, 255); setFromRgb(v[0], v[1], v[2])
                  }}
                  min={0} max={255}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HSL inputs */}
      {hsl && inputTab === 'hsl' && (
        <div className="card p-4 mb-4">
          <div className="grid grid-cols-3 gap-3">
            {(['H', 'S', 'L'] as const).map((ch, i) => (
              <div key={ch}>
                <label className="label">{ch} {i === 0 ? '°' : '%'}</label>
                <input
                  type="number" className="input w-full text-center font-mono" value={hsl[i]}
                  onChange={(e) => {
                    const v = [...hsl]; v[i] = clamp(parseInt(e.target.value) || 0, 0, i === 0 ? 360 : 100)
                    setFromHsl(v[0], v[1], v[2])
                  }}
                  min={0} max={i === 0 ? 360 : 100}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HSV inputs */}
      {hsv && inputTab === 'hsv' && (
        <div className="card p-4 mb-4">
          <div className="grid grid-cols-3 gap-3">
            {(['H', 'S', 'V'] as const).map((ch, i) => (
              <div key={ch}>
                <label className="label">{ch} {i === 0 ? '°' : '%'}</label>
                <input
                  type="number" className="input w-full text-center font-mono" value={hsv[i]}
                  onChange={(e) => {
                    const v = [...hsv]; v[i] = clamp(parseInt(e.target.value) || 0, 0, i === 0 ? 360 : 100)
                    setFromHsv(v[0], v[1], v[2])
                  }}
                  min={0} max={i === 0 ? 360 : 100}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All formats */}
      {rgb && hsl && hsv && cmyk && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider">All Formats</p>
            <button onClick={copyAll} className="btn-ghost btn-sm text-xs gap-1">
              <Copy className="h-3 w-3" /> Copy All
            </button>
          </div>
          <div className="space-y-1">
            <FormatRow label="HEX" value={hex} color={hex} />
            <FormatRow label="RGB" value={`rgb(${rgb.join(', ')})`} />
            <FormatRow label="RGB %" value={`rgb(${rgb.map((x) => Math.round((x / 255) * 100)).join('%, ')}%)`} />
            <FormatRow label="HSL" value={`hsl(${hsl.join(', ')}%)`} />
            <FormatRow label="HSV" value={`hsv(${hsv.join(', ')}%)`} />
            <FormatRow label="CMYK" value={`cmyk(${cmyk.join('%, ')}%)`} />
            <FormatRow label="CSS" value={`color: ${hex};`} />
            {tailwind && <FormatRow label="Tailwind" value={tailwind} />}
          </div>
        </div>
      )}

      {/* Color schemes */}
      {hsl && (
        <div className="card p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-4 w-4 text-brand-500" />
            <p className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider">Color Schemes</p>
          </div>
          <Segmented
            value={scheme} onChange={setScheme}
            options={[
              { value: 'complementary', label: 'Comp' },
              { value: 'analogous', label: 'Analog' },
              { value: 'triadic', label: 'Triad' },
              { value: 'tetradic', label: 'Tetra' },
              { value: 'split-complementary', label: 'Split' },
              { value: 'monochromatic', label: 'Mono' },
            ]}
            ariaLabel="Color scheme"
          />
          <div className="flex gap-2 mt-3 flex-wrap">
            {schemes.map((c, i) => (
              <button
                key={i} onClick={() => setFromHex(c)}
                className="w-12 h-12 rounded-xl border border-ink-200 dark:border-ink-700 hover:scale-110 transition-transform shadow-sm"
                style={{ background: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}

      {/* Color history */}
      {history.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider">Recent Colors</p>
            <button
              onClick={() => { setHistory([]); saveHistory([]) }}
              className="text-ink-400 hover:text-rose-500 transition"
              title="Clear history"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {history.map((c, i) => (
              <button
                key={i} onClick={() => setFromHex(c)}
                className="w-8 h-8 rounded-lg border border-ink-200 dark:border-ink-700 hover:scale-110 transition-transform"
                style={{ background: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}

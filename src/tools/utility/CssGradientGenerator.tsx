import { useState, useMemo } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

interface GradientStop {
  color: string
  position: number
}

type GradientType = 'linear' | 'radial' | 'conic'

const PRESETS: { name: string; gradient: string }[] = [
  { name: 'Sunset', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Ocean', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: 'Forest', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { name: 'Purple', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Peach', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { name: 'Midnight', gradient: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
  { name: 'Fire', gradient: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
  { name: 'Ice', gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' },
]

export default function CssGradientGenerator() {
  const [type, setType] = useState<GradientType>('linear')
  const [angle, setAngle] = useState(135)
  const [stops, setStops] = useState<GradientStop[]>([
    { color: '#667eea', position: 0 },
    { color: '#764ba2', position: 100 },
  ])
  const [copied, setCopied] = useState(false)

  const gradient = useMemo(() => {
    const sorted = [...stops].sort((a, b) => a.position - b.position)
    const stopsStr = sorted.map(s => `${s.color} ${s.position}%`).join(', ')
    switch (type) {
      case 'linear': return `linear-gradient(${angle}deg, ${stopsStr})`
      case 'radial': return `radial-gradient(circle, ${stopsStr})`
      case 'conic': return `conic-gradient(from ${angle}deg, ${stopsStr})`
    }
  }, [type, angle, stops])

  const cssCode = useMemo(() => {
    return `background: ${gradient};`
  }, [gradient])

  const addStop = () => {
    setStops(prev => [...prev, { color: '#000000', position: 50 }])
  }

  const removeStop = (idx: number) => {
    if (stops.length <= 2) return
    setStops(prev => prev.filter((_, i) => i !== idx))
  }

  const updateStop = (idx: number, field: keyof GradientStop, value: string | number) => {
    setStops(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  const copy = () => {
    navigator.clipboard.writeText(cssCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const randomize = () => {
    const rand = () => Math.floor(Math.random() * 256)
    setStops([
      { color: `#${rand().toString(16).padStart(2, '0')}${rand().toString(16).padStart(2, '0')}${rand().toString(16).padStart(2, '0')}`, position: 0 },
      { color: `#${rand().toString(16).padStart(2, '0')}${rand().toString(16).padStart(2, '0')}${rand().toString(16).padStart(2, '0')}`, position: 100 },
    ])
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">CSS Gradient Generator</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Create beautiful CSS gradients with live preview. Linear, radial, and conic.
      </p>

      {/* Preview */}
      <div className="rounded-xl h-32 mb-4 shadow-inner" style={{ background: gradient }} />

      {/* Type */}
      <div className="flex rounded-xl bg-ink-100 dark:bg-ink-850 p-1 mb-4">
        {(['linear', 'radial', 'conic'] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={cn('flex-1 px-3 py-2 rounded-lg text-sm font-medium transition capitalize',
              type === t ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-300 shadow' : 'text-ink-600 dark:text-ink-300')}>
            {t}
          </button>
        ))}
      </div>

      {/* Angle */}
      {(type === 'linear' || type === 'conic') && (
        <div className="mb-4">
          <label className="label">Angle: {angle}°</label>
          <input type="range" min={0} max={360} value={angle}
            onChange={e => setAngle(parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-ink-200 dark:bg-ink-800 accent-brand-500" />
        </div>
      )}

      {/* Color stops */}
      <div className="space-y-2 mb-4">
        {stops.map((stop, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="color" value={stop.color}
              onChange={e => updateStop(i, 'color', e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border-2 border-ink-200 dark:border-ink-700" />
            <input type="text" className="input flex-1 text-sm font-mono" value={stop.color}
              onChange={e => updateStop(i, 'color', e.target.value)} />
            <input type="number" className="input w-20 text-center text-sm" value={stop.position}
              onChange={e => updateStop(i, 'position', parseInt(e.target.value) || 0)} min={0} max={100} />
            <span className="text-xs text-ink-400">%</span>
            <button onClick={() => removeStop(i)} disabled={stops.length <= 2}
              className="text-ink-400 hover:text-red-500 text-xs disabled:opacity-40">✕</button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <button onClick={addStop} className="btn-ghost px-3 py-2 text-sm rounded-lg">+ Add Stop</button>
        <button onClick={randomize} className="btn-ghost px-3 py-2 text-sm rounded-lg flex items-center gap-1">
          <RefreshCw className="w-4 h-4" /> Random
        </button>
        <button onClick={copy} className="btn-ghost px-3 py-2 text-sm rounded-lg flex items-center gap-1 ml-auto">
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          Copy CSS
        </button>
      </div>

      {/* Presets */}
      <div className="mb-4">
        <p className="label mb-2">Presets</p>
        <div className="grid grid-cols-4 gap-1.5">
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => {
              setStops([{ color: '#000', position: 0 }, { color: '#000', position: 100 }])
              const match = p.gradient.match(/#[a-f0-9]{6}/gi) || []
              if (match.length >= 2) setStops([{ color: match[0]!, position: 0 }, { color: match[1]!, position: 100 }])
            }}
              className="h-10 rounded-lg text-xs text-white font-medium hover:opacity-80 transition"
              style={{ background: p.gradient }} title={p.name} />
          ))}
        </div>
      </div>

      {/* Code output */}
      <div className="card p-3 font-mono text-sm break-all">
        <p className="text-ink-700 dark:text-ink-200">{cssCode}</p>
      </div>
    </Section>
  )
}

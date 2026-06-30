import { useState, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import { Section } from '@/components/ui'

interface Shadow {
  x: number
  y: number
  blur: number
  spread: number
  color: string
  inset: boolean
}

const PRESETS: { name: string; shadows: Shadow[] }[] = [
  { name: 'Soft', shadows: [{ x: 0, y: 4, blur: 15, spread: 0, color: '#00000033', inset: false }] },
  { name: 'Hard', shadows: [{ x: 4, y: 4, blur: 0, spread: 0, color: '#00000055', inset: false }] },
  { name: 'Glow', shadows: [{ x: 0, y: 0, blur: 20, spread: 0, color: '#667eea88', inset: false }] },
  { name: 'Inset', shadows: [{ x: 0, y: 2, blur: 8, spread: 0, color: '#00000033', inset: true }] },
  { name: 'Double', shadows: [
    { x: 0, y: 2, blur: 4, spread: 0, color: '#00000022', inset: false },
    { x: 0, y: 8, blur: 24, spread: 0, color: '#00000018', inset: false },
  ]},
]

export default function BoxShadowGenerator() {
  const [shadows, setShadows] = useState<Shadow[]>([
    { x: 0, y: 4, blur: 15, spread: 0, color: '#00000033', inset: false },
  ])
  const [bgColor, setBgColor] = useState('#ffffff')
  const [boxColor, setBoxColor] = useState('#ffffff')
  const [boxRadius, setBoxRadius] = useState(16)
  const [boxWidth, setBoxWidth] = useState(200)
  const [boxHeight, setBoxHeight] = useState(200)
  const [copied, setCopied] = useState('')

  const cssCode = useMemo(() => {
    const value = shadows.map(s =>
      `${s.inset ? 'inset ' : ''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`
    ).join(', ')
    return `box-shadow: ${value};`
  }, [shadows])

  const previewStyle = useMemo(() => ({
    background: boxColor,
    borderRadius: boxRadius,
    width: boxWidth,
    height: boxHeight,
    boxShadow: shadows.map(s =>
      `${s.inset ? 'inset ' : ''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`
    ).join(', '),
  }), [shadows, boxColor, boxRadius, boxWidth, boxHeight])

  const addShadow = () => {
    setShadows(prev => [...prev, { x: 0, y: 4, blur: 15, spread: 0, color: '#00000033', inset: false }])
  }

  const removeShadow = (idx: number) => {
    setShadows(prev => prev.filter((_, i) => i !== idx))
  }

  const update = (idx: number, field: keyof Shadow, value: any) => {
    setShadows(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 1500)
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Box Shadow Generator</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Create CSS box shadows with live preview. Multiple shadows, inset mode.
      </p>

      {/* Preview */}
      <div className="rounded-xl p-8 flex items-center justify-center mb-4" style={{ background: bgColor }}>
        <div style={previewStyle} />
      </div>

      {/* Box settings */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div>
          <label className="label">Box Color</label>
          <input type="color" value={boxColor} onChange={e => setBoxColor(e.target.value)}
            className="w-full h-8 rounded-lg cursor-pointer" />
        </div>
        <div>
          <label className="label">BG Color</label>
          <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
            className="w-full h-8 rounded-lg cursor-pointer" />
        </div>
        <div>
          <label className="label">Radius</label>
          <input type="number" className="input w-full text-sm" value={boxRadius}
            onChange={e => setBoxRadius(parseInt(e.target.value) || 0)} min={0} />
        </div>
        <div>
          <label className="label">Size</label>
          <input type="number" className="input w-full text-sm" value={boxWidth}
            onChange={e => { setBoxWidth(parseInt(e.target.value) || 100); setBoxHeight(parseInt(e.target.value) || 100) }} min={20} />
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {PRESETS.map(p => (
          <button key={p.name} onClick={() => setShadows(p.shadows)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700 transition">
            {p.name}
          </button>
        ))}
      </div>

      {/* Shadow controls */}
      <div className="space-y-3 mb-4">
        {shadows.map((s, i) => (
          <div key={i} className="card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-ink-500">Shadow {i + 1}</span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={s.inset} onChange={e => update(i, 'inset', e.target.checked)}
                    className="w-3 h-3 rounded border-ink-300 text-brand-500 focus:ring-brand-500" />
                  <span className="text-xs">Inset</span>
                </label>
                {shadows.length > 1 && (
                  <button onClick={() => removeShadow(i)} className="text-ink-400 hover:text-red-500 text-xs">✕</button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {(['x', 'y', 'blur', 'spread'] as const).map(prop => (
                <div key={prop}>
                  <p className="text-[10px] text-ink-400 uppercase mb-0.5">{prop}</p>
                  <input type="number" className="input w-full text-xs text-center" value={s[prop]}
                    onChange={e => update(i, prop, parseInt(e.target.value) || 0)} />
                </div>
              ))}
              <div>
                <p className="text-[10px] text-ink-400 uppercase mb-0.5">Color</p>
                <input type="color" value={s.color.slice(0, 7)}
                  onChange={e => update(i, 'color', e.target.value + (s.color.length > 7 ? s.color.slice(7) : ''))}
                  className="w-full h-8 rounded cursor-pointer" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addShadow} className="btn-ghost px-3 py-2 text-sm rounded-lg mb-4">+ Add Shadow</button>

      {/* Code */}
      <div className="card p-3 flex items-center justify-between">
        <code className="font-mono text-sm break-all">{cssCode}</code>
        <button onClick={() => copy(cssCode, 'css')} className="p-2 rounded-lg text-ink-400 hover:text-brand-500 transition shrink-0 ml-2">
          {copied === 'css' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </Section>
  )
}

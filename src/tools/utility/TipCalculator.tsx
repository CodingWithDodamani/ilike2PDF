import { useState, useMemo } from 'react'
import { Users } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

const TIP_PRESETS = [10, 15, 18, 20, 25]

export default function TipCalculator() {
  const [bill, setBill] = useState('')
  const [tipPct, setTipPct] = useState(20)
  const [customTip, setCustomTip] = useState('')
  const [split, setSplit] = useState(1)
  const [useCustom, setUseCustom] = useState(false)

  const billAmount = parseFloat(bill) || 0
  const tipPercent = useCustom ? (parseFloat(customTip) || 0) : tipPct

  const result = useMemo(() => {
    const tip = billAmount * (tipPercent / 100)
    const total = billAmount + tip
    const perPerson = split > 0 ? total / split : total
    const tipPerPerson = split > 0 ? tip / split : tip
    return { tip, total, perPerson, tipPerPerson }
  }, [billAmount, tipPercent, split])

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Tip Calculator</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Calculate tip and split the bill between friends.
      </p>

      {/* Bill amount */}
      <div className="mb-5">
        <label className="label">Bill Amount</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 font-bold text-lg">$</span>
          <input type="number" className="input w-full pl-8 text-lg font-mono" value={bill}
            onChange={e => setBill(e.target.value)} placeholder="0.00" min="0" step="0.01" />
        </div>
      </div>

      {/* Tip percentage */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Tip %</label>
          <span className="text-lg font-bold gradient-text">{tipPercent}%</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {TIP_PRESETS.map(t => (
            <button key={t} onClick={() => { setTipPct(t); setUseCustom(false) }}
              className={cn('px-4 py-2 rounded-lg text-sm font-bold transition',
                !useCustom && tipPct === t ? 'bg-brand-500 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700')}>
              {t}%
            </button>
          ))}
          <div className="relative">
            <input type="number" className="input w-20 text-center text-sm font-mono" value={customTip}
              onChange={e => { setCustomTip(e.target.value); setUseCustom(true) }}
              placeholder="Custom" min="0" max="100" />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 text-xs">%</span>
          </div>
        </div>
      </div>

      {/* Split */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Split Between</label>
          <span className="flex items-center gap-1 text-sm text-ink-500">
            <Users className="w-4 h-4" /> {split} {split === 1 ? 'person' : 'people'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setSplit(Math.max(1, split - 1))}
            className="w-10 h-10 rounded-xl bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 font-bold text-lg hover:bg-ink-200 dark:hover:bg-ink-700 transition">
            −
          </button>
          <input type="range" min={1} max={30} value={split} onChange={e => setSplit(parseInt(e.target.value))}
            className="flex-1 h-2 rounded-full appearance-none bg-ink-200 dark:bg-ink-800 accent-brand-500" />
          <button onClick={() => setSplit(Math.min(30, split + 1))}
            className="w-10 h-10 rounded-xl bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 font-bold text-lg hover:bg-ink-200 dark:hover:bg-ink-700 transition">
            +
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-2">
        <div className="card p-4">
          <div className="flex justify-between">
            <span className="text-ink-500 dark:text-ink-400">Tip ({tipPercent}%)</span>
            <span className="text-xl font-bold font-mono">${result.tip.toFixed(2)}</span>
          </div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-brand-500/5 to-accent-400/5">
          <div className="flex justify-between">
            <span className="text-ink-500 dark:text-ink-400">Total</span>
            <span className="text-2xl font-bold gradient-text font-mono">${result.total.toFixed(2)}</span>
          </div>
        </div>
        {split > 1 && (
          <>
            <div className="card p-4">
              <div className="flex justify-between">
                <span className="text-ink-500 dark:text-ink-400">Per Person (tip)</span>
                <span className="text-lg font-bold font-mono">${result.tipPerPerson.toFixed(2)}</span>
              </div>
            </div>
            <div className="card p-4 bg-gradient-to-br from-emerald-500/5 to-emerald-400/5">
              <div className="flex justify-between">
                <span className="text-ink-500 dark:text-ink-400">Per Person (total)</span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">${result.perPerson.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick bill amounts */}
      <div className="mt-4">
        <p className="label mb-2">Quick Bill</p>
        <div className="flex flex-wrap gap-1.5">
          {[10, 20, 30, 50, 75, 100, 150, 200].map(v => (
            <button key={v} onClick={() => setBill(String(v))}
              className="px-3 py-1 rounded-lg text-xs font-mono bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700 transition">
              ${v}
            </button>
          ))}
        </div>
      </div>
    </Section>
  )
}

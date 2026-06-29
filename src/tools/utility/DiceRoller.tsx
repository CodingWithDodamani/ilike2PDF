import { useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

const DICE_FACES: Record<number, string> = {
  1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅',
}

const PRESETS = [
  { label: '1d6', dice: 1, sides: 6 },
  { label: '2d6', dice: 2, sides: 6 },
  { label: '1d20', dice: 1, sides: 20 },
  { label: '4d6', dice: 4, sides: 6 },
  { label: '1d100', dice: 1, sides: 100 },
  { label: '3d8', dice: 3, sides: 8 },
]

export default function DiceRoller() {
  const [diceCount, setDiceCount] = useState(2)
  const [sides, setSides] = useState(6)
  const [modifier, setModifier] = useState(0)
  const [results, setResults] = useState<number[]>([])
  const [history, setHistory] = useState<{ rolls: number[]; modifier: number; total: number; sides: number }[]>([])

  const roll = useCallback(() => {
    const rolls = Array.from({ length: diceCount }, () => Math.floor(Math.random() * sides) + 1)
    const total = rolls.reduce((a, b) => a + b, 0) + modifier
    setResults(rolls)
    setHistory(prev => [{ rolls, modifier, total, sides }, ...prev].slice(0, 30))
  }, [diceCount, sides, modifier])

  const applyPreset = (p: typeof PRESETS[0]) => {
    setDiceCount(p.dice)
    setSides(p.sides)
    setModifier(0)
  }

  const total = results.length > 0 ? results.reduce((a, b) => a + b, 0) + modifier : 0

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Dice Roller</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Roll virtual dice with custom counts, sides, and modifiers. Track roll history.
      </p>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => applyPreset(p)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700 transition">
            {p.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="label">Dice</label>
          <input type="number" className="input w-full text-center" value={diceCount}
            onChange={e => setDiceCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))} min={1} max={20} />
        </div>
        <div>
          <label className="label">Sides</label>
          <input type="number" className="input w-full text-center" value={sides}
            onChange={e => setSides(Math.max(2, Math.min(100, parseInt(e.target.value) || 2)))} min={2} max={100} />
        </div>
        <div>
          <label className="label">Modifier</label>
          <input type="number" className="input w-full text-center" value={modifier}
            onChange={e => setModifier(parseInt(e.target.value) || 0)} />
        </div>
      </div>

      {/* Roll button */}
      <button onClick={roll} className="btn-primary w-full py-3 text-lg rounded-xl flex items-center justify-center gap-2 mb-5">
        <RefreshCw className="w-5 h-5" />
        Roll {diceCount}d{sides}{modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''}
      </button>

      {/* Results */}
      {results.length > 0 && (
        <div className="text-center mb-5">
          <div className="flex justify-center gap-3 mb-3 flex-wrap">
            {results.map((r, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl mb-1">{DICE_FACES[r] || (r <= 6 ? DICE_FACES[r as keyof typeof DICE_FACES] : '🎲')}</div>
                <p className="text-lg font-bold font-mono">{r}</p>
              </div>
            ))}
          </div>
          <div className="card p-4 inline-block">
            <p className="text-xs text-ink-400 dark:text-ink-500 mb-1">Total</p>
            <p className="text-4xl font-bold gradient-text">{total}</p>
            {modifier !== 0 && (
              <p className="text-xs text-ink-400 dark:text-ink-500 mt-1">
                {results.join(' + ')} {modifier > 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <p className="label mb-2">History ({history.length})</p>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-mono bg-ink-50 dark:bg-ink-900 rounded-lg px-3 py-2">
                <span className="text-ink-500 dark:text-ink-400">
                  {h.rolls.length}d{h.sides}{h.modifier !== 0 ? (h.modifier > 0 ? `+${h.modifier}` : h.modifier) : ''}
                </span>
                <span className="text-ink-400 dark:text-ink-500">
                  [{h.rolls.join(', ')}]
                </span>
                <span className="font-bold gradient-text">{h.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}

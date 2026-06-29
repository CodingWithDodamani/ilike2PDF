import { useState, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

const ROMAN_MAP: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
]

function toRoman(num: number): string {
  if (num <= 0 || num > 3999) return ''
  let result = ''
  for (const [value, symbol] of ROMAN_MAP) {
    while (num >= value) { result += symbol; num -= value }
  }
  return result
}

function fromRoman(str: string): number {
  const roman: Record<string, number> = { M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1 }
  let result = 0
  const s = str.toUpperCase()
  for (let i = 0; i < s.length; i++) {
    const curr = roman[s[i]] || 0
    const next = roman[s[i + 1]] || 0
    if (curr < next) { result -= curr } else { result += curr }
  }
  return result
}

export default function RomanNumeral() {
  const [input, setInput] = useState('2024')
  const [mode, setMode] = useState<'to' | 'from'>('to')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    if (mode === 'to') {
      const n = parseInt(input)
      if (isNaN(n) || n <= 0) return null
      return { value: n, roman: toRoman(n), valid: n <= 3999 }
    } else {
      const roman = input.toUpperCase().replace(/[^IVXLCDM]/g, '')
      if (!roman) return null
      const value = fromRoman(roman)
      return { value, roman, valid: value > 0 && value <= 3999 }
    }
  }, [input, mode])

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // Table of Roman numerals
  const table = useMemo(() => {
    const entries: { decimal: number; roman: string }[] = []
    for (let i = 1; i <= 100; i++) {
      entries.push({ decimal: i, roman: toRoman(i) })
    }
    return entries
  }, [])

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Roman Numeral Converter</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Convert between decimal numbers and Roman numerals. Supports 1–3999.
      </p>

      {/* Mode */}
      <div className="flex rounded-xl bg-ink-100 dark:bg-ink-850 p-1 mb-4">
        <button onClick={() => setMode('to')}
          className={cn('flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition',
            mode === 'to' ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-300 shadow' : 'text-ink-600 dark:text-ink-300')}>
          Number → Roman
        </button>
        <button onClick={() => setMode('from')}
          className={cn('flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition',
            mode === 'from' ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-300 shadow' : 'text-ink-600 dark:text-ink-300')}>
          Roman → Number
        </button>
      </div>

      {/* Input */}
      <div className="mb-4">
        <label className="label">{mode === 'to' ? 'Decimal Number' : 'Roman Numeral'}</label>
        <input type="text" className="input w-full text-lg font-mono" value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={mode === 'to' ? '2024' : 'MMXXIV'} />
      </div>

      {/* Result */}
      {result && (
        <div className={cn(
          'card p-5 text-center',
          result.valid ? 'bg-gradient-to-br from-brand-500/5 to-accent-400/5' : 'bg-red-500/5'
        )}>
          {result.valid ? (
            <>
              <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">
                {mode === 'to' ? 'Roman Numeral' : 'Decimal Number'}
              </p>
              <p className="text-4xl font-bold gradient-text font-mono">{result.roman || result.value}</p>
              <button onClick={() => copy(mode === 'to' ? result.roman : String(result.value))}
                className="mt-2 btn-ghost px-3 py-1 text-sm rounded-lg flex items-center gap-1.5 mx-auto">
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                Copy
              </button>
            </>
          ) : (
            <p className="text-red-500 text-sm">
              {mode === 'to' ? 'Number must be between 1 and 3999' : 'Invalid Roman numeral'}
            </p>
          )}
        </div>
      )}

      {/* Reference table */}
      <div className="mt-5">
        <p className="label mb-2">Reference (1-100)</p>
        <div className="grid grid-cols-4 gap-1 max-h-60 overflow-y-auto">
          {table.map(e => (
            <div key={e.decimal} className="text-xs font-mono text-center py-1 px-2 bg-ink-50 dark:bg-ink-900 rounded">
              <span className="text-ink-400">{e.decimal}</span>
              <span className="mx-1">=</span>
              <span className="font-bold">{e.roman}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

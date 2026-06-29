import { useState, useMemo } from 'react'
import { Copy, Check, ArrowRightLeft } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

const BASES = [
  { name: 'Binary', base: 2, prefix: '0b', placeholder: '10101010' },
  { name: 'Octal', base: 8, prefix: '0o', placeholder: '252' },
  { name: 'Decimal', base: 10, prefix: '', placeholder: '170' },
  { name: 'Hexadecimal', base: 16, prefix: '0x', placeholder: 'AA' },
  { name: 'Base32', base: 32, prefix: '', placeholder: '5O' },
  { name: 'Base64', base: 64, prefix: '', placeholder: 'qg==' },
]

function toBase(value: string, fromBase: number, toBase: number): string | null {
  try {
    // Handle negative
    const negative = value.trim().startsWith('-')
    const abs = negative ? value.trim().slice(1) : value.trim()

    // For bases up to 36, use parseInt with radix
    if (fromBase <= 36) {
      const num = parseInt(abs, fromBase)
      if (isNaN(num)) return null
      if (toBase <= 36) {
        const result = num.toString(toBase).toUpperCase()
        return negative ? '-' + result : result
      }
    }

    // For base64, use atob/btoa
    if (fromBase === 64) {
      const decoded = atob(abs)
      const num = parseInt(decoded, 2)
      if (isNaN(num)) return null
      return num.toString(toBase).toUpperCase()
    }
    if (toBase === 64) {
      const num = parseInt(abs, fromBase)
      if (isNaN(num)) return null
      return btoa(num.toString(2))
    }

    // Fallback: convert through BigInt for large numbers
    const num = BigInt(abs)
    if (toBase <= 36) {
      const result = num.toString(toBase).toUpperCase()
      return negative ? '-' + result : result
    }

    return null
  } catch {
    return null
  }
}

function getDecimalValue(value: string, base: number): string | null {
  try {
    if (base <= 36) {
      const num = parseInt(value, base)
      if (isNaN(num)) return null
      return String(num)
    }
    return null
  } catch {
    return null
  }
}

function formatBits(value: string, base: number): string | null {
  try {
    if (base <= 36) {
      const num = parseInt(value, base)
      if (isNaN(num)) return null
      const bits = num.toString(2)
      // Group by 4 bits
      return bits.replace(/(.{4})/g, '$1 ').trim()
    }
    return null
  } catch {
    return null
  }
}

function getBytes(value: string, base: number): string | null {
  try {
    if (base <= 36) {
      const num = parseInt(value, base)
      if (isNaN(num)) return null
      if (num === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.min(Math.floor(Math.log(num) / Math.log(k)), sizes.length - 1)
      return `${(num / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
    }
    return null
  } catch {
    return null
  }
}

export default function BaseConverter() {
  const [input, setInput] = useState('42')
  const [fromBase, setFromBase] = useState(10)
  const [copied, setCopied] = useState(false)

  const results = useMemo(() => {
    if (!input.trim()) return null
    return BASES.map(b => ({
      ...b,
      value: toBase(input, fromBase, b.base),
      bits: formatBits(input, fromBase),
    }))
  }, [input, fromBase])

  const decimal = useMemo(() => getDecimalValue(input, fromBase), [input, fromBase])
  const bits = useMemo(() => formatBits(input, fromBase), [input, fromBase])
  const byteSize = useMemo(() => getBytes(input, fromBase), [input, fromBase])

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const fromBaseObj = BASES.find(b => b.base === fromBase)!

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Number Base Converter</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Convert between binary, octal, decimal, hexadecimal, and more. See binary representation and byte size.
      </p>

      {/* Source base selector */}
      <div className="mb-4">
        <label className="label">Input Base</label>
        <div className="flex flex-wrap gap-1.5">
          {BASES.map(b => (
            <button
              key={b.base}
              onClick={() => setFromBase(b.base)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition',
                fromBase === b.base
                  ? 'bg-brand-500 text-white'
                  : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700'
              )}
            >
              {b.name} ({b.base})
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="mb-5">
        <label className="label">Value in {fromBaseObj.name} (base {fromBase})</label>
        <input
          type="text"
          className="input w-full text-sm font-mono"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={fromBaseObj.placeholder}
          spellCheck={false}
          autoComplete="off"
        />
        {fromBaseObj.prefix && (
          <p className="text-xs text-ink-400 dark:text-ink-500 mt-1">
            Prefix: <span className="font-mono">{fromBaseObj.prefix}</span>
          </p>
        )}
      </div>

      {/* Decimal info */}
      {decimal && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="card p-3 text-center">
            <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">Decimal</p>
            <p className="text-sm font-bold gradient-text font-mono">{Number(decimal).toLocaleString()}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">Bits</p>
            <p className="text-sm font-bold gradient-text font-mono">{bits?.split(' ').length || 0}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">Size</p>
            <p className="text-sm font-bold gradient-text font-mono">{byteSize}</p>
          </div>
        </div>
      )}

      {/* Binary representation */}
      {bits && (
        <div className="mb-5">
          <p className="label mb-2">Binary Representation</p>
          <div className="card p-3 font-mono text-sm break-all">
            {bits}
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-2">
          {results.map(r => (
            <div
              key={r.base}
              className={cn(
                'card p-4 flex items-center justify-between',
                !r.value && 'opacity-40'
              )}
            >
              <div className="min-w-0">
                <p className="text-xs text-ink-500 dark:text-ink-400 mb-0.5">
                  {r.name} (base {r.base})
                  {r.prefix && <span className="font-mono ml-1">{r.prefix}</span>}
                </p>
                <p className="text-lg font-bold font-mono text-ink-700 dark:text-ink-200 truncate">
                  {r.value || '—'}
                </p>
              </div>
              {r.value && (
                <button
                  onClick={() => copy(r.value!)}
                  className="p-2 rounded-lg text-ink-400 hover:text-brand-500 transition shrink-0 ml-2"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Common values reference */}
      <div className="mt-5">
        <p className="label mb-2">Common Values</p>
        <div className="space-y-1 text-xs font-mono text-ink-500 dark:text-ink-400">
          <div className="flex justify-between"><span>255</span><span>0xFF</span><span>11111111</span></div>
          <div className="flex justify-between"><span>1024</span><span>0x400</span><span>10000000000</span></div>
          <div className="flex justify-between"><span>65535</span><span>0xFFFF</span><span>1111111111111111</span></div>
        </div>
      </div>
    </Section>
  )
}

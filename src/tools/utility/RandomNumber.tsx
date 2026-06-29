import { useState, useCallback } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function randomString(length: number, charset: string): string {
  const arr = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(arr, b => charset[b % charset.length]).join('')
}

export default function RandomNumber() {
  const [mode, setMode] = useState<'integer' | 'float' | 'string' | 'list'>('integer')
  const [min, setMin] = useState('1')
  const [max, setMax] = useState('100')
  const [decimals, setDecimals] = useState(2)
  const [strLength, setStrLength] = useState(12)
  const [charset, setCharset] = useState('alnum')
  const [listCount, setListCount] = useState(10)
  const [sort, setSort] = useState(false)
  const [unique, setUnique] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const charsets: Record<string, string> = {
    alnum: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    digits: '0123456789',
    hex: '0123456789abcdef',
    safe: 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789',
  }

  const generate = useCallback(() => {
    const n = parseInt(min) || 0
    const x = parseInt(max) || 100
    const lo = Math.min(n, x)
    const hi = Math.max(n, x)
    let res: string[] = []

    if (mode === 'integer') {
      res = [String(randomInRange(lo, hi))]
    } else if (mode === 'float') {
      res = [String(randomFloat(lo, hi, decimals))]
    } else if (mode === 'string') {
      res = [randomString(strLength, charsets[charset])]
    } else {
      const count = Math.min(listCount, 1000)
      const set = new Set<string>()
      while (set.size < count && (unique ? set.size < (hi - lo + 1) : true)) {
        set.add(String(randomInRange(lo, hi)))
      }
      res = Array.from(set)
      if (sort) res.sort((a, b) => Number(a) - Number(b))
    }

    setResults(res)
  }, [mode, min, max, decimals, strLength, charset, listCount, sort, unique])

  const copy = () => {
    navigator.clipboard.writeText(results.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Random Number Generator</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Generate random integers, floats, strings, and lists. Cryptographically secure.
      </p>

      {/* Mode */}
      <div className="flex rounded-xl bg-ink-100 dark:bg-ink-850 p-1 mb-4">
        {(['integer', 'float', 'string', 'list'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={cn('flex-1 px-3 py-2 rounded-lg text-sm font-medium transition capitalize',
              mode === m ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-300 shadow' : 'text-ink-600 dark:text-ink-300')}>
            {m}
          </button>
        ))}
      </div>

      {/* Controls */}
      {(mode === 'integer' || mode === 'float' || mode === 'list') && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="label">Min</label>
            <input type="number" className="input w-full" value={min} onChange={e => setMin(e.target.value)} />
          </div>
          <div>
            <label className="label">Max</label>
            <input type="number" className="input w-full" value={max} onChange={e => setMax(e.target.value)} />
          </div>
        </div>
      )}

      {mode === 'float' && (
        <div className="mb-4">
          <label className="label">Decimal Places</label>
          <input type="number" className="input w-32" value={decimals}
            onChange={e => setDecimals(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))} min={0} max={10} />
        </div>
      )}

      {mode === 'string' && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="label">Length</label>
            <input type="number" className="input w-full" value={strLength}
              onChange={e => setStrLength(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))} min={1} max={100} />
          </div>
          <div>
            <label className="label">Charset</label>
            <select className="input w-full" value={charset} onChange={e => setCharset(e.target.value)}>
              <option value="alnum">Alphanumeric</option>
              <option value="alpha">Letters Only</option>
              <option value="digits">Digits Only</option>
              <option value="hex">Hexadecimal</option>
              <option value="safe">Safe (no confusing chars)</option>
            </select>
          </div>
        </div>
      )}

      {mode === 'list' && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="label">Count</label>
            <input type="number" className="input w-full" value={listCount}
              onChange={e => setListCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))} min={1} max={1000} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-1.5 cursor-pointer pb-2">
              <input type="checkbox" checked={sort} onChange={e => setSort(e.target.checked)}
                className="w-4 h-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500" />
              <span className="text-xs">Sort</span>
            </label>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-1.5 cursor-pointer pb-2">
              <input type="checkbox" checked={unique} onChange={e => setUnique(e.target.checked)}
                className="w-4 h-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500" />
              <span className="text-xs">Unique</span>
            </label>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <button onClick={generate} className="btn-primary px-4 py-2 text-sm rounded-lg flex items-center gap-1.5">
          <RefreshCw className="w-4 h-4" /> Generate
        </button>
        {results.length > 0 && (
          <button onClick={copy} className="btn-ghost px-3 py-2 text-sm rounded-lg flex items-center gap-1.5">
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="card p-4">
          {mode === 'list' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-60 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="font-mono text-sm text-center py-1 px-2 bg-ink-50 dark:bg-ink-900 rounded">
                  {r}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-3xl font-bold gradient-text font-mono text-center py-4 break-all">{results[0]}</p>
          )}
        </div>
      )}
    </Section>
  )
}

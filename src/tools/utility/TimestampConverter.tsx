import { useState, useEffect } from 'react'
import { Copy, Check, Clock, ArrowRightLeft, Calendar } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

type Direction = 'to-ts' | 'from-ts'

const FORMATS = [
  { label: 'ISO 8601', value: 'iso' },
  { label: 'RFC 2822', value: 'rfc2822' },
  { label: 'UTC String', value: 'utc' },
  { label: 'Locale String', value: 'locale' },
  { label: 'Custom', value: 'custom' },
]

function formatDate(d: Date, fmt: string, customFmt?: string): string {
  switch (fmt) {
    case 'iso': return d.toISOString()
    case 'rfc2822': return d.toDateString() + ' ' + d.toTimeString()
    case 'utc': return d.toUTCString()
    case 'locale': return d.toLocaleString()
    case 'custom': return customFmt || d.toISOString()
    default: return d.toISOString()
  }
}

function getDurationBreakdown(ms: number): string {
  if (ms < 0) ms = -ms
  const years = Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000))
  const days = Math.floor((ms % (365.25 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000))
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))
  const seconds = Math.floor((ms % (60 * 1000)) / 1000)
  const parts: string[] = []
  if (years) parts.push(`${years}y`)
  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}m`)
  if (seconds) parts.push(`${seconds}s`)
  return parts.join(' ') || '0s'
}

export default function TimestampConverter() {
  const [direction, setDirection] = useState<Direction>('to-ts')
  const [dateInput, setDateInput] = useState('')
  const [tsInput, setTsInput] = useState('')
  const [tsUnit, setTsUnit] = useState<'s' | 'ms'>('s')
  const [format, setFormat] = useState('iso')
  const [customFmt, setCustomFmt] = useState('')
  const [copied, setCopied] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Set default date input to current time
  useEffect(() => {
    const d = new Date()
    setDateInput(d.toISOString().slice(0, 19))
    setTsInput(Math.floor(d.getTime() / 1000).toString())
  }, [])

  const dateToDate = (): Date | null => {
    if (!dateInput) return null
    const d = new Date(dateInput)
    return isNaN(d.getTime()) ? null : d
  }

  const getTimestamp = (): number | null => {
    const n = parseInt(tsInput)
    if (isNaN(n)) return null
    return tsUnit === 's' ? n * 1000 : n
  }

  const date = direction === 'to-ts' ? dateToDate() : null
  const tsMs = direction === 'from-ts' ? getTimestamp() : null

  const result = (() => {
    if (direction === 'to-ts' && date) {
      const ts = Math.floor(date.getTime() / (tsUnit === 's' ? 1000 : 1))
      return { ts, date, formatted: formatDate(date, format, customFmt) }
    }
    if (direction === 'from-ts' && tsMs !== null) {
      const d = new Date(tsMs)
      return { ts: Math.floor(tsMs / (tsUnit === 's' ? 1000 : 1)), date: d, formatted: formatDate(d, format, customFmt) }
    }
    return null
  })()

  const nowTs = Math.floor(now / (tsUnit === 's' ? 1000 : 1))
  const diff = result ? Math.abs(now - result.date.getTime()) : null

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const setNowToInput = () => {
    const d = new Date()
    if (direction === 'to-ts') {
      setDateInput(d.toISOString().slice(0, 19))
    } else {
      setTsInput(Math.floor(d.getTime() / (tsUnit === 's' ? 1000 : 1)).toString())
    }
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Timestamp Converter</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Convert between Unix timestamps and human-readable dates. Live clock included.
      </p>

      {/* Live clock */}
      <div className="card p-4 mb-5 bg-gradient-to-br from-brand-500/5 to-accent-400/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">Current Time</p>
            <p className="text-2xl font-bold gradient-text font-mono">{new Date(now).toLocaleTimeString()}</p>
            <p className="text-xs text-ink-400 dark:text-ink-500 mt-1">
              Unix: {Math.floor(now / 1000)} ({Math.floor(now / 1000).toString().length} digits)
            </p>
          </div>
          <button
            onClick={setNowToInput}
            className="btn-ghost px-3 py-2 text-sm rounded-lg flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" />
            Use Now
          </button>
        </div>
      </div>

      {/* Direction toggle */}
      <div className="flex rounded-xl bg-ink-100 dark:bg-ink-850 p-1 mb-4">
        <button
          onClick={() => setDirection('to-ts')}
          className={cn(
            'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2',
            direction === 'to-ts'
              ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-300 shadow'
              : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white'
          )}
        >
          <Calendar className="w-4 h-4" />
          Date → Timestamp
        </button>
        <button
          onClick={() => setDirection('from-ts')}
          className={cn(
            'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2',
            direction === 'from-ts'
              ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-300 shadow'
              : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white'
          )}
        >
          <ArrowRightLeft className="w-4 h-4" />
          Timestamp → Date
        </button>
      </div>

      {/* Input */}
      {direction === 'to-ts' ? (
        <div className="mb-4">
          <label className="label">Date & Time</label>
          <input
            type="datetime-local"
            className="input w-full text-sm font-mono"
            value={dateInput}
            onChange={e => setDateInput(e.target.value)}
            step="1"
          />
        </div>
      ) : (
        <div className="mb-4">
          <label className="label">Timestamp</label>
          <input
            type="number"
            className="input w-full text-sm font-mono"
            value={tsInput}
            onChange={e => setTsInput(e.target.value)}
            placeholder="e.g. 1700000000"
          />
        </div>
      )}

      {/* Timestamp unit */}
      <div className="mb-4">
        <label className="label">Timestamp Unit</label>
        <div className="flex gap-2">
          {(['s', 'ms'] as const).map(u => (
            <button
              key={u}
              onClick={() => setTsUnit(u)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition',
                tsUnit === u
                  ? 'bg-brand-500 text-white'
                  : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700'
              )}
            >
              {u === 's' ? 'Seconds (s)' : 'Milliseconds (ms)'}
            </button>
          ))}
        </div>
      </div>

      {/* Output format */}
      <div className="mb-4">
        <label className="label">Output Format</label>
        <div className="flex flex-wrap gap-1.5">
          {FORMATS.map(f => (
            <button
              key={f.value}
              onClick={() => setFormat(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition',
                format === f.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {format === 'custom' && (
          <input
            type="text"
            className="input w-full mt-2 text-sm font-mono"
            placeholder="YYYY-MM-DD HH:mm:ss"
            value={customFmt}
            onChange={e => setCustomFmt(e.target.value)}
          />
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-2">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">Timestamp ({tsUnit})</p>
                <p className="text-xl font-bold gradient-text font-mono">{result.ts.toLocaleString()}</p>
              </div>
              <button
                onClick={() => copy(String(result.ts))}
                className="p-2 rounded-lg text-ink-400 hover:text-brand-500 transition"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">Date (ISO)</p>
                <p className="text-sm font-mono text-ink-700 dark:text-ink-200">{result.date.toISOString()}</p>
              </div>
              <button
                onClick={() => copy(result.date.toISOString())}
                className="p-2 rounded-lg text-ink-400 hover:text-brand-500 transition"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {diff !== null && (
            <div className="card p-4">
              <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">Time Difference</p>
              <p className="text-sm font-mono text-ink-700 dark:text-ink-200">
                {getDurationBreakdown(diff)} {result.date.getTime() > now ? 'from now' : 'ago'}
              </p>
            </div>
          )}

          {result.formatted !== result.date.toISOString() && (
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">Formatted ({FORMATS.find(f => f.value === format)?.label})</p>
                  <p className="text-sm font-mono text-ink-700 dark:text-ink-200">{result.formatted}</p>
                </div>
                <button
                  onClick={() => copy(result.formatted)}
                  className="p-2 rounded-lg text-ink-400 hover:text-brand-500 transition"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Common timestamps */}
      <div className="mt-5">
        <p className="label mb-2">Quick Reference</p>
        <div className="space-y-1 text-xs font-mono text-ink-500 dark:text-ink-400">
          <div className="flex justify-between"><span>Epoch (0)</span><span>1970-01-01T00:00:00Z</span></div>
          <div className="flex justify-between"><span>Y2K (946684800)</span><span>2000-01-01T00:00:00Z</span></div>
          <div className="flex justify-between"><span>Now</span><span>{Math.floor(now / 1000)}</span></div>
        </div>
      </div>
    </Section>
  )
}

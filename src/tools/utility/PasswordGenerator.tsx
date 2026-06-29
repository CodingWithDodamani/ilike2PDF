import { useState, useCallback, useEffect } from 'react'
import { Copy, Check, RefreshCw, Shield, ShieldAlert, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  ambiguous: 'Il1O0',
}

function generatePassword(length: number, options: {
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
  excludeAmbiguous: boolean
}): string {
  let chars = ''
  if (options.uppercase) chars += CHARSETS.uppercase
  if (options.lowercase) chars += CHARSETS.lowercase
  if (options.numbers) chars += CHARSETS.numbers
  if (options.symbols) chars += CHARSETS.symbols
  if (!chars) chars = CHARSETS.lowercase

  if (options.excludeAmbiguous) {
    chars = chars.split('').filter(c => !CHARSETS.ambiguous.includes(c)).join('')
  }

  const array = new Uint32Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, v => chars[v % chars.length]).join('')
}

function checkStrength(password: string): { score: number; label: string; color: string; icon: typeof Shield } {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  // Penalize repeated chars
  if (/(.)\1{2,}/.test(password)) score--

  if (score <= 2) return { score, label: 'Weak', color: 'text-red-500', icon: ShieldAlert }
  if (score <= 4) return { score, label: 'Fair', color: 'text-amber-500', icon: Shield }
  return { score, label: 'Strong', color: 'text-emerald-500', icon: ShieldCheck }
}

function estimateCrackTime(password: string): string {
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSymbol = /[^a-zA-Z0-9]/.test(password)
  let pool = 0
  if (hasLower) pool += 26
  if (hasUpper) pool += 26
  if (hasDigit) pool += 10
  if (hasSymbol) pool += 32
  if (pool === 0) return 'Instant'
  const combinations = Math.pow(pool, password.length)
  const guessesPerSecond = 1e10 // 10 billion (modern GPU)
  const seconds = combinations / guessesPerSecond / 2
  if (seconds < 1) return 'Instant'
  if (seconds < 60) return `${Math.round(seconds)} seconds`
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`
  if (seconds < 31536000 * 1000) return `${Math.round(seconds / 31536000)} years`
  if (seconds < 31536000 * 1e6) return `${Math.round(seconds / 31536000 / 1000)}K years`
  if (seconds < 31536000 * 1e9) return `${Math.round(seconds / 31536000 / 1e6)}M years`
  return 'Centuries+'
}

const PRESETS = [
  { name: 'PIN', length: 6, uppercase: false, lowercase: false, numbers: true, symbols: false, excludeAmbiguous: false },
  { name: 'Simple', length: 10, uppercase: true, lowercase: true, numbers: true, symbols: false, excludeAmbiguous: false },
  { name: 'Medium', length: 14, uppercase: true, lowercase: true, numbers: true, symbols: false, excludeAmbiguous: false },
  { name: 'Strong', length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeAmbiguous: false },
  { name: 'Maximum', length: 32, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeAmbiguous: false },
  { name: 'Passphrase', length: 20, uppercase: true, lowercase: true, numbers: true, symbols: false, excludeAmbiguous: true },
]

export default function PasswordGenerator() {
  const [password, setPassword] = useState('')
  const [length, setLength] = useState(16)
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
  })
  const [copied, setCopied] = useState(false)
  const [showPassword, setShowPassword] = useState(true)
  const [history, setHistory] = useState<string[]>([])
  const [count, setCount] = useState(1)

  const generate = useCallback(() => {
    const passwords = Array.from({ length: count }, () =>
      generatePassword(length, options)
    )
    const pw = passwords[0]
    setPassword(pw)
    setHistory(prev => [pw, ...prev.filter(p => p !== pw)].slice(0, 20))
  }, [length, options, count])

  useEffect(() => { generate() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const copy = () => {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const strength = checkStrength(password)
  const crackTime = estimateCrackTime(password)
  const StrengthIcon = strength.icon

  const toggleOption = (key: keyof typeof options) => {
    setOptions(prev => {
      const next = { ...prev, [key]: !prev[key] }
      // Ensure at least one option is on
      if (!Object.values(next).some(Boolean)) return prev
      return next
    })
  }

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setLength(preset.length)
    setOptions({
      uppercase: preset.uppercase,
      lowercase: preset.lowercase,
      numbers: preset.numbers,
      symbols: preset.symbols,
      excludeAmbiguous: preset.excludeAmbiguous,
    })
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Password Generator</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Cryptographically secure random passwords. Nothing leaves your browser.
      </p>

      {/* Password display */}
      <div className="relative mb-4">
        <div className="card p-4 bg-ink-50 dark:bg-ink-900 font-mono text-lg break-all leading-relaxed min-h-[60px] flex items-center">
          {showPassword ? password : password.replace(/./g, '•')}
        </div>
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="p-1.5 rounded-lg bg-white dark:bg-ink-800 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 transition shadow-sm"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={copy}
            className="p-1.5 rounded-lg bg-white dark:bg-ink-800 text-ink-400 hover:text-brand-500 transition shadow-sm"
            aria-label="Copy password"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={generate}
            className="p-1.5 rounded-lg bg-white dark:bg-ink-800 text-ink-400 hover:text-brand-500 transition shadow-sm"
            aria-label="Regenerate"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Strength indicator */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-2 rounded-full bg-ink-200 dark:bg-ink-800 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              strength.score <= 2 ? 'bg-red-500' : strength.score <= 4 ? 'bg-amber-500' : 'bg-emerald-500'
            )}
            style={{ width: `${Math.min(100, (strength.score / 6) * 100)}%` }}
          />
        </div>
        <span className={cn('text-sm font-medium flex items-center gap-1', strength.color)}>
          <StrengthIcon className="w-4 h-4" />
          {strength.label}
        </span>
        <span className="text-xs text-ink-400 dark:text-ink-500">
          Crack time: {crackTime}
        </span>
      </div>

      {/* Presets */}
      <div className="mb-4">
        <p className="label mb-2">Presets</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(p => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700 transition"
            >
              {p.name} ({p.length})
            </button>
          ))}
        </div>
      </div>

      {/* Length slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Length</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={length}
              onChange={e => setLength(Math.max(4, Math.min(128, parseInt(e.target.value) || 4)))}
              className="input w-16 text-center text-sm py-1"
              min={4}
              max={128}
            />
          </div>
        </div>
        <input
          type="range"
          min={4}
          max={128}
          value={length}
          onChange={e => setLength(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-ink-200 dark:bg-ink-800 cursor-pointer accent-brand-500"
        />
        <div className="flex justify-between text-xs text-ink-400 dark:text-ink-500 mt-1">
          <span>4</span>
          <span>128</span>
        </div>
      </div>

      {/* Character options */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {([
          { key: 'uppercase' as const, label: 'A-Z', desc: 'Uppercase' },
          { key: 'lowercase' as const, label: 'a-z', desc: 'Lowercase' },
          { key: 'numbers' as const, label: '0-9', desc: 'Numbers' },
          { key: 'symbols' as const, label: '!@#', desc: 'Symbols' },
          { key: 'excludeAmbiguous' as const, label: 'Il1O0', desc: 'Exclude ambiguous' },
        ]).map(opt => (
          <button
            key={opt.key}
            onClick={() => toggleOption(opt.key)}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border transition text-left',
              opt.key === 'excludeAmbiguous'
                ? options[opt.key]
                  ? 'border-amber-500/50 bg-amber-500/5'
                  : 'border-ink-200 dark:border-ink-700'
                : options[opt.key]
                  ? 'border-brand-500/50 bg-brand-500/5'
                  : 'border-ink-200 dark:border-ink-700'
            )}
          >
            <span className={cn(
              'w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs font-mono font-bold transition',
              options[opt.key]
                ? opt.key === 'excludeAmbiguous'
                  ? 'border-amber-500 bg-amber-500 text-white'
                  : 'border-brand-500 bg-brand-500 text-white'
                : 'border-ink-300 dark:border-ink-600'
            )}>
              {options[opt.key] ? '✓' : ''}
            </span>
            <div>
              <span className="text-sm font-medium">{opt.label}</span>
              <span className="text-xs text-ink-400 dark:text-ink-500 ml-1.5">{opt.desc}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Batch count */}
      <div className="mb-4">
        <label className="label">Generate multiple</label>
        <div className="flex gap-2">
          {[1, 5, 10, 20].map(n => (
            <button
              key={n}
              onClick={() => { setCount(n); }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition',
                count === n
                  ? 'bg-brand-500 text-white'
                  : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700'
              )}
            >
              {n}
            </button>
          ))}
          <button onClick={generate} className="btn-primary px-4 py-1.5 text-sm rounded-lg flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4" />
            Generate
          </button>
        </div>
      </div>

      {/* History */}
      {history.length > 1 && (
        <div>
          <p className="label mb-2">Recent ({history.length})</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {history.slice(1).map((pw, i) => (
              <div key={`${pw}-${i}`} className="flex items-center gap-2 text-xs font-mono text-ink-500 dark:text-ink-400 bg-ink-50 dark:bg-ink-900 rounded-lg px-3 py-1.5">
                <span className="truncate flex-1">{showPassword ? pw : '•'.repeat(pw.length)}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(pw); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
                  className="text-ink-400 hover:text-brand-500 transition shrink-0"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}

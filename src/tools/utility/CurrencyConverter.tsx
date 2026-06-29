import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowUpDown, RefreshCw, Star, Copy, Check, Globe, TrendingUp, TrendingDown, Minus, History, ChevronDown } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

const CACHE_KEY = 'ilikepdf-fx-rates-v2'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour (rates update daily, no need to refetch often)
const AUTO_REFRESH_INTERVAL = 60 * 60 * 1000 // auto-refresh every hour (daily rates)
const HISTORY_KEY = 'ilikepdf-fx-history'

interface FxRates {
  rates: Record<string, number>
  timestamp: number
  source: string
  base: string
}

interface RateHistory {
  date: string
  rates: Record<string, number>
}

// ─── Multi-Source API Engine ────────────────────────────────────────────────
// Sources from https://github.com/public-apis/public-apis (Currency Exchange)
interface ApiSource {
  name: string
  url: string | (() => string)
  parse: (data: any) => { rates: Record<string, number>; base: string }
  cors?: boolean
}

const API_KEY = 'c2155ef5aa8cbcca8c9e1cae'

const API_SOURCES: ApiSource[] = [
  // 1. Exchange Rate API (user's key) — primary source, real-time daily updates
  {
    name: 'Exchange Rate API',
    url: () => `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`,
    parse: (data) => ({ rates: data.conversion_rates, base: data.base_code }),
  },
  // 2. Currency-API (fawazahmed0) — 150+ currencies, no limits, CORS ✓
  {
    name: 'Currency-API',
    url: () => `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json`,
    parse: (data) => ({ rates: data.usd || data, base: 'USD' }),
  },
  // 3. Frankfurter — ECB rates, time series, CORS ✓
  {
    name: 'Frankfurter (ECB)',
    url: () => `https://api.frankfurter.app/latest?from=USD`,
    parse: (data) => ({ rates: data.rates, base: data.base }),
  },
  // 4. Economia.Awesome — Portuguese API, no limits, CORS ✓
  {
    name: 'Economia.Awesome',
    url: () => `https://economia.awesomeapi.com.br/json/last/USD`,
    parse: (data) => {
      const rates: Record<string, number> = {}
      for (const [key, val] of Object.entries(data)) {
        if (key !== 'USD' && typeof val === 'object' && val !== null) {
          rates[key] = parseFloat((val as any).bid || '0')
        }
      }
      return { rates, base: 'USD' }
    },
  },
  // 5. VATComply.com — Exchange rates + geolocation, CORS ✓
  {
    name: 'VATComply',
    url: () => `https://www.vatcomply.com/rates?base=USD`,
    parse: (data) => ({ rates: data.rates, base: data.base }),
  },
  // 6. ExchangeRate-API (free tier, no key)
  {
    name: 'ExchangeRate-API (free)',
    url: () => `https://open.er-api.com/v6/latest/USD`,
    parse: (data) => ({ rates: data.rates, base: data.base_code }),
  },
  // 7. Exchangerate.host — Free forex & crypto
  {
    name: 'Exchangerate.host',
    url: () => `https://api.exchangerate.host/latest?base=USD`,
    parse: (data) => ({ rates: data.rates, base: data.base }),
  },
]

async function fetchFromSource(source: ApiSource): Promise<FxRates> {
  const url = typeof source.url === 'function' ? source.url() : source.url
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const { rates, base } = source.parse(data)
  // Filter out invalid rates
  const validRates: Record<string, number> = {}
  for (const [k, v] of Object.entries(rates)) {
    if (typeof v === 'number' && v > 0 && isFinite(v)) {
      validRates[k.toUpperCase()] = v
    }
  }
  if (Object.keys(validRates).length < 10) throw new Error('Too few rates')
  return { rates: validRates, timestamp: Date.now(), source: source.name, base }
}

async function fetchRatesWithFallback(): Promise<FxRates> {
  const errors: string[] = []
  for (const source of API_SOURCES) {
    try {
      return await fetchFromSource(source)
    } catch (e: any) {
      errors.push(`${source.name}: ${e.message}`)
    }
  }
  throw new Error(`All ${API_SOURCES.length} sources failed: ${errors[errors.length - 1]}`)
}

// ─── Currency Data ──────────────────────────────────────────────────────────
const POPULAR = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL', 'KRW', 'MXN']

const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar', AUD: 'Australian Dollar', CHF: 'Swiss Franc',
  CNY: 'Chinese Yuan', INR: 'Indian Rupee', BRL: 'Brazilian Real',
  KRW: 'South Korean Won', MXN: 'Mexican Peso', SEK: 'Swedish Krona',
  NOK: 'Norwegian Krone', DKK: 'Danish Krone', NZD: 'New Zealand Dollar',
  SGD: 'Singapore Dollar', HKD: 'Hong Kong Dollar', THB: 'Thai Baht',
  ZAR: 'South African Rand', RUB: 'Russian Ruble', TRY: 'Turkish Lira',
  PLN: 'Polish Zloty', CZK: 'Czech Koruna', HUF: 'Hungarian Forint',
  ILS: 'Israeli Shekel', PHP: 'Philippine Peso', TWD: 'Taiwan Dollar',
  AED: 'UAE Dirham', SAR: 'Saudi Riyal', QAR: 'Qatari Riyal',
  KWD: 'Kuwaiti Dinar', BHD: 'Bahraini Dinar', OMR: 'Omani Rial',
  JOD: 'Jordanian Dinar', LBP: 'Lebanese Pound', EGP: 'Egyptian Pound',
  NGN: 'Nigerian Naira', GHS: 'Ghanaian Cedi', KES: 'Kenyan Shilling',
  TZS: 'Tanzanian Shilling', UGX: 'Ugandan Shilling', MAD: 'Moroccan Dirham',
  DZD: 'Algerian Dinar', TND: 'Tunisian Dinar', LYD: 'Libyan Dinar',
  XOF: 'CFA Franc BCEAO', XAF: 'CFA Franc BEAC', GNF: 'Guinean Franc',
  RWF: 'Rwandan Franc', ETB: 'Ethiopian Birr', SDG: 'Sudanese Pound',
  SOS: 'Somali Shilling', ZMW: 'Zambian Kwacha', MWK: 'Malawian Kwacha',
  BWP: 'Botswana Pula', MUR: 'Mauritian Rupee', SCR: 'Seychellois Rupee',
  MVR: 'Maldivian Rufiyaa', BTN: 'Bhutanese Ngultrum', NPR: 'Nepalese Rupee',
  BDT: 'Bangladeshi Taka', LKR: 'Sri Lankan Rupee', MMK: 'Myanmar Kyat',
  KHR: 'Cambodian Riel', LAK: 'Lao Kip', VND: 'Vietnamese Dong',
  IDR: 'Indonesian Rupiah', MYR: 'Malaysian Ringgit', PKR: 'Pakistani Rupee',
  AFN: 'Afghan Afghani', IRR: 'Iranian Rial', IQD: 'Iraqi Dinar',
  SYP: 'Syrian Pound', YER: 'Yemeni Rial', JMD: 'Jamaican Dollar',
  TTD: 'Trinidad Dollar', BBD: 'Barbadian Dollar', BSD: 'Bahamian Dollar',
  BZD: 'Belize Dollar', GTQ: 'Guatemalan Quetzal', HNL: 'Honduran Lempira',
  NIO: 'Nicaraguan Cordoba', CRC: 'Costa Rican Colon', PAB: 'Panamanian Balboa',
  CUP: 'Cuban Peso', DOP: 'Dominican Peso', HTG: 'Haitian Gourde',
  CSD: 'Serbian Dinar', MKD: 'Macedonian Denar', ALL: 'Albanian Lek',
  BAM: 'Bosnian Mark', BGN: 'Bulgarian Lev', HRK: 'Croatian Kuna',
  MDL: 'Moldovan Leu', RON: 'Romanian Leu', UAH: 'Ukrainian Hryvnia',
  BYN: 'Belarusian Ruble', GEL: 'Georgian Lari', AMD: 'Armenian Dram',
  AZN: 'Azerbaijani Manat', KZT: 'Kazakhstani Tenge', KGS: 'Kyrgyzstani Som',
  TJS: 'Tajikistani Somoni', TMT: 'Turkmenistani Manat', UZS: 'Uzbekistani Som',
  MNT: 'Mongolian Tugrik', ISK: 'Icelandic Krona', VES: 'Venezuelan Bolivar',
  BOB: 'Bolivian Boliviano', PYG: 'Paraguayan Guarani', UYU: 'Uruguayan Peso',
  ARS: 'Argentine Peso', CLP: 'Chilean Peso', COP: 'Colombian Peso',
  PEN: 'Peruvian Sol', ERN: 'Eritrean Nakfa', DJF: 'Djiboutian Franc',
  KMF: 'Comorian Franc', MGA: 'Malagasy Ariary', CVE: 'Cape Verdean Escudo',
  STN: 'São Tomé Dobra', GMD: 'Guambian Dalasi', BIF: 'Burundian Franc',
  SLL: 'Sierra Leonean Leone', LRD: 'Liberian Dollar', ZWL: 'Zimbabwean Dollar',
  SSP: 'South Sudanese Pound', GIP: 'Gibraltar Pound', SHP: 'Saint Helena Pound',
  FKP: 'Falkland Islands Pound', JEP: 'Jersey Pound', GGP: 'Guernsey Pound',
  IMP: 'Isle of Man Pound', FOK: 'Faroese Króna',
}

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', CAD: '🇨🇦',
  AUD: '🇦🇺', CHF: '🇨🇭', CNY: '🇨🇳', INR: '🇮🇳', BRL: '🇧🇷',
  KRW: '🇰🇷', MXN: '🇲🇽', SEK: '🇸🇪', NOK: '🇳🇴', DKK: '🇩🇰',
  NZD: '🇳🇿', SGD: '🇸🇬', HKD: '🇭🇰', THB: '🇹🇭', ZAR: '🇿🇦',
  RUB: '🇷🇺', TRY: '🇹🇷', PLN: '🇵🇱', CZK: '🇨🇿', HUF: '🇭🇺',
  ILS: '🇮🇱', PHP: '🇵🇭', TWD: '🇹🇼', AED: '🇦🇪', SAR: '🇸🇦',
  KWD: '🇰🇼', EGP: '🇪🇬', NGN: '🇳🇬', PKR: '🇵🇰', VND: '🇻🇳',
  IDR: '🇮🇩', MYR: '🇲🇾', BDT: '🇧🇩', NPR: '🇳🇵', LKR: '🇱🇰',
  MAD: '🇲🇦', DZD: '🇩🇿', TND: '🇹🇳', KES: '🇰🇪', GHS: '🇬🇭',
  UAH: '🇺🇦', RON: '🇷🇴', BGN: '🇧🇬', HRK: '🇭🇷', RSD: '🇷🇸',
  ISK: '🇮🇸', CLP: '🇨🇱', COP: '🇨🇴', PEN: '🇵🇪', ARS: '🇦🇷',
  UYU: '🇺🇾', BOB: '🇧🇴', PYG: '🇵🇾', VES: '🇻🇪', GTQ: '🇬🇹',
  HNL: '🇭🇳', CRC: '🇨🇷', JMD: '🇯🇲', TTD: '🇹🇹', BBD: '🇧🇧',
  BSD: '🇧🇸', BZD: '🇧🇿', BAM: '🇧🇦', ALL: '🇦🇱', MKD: '🇲🇰',
  MDL: '🇲🇩', GEL: '🇬🇪', AMD: '🇦🇲', AZN: '🇦🇿', KZT: '🇰🇿',
  UZS: '🇺🇿', TMT: '🇹🇲', KGS: '🇰🇬', TJS: '🇹🇯', MNT: '🇲🇳',
  KHR: '🇰🇭', LAK: '🇱🇦', MMK: '🇲🇲', BWP: '🇧🇼', MUR: '🇲🇺',
  SCR: '🇸🇨', MVR: '🇲🇻', ETB: '🇪🇹', SDG: '🇸🇩', SOS: '🇸🇴',
  ZMW: '🇿🇲', MWK: '🇲🇼', XOF: '🇨🇮', XAF: '🇨🇲', GNF: '🇬🇳',
  RWF: '🇷🇼', DJF: '🇩🇯', KMF: '🇰🇲', MGA: '🇲🇬', BIF: '🇧🇮',
  LRD: '🇱🇷', ZWL: '🇿🇼', SSP: '🇸🇸', ERI: '🇪🇷', OMR: '🇴🇲',
  BHD: '🇧🇭', JOD: '🇯🇴', QAR: '🇶🇦', LBP: '🇱🇧',
}

function formatRate(r: number): string {
  if (r >= 1000) return r.toFixed(2)
  if (r >= 100) return r.toFixed(4)
  if (r >= 1) return r.toFixed(6)
  if (r >= 0.01) return r.toFixed(6)
  return r.toFixed(8)
}

function getFlag(code: string): string {
  return CURRENCY_FLAGS[code] || ''
}

// ─── Historical Rates (Exchange Rate API + Frankfurter fallback) ────────────
async function fetchHistoricalRates(date: string, base = 'USD'): Promise<Record<string, number> | null> {
  // Try Exchange Rate API first (user's key)
  try {
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${API_KEY}/historical/${date}`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (res.ok) {
      const data = await res.json()
      if (data.conversion_rates) return data.conversion_rates
    }
  } catch {}

  // Fallback to Frankfurter (ECB historical)
  try {
    const res = await fetch(`https://api.frankfurter.app/${date}?from=${base}`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = await res.json()
    return data.rates || null
  } catch {
    return null
  }
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function CurrencyConverter() {
  const [rates, setRates] = useState<Record<string, number>>({})
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('EUR')
  const [amount, setAmount] = useState('1')
  const [lastUpdated, setLastUpdated] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [source, setSource] = useState('')
  const [activeSourceIdx, setActiveSourceIdx] = useState(0)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('ilikepdf-fx-favs') || '[]') } catch { return [] }
  })
  const [copied, setCopied] = useState(false)
  const [searchFrom, setSearchFrom] = useState('')
  const [searchTo, setSearchTo] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [prevRates, setPrevRates] = useState<Record<string, number>>({})
  const [showHistory, setShowHistory] = useState(false)
  const [historyDate, setHistoryDate] = useState('')
  const [historyRates, setHistoryRates] = useState<Record<string, number> | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timerRef = useRef<any>(null)

  const fetchRates = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError('')

      // Check cache first (5 min TTL)
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const data: FxRates = JSON.parse(cached)
        if (Date.now() - data.timestamp < CACHE_TTL) {
          setPrevRates(rates)
          setRates(data.rates)
          setLastUpdated(data.timestamp)
          setSource(data.source)
          setLoading(false)
          return
        }
      }

      const data = await fetchRatesWithFallback()
      setPrevRates(rates)
      setRates(data.rates)
      setLastUpdated(data.timestamp)
      setSource(data.source)
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    } catch (e: any) {
      setError(e.message || 'Failed to load exchange rates')
    } finally {
      setLoading(false)
    }
  }, [rates])

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetchRates()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(() => fetchRates(false), AUTO_REFRESH_INTERVAL)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoRefresh, fetchRates])

  useEffect(() => {
    localStorage.setItem('ilikepdf-fx-favs', JSON.stringify(favorites))
  }, [favorites])

  // Load historical rates
  useEffect(() => {
    if (!historyDate || !showHistory) return
    setLoadingHistory(true)
    fetchHistoricalRates(historyDate).then(r => {
      setHistoryRates(r)
      setLoadingHistory(false)
    })
  }, [historyDate, showHistory])

  const activeRates = showHistory && historyRates ? historyRates : rates

  const converted = (() => {
    const n = parseFloat(amount)
    if (isNaN(n) || !activeRates[from] || !activeRates[to]) return null
    return (n / activeRates[from]) * activeRates[to]
  })()

  const rateChange = (() => {
    if (!prevRates[from] || !prevRates[to] || !rates[from] || !rates[to]) return null
    const prev = prevRates[to] / prevRates[from]
    const curr = rates[to] / rates[from]
    const diff = curr - prev
    if (Math.abs(diff) < 1e-10) return { dir: 'flat' as const, pct: 0 }
    return { dir: diff > 0 ? 'up' as const : 'down' as const, pct: (diff / prev) * 100 }
  })()

  const swap = () => { setFrom(to); setTo(from); setSearchFrom(''); setSearchTo('') }

  const toggleFavorite = (code: string) => {
    setFavorites(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
  }

  const copyResult = () => {
    if (converted === null) return
    const text = `${parseFloat(amount).toLocaleString()} ${from} = ${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${to}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const currencies = Object.keys(activeRates).sort()
  const filterList = (search: string) => {
    if (!search) return currencies
    const q = search.toLowerCase()
    return currencies.filter(c =>
      c.toLowerCase().includes(q) || (CURRENCY_NAMES[c] || '').toLowerCase().includes(q)
    )
  }

  const fromList = filterList(searchFrom)
  const toList = filterList(searchTo)

  const CurrencySelect = ({
    value, onChange, search, onSearch, list, label,
  }: {
    value: string; onChange: (v: string) => void; search: string;
    onSearch: (v: string) => void; list: string[]; label: string
  }) => (
    <div className="flex-1 min-w-0">
      <label className="label">{label}</label>
      <input
        className="input w-full mb-2"
        placeholder="Search currency..."
        value={search}
        onChange={e => onSearch(e.target.value)}
        aria-label={`Search ${label}`}
      />
      <div className="h-52 overflow-y-auto rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900">
        {/* Favorites first */}
        {favorites.length > 0 && !search && (
          <>
            <div className="px-3 py-1.5 text-xs text-ink-400 dark:text-ink-500 font-medium sticky top-0 bg-white dark:bg-ink-900 border-b border-ink-100 dark:border-ink-800">
              Favorites
            </div>
            {favorites.filter(c => activeRates[c]).map(code => (
              <button
                key={`fav-${code}`}
                onClick={() => { onChange(code); onSearch('') }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-ink-100 dark:hover:bg-ink-800 transition',
                  value === code && 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300 font-medium'
                )}
              >
                <span className="truncate">
                  <span className="mr-1.5">{getFlag(code)}</span>
                  <span className="font-mono font-semibold">{code}</span>
                  <span className="text-ink-500 dark:text-ink-400 ml-2 text-xs">
                    {(CURRENCY_NAMES[code] || '').slice(0, 18)}
                  </span>
                </span>
                <span className="text-xs text-ink-400 dark:text-ink-500 font-mono whitespace-nowrap">
                  {formatRate(activeRates[code])}
                </span>
              </button>
            ))}
            <div className="px-3 py-1.5 text-xs text-ink-400 dark:text-ink-500 font-medium border-b border-ink-100 dark:border-ink-800">
              All Currencies
            </div>
          </>
        )}
        {list.map(code => (
          <button
            key={code}
            onClick={() => { onChange(code); onSearch('') }}
            className={cn(
              'w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-ink-100 dark:hover:bg-ink-800 transition',
              value === code && 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300 font-medium'
            )}
          >
            <span className="truncate">
              <span className="mr-1.5">{getFlag(code)}</span>
              <span className="font-mono font-semibold">{code}</span>
              <span className="text-ink-500 dark:text-ink-400 ml-2 text-xs">
                {(CURRENCY_NAMES[code] || '').slice(0, 18)}
              </span>
            </span>
            <span className="text-xs text-ink-400 dark:text-ink-500 font-mono whitespace-nowrap">
              {formatRate(activeRates[code])}
            </span>
          </button>
        ))}
        {list.length === 0 && (
          <p className="text-sm text-ink-400 text-center py-4">No currencies found</p>
        )}
      </div>
    </div>
  )

  return (
    <Section>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold">Currency Converter</h2>
        <div className="flex items-center gap-2">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition',
              autoRefresh
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400'
            )}
            title={autoRefresh ? 'Auto-refresh ON (hourly)' : 'Auto-refresh OFF'}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', autoRefresh && 'animate-spin')} style={{ animationDuration: '3s' }} />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
          {/* Manual refresh */}
          <button
            onClick={() => fetchRates()}
            disabled={loading}
            className="p-1.5 rounded-lg text-ink-400 hover:text-brand-500 transition disabled:opacity-40"
            title="Refresh rates now"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Real-time rates powered by Exchange Rate API. {API_SOURCES.length} sources with automatic failover.
      </p>

      {error && (
        <div className="rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 text-sm mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchRates()} className="underline text-xs">Retry</button>
        </div>
      )}

      {/* Amount input */}
      <div className="mb-4">
        <label className="label">Amount</label>
        <input
          ref={inputRef}
          type="number"
          className="input w-full text-lg font-mono"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          min="0"
          step="any"
          aria-label="Amount to convert"
        />
      </div>

      {/* Currency selectors */}
      <div className="flex gap-3 items-start">
        <CurrencySelect
          value={from} onChange={setFrom} search={searchFrom}
          onSearch={setSearchFrom} list={fromList} label="From"
        />
        <button
          onClick={swap}
          className="mt-8 p-2 rounded-xl bg-ink-100 dark:bg-ink-800 hover:bg-ink-200 dark:hover:bg-ink-700 transition shrink-0"
          aria-label="Swap currencies"
        >
          <ArrowUpDown className="w-5 h-5 text-ink-600 dark:text-ink-300" />
        </button>
        <CurrencySelect
          value={to} onChange={setTo} search={searchTo}
          onSearch={setSearchTo} list={toList} label="To"
        />
      </div>

      {/* Result */}
      {converted !== null && (
        <div className="mt-5 card p-5 bg-gradient-to-br from-brand-500/5 to-accent-400/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-ink-500 dark:text-ink-400 mb-1">
                {getFlag(from)} {parseFloat(amount).toLocaleString()} {from} =
              </p>
              <p className="text-3xl font-bold gradient-text font-mono">
                {getFlag(to)} {converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {to}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-xs text-ink-400 dark:text-ink-500">
                  1 {from} = {formatRate(activeRates[from] ? (activeRates[to] / activeRates[from]) : 0)} {to}
                </p>
                {rateChange && rateChange.dir !== 'flat' && (
                  <span className={cn(
                    'flex items-center gap-0.5 text-xs font-medium',
                    rateChange.dir === 'up' ? 'text-emerald-500' : 'text-red-500'
                  )}>
                    {rateChange.dir === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {rateChange.pct.toFixed(3)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-400 dark:text-ink-500">
                1 {to} = {formatRate(activeRates[to] ? (activeRates[from] / activeRates[to]) : 0)} {from}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggleFavorite(from)}
                className={cn('p-2 rounded-lg transition', favorites.includes(from) ? 'text-amber-500' : 'text-ink-400 hover:text-amber-500')}
                aria-label={`Favorite ${from}`}
              >
                <Star className={cn('w-5 h-5', favorites.includes(from) && 'fill-current')} />
              </button>
              <button
                onClick={copyResult}
                className="p-2 rounded-lg text-ink-400 hover:text-brand-500 transition"
                aria-label="Copy result"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historical rates */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => { setShowHistory(!showHistory); if (showHistory) { setHistoryRates(null); setHistoryDate('') } }}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition',
            showHistory
              ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
              : 'bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-ink-700'
          )}
        >
          <History className="w-3.5 h-3.5" />
          Historical
        </button>
        {showHistory && (
          <input
            type="date"
            value={historyDate}
            onChange={e => setHistoryDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className="input text-sm py-1.5"
          />
        )}
        {showHistory && historyDate && (
          <span className="text-xs text-ink-400 dark:text-ink-500">
            {loadingHistory ? 'Loading...' : historyRates ? `Rates for ${historyDate}` : 'No data'}
          </span>
        )}
      </div>

      {/* Source indicator */}
      <div className="mt-3 flex items-center gap-2 text-xs text-ink-400 dark:text-ink-500">
        <Globe className="w-3.5 h-3.5" />
        <span>Source: <span className="font-medium text-ink-500 dark:text-ink-400">{source || 'Loading...'}</span></span>
        {lastUpdated > 0 && (
          <span className="ml-auto">
            Updated: {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Quick access popular currencies */}
      <div className="mt-4">
        <p className="text-xs text-ink-500 dark:text-ink-400 mb-2">Quick Select</p>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR.map(code => (
            <button
              key={code}
              onClick={() => { setTo(code); setSearchTo('') }}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-mono transition flex items-center gap-1',
                to === code
                  ? 'bg-brand-500 text-white'
                  : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700'
              )}
            >
              <span>{getFlag(code)}</span>
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* API Sources info */}
      <details className="mt-4">
        <summary className="text-xs text-ink-400 dark:text-ink-500 cursor-pointer hover:text-ink-600 dark:hover:text-ink-300 transition">
          API Sources (Primary: Exchange Rate API + {API_SOURCES.length - 1} fallbacks)
        </summary>
        <div className="mt-2 space-y-1">
          {API_SOURCES.map((s, i) => (
            <div key={s.name} className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
              <span className={cn(
                'w-2 h-2 rounded-full',
                source === s.name ? 'bg-emerald-500' : 'bg-ink-300 dark:bg-ink-600'
              )} />
              <span className={cn(source === s.name && 'font-medium text-ink-700 dark:text-ink-200')}>
                {s.name}
              </span>
              {source === s.name && <span className="text-emerald-500 text-[10px]">ACTIVE</span>}
            </div>
          ))}
        </div>
      </details>
    </Section>
  )
}

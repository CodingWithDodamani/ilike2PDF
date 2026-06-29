import { useState, useEffect, useRef } from 'react'
import { TrendingUp, Calendar, ArrowUpDown, Globe, RefreshCw } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL', 'KRW', 'MXN']

interface RateHistory {
  date: string
  rates: Record<string, number>
}

async function fetchHistoricalRates(base: string, target: string, days: number): Promise<RateHistory[]> {
  const results: RateHistory[] = []
  const today = new Date()
  
  for (let i = days; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    
    try {
      const res = await fetch(
        `https://api.frankfurter.app/${dateStr}?from=${base}&to=${target}`,
        { signal: AbortSignal.timeout(5000) }
      )
      if (res.ok) {
        const data = await res.json()
        results.push({ date: dateStr, rates: data.rates || {} })
      }
    } catch {}
  }
  
  return results
}

export default function CurrencyChart() {
  const [baseCurrency, setBaseCurrency] = useState('USD')
  const [targetCurrency, setTargetCurrency] = useState('EUR')
  const [days, setDays] = useState(30)
  const [data, setData] = useState<RateHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const loadChart = async () => {
    try {
      setLoading(true)
      setError('')
      const history = await fetchHistoricalRates(baseCurrency, targetCurrency, days)
      setData(history)
    } catch (e: any) {
      setError(e.message || 'Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChart()
  }, [baseCurrency, targetCurrency, days])

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return
    drawChart(canvasRef.current, data)
  }, [data])

  const drawChart = (canvas: HTMLCanvasElement, chartData: RateHistory[]) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const padding = { top: 20, right: 20, bottom: 40, left: 60 }

    const rates = chartData.map(d => {
      const val = d.rates[targetCurrency]
      return typeof val === 'number' ? val : null
    }).filter((v): v is number => v !== null)

    if (rates.length < 2) return

    const min = Math.min(...rates)
    const max = Math.max(...rates)
    const range = max - min || 1

    // Clear
    ctx.fillStyle = getComputedStyle(canvas).backgroundColor || '#000'
    ctx.fillRect(0, 0, w, h)

    // Grid lines
    ctx.strokeStyle = 'rgba(128,128,128,0.15)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (h - padding.top - padding.bottom) * (i / 4)
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(w - padding.right, y)
      ctx.stroke()

      const val = max - (range * i) / 4
      ctx.fillStyle = 'rgba(128,128,128,0.7)'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(val.toFixed(4), padding.left - 8, y + 4)
    }

    // X-axis labels
    ctx.fillStyle = 'rgba(128,128,128,0.7)'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    const step = Math.max(1, Math.floor(chartData.length / 6))
    for (let i = 0; i < chartData.length; i += step) {
      const x = padding.left + (w - padding.left - padding.right) * (i / (chartData.length - 1))
      ctx.fillText(chartData[i].date.slice(5), x, h - padding.bottom + 20)
    }

    // Draw line
    const gradient = ctx.createLinearGradient(0, 0, 0, h)
    gradient.addColorStop(0, 'rgba(225,29,72,0.8)')
    gradient.addColorStop(1, 'rgba(249,115,22,0.4)')

    ctx.strokeStyle = gradient
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.beginPath()

    let validIdx = 0
    for (let i = 0; i < chartData.length; i++) {
      const val = chartData[i].rates[targetCurrency]
      if (typeof val !== 'number') continue
      const x = padding.left + (w - padding.left - padding.right) * (validIdx / (rates.length - 1))
      const y = padding.top + (h - padding.top - padding.bottom) * ((max - val) / range)
      if (validIdx === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
      validIdx++
    }
    ctx.stroke()

    // Fill area under line
    validIdx = 0
    ctx.lineTo(
      padding.left + (w - padding.left - padding.right),
      h - padding.bottom
    )
    ctx.lineTo(padding.left, h - padding.bottom)
    ctx.closePath()
    ctx.fillStyle = 'rgba(225,29,72,0.08)'
    ctx.fill()
  }

  const stats = data.length > 0 ? (() => {
    const rates = data.map(d => d.rates[targetCurrency]).filter((v): v is number => typeof v === 'number')
    if (rates.length === 0) return null
    const min = Math.min(...rates)
    const max = Math.max(...rates)
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length
    const change = rates[rates.length - 1] - rates[0]
    return { min, max, avg, change }
  })() : null

  return (
    <Section>
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-brand-500" />
        Currency Chart
      </h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Visualize exchange rate trends over time with interactive charts.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="label">Base Currency</label>
          <select value={baseCurrency} onChange={e => setBaseCurrency(e.target.value)} className="input w-full">
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Target Currency</label>
          <select value={targetCurrency} onChange={e => setTargetCurrency(e.target.value)} className="input w-full">
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Time Range</label>
          <select value={days} onChange={e => setDays(Number(e.target.value))} className="input w-full">
            <option value={7}>7 Days</option>
            <option value={30}>30 Days</option>
            <option value={90}>90 Days</option>
            <option value={180}>6 Months</option>
            <option value={365}>1 Year</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={loadChart} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="card p-4">
        <canvas
          ref={canvasRef}
          className="w-full bg-white dark:bg-ink-900 rounded-lg"
          style={{ height: '300px' }}
        />
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="card p-3 text-center">
            <p className="text-xs text-ink-400">Low</p>
            <p className="text-sm font-bold text-red-500">{stats.min.toFixed(4)}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xs text-ink-400">High</p>
            <p className="text-sm font-bold text-emerald-500">{stats.max.toFixed(4)}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xs text-ink-400">Average</p>
            <p className="text-sm font-bold">{stats.avg.toFixed(4)}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xs text-ink-400">Change</p>
            <p className={cn('text-sm font-bold', stats.change >= 0 ? 'text-emerald-500' : 'text-red-500')}>
              {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(4)}
            </p>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-xs text-ink-400">
        <Globe className="w-3.5 h-3.5" />
        <span>Data from Frankfurter API (ECB rates)</span>
      </div>
    </Section>
  )
}

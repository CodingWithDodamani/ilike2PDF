import { useState, useMemo } from 'react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

export default function LoanCalculator() {
  const [principal, setPrincipal] = useState('250000')
  const [rate, setRate] = useState('6.5')
  const [years, setYears] = useState('30')

  const result = useMemo(() => {
    const p = parseFloat(principal) || 0
    const r = (parseFloat(rate) || 0) / 100 / 12
    const n = (parseFloat(years) || 0) * 12

    if (p <= 0 || r <= 0 || n <= 0) return null

    const monthly = p * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    const totalPaid = monthly * n
    const totalInterest = totalPaid - p

    // Amortization schedule (first 12 months)
    const schedule: { month: number; payment: number; principal: number; interest: number; balance: number }[] = []
    let balance = p
    for (let m = 1; m <= Math.min(12, n); m++) {
      const interestPayment = balance * r
      const principalPayment = monthly - interestPayment
      balance -= principalPayment
      schedule.push({
        month: m,
        payment: monthly,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
      })
    }

    // Yearly summary
    const yearly: { year: number; paid: number; principal: number; interest: number; balance: number }[] = []
    balance = p
    let yearPrincipal = 0, yearInterest = 0, yearPaid = 0
    for (let m = 1; m <= n; m++) {
      const intPmt = balance * r
      const prinPmt = monthly - intPmt
      balance -= prinPmt
      yearPrincipal += prinPmt
      yearInterest += intPmt
      yearPaid += monthly
      if (m % 12 === 0) {
        yearly.push({
          year: m / 12,
          paid: yearPaid,
          principal: yearPrincipal,
          interest: yearInterest,
          balance: Math.max(0, balance),
        })
        yearPrincipal = 0; yearInterest = 0; yearPaid = 0
      }
    }

    return { monthly, totalPaid, totalInterest, schedule, yearly }
  }, [principal, rate, years])

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Loan / EMI Calculator</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Calculate monthly payments, total interest, and view amortization schedule.
      </p>

      {/* Inputs */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div>
          <label className="label">Loan Amount (₹)</label>
          <input type="number" className="input w-full text-sm font-mono" value={principal}
            onChange={e => setPrincipal(e.target.value)} placeholder="250000" min="0" />
        </div>
        <div>
          <label className="label">Interest Rate (%)</label>
          <input type="number" className="input w-full text-sm font-mono" value={rate}
            onChange={e => setRate(e.target.value)} placeholder="6.5" min="0" step="0.1" />
        </div>
        <div>
          <label className="label">Term (years)</label>
          <input type="number" className="input w-full text-sm font-mono" value={years}
            onChange={e => setYears(e.target.value)} placeholder="30" min="1" max="50" />
        </div>
      </div>

      {/* Quick terms */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {[5, 10, 15, 20, 25, 30].map(y => (
          <button key={y} onClick={() => setYears(String(y))}
            className={cn('px-3 py-1 rounded-lg text-xs font-mono transition',
              years === String(y) ? 'bg-brand-500 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700')}>
            {y}y
          </button>
        ))}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-3">
          <div className="card p-5 bg-gradient-to-br from-brand-500/5 to-accent-400/5 text-center">
            <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">Monthly Payment</p>
            <p className="text-4xl font-bold gradient-text font-mono">₹{result.monthly.toFixed(2)}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="card p-4 text-center">
              <p className="text-xs text-ink-400 mb-1">Total Paid</p>
              <p className="text-xl font-bold font-mono">₹{result.totalPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-ink-400 mb-1">Total Interest</p>
              <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                ₹{result.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Interest ratio bar */}
          <div className="card p-4">
            <p className="label mb-2">Payment Breakdown</p>
            <div className="h-4 rounded-full overflow-hidden flex mb-2">
              <div className="h-full bg-brand-500" style={{ width: `${(parseFloat(principal) / result.totalPaid) * 100}%` }} />
              <div className="h-full bg-amber-500" style={{ width: `${(result.totalInterest / result.totalPaid) * 100}%` }} />
            </div>
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-500" /> Principal ({((parseFloat(principal) / result.totalPaid) * 100).toFixed(0)}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Interest ({(result.totalInterest / result.totalPaid * 100).toFixed(0)}%)</span>
            </div>
          </div>

          {/* Yearly schedule */}
          <div>
            <p className="label mb-2">Amortization (Yearly)</p>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {result.yearly.map(y => (
                <div key={y.year} className="flex items-center gap-3 text-xs font-mono bg-ink-50 dark:bg-ink-900 rounded-lg px-3 py-2">
                  <span className="w-8 text-ink-400">Y{y.year}</span>
                  <span className="flex-1">Pmt: ₹{y.paid.toFixed(0)}</span>
                  <span className="text-brand-600 dark:text-brand-300">Prin: ₹{y.principal.toFixed(0)}</span>
                  <span className="text-amber-600 dark:text-amber-400">Int: ₹{y.interest.toFixed(0)}</span>
                  <span className="text-ink-400">Bal: ₹{y.balance.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Section>
  )
}

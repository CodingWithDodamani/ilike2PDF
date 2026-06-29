import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin', className)} role="status" aria-label="Loading" />
}

export function Section({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('card p-4 sm:p-5', className)}>{children}</section>
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {React.isValidElement(children) ? React.cloneElement(children as React.ReactElement<{ id?: string }>, { id }) : children}
      {hint && <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">{hint}</p>}
    </div>
  )
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-ink-200 dark:bg-ink-800 overflow-hidden" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ ease: 'easeOut' }}
      />
    </div>
  )
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="card p-3">
      <p className="text-[11px] uppercase tracking-wide text-ink-500 dark:text-ink-400">{label}</p>
      <p className="text-xl font-bold mt-0.5 gradient-text">{value}</p>
      {sub && <p className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export function Segmented<T extends string>({
  options, value, onChange, ariaLabel, id,
}: { options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; ariaLabel?: string; id?: string }) {
  return (
    <div id={id} role="tablist" aria-label={ariaLabel} className="inline-flex flex-wrap gap-1 rounded-xl bg-ink-100 dark:bg-ink-850 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'px-2.5 py-1.5 rounded-lg text-xs font-medium transition focus-ring',
            value === o.value ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-300 shadow' : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ResultBar({ inputSize, outputSize }: { inputSize: number; outputSize: number }) {
  const saved = inputSize - outputSize
  const pct = inputSize ? Math.round((saved / inputSize) * 100) : 0
  const positive = saved > 0
  return (
    <div className={cn(
      'rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-2 flex-wrap',
      positive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300'
    )}>
      <span>{positive ? `Reduced by ${pct}%` : 'Size change'}</span>
      <span className="font-mono">{formatPair(inputSize, outputSize)}</span>
    </div>
  )
}

function formatPair(a: number, b: number) {
  const f = (n: number) => {
    const k = 1024
    const u = ['B', 'KB', 'MB', 'GB']
    const i = Math.min(Math.floor(Math.log(Math.max(n, 1)) / Math.log(k)), u.length - 1)
    return `${(n / Math.pow(k, i)).toFixed(1)} ${u[i]}`
  }
  return `${f(a)} → ${f(b)}`
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return <p className="text-sm text-ink-500 dark:text-ink-400 text-center py-8">{children}</p>
}

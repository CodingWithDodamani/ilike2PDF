import { useState, useMemo } from 'react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'
import { Clock, Copy, Check } from 'lucide-react'
import { CronExpressionParser } from 'cron-parser'

type FieldName = 'minute' | 'hour' | 'dom' | 'month' | 'dow'
type FieldType = 'every' | 'every-x' | 'specific'

interface FieldState {
  type: FieldType
  value: string
}

const PRESETS = [
  { label: 'Every minute', cron: '* * * * *' },
  { label: 'Every 15 min', cron: '*/15 * * * *' },
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Every day (midnight)', cron: '0 0 * * *' },
  { label: 'Every Monday', cron: '0 0 * * 1' },
  { label: 'Weekdays 9am', cron: '0 9 * * 1-5' },
]

const FIELD_LABELS: Record<FieldName, string> = {
  minute: 'Minute',
  hour: 'Hour',
  dom: 'Day of Month',
  month: 'Month',
  dow: 'Day of Week',
}

function buildFieldCron(field: FieldState): string {
  switch (field.type) {
    case 'every':
      return '*'
    case 'every-x': {
      const n = parseInt(field.value)
      if (isNaN(n) || n < 1) return '*'
      return `*/${n}`
    }
    case 'specific':
      return field.value.trim() || '*'
    default:
      return '*'
  }
}

export default function CronGenerator() {
  const [fields, setFields] = useState<Record<FieldName, FieldState>>({
    minute: { type: 'every', value: '0' },
    hour: { type: 'every', value: '0' },
    dom: { type: 'every', value: '0' },
    month: { type: 'every', value: '0' },
    dow: { type: 'every', value: '0' },
  })
  const [copied, setCopied] = useState(false)

  const cron = useMemo(() => {
    return `${buildFieldCron(fields.minute)} ${buildFieldCron(fields.hour)} ${buildFieldCron(fields.dom)} ${buildFieldCron(fields.month)} ${buildFieldCron(fields.dow)}`
  }, [fields])

  const nextRuns = useMemo(() => {
    try {
      const interval = CronExpressionParser.parse(cron)
      return Array.from({ length: 5 }, () => {
        const next = interval.next()
        return next.toDate().toLocaleString()
      })
    } catch {
      return []
    }
  }, [cron])

  const updateField = (name: FieldName, patch: Partial<FieldState>) => {
    setFields(prev => ({ ...prev, [name]: { ...prev[name], ...patch } }))
  }

  const applyPreset = (presetCron: string) => {
    const parts = presetCron.split(' ')
    if (parts.length !== 5) return
    const names: FieldName[] = ['minute', 'hour', 'dom', 'month', 'dow']
    const next = { ...fields }
    parts.forEach((part, i) => {
      const name = names[i]
      if (part === '*') {
        next[name] = { type: 'every', value: '0' }
      } else if (part.startsWith('*/')) {
        next[name] = { type: 'every-x', value: part.slice(2) }
      } else {
        next[name] = { type: 'specific', value: part }
      }
    })
    setFields(next)
  }

  const copy = () => {
    navigator.clipboard.writeText(cron)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Cron Expression Generator</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Build cron schedules visually with next-run preview.
      </p>

      <div className="space-y-4 mb-5">
        {(Object.keys(fields) as FieldName[]).map(name => {
          const field = fields[name]
          return (
            <div key={name}>
              <label className="label mb-1.5">{FIELD_LABELS[name]}</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {([
                  { type: 'every' as const, label: 'Every (*)' },
                  { type: 'every-x' as const, label: 'Every X (*/X)' },
                  { type: 'specific' as const, label: 'Specific' },
                ]).map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => updateField(name, { type: opt.type })}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition',
                      field.type === opt.type
                        ? 'bg-brand-500 text-white'
                        : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {field.type === 'every-x' && (
                <input
                  type="number"
                  min={1}
                  className="input w-24 text-sm font-mono"
                  value={field.value}
                  onChange={e => updateField(name, { value: e.target.value })}
                  placeholder="e.g. 5"
                />
              )}
              {field.type === 'specific' && (
                <input
                  type="text"
                  className="input w-full text-sm font-mono"
                  value={field.value}
                  onChange={e => updateField(name, { value: e.target.value })}
                  placeholder={name === 'minute' ? 'e.g. 0,15,30,45' : name === 'hour' ? 'e.g. 9,12,18' : name === 'dom' ? 'e.g. 1,15' : name === 'month' ? 'e.g. 1,6,12' : 'e.g. 1-5'}
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <label className="label mb-0">Generated Expression</label>
          <button onClick={copy} className="flex items-center gap-1.5 text-xs text-ink-500 hover:text-brand-500 transition">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="card p-4 bg-ink-50 dark:bg-ink-900 font-mono text-lg tracking-wide text-center">
          {cron}
        </div>
      </div>

      <div className="mb-5">
        <p className="label mb-2">Presets</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(p => (
            <button
              key={p.cron}
              onClick={() => applyPreset(p.cron)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700 transition"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {nextRuns.length > 0 && (
        <div>
          <p className="label mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Next 5 Runs
          </p>
          <div className="space-y-1">
            {nextRuns.map((run, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-mono text-ink-600 dark:text-ink-300 bg-ink-50 dark:bg-ink-900 rounded-lg px-3 py-1.5">
                <span className="text-ink-400 dark:text-ink-500 w-4">{i + 1}.</span>
                <span>{run}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {nextRuns.length === 0 && (
        <div className="text-center py-4">
          <p className="text-xs text-ink-400 dark:text-ink-500">Invalid cron expression</p>
        </div>
      )}
    </Section>
  )
}

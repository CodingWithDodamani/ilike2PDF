import { useState } from 'react'
import { Calculator } from 'lucide-react'
import { Field, Segmented, Stat } from '@/components/ui'

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const
type Unit = typeof UNITS[number]
const FACTOR: Record<Unit, number> = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 }
const SPEEDS = [{ label: '1 Mbps (slow)', bps: 1e6 / 8 }, { label: '10 Mbps', bps: 10e6 / 8 }, { label: '100 Mbps', bps: 100e6 / 8 }, { label: '1 Gbps (fast)', bps: 1e9 / 8 }]

export default function FileSize() {
  const [value, setValue] = useState(500)
  const [unit, setUnit] = useState<Unit>('MB')
  const bytes = value * FACTOR[unit]

  const fmtTime = (s: number) => {
    if (s < 1) return '<1s'
    if (s < 60) return `${Math.round(s)}s`
    if (s < 3600) return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`
    return `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}m`
  }

  return (
    <div className="grid gap-5">
      <div className="card p-5 grid gap-4">
        <div className="flex items-end gap-3 flex-wrap">
          <Field label="Size"><input type="number" min={0} value={value} onChange={(e) => setValue(Math.max(0, +e.target.value))} className="input w-40" /></Field>
          <Field label="Unit"><Segmented value={unit} onChange={setUnit} options={UNITS.map((u) => ({ value: u, label: u }))} /></Field>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {UNITS.map((u) => <Stat key={u} label={u} value={(bytes / FACTOR[u]).toLocaleString(undefined, { maximumFractionDigits: 3 })} />)}
      </div>
      <div className="card p-5">
        <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Calculator className="h-4 w-4 text-brand-500" /> Estimated transfer time</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SPEEDS.map((s) => <Stat key={s.label} label={s.label} value={fmtTime(bytes / s.bps)} />)}
        </div>
      </div>
    </div>
  )
}

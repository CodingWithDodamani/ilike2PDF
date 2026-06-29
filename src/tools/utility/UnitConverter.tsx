import { useState, useMemo } from 'react'
import { ArrowUpDown, Copy, Check } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

interface UnitGroup {
  name: string
  icon: string
  units: { code: string; name: string; factor: number }[]
}

const UNIT_GROUPS: UnitGroup[] = [
  {
    name: 'Length', icon: '📏',
    units: [
      { code: 'mm', name: 'Millimeter', factor: 0.001 },
      { code: 'cm', name: 'Centimeter', factor: 0.01 },
      { code: 'm', name: 'Meter', factor: 1 },
      { code: 'km', name: 'Kilometer', factor: 1000 },
      { code: 'in', name: 'Inch', factor: 0.0254 },
      { code: 'ft', name: 'Foot', factor: 0.3048 },
      { code: 'yd', name: 'Yard', factor: 0.9144 },
      { code: 'mi', name: 'Mile', factor: 1609.344 },
      { code: 'nmi', name: 'Nautical Mile', factor: 1852 },
      { code: 'μm', name: 'Micrometer', factor: 1e-6 },
      { code: 'nm', name: 'Nanometer', factor: 1e-9 },
      { code: 'pm', name: 'Picometer', factor: 1e-12 },
      { code: 'Å', name: 'Ångström', factor: 1e-10 },
    ],
  },
  {
    name: 'Weight / Mass', icon: '⚖️',
    units: [
      { code: 'mg', name: 'Milligram', factor: 0.000001 },
      { code: 'g', name: 'Gram', factor: 0.001 },
      { code: 'kg', name: 'Kilogram', factor: 1 },
      { code: 't', name: 'Metric Ton', factor: 1000 },
      { code: 'oz', name: 'Ounce', factor: 0.028349523125 },
      { code: 'lb', name: 'Pound', factor: 0.45359237 },
      { code: 'st', name: 'Stone', factor: 6.35029318 },
      { code: 'ct', name: 'Carat', factor: 0.0002 },
      { code: 'gr', name: 'Grain', factor: 0.00006479891 },
      { code: 'dr', name: 'Dram', factor: 0.001771845 },
    ],
  },
  {
    name: 'Temperature', icon: '🌡️',
    units: [
      { code: '°C', name: 'Celsius', factor: 0 },
      { code: '°F', name: 'Fahrenheit', factor: 0 },
      { code: 'K', name: 'Kelvin', factor: 0 },
    ],
  },
  {
    name: 'Area', icon: '📐',
    units: [
      { code: 'mm²', name: 'Sq. Millimeter', factor: 1e-6 },
      { code: 'cm²', name: 'Sq. Centimeter', factor: 1e-4 },
      { code: 'm²', name: 'Sq. Meter', factor: 1 },
      { code: 'km²', name: 'Sq. Kilometer', factor: 1e6 },
      { code: 'ha', name: 'Hectare', factor: 10000 },
      { code: 'in²', name: 'Sq. Inch', factor: 0.00064516 },
      { code: 'ft²', name: 'Sq. Foot', factor: 0.09290304 },
      { code: 'yd²', name: 'Sq. Yard', factor: 0.83612736 },
      { code: 'ac', name: 'Acre', factor: 4046.8564224 },
      { code: 'mi²', name: 'Sq. Mile', factor: 2589988.110336 },
    ],
  },
  {
    name: 'Volume', icon: '🧪',
    units: [
      { code: 'mL', name: 'Milliliter', factor: 0.000001 },
      { code: 'L', name: 'Liter', factor: 0.001 },
      { code: 'm³', name: 'Cubic Meter', factor: 1 },
      { code: 'tsp', name: 'Teaspoon', factor: 4.92892e-6 },
      { code: 'tbsp', name: 'Tablespoon', factor: 1.47868e-5 },
      { code: 'fl oz', name: 'Fluid Ounce (US)', factor: 2.95735e-5 },
      { code: 'cup', name: 'Cup (US)', factor: 0.000236588 },
      { code: 'pt', name: 'Pint (US)', factor: 0.000473176 },
      { code: 'qt', name: 'Quart (US)', factor: 0.000946353 },
      { code: 'gal', name: 'Gallon (US)', factor: 0.00378541 },
      { code: 'gal UK', name: 'Gallon (UK)', factor: 0.00454609 },
    ],
  },
  {
    name: 'Speed', icon: '🏎️',
    units: [
      { code: 'm/s', name: 'Meters/Second', factor: 1 },
      { code: 'km/h', name: 'Kilometers/Hour', factor: 0.277778 },
      { code: 'mph', name: 'Miles/Hour', factor: 0.44704 },
      { code: 'kn', name: 'Knots', factor: 0.514444 },
      { code: 'ft/s', name: 'Feet/Second', factor: 0.3048 },
      { code: 'mach', name: 'Mach', factor: 343 },
    ],
  },
  {
    name: 'Data Storage', icon: '💾',
    units: [
      { code: 'bit', name: 'Bit', factor: 1 },
      { code: 'B', name: 'Byte', factor: 8 },
      { code: 'KB', name: 'Kilobyte', factor: 8192 },
      { code: 'KiB', name: 'Kibibyte', factor: 8192 },
      { code: 'MB', name: 'Megabyte', factor: 8388608 },
      { code: 'MiB', name: 'Mebibyte', factor: 8388608 },
      { code: 'GB', name: 'Gigabyte', factor: 8589934592 },
      { code: 'GiB', name: 'Gibibyte', factor: 8589934592 },
      { code: 'TB', name: 'Terabyte', factor: 8796093022208 },
      { code: 'TiB', name: 'Tebibyte', factor: 8796093022208 },
      { code: 'PB', name: 'Petabyte', factor: 9007199254740992 },
    ],
  },
  {
    name: 'Time', icon: '⏱️',
    units: [
      { code: 'ns', name: 'Nanosecond', factor: 1e-9 },
      { code: 'μs', name: 'Microsecond', factor: 1e-6 },
      { code: 'ms', name: 'Millisecond', factor: 0.001 },
      { code: 's', name: 'Second', factor: 1 },
      { code: 'min', name: 'Minute', factor: 60 },
      { code: 'hr', name: 'Hour', factor: 3600 },
      { code: 'day', name: 'Day', factor: 86400 },
      { code: 'wk', name: 'Week', factor: 604800 },
      { code: 'mo', name: 'Month (30d)', factor: 2592000 },
      { code: 'yr', name: 'Year (365d)', factor: 31536000 },
    ],
  },
  {
    name: 'Angle', icon: '📐',
    units: [
      { code: 'deg', name: 'Degree', factor: 1 },
      { code: 'rad', name: 'Radian', factor: 57.2957795 },
      { code: 'grad', name: 'Gradian', factor: 0.9 },
      { code: 'arcmin', name: 'Arcminute', factor: 1 / 60 },
      { code: 'arcsec', name: 'Arcsecond', factor: 1 / 3600 },
      { code: 'rev', name: 'Revolution', factor: 360 },
    ],
  },
]

function convertTemperature(value: number, from: string, to: string): number {
  let celsius: number
  switch (from) {
    case '°C': celsius = value; break
    case '°F': celsius = (value - 32) * 5 / 9; break
    case 'K': celsius = value - 273.15; break
    default: return value
  }
  switch (to) {
    case '°C': return celsius
    case '°F': return celsius * 9 / 5 + 32
    case 'K': return celsius + 273.15
    default: return celsius
  }
}

function formatValue(v: number): string {
  if (v === 0) return '0'
  if (Math.abs(v) >= 1e15) return v.toExponential(4)
  if (Math.abs(v) >= 1e6) return v.toLocaleString(undefined, { maximumFractionDigits: 0 })
  if (Math.abs(v) >= 1) return v.toLocaleString(undefined, { maximumFractionDigits: 6 })
  if (Math.abs(v) >= 0.001) return v.toFixed(6)
  return v.toExponential(4)
}

export default function UnitConverter() {
  const [groupIdx, setGroupIdx] = useState(0)
  const [fromUnit, setFromUnit] = useState('m')
  const [toUnit, setToUnit] = useState('ft')
  const [amount, setAmount] = useState('1')
  const [copied, setCopied] = useState(false)

  const group = UNIT_GROUPS[groupIdx]

  const selectGroup = (idx: number) => {
    setGroupIdx(idx)
    const g = UNIT_GROUPS[idx]
    setFromUnit(g.units[0].code)
    setToUnit(g.units[1]?.code || g.units[0].code)
    setAmount('1')
  }

  const result = useMemo(() => {
    const n = parseFloat(amount)
    if (isNaN(n)) return null
    if (group.name === 'Temperature') return convertTemperature(n, fromUnit, toUnit)
    const fromFactor = group.units.find(u => u.code === fromUnit)?.factor ?? 1
    const toFactor = group.units.find(u => u.code === toUnit)?.factor ?? 1
    return (n * fromFactor) / toFactor
  }, [amount, fromUnit, toUnit, group])

  const swap = () => { setFromUnit(toUnit); setToUnit(fromUnit) }

  const copyResult = () => {
    if (result === null) return
    navigator.clipboard.writeText(formatValue(result))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const UnitSelect = ({
    value, onChange, label,
  }: {
    value: string; onChange: (v: string) => void; label: string
  }) => (
    <div className="flex-1 min-w-0">
      <label className="label">{label}</label>
      <div className="h-52 overflow-y-auto rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900">
        {group.units.map(u => (
          <button
            key={u.code}
            onClick={() => onChange(u.code)}
            className={cn(
              'w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-ink-100 dark:hover:bg-ink-800 transition',
              value === u.code && 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300 font-medium'
            )}
          >
            <span className="truncate">
              <span className="font-mono font-semibold">{u.code}</span>
              <span className="text-ink-500 dark:text-ink-400 ml-2 text-xs">{u.name}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Unit Converter</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Convert between 100+ units across 9 categories. Instant real-time conversion.
      </p>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {UNIT_GROUPS.map((g, i) => (
          <button
            key={g.name}
            onClick={() => selectGroup(i)}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition',
              i === groupIdx
                ? 'bg-brand-500 text-white shadow'
                : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700'
            )}
          >
            <span className="mr-1">{g.icon}</span>
            {g.name}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className="mb-4">
        <label className="label">Value</label>
        <input
          type="number"
          className="input w-full text-lg font-mono"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          aria-label="Value to convert"
        />
      </div>

      {/* Unit selectors */}
      <div className="flex gap-3 items-start">
        <UnitSelect value={fromUnit} onChange={setFromUnit} label="From" />
        <button
          onClick={swap}
          className="mt-8 p-2 rounded-xl bg-ink-100 dark:bg-ink-800 hover:bg-ink-200 dark:hover:bg-ink-700 transition shrink-0"
          aria-label="Swap units"
        >
          <ArrowUpDown className="w-5 h-5 text-ink-600 dark:text-ink-300" />
        </button>
        <UnitSelect value={toUnit} onChange={setToUnit} label="To" />
      </div>

      {/* Result */}
      {result !== null && (
        <div className="mt-5 card p-5 bg-gradient-to-br from-brand-500/5 to-accent-400/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-ink-500 dark:text-ink-400 mb-1">
                {parseFloat(amount).toLocaleString()} {fromUnit} =
              </p>
              <p className="text-3xl font-bold gradient-text font-mono">
                {formatValue(result)} {toUnit}
              </p>
              <p className="text-xs text-ink-400 dark:text-ink-500 mt-1">
                1 {fromUnit} = {formatValue(
                  group.name === 'Temperature'
                    ? convertTemperature(1, fromUnit, toUnit)
                    : (group.units.find(u => u.code === fromUnit)?.factor ?? 1) /
                      (group.units.find(u => u.code === toUnit)?.factor ?? 1)
                )} {toUnit}
              </p>
            </div>
            <button
              onClick={copyResult}
              className="p-2 rounded-lg text-ink-400 hover:text-brand-500 transition"
              aria-label="Copy result"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Quick formulas for temperature */}
      {group.name === 'Temperature' && (
        <div className="mt-4 text-xs text-ink-400 dark:text-ink-500 space-y-0.5">
          <p>°F = °C × 9/5 + 32</p>
          <p>°C = (°F − 32) × 5/9</p>
          <p>K = °C + 273.15</p>
        </div>
      )}
    </Section>
  )
}

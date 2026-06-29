import { useState, useMemo } from 'react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

type Unit = 'metric' | 'imperial'

const BMI_CATEGORIES = [
  { label: 'Underweight', min: 0, max: 18.5, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Normal', min: 18.5, max: 25, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { label: 'Overweight', min: 25, max: 30, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { label: 'Obese', min: 30, max: 100, color: 'text-red-500', bg: 'bg-red-500/10' },
]

function getBmiCategory(bmi: number) {
  return BMI_CATEGORIES.find(c => bmi >= c.min && bmi < c.max) || BMI_CATEGORIES[3]
}

function idealWeightRange(heightCm: number): { min: number; max: number } {
  const h = heightCm / 100
  return { min: Math.round(18.5 * h * h), max: Math.round(24.9 * h * h) }
}

export default function BmiCalculator() {
  const [unit, setUnit] = useState<Unit>('metric')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [feet, setFeet] = useState('')
  const [inches, setInches] = useState('')
  const [lbs, setLbs] = useState('')

  const result = useMemo(() => {
    let heightM: number, weightKg: number

    if (unit === 'metric') {
      heightM = parseFloat(height) / 100
      weightKg = parseFloat(weight)
    } else {
      const totalInches = (parseFloat(feet) || 0) * 12 + (parseFloat(inches) || 0)
      heightM = totalInches * 0.0254
      weightKg = (parseFloat(lbs) || 0) * 0.453592
    }

    if (!heightM || !weightKg || heightM <= 0 || weightKg <= 0) return null

    const bmi = weightKg / (heightM * heightM)
    const category = getBmiCategory(bmi)
    const idealRange = idealWeightRange(heightM * 100)
    const minWeight = 18.5 * heightM * heightM
    const maxWeight = 24.9 * heightM * heightM

    return { bmi, category, idealRange, minWeight, maxWeight }
  }, [unit, height, weight, feet, inches, lbs])

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">BMI Calculator</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Calculate your Body Mass Index with ideal weight range.
      </p>

      {/* Unit toggle */}
      <div className="flex rounded-xl bg-ink-100 dark:bg-ink-850 p-1 mb-4">
        {(['metric', 'imperial'] as const).map(u => (
          <button key={u} onClick={() => setUnit(u)}
            className={cn('flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition capitalize',
              unit === u ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-300 shadow' : 'text-ink-600 dark:text-ink-300')}>
            {u === 'metric' ? 'Metric (kg/cm)' : 'Imperial (lbs/ft)'}
          </button>
        ))}
      </div>

      {/* Inputs */}
      {unit === 'metric' ? (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="label">Height (cm)</label>
            <input type="number" className="input w-full text-sm font-mono" value={height}
              onChange={e => setHeight(e.target.value)} placeholder="170" min="0" />
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input type="number" className="input w-full text-sm font-mono" value={weight}
              onChange={e => setWeight(e.target.value)} placeholder="70" min="0" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div>
            <label className="label">Feet</label>
            <input type="number" className="input w-full text-sm font-mono" value={feet}
              onChange={e => setFeet(e.target.value)} placeholder="5" min="0" />
          </div>
          <div>
            <label className="label">Inches</label>
            <input type="number" className="input w-full text-sm font-mono" value={inches}
              onChange={e => setInches(e.target.value)} placeholder="7" min="0" max="11" />
          </div>
          <div>
            <label className="label">Weight (lbs)</label>
            <input type="number" className="input w-full text-sm font-mono" value={lbs}
              onChange={e => setLbs(e.target.value)} placeholder="154" min="0" />
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3">
          {/* BMI value */}
          <div className={cn('card p-5 text-center', result.category.bg)}>
            <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">Your BMI</p>
            <p className={cn('text-5xl font-bold font-mono', result.category.color)}>
              {result.bmi.toFixed(1)}
            </p>
            <p className={cn('text-lg font-semibold mt-1', result.category.color)}>
              {result.category.label}
            </p>
          </div>

          {/* BMI scale */}
          <div className="card p-4">
            <p className="label mb-3">BMI Scale</p>
            <div className="relative h-4 rounded-full overflow-hidden mb-2">
              <div className="absolute inset-0 flex">
                <div className="h-full bg-blue-400" style={{ width: `${(18.5 / 40) * 100}%` }} />
                <div className="h-full bg-emerald-400" style={{ width: `${((25 - 18.5) / 40) * 100}%` }} />
                <div className="h-full bg-amber-400" style={{ width: `${((30 - 25) / 40) * 100}%` }} />
                <div className="h-full bg-red-400 flex-1" />
              </div>
            </div>
            {/* Indicator */}
            <div className="relative h-6">
              <div className="absolute top-0 w-0.5 h-4 bg-ink-900 dark:bg-white"
                style={{ left: `${Math.min(100, (result.bmi / 40) * 100)}%` }} />
            </div>
            <div className="flex justify-between text-xs text-ink-400 dark:text-ink-500">
              <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-2">
            <div className="card p-3 text-center">
              <p className="text-xs text-ink-400 mb-1">Ideal Range</p>
              <p className="text-sm font-bold font-mono">
                {result.idealRange.min} – {result.idealRange.max} kg
              </p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-xs text-ink-400 mb-1">Normal BMI</p>
              <p className="text-sm font-bold font-mono">18.5 – 25.0</p>
            </div>
          </div>

          {/* Weight to lose/gain */}
          {result.bmi > 25 && (
            <div className="rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 px-4 py-3 text-sm text-center">
              To reach normal BMI, aim for {result.maxWeight.toFixed(0)} kg ({(result.maxWeight - result.bmi * (parseFloat(height) / 100 || parseFloat(feet) * 0.3048 + parseFloat(inches) * 0.0254 || 1.7) ** 2 || 0).toFixed(0)} kg loss)
            </div>
          )}
          {result.bmi < 18.5 && (
            <div className="rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-3 text-sm text-center">
              To reach normal BMI, aim for {result.minWeight.toFixed(0)} kg
            </div>
          )}
        </div>
      )}

      {/* Reference */}
      <div className="mt-4">
        <p className="label mb-2">BMI Categories</p>
        <div className="space-y-1">
          {BMI_CATEGORIES.map(c => (
            <div key={c.label} className="flex items-center justify-between text-xs">
              <span className={c.color}>{c.label}</span>
              <span className="text-ink-400 dark:text-ink-500 font-mono">
                {c.min} – {c.max === 100 ? '40+' : c.max}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

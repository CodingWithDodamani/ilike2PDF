import { useState, useCallback } from 'react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

const BUTTONS = [
  ['sin', 'cos', 'tan', 'π', 'e'],
  ['sin⁻¹', 'cos⁻¹', 'tan⁻¹', '√', 'x²'],
  ['log', 'ln', 'xʸ', '(', ')'],
  ['7', '8', '9', '÷', 'C'],
  ['4', '5', '6', '×', '⌫'],
  ['1', '2', '3', '−', '%'],
  ['0', '.', '±', '+', '='],
]

function evalExpression(expr: string): number {
  // Replace symbols
  const e = expr
    .replace(/π/g, `${Math.PI}`)
    .replace(/e(?![xp])/g, `${Math.E}`)
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/√(\d+)/g, 'Math.sqrt($1)')
    .replace(/x²/g, '**2')
    .replace(/(\d+)xʸ(\d+)/g, 'Math.pow($1,$2)')
    .replace(/log\(([^)]+)\)/g, 'Math.log10($1)')
    .replace(/ln\(([^)]+)\)/g, 'Math.log($1)')
    .replace(/sin\(([^)]+)\)/g, 'Math.sin($1*Math.PI/180)')
    .replace(/cos\(([^)]+)\)/g, 'Math.cos($1*Math.PI/180)')
    .replace(/tan\(([^)]+)\)/g, 'Math.tan($1*Math.PI/180)')
    .replace(/sin⁻¹\(([^)]+)\)/g, 'Math.asin($1)*180/Math.PI')
    .replace(/cos⁻¹\(([^)]+)\)/g, 'Math.acos($1)*180/Math.PI')
    .replace(/tan⁻¹\(([^)]+)\)/g, 'Math.atan($1)*180/Math.PI')

  // Simple eval for safe math expressions
   
  const result = new Function(`"use strict"; return (${e})`)()
  if (typeof result !== 'number' || !isFinite(result)) throw new Error('Invalid')
  return result
}

export default function ScientificCalculator() {
  const [display, setDisplay] = useState('0')
  const [expr, setExpr] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [memory, setMemory] = useState(0)

  const handleButton = useCallback((btn: string) => {
    if (btn === 'C') { setDisplay('0'); setExpr(''); return }
    if (btn === '⌫') {
      setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0')
      return
    }
    if (btn === '±') {
      setDisplay(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev)
      return
    }
    if (btn === '=') {
      try {
        const fullExpr = expr + display
        const result = evalExpression(fullExpr)
        const formatted = Number.isInteger(result) ? String(result) : result.toFixed(8).replace(/\.?0+$/, '')
        setHistory(prev => [`${fullExpr} = ${formatted}`, ...prev].slice(0, 20))
        setDisplay(formatted)
        setExpr('')
      } catch {
        setDisplay('Error')
        setExpr('')
      }
      return
    }
    if (['+', '−', '×', '÷', 'xʸ', '%'].includes(btn)) {
      setExpr(prev => prev + display + btn)
      setDisplay('0')
      return
    }
    if (['sin', 'cos', 'tan', 'sin⁻¹', 'cos⁻¹', 'tan⁻¹', 'log', 'ln', '√'].includes(btn)) {
      setExpr(prev => prev + btn + '(')
      setDisplay('0')
      return
    }
    if (btn === 'x²') {
      setExpr(prev => prev + display + 'x²')
      setDisplay('0')
      return
    }
    if (btn === 'π') { setDisplay(String(Math.PI)); return }
    if (btn === 'e') { setDisplay(String(Math.E)); return }
    if (btn === '(' || btn === ')') {
      setExpr(prev => prev + btn)
      return
    }
    // Numbers and decimal
    if (btn === '.' && display.includes('.')) return
    setDisplay(prev => prev === '0' ? btn : prev + btn)
  }, [display, expr])

  const getBtnStyle = (btn: string) => {
    if (btn === '=') return 'bg-brand-500 text-white font-bold'
    if (btn === 'C' || btn === '⌫') return 'bg-red-500/10 text-red-600 dark:text-red-400'
    if (['sin', 'cos', 'tan', 'sin⁻¹', 'cos⁻¹', 'tan⁻¹', 'log', 'ln', '√', 'π', 'e', 'x²', 'xʸ'].includes(btn))
      return 'bg-ink-200/50 dark:bg-ink-700/50 text-ink-700 dark:text-ink-200'
    if (['+', '−', '×', '÷', '%', '(', ')'].includes(btn))
      return 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
    return 'bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-200'
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Scientific Calculator</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Full scientific calculator with trigonometry, logarithms, and history.
      </p>

      {/* Display */}
      <div className="card p-4 mb-3 bg-ink-50 dark:bg-ink-900">
        {expr && (
          <p className="text-xs text-ink-400 dark:text-ink-500 text-right font-mono truncate mb-1">{expr}</p>
        )}
        <p className="text-3xl font-bold font-mono text-right gradient-text truncate">{display}</p>
      </div>

      {/* Memory */}
      <div className="flex gap-2 mb-3">
        <button onClick={() => setMemory(0)} className="btn-ghost px-2 py-1 text-xs rounded-lg">MC</button>
        <button onClick={() => setDisplay(String(memory))} className="btn-ghost px-2 py-1 text-xs rounded-lg">MR</button>
        <button onClick={() => setMemory(m => m + parseFloat(display) || 0)} className="btn-ghost px-2 py-1 text-xs rounded-lg">M+</button>
        <button onClick={() => setMemory(m => m - parseFloat(display) || 0)} className="btn-ghost px-2 py-1 text-xs rounded-lg">M−</button>
        <span className="ml-auto text-xs text-ink-400 dark:text-ink-500 flex items-center gap-1">
          {memory !== 0 && `M: ${memory}`}
        </span>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-5 gap-1.5">
        {BUTTONS.flat().map((btn) => (
          <button key={btn} onClick={() => handleButton(btn)}
            className={cn(
              'h-12 rounded-xl text-sm font-medium transition active:scale-95',
              getBtnStyle(btn),
              btn === '=' && 'col-span-1',
            )}>
            {btn}
          </button>
        ))}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-4">
          <p className="label mb-2">History</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {history.map((h, i) => (
              <div key={i} className="text-xs font-mono text-ink-500 dark:text-ink-400 bg-ink-50 dark:bg-ink-900 rounded-lg px-3 py-1.5">
                {h}
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}

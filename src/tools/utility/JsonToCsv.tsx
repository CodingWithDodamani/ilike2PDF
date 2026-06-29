import { useState, useCallback, useMemo } from 'react'
import { Copy, Check, Download } from 'lucide-react'
import { Section, Segmented } from '@/components/ui'
import { downloadBlob } from '@/lib/utils'
import Papa from 'papaparse'

export default function JsonToCsv() {
  const [mode, setMode] = useState<'j2c' | 'c2j'>('j2c')
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const output = useMemo(() => {
    if (!input.trim()) { setError(''); return '' }
    try {
      if (mode === 'j2c') {
        const parsed = JSON.parse(input)
        const rows = Array.isArray(parsed) ? parsed : [parsed]
        if (rows.length === 0) { setError(''); return '' }
        if (typeof rows[0] !== 'object' || rows[0] === null) {
          setError('Input must be a JSON array of objects')
          return ''
        }
        const csv = Papa.unparse(rows)
        setError('')
        return csv
      } else {
        const result = Papa.parse(input.trim(), { header: true, skipEmptyLines: true })
        if (result.errors.length > 0) {
          setError(result.errors[0].message)
          return ''
        }
        setError('')
        return JSON.stringify(result.data, null, 2)
      }
    } catch (e: any) {
      setError(e.message)
      return ''
    }
  }, [input, mode])

  const handleModeChange = useCallback((v: 'j2c' | 'c2j') => {
    setMode(v)
    setInput('')
    setError('')
    setCopied(false)
  }, [])

  const handleCopy = useCallback(() => {
    if (!output) return
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [output])

  const handleDownload = useCallback(() => {
    if (!output) return
    const ext = mode === 'j2c' ? 'csv' : 'json'
    const type = mode === 'j2c' ? 'text/csv' : 'application/json'
    downloadBlob(new Blob([output], { type }), `output.${ext}`)
  }, [output, mode])

  const placeholder = mode === 'j2c'
    ? '[\n  { "name": "Alice", "age": 30 },\n  { "name": "Bob", "age": 25 }\n]'
    : 'name,age\nAlice,30\nBob,25'

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">JSON ↔ CSV Converter</h2>
      <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">Convert between JSON and CSV formats instantly.</p>

      <Segmented
        options={[
          { value: 'j2c' as const, label: 'JSON → CSV' },
          { value: 'c2j' as const, label: 'CSV → JSON' },
        ]}
        value={mode}
        onChange={handleModeChange}
        ariaLabel="Conversion mode"
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Input</label>
          <textarea
            className="input w-full h-56 font-mono text-sm resize-y"
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
          />
        </div>
        <div>
          <label className="label">Output</label>
          <textarea
            className="input w-full h-56 font-mono text-sm resize-y bg-ink-50 dark:bg-ink-900"
            value={output}
            readOnly
            placeholder="Output will appear here..."
          />
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-2 text-sm font-mono">
          {error}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleCopy}
          disabled={!output}
          className="btn-secondary btn-sm flex items-center gap-1.5"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          onClick={handleDownload}
          disabled={!output}
          className="btn-secondary btn-sm flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      </div>
    </Section>
  )
}

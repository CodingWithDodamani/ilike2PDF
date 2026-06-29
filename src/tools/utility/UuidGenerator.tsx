import { useState, useCallback } from 'react'
import { Copy, Check, RefreshCw, Download } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

function uuidv4(): string {
  return crypto.randomUUID()
}

function uuidv1(): string {
  const t = Date.now()
  const tHex = t.toString(16).padStart(12, '0')
  const timeLow = tHex.slice(0, 8)
  const timeMid = tHex.slice(8, 12)
  const timeHi = '1' + Math.random().toString(16).slice(2, 5)
  const clock = Math.random().toString(16).slice(2, 6)
  const node = Array.from(crypto.getRandomValues(new Uint8Array(6)), b => b.toString(16).padStart(2, '0')).join('')
  return `${timeLow}-${timeMid}-${timeHi}-${clock}-${node}`
}

function randomHex(len: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(len)), b => b.toString(16).padStart(2, '0')).join('')
}

export default function UuidGenerator() {
  const [version, setVersion] = useState<4 | 1 | 'short' | 'nano'>(4)
  const [count, setCount] = useState(5)
  const [uppercase, setUppercase] = useState(false)
  const [noDash, setNoDash] = useState(false)
  const [uuids, setUuids] = useState<string[]>([])
  const [copied, setCopied] = useState('')
  const [copiedAll, setCopiedAll] = useState(false)

  const generate = useCallback(() => {
    const results = Array.from({ length: count }, () => {
      let id = ''
      if (version === 4) id = uuidv4()
      else if (version === 1) id = uuidv1()
      else if (version === 'short') id = randomHex(8) + '-' + randomHex(4)
      else id = randomHex(3) + randomHex(2)
      if (uppercase) id = id.toUpperCase()
      if (noDash) id = id.replace(/-/g, '')
      return id
    })
    setUuids(results)
  }, [count, version, uppercase, noDash])

  const copy = (id: string, label: string) => {
    navigator.clipboard.writeText(id)
    setCopied(label)
    setTimeout(() => setCopied(''), 1500)
  }

  const copyAll = () => {
    navigator.clipboard.writeText(uuids.join('\n'))
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 1500)
  }

  const download = () => {
    const blob = new Blob([uuids.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'uuids.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">UUID Generator</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Generate cryptographically random UUIDs, short IDs, and nano IDs.
      </p>

      {/* Version */}
      <div className="flex rounded-xl bg-ink-100 dark:bg-ink-850 p-1 mb-4">
        {([4, 1, 'short', 'nano'] as const).map(v => (
          <button key={v} onClick={() => setVersion(v)}
            className={cn('flex-1 px-3 py-2 rounded-lg text-sm font-medium transition',
              version === v ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-300 shadow' : 'text-ink-600 dark:text-ink-300')}>
            {v === 4 ? 'v4 (Random)' : v === 1 ? 'v1 (Time)' : v === 'short' ? 'Short' : 'Nano'}
          </button>
        ))}
      </div>

      {/* Options */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="label">Count</label>
          <input type="number" className="input w-full" value={count}
            onChange={e => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))} min={1} max={100} />
        </div>
        <div className="flex items-end gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer pb-2">
            <input type="checkbox" checked={uppercase} onChange={e => setUppercase(e.target.checked)}
              className="w-4 h-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500" />
            <span className="text-xs">UPPER</span>
          </label>
        </div>
        <div className="flex items-end gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer pb-2">
            <input type="checkbox" checked={noDash} onChange={e => setNoDash(e.target.checked)}
              className="w-4 h-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500" />
            <span className="text-xs">No dashes</span>
          </label>
        </div>
      </div>

      {/* Generate */}
      <div className="flex gap-2 mb-4">
        <button onClick={generate} className="btn-primary px-4 py-2 text-sm rounded-lg flex items-center gap-1.5">
          <RefreshCw className="w-4 h-4" /> Generate
        </button>
        {uuids.length > 0 && (
          <>
            <button onClick={copyAll} className="btn-ghost px-3 py-2 text-sm rounded-lg flex items-center gap-1.5">
              {copiedAll ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              Copy All
            </button>
            <button onClick={download} className="btn-ghost px-3 py-2 text-sm rounded-lg flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Download
            </button>
          </>
        )}
      </div>

      {/* Results */}
      {uuids.length > 0 && (
        <div className="space-y-1.5">
          {uuids.map((id, i) => (
            <div key={i} className="card px-4 py-2.5 flex items-center justify-between">
              <code className="font-mono text-sm text-ink-700 dark:text-ink-200 break-all">{id}</code>
              <button onClick={() => copy(id, String(i))} className="p-1.5 rounded-lg text-ink-400 hover:text-brand-500 transition shrink-0 ml-2">
                {copied === String(i) ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

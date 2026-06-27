import { useState } from 'react'
import { Fingerprint, Copy, Upload } from 'lucide-react'
import { Segmented, Field, Spinner } from '@/components/ui'
import { Dropzone } from '@/components/Dropzone'
import { useToast } from '@/components/Toaster'
import { fileToArrayBuffer } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

const ALGOS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const
type Algo = typeof ALGOS[number]

async function hashBuffer(algo: Algo, buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest(algo, buf)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export default function HashGenerator() {
  const toast = useToast()
  const [tab, setTab] = useState<'text' | 'file'>('text')
  const [text, setText] = useState('')
  const [results, setResults] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [source, setSource] = useState('')

  const computeAll = async (buf: ArrayBuffer, label: string) => {
    setBusy(true)
    try {
      const entries = await Promise.all(ALGOS.map(async (a) => [a, await hashBuffer(a, buf)] as const))
      const out = Object.fromEntries(entries)
      setResults(out); setSource(label)
      trackUsage({ toolId: 'hash-generator', toolName: 'Hash Generator', action: 'Computed hashes' })
    } catch { toast.error('Hashing failed.') } finally { setBusy(false) }
  }

  const runText = () => computeAll(new TextEncoder().encode(text).buffer as ArrayBuffer, `text (${text.length} chars)`)
  const onFile = async (files: File[]) => computeAll(await fileToArrayBuffer(files[0]), files[0].name)

  return (
    <div className="grid gap-5">
      <Segmented value={tab} onChange={setTab} options={[{ value: 'text', label: 'Text' }, { value: 'file', label: 'File' }]} />
      {tab === 'text' ? (
        <div className="card p-5 grid gap-4">
          <Field label="Text to hash"><textarea value={text} onChange={(e) => setText(e.target.value)} className="input font-mono text-sm h-28 resize-y" placeholder="Type text…" /></Field>
          <button onClick={runText} disabled={busy} className="btn-primary btn-md w-fit">{busy ? <Spinner className="h-4 w-4" /> : <Fingerprint className="h-4 w-4" />} Generate hashes</button>
        </div>
      ) : (
        <Dropzone accept={['*/*']} onFiles={onFile} label="Drop a file to hash" icon={<Upload className="h-8 w-8" />} />
      )}
      {Object.keys(results).length > 0 && (
        <div className="card p-5 grid gap-3">
          <p className="text-sm text-ink-500">Source: <span className="font-medium text-ink-700 dark:text-ink-200">{source}</span></p>
          {ALGOS.map((a) => (
            <div key={a} className="grid gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-500">{a}</span>
                <button onClick={() => { navigator.clipboard.writeText(results[a]); toast.success(`${a} copied.`) }} className="shrink-0 grid h-11 w-11 place-items-center rounded-xl text-ink-400 hover:text-brand-500 hover:bg-brand-500/10 transition-colors focus-ring"><Copy className="h-4 w-4" /></button>
              </div>
              <code className="text-xs font-mono break-all bg-ink-100 dark:bg-ink-850 rounded-lg p-2.5">{results[a]}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

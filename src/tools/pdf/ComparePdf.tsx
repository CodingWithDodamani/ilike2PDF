import { useState } from 'react'
import { GitCompare } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { loadPdfDocument } from '@/lib/pdf'
import { fileToArrayBuffer } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'
import { cn } from '@/lib/utils'

interface Side { name: string; pages: number; words: number; text: string }

async function analyze(file: File): Promise<Side> {
  const buf = await fileToArrayBuffer(file)
  const doc = await loadPdfDocument(buf)
  let text = ''
  for (let i = 1; i <= doc.numPages; i++) {
    const c = await (await doc.getPage(i)).getTextContent()
    text += c.items.map((it) => ('str' in it ? it.str : '')).join(' ') + '\n'
  }
  return { name: file.name, pages: doc.numPages, words: text.trim().split(/\s+/).filter(Boolean).length, text }
}

export default function ComparePdf() {
  const toast = useToast()
  const [a, setA] = useState<Side | null>(null)
  const [b, setB] = useState<Side | null>(null)
  const [busy, setBusy] = useState(false)
  const [diff, setDiff] = useState<{ token: string; type: 'same' | 'add' | 'del' }[] | null>(null)

  const load = async (files: File[], side: 'a' | 'b') => {
    try {
      const s = await analyze(files[0])
      side === 'a' ? setA(s) : setB(s)
    } catch { toast.error('Could not read PDF.') }
  }

  const compare = () => {
    if (!a || !b) { toast.error('Add two PDFs to compare.'); return }
    setBusy(true)
    setTimeout(() => {
      const wordsA = a.text.split(/\s+/)
      const wordsB = b.text.split(/\s+/)
      setDiff(lcsDiff(wordsA, wordsB))
      setBusy(false)
      trackUsage({ toolId: 'compare-pdf', toolName: 'Compare PDF', action: 'Compared two PDFs' })
    }, 50)
  }

  return (
    <div className="grid gap-5">
      <div className="grid sm:grid-cols-2 gap-4">
        {[{ s: a, set: 'a' as const, label: 'Original' }, { s: b, set: 'b' as const, label: 'Changed' }].map(({ s, set, label }) => (
          <div key={set} className="card p-4">
            <p className="text-sm font-semibold mb-2">{label}</p>
            {s ? (
              <div className="text-sm">
                <p className="font-medium truncate">{s.name}</p>
                <p className="text-ink-500">{s.pages} pages · {s.words} words</p>
                <button onClick={() => (set === 'a' ? setA(null) : setB(null))} className="btn-ghost btn-sm mt-2">Change</button>
              </div>
            ) : (
              <Dropzone accept={['application/pdf']} compact onFiles={(f) => load(f, set)} label={`Drop ${label}`} icon={<GitCompare className="h-6 w-6" />} />
            )}
          </div>
        ))}
      </div>
      <button onClick={compare} disabled={busy || !a || !b} className="btn-primary btn-md w-fit">{busy ? <Spinner className="h-4 w-4" /> : <GitCompare className="h-4 w-4" />} Compare text</button>
      {diff && (
        <div className="card p-5">
          <div className="flex gap-4 text-sm mb-3">
            <span className="text-emerald-500">+ {diff.filter((d) => d.type === 'add').length} added</span>
            <span className="text-rose-500">− {diff.filter((d) => d.type === 'del').length} removed</span>
          </div>
          <p className="leading-7 text-sm max-h-[28rem] overflow-y-auto">
            {diff.map((d, i) => (
              <span key={i} className={cn(
                d.type === 'add' && 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
                d.type === 'del' && 'bg-rose-500/20 text-rose-700 dark:text-rose-300 line-through',
              )}>{d.token} </span>
            ))}
          </p>
        </div>
      )}
    </div>
  )
}

// Simple LCS-based word diff
function lcsDiff(a: string[], b: string[]) {
  const n = a.length, m = b.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const out: { token: string; type: 'same' | 'add' | 'del' }[] = []
  let i = 0, j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push({ token: a[i], type: 'same' }); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ token: a[i], type: 'del' }); i++ }
    else { out.push({ token: b[j], type: 'add' }); j++ }
  }
  while (i < n) out.push({ token: a[i++], type: 'del' })
  while (j < m) out.push({ token: b[j++], type: 'add' })
  return out
}

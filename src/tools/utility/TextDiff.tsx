import { useState, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import { diffChars, diffWords, diffLines } from 'diff'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

type DiffMode = 'chars' | 'words' | 'lines'

interface DiffPart {
  value: string
  added?: boolean
  removed?: boolean
}

export default function TextDiff() {
  const [text1, setText1] = useState('Hello World\nThis is a sample text.\nLine three here.')
  const [text2, setText2] = useState('Hello Earth\nThis is a sample text.\nLine three added.\nNew line here.')
  const [mode, setMode] = useState<DiffMode>('lines')
  const [copied, setCopied] = useState(false)

  const diffResult = useMemo(() => {
    if (!text1 && !text2) return []
    let diff: DiffPart[]
    switch (mode) {
      case 'chars': diff = diffChars(text1, text2); break
      case 'words': diff = diffWords(text1, text2); break
      case 'lines': diff = diffLines(text1, text2); break
    }
    return diff
  }, [text1, text2, mode])

  const stats = useMemo(() => {
    let added = 0, removed = 0, unchanged = 0
    for (const part of diffResult) {
      const lines = part.value.split('\n').length - 1 || 1
      if (part.added) added += lines
      else if (part.removed) removed += lines
      else unchanged += lines
    }
    return { added, removed, unchanged, total: added + removed + unchanged }
  }, [diffResult])

  const copy = () => {
    const text = diffResult.map(p => {
      if (p.added) return `+ ${p.value}`
      if (p.removed) return `- ${p.value}`
      return `  ${p.value}`
    }).join('')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Text Diff Checker</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Compare two texts side-by-side with character, word, or line-level diff.
      </p>

      {/* Mode */}
      <div className="flex rounded-xl bg-ink-100 dark:bg-ink-850 p-1 mb-4">
        {(['chars', 'words', 'lines'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={cn('flex-1 px-3 py-2 rounded-lg text-sm font-medium transition capitalize',
              mode === m ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-300 shadow' : 'text-ink-600 dark:text-ink-300')}>
            {m}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="label">Original Text</label>
          <textarea className="input w-full h-40 font-mono text-sm resize-y" value={text1}
            onChange={e => setText1(e.target.value)} spellCheck={false} placeholder="Paste original text..." />
        </div>
        <div>
          <label className="label">Modified Text</label>
          <textarea className="input w-full h-40 font-mono text-sm resize-y" value={text2}
            onChange={e => setText2(e.target.value)} spellCheck={false} placeholder="Paste modified text..." />
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        <span className="text-emerald-500 font-medium">+{stats.added} added</span>
        <span className="text-red-500 font-medium">-{stats.removed} removed</span>
        <span className="text-ink-400">{stats.unchanged} unchanged</span>
        <button onClick={copy} className="ml-auto btn-ghost px-3 py-1 text-xs rounded-lg flex items-center gap-1">
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          Copy Diff
        </button>
      </div>

      {/* Diff output */}
      <div className="card p-4 max-h-96 overflow-auto font-mono text-sm">
        {diffResult.length === 0 ? (
          <p className="text-ink-400 text-center py-4">No differences</p>
        ) : (
          <pre className="whitespace-pre-wrap">
            {diffResult.map((part, i) => (
              <span key={i} className={cn(
                part.added && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                part.removed && 'bg-red-500/10 text-red-600 dark:text-red-400 line-through'
              )}>
                {part.value}
              </span>
            ))}
          </pre>
        )}
      </div>
    </Section>
  )
}

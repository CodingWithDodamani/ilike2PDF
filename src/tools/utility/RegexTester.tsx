import { useState, useMemo } from 'react'
import { Copy, Check, AlertTriangle } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

export default function RegexTester() {
  const [pattern, setPattern] = useState('(\\w+)@(\\w+\\.\\w+)')
  const [flags, setFlags] = useState('gi')
  const [testString, setTestString] = useState('Contact us at hello@example.com or support@test.org for help.')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    try {
      const regex = new RegExp(pattern, flags)
      const matches: { match: string; groups: string[]; index: number }[] = []
      let m: RegExpExecArray | null
      if (flags.includes('g')) {
        while ((m = regex.exec(testString)) !== null) {
          matches.push({ match: m[0], groups: m.slice(1), index: m.index })
          if (m.index === regex.lastIndex) regex.lastIndex++
        }
      } else {
        m = regex.exec(testString)
        if (m) matches.push({ match: m[0], groups: m.slice(1), index: m.index })
      }
      return { error: null, matches, valid: true }
    } catch (e: any) {
      return { error: e.message, matches: [], valid: false }
    }
  }, [pattern, flags, testString])

  const highlighted = useMemo(() => {
    if (!result.valid || result.matches.length === 0) return testString
    const regex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g')
    return testString.replace(regex, (m) => `<mark class="bg-brand-500/20 text-brand-700 dark:text-brand-300 rounded px-0.5">${m}</mark>`)
  }, [testString, pattern, flags, result])

  const copyFlags = () => {
    navigator.clipboard.writeText(`/${pattern}/${flags}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Regex Tester</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Test regular expressions with live matching, highlighting, and group capture.
      </p>

      {/* Pattern */}
      <div className="mb-3">
        <label className="label">Pattern</label>
        <div className="flex items-center">
          <span className="text-ink-400 dark:text-ink-500 font-mono text-lg mr-1">/</span>
          <input type="text" className="input flex-1 font-mono" value={pattern}
            onChange={e => setPattern(e.target.value)} placeholder="regex pattern" />
          <span className="text-ink-400 dark:text-ink-500 font-mono text-lg mx-1">/</span>
          <input type="text" className="input w-20 font-mono" value={flags}
            onChange={e => setFlags(e.target.value)} placeholder="gi" />
        </div>
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {['g', 'i', 'm', 's', 'u'].map(f => (
          <button key={f} onClick={() => setFlags(prev => prev.includes(f) ? prev.replace(f, '') : prev + f)}
            className={cn('px-3 py-1 rounded-lg text-xs font-mono font-bold transition',
              flags.includes(f) ? 'bg-brand-500 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400')}>
            {f}
          </button>
        ))}
        <button onClick={copyFlags} className="btn-ghost px-3 py-1 text-xs rounded-lg ml-auto flex items-center gap-1">
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          /{pattern}/{flags}
        </button>
      </div>

      {/* Error */}
      {result.error && (
        <div className="rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 text-sm mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {result.error}
        </div>
      )}

      {/* Test string */}
      <div className="mb-4">
        <label className="label">Test String</label>
        <textarea className="input w-full h-28 font-mono text-sm resize-y" value={testString}
          onChange={e => setTestString(e.target.value)} spellCheck={false} />
      </div>

      {/* Highlighted result */}
      <div className="mb-4">
        <label className="label">Highlighted Matches</label>
        <div className="card p-4 font-mono text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: highlighted }} />
      </div>

      {/* Matches */}
      {result.matches.length > 0 && (
        <div>
          <label className="label">Matches ({result.matches.length})</label>
          <div className="space-y-2">
            {result.matches.map((m, i) => (
              <div key={i} className="card p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-ink-400">Match {i + 1} at index {m.index}</span>
                  <code className="text-sm font-mono font-bold text-brand-600 dark:text-brand-300">{m.match}</code>
                </div>
                {m.groups.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {m.groups.map((g, j) => (
                      <span key={j} className="text-xs bg-ink-100 dark:bg-ink-800 px-2 py-0.5 rounded font-mono">
                        Group {j + 1}: {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick patterns */}
      <div className="mt-4">
        <p className="label mb-2">Quick Patterns</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            { name: 'Email', p: '[\\w.-]+@[\\w.-]+\\.\\w+' },
            { name: 'URL', p: 'https?://[\\w.-]+[\\w/.?&=-]*' },
            { name: 'IP', p: '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}' },
            { name: 'Phone', p: '\\+?\\d[\\d\\s()-]{7,}' },
            { name: 'Date', p: '\\d{4}-\\d{2}-\\d{2}' },
            { name: 'Hex Color', p: '#[0-9a-fA-F]{6}' },
          ].map(qp => (
            <button key={qp.name} onClick={() => { setPattern(qp.p); setFlags('gi') }}
              className="px-2.5 py-1 rounded-lg text-xs bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700 transition">
              {qp.name}
            </button>
          ))}
        </div>
      </div>
    </Section>
  )
}

import { useState, useCallback } from 'react'
import { Copy, Check, RefreshCw, Download } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

const WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'perspiciatis', 'unde',
  'omnis', 'iste', 'natus', 'error', 'voluptatem', 'accusantium', 'doloremque',
  'laudantium', 'totam', 'rem', 'aperiam', 'eaque', 'ipsa', 'quae', 'ab', 'illo',
  'inventore', 'veritatis', 'quasi', 'architecto', 'beatae', 'vitae', 'dicta',
  'explicabo', 'nemo', 'ipsam', 'quia', 'voluptas', 'aspernatur', 'aut', 'odit',
  'fugit', 'consequuntur', 'magni', 'dolores', 'ratione', 'sequi', 'nesciunt',
  'neque', 'porro', 'quisquam', 'nihil', 'impedit', 'quo', 'minus', 'maxime',
  'placeat', 'facere', 'possimus', 'omnis', 'assumenda', 'repellendus', 'temporibus',
  'autem', 'quibusdam', 'officiis', 'debitis', 'necessitatibus', 'saepe', 'eveniet',
  'voluptates', 'repudiandae', 'incidunt', 'laboriosam', 'ratione', 'aliquid',
  'recusandae', 'ipsum', 'quidem', 'perspiciatis', 'alias', 'accusamus', 'harum',
]

function randomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)]
}

function generateSentence(minWords = 8, maxWords = 20): string {
  const len = minWords + Math.floor(Math.random() * (maxWords - minWords))
  const words = Array.from({ length: len }, randomWord)
  words[0] = words[0][0].toUpperCase() + words[0].slice(1)
  return words.join(' ') + '.'
}

function generateParagraph(): string {
  const sCount = 3 + Math.floor(Math.random() * 4)
  return Array.from({ length: sCount }, () => generateSentence()).join(' ')
}

export default function LoremIpsum() {
  const [paragraphs, setParagraphs] = useState(3)
  const [wordsPerParagraph, setWordsPerParagraph] = useState(50)
  const [includeHTML, setIncludeHTML] = useState(false)
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs')

  const generate = useCallback(() => {
    let result = ''
    if (mode === 'paragraphs') {
      const ps = Array.from({ length: paragraphs }, () => {
        if (includeHTML) return `<p>${generateParagraph()}</p>`
        return generateParagraph()
      })
      result = ps.join(includeHTML ? '\n' : '\n\n')
    } else if (mode === 'sentences') {
      result = Array.from({ length: paragraphs }, () => generateSentence()).join(' ')
    } else {
      const words = Array.from({ length: wordsPerParagraph }, randomWord)
      result = words.join(' ')
    }
    setText(result)
  }, [paragraphs, wordsPerParagraph, includeHTML, mode])

  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const download = () => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'lorem-ipsum.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length
  const charCount = text.length

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Lorem Ipsum Generator</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Generate placeholder text for designs and layouts. Copy or download.
      </p>

      {/* Mode */}
      <div className="flex rounded-xl bg-ink-100 dark:bg-ink-850 p-1 mb-4">
        {(['paragraphs', 'sentences', 'words'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition capitalize',
              mode === m ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-300 shadow' : 'text-ink-600 dark:text-ink-300'
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="label">{mode === 'words' ? 'Words' : 'Count'}</label>
          <input type="number" className="input w-full" value={mode === 'words' ? wordsPerParagraph : paragraphs}
            onChange={e => mode === 'words' ? setWordsPerParagraph(parseInt(e.target.value) || 10) : setParagraphs(parseInt(e.target.value) || 1)}
            min={1} max={100} />
        </div>
        {mode === 'paragraphs' && (
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input type="checkbox" checked={includeHTML} onChange={e => setIncludeHTML(e.target.checked)}
                className="w-4 h-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500" />
              <span className="text-sm">Wrap in &lt;p&gt;</span>
            </label>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <button onClick={generate} className="btn-primary px-4 py-2 text-sm rounded-lg flex items-center gap-1.5">
          <RefreshCw className="w-4 h-4" /> Generate
        </button>
        <button onClick={copy} disabled={!text} className="btn-ghost px-3 py-2 text-sm rounded-lg flex items-center gap-1.5 disabled:opacity-40">
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button onClick={download} disabled={!text} className="btn-ghost px-3 py-2 text-sm rounded-lg flex items-center gap-1.5 disabled:opacity-40">
          <Download className="w-4 h-4" /> Download
        </button>
      </div>

      {/* Output */}
      {text && (
        <>
          <div className="text-xs text-ink-400 dark:text-ink-500 mb-2">
            {wordCount.toLocaleString()} words · {charCount.toLocaleString()} characters
          </div>
          <div className="card p-4 max-h-80 overflow-auto">
            <pre className="text-sm text-ink-700 dark:text-ink-200 whitespace-pre-wrap font-sans leading-relaxed">{text}</pre>
          </div>
        </>
      )}
    </Section>
  )
}

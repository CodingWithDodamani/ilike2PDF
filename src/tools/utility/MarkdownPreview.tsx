import { useState, useMemo } from 'react'
import { Eye, Code2, Copy, Check } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'

const SAMPLE = `# Hello World

## Features

- **Bold text** and *italic text*
- \`inline code\` and code blocks
- [Links](https://example.com)
- Images, tables, and more

### Code Block

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### Table

| Feature | Status |
|---------|--------|
| PDF Tools | ✅ Done |
| Image Tools | ✅ Done |
| QR Tools | ✅ Done |

### Blockquote

> "The best way to predict the future is to invent it."
> — Alan Kay

---

### Lists

1. First item
2. Second item
3. Third item

- Unordered item
- Another item
- Last item
`

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function mdToHtml(md: string): string {
  let html = escapeHtml(md)
  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  // Headers
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
  // Bold & italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // Links & images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  // HR
  html = html.replace(/^---+$/gm, '<hr />')
  // Blockquote
  html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>')
  // Tables
  html = html.replace(/^\|(.+)\|$/gm, (match, content) => {
    const cells = content.split('|').map((c: string) => c.trim())
    if (cells.every((c: string) => /^[-:]+$/.test(c))) return ''
    const tag = 'td'
    return '<tr>' + cells.map((c: string) => `<${tag}>${c}</${tag}>`).join('') + '</tr>'
  })
  html = html.replace(/(<tr>[\s\S]*?<\/tr>)/g, '<table>$1</table>')
  // Remove duplicate table tags
  html = html.replace(/<\/table>\s*<table>/g, '')
  // Lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<li>$2</li>')
  // Paragraphs
  html = html.replace(/\n\n+/g, '</p><p>')
  html = '<p>' + html + '</p>'
  html = html.replace(/<p>\s*<(h[1-6]|pre|table|blockquote|hr|ul|ol)/g, '<$1')
  html = html.replace(/<\/(h[1-6]|pre|table|blockquote|hr|ul|ol)>\s*<\/p>/g, '</$1>')
  html = html.replace(/<p>\s*<\/p>/g, '')
  return html
}

export default function MarkdownPreview() {
  const [input, setInput] = useState(SAMPLE)
  const [view, setView] = useState<'preview' | 'split'>('split')
  const [copied, setCopied] = useState(false)

  const html = useMemo(() => mdToHtml(input), [input])

  const copy = () => {
    navigator.clipboard.writeText(html)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Markdown Preview</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Write GitHub-flavored Markdown with live preview. Export as HTML.
      </p>

      {/* Controls */}
      <div className="flex gap-2 mb-3">
        <div className="flex rounded-xl bg-ink-100 dark:bg-ink-850 p-1">
          {(['split', 'preview'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition capitalize',
                view === v ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-300 shadow' : 'text-ink-600 dark:text-ink-300')}>
              {v === 'split' ? <Code2 className="w-4 h-4 inline mr-1" /> : <Eye className="w-4 h-4 inline mr-1" />}
              {v}
            </button>
          ))}
        </div>
        <button onClick={copy} className="btn-ghost px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 ml-auto">
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          Copy HTML
        </button>
      </div>

      <div className={cn('grid gap-3', view === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
        <div>
          <label className="label">Markdown</label>
          <textarea className="input w-full h-96 font-mono text-sm resize-y" value={input}
            onChange={e => setInput(e.target.value)} spellCheck={false} />
        </div>
        <div>
          <label className="label">Preview</label>
          <div className="card p-4 h-96 overflow-auto prose prose-sm dark:prose-invert max-w-none
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2
            [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_a]:text-brand-500 [&_a]:underline
            [&_code]:bg-ink-100 [&_dark_:code]:bg-ink-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
            [&_pre]:bg-ink-900 [&_pre]:text-ink-100 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:mb-3
            [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit
            [&_blockquote]:border-l-4 [&_blockquote]:border-brand-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-ink-500 [&_blockquote]:mb-3
            [&_hr]:border-ink-200 [&_dark_hr]:border-ink-700 [&_hr]:my-4
            [&_table]:w-full [&_table]:text-sm [&_th]:text-left [&_th]:font-medium [&_th]:py-2 [&_th]:border-b [&_td]:py-2 [&_td]:border-b
            [&_li]:ml-4 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:mb-1
            [&_img]:max-w-full [&_img]:rounded-xl"
            dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </Section>
  )
}

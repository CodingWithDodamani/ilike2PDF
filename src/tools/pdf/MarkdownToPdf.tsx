import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FileCode2, Printer } from 'lucide-react'
import { Segmented } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { trackUsage } from '@/lib/storage'

const SAMPLE = `# iLike2PDF Document

Write **Markdown** on the left and see a live preview on the right.

## Features
- GitHub-flavored Markdown
- Tables, code blocks, task lists
- Export to PDF via your browser

| Tool | Status |
| ---- | ------ |
| Merge | ✅ |
| Split | ✅ |

\`\`\`js
console.log('Hello, iLike2PDF!')
\`\`\`

> Everything runs locally in your browser.
`

function MarkdownRender({ md }: { md: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
}

export default function MarkdownToPdf() {
  const toast = useToast()
  const [md, setMd] = useState(SAMPLE)
  const [view, setView] = useState<'split' | 'editor' | 'preview'>('split')
  const previewRef = useRef<HTMLDivElement>(null)

  const exportPdf = () => {
    const w = window.open('', '_blank')
    if (!w) { toast.error('Allow pop-ups to export PDF.'); return }
    const previewEl = previewRef.current
    if (!previewEl) return
    const html = previewEl.innerHTML
    w.document.write(`<!doctype html><html><head><title>iLike2PDF Document</title>
      <style>
        body{font-family:Inter,system-ui,sans-serif;max-width:780px;margin:40px auto;padding:0 24px;line-height:1.65;color:#111}
        h1,h2,h3{line-height:1.25}h1{border-bottom:2px solid #eee;padding-bottom:.3em}
        code{background:#f4f4f8;padding:2px 5px;border-radius:4px;font-family:monospace}
        pre{background:#0b0b14;color:#eee;padding:16px;border-radius:8px;overflow:auto}
        pre code{background:none;color:inherit}
        table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}th{background:#f7f7fb}
        blockquote{border-left:4px solid #7c3aed;margin:0;padding:.5em 1em;color:#555;background:#faf8ff}
        img{max-width:100%}a{color:#7c3aed}
      </style></head><body>${html}<script>window.onload=()=>{window.print()}</script></body></html>`)
    w.document.close()
    trackUsage({ toolId: 'markdown-to-pdf', toolName: 'Markdown to PDF', action: 'Exported PDF' })
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Segmented value={view} onChange={setView} options={[{ value: 'editor', label: 'Editor' }, { value: 'split', label: 'Split' }, { value: 'preview', label: 'Preview' }]} />
        <button onClick={exportPdf} className="btn-primary btn-sm"><Printer className="h-4 w-4" /> Export PDF</button>
      </div>
      <div className={view === 'split' ? 'grid lg:grid-cols-2 gap-4' : 'grid'}>
        {view !== 'preview' && (
          <textarea value={md} onChange={(e) => setMd(e.target.value)} className="input font-mono text-sm min-h-[20rem] h-[24rem] lg:h-[32rem] resize-y" aria-label="Markdown editor" placeholder="# Write markdown…" />
        )}
        {view !== 'editor' && (
          <div ref={previewRef} className="card p-6 min-h-[20rem] h-[24rem] lg:h-[32rem] overflow-y-auto prose-snap dark:prose-invert">
            <MarkdownRender md={md} />
          </div>
        )}
      </div>
      <p className="text-xs text-ink-500 flex items-center gap-1"><FileCode2 className="h-3.5 w-3.5" /> Export opens a print dialog — choose "Save as PDF". Fully offline, no server.</p>
    </div>
  )
}

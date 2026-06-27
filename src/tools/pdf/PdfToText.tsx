import { useState } from 'react'
import { FileType2, Download, Copy } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Progress } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { loadPdfDocument } from '@/lib/pdf'
import { baseName, downloadBlob, fileToArrayBuffer } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

export default function PdfToText() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)

  const onFile = async (files: File[]) => {
    const f = files[0]
    setFile(f); setBusy(true); setText(''); setProgress(0)
    try {
      const buf = await fileToArrayBuffer(f)
      const doc = await loadPdfDocument(buf)
      let all = ''
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map((it) => ('str' in it ? it.str : '')).join(' ')
        all += `\n\n----- Page ${i} -----\n${pageText.trim()}`
        setProgress(Math.round((i / doc.numPages) * 100))
      }
      setText(all.trim())
      trackUsage({ toolId: 'pdf-to-text', toolName: 'PDF to Text', action: 'Extracted text', fileName: f.name, inputSize: f.size })
      if (!all.trim()) toast.info('No selectable text found — this PDF may be a scanned image.')
      else toast.success('Text extracted.')
    } catch { toast.error('Could not extract text (PDF may be encrypted).') } finally { setBusy(false); setProgress(0) }
  }

  return (
    <div className="grid gap-5">
      <Dropzone accept={['application/pdf']} onFiles={onFile} label="Drop a PDF to extract text" icon={<FileType2 className="h-8 w-8" />} />
      {busy && <Progress value={progress} />}
      {file && !busy && (
        <div className="card p-5 grid gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-medium">{file.name} · {text.length.toLocaleString()} chars</p>
            <div className="flex gap-2">
              <button onClick={() => { navigator.clipboard.writeText(text); toast.success('Copied to clipboard.') }} className="btn-secondary btn-sm"><Copy className="h-4 w-4" /> Copy</button>
              <button onClick={() => downloadBlob(new Blob([text], { type: 'text/plain' }), `${baseName(file.name)}.txt`)} className="btn-primary btn-sm"><Download className="h-4 w-4" /> Download .txt</button>
            </div>
          </div>
          <textarea readOnly value={text} className="input font-mono text-xs h-80 resize-y" aria-label="Extracted text" />
        </div>
      )}
    </div>
  )
}

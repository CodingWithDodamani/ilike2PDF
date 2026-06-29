import { useState } from 'react'
import { FileText, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Section, Spinner, Progress } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { loadPdfDocument } from '@/lib/pdf'
import { baseName, downloadBlob, fileToArrayBuffer } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

export default function PdfToWord() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState<{ pages: number; chars: number } | null>(null)
  const [preview, setPreview] = useState('')

  const onFile = async (files: File[]) => {
    const f = files[0]
    setFile(f)
    setBusy(true)
    setStats(null)
    setPreview('')
    setProgress(0)
    try {
      const buf = await fileToArrayBuffer(f)
      const doc = await loadPdfDocument(buf)
      let allText = ''
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map((it) => ('str' in it ? it.str : '')).join(' ')
        allText += pageText
        setProgress(Math.round((i / doc.numPages) * 100))
      }
      setStats({ pages: doc.numPages, chars: allText.length })
      const previewLines = allText.slice(0, 600).trim()
      setPreview(previewLines || 'No selectable text found — this PDF may contain scanned images.')
      trackUsage({ toolId: 'pdf-to-word', toolName: 'PDF to Word', action: 'Loaded PDF', fileName: f.name, inputSize: f.size })
    } catch {
      toast.error('Could not read PDF (it may be encrypted).')
    } finally {
      setBusy(false)
      setProgress(0)
    }
  }

  const convert = async () => {
    if (!file) return
    setBusy(true)
    setProgress(0)
    try {
      const buf = await fileToArrayBuffer(file)
      const doc = await loadPdfDocument(buf)
      const sections: { children: Paragraph[] }[] = []
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const content = await page.getTextContent()
        const paragraphs: Paragraph[] = []
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: `Page ${i}`, bold: true })],
            heading: HeadingLevel.HEADING_2,
          })
        )
        for (const item of content.items) {
          if (!('str' in item) || !item.str.trim()) continue
          const fontName = item.fontName || ''
          const isBold = /bold/i.test(fontName)
          const isItalic = /italic|oblique/i.test(fontName)
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: item.str, bold: isBold, italics: isItalic })] }))
        }
        sections.push({ children: paragraphs })
        setProgress(Math.round((i / doc.numPages) * 100))
      }
      const docxDoc = new Document({ sections })
      const blob = await Packer.toBlob(docxDoc)
      downloadBlob(blob, `${baseName(file.name)}.docx`)
      trackUsage({ toolId: 'pdf-to-word', toolName: 'PDF to Word', action: `Converted ${doc.numPages} pages`, fileName: file.name, inputSize: file.size, outputSize: blob.size })
      toast.success(`Downloaded ${baseName(file.name)}.docx`)
    } catch {
      toast.error('Conversion failed. Please try again.')
    } finally {
      setBusy(false)
      setProgress(0)
    }
  }

  if (!file) {
    return (
      <Section>
        <h2 className="text-lg font-semibold mb-1">PDF to Word</h2>
        <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">Convert PDF to editable Word documents.</p>
        <Dropzone accept={['application/pdf']} onFiles={onFile} label="Drop a PDF to convert to Word" icon={<FileText className="h-8 w-8" />} />
      </Section>
    )
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">PDF to Word</h2>
      <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">Convert PDF to editable Word documents.</p>
      {busy && <Progress value={progress} />}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-medium">{file.name}</p>
          <button onClick={() => { setFile(null); setStats(null); setPreview('') }} className="btn-ghost btn-sm">
            Change file
          </button>
        </div>
        {stats && (
          <div className="flex gap-4 text-xs text-ink-500 dark:text-ink-400">
            <span>{stats.pages} pages</span>
            <span>{stats.chars.toLocaleString()} characters</span>
          </div>
        )}
        {preview && (
          <div className="rounded-xl bg-ink-50 dark:bg-ink-900 p-3 text-xs text-ink-600 dark:text-ink-300 max-h-32 overflow-y-auto whitespace-pre-wrap font-mono">
            {preview}
          </div>
        )}
        <button onClick={convert} disabled={busy || !stats} className="btn-primary btn-md w-fit">
          {busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Convert to Word
        </button>
      </div>
    </Section>
  )
}

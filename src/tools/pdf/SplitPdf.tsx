import { useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'
import { Scissors, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { PdfPageGrid } from '@/components/PdfPageGrid'
import { Spinner, Field, Segmented } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { baseName, downloadBlob, bytesToBlob, fileToArrayBuffer, parsePageRanges } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

export default function SplitPdf() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<ArrayBuffer | null>(null)
  const [count, setCount] = useState(0)
  const [mode, setMode] = useState<'select' | 'range' | 'each'>('select')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [rangeStr, setRangeStr] = useState('')
  const [busy, setBusy] = useState(false)

  const onFile = async (files: File[]) => {
    const f = files[0]
    try {
      const buf = await fileToArrayBuffer(f)
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
      setFile(f); setData(buf); setCount(doc.getPageCount()); setSelected(new Set())
    } catch {
      toast.error('Could not read this PDF. It may be encrypted or corrupt.')
    }
  }

  const toggle = (p: number) => setSelected((s) => { const n = new Set(s); n.has(p) ? n.delete(p) : n.add(p); return n })

  const run = async () => {
    if (!file || !data) return
    let indices: number[] = []
    if (mode === 'select') indices = [...selected].sort((a, b) => a - b)
    else if (mode === 'range') indices = parsePageRanges(rangeStr, count)
    if (mode !== 'each' && indices.length === 0) { toast.error('Select at least one page.'); return }
    setBusy(true)
    try {
      const src = await PDFDocument.load(data, { ignoreEncryption: true })
      const name = baseName(file.name)
      if (mode === 'each') {
        const zip = new JSZip()
        for (let i = 0; i < count; i++) {
          const out = await PDFDocument.create()
          const [pg] = await out.copyPages(src, [i])
          out.addPage(pg)
          zip.file(`${name}-page-${i + 1}.pdf`, await out.save())
        }
        const blob = await zip.generateAsync({ type: 'blob' })
        downloadBlob(blob, `${name}-pages.zip`)
      } else {
        const out = await PDFDocument.create()
        const pages = await out.copyPages(src, indices)
        pages.forEach((p) => out.addPage(p))
        const bytes = await out.save()
        downloadBlob(bytesToBlob(bytes, 'application/pdf'), `${name}-split.pdf`)
      }
      trackUsage({ toolId: 'split-pdf', toolName: 'Split PDF', action: `Split (${mode})`, fileName: file.name, inputSize: file.size })
      toast.success('Done! Your download is ready.')
    } catch {
      toast.error('Split failed.')
    } finally { setBusy(false) }
  }

  if (!file || !data) {
    return <Dropzone accept={['application/pdf']} onFiles={onFile} label="Drop a PDF to split" icon={<Scissors className="h-8 w-8" />} />
  }

  return (
    <div className="grid gap-5">
      <div className="card p-5 grid gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm font-medium">{file.name} · {count} pages</p>
          <button onClick={() => { setFile(null); setData(null) }} className="btn-ghost btn-sm">Change file</button>
        </div>
        <Field label="Mode">
          <Segmented value={mode} onChange={setMode} options={[
            { value: 'select', label: 'Select pages' },
            { value: 'range', label: 'Range' },
            { value: 'each', label: 'Every page' },
          ]} />
        </Field>
        {mode === 'range' && (
          <Field label="Page ranges" hint="e.g. 1-3, 5, 8-10">
            <input value={rangeStr} onChange={(e) => setRangeStr(e.target.value)} placeholder="1-3, 5, 8-10" className="input" />
          </Field>
        )}
        <button onClick={run} disabled={busy || (mode === 'select' && selected.size === 0) || (mode === 'range' && !rangeStr.trim())} className="btn-primary btn-md w-fit">
          {busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Split & download
        </button>
      </div>
      {mode === 'select' && (
        <div className="card p-5">
          <p className="text-sm font-medium mb-3">Select pages to extract ({selected.size} selected)</p>
          <PdfPageGrid data={data} pageCount={count} selectable selected={selected} onToggle={toggle} />
        </div>
      )}
    </div>
  )
}

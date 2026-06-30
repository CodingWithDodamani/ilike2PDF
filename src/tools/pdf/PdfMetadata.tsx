import { useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import { FileCog, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { baseName, downloadBlob, bytesToBlob, fileToArrayBuffer } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

interface Meta { title: string; author: string; subject: string; keywords: string; creator: string; producer: string }

export default function PdfMetadata() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<ArrayBuffer | null>(null)
  const [meta, setMeta] = useState<Meta>({ title: '', author: '', subject: '', keywords: '', creator: '', producer: '' })
  const [busy, setBusy] = useState(false)

  const onFile = async (files: File[]) => {
    const f = files[0]
    try {
      const buf = await fileToArrayBuffer(f)
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
      setMeta({
        title: doc.getTitle() ?? '', author: doc.getAuthor() ?? '', subject: doc.getSubject() ?? '',
        keywords: (() => { const kw = doc.getKeywords(); return Array.isArray(kw) ? kw.join(', ') : (kw ?? '') })(), creator: doc.getCreator() ?? '', producer: doc.getProducer() ?? '',
      })
      setFile(f); setData(buf)
    } catch { toast.error('Could not read PDF.') }
  }

  const save = async () => {
    if (!file || !data) return
    setBusy(true)
    try {
      const doc = await PDFDocument.load(data, { ignoreEncryption: true })
      doc.setTitle(meta.title); doc.setAuthor(meta.author); doc.setSubject(meta.subject)
      doc.setKeywords(meta.keywords.split(',').map((k) => k.trim()).filter(Boolean))
      doc.setCreator(meta.creator || 'iLike2PDF'); doc.setProducer(meta.producer || 'iLike2PDF')
      const bytes = await doc.save()
      downloadBlob(bytesToBlob(bytes, 'application/pdf'), `${baseName(file.name)}-metadata.pdf`)
      trackUsage({ toolId: 'pdf-metadata', toolName: 'PDF Metadata', action: 'Edited metadata', fileName: file.name, inputSize: file.size })
      toast.success('Metadata saved.')
    } catch { toast.error('Save failed.') } finally { setBusy(false) }
  }

  if (!file || !data) {
    return <Dropzone accept={['application/pdf']} onFiles={onFile} label="Drop a PDF to edit properties" icon={<FileCog className="h-8 w-8" />} />
  }

  const fields: [keyof Meta, string][] = [['title', 'Title'], ['author', 'Author'], ['subject', 'Subject'], ['keywords', 'Keywords (comma separated)'], ['creator', 'Creator'], ['producer', 'Producer']]

  return (
    <div className="card p-5 grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{file.name}</p>
        <button onClick={() => { setFile(null); setData(null) }} className="btn-ghost btn-sm">Change file</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map(([key, label]) => (
          <Field key={key} label={label}>
            <input value={meta[key]} onChange={(e) => setMeta((m) => ({ ...m, [key]: e.target.value }))} className="input" />
          </Field>
        ))}
      </div>
      <button onClick={save} disabled={busy} className="btn-primary btn-md w-fit">{busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Save metadata</button>
    </div>
  )
}
